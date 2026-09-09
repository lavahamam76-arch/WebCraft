import React, { useState } from 'react';
import { GameSettings } from '../types/minecraft';
import { soundManager } from '../minecraft/audio';

interface OptionsModalProps {
  settings: GameSettings;
  onSaveSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [fov, setFov] = useState(settings.fov);
  const [masterVolume, setMasterVolume] = useState(settings.masterVolume);
  const [renderDistance, setRenderDistance] = useState(settings.renderDistance);
  const [guiScale, setGuiScale] = useState(settings.guiScale);

  const handleDone = () => {
    soundManager.playClick();
    soundManager.setVolume(masterVolume);
    onSaveSettings({
      ...settings,
      fov,
      masterVolume,
      renderDistance,
      guiScale,
    });
    onClose();
  };

  const getFovLabel = (val: number) => {
    if (val === 70) return 'Normal (70)';
    if (val >= 110) return 'Quake Pro (110)';
    return `${val}`;
  };

  return (
    <div className="fixed inset-0 z-50 mc-dirt-bg flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl flex flex-col items-center">
        <h2 className="text-base font-bold text-gray-200 mc-text-shadow mb-6">
          Options
        </h2>

        {/* 2-Column Grid of Java Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6">
          {/* FOV Slider */}
          <div className="flex flex-col gap-1 mc-btn py-2 px-3">
            <div className="flex justify-between text-xs text-gray-200">
              <span>FOV:</span>
              <span className="text-yellow-300">{getFovLabel(fov)}</span>
            </div>
            <input
              type="range"
              min="40"
              max="110"
              step="5"
              value={fov}
              onChange={(e) => setFov(Number(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
          </div>

          {/* Master Volume */}
          <div className="flex flex-col gap-1 mc-btn py-2 px-3">
            <div className="flex justify-between text-xs text-gray-200">
              <span>Master Volume:</span>
              <span className="text-yellow-300">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={masterVolume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMasterVolume(v);
                soundManager.setVolume(v);
              }}
              className="w-full accent-yellow-400 cursor-pointer"
            />
          </div>

          {/* Render Distance */}
          <div className="flex flex-col gap-1 mc-btn py-2 px-3">
            <div className="flex justify-between text-xs text-gray-200">
              <span>Render Distance:</span>
              <span className="text-yellow-300">{renderDistance} chunks</span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              step="1"
              value={renderDistance}
              onChange={(e) => setRenderDistance(Number(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
          </div>

          {/* GUI Scale */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setGuiScale((curr) => {
                if (curr === 'auto') return 'small';
                if (curr === 'small') return 'normal';
                if (curr === 'normal') return 'large';
                return 'auto';
              });
            }}
            className="mc-btn py-3 text-xs capitalize"
          >
            GUI Scale: {guiScale}
          </button>
        </div>

        {/* Bottom Done Button */}
        <div className="w-full max-w-xs">
          <button
            id="mc-options-done-btn"
            onClick={handleDone}
            className="mc-btn w-full py-2.5 text-xs text-yellow-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
