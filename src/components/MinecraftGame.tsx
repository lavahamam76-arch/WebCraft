import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { VoxelWorld, BlockId, getBlockMetadata } from '../minecraft/world';
import { MinecraftRenderer } from '../minecraft/renderer';
import { soundManager } from '../minecraft/audio';
import {
  ServerEntry,
  InventoryItem,
  ChatMessage,
  GameSettings,
  RemotePlayerData,
  MobEntityData,
  TargetedBlockInfo,
} from '../types/minecraft';
import { GameHUD } from './GameHUD';
import { InventoryModal } from './InventoryModal';
import { PauseMenu } from './PauseMenu';
import { MobileControls } from './MobileControls';
import { LandscapeNotice } from './LandscapeNotice';

interface MinecraftGameProps {
  server: ServerEntry;
  settings: GameSettings;
  onDisconnect: () => void;
  onOptions: () => void;
}

const DEFAULT_HOTBAR: Array<InventoryItem | null> = [
  { id: 'diamond_sword', name: 'Diamond Sword', count: 1, type: 'tool' },
  { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', count: 1, type: 'tool' },
  { id: 'oak_log', name: 'Oak Log', count: 64, type: 'block', blockType: 'oak_log' },
  { id: 'oak_planks', name: 'Oak Planks', count: 64, type: 'block', blockType: 'oak_planks' },
  { id: 'cobblestone', name: 'Cobblestone', count: 64, type: 'block', blockType: 'cobblestone' },
  { id: 'glass', name: 'Glass', count: 32, type: 'block', blockType: 'glass' },
  { id: 'golden_apple', name: 'Golden Apple', count: 16, type: 'food' },
  { id: 'tnt', name: 'TNT', count: 16, type: 'block', blockType: 'tnt' },
  { id: 'glowstone', name: 'Glowstone', count: 32, type: 'block', blockType: 'glowstone' },
];

const DEFAULT_INVENTORY: Array<InventoryItem | null> = [
  { id: 'dirt', name: 'Dirt', count: 64, type: 'block', blockType: 'dirt' },
  { id: 'grass_block', name: 'Grass Block', count: 64, type: 'block', blockType: 'grass_block' },
  { id: 'stone', name: 'Stone', count: 64, type: 'block', blockType: 'stone' },
  { id: 'diamond_ore', name: 'Diamond Ore', count: 32, type: 'block', blockType: 'diamond_ore' },
  { id: 'bricks', name: 'Bricks', count: 64, type: 'block', blockType: 'bricks' },
  { id: 'obsidian', name: 'Obsidian', count: 16, type: 'block', blockType: 'obsidian' },
  ...Array(21).fill(null),
];

export const MinecraftGame: React.FC<MinecraftGameProps> = ({
  server,
  settings,
  onDisconnect,
  onOptions,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MinecraftRenderer | null>(null);
  const worldRef = useRef<VoxelWorld>(new VoxelWorld());
  const wsRef = useRef<WebSocket | null>(null);

  // Player State
  const playerPosRef = useRef(new THREE.Vector3(0, 8, 0));
  const playerVelRef = useRef(new THREE.Vector3(0, 0, 0));
  const playerRotRef = useRef({ pitch: 0, yaw: 0 });
  const isGroundedRef = useRef(false);

  // UI States
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [hotbar, setHotbar] = useState<Array<InventoryItem | null>>(DEFAULT_HOTBAR);
  const [inventory, setInventory] = useState<Array<InventoryItem | null>>(DEFAULT_INVENTORY);
  const [health, setHealth] = useState(20);
  const [armor] = useState(15);
  const [hunger] = useState(20);
  const [level] = useState(30);
  const [expProgress] = useState(0.65);

  const [isPaused, setIsPaused] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTabOpen, setIsTabOpen] = useState(false);
  const [showF3, setShowF3] = useState(false);
  const [fps, setFps] = useState(60);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'Server',
      text: `§aConnected to ${server.name}! §e(Minecraft 1.21.4 Vanilla)`,
      system: true,
      timestamp: Date.now(),
    },
    {
      id: 'welcome-2',
      sender: 'Server',
      text: '§7Press §f[E] §7for inventory, §f[T] §7for chat, §f[F3] §7for debug.',
      system: true,
      timestamp: Date.now(),
    },
  ]);

  const [remotePlayers, setRemotePlayers] = useState<RemotePlayerData[]>([]);
  const [targetedBlockName, setTargetedBlockName] = useState<string | null>(null);

  // Keyboard keys tracking
  const keysRef = useRef<Record<string, boolean>>({});

  // Block breaking state
  const isDiggingRef = useRef(false);
  const digTargetRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const digProgressRef = useRef(0);

  // Mobile Device Detection (coarse pointer / touch event check)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  });

  useEffect(() => {
    const checkMobile = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(hasTouch);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile touch controls state
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const isSneakingRef = useRef(false);

  // Pointer lock state (used on desktop mice only)
  const isPointerLockedRef = useRef(false);

  // Detailed targeted block metadata
  const [targetedBlockInfo, setTargetedBlockInfo] = useState<TargetedBlockInfo | null>(null);

  // Helper to sync inventory changes to server
  const syncInventoryToServer = useCallback(
    (newHotbar: Array<InventoryItem | null>, newInventory: Array<InventoryItem | null>) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'update_inventory',
            hotbar: newHotbar,
            inventory: newInventory,
          })
        );
      }
    },
    []
  );

  // Selected hotbar item helper
  const currentHeldItem = hotbar[selectedSlot];

  // Send chat message
  const handleSendChat = useCallback(
    (text: string) => {
      // Handle local commands
      if (text.startsWith('/')) {
        soundManager.playChatPing();
        if (text === '/help') {
          setChatMessages((prev) => [
            ...prev,
            {
              id: 'cmd_' + Date.now(),
              text: '§6--- Available Commands ---\n§e/gamemode <c/s> §7- Switch mode\n§e/tp <x> <y> <z> §7- Teleport\n§e/time set day §7- Set daytime\n§e/clear §7- Clear chat\n§e/help §7- Show this help',
              system: true,
              timestamp: Date.now(),
            },
          ]);
          return;
        } else if (text === '/clear') {
          setChatMessages([]);
          return;
        } else if (text.startsWith('/tp')) {
          const parts = text.split(' ');
          const x = parseFloat(parts[1]) || 0;
          const y = parseFloat(parts[2]) || 10;
          const z = parseFloat(parts[3]) || 0;
          playerPosRef.current.set(x, y, z);
          playerVelRef.current.set(0, 0, 0);
          setChatMessages((prev) => [
            ...prev,
            {
              id: 'cmd_' + Date.now(),
              text: `§aTeleported to ${x}, ${y}, ${z}`,
              system: true,
              timestamp: Date.now(),
            },
          ]);
          return;
        } else if (text.startsWith('/time')) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: 'cmd_' + Date.now(),
              text: '§eSet time to 6000 (Day)',
              system: true,
              timestamp: Date.now(),
            },
          ]);
          return;
        }
      }

      // Broadcast via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'chat',
            text,
          })
        );
      } else {
        // Local echo
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'local_' + Date.now(),
            sender: settings.username,
            text,
            timestamp: Date.now(),
          },
        ]);
      }
      soundManager.playChatPing();
    },
    [settings.username]
  );

  // Setup WebSocket connection to server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          username: settings.username,
          skin: settings.skin,
          x: playerPosRef.current.x,
          y: playerPosRef.current.y,
          z: playerPosRef.current.z,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'init') {
          // Sync existing remote players
          if (Array.isArray(msg.players)) {
            setRemotePlayers(msg.players);
            rendererRef.current?.updateRemotePlayers(msg.players);
          }
          // Sync mobs
          if (Array.isArray(msg.mobs)) {
            rendererRef.current?.updateMobs(msg.mobs);
          }
          // Sync modified blocks
          if (Array.isArray(msg.modifiedBlocks)) {
            for (const b of msg.modifiedBlocks) {
              worldRef.current.setBlock(b.x, b.y, b.z, b.block);
            }
            rendererRef.current?.buildWorldMesh(worldRef.current);
          }
          // Restore server-saved inventory
          if (msg.savedInventory) {
            if (Array.isArray(msg.savedInventory.hotbar)) {
              setHotbar(msg.savedInventory.hotbar);
            }
            if (Array.isArray(msg.savedInventory.inventory)) {
              setInventory(msg.savedInventory.inventory);
            }
          }
        }

        if (msg.type === 'receive_item') {
          const itemId = msg.id;
          const count = msg.count || 1;
          const meta = getBlockMetadata(itemId);
          const isTool = itemId.includes('pickaxe') || itemId.includes('sword') || itemId.includes('axe');
          const newItem: InventoryItem = {
            id: itemId,
            name: meta.name || itemId.replace('_', ' ').toUpperCase(),
            count,
            type: isTool ? 'tool' : 'block',
            blockType: isTool ? undefined : (itemId as BlockId),
          };
          setHotbar((prev) => {
            const next = [...prev];
            const match = next.find((i) => i && i.id === itemId);
            if (match) {
              match.count += count;
            } else {
              const empty = next.findIndex((i) => i === null);
              if (empty !== -1) next[empty] = newItem;
            }
            syncInventoryToServer(next, inventory);
            return next;
          });
          soundManager.playPop();
        }

        if (msg.type === 'player_joined') {
          setRemotePlayers((prev) => {
            const next = [...prev.filter((p) => p.id !== msg.player.id), msg.player];
            rendererRef.current?.updateRemotePlayers(next);
            return next;
          });
        }

        if (msg.type === 'player_moved') {
          setRemotePlayers((prev) => {
            const next = prev.map((p) => (p.id === msg.id ? { ...p, ...msg } : p));
            rendererRef.current?.updateRemotePlayers(next);
            return next;
          });
        }

        if (msg.type === 'player_left') {
          setRemotePlayers((prev) => {
            const next = prev.filter((p) => p.id !== msg.id);
            rendererRef.current?.updateRemotePlayers(next);
            return next;
          });
        }

        if (msg.type === 'mobs_update') {
          rendererRef.current?.updateMobs(msg.mobs);
        }

        if (msg.type === 'block_changed') {
          worldRef.current.setBlock(msg.x, msg.y, msg.z, msg.block);
          rendererRef.current?.buildWorldMesh(worldRef.current);
        }

        if (msg.type === 'chat') {
          setChatMessages((prev) => [
            ...prev,
            {
              id: 'msg_' + Date.now() + Math.random(),
              sender: msg.sender,
              text: msg.text,
              system: msg.system,
              timestamp: Date.now(),
            },
          ]);
          soundManager.playChatPing();
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
    };
  }, [settings.username, settings.skin]);

  // Initialize Three.js Renderer & Voxel World
  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = new MinecraftRenderer(mountRef.current, settings.fov);
    rendererRef.current = renderer;

    const world = worldRef.current;
    renderer.buildWorldMesh(world);

    // Initial position on top of terrain
    playerPosRef.current.set(0, 10, 0);

    // Pointer lock events (Desktop only)
    const canvas = renderer.renderer.domElement;
    const requestLock = () => {
      if (!isMobile && !isPaused && !isInventoryOpen && !isChatOpen) {
        canvas.requestPointerLock();
      }
    };

    canvas.addEventListener('click', requestLock);

    const onLockChange = () => {
      isPointerLockedRef.current = document.pointerLockElement === canvas;
    };
    document.addEventListener('pointerlockchange', onLockChange);

    // Mobile Touch Look handlers (Drag on right side to rotate camera)
    let touchLookId: number | null = null;
    let lastTouchX = 0;
    let lastTouchY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (isPaused || isInventoryOpen || isChatOpen) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        // Touch on right 65% of screen initiates camera rotation
        if (t.clientX > window.innerWidth * 0.35) {
          touchLookId = t.identifier;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
          break;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchLookId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchLookId) {
          const dx = t.clientX - lastTouchX;
          const dy = t.clientY - lastTouchY;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;

          const sens = 0.0035;
          playerRotRef.current.yaw -= dx * sens;
          playerRotRef.current.pitch -= dy * sens;

          const maxPitch = (Math.PI / 2) * 0.98;
          playerRotRef.current.pitch = Math.max(-maxPitch, Math.min(maxPitch, playerRotRef.current.pitch));
          break;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchLookId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchLookId) {
          touchLookId = null;
          break;
        }
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // Mouse movement look
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLockedRef.current) return;

      const sens = 0.0025;
      playerRotRef.current.yaw -= e.movementX * sens;
      playerRotRef.current.pitch -= e.movementY * sens;

      // Clamp pitch to avoid screen flipping (-89 to +89 degrees)
      const maxPitch = (Math.PI / 2) * 0.98;
      playerRotRef.current.pitch = Math.max(-maxPitch, Math.min(maxPitch, playerRotRef.current.pitch));
    };
    window.addEventListener('mousemove', onMouseMove);

    // Mouse click & mining
    const onMouseDown = (e: MouseEvent) => {
      if (!isPointerLockedRef.current) return;

      if (e.button === 0) {
        // Left-click: start digging / swinging hand
        isDiggingRef.current = true;
        renderer.triggerSwing();
      } else if (e.button === 2) {
        // Right-click: place block against targeted face
        e.preventDefault();
        placeTargetedBlock();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isDiggingRef.current = false;
        digProgressRef.current = 0;
        renderer.updateBreakStage(null, 0);
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);

    // Mouse wheel slot cycle
    const onWheel = (e: WheelEvent) => {
      if (!isPointerLockedRef.current) return;
      soundManager.playClick();
      setSelectedSlot((curr) => {
        if (e.deltaY > 0) return (curr + 1) % 9;
        return (curr - 1 + 9) % 9;
      });
    };
    window.addEventListener('wheel', onWheel);

    return () => {
      canvas.removeEventListener('click', requestLock);
      document.removeEventListener('pointerlockchange', onLockChange);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [settings.fov, isPaused, isInventoryOpen, isChatOpen, isMobile]);

  // Update held item in hand when slot changes
  useEffect(() => {
    if (rendererRef.current) {
      const item = hotbar[selectedSlot];
      const held = item ? item.blockType || item.id : 'air';
      rendererRef.current.setHeldItem(held);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'held_item',
            item: held,
          })
        );
      }
    }
  }, [selectedSlot, hotbar]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Slot numbers 1-9
      if (/^[1-9]$/.test(e.key) && !isChatOpen && !isInventoryOpen) {
        setSelectedSlot(parseInt(e.key, 10) - 1);
        soundManager.playClick();
        return;
      }

      if (e.code === 'KeyE' && !isChatOpen) {
        soundManager.playClick();
        if (document.pointerLockElement) document.exitPointerLock();
        setIsInventoryOpen((prev) => !prev);
        return;
      }

      if (e.code === 'Escape') {
        soundManager.playClick();
        if (isInventoryOpen) {
          setIsInventoryOpen(false);
        } else if (isChatOpen) {
          setIsChatOpen(false);
        } else {
          setIsPaused((prev) => !prev);
        }
        return;
      }

      if ((e.code === 'KeyT' || e.code === 'Slash') && !isChatOpen && !isInventoryOpen && !isPaused) {
        e.preventDefault();
        if (document.pointerLockElement) document.exitPointerLock();
        setIsChatOpen(true);
        return;
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        setIsTabOpen(true);
        return;
      }

      if (e.code === 'F3') {
        e.preventDefault();
        setShowF3((prev) => !prev);
        return;
      }

      keysRef.current[e.code] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        setIsTabOpen(false);
      }
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isChatOpen, isInventoryOpen, isPaused]);

  // Place Block action
  const placeTargetedBlock = () => {
    const renderer = rendererRef.current;
    const world = worldRef.current;
    if (!renderer) return;

    const dir = new THREE.Vector3();
    renderer.camera.getWorldDirection(dir);
    const hit = world.raycast(playerPosRef.current, dir, 5);

    if (hit && currentHeldItem && currentHeldItem.type === 'block' && currentHeldItem.blockType) {
      const bx = hit.adjacentX;
      const by = hit.adjacentY;
      const bz = hit.adjacentZ;

      // Don't place inside player bounding box
      const wouldCollide = world.checkPlayerCollision(playerPosRef.current);
      world.setBlock(bx, by, bz, currentHeldItem.blockType as BlockId);
      if (world.checkPlayerCollision(playerPosRef.current)) {
        // Revert if collides with player
        world.setBlock(bx, by, bz, 'air');
        return;
      }

      soundManager.playBlockPlace('dirt');
      renderer.triggerSwing();
      renderer.buildWorldMesh(world);

      // Decrement item
      setHotbar((prev) => {
        const next = [...prev];
        const it = next[selectedSlot];
        if (it) {
          if (it.count > 1) {
            it.count--;
          } else {
            next[selectedSlot] = null;
          }
        }
        syncInventoryToServer(next, inventory);
        return next;
      });

      // Broadcast to server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'block_change',
            x: bx,
            y: by,
            z: bz,
            block: currentHeldItem.blockType,
          })
        );
      }
    }
  };

  // Main Game Loop (Physics, Raycast, Digging, Rendering)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let stepTimer = 0;
    let netSyncTimer = 0;
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Calculate FPS
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsTime = now;
      }

      const renderer = rendererRef.current;
      const world = worldRef.current;
      if (!renderer) return;

      const keys = keysRef.current;
      const isMovingActive =
        (isMobile || isPointerLockedRef.current) &&
        !isPaused &&
        !isInventoryOpen &&
        !isChatOpen;

      let isWalking = false;

      // Movement & Physics
      if (isMovingActive) {
        const yaw = playerRotRef.current.yaw;
        const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

        const isSprinting = keys['ControlLeft'];
        const isSneaking = isSneakingRef.current;
        const speed = isSneaking ? 2.2 : (isSprinting ? 6.5 : 4.5);
        const moveVec = new THREE.Vector3(0, 0, 0);

        if (keys['KeyW']) moveVec.add(forward);
        if (keys['KeyS']) moveVec.sub(forward);
        if (keys['KeyA']) moveVec.sub(right);
        if (keys['KeyD']) moveVec.add(right);

        if (moveVec.lengthSq() > 0) {
          moveVec.normalize().multiplyScalar(speed);
          isWalking = true;
          stepTimer += delta * 12;
          if (stepTimer >= Math.PI) {
            stepTimer = 0;
            if (isGroundedRef.current) soundManager.playStep();
          }
        }

        // Apply horizontal movement
        const nextX = playerPosRef.current.x + moveVec.x * delta;
        const nextZ = playerPosRef.current.z + moveVec.z * delta;

        // Collision check X
        const testX = new THREE.Vector3(nextX, playerPosRef.current.y, playerPosRef.current.z);
        if (!world.checkPlayerCollision(testX)) {
          playerPosRef.current.x = nextX;
        }

        // Collision check Z
        const testZ = new THREE.Vector3(playerPosRef.current.x, playerPosRef.current.y, nextZ);
        if (!world.checkPlayerCollision(testZ)) {
          playerPosRef.current.z = nextZ;
        }

        // Jump
        if (keys['Space'] && isGroundedRef.current) {
          playerVelRef.current.y = 7.5;
          isGroundedRef.current = false;
        }
      }

      // Gravity & Vertical Collision
      const gravity = 22;
      playerVelRef.current.y -= gravity * delta;
      const nextY = playerPosRef.current.y + playerVelRef.current.y * delta;

      const testY = new THREE.Vector3(playerPosRef.current.x, nextY, playerPosRef.current.z);
      if (world.checkPlayerCollision(testY)) {
        if (playerVelRef.current.y < 0) {
          isGroundedRef.current = true;
        }
        playerVelRef.current.y = 0;
      } else {
        playerPosRef.current.y = nextY;
        isGroundedRef.current = false;
      }

      // Void rescue
      if (playerPosRef.current.y < -10) {
        playerPosRef.current.set(0, 15, 0);
        playerVelRef.current.set(0, 0, 0);
        soundManager.playHurt();
      }

      // Update camera orientation and position (Eye height 1.62)
      renderer.camera.position.set(
        playerPosRef.current.x,
        playerPosRef.current.y + 1.62,
        playerPosRef.current.z
      );

      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.x = playerRotRef.current.pitch;
      euler.y = playerRotRef.current.yaw;
      renderer.camera.quaternion.setFromEuler(euler);

      // Raycasting for block targeting & digging
      const camDir = new THREE.Vector3();
      renderer.camera.getWorldDirection(camDir);
      const hit = world.raycast(playerPosRef.current, camDir, 5);

      if (hit) {
        renderer.updateTargetBox({ x: hit.blockX, y: hit.blockY, z: hit.blockZ });
        setTargetedBlockName(hit.blockType);

        const meta = getBlockMetadata(hit.blockType);
        setTargetedBlockInfo({
          name: meta.name,
          type: hit.blockType,
          x: hit.blockX,
          y: hit.blockY,
          z: hit.blockZ,
          hardness: meta.hardness,
          tool: meta.tool,
          drops: meta.dropItem ? meta.dropItem.name : 'Yok',
        });

        // Digging logic
        if (isDiggingRef.current && isMovingActive) {
          const isSameTarget =
            digTargetRef.current &&
            digTargetRef.current.x === hit.blockX &&
            digTargetRef.current.y === hit.blockY &&
            digTargetRef.current.z === hit.blockZ;

          if (!isSameTarget) {
            digTargetRef.current = { x: hit.blockX, y: hit.blockY, z: hit.blockZ };
            digProgressRef.current = 0;
          }

          // Hardness speed multiplier based on real block hardness & tool match
          const isTool = currentHeldItem?.id.includes('pickaxe') || currentHeldItem?.id.includes('sword') || currentHeldItem?.id.includes('axe');
          const toolMult = isTool ? 3.0 : 1.0;
          const digRate = (toolMult / Math.max(0.3, meta.hardness)) * 1.5;
          digProgressRef.current += delta * digRate;

          const stage = Math.min(9, Math.floor(digProgressRef.current * 10));
          renderer.updateBreakStage(digTargetRef.current, stage);

          if (digProgressRef.current >= 1.0) {
            // Block Broken!
            soundManager.playBlockBreak('dirt');
            soundManager.playPop();

            const brokenType = hit.blockType;
            world.setBlock(hit.blockX, hit.blockY, hit.blockZ, 'air');
            renderer.buildWorldMesh(world);
            renderer.updateBreakStage(null, 0);
            digProgressRef.current = 0;
            isDiggingRef.current = false;

            // Add real dropped item or block to inventory
            const drop = meta.dropItem;
            if (drop) {
              setHotbar((prev) => {
                const next = [...prev];
                const existing = next.find((i) => i && i.id === drop.id);
                if (existing) {
                  existing.count += drop.count;
                } else {
                  const emptyIdx = next.findIndex((i) => i === null);
                  if (emptyIdx !== -1) {
                    const isTool = drop.id.includes('pickaxe') || drop.id.includes('sword') || drop.id.includes('axe');
                    next[emptyIdx] = {
                      id: drop.id,
                      name: drop.name,
                      count: drop.count,
                      type: isTool ? 'tool' : 'block',
                      blockType: isTool ? undefined : (drop.id as BlockId),
                    };
                  }
                }
                syncInventoryToServer(next, inventory);
                return next;
              });
            }

            // Broadcast block break to server
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'block_change',
                  x: hit.blockX,
                  y: hit.blockY,
                  z: hit.blockZ,
                  block: 'air',
                })
              );
            }
          }
        } else {
          renderer.updateBreakStage(null, 0);
          digProgressRef.current = 0;
        }
      } else {
        renderer.updateTargetBox(null);
        renderer.updateBreakStage(null, 0);
        setTargetedBlockName(null);
        setTargetedBlockInfo(null);
      }

      // Network movement sync (10Hz)
      netSyncTimer += delta;
      if (netSyncTimer > 0.1 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        netSyncTimer = 0;
        wsRef.current.send(
          JSON.stringify({
            type: 'move',
            x: playerPosRef.current.x,
            y: playerPosRef.current.y,
            z: playerPosRef.current.z,
            pitch: playerRotRef.current.pitch,
            yaw: playerRotRef.current.yaw,
          })
        );
      }

      renderer.render(delta, isWalking);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [currentHeldItem, isPaused, isInventoryOpen, isChatOpen, isMobile, syncInventoryToServer]);

  // Mobile Controls Handlers
  const [isSneaking, setIsSneaking] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

  const handleDirectionChange = useCallback((code: string, pressed: boolean) => {
    keysRef.current[code] = pressed;
  }, []);

  const handleMobileJump = useCallback((pressed: boolean) => {
    keysRef.current['Space'] = pressed;
    if (pressed && isGroundedRef.current) {
      playerVelRef.current.y = 7.5;
      isGroundedRef.current = false;
    }
  }, []);

  const handleMobileMineStart = useCallback(() => {
    isDiggingRef.current = true;
    rendererRef.current?.triggerSwing();
  }, []);

  const handleMobileMineEnd = useCallback(() => {
    isDiggingRef.current = false;
    digProgressRef.current = 0;
    rendererRef.current?.updateBreakStage(null, 0);
  }, []);

  const handleMobilePlace = useCallback(() => {
    placeTargetedBlock();
  }, []);

  const handleToggleSneak = useCallback(() => {
    setIsSneaking((prev) => {
      const next = !prev;
      isSneakingRef.current = next;
      return next;
    });
  }, []);

  const handleToggleSprint = useCallback(() => {
    setIsSprinting((prev) => {
      const next = !prev;
      keysRef.current['ControlLeft'] = next;
      return next;
    });
  }, []);

  const handleToggleF3 = useCallback(() => {
    setShowF3((prev) => !prev);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-black">
      {/* Landscape Orientation Enforcement on Mobile */}
      <LandscapeNotice />

      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />

      {/* In-Game Heads-Up Display (HUD) */}
      <GameHUD
        hotbar={hotbar}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        health={health}
        armor={armor}
        hunger={hunger}
        level={level}
        expProgress={expProgress}
        chatMessages={chatMessages}
        onSendChat={handleSendChat}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        showF3={showF3}
        playerPos={{
          x: playerPosRef.current.x,
          y: playerPosRef.current.y,
          z: playerPosRef.current.z,
        }}
        playerRot={{
          pitch: playerRotRef.current.pitch,
          yaw: playerRotRef.current.yaw,
        }}
        targetedBlock={targetedBlockName}
        targetedBlockInfo={targetedBlockInfo}
        remotePlayers={remotePlayers}
        isTabOpen={isTabOpen}
        fps={fps}
        isMobile={isMobile}
      />

      {/* Mobile Controls (Rendered ONLY when isMobile is detected, hidden on desktop) */}
      {isMobile && !isPaused && !isInventoryOpen && !isChatOpen && (
        <MobileControls
          onDirectionChange={handleDirectionChange}
          onJump={handleMobileJump}
          onMineStart={handleMobileMineStart}
          onMineEnd={handleMobileMineEnd}
          onPlace={handleMobilePlace}
          onToggleSneak={handleToggleSneak}
          isSneaking={isSneaking}
          onToggleSprint={handleToggleSprint}
          isSprinting={isSprinting}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenPause={() => setIsPaused(true)}
          onToggleF3={handleToggleF3}
        />
      )}

      {/* Inventory Modal ('E' key or Backpack button) */}
      {isInventoryOpen && (
        <InventoryModal
          hotbar={hotbar}
          inventory={inventory}
          onUpdateSlots={(newHotbar, newInv) => {
            setHotbar(newHotbar);
            setInventory(newInv);
            syncInventoryToServer(newHotbar, newInv);
          }}
          onClose={() => setIsInventoryOpen(false)}
          skin={settings.skin}
        />
      )}

      {/* Pause Game Menu ('Esc' key or Pause button) */}
      {isPaused && (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onOptions={onOptions}
          onDisconnect={onDisconnect}
          serverName={server.name}
        />
      )}
    </div>
  );
};
