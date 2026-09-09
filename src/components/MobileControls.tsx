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
      <div className="absolute top-1.5 left-0 right-0 px-2 sm:px-4 flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pause */}
          <button
            type="button"
            className="w-8 h-8 sm:w-9 sm:h-9 bg-black/60 active:bg-black/90 border-2 border-gray-600 rounded flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            onTouchStart={handleTouchStart(onOpenPause)}
            onClick={onOpenPause}
            title="Pause Menu"
          >
            <Pause size={16} />
          </button>

          {/* F3 Debug */}
          <button
            type="button"
            className="px-2 h-8 sm:h-9 bg-black/60 active:bg-black/90 border-2 border-gray-600 rounded flex items-center justify-center text-yellow-300 font-bold text-[11px] sm:text-xs shadow-lg active:scale-95 transition-transform"
            onTouchStart={handleTouchStart(onToggleF3)}
            onClick={onToggleF3}
            title="F3 Debug"
          >
            <Info size={13} className="mr-0.5" /> F3
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Chat */}
          <button
            type="button"
            className="w-8 h-8 sm:w-9 sm:h-9 bg-black/60 active:bg-black/90 border-2 border-gray-600 rounded flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            onTouchStart={handleTouchStart(onOpenChat)}
            onClick={onOpenChat}
            title="Open Chat"
          >
            <MessageSquare size={16} />
          </button>

          {/* Inventory */}
          <button
            type="button"
            className="w-8 h-8 sm:w-9 sm:h-9 bg-black/60 active:bg-black/90 border-2 border-amber-600/80 rounded flex items-center justify-center text-amber-300 shadow-lg active:scale-95 transition-transform"
            onTouchStart={handleTouchStart(onOpenInventory)}
            onClick={onOpenInventory}
            title="Open Inventory"
          >
            <Backpack size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Left: D-Pad */}
      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 pointer-events-auto">
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-black/35 rounded-full border border-white/10 backdrop-blur-xs p-1 flex items-center justify-center">
          {/* Up / Forward */}
          <button
            type="button"
            className="absolute top-0.5 left-10 sm:left-12 w-11 h-11 sm:w-12 sm:h-12 bg-black/60 active:bg-white/30 border border-gray-500 rounded-t-lg flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            onTouchStart={handleTouchStart(() => onDirectionChange('KeyW', true))}
            onTouchEnd={handleTouchEnd(() => onDirectionChange('KeyW', false))}
            onMouseDown={() => onDirectionChange('KeyW', true)}
            onMouseUp={() => onDirectionChange('KeyW', false)}
            title="Move Forward"
          >
            <ChevronUp size={24} />
          </button>

          {/* Down / Backward */}
          <button
            type="button"
            className="absolute bottom-0.5 left-10 sm:left-12 w-11 h-11 sm:w-12 sm:h-12 bg-black/60 active:bg-white/30 border border-gray-500 rounded-b-lg flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            onTouchStart={handleTouchStart(() => onDirectionChange('KeyS', true))}
            onTouchEnd={handleTouchEnd(() => onDirectionChange('KeyS', false))}
            onMouseDown={() => onDirectionChange('KeyS', true)}
            onMouseUp={() => onDirectionChange('KeyS', false)}
            title="Move Backward"
          >
            <ChevronDown size={24} />
          </button>

          {/* Left */}
          <button
            type="button"
            className="absolute top-10 sm:top-12 left-0.5 w-11 h-11 sm:w-12 sm:h-12 bg-black/60 active:bg-white/30 border border-gray-500 rounded-l-lg flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            onTouchStart={handleTouchStart(() => onDirectionChange('KeyA', true))}
            onTouchEnd={handleTouchEnd(() => onDirectionChange('KeyA', false))}
            onMouseDown={() => onDirectionChange('KeyA', true)}
            onMouseUp={() => onDirectionChange('KeyA', false)}
            title="Move Left"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Right */}
          <button
            type="button"
            className="absolute top-10 sm:top-12 right-0.5 w-11 h-11 sm:w-12 sm:h-12 bg-black/60 active:bg-white/30 border border-gray-500 rounded-r-lg flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            onTouchStart={handleTouchStart(() => onDirectionChange('KeyD', true))}
            onTouchEnd={handleTouchEnd(() => onDirectionChange('KeyD', false))}
            onMouseDown={() => onDirectionChange('KeyD', true)}
            onMouseUp={() => onDirectionChange('KeyD', false)}
            title="Move Right"
          >
            <ChevronRight size={24} />
          </button>

          {/* Center Button: Sneak */}
          <button
            type="button"
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all shadow-lg active:scale-95 ${
              isSneaking
                ? 'bg-amber-600/90 border-amber-300 text-white'
                : 'bg-black/70 border-gray-500 text-gray-300'
            }`}
            onTouchStart={handleTouchStart(onToggleSneak)}
            onClick={onToggleSneak}
            title="Sneak / Crouch"
          >
            <Shield size={15} />
          </button>
        </div>

        {/* Sprint / Run button below D-Pad */}
        <button
          type="button"
          className={`mt-1 ml-4 sm:ml-5 px-3 py-1 rounded-full border text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95 transition-all ${
            isSprinting
              ? 'bg-emerald-600 border-emerald-300 text-white'
              : 'bg-black/60 border-gray-600 text-gray-300'
          }`}
          onTouchStart={handleTouchStart(onToggleSprint)}
          onClick={onToggleSprint}
          title="Sprint Toggle"
        >
          <Zap size={12} className={isSprinting ? 'text-yellow-300' : ''} />
          {isSprinting ? 'SPRINT ON' : 'WALK'}
        </button>
      </div>

      {/* Bottom Right: Action Buttons */}
      <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Place Block / Use Item Button */}
          <button
            type="button"
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-blue-600/80 active:bg-blue-500 border-2 border-blue-300 shadow-xl flex flex-col items-center justify-center text-white active:scale-95 transition-all"
            onTouchStart={handleTouchStart(onPlace)}
            onClick={onPlace}
            title="Place Block"
          >
            <Box size={18} />
            <span className="text-[9px] font-bold tracking-wider mt-0.5">PLACE</span>
          </button>

          {/* Mine / Attack Button */}
          <button
            type="button"
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-300 shadow-xl flex flex-col items-center justify-center text-white active:scale-95 transition-all"
            onTouchStart={handleTouchStart(onMineStart)}
            onTouchEnd={handleTouchEnd(onMineEnd)}
            onMouseDown={onMineStart}
            onMouseUp={onMineEnd}
            title="Mine Block / Attack"
          >
            <Pickaxe size={18} />
            <span className="text-[9px] font-bold tracking-wider mt-0.5">MINE</span>
          </button>
        </div>

        {/* Jump Button */}
        <button
          type="button"
          className="w-15 h-15 sm:w-17 sm:h-17 rounded-full bg-emerald-600/80 active:bg-emerald-500 border-2 sm:border-3 border-emerald-300 shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-all"
          onTouchStart={handleTouchStart(() => onJump(true))}
          onTouchEnd={handleTouchEnd(() => onJump(false))}
          onMouseDown={() => onJump(true)}
          onMouseUp={() => onJump(false)}
          title="Jump"
        >
          <ArrowUpCircle size={24} />
          <span className="text-[10px] font-bold tracking-widest mt-0.5">JUMP</span>
        </button>
      </div>
    </div>
  );
};
