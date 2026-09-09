import React, { useState } from 'react';
import { soundManager } from '../minecraft/audio';
import { User, ShieldAlert } from 'lucide-react';

interface TitleScreenProps {
  onOpenMultiplayer: () => void;
  onOptions: () => void;
  username: string;
  skin: 'steve' | 'alex';
  onChangeUsername: (name: string, skin: 'steve' | 'alex') => void;
}

const SPLASH_TEXTS = [
  'Web Edition 1.21.4!',
  'Multiplayer Only!',
  'Now with real server ping!',
  '100% Vanilla!',
  'Don\'t dig straight down!',
  'As seen on WebGL!',
  'Check out the server MOTD!',
  'Creeper? Awwww man!',
  'Press F3 for debug!',
  'WebSocket enabled!',
  'Supports 1.21.4 protocol!',
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onOpenMultiplayer,
  onOptions,
  username,
  skin,
  onChangeUsername,
}) => {
  const [splashText] = useState(() => {
    return SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempName, setTempName] = useState(username);
  const [tempSkin, setTempSkin] = useState<'steve' | 'alex'>(skin);

  const handleClick = (action: () => void) => {
    soundManager.playClick();
    action();
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] mc-dirt-bg flex flex-col items-center justify-between p-2 sm:p-4 md:p-6 select-none overflow-y-auto overflow-x-hidden">
      {/* Top Bar / Profile */}
      <div className="w-full max-w-4xl flex justify-between items-center z-10 py-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-yellow-300 mc-text-shadow">Java Edition 1.21.4</span>
        </div>
        <button
          id="mc-player-profile-btn"
          onClick={() => {
            soundManager.playClick();
            setTempName(username);
            setTempSkin(skin);
            setShowProfileModal(true);
          }}
          className="mc-btn flex items-center gap-1.5 text-[10px] sm:text-xs py-1 px-2 sm:px-3"
        >
          <User size={13} />
          <span>{username}</span>
          <span className="text-gray-300">({skin === 'steve' ? 'Steve' : 'Alex'})</span>
        </button>
      </div>

      {/* Center Logo & Splash */}
      <div className="relative flex flex-col items-center my-auto py-1 sm:py-3">
        <div className="relative flex flex-col items-center">
          {/* Authentic Minecraft Java Logo */}
          <div className="text-center tracking-widest leading-none">
            <div className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-200 tracking-wider mc-text-shadow border-b-2 sm:border-b-4 border-gray-700 pb-1 sm:pb-2">
              <span className="text-gray-400">MINE</span>
              <span className="text-gray-200">CRAFT</span>
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm tracking-widest text-gray-400 font-bold uppercase mt-1 mc-text-shadow">
              JAVA EDITION - 1.21.4
            </div>
          </div>

          {/* Yellow Bouncing Splash Text */}
          <div className="absolute -bottom-5 -right-4 sm:-right-8 md:-right-12 z-20 pointer-events-none">
            <span className="mc-splash whitespace-nowrap text-[10px] sm:text-xs md:text-sm">
              {splashText}
            </span>
          </div>
        </div>

        {/* Java Main Menu Buttons */}
        <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col gap-1.5 sm:gap-2.5 w-64 sm:w-80 md:w-96">
          {/* Singleplayer (Disabled with Tooltip) */}
          <div className="relative group w-full">
            <button
              id="mc-btn-singleplayer"
              disabled
              className="mc-btn w-full py-1.5 sm:py-2 text-[11px] sm:text-xs cursor-not-allowed opacity-60"
            >
              Singleplayer
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 -top-9 hidden group-hover:flex items-center gap-1.5 bg-black/90 border border-yellow-400 text-yellow-300 text-[10px] px-2.5 py-1 whitespace-nowrap z-30 mc-text-shadow rounded shadow-lg pointer-events-none">
              <ShieldAlert size={12} className="text-yellow-400" />
              <span>Singleplayer is disabled. Multiplayer only!</span>
            </div>
          </div>

          {/* Multiplayer (Active) */}
          <button
            id="mc-btn-multiplayer"
            onClick={() => handleClick(onOpenMultiplayer)}
            className="mc-btn w-full py-1.5 sm:py-2 text-[11px] sm:text-xs text-yellow-200"
          >
            Multiplayer
          </button>

          {/* Minecraft Realms (Disabled) */}
          <button
            id="mc-btn-realms"
            disabled
            className="mc-btn w-full py-1.5 sm:py-2 text-[10px] sm:text-xs opacity-60 cursor-not-allowed"
          >
            Minecraft Realms
          </button>

          {/* Options & Quit Game */}
          <div className="flex gap-2 sm:gap-3 w-full mt-1">
            <button
              id="mc-btn-options"
              onClick={() => handleClick(onOptions)}
              className="mc-btn flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs"
            >
              Options...
            </button>
            <button
              id="mc-btn-quit"
              onClick={() => {
                soundManager.playClick();
                window.location.reload();
              }}
              className="mc-btn flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs"
            >
              Quit Game
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full max-w-5xl flex justify-between items-end text-[9px] sm:text-[10px] text-gray-300 mc-text-shadow z-10 py-1">
        <div>
          <div>Minecraft 1.21.4 (Vanilla / Web Edition)</div>
          <div className="text-[8px] sm:text-[9px] text-gray-400">Protocol 768 / Full-Stack WebSocket Proxy</div>
        </div>
        <div className="text-right">
          <div>Copyright Mojang AB. Do not distribute!</div>
        </div>
      </div>

      {/* Player Profile & Skin Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 overflow-y-auto">
          <div className="mc-stone-bg border-4 border-gray-600 p-4 sm:p-6 w-full max-w-md shadow-2xl flex flex-col gap-3 sm:gap-4 my-auto">
            <h2 className="text-center text-sm sm:text-base text-yellow-300 mc-text-shadow">
              Edit Player Profile
            </h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-300 mc-text-shadow">Player Username</label>
              <input
                id="mc-player-name-input"
                type="text"
                maxLength={16}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="mc-input text-xs"
                placeholder="Steve"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-300 mc-text-shadow">Default Skin Model</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setTempSkin('steve')}
                  className={`mc-btn py-1.5 sm:py-2 text-xs ${tempSkin === 'steve' ? 'border-yellow-400 text-yellow-300' : ''}`}
                >
                  Classic (Steve)
                </button>
                <button
                  type="button"
                  onClick={() => setTempSkin('alex')}
                  className={`mc-btn py-1.5 sm:py-2 text-xs ${tempSkin === 'alex' ? 'border-yellow-400 text-yellow-300' : ''}`}
                >
                  Slim (Alex)
                </button>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-4">
              <button
                id="mc-save-profile-btn"
                onClick={() => {
                  soundManager.playClick();
                  const finalName = tempName.trim() || 'Steve';
                  onChangeUsername(finalName, tempSkin);
                  setShowProfileModal(false);
                }}
                className="mc-btn flex-1 py-1.5 sm:py-2 text-xs text-yellow-300"
              >
                Save
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowProfileModal(false);
                }}
                className="mc-btn flex-1 py-1.5 sm:py-2 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
