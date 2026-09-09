import React from 'react';
import { soundManager } from '../minecraft/audio';

interface PauseMenuProps {
  onResume: () => void;
  onOptions: () => void;
  onDisconnect: () => void;
  serverName: string;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onOptions,
  onDisconnect,
  serverName,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col items-center gap-2 sm:gap-2.5 my-auto py-2">
        <h2 className="text-sm sm:text-base font-bold text-gray-200 mc-text-shadow mb-1 sm:mb-2">
          Game Menu
        </h2>

        <button
          id="mc-btn-back-to-game"
          onClick={() => {
            soundManager.playClick();
            onResume();
          }}
          className="mc-btn w-full py-1.5 sm:py-2 text-xs text-yellow-200"
        >
          Back to Game
        </button>

        <div className="flex gap-2 w-full">
          <button
            disabled
            className="mc-btn flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs opacity-60 cursor-not-allowed"
          >
            Advancements
          </button>
          <button
            disabled
            className="mc-btn flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs opacity-60 cursor-not-allowed"
          >
            Statistics
          </button>
        </div>

        <button
          id="mc-btn-pause-options"
          onClick={() => {
            soundManager.playClick();
            onOptions();
          }}
          className="mc-btn w-full py-1.5 sm:py-2 text-xs"
        >
          Options...
        </button>

        <button
          id="mc-btn-disconnect"
          onClick={() => {
            soundManager.playClick();
            onDisconnect();
          }}
          className="mc-btn w-full py-1.5 sm:py-2 text-xs text-red-300 border-red-800"
        >
          Disconnect
        </button>

        <div className="text-[10px] text-gray-400 mc-text-shadow mt-2 text-center">
          Connected to: <span className="text-gray-200">{serverName}</span>
        </div>
      </div>
    </div>
  );
};
