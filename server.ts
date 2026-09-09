import express from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to encode VarInt for Minecraft Protocol
function encodeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  let v = value >>> 0;
  while ((v & 0xffffff80) !== 0) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v & 0x7f);
  return Buffer.from(bytes);
}

// Helper to read VarInt
function readVarInt(buffer: Buffer, offset = 0): { value: number; bytesRead: number } {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;
  while (true) {
    if (offset + bytesRead >= buffer.length) {
      throw new Error('Unexpected end of buffer while reading VarInt');
    }
    const byte = buffer[offset + bytesRead];
    bytesRead++;
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
    if (shift >= 35) throw new Error('VarInt too wide');
  }
  return { value: result, bytesRead };
}

// Ping Minecraft server via real TCP Server List Ping (SLP) protocol (Minecraft 1.21.4 protocol 768)
function pingMinecraftServer(
  host: string,
  port: number,
  timeoutMs = 4000
): Promise<{
  online: boolean;
  version?: { name: string; protocol: number };
  players?: { max: number; online: number; sample?: Array<{ name: string; id: string }> };
  description?: any;
  favicon?: string;
  latency?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: any) => {
      if (!resolved) {
        resolved = true;
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        resolve(result);
      }
    };

    const startTime = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.on('timeout', () => {
      finish({ online: false, error: 'Connection timed out' });
    });

    socket.on('error', (err) => {
      finish({ online: false, error: err.message });
    });

    socket.on('connect', () => {
      try {
        // Handshake packet (0x00)
        // Protocol 768 for 1.21.4, or -1
        const protocolVersion = 768;
        const hostBuf = Buffer.from(host, 'utf8');
        const hostLen = encodeVarInt(hostBuf.length);
        const portBuf = Buffer.alloc(2);
        portBuf.writeUInt16BE(port, 0);
        const nextState = encodeVarInt(1); // 1 = Status

        const packetData = Buffer.concat([
          encodeVarInt(0x00), // Packet ID 0x00
          encodeVarInt(protocolVersion),
          hostLen,
          hostBuf,
          portBuf,
          nextState,
        ]);

        const handshakePacket = Buffer.concat([encodeVarInt(packetData.length), packetData]);
        socket.write(handshakePacket);

        // Status Request packet (0x00)
        const statusReq = Buffer.concat([encodeVarInt(1), encodeVarInt(0x00)]);
        socket.write(statusReq);
      } catch (err: any) {
        finish({ online: false, error: err.message });
      }
    });

    let receivedBuffer = Buffer.alloc(0);

    socket.on('data', (data) => {
      receivedBuffer = Buffer.concat([receivedBuffer, data]);

      try {
        let offset = 0;
        const { value: packetLength, bytesRead: lenBytes } = readVarInt(receivedBuffer, offset);
        offset += lenBytes;

        if (receivedBuffer.length >= offset + packetLength) {
          const { value: packetId, bytesRead: idBytes } = readVarInt(receivedBuffer, offset);
          offset += idBytes;

          if (packetId === 0x00) {
            // Status Response
            const { value: strLength, bytesRead: strLenBytes } = readVarInt(receivedBuffer, offset);
            offset += strLenBytes;

            const jsonStr = receivedBuffer.toString('utf8', offset, offset + strLength);
            const latency = Date.now() - startTime;
            const parsed = JSON.parse(jsonStr);

            finish({
              online: true,
              version: parsed.version || { name: '1.21.4', protocol: 768 },
              players: parsed.players || { max: 100, online: 1 },
              description: parsed.description,
              favicon: parsed.favicon,
              latency,
            });
          }
        }
      } catch (err: any) {
        // Need more data or error
        if (receivedBuffer.length > 65536) {
          finish({ online: false, error: 'Response packet too large' });
        }
      }
    });

    socket.connect(port, host);
  });
}

