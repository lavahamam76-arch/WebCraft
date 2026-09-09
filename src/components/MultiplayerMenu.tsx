import React, { useState, useEffect, useCallback } from 'react';
import { ServerEntry, ServerPingResult } from '../types/minecraft';
import { parseMinecraftMOTD, FormattedSpan } from '../minecraft/protocol';
import { soundManager } from '../minecraft/audio';
import { getBlockDataUrl } from '../minecraft/textures';
import { RefreshCw, Plus, Edit2, Trash2, ArrowRight, Signal, WifiOff } from 'lucide-react';

interface MultiplayerMenuProps {
  servers: ServerEntry[];
  onJoinServer: (server: ServerEntry) => void;
  onAddServer: () => void;
  onEditServer: (server: ServerEntry) => void;
  onDeleteServer: (server: ServerEntry) => void;
  onDirectConnect: () => void;
  onBack: () => void;
  username: string;
  onOpenProfile: () => void;
}

export const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({
  servers,
  onJoinServer,
  onAddServer,
  onEditServer,
  onDeleteServer,
  onDirectConnect,
  onBack,
  username,
  onOpenProfile,
}) => {
  const [selectedId, setSelectedId] = useState<string>(servers[0]?.id || '');
  const [pingResults, setPingResults] = useState<Record<string, ServerPingResult>>({});
  const [isPinging, setIsPinging] = useState<Record<string, boolean>>({});

  const defaultIcon = getBlockDataUrl('grass_side');

  // Ping a single server
  const pingServer = useCallback(async (server: ServerEntry) => {
    setIsPinging((prev) => ({ ...prev, [server.id]: true }));
    try {
      const res = await fetch(`/api/minecraft/ping?host=${encodeURIComponent(server.address)}`);
      if (res.ok) {
        const data = await res.json();
        setPingResults((prev) => ({ ...prev, [server.id]: data }));
      } else {
        setPingResults((prev) => ({
          ...prev,
          [server.id]: { online: false, error: 'Failed to contact ping proxy' },
        }));
      }
    } catch {
      setPingResults((prev) => ({
        ...prev,
        [server.id]: { online: false, error: 'Network error' },
      }));
    } finally {
      setIsPinging((prev) => ({ ...prev, [server.id]: false }));
    }
  }, []);

  // Ping all servers
  const refreshAll = useCallback(() => {
    soundManager.playClick();
    servers.forEach((s) => pingServer(s));
  }, [servers, pingServer]);

  useEffect(() => {
    servers.forEach((s) => {
      if (!pingResults[s.id]) {
        pingServer(s);
      }
    });
  }, [servers, pingServer]);

  const selectedServer = servers.find((s) => s.id === selectedId);

  const handleJoin = () => {
    if (selectedServer) {
      soundManager.playClick();
      onJoinServer(selectedServer);
    }
  };

  // Render formatted MOTD spans
  const renderMOTD = (spans: FormattedSpan[]) => {
    return spans.map((span, idx) => (
      <span
        key={idx}
        style={{
          color: span.color || '#FFFFFF',
          fontWeight: span.bold ? 'bold' : 'normal',
          fontStyle: span.italic ? 'italic' : 'normal',
          textDecoration: `${span.underlined ? 'underline' : ''} ${
            span.strikethrough ? 'line-through' : ''
          }`.trim(),
        }}
        className="mc-text-shadow-sm"
      >
        {span.text}
      </span>
    ));
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] mc-dirt-bg flex flex-col justify-between select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="w-full bg-black/70 border-b-2 border-black/80 px-3 py-1.5 sm:px-6 sm:py-2.5 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-bold text-gray-200 mc-text-shadow">
            Play Multiplayer
          </span>
          <span className="text-[10px] sm:text-[11px] text-green-400 mc-text-shadow hidden xs:inline">
            (Vanilla 1.21.4 Protocol 768)
          </span>
        </div>

        {/* Player Profile indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-[11px] text-gray-300 mc-text-shadow">Player:</span>
          <button
            id="mc-mp-player-btn"
            onClick={() => {
              soundManager.playClick();
              onOpenProfile();
            }}
            className="mc-btn text-[10px] sm:text-[11px] py-0.5 px-2 sm:px-2.5 text-yellow-300"
          >
            {username}
          </button>
        </div>
      </div>

      {/* Center: Server List Container */}
      <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto overflow-y-auto px-2 sm:px-4 py-1.5 flex flex-col gap-1.5 sm:gap-2 my-1">
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 sm:h-48 text-gray-400 text-xs mc-text-shadow">
            <p>No servers found.</p>
            <p className="mt-1 text-gray-500">Click &quot;Add Server&quot; to add a Minecraft server.</p>
          </div>
        ) : (
          servers.map((server) => {
            const isSelected = server.id === selectedId;
            const ping = pingResults[server.id];
            const loading = isPinging[server.id];

            const motdSpans = ping && ping.online && ping.description
              ? parseMinecraftMOTD(ping.description)
              : [
                  {
                    text: loading
                      ? 'Pinging server...'
                      : ping?.error || 'Can\'t connect to server',
                    color: loading ? '#888888' : '#AA0000',
                  },
                ];

            const iconSrc = ping?.favicon || defaultIcon;

            return (
              <div
                key={server.id}
                id={`mc-server-item-${server.id}`}
                onClick={() => {
                  setSelectedId(server.id);
                  soundManager.playClick();
                }}
                onDoubleClick={() => onJoinServer(server)}
                className={`relative flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-black/60 border-2 transition-none cursor-pointer ${
                  isSelected
                    ? 'border-white bg-black/80 ring-1 ring-white'
                    : 'border-black hover:border-gray-500'
                }`}
              >
                {/* Server Favicon */}
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-black/80 border border-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={iconSrc}
                    alt={server.name}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-white/10 flex items-center justify-center opacity-0 hover:opacity-100">
                      <ArrowRight size={20} className="text-white drop-shadow" />
                    </div>
                  )}
                </div>

                {/* Server Info Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-baseline gap-1">
                    <span className="text-[11px] sm:text-xs font-bold text-white mc-text-shadow truncate">
                      {server.name}
                    </span>

                    {/* Ping Latency & Player Count */}
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] mc-text-shadow flex-shrink-0">
                      {loading ? (
                        <span className="text-gray-400 flex items-center gap-1 text-[9px] sm:text-[10px]">
                          <RefreshCw size={9} className="animate-spin" /> Pinging...
                        </span>
                      ) : ping?.online ? (
                        <>
                          <span className="text-gray-300 text-[10px] sm:text-xs">
                            {ping.players ? `${ping.players.online}/${ping.players.max}` : '1/100'}
                          </span>
                          <span
                            title={`${ping.latency || 25} ms`}
                            className="flex items-center gap-0.5 text-green-400 font-bold"
                          >
                            <Signal size={11} className="text-green-400" />
                            <span className="text-[9px] sm:text-[10px]">{ping.latency || 25}ms</span>
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 font-bold text-[9px] sm:text-[10px]">
                          <WifiOff size={11} />
                          <span>Offline</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MOTD Description Lines */}
                  <div className="text-[10px] sm:text-[11px] leading-tight break-words line-clamp-1 sm:line-clamp-2 select-text font-normal">
                    {renderMOTD(motdSpans)}
                  </div>

                  {/* Server Address info */}
                  <div className="text-[8px] sm:text-[9px] text-gray-400 truncate">
                    {server.address} {server.isLocalRoom && '• Built-in Vanilla 1.21.4 Relay'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Button Action Bar */}
      <div className="w-full bg-black/70 border-t-2 border-black/80 px-2 py-1.5 sm:px-4 sm:py-2.5 flex flex-col items-center gap-1.5 z-10 shadow-lg">
        {/* Row 1 */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2.5 w-full max-w-3xl">
          <button
            id="mc-btn-join-server"
            disabled={!selectedServer}
            onClick={handleJoin}
            className="mc-btn flex-1 min-w-[100px] sm:min-w-[130px] py-1 sm:py-1.5 text-[10px] sm:text-xs text-yellow-200"
          >
            Join Server
          </button>

          <button
            id="mc-btn-direct-connect"
            onClick={() => {
              soundManager.playClick();
              onDirectConnect();
            }}
            className="mc-btn flex-1 min-w-[100px] sm:min-w-[130px] py-1 sm:py-1.5 text-[10px] sm:text-xs"
          >
            Direct Connection
          </button>

          <button
            id="mc-btn-add-server"
            onClick={() => {
              soundManager.playClick();
              onAddServer();
            }}
            className="mc-btn flex-1 min-w-[100px] sm:min-w-[130px] py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center justify-center gap-1"
          >
            <Plus size={12} />
            <span>Add Server</span>
          </button>
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2.5 w-full max-w-3xl">
          <button
            id="mc-btn-edit-server"
            disabled={!selectedServer}
            onClick={() => {
              if (selectedServer) {
                soundManager.playClick();
                onEditServer(selectedServer);
              }
            }}
            className="mc-btn flex-1 min-w-[75px] sm:min-w-[100px] py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center justify-center gap-1"
          >
            <Edit2 size={11} />
            <span>Edit</span>
          </button>

          <button
            id="mc-btn-delete-server"
            disabled={!selectedServer}
            onClick={() => {
              if (selectedServer) {
                soundManager.playClick();
                onDeleteServer(selectedServer);
              }
            }}
            className="mc-btn flex-1 min-w-[75px] sm:min-w-[100px] py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center justify-center gap-1"
          >
            <Trash2 size={11} />
            <span>Delete</span>
          </button>

          <button
            id="mc-btn-refresh-servers"
            onClick={refreshAll}
            className="mc-btn flex-1 min-w-[75px] sm:min-w-[100px] py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center justify-center gap-1"
          >
            <RefreshCw size={11} />
            <span>Refresh</span>
          </button>

          <button
            id="mc-btn-cancel-multiplayer"
            onClick={() => {
              soundManager.playClick();
              onBack();
            }}
            className="mc-btn flex-1 min-w-[75px] sm:min-w-[100px] py-1 sm:py-1.5 text-[10px] sm:text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
