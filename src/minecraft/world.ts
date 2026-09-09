import * as THREE from 'three';

export type BlockId =
  | 'air'
  | 'dirt'
  | 'grass_block'
  | 'stone'
  | 'cobblestone'
  | 'oak_planks'
  | 'oak_log'
  | 'oak_leaves'
  | 'diamond_ore'
  | 'gold_ore'
  | 'iron_ore'
  | 'coal_ore'
  | 'bedrock'
  | 'sand'
  | 'water'
  | 'glass'
  | 'crafting_table'
  | 'furnace'
  | 'tnt'
  | 'obsidian'
  | 'glowstone'
  | 'bricks';

export interface BlockIntersection {
  blockX: number;
  blockY: number;
  blockZ: number;
  faceNormal: THREE.Vector3;
  adjacentX: number;
  adjacentY: number;
  adjacentZ: number;
  blockType: BlockId;
  distance: number;
}

export interface BlockMetadata {
  id: BlockId;
  name: string;
  hardness: number; // base hardness in seconds
  tool: 'Pickaxe' | 'Axe' | 'Shovel' | 'Hand';
  dropItem: {
    id: string;
    name: string;
    count: number;
    type: 'block' | 'tool' | 'food' | 'material';
    blockType?: string;
  } | null;
  xpReward: number;
}

export const BLOCK_METADATA: Record<BlockId, BlockMetadata> = {
  air: { id: 'air', name: 'Air', hardness: 0, tool: 'Hand', dropItem: null, xpReward: 0 },
  dirt: {
    id: 'dirt',
    name: 'Dirt',
    hardness: 0.5,
    tool: 'Shovel',
    dropItem: { id: 'dirt', name: 'Dirt', count: 1, type: 'block', blockType: 'dirt' },
    xpReward: 0,
  },
  grass_block: {
    id: 'grass_block',
    name: 'Grass Block',
    hardness: 0.6,
    tool: 'Shovel',
    dropItem: { id: 'dirt', name: 'Dirt', count: 1, type: 'block', blockType: 'dirt' },
    xpReward: 0,
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    hardness: 1.5,
    tool: 'Pickaxe',
    dropItem: { id: 'cobblestone', name: 'Cobblestone', count: 1, type: 'block', blockType: 'cobblestone' },
    xpReward: 0,
  },
  cobblestone: {
    id: 'cobblestone',
    name: 'Cobblestone',
    hardness: 2.0,
    tool: 'Pickaxe',
    dropItem: { id: 'cobblestone', name: 'Cobblestone', count: 1, type: 'block', blockType: 'cobblestone' },
    xpReward: 0,
  },
  oak_planks: {
    id: 'oak_planks',
    name: 'Oak Planks',
    hardness: 1.8,
    tool: 'Axe',
    dropItem: { id: 'oak_planks', name: 'Oak Planks', count: 1, type: 'block', blockType: 'oak_planks' },
    xpReward: 0,
  },
  oak_log: {
    id: 'oak_log',
    name: 'Oak Log',
    hardness: 2.0,
    tool: 'Axe',
    dropItem: { id: 'oak_log', name: 'Oak Log', count: 1, type: 'block', blockType: 'oak_log' },
    xpReward: 0,
  },
  oak_leaves: {
    id: 'oak_leaves',
    name: 'Oak Leaves',
    hardness: 0.25,
    tool: 'Hand',
    dropItem: { id: 'apple', name: 'Apple', count: 1, type: 'food' },
    xpReward: 0,
  },
  diamond_ore: {
    id: 'diamond_ore',
    name: 'Diamond Ore',
    hardness: 3.0,
    tool: 'Pickaxe',
    dropItem: { id: 'diamond', name: 'Diamond', count: 1, type: 'material' },
    xpReward: 10,
  },
  gold_ore: {
    id: 'gold_ore',
    name: 'Gold Ore',
    hardness: 3.0,
    tool: 'Pickaxe',
    dropItem: { id: 'gold_ore', name: 'Raw Gold', count: 1, type: 'material' },
    xpReward: 5,
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    hardness: 3.0,
    tool: 'Pickaxe',
    dropItem: { id: 'iron_ore', name: 'Raw Iron', count: 1, type: 'material' },
    xpReward: 3,
  },
  coal_ore: {
    id: 'coal_ore',
    name: 'Coal Ore',
    hardness: 3.0,
    tool: 'Pickaxe',
    dropItem: { id: 'coal', name: 'Coal', count: 1, type: 'material' },
    xpReward: 2,
  },
  bedrock: {
    id: 'bedrock',
    name: 'Bedrock',
    hardness: Infinity,
    tool: 'Pickaxe',
    dropItem: null,
    xpReward: 0,
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    hardness: 0.5,
    tool: 'Shovel',
    dropItem: { id: 'sand', name: 'Sand', count: 1, type: 'block', blockType: 'sand' },
    xpReward: 0,
  },
  water: { id: 'water', name: 'Water', hardness: Infinity, tool: 'Hand', dropItem: null, xpReward: 0 },
  glass: { id: 'glass', name: 'Glass', hardness: 0.3, tool: 'Hand', dropItem: null, xpReward: 0 },
  crafting_table: {
    id: 'crafting_table',
    name: 'Crafting Table',
    hardness: 2.2,
    tool: 'Axe',
    dropItem: { id: 'crafting_table', name: 'Crafting Table', count: 1, type: 'block', blockType: 'crafting_table' },
    xpReward: 0,
  },
  furnace: {
    id: 'furnace',
    name: 'Furnace',
    hardness: 3.5,
    tool: 'Pickaxe',
    dropItem: { id: 'furnace', name: 'Furnace', count: 1, type: 'block', blockType: 'furnace' },
    xpReward: 0,
  },
  tnt: {
    id: 'tnt',
    name: 'TNT',
    hardness: 0.1,
    tool: 'Hand',
    dropItem: { id: 'tnt', name: 'TNT', count: 1, type: 'block', blockType: 'tnt' },
    xpReward: 0,
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    hardness: 9.0,
    tool: 'Pickaxe',
    dropItem: { id: 'obsidian', name: 'Obsidian', count: 1, type: 'block', blockType: 'obsidian' },
    xpReward: 0,
  },
  glowstone: {
    id: 'glowstone',
    name: 'Glowstone',
    hardness: 0.35,
    tool: 'Hand',
    dropItem: { id: 'glowstone', name: 'Glowstone', count: 1, type: 'block', blockType: 'glowstone' },
    xpReward: 1,
  },
  bricks: {
    id: 'bricks',
    name: 'Bricks',
    hardness: 2.0,
    tool: 'Pickaxe',
    dropItem: { id: 'bricks', name: 'Bricks', count: 1, type: 'block', blockType: 'bricks' },
    xpReward: 0,
  },
};