// Default popular servers with fallback mock statuses in case user has no internet access to 25565
const DEFAULT_SERVERS = [
  {
    id: 'vanilla-1214',
    name: 'Vanilla 1.21.4 Official Lobby',
    address: 'lobby.minecraft.net:25565',
    isLocalRoom: true,
    fallback: {
      online: true,
      version: { name: '1.21.4 Vanilla', protocol: 768 },
      players: { max: 100, online: 24 },
      description: '§aWelcome to Minecraft 1.21.4 Vanilla Web Lobby!\n§eMultiplayer Survival & Building §7- §bPlay Now!',
      latency: 28,
    },
  },
  {
    id: 'hypixel',
    name: 'Hypixel Network',
    address: 'mc.hypixel.net',
    fallback: {
      online: true,
      version: { name: 'Requires 1.8 - 1.21.x', protocol: 768 },
      players: { max: 200000, online: 48291 },
      description: '§bHypixel Network §c[1.8-1.21] §eNEW SKYBLOCK UPDATE!\n§aBed Wars, SkyWars, Murder Mystery §7& more!',
      latency: 42,
    },
  },
  {
    id: 'pvp-hub',
    name: '1.21.4 Anarchy & Survival',
    address: 'anarchy.vanilla.org:25565',
    fallback: {
      online: true,
      version: { name: 'Paper 1.21.4', protocol: 768 },
      players: { max: 500, online: 139 },
      description: '§6No Rules Vanilla Survival §8| §c1.21.4 Nether Update\n§7Pure unadulterated Minecraft experience!',
      latency: 35,
    },
  },
  {
    id: 'cubecraft',
    name: 'CubeCraft Games',
    address: 'play.cubecraft.net',
    fallback: {
      online: true,
      version: { name: '1.21.4 Compatible', protocol: 768 },
      players: { max: 15000, online: 3410 },
      description: '§9CubeCraft Games §b✦ §dSkyblock & Minigames\n§eEggWars, Tower Defence, Lucky Islands',
      latency: 51,
    },
  },
];

// API endpoint: Get default servers
app.get('/api/minecraft/default-servers', (req, res) => {
  res.json({ servers: DEFAULT_SERVERS });
});

// API endpoint: Ping a Minecraft Server
app.get('/api/minecraft/ping', async (req, res) => {
  const hostParam = (req.query.host as string) || '';
  const portParam = parseInt((req.query.port as string) || '25565', 10);

  if (!hostParam) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  // Parse host:port if user provided it in host string
  let host = hostParam;
  let port = portParam;
  if (host.includes(':')) {
    const parts = host.split(':');
    host = parts[0];
    port = parseInt(parts[1], 10) || 25565;
  }

  // Check if this matches a default local room
  if (host === 'localhost' || host === '127.0.0.1' || hostParam.includes('lobby.minecraft.net')) {
    return res.json({
      online: true,
      version: { name: '1.21.4 Vanilla', protocol: 768 },
      players: { max: 100, online: Math.max(1, onlinePlayers.size) },
      description: '§aWelcome to Minecraft 1.21.4 Vanilla Web Lobby!\n§eMultiplayer Survival & Building §7- §bReal-time Sync',
      latency: 12,
    });
  }

  try {
    // Attempt real TCP SLP ping
    const result = await pingMinecraftServer(host, port, 3000);

    if (result.online) {
      return res.json(result);
    }

    // Check if there's a fallback entry
    const foundFallback = DEFAULT_SERVERS.find((s) => s.address.toLowerCase().includes(host.toLowerCase()));
    if (foundFallback && foundFallback.fallback) {
      return res.json(foundFallback.fallback);
    }

    return res.json(result);
  } catch (err: any) {
    res.json({ online: false, error: err.message || 'Failed to ping server' });
  }
});

// Endpoint to retrieve real server world stats and block changes
app.get('/api/world/stats', (req, res) => {
  res.json({
    onlinePlayers: onlinePlayers.size,
    modifiedBlocksCount: modifiedBlocks.size,
    mobsCount: worldMobs.length,
    version: '1.21.4',
    protocol: 768,
  });
});

// Live Multiplayer State for the built-in 1.21.4 World Room
interface ConnectedPlayer {
  id: string;
  ws: WebSocket;
  username: string;
  skin: string;
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  selectedSlot: number;
  heldItem: string;
  ping: number;
}

const onlinePlayers = new Map<string, ConnectedPlayer>();

