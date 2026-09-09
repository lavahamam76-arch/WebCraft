import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Maximize2 } from 'lucide-react';

interface LandscapeNoticeProps {
  isVirtualLandscape?: boolean;
  onToggleVirtualLandscape?: () => void;
  onEnterLandscape?: () => void;
}

export const LandscapeNotice: React.FC<LandscapeNoticeProps> = ({
  isVirtualLandscape = false,
  onToggleVirtualLandscape,
  onEnterLandscape,
}) => {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      if (!portrait) setDismissed(false);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // If already in virtual landscape or physical landscape, or user dismissed, hide notice
  if (!isPortrait || isVirtualLandscape || dismissed) return null;

  const handleOneClickRotate = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (window.screen?.orientation && 'lock' in window.screen.orientation) {
        // @ts-ignore
        await window.screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {}

    if (onToggleVirtualLandscape) {
      onToggleVirtualLandscape();
    }
    if (onEnterLandscape) {
      onEnterLandscape();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/95 flex flex-col items-center justify-center p-4 text-center select-none font-minecraft">
      {/* Background with Minecraft Dirt styling */}
      <div className="absolute inset-0 bg-[#4a3525] opacity-80" />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

      <div className="relative z-10 max-w-sm w-full bg-[#2b2b2b] border-4 border-[#1e1e1e] p-6 rounded-lg shadow-2xl flex flex-col items-center">
        {/* Animated Phone Rotation Icon */}
        <div className="relative mb-5">
          <div className="w-16 h-16 bg-[#3a3a3a] border-2 border-[#555] rounded-2xl flex items-center justify-center shadow-inner">
            <Smartphone size={36} className="text-yellow-400 rotate-90 transition-transform duration-700" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-lg font-bold text-yellow-300 mc-text-shadow mb-2">
          Yatay Ekran Modu
        </h2>
        <p className="text-xs text-gray-300 mc-text-shadow leading-relaxed mb-5">
          Minecraft 1.21.4 Java Edition arayüzü yatay formatta çalışır. <strong>Telefonunuzu yana çevirmenize gerek kalmadan</strong> aşağıdaki butona basarak siteyi anında yatay yapabilirsiniz.
        </p>

        {/* Direct One-Click Landscape Button */}
        <button
          type="button"
          onClick={handleOneClickRotate}
          className="w-full py-3.5 px-4 mb-3 bg-[#4a7a28] hover:bg-[#5a9432] active:bg-[#3d6521] border-2 border-green-300 text-white font-bold text-sm rounded shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <RotateCw size={18} className="animate-spin-slow" />
          Siteyi Doğrudan Yatay Yap
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-400 hover:text-gray-200 underline py-1"
        >
          Telefonumu Kendim Yana Çevireceğim (Kapat)
        </button>
      </div>
    </div>
  );
};
