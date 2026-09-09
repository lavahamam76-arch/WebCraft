import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { ScreenType, ServerEntry, GameSettings } from './types/minecraft';
import { TitleScreen } from './components/TitleScreen';
import { MultiplayerMenu } from './components/MultiplayerMenu';
import {
  AddEditServerModal,
  DirectConnectModal,
} from './components/ServerDialogs';
import { OptionsModal } from './components/OptionsModal';
import { MinecraftGame } from './components/MinecraftGame';
import { LandscapeNotice } from './components/LandscapeNotice';
import { soundManager } from './minecraft/audio';

const STORAGE_SERVERS_KEY = 'minecraft_web_servers_1_21_4';
const STORAGE_SETTINGS_KEY = 'minecraft_web_settings_1_21_4';

const INITIAL_SERVERS: ServerEntry[] = [
  {
    id: 'vanilla-1214',
    name: 'Vanilla 1.21.4 Official Lobby',
    address: 'lobby.minecraft.net:25565',
    isLocalRoom: true,
  },
  {
    id: 'hypixel',
    name: 'Hypixel Network',
    address: 'mc.hypixel.net',
  },
  {
    id: 'pvp-hub',
    name: '1.21.4 Anarchy & Survival',
    address: 'anarchy.vanilla.org:25565',
  },
  {
    id: 'cubecraft',
    name: 'CubeCraft Games',
    address: 'play.cubecraft.net',
  },
];

const DEFAULT_SETTINGS: GameSettings = {
  fov: 70,
  renderDistance: 6,
  masterVolume: 80,
  guiScale: 'auto',
  username: 'Steve',
  skin: 'steve',
};

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('title');
  const [servers, setServers] = useState<ServerEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SERVERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SERVERS;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [selectedServer, setSelectedServer] = useState<ServerEntry | null>(null);
  const [editingServer, setEditingServer] = useState<ServerEntry | null>(null);
  const [prevScreen, setPrevScreen] = useState<ScreenType>('title');

  // Direct Orientation & Virtual Landscape Control
  const [isVirtualLandscape, setIsVirtualLandscape] = useState(false);
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const handleOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      if (!portrait) {
        setIsVirtualLandscape(false);
      }
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Persist servers
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SERVERS_KEY, JSON.stringify(servers));
    } catch {
      // ignore
    }
  }, [servers]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Connect to Server flow:
  // Transfer directly to MinecraftGame where the authentic TCP proxy connection
  // and real background diagnostics screen live!
  const handleJoinServer = (server: ServerEntry) => {
    soundManager.playClick();
    setSelectedServer(server);
    setScreen('ingame');
  };

  // Direct connection
  const handleDirectConnect = (address: string) => {
    const directServer: ServerEntry = {
      id: 'direct_' + Date.now(),
      name: address,
      address,
    };
    handleJoinServer(directServer);
  };

  // Add server
  const handleSaveNewServer = (newServer: ServerEntry) => {
    setServers((prev) => [...prev, newServer]);
    setScreen('multiplayer');
  };

  // Edit server
  const handleSaveEditServer = (updated: ServerEntry) => {
    setServers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingServer(null);
    setScreen('multiplayer');
  };

  // Delete server
  const handleDeleteServer = (serverToDelete: ServerEntry) => {
    soundManager.playClick();
    if (window.confirm(`Are you sure you want to remove '${serverToDelete.name}'?`)) {
      setServers((prev) => prev.filter((s) => s.id !== serverToDelete.id));
    }
  };

  // Virtual Landscape CSS transform when upright phone
  const containerStyle: React.CSSProperties =
    isVirtualLandscape && isPortrait
      ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vh',
          height: '100vw',
          transform: 'rotate(90deg) translateY(-100%)',
          transformOrigin: 'top left',
          overflow: 'hidden',
          zIndex: 40,
        }
      : {};

  return (
    <div
      id="minecraft-app-root"
      style={containerStyle}
      className="w-full h-screen overflow-hidden bg-black select-none relative"
    >
      {/* Landscape Guidance Modal with Direct Rotate button */}
      <LandscapeNotice
        isVirtualLandscape={isVirtualLandscape}
        onToggleVirtualLandscape={() => setIsVirtualLandscape(true)}
      />

      {/* Floating Orientation Toggle (Only on upright phones) */}
      {isPortrait && (
        <button
          type="button"
          onClick={() => setIsVirtualLandscape((prev) => !prev)}
          className="fixed top-2 right-2 z-50 bg-black/85 hover:bg-black text-yellow-400 border border-yellow-500/60 px-3 py-1.5 rounded text-[11px] font-minecraft flex items-center gap-1.5 shadow-xl active:scale-95 transition-all backdrop-blur-xs"
        >
          <RotateCw size={13} />
          {isVirtualLandscape ? 'Dikey Mod' : 'Yatay Mod'}
        </button>
      )}

      {/* 1. Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          onOpenMultiplayer={() => setScreen('multiplayer')}
          onOptions={() => {
            setPrevScreen('title');
            setScreen('options');
          }}
          username={settings.username}
          skin={settings.skin}
          onChangeUsername={(name, skin) => setSettings((s) => ({ ...s, username: name, skin }))}
        />
      )}

      {/* 2. Multiplayer Server List */}
      {screen === 'multiplayer' && (
        <MultiplayerMenu
          servers={servers}
          onJoinServer={handleJoinServer}
          onAddServer={() => setScreen('add_server')}
          onEditServer={(srv) => {
            setEditingServer(srv);
            setScreen('edit_server');
          }}
          onDeleteServer={handleDeleteServer}
          onDirectConnect={() => setScreen('direct_connect')}
          onBack={() => setScreen('title')}
          username={settings.username}
          onOpenProfile={() => {
            setPrevScreen('multiplayer');
            setScreen('options');
          }}
        />
      )}

      {/* 3. Add Server Dialog */}
      {screen === 'add_server' && (
        <AddEditServerModal
          onSave={handleSaveNewServer}
          onCancel={() => setScreen('multiplayer')}
        />
      )}

      {/* 4. Edit Server Dialog */}
      {screen === 'edit_server' && editingServer && (
        <AddEditServerModal
          isEdit
          initialServer={editingServer}
          onSave={handleSaveEditServer}
          onCancel={() => {
            setEditingServer(null);
            setScreen('multiplayer');
          }}
        />
      )}

      {/* 5. Direct Connect Dialog */}
      {screen === 'direct_connect' && (
        <DirectConnectModal
          onConnect={handleDirectConnect}
          onCancel={() => setScreen('multiplayer')}
        />
      )}

      {/* 6. Options Modal */}
      {screen === 'options' && (
        <OptionsModal
          settings={settings}
          onSaveSettings={(newSettings) => setSettings(newSettings)}
          onClose={() => setScreen(prevScreen)}
        />
      )}

      {/* 7. Active In-Game Screen */}
      {screen === 'ingame' && selectedServer && (
        <MinecraftGame
          server={selectedServer}
          settings={settings}
          onDisconnect={() => {
            setScreen('multiplayer');
            setSelectedServer(null);
          }}
          onOptions={() => {
            setPrevScreen('ingame');
            setScreen('options');
          }}
        />
      )}
    </div>
  );
}