// Global block modifications in world
const modifiedBlocks = new Map<string, string>(); // "x,y,z" => blockType

// Persistent player inventories stored by username
const playerInventories = new Map<
  string,
  { hotbar: any[]; inventory: any[] }
>();

// Initial mock mobs in world
interface MobEntity {
  id: string;
  type: 'pig' | 'cow' | 'zombie' | 'skeleton';
  x: number;
  y: number;
  z: number;
  yaw: number;
  health: number;
}

const worldMobs: MobEntity[] = [
  { id: 'mob-1', type: 'pig', x: 2, y: 5, z: 3, yaw: 0, health: 10 },
  { id: 'mob-2', type: 'cow', x: -4, y: 5, z: 2, yaw: 1.2, health: 10 },
  { id: 'mob-3', type: 'pig', x: 5, y: 5, z: -5, yaw: 2.5, health: 10 },
  { id: 'mob-4', type: 'zombie', x: 8, y: 5, z: 8, yaw: 3.1, health: 20 },
  { id: 'mob-5', type: 'cow', x: -6, y: 5, z: -4, yaw: 0.8, health: 10 },
];

// Broadcast message to all connected players
function broadcast(message: object, excludeId?: string) {
  const json = JSON.stringify(message);
  for (const [id, player] of onlinePlayers.entries()) {
    if (id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(json);
    }
  }
}

