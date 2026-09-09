import React, { useState } from 'react';
import { ServerEntry } from '../types/minecraft';
import { soundManager } from '../minecraft/audio';

interface AddEditServerModalProps {
  initialServer?: ServerEntry;
  onSave: (server: ServerEntry) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export const AddEditServerModal: React.FC<AddEditServerModalProps> = ({
  initialServer,
  onSave,
  onCancel,
  isEdit = false,
}) => {
  const [name, setName] = useState(initialServer?.name || 'Minecraft Server');
  const [address, setAddress] = useState(initialServer?.address || '');
  const [resourcePacks, setResourcePacks] = useState<'enabled' | 'disabled' | 'prompt'>(
    initialServer?.resourcePacks || 'prompt'
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    soundManager.playClick();
    onSave({
      id: initialServer?.id || 'custom_' + Date.now(),
      name: name.trim() || 'Minecraft Server',
      address: address.trim(),
      resourcePacks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 mc-dirt-bg flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md flex flex-col items-center">
        <h2 className="text-base font-bold text-gray-200 mc-text-shadow mb-6">
          {isEdit ? 'Edit Server Info' : 'Add Server'}
        </h2>

        <form onSubmit={handleSave} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 mc-text-shadow">Server Name</label>
            <input
              id="mc-server-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mc-input text-xs w-full"
              placeholder="Minecraft Server"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 mc-text-shadow">Server Address</label>
            <input
              id="mc-server-address-input"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mc-input text-xs w-full"
              placeholder="e.g. mc.hypixel.net or localhost:25565"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 mc-text-shadow">Server Resource Packs</label>
            <button
              type="button"
              id="mc-server-resource-packs-btn"
              onClick={() => {
                soundManager.playClick();
                setResourcePacks((curr) => {
                  if (curr === 'prompt') return 'enabled';
                  if (curr === 'enabled') return 'disabled';
                  return 'prompt';
                });
              }}
              className="mc-btn w-full py-2 text-xs capitalize"
            >
              Server Resource Packs: {resourcePacks}
            </button>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              id="mc-server-save-done-btn"
              disabled={!address.trim()}
              className="mc-btn flex-1 py-2 text-xs text-yellow-200"
            >
              Done
            </button>
            <button
              type="button"
              id="mc-server-save-cancel-btn"
              onClick={() => {
                soundManager.playClick();
                onCancel();
              }}
              className="mc-btn flex-1 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DirectConnectModalProps {
  onConnect: (address: string) => void;
  onCancel: () => void;
}

export const DirectConnectModal: React.FC<DirectConnectModalProps> = ({ onConnect, onCancel }) => {
  const [address, setAddress] = useState('lobby.minecraft.net:25565');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    soundManager.playClick();
    onConnect(address.trim());
  };

  return (
    <div className="fixed inset-0 z-50 mc-dirt-bg flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md flex flex-col items-center">
        <h2 className="text-base font-bold text-gray-200 mc-text-shadow mb-6">
          Direct Connection
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 mc-text-shadow">Server Address</label>
            <input
              id="mc-direct-address-input"
              type="text"
              required
              autoFocus
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mc-input text-xs w-full"
              placeholder="e.g. mc.hypixel.net or 127.0.0.1:25565"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              id="mc-direct-join-btn"
              disabled={!address.trim()}
              className="mc-btn flex-1 py-2 text-xs text-yellow-200"
            >
              Join Server
            </button>
            <button
              type="button"
              id="mc-direct-cancel-btn"
              onClick={() => {
                soundManager.playClick();
                onCancel();
              }}
              className="mc-btn flex-1 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ConnectingScreenProps {
  serverName: string;
  stage: string;
  onCancel: () => void;
}

export const ConnectingScreen: React.FC<ConnectingScreenProps> = ({ serverName, stage, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 mc-dirt-bg flex flex-col items-center justify-center p-4 select-none">
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-sm text-gray-300 mc-text-shadow">Connecting to {serverName}</h2>
        <div className="text-base font-bold text-yellow-300 mc-text-shadow animate-pulse">
          {stage}
        </div>

        <div className="mt-8">
          <button
            id="mc-connecting-cancel-btn"
            onClick={() => {
              soundManager.playClick();
              onCancel();
            }}
            className="mc-btn px-8 py-2 text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
