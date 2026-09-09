export type ScreenType =
  | 'title'
  | 'multiplayer'
  | 'direct_connect'
  | 'add_server'
  | 'edit_server'
  | 'options'
  | 'connecting'
  | 'ingame';

export interface ServerEntry {
  id: string;
  name: string;
  address: string;
  resourcePacks?: 'enabled' | 'disabled' | 'prompt';
  isLocalRoom?: boolean;
}

export interface ServerPingResult {
  online: boolean;
  version?: {
    name: string;
    protocol: number;
  };
  players?: {
    max: number;
    online: number;
    sample?: Array<{ name: string; id: string }>;
  };
  description?: any;
  favicon?: string;
  latency?: number;
  error?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  type: 'block' | 'tool' | 'food' | 'material';
  blockType?: string;
}

export interface TargetedBlockInfo {
  name: string;
  type: string;
  x: number;
  y: number;
  z: number;
  hardness: number;
  tool: string;
  drops: string;
}

export type GameMode = 'survival' | 'creative' | 'spectator';

export interface ChatMessage {
  id: string;
  sender?: string;
  text: string;
  system?: boolean;
  timestamp: number;
}

export interface MobEntityData {
  id: string;
  type: 'pig' | 'cow' | 'zombie' | 'skeleton';
  x: number;
  y: number;
  z: number;
  yaw: number;
  health: number;
}

export interface RemotePlayerData {
  id: string;
  username: string;
  skin: string;
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  heldItem?: string;
}

export interface GameSettings {
  fov: number; // 30 - 110 (default 70, Quake Pro 110)
  renderDistance: number; // 2 - 16 chunks (default 6)
  masterVolume: number; // 0 - 100
  guiScale: 'auto' | 'small' | 'normal' | 'large';
  username: string;
  skin: 'steve' | 'alex';
}
