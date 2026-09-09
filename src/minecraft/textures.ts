import * as THREE from 'three';

// Cache generated textures
const textureCache: Record<string, THREE.CanvasTexture> = {};
const dataUrlCache: Record<string, string> = {};

// Helper to create 16x16 pixel canvas
function create16x16Canvas(drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx);
  return canvas;
}

// Pseudo-random helper with seed
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate Dirt 16x16
function generateDirt(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(42);
  const colors = ['#866043', '#704c32', '#5c3e27', '#4b321f', '#966c4c'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = Math.floor(rand() * colors.length);
      ctx.fillStyle = colors[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Generate Grass Top 16x16
function generateGrassTop(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(101);
  const greens = ['#5a8c32', '#4c7b28', '#669c3a', '#74b041', '#3f6820'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = Math.floor(rand() * greens.length);
      ctx.fillStyle = greens[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Generate Grass Side 16x16
function generateGrassSide(ctx: CanvasRenderingContext2D) {
  generateDirt(ctx);
  const rand = seededRandom(55);
  const greens = ['#5a8c32', '#669c3a', '#74b041'];
  // Grass rim on top with varying depths (2-4px)
  for (let x = 0; x < 16; x++) {
    const depth = 2 + Math.floor(rand() * 3);
    for (let y = 0; y < depth; y++) {
      ctx.fillStyle = greens[Math.floor(rand() * greens.length)];
      ctx.fillRect(x, y, 1, 1);
    }
    // Occasional drip
    if (rand() > 0.6) {
      ctx.fillStyle = greens[0];
      ctx.fillRect(x, depth, 1, 1);
    }
  }
}

// Generate Stone 16x16
function generateStone(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(77);
  const grays = ['#777777', '#858585', '#666666', '#595959', '#8f8f8f'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = grays[Math.floor(rand() * grays.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Generate Cobblestone 16x16
function generateCobblestone(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(99);
  // Base dark mortar
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, 16, 16);

  const stoneColors = ['#8c8c8c', '#6d6d6d', '#555555', '#9e9e9e'];
  // Draw irregular round stone patches
  const patches = [
    { x: 1, y: 1, w: 4, h: 3 },
    { x: 7, y: 0, w: 5, h: 4 },
    { x: 13, y: 1, w: 3, h: 3 },
    { x: 0, y: 6, w: 5, h: 4 },
    { x: 6, y: 5, w: 5, h: 5 },
    { x: 12, y: 5, w: 4, h: 4 },
    { x: 1, y: 11, w: 5, h: 4 },
    { x: 7, y: 11, w: 4, h: 4 },
    { x: 12, y: 10, w: 4, h: 5 },
  ];

  for (const p of patches) {
    for (let dy = 0; dy < p.h; dy++) {
      for (let dx = 0; dx < p.w; dx++) {
        ctx.fillStyle = stoneColors[Math.floor(rand() * stoneColors.length)];
        ctx.fillRect((p.x + dx) % 16, (p.y + dy) % 16, 1, 1);
      }
    }
  }
}

// Generate Oak Planks 16x16
function generateOakPlanks(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(33);
  const baseWoods = ['#b88a55', '#aa7d4a', '#c4955f', '#9b7140'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = baseWoods[Math.floor(rand() * baseWoods.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Dark horizontal plank divider lines
  ctx.fillStyle = '#654823';
  ctx.fillRect(0, 0, 16, 1);
  ctx.fillRect(0, 4, 16, 1);
  ctx.fillRect(0, 8, 16, 1);
  ctx.fillRect(0, 12, 16, 1);
  // Vertical nail seams
  ctx.fillRect(6, 0, 1, 4);
  ctx.fillRect(12, 4, 1, 4);
  ctx.fillRect(4, 8, 1, 4);
  ctx.fillRect(10, 12, 1, 4);
}

// Generate Oak Log Side 16x16
function generateOakLogSide(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(12);
  const barks = ['#6d5334', '#59442a', '#4a3821', '#7b5e3c'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = barks[Math.floor(rand() * barks.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Vertical tree bark streaks
  ctx.fillStyle = '#3a2b18';
  for (let y = 0; y < 16; y++) {
    ctx.fillRect(3, y, 1, 1);
    ctx.fillRect(8, y, 1, 1);
    ctx.fillRect(13, y, 1, 1);
  }
}

// Generate Oak Log Top (Tree rings) 16x16
function generateOakLogTop(ctx: CanvasRenderingContext2D) {
  // Bark rim
  ctx.fillStyle = '#59442a';
  ctx.fillRect(0, 0, 16, 16);
  // Inner wood
  ctx.fillStyle = '#b88a55';
  ctx.fillRect(2, 2, 12, 12);
  // Growth rings
  ctx.fillStyle = '#9b7140';
  ctx.strokeRect(3.5, 3.5, 9, 9);
  ctx.strokeRect(5.5, 5.5, 5, 5);
  ctx.fillStyle = '#7a552b';
  ctx.fillRect(7, 7, 2, 2);
}

// Generate Oak Leaves 16x16
function generateOakLeaves(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(88);
  const leafColors = ['#38631b', '#2e5414', '#477c24', '#538f2b'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Semi-transparent cutout pattern
      if (rand() > 0.88) {
        ctx.clearRect(x, y, 1, 1);
      } else {
        ctx.fillStyle = leafColors[Math.floor(rand() * leafColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

// Generate Ore (Diamond, Gold, Iron, Coal)
function generateOre(ctx: CanvasRenderingContext2D, gemColors: string[]) {
  generateStone(ctx);
  const rand = seededRandom(15);
  const oreSpots = [
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 3, y: 4 },
    { x: 10, y: 5 },
    { x: 11, y: 5 },
    { x: 11, y: 6 },
    { x: 5, y: 11 },
    { x: 6, y: 11 },
    { x: 6, y: 12 },
    { x: 12, y: 12 },
    { x: 13, y: 12 },
  ];
  for (const pt of oreSpots) {
    ctx.fillStyle = gemColors[Math.floor(rand() * gemColors.length)];
    ctx.fillRect(pt.x, pt.y, 1, 1);
  }
}

// Generate Glass 16x16
function generateGlass(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#bce5e8';
  // Outer frame
  ctx.strokeRect(0.5, 0.5, 15, 15);
  // Diagonal streak
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(2, 2, 1, 1);
  ctx.fillRect(3, 3, 2, 2);
  ctx.fillRect(10, 10, 2, 2);
  ctx.fillRect(12, 12, 1, 1);
}

// Generate Bedrock 16x16
function generateBedrock(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(19);
  const darks = ['#1a1a1a', '#2d2d2d', '#555555', '#000000', '#7a7a7a'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = darks[Math.floor(rand() * darks.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Generate Sand 16x16
function generateSand(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(61);
  const sands = ['#d9c98a', '#d2c17d', '#dfd399', '#c9b772'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = sands[Math.floor(rand() * sands.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Generate Water 16x16
function generateWater(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(44);
  const blues = ['#2e5dbf', '#366ce0', '#254eab', '#407bf2'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = blues[Math.floor(rand() * blues.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Generate Crafting Table Top 16x16
function generateCraftingTableTop(ctx: CanvasRenderingContext2D) {
  generateOakPlanks(ctx);
  // 3x3 Grid pattern
  ctx.fillStyle = '#473017';
  ctx.strokeRect(2.5, 2.5, 11, 11);
  ctx.fillRect(6, 3, 1, 10);
  ctx.fillRect(10, 3, 1, 10);
  ctx.fillRect(3, 6, 10, 1);
  ctx.fillRect(3, 10, 10, 1);
}

// Generate Furnace Front 16x16
function generateFurnaceFront(ctx: CanvasRenderingContext2D) {
  generateCobblestone(ctx);
  // Center dark hole
  ctx.fillStyle = '#222222';
  ctx.fillRect(4, 5, 8, 7);
  // Opening rim
  ctx.fillStyle = '#111111';
  ctx.strokeRect(3.5, 4.5, 9, 8);
}

// Generate TNT 16x16
function generateTNT(ctx: CanvasRenderingContext2D) {
  // Red dynamite sticks
  ctx.fillStyle = '#db3227';
  ctx.fillRect(0, 0, 16, 16);
  // White middle band
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 6, 16, 4);
  // Text "TNT"
  ctx.fillStyle = '#000000';
  // T
  ctx.fillRect(2, 7, 3, 1);
  ctx.fillRect(3, 8, 1, 2);
  // N
  ctx.fillRect(6, 7, 1, 3);
  ctx.fillRect(7, 8, 1, 1);
  ctx.fillRect(8, 7, 1, 3);
  // T
  ctx.fillRect(10, 7, 3, 1);
  ctx.fillRect(11, 8, 1, 2);
}

// Generate Obsidian 16x16
function generateObsidian(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(22);
  const obs = ['#12101e', '#1c162f', '#2c1e4a', '#0a0812', '#3a2762'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = obs[Math.floor(rand() * obs.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Generate Glowstone 16x16
function generateGlowstone(ctx: CanvasRenderingContext2D) {
  const rand = seededRandom(81);
  const golds = ['#e6b847', '#ffcf66', '#d4982a', '#f5e498', '#b0791a'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = golds[Math.floor(rand() * golds.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Generate Bricks 16x16
function generateBricks(ctx: CanvasRenderingContext2D) {
  // Mortar
  ctx.fillStyle = '#c7bca7';
  ctx.fillRect(0, 0, 16, 16);
  const brickCol = '#9b3d2b';
  // Row 1
  ctx.fillStyle = brickCol;
  ctx.fillRect(1, 1, 6, 2);
  ctx.fillRect(8, 1, 7, 2);
  // Row 2
  ctx.fillRect(0, 4, 3, 2);
  ctx.fillRect(4, 4, 7, 2);
  ctx.fillRect(12, 4, 4, 2);
  // Row 3
  ctx.fillRect(1, 7, 6, 2);
  ctx.fillRect(8, 7, 7, 2);
  // Row 4
  ctx.fillRect(0, 10, 3, 2);
  ctx.fillRect(4, 10, 7, 2);
  ctx.fillRect(12, 10, 4, 2);
  // Row 5
  ctx.fillRect(1, 13, 6, 2);
  ctx.fillRect(8, 13, 7, 2);
}

// Generate Break Stage Crack Overlay 16x16 (0 - 9)
function generateBreakCrack(stage: number): HTMLCanvasElement {
  return create16x16Canvas((ctx) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    const rand = seededRandom(1337 + stage);
    const pixelCount = (stage + 1) * 7;
    for (let i = 0; i < pixelCount; i++) {
      const x = Math.floor(rand() * 16);
      const y = Math.floor(rand() * 16);
      ctx.fillRect(x, y, 1, 1);
      if (rand() > 0.5) ctx.fillRect((x + 1) % 16, y, 1, 1);
    }
  });
}

// Texture Map Builder
export function getBlockCanvas(name: string): HTMLCanvasElement {
  switch (name) {
    case 'dirt':
      return create16x16Canvas(generateDirt);
    case 'grass_top':
      return create16x16Canvas(generateGrassTop);
    case 'grass_side':
      return create16x16Canvas(generateGrassSide);
    case 'stone':
      return create16x16Canvas(generateStone);
    case 'cobblestone':
      return create16x16Canvas(generateCobblestone);
    case 'oak_planks':
      return create16x16Canvas(generateOakPlanks);
    case 'oak_log_side':
      return create16x16Canvas(generateOakLogSide);
    case 'oak_log_top':
      return create16x16Canvas(generateOakLogTop);
    case 'oak_leaves':
      return create16x16Canvas(generateOakLeaves);
    case 'diamond_ore':
      return create16x16Canvas((ctx) => generateOre(ctx, ['#4dedf0', '#25c9cc', '#92f8fa']));
    case 'gold_ore':
      return create16x16Canvas((ctx) => generateOre(ctx, ['#fcee4b', '#e2cb25', '#fff68c']));
    case 'iron_ore':
      return create16x16Canvas((ctx) => generateOre(ctx, ['#d8af93', '#bfa088', '#e5c4ab']));
    case 'coal_ore':
      return create16x16Canvas((ctx) => generateOre(ctx, ['#212121', '#333333', '#111111']));
    case 'bedrock':
      return create16x16Canvas(generateBedrock);
    case 'sand':
      return create16x16Canvas(generateSand);
    case 'water':
      return create16x16Canvas(generateWater);
    case 'glass':
      return create16x16Canvas(generateGlass);
    case 'crafting_table':
      return create16x16Canvas(generateCraftingTableTop);
    case 'furnace':
      return create16x16Canvas(generateFurnaceFront);
    case 'tnt':
      return create16x16Canvas(generateTNT);
    case 'obsidian':
      return create16x16Canvas(generateObsidian);
    case 'glowstone':
      return create16x16Canvas(generateGlowstone);
    case 'bricks':
      return create16x16Canvas(generateBricks);
    default:
      return create16x16Canvas(generateDirt);
  }
}

// Three.js Texture Loader with Nearest Filter (Crisp Pixels!)
export function getThreeTexture(name: string): THREE.CanvasTexture {
  if (textureCache[name]) return textureCache[name];

  const canvas = getBlockCanvas(name);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  textureCache[name] = texture;
  return texture;
}

// Data URL for UI items/icons
export function getBlockDataUrl(name: string): string {
  if (dataUrlCache[name]) return dataUrlCache[name];
  const canvas = getBlockCanvas(name);
  const dataUrl = canvas.toDataURL('image/png');
  dataUrlCache[name] = dataUrl;
  return dataUrl;
}

// Break crack textures
export const breakStageTextures: THREE.CanvasTexture[] = [];
for (let i = 0; i < 10; i++) {
  const canvas = generateBreakCrack(i);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  breakStageTextures.push(tex);
}

// Generate Sword / Pickaxe Item Data URLs
export function getItemIcon(itemId: string): string {
  if (dataUrlCache['item_' + itemId]) return dataUrlCache['item_' + itemId];

  const canvas = create16x16Canvas((ctx) => {
    if (itemId.includes('sword')) {
      // Diagonal sword
      const bladeCol = itemId.includes('diamond') ? '#4dedf0' : '#d8af93';
      ctx.fillStyle = bladeCol;
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(9 + i, 6 - i, 1, 1);
        ctx.fillRect(8 + i, 5 - i, 1, 1);
      }
      // Guard
      ctx.fillStyle = '#654823';
      ctx.fillRect(7, 8, 3, 1);
      ctx.fillRect(8, 7, 1, 3);
      // Handle
      ctx.fillStyle = '#4a351a';
      ctx.fillRect(6, 9, 1, 1);
      ctx.fillRect(5, 10, 1, 1);
      ctx.fillRect(4, 11, 1, 1);
    } else if (itemId.includes('pickaxe')) {
      // Pickaxe
      const headCol = itemId.includes('diamond') ? '#4dedf0' : '#858585';
      ctx.fillStyle = headCol;
      ctx.fillRect(9, 2, 5, 2);
      ctx.fillRect(13, 4, 2, 4);
      // Stick
      ctx.fillStyle = '#654823';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(10 - i, 5 + i, 1, 1);
      }
    } else if (itemId === 'diamond') {
      // Diamond Gem
      ctx.fillStyle = '#25c9cc';
      ctx.fillRect(6, 4, 4, 2);
      ctx.fillRect(4, 6, 8, 3);
      ctx.fillRect(5, 9, 6, 2);
      ctx.fillRect(6, 11, 4, 2);
      ctx.fillStyle = '#4dedf0';
      ctx.fillRect(6, 5, 2, 2);
      ctx.fillRect(5, 7, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 5, 1, 1);
      ctx.fillRect(6, 7, 1, 1);
    } else if (itemId === 'coal') {
      // Coal lump
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(5, 5, 6, 6);
      ctx.fillRect(4, 6, 8, 4);
      ctx.fillRect(6, 4, 4, 8);
      ctx.fillStyle = '#383838';
      ctx.fillRect(5, 6, 2, 2);
      ctx.fillRect(8, 8, 2, 2);
    } else if (itemId === 'stick') {
      // Wooden Stick
      ctx.fillStyle = '#654823';
      for (let i = 0; i < 9; i++) {
        ctx.fillRect(11 - i, 4 + i, 2, 2);
      }
      ctx.fillStyle = '#4a351a';
      for (let i = 0; i < 9; i++) {
        ctx.fillRect(12 - i, 4 + i, 1, 1);
      }
    } else if (itemId === 'iron_ingot' || itemId === 'gold_ingot') {
      // Metallic Ingot
      const mainCol = itemId === 'gold_ingot' ? '#fcee4b' : '#d8d8d8';
      const shadowCol = itemId === 'gold_ingot' ? '#c4b518' : '#999999';
      const highCol = itemId === 'gold_ingot' ? '#fff68c' : '#ffffff';
      ctx.fillStyle = shadowCol;
      ctx.fillRect(4, 7, 8, 5);
      ctx.fillStyle = mainCol;
      ctx.fillRect(4, 6, 8, 4);
      ctx.fillStyle = highCol;
      ctx.fillRect(4, 6, 8, 1);
    } else if (itemId === 'apple' || itemId === 'golden_apple') {
      ctx.fillStyle = itemId === 'golden_apple' ? '#ffcf66' : '#d82929';
      ctx.fillRect(5, 5, 6, 6);
      ctx.fillRect(6, 4, 4, 8);
      ctx.fillRect(4, 6, 8, 4);
      // Stem
      ctx.fillStyle = '#4a351a';
      ctx.fillRect(7, 2, 1, 2);
      ctx.fillStyle = '#5a8c32';
      ctx.fillRect(8, 2, 1, 1);
    } else if (itemId.includes('beef') || itemId.includes('bread')) {
      ctx.fillStyle = '#9b4b28';
      ctx.fillRect(4, 6, 8, 4);
      ctx.fillRect(5, 5, 6, 6);
    } else {
      // Fallback: draw mini block preview
      const blockCanvas = getBlockCanvas(itemId);
      ctx.drawImage(blockCanvas, 0, 0);
    }
  });

  const url = canvas.toDataURL('image/png');
  dataUrlCache['item_' + itemId] = url;
  return url;
}