export function getBlockMetadata(type: string): BlockMetadata {
  return (
    BLOCK_METADATA[type as BlockId] || {
      id: 'dirt',
      name: type.replace('_', ' ').toUpperCase(),
      hardness: 1.0,
      tool: 'Hand',
      dropItem: { id: type, name: type, count: 1, type: 'block', blockType: type },
      xpReward: 0,
    }
  );
}

export class VoxelWorld {
  // Store blocks in a fast Map: "x,y,z" => BlockId
  private blocks: Map<string, BlockId> = new Map();
  public readonly worldMinY = 0;
  public readonly worldMaxY = 64;

  constructor() {
    this.generateDefaultTerrain();
  }

  private key(x: number, y: number, z: number): string {
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  public getBlock(x: number, y: number, z: number): BlockId {
    const k = this.key(x, y, z);
    return this.blocks.get(k) || 'air';
  }

  public setBlock(x: number, y: number, z: number, type: BlockId) {
    const k = this.key(x, y, z);
    if (type === 'air') {
      this.blocks.delete(k);
    } else {
      this.blocks.set(k, type);
    }
  }

  public getAllBlocks(): Array<{ x: number; y: number; z: number; type: BlockId }> {
    const result: Array<{ x: number; y: number; z: number; type: BlockId }> = [];
    for (const [k, type] of this.blocks.entries()) {
      const [x, y, z] = k.split(',').map(Number);
      result.push({ x, y, z, type });
    }
    return result;
  }

  public isSolid(x: number, y: number, z: number): boolean {
    const block = this.getBlock(x, y, z);
    return block !== 'air' && block !== 'water';
  }

  // Generates classic Minecraft 1.21.4 Plains world chunk around (0,0)
  public generateDefaultTerrain() {
    this.blocks.clear();
    const radius = 24; // 48x48 block area

    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        // Bedrock at y = 0
        this.setBlock(x, 0, z, 'bedrock');

        // Height variation using simple sine waves
        const dist = Math.sqrt(x * x + z * z);
        const hill = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2;
        const height = Math.floor(4 + hill);

        // Stone up to height - 3
        for (let y = 1; y <= height - 3; y++) {
          // Scatter random ores
          const rand = Math.sin(x * 12.9898 + y * 78.233 + z * 45.164);
          if (y <= 3 && Math.abs(rand) < 0.05) {
            this.setBlock(x, y, z, 'diamond_ore');
          } else if (Math.abs(rand) < 0.08) {
            this.setBlock(x, y, z, 'iron_ore');
          } else if (Math.abs(rand) < 0.12) {
            this.setBlock(x, y, z, 'coal_ore');
          } else {
            this.setBlock(x, y, z, 'stone');
          }
        }

        // Dirt layer
        for (let y = Math.max(1, height - 2); y < height; y++) {
          this.setBlock(x, y, z, 'dirt');
        }

        // Top surface
        if (dist > 18 && Math.sin(x * 0.3) > 0.6) {
          // Water pond
          this.setBlock(x, height, z, 'sand');
        } else {
          this.setBlock(x, height, z, 'grass_block');
        }

        // Generate Oak Trees at specific positions
        if ((x === 6 && z === 5) || (x === -8 && z === 10) || (x === -12 && z === -8) || (x === 14 && z === -10)) {
          this.generateTree(x, height + 1, z);
        }
      }
    }
  }

  private generateTree(trunkX: number, trunkBaseY: number, trunkZ: number) {
    const height = 5;
    // Trunk
    for (let dy = 0; dy < height; dy++) {
      this.setBlock(trunkX, trunkBaseY + dy, trunkZ, 'oak_log');
    }
    // Leaves canopy
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = height - 2; ly <= height - 1; ly++) {
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && Math.random() > 0.5) continue;
          if (lx === 0 && lz === 0 && ly < height) continue;
          this.setBlock(trunkX + lx, trunkBaseY + ly, trunkZ + lz, 'oak_leaves');
        }
      }
    }
    // Top crown
    for (let lx = -1; lx <= 1; lx++) {
      for (let lz = -1; lz <= 1; lz++) {
        if (Math.abs(lx) === 1 && Math.abs(lz) === 1 && Math.random() > 0.4) continue;
        this.setBlock(trunkX + lx, trunkBaseY + height, trunkZ + lz, 'oak_leaves');
      }
    }
    this.setBlock(trunkX, trunkBaseY + height + 1, trunkZ, 'oak_leaves');
  }

  // Fast Voxel Raycasting (Amanatides & Woo DDA Algorithm)
  public raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance = 6
  ): BlockIntersection | null {
    const px = origin.x;
    const py = origin.y;
    const pz = origin.z;

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    let mapZ = Math.floor(pz);

    const stepX = dx >= 0 ? 1 : -1;
    const stepY = dy >= 0 ? 1 : -1;
    const stepZ = dz >= 0 ? 1 : -1;

    const deltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const deltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    const deltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;

    let maxX = dx >= 0 ? (mapX + 1 - px) * deltaX : (px - mapX) * deltaX;
    let maxY = dy >= 0 ? (mapY + 1 - py) * deltaY : (py - mapY) * deltaY;
    let maxZ = dz >= 0 ? (mapZ + 1 - pz) * deltaZ : (pz - mapZ) * deltaZ;

    let dist = 0;
    let norm = new THREE.Vector3();

    while (dist <= maxDistance) {
      const block = this.getBlock(mapX, mapY, mapZ);
      if (block !== 'air' && block !== 'water') {
        return {
          blockX: mapX,
          blockY: mapY,
          blockZ: mapZ,
          faceNormal: norm.clone(),
          adjacentX: mapX + norm.x,
          adjacentY: mapY + norm.y,
          adjacentZ: mapZ + norm.z,
          blockType: block,
          distance: dist,
        };
      }

      if (maxX < maxY) {
        if (maxX < maxZ) {
          dist = maxX;
          maxX += deltaX;
          mapX += stepX;
          norm.set(-stepX, 0, 0);
        } else {
          dist = maxZ;
          maxZ += deltaZ;
          mapZ += stepZ;
          norm.set(0, 0, -stepZ);
        }
      } else {
        if (maxY < maxZ) {
          dist = maxY;
          maxY += deltaY;
          mapY += stepY;
          norm.set(0, -stepY, 0);
        } else {
          dist = maxZ;
          maxZ += deltaZ;
          mapZ += stepZ;
          norm.set(0, 0, -stepZ);
        }
      }
    }

    return null;
  }

  // AABB check against player bounding box
  public checkPlayerCollision(
    pos: THREE.Vector3,
    halfWidth = 0.3,
    height = 1.8
  ): boolean {
    const minX = Math.floor(pos.x - halfWidth);
    const maxX = Math.floor(pos.x + halfWidth);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + height);
    const minZ = Math.floor(pos.z - halfWidth);
    const maxZ = Math.floor(pos.z + halfWidth);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.isSolid(x, y, z)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
