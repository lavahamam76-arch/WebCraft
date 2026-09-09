import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, ChatMessage, RemotePlayerData, TargetedBlockInfo } from '../types/minecraft';
import { getItemIcon, getBlockDataUrl } from '../minecraft/textures';
import { parseLegacyFormatting } from '../minecraft/protocol';
import { soundManager } from '../minecraft/audio';
import { Signal, Terminal } from 'lucide-react';

interface GameHUDProps {
  hotbar: Array<InventoryItem | null>;
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
  health: number; // 0 - 20
  armor: number; // 0 - 20
  hunger: number; // 0 - 20
  level: number;
  expProgress: number; // 0 - 1
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  showF3: boolean;
  playerPos: { x: number; y: number; z: number };
  playerRot: { pitch: number; yaw: number };
  targetedBlock: string | null;
  targetedBlockInfo?: TargetedBlockInfo | null;
  remotePlayers: RemotePlayerData[];
  isTabOpen: boolean;
  fps: number;
  isMobile?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hotbar,
  selectedSlot,
  onSelectSlot,
  health,
  armor,
  hunger,
  level,
  expProgress,
  chatMessages,
  onSendChat,
  isChatOpen,
  setIsChatOpen,
  showF3,
  playerPos,
  playerRot,
  targetedBlock,
  targetedBlockInfo,
  remotePlayers,
  isTabOpen,
  fps,
  isMobile = false,
}) => {
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      chatInputRef.current?.focus();
    }
  }, [isChatOpen]);

  useEffect(() => {
    // Auto scroll chat to bottom when new messages arrive
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendChat(chatInput.trim());
      setChatInput('');
    }
    setIsChatOpen(false);
  };

  const handleQuickCommand = (cmd: string) => {
    onSendChat(cmd);
    setIsChatOpen(false);
  };

  // Render 10 Hearts (health / 20)
  const renderHearts = () => {
    const hearts = [];
    const maxHearts = 10;
    const currentHealth = Math.max(0, Math.min(20, health));

    for (let i = 0; i < maxHearts; i++) {
      const heartValue = (i + 1) * 2;
      const isFull = currentHealth >= heartValue;
      const isHalf = currentHealth === heartValue - 1;

      hearts.push(
        <div key={i} className="relative w-3.5 h-3.5 flex-shrink-0">
          {/* Empty heart background */}
          <div className="absolute inset-0 bg-red-950 border border-black/80 rounded-sm" />
          {/* Filled portion */}
          {isFull && (
            <div className="absolute inset-0.5 bg-red-600 rounded-sm shadow-inner" />
          )}
          {isHalf && (
            <div className="absolute inset-0.5 right-1.5 bg-red-600 rounded-l-sm shadow-inner" />
          )}
        </div>
      );
    }
    return hearts;
  };

  // Render 10 Hunger drumsticks
  const renderHunger = () => {
    const drumsticks = [];
    const maxHunger = 10;
    const currentHunger = Math.max(0, Math.min(20, hunger));

    for (let i = 0; i < maxHunger; i++) {
      const value = (i + 1) * 2;
      const isFull = currentHunger >= value;
      const isHalf = currentHunger === value - 1;

      drumsticks.push(
        <div key={i} className="relative w-3.5 h-3.5 flex-shrink-0">
          <div className="absolute inset-0 bg-amber-950 border border-black/80 rounded-sm" />
          {isFull && (
            <div className="absolute inset-0.5 bg-amber-600 rounded-sm shadow-inner" />
          )}
          {isHalf && (
            <div className="absolute inset-0.5 left-1.5 bg-amber-600 rounded-r-sm shadow-inner" />
          )}
        </div>
      );
    }
    return drumsticks;
  };

  // Render Armor chestplates
  const renderArmor = () => {
    if (armor <= 0) return null;
    const plates = [];
    const currentArmor = Math.min(20, armor);

    for (let i = 0; i < 10; i++) {
      const val = (i + 1) * 2;
      const isFull = currentArmor >= val;

      plates.push(
        <div key={i} className="relative w-3.5 h-3.5 flex-shrink-0">
          <div className="absolute inset-0 bg-gray-900 border border-black/80 rounded-sm" />
          {isFull && (
            <div className="absolute inset-0.5 bg-gray-300 rounded-sm shadow-inner" />
          )}
        </div>
      );
    }
    return plates;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between select-none">
      {/* Center Crosshair (Hidden or subtle on mobile) */}
      {!isMobile && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="w-4 h-0.5 bg-white/80 mix-blend-difference" />
            <div className="absolute h-4 w-0.5 bg-white/80 mix-blend-difference" />
          </div>
        </div>
      )}

      {/* Targeted Block Info Banner (Top Center - Real Block Info) */}
      {targetedBlockInfo && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/80 border border-gray-600 px-3 py-1.5 rounded flex items-center gap-2.5 z-20 pointer-events-none shadow-xl backdrop-blur-xs">
          <img
            src={getBlockDataUrl(targetedBlockInfo.type)}
            alt={targetedBlockInfo.name}
            className="w-6 h-6 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="flex flex-col text-[11px] font-mono leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold text-yellow-300 mc-text-shadow">
                {targetedBlockInfo.name}
              </span>
              <span className="text-[10px] text-gray-400">
                XYZ: {targetedBlockInfo.x}, {targetedBlockInfo.y}, {targetedBlockInfo.z}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-300">
              <span>
                Tool: <strong className="text-cyan-300">{targetedBlockInfo.tool}</strong>
              </span>
              <span>•</span>
              <span>
                Drops: <strong className="text-green-300">{targetedBlockInfo.drops}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* F3 Debug Screen (Authentic Minecraft Java F3) */}
      {showF3 && (
        <div className="absolute inset-0 p-3 flex justify-between text-[11px] font-mono leading-tight z-30 pointer-events-none">
          {/* Left Debug Column */}
          <div className="bg-black/60 p-2.5 rounded text-white mc-text-shadow max-w-md flex flex-col gap-0.5">
            <div className="font-bold text-yellow-300">
              Minecraft 1.21.4 (Vanilla / WebGL Client)
            </div>
            <div>
              {fps} fps T: 60, B: 2, GPU: 100%
            </div>
            <div className="mt-1 text-green-300">
              XYZ: {playerPos.x.toFixed(3)} / {playerPos.y.toFixed(3)} / {playerPos.z.toFixed(3)}
            </div>
            <div>
              Block: {Math.floor(playerPos.x)} {Math.floor(playerPos.y)} {Math.floor(playerPos.z)}
            </div>
            <div>
              Chunk: {Math.floor(playerPos.x / 16)} {Math.floor(playerPos.z / 16)} in chunk
            </div>
            <div>
              Facing: {Math.abs(playerRot.yaw) < 0.78 ? 'south (Towards positive Z)' : Math.abs(playerRot.yaw) > 2.35 ? 'north (Towards negative Z)' : playerRot.yaw > 0 ? 'west (Towards negative X)' : 'east (Towards positive X)'}
            </div>
            <div className="mt-1 text-cyan-300">
              Biome: minecraft:plains
            </div>
            <div>Client Light: 15 (15 sky, 0 block)</div>
            <div className="text-yellow-200">
              Targeted Block: {targetedBlockInfo ? `${targetedBlockInfo.name} (${targetedBlockInfo.type})` : targetedBlock || 'None'}
            </div>
          </div>

          {/* Right Debug Column */}
          <div className="bg-black/60 p-2.5 rounded text-white mc-text-shadow text-right max-w-sm flex flex-col gap-0.5">
            <div className="text-gray-300">Java: WebAssembly / ES2022</div>
            <div>Mem: 42% 412/1024MB</div>
            <div>Allocated: 100% 1024MB</div>
            <div className="mt-1 text-gray-300">Display: {window.innerWidth}x{window.innerHeight}</div>
            <div>Renderer: WebGL2 Canvas3D</div>
          </div>
        </div>
      )}

      {/* TAB Player List Overlay */}
      {isTabOpen && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-black/75 border-2 border-gray-600 p-4 min-w-[340px] max-w-lg rounded shadow-2xl flex flex-col gap-2 pointer-events-none">
          <div className="text-center text-xs font-bold text-yellow-300 mc-text-shadow pb-1 border-b border-gray-700">
            Players Online ({remotePlayers.length + 1})
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {/* Self */}
            <div className="flex justify-between items-center bg-white/10 px-2 py-1 text-xs">
              <span className="text-yellow-200 font-bold mc-text-shadow flex items-center gap-1.5">
                <span className="w-3 h-3 bg-blue-500 inline-block border border-black" />
                You
              </span>
              <span className="flex items-center gap-1 text-[10px] text-green-400">
                <Signal size={10} /> 15ms
              </span>
            </div>

            {/* Remote players */}
            {remotePlayers.map((p) => (
              <div key={p.id} className="flex justify-between items-center px-2 py-1 text-xs">
                <span className="text-white mc-text-shadow flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-green-500 inline-block border border-black" />
                  {p.username}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <Signal size={10} /> 25ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat History & Chat Input Box */}
      <div className={`p-2 sm:p-3 max-w-lg md:max-w-xl flex flex-col justify-end pointer-events-auto ${isMobile ? 'pb-14' : ''}`}>
        {/* Messages */}
        <div
          ref={chatScrollRef}
          className="flex flex-col gap-1 max-h-32 sm:max-h-44 overflow-y-auto mb-1.5 text-xs leading-relaxed"
        >
          {chatMessages.slice(-12).map((msg) => {
            const formatted = parseLegacyFormatting(msg.text);
            return (
              <div
                key={msg.id}
                className="bg-black/60 px-2 py-1 rounded-sm w-fit max-w-full break-words mc-text-shadow"
              >
                {msg.sender && !msg.system && (
                  <span className="font-bold text-yellow-200 mr-1.5">
                    &lt;{msg.sender}&gt;
                  </span>
                )}
                {formatted.map((span, sIdx) => (
                  <span
                    key={sIdx}
                    style={{
                      color: span.color || '#FFFFFF',
                      fontWeight: span.bold ? 'bold' : 'normal',
                      fontStyle: span.italic ? 'italic' : 'normal',
                    }}
                  >
                    {span.text}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        {/* Quick Command Chips & Chat Input Form */}
        {isChatOpen && (
          <div className="flex flex-col gap-1.5 bg-black/85 p-2 border border-gray-600 rounded shadow-2xl z-50 max-w-md">
            {/* Quick Command Chips */}
            <div className="flex flex-wrap items-center gap-1 text-[9px] sm:text-[10px] max-h-16 overflow-y-auto">
              <span className="text-yellow-400 font-bold flex items-center gap-1 mr-1">
                <Terminal size={11} /> Hızlı Komutlar:
              </span>
              <button
                type="button"
                onClick={() => handleQuickCommand('/help')}
                className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-yellow-200 rounded border border-gray-500"
              >
                /help
              </button>
              <button
                type="button"
                onClick={() => handleQuickCommand('/gamemode c')}
                className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-green-300 rounded border border-gray-500"
              >
                /gamemode c
              </button>
              <button
                type="button"
                onClick={() => handleQuickCommand('/gamemode s')}
                className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-green-300 rounded border border-gray-500"
              >
                /gamemode s
              </button>
              <button
                type="button"
                onClick={() => handleQuickCommand('/give diamond 64')}
                className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-cyan-300 rounded border border-gray-500"
              >
                /give diamond 64
              </button>
              <button
                type="button"
                onClick={() => handleQuickCommand('/give tnt 64')}
                className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-red-300 rounded border border-gray-500"
              >
                /give tnt 64
              </button>
              <button
                type="button"
                onClick={() => handleQuickCommand('/time set day')}
                className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-amber-200 rounded border border-gray-500"
              >
                /time set day
              </button>
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-1 w-full">
              <input
                ref={chatInputRef}
                type="text"
                id="mc-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Komut veya mesaj yazın... (Örn: /help, Merhaba)"
                className="mc-input flex-1 text-xs py-1 px-2 bg-black/90 border-gray-400 focus:border-yellow-400 pointer-events-auto"
              />
              <button
                type="submit"
                className="mc-btn py-1 px-2.5 text-xs text-yellow-300 pointer-events-auto font-bold"
              >
                Gönder
              </button>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="mc-btn py-1 px-2 text-xs text-gray-400 hover:text-white pointer-events-auto"
              >
                Kapat
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom HUD: Hearts, Armor, Hunger, Exp bar, 9-Slot Hotbar */}
      <div className={`flex flex-col items-center pb-1 sm:pb-2 pointer-events-auto ${isMobile ? 'scale-75 sm:scale-85 md:scale-95 origin-bottom' : ''}`}>
        {/* Vitals: Armor, Health (Left), Hunger (Right) */}
        <div className="w-[396px] max-w-full flex justify-between items-end mb-1 px-1">
          {/* Left Side: Armor and Health */}
          <div className="flex flex-col gap-0.5">
            {armor > 0 && <div className="flex gap-0.5">{renderArmor()}</div>}
            <div className="flex gap-0.5">{renderHearts()}</div>
          </div>

          {/* Right Side: Hunger */}
          <div className="flex gap-0.5 justify-end">{renderHunger()}</div>
        </div>

        {/* Experience Bar */}
        <div className="relative w-[396px] max-w-full h-2 bg-black/80 border border-gray-800 rounded-sm overflow-hidden mb-1 flex items-center">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-lime-400 transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, expProgress * 100))}%` }}
          />
          {/* Level number in center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-lime-400 mc-text-shadow-sm -mt-2">
              {level}
            </span>
          </div>
        </div>

        {/* 9-Slot Hotbar */}
        <div className="flex bg-[#8b8b8b] border-2 border-black/80 p-0.5 rounded shadow-lg max-w-full overflow-x-auto">
          {hotbar.map((item, idx) => {
            const isSelected = idx === selectedSlot;
            const iconUrl = item ? (item.type === 'tool' ? getItemIcon(item.id) : getBlockDataUrl(item.blockType || item.id)) : null;

            return (
              <div
                key={idx}
                id={`mc-hotbar-slot-${idx}`}
                onClick={() => {
                  soundManager.playClick();
                  onSelectSlot(idx);
                }}
                className={`mc-slot ${isSelected ? 'selected' : ''} cursor-pointer`}
              >
                {/* Slot index number label (small corner) */}
                <span className="absolute top-0.5 left-1 text-[8px] text-gray-400 pointer-events-none">
                  {idx + 1}
                </span>

                {/* Item Icon */}
                {iconUrl && (
                  <img
                    src={iconUrl}
                    alt={item?.name || ''}
                    className="w-8 h-8 object-contain pointer-events-none"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}

                {/* Item Stack Count */}
                {item && item.count > 1 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white mc-text-shadow pointer-events-none">
                    {item.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
