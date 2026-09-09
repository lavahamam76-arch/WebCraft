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
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        <h2 className="text-base font-bold text-gray-200 mc-text-shadow mb-4">
          Game Menu
        </h2>

        <button
          id="mc-btn-back-to-game"
          onClick={() => {
            soundManager.playClick();
            onResume();
          }}
          className="mc-btn w-full py-2.5 text-xs text-yellow-200"
        >
          Back to Game
        </button>

        <div className="flex gap-2 w-full">
          <button
            disabled
            className="mc-btn flex-1 py-2 text-xs opacity-60 cursor-not-allowed"
          >
            Advancements
          </button>
          <button
            disabled
            className="mc-btn flex-1 py-2 text-xs opacity-60 cursor-not-allowed"
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
          className="mc-btn w-full py-2 text-xs"
        >
          Options...
        </button>

        <button
          id="mc-btn-disconnect"
          onClick={() => {
            soundManager.playClick();
            onDisconnect();
          }}
          className="mc-btn w-full py-2.5 text-xs text-red-300 border-red-800"
        >
          Disconnect
        </button>

        <div className="text-[10px] text-gray-400 mc-text-shadow mt-4 text-center">
          Connected to: <span className="text-gray-200">{serverName}</span>
        </div>
      </div>
    </div>
  );
};
