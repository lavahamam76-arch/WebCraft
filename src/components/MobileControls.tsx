import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pickaxe,
  Box,
  ArrowUpCircle,
  MessageSquare,
  Backpack,
  Pause,
  Info,
  Shield,
  Zap,
} from 'lucide-react';

interface MobileControlsProps {
  onDirectionChange: (code: string, pressed: boolean) => void;
  onJump: (pressed: boolean) => void;
  onMineStart: () => void;
  onMineEnd: () => void;
  onPlace: () => void;
  onToggleSneak: () => void;
  isSneaking: boolean;
  onToggleSprint: () => void;
  isSprinting: boolean;
  onOpenInventory: () => void;
  onOpenChat: () => void;
  onOpenPause: () => void;
  onToggleF3: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  onJump,
  onMineStart,
  onMineEnd,
  onPlace,
  onToggleSneak,
  isSneaking,
  onToggleSprint,
  isSprinting,
  onOpenInventory,
  onOpenChat,
  onOpenPause,
  onToggleF3,
}) => {
  // Prevent default touch behaviors like scrolling or pinch zoom on the controls
  const handleTouchStart = (fn: () => void) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  const handleTouchEnd = (fn: () => void) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 font-mono">
      {/* Top Mobile Bar */}
      <div className="absolute top-2 left-0 right-0 px-3 flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Pause */}
          <button
            type="button"
            className="w-10 h-10 bg-black/60 active:bg-black/90 border-2 border-gray-600 rounded flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            onTouchStart={handleTouchStart(onOpenPause)}
            onClick={onOpenPause}
            title="Pause Menu"
          >
            <Pause size={18} />
          </button>

          {/* F3 Debug */}
          <button
            type="button"
            className="px-2.5 h-10 bg-black/60 active:bg-black/90 border-2 border-gray-600 rounded flex items-center justify-center text-yellow-300 font-bold text-xs shadow-lg active:scale-95 transition-transform"
            onTouchStart={handleTouchStart(onToggleF3)}
            onClick={onToggleF3}
            title="F3 Debug"
          >
            <Info size={14} className="mr-1" /> F3
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat */}
          <button
            type="button"
            className="w-10 h-10 bg-black/60 active:bg-black/90 border-2 border-gray-600 rounded flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            onTouchStart={handleTouchStart(onOpenChat)}
            onClick={onOpenChat}
            title="Open Chat"
          >
            <MessageSquare size={18} />
          </button>

          {/* Inventory */}
          <button
            type="button"
            className="w-10 h-10 bg-black/60 active:bg-black/90 border-2 border-amber-600/80 rounded flex items-center justify-center text-amber-300 shadow-lg active:scale-95 transition-transform"
            onTouchStart={handleTouchStart(onOpenInventory)}
            onClick={onOpenInventory}
            title="Open Inventory"
          >
            <Backpack size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Left: D-Pad */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div className="relative w-40 h-40 bg-black/30 rounded-full border border-white/10 backdrop-blur-xs p-1 flex items-center justify-center">
          {/* Up / Forward */}
          <button
            type="button"
            className="absolute top-1 left-13 w-14 h-14 bg-black/60 active:bg-white/30 border border-gray-500 rounded-t-lg flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            onTouchStart={handleTouchStart(() => onDirectionChange('KeyW', true))}
            onTouchEnd={handleTouchEnd(() => onDirectionChange('KeyW', false))}
            onMouseDown={() => onDirectionChange('KeyW', true)}
            onMouseUp={() => onDirectionChange('KeyW', false)}
            title="Move Forward"
          >
            <ChevronUp size={28} />
          </button>

          {/* Down / Backward */}
          <button
            type="button"
            className="absolute bottom-1 left-13 w-14 h-14 bg-black/60 active:bg-white/30 border border-gray-500 rounded-b-lg flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            onTouchStart={handleTouchStart(() => onDirectionChange('KeyS', true))}
            onTouchEnd={handleTouchEnd(() => onDirectionChange('KeyS', false))}
            onMouseDown={() => onDirectionChange('KeyS', true)}
            onMouseUp={() => onDirectionChange('KeyS', false)}
            title="Move Backward"
          >
            <ChevronDown size={28} />
          </button>

          {/* Left */}
          <button
            type="button"
            className="absolute top-13 left-1 w-14 h-14 bg-black/60 active:bg-white/30 border border-gray-500 rounded-l-lg flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            onTouchStart={handleTouchStart(() => onDirectionChange('KeyA', true))}
            onTouchEnd={handleTouchEnd(() => onDirectionChange('KeyA', false))}
            onMouseDown={() => onDirectionChange('KeyA', true)}
            onMouseUp={() => onDirectionChange('KeyA', false)}
            title="Move Left"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Right */}
          <button
            type="button"
            className="absolute top-13 right-1 w-14 h-14 bg-black/60 active:bg-white/30 border border-gray-500 rounded-r-lg flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            onTouchStart={handleTouchStart(() => onDirectionChange('KeyD', true))}
            onTouchEnd={handleTouchEnd(() => onDirectionChange('KeyD', false))}
            onMouseDown={() => onDirectionChange('KeyD', true)}
            onMouseUp={() => onDirectionChange('KeyD', false)}
            title="Move Right"
          >
            <ChevronRight size={28} />
          </button>

          {/* Center Button: Sneak */}
          <button
            type="button"
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all shadow-lg active:scale-95 ${
              isSneaking
                ? 'bg-amber-600/90 border-amber-300 text-white'
                : 'bg-black/70 border-gray-500 text-gray-300'
            }`}
            onTouchStart={handleTouchStart(onToggleSneak)}
            onClick={onToggleSneak}
            title="Sneak / Crouch"
          >
            <Shield size={16} />
          </button>
        </div>

        {/* Sprint / Run button below D-Pad */}
        <button
          type="button"
          className={`mt-2 ml-7 px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
            isSprinting
              ? 'bg-emerald-600 border-emerald-300 text-white'
              : 'bg-black/60 border-gray-600 text-gray-300'
          }`}
          onTouchStart={handleTouchStart(onToggleSprint)}
          onClick={onToggleSprint}
          title="Sprint Toggle"
        >
          <Zap size={14} className={isSprinting ? 'text-yellow-300' : ''} />
          {isSprinting ? 'SPRINT ON' : 'WALK'}
        </button>
      </div>

      {/* Bottom Right: Action Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Place Block / Use Item Button */}
          <button
            type="button"
            className="w-16 h-16 rounded-full bg-blue-600/80 active:bg-blue-500 border-2 border-blue-300 shadow-xl flex flex-col items-center justify-center text-white active:scale-95 transition-all"
            onTouchStart={handleTouchStart(onPlace)}
            onClick={onPlace}
            title="Place Block"
          >
            <Box size={22} />
            <span className="text-[10px] font-bold tracking-wider mt-0.5">PLACE</span>
          </button>

          {/* Mine / Attack Button */}
          <button
            type="button"
            className="w-16 h-16 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-300 shadow-xl flex flex-col items-center justify-center text-white active:scale-95 transition-all"
            onTouchStart={handleTouchStart(onMineStart)}
            onTouchEnd={handleTouchEnd(onMineEnd)}
            onMouseDown={onMineStart}
            onMouseUp={onMineEnd}
            title="Mine Block / Attack"
          >
            <Pickaxe size={22} />
            <span className="text-[10px] font-bold tracking-wider mt-0.5">MINE</span>
          </button>
        </div>

        {/* Jump Button */}
        <button
          type="button"
          className="w-20 h-20 rounded-full bg-emerald-600/80 active:bg-emerald-500 border-3 border-emerald-300 shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-all"
          onTouchStart={handleTouchStart(() => onJump(true))}
          onTouchEnd={handleTouchEnd(() => onJump(false))}
          onMouseDown={() => onJump(true)}
          onMouseUp={() => onJump(false)}
          title="Jump"
        >
          <ArrowUpCircle size={30} />
          <span className="text-xs font-bold tracking-widest mt-0.5">JUMP</span>
        </button>
      </div>
    </div>
  );
};
