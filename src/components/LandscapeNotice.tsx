import React, { useState, useEffect } from 'react';
import { Smartphone, Maximize } from 'lucide-react';

interface LandscapeNoticeProps {
  onEnterLandscape?: () => void;
}

export const LandscapeNotice: React.FC<LandscapeNoticeProps> = ({ onEnterLandscape }) => {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;
  const handleRequestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // Attempt screen orientation lock if supported
      if (window.screen?.orientation && 'lock' in window.screen.orientation) {
        // @ts-ignore
        await window.screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // Fullscreen not permitted or ignored
    }
    if (onEnterLandscape) {
      onEnterLandscape();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center p-6 text-center select-none font-minecraft">
      {/* Background with Minecraft Dirt styling */}
      <div className="absolute inset-0 bg-[#4a3525] opacity-90" />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />

      <div className="relative z-10 max-w-sm w-full bg-[#2b2b2b] border-4 border-[#1e1e1e] p-6 rounded-lg shadow-2xl flex flex-col items-center">
        {/* Animated Phone Rotation Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-[#3a3a3a] border-2 border-[#555] rounded-2xl flex items-center justify-center shadow-inner animate-pulse">
            <Smartphone size={44} className="text-yellow-400 rotate-90 transition-transform duration-700" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-yellow-300 mc-text-shadow mb-3">
          Cihazınızı Yatay Tutunuz
        </h2>
        <p className="text-sm text-gray-300 mc-text-shadow leading-relaxed mb-6">
          Minecraft 1.21.4 Java Edition gerçek deneyim için <strong>yatay (landscape)</strong> ekranda çalışır. Lütfen telefonunuzu yana çevirin.
        </p>

        {/* Landscape & Fullscreen Action Button */}
        <button
          type="button"
          onClick={handleRequestFullscreen}
          className="w-full py-3 px-4 bg-[#4a7a28] hover:bg-[#5a9432] active:bg-[#3d6521] border-2 border-green-300 text-white font-bold text-sm rounded shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Maximize size={18} />
          Tam Ekran & Yatay Mod
        </button>
      </div>
    </div>
  );
};
