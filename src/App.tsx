import React, { useState, useEffect } from 'react';
import { ScreenType, ServerEntry, GameSettings } from './types/minecraft';
import { TitleScreen } from './components/TitleScreen';
import { MultiplayerMenu } from './components/MultiplayerMenu';
import {
  AddEditServerModal,
  DirectConnectModal,
  ConnectingScreen,
} from './components/ServerDialogs';
import { OptionsModal } from './components/OptionsModal';
import { MinecraftGame } from './components/MinecraftGame';
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
  const [connectingStage, setConnectingStage] = useState('Connecting to the server...');
  const [prevScreen, setPrevScreen] = useState<ScreenType>('title');

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

  // Connect to Server flow
  const handleJoinServer = (server: ServerEntry) => {
    setSelectedServer(server);
    setScreen('connecting');
    setConnectingStage('Connecting to the server...');

    // Authentic login stage sequence
    const t1 = setTimeout(() => {
      setConnectingStage('Logging in (Protocol 768 / 1.21.4)...');
    }, 600);

    const t2 = setTimeout(() => {
      setConnectingStage('Loading terrain...');
    }, 1200);

    const t3 = setTimeout(() => {
      soundManager.playPop();
      setScreen('ingame');
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
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

  return (
    <div className="w-full h-screen overflow-hidden bg-black select-none">
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

      {/* 6. Connecting / Loading Screen */}
      {screen === 'connecting' && selectedServer && (
        <ConnectingScreen
          serverName={selectedServer.name}
          stage={connectingStage}
          onCancel={() => {
            setScreen('multiplayer');
            setSelectedServer(null);
          }}
        />
      )}

      {/* 7. Options Modal */}
      {screen === 'options' && (
        <OptionsModal
          settings={settings}
          onSaveSettings={(newSettings) => setSettings(newSettings)}
          onClose={() => setScreen(prevScreen)}
        />
      )}

      {/* 8. Active In-Game Screen */}
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