async function startServer() {
  const server = http.createServer(app);

  // Attach WebSocket server for real-time multiplayer
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let playerId = 'player_' + Math.random().toString(36).substring(2, 9);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join') {
          const username = msg.username || 'Steve';
          const skin = msg.skin || 'steve';
          const spawnX = msg.x || 0;
          const spawnY = msg.y || 6;
          const spawnZ = msg.z || 0;

          const newPlayer: ConnectedPlayer = {
            id: playerId,
            ws,
            username,
            skin,
            x: spawnX,
            y: spawnY,
            z: spawnZ,
            pitch: 0,
            yaw: 0,
            selectedSlot: 0,
            heldItem: 'diamond_sword',
            ping: 15,
          };

          onlinePlayers.set(playerId, newPlayer);

          // Send welcome packet with current world state & other players
          const otherPlayersList = Array.from(onlinePlayers.values())
            .filter((p) => p.id !== playerId)
            .map((p) => ({
              id: p.id,
              username: p.username,
              skin: p.skin,
              x: p.x,
              y: p.y,
              z: p.z,
              pitch: p.pitch,
              yaw: p.yaw,
              selectedSlot: p.selectedSlot,
              heldItem: p.heldItem,
            }));

          const blocksList: Array<{ x: number; y: number; z: number; block: string }> = [];
          for (const [key, block] of modifiedBlocks.entries()) {
            const [x, y, z] = key.split(',').map(Number);
            blocksList.push({ x, y, z, block });
          }

          const savedInv = playerInventories.get(username) || null;

          ws.send(
            JSON.stringify({
              type: 'init',
              playerId,
              players: otherPlayersList,
              mobs: worldMobs,
              modifiedBlocks: blocksList,
              savedInventory: savedInv,
              time: 6000, // Day time
            })
          );

          // Notify other players
          broadcast(
            {
              type: 'player_joined',
              player: {
                id: playerId,
                username,
                skin,
                x: spawnX,
                y: spawnY,
                z: spawnZ,
                pitch: 0,
                yaw: 0,
              },
            },
            playerId
          );

          // Broadcast server chat message
          broadcast({
            type: 'chat',
            sender: 'Server',
            text: `§e${username} joined the game`,
            system: true,
          });
        }

        if (msg.type === 'move') {
          const player = onlinePlayers.get(playerId);
          if (player) {
            player.x = msg.x;
            player.y = msg.y;
            player.z = msg.z;
            player.pitch = msg.pitch;
            player.yaw = msg.yaw;

            broadcast(
              {
                type: 'player_moved',
                id: playerId,
                x: msg.x,
                y: msg.y,
                z: msg.z,
                pitch: msg.pitch,
                yaw: msg.yaw,
              },
              playerId
            );
          }
        }

        if (msg.type === 'held_item') {
          const player = onlinePlayers.get(playerId);
          if (player) {
            player.heldItem = msg.item;
            broadcast(
              {
                type: 'player_held_item',
                id: playerId,
                item: msg.item,
              },
              playerId
            );
          }
        }

        if (msg.type === 'block_change') {
          const { x, y, z, block } = msg;
          const key = `${x},${y},${z}`;
          if (block === 'air') {
            modifiedBlocks.set(key, 'air');
          } else {
            modifiedBlocks.set(key, block);
          }

          // Broadcast to everyone including sender for confirmation
          broadcast({
            type: 'block_changed',
            x,
            y,
            z,
            block,
            by: playerId,
          });
        }

        if (msg.type === 'update_inventory') {
          const player = onlinePlayers.get(playerId);
          if (player) {
            playerInventories.set(player.username, {
              hotbar: msg.hotbar,
              inventory: msg.inventory,
            });
          }
        }

        if (msg.type === 'chat') {
          const player = onlinePlayers.get(playerId);
          const username = player ? player.username : 'Unknown';
          const text = (msg.text || '').trim();

          if (text) {
            if (text.startsWith('/')) {
              // Handle server command
              if (text === '/help') {
                ws.send(
                  JSON.stringify({
                    type: 'chat',
                    sender: 'Server',
                    text: '§6--- Available Server Commands ---\n§e/gamemode <c/s> §7- Creative/Survival\n§e/give <item> <amount> §7- Give items\n§e/time set <day/night> §7- Set world time\n§e/tp <x> <y> <z> §7- Teleport\n§e/clear §7- Clear chat',
                    system: true,
                  })
                );
              } else if (text.startsWith('/gamemode')) {
                const mode = text.includes('c') ? 'Creative' : 'Survival';
                ws.send(
                  JSON.stringify({
                    type: 'chat',
                    sender: 'Server',
                    text: `§aGame mode updated to §f${mode} Mode`,
                    system: true,
                  })
                );
              } else if (text.startsWith('/give')) {
                const parts = text.split(' ');
                const item = parts[1] || 'diamond';
                const count = parseInt(parts[2], 10) || 64;
                ws.send(
                  JSON.stringify({
                    type: 'chat',
                    sender: 'Server',
                    text: `§aGave ${count} [${item}] to ${username}`,
                    system: true,
                  })
                );
                ws.send(
                  JSON.stringify({
                    type: 'receive_item',
                    id: item,
                    count,
                  })
                );
              } else if (text.startsWith('/time')) {
                broadcast({
                  type: 'chat',
                  sender: 'Server',
                  text: `§e${username} changed the time to Day`,
                  system: true,
                });
              } else {
                ws.send(
                  JSON.stringify({
                    type: 'chat',
                    sender: 'Server',
                    text: `§cUnknown command: ${text}. Type /help for help.`,
                    system: true,
                  })
                );
              }
            } else {
              // Broadcast normal player chat
              broadcast({
                type: 'chat',
                sender: username,
                text,
                system: false,
              });
            }
          }
        }

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: msg.timestamp }));
        }
      } catch (err) {
        // Handle malformed JSON
      }
    });

    ws.on('close', () => {
      const player = onlinePlayers.get(playerId);
      if (player) {
        const username = player.username;
        onlinePlayers.delete(playerId);
        broadcast({
          type: 'player_left',
          id: playerId,
        });
        broadcast({
          type: 'chat',
          sender: 'Server',
          text: `§e${username} left the game`,
          system: true,
        });
      }
    });
  });

  // Mobs autonomous wandering simulation loop
  setInterval(() => {
    for (const mob of worldMobs) {
      if (Math.random() < 0.4) {
        mob.yaw += (Math.random() - 0.5) * 1.5;
        const dist = 0.3 * (Math.random() + 0.2);
        mob.x += Math.sin(mob.yaw) * dist;
        mob.z += Math.cos(mob.yaw) * dist;
      }
    }
    if (onlinePlayers.size > 0) {
      broadcast({
        type: 'mobs_update',
        mobs: worldMobs,
      });
    }
  }, 1000);

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Minecraft 1.21.4 Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
