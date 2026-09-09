import React, { useState } from 'react';
import { InventoryItem } from '../types/minecraft';
import { getItemIcon, getBlockDataUrl } from '../minecraft/textures';
import { soundManager } from '../minecraft/audio';
import { X, ArrowRight } from 'lucide-react';

interface InventoryModalProps {
  hotbar: Array<InventoryItem | null>;
  inventory: Array<InventoryItem | null>;
  onUpdateSlots: (
    newHotbar: Array<InventoryItem | null>,
    newInventory: Array<InventoryItem | null>
  ) => void;
  onClose: () => void;
  skin: 'steve' | 'alex';
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  hotbar,
  inventory,
  onUpdateSlots,
  onClose,
  skin,
}) => {
  // Cursor item currently being held/dragged
  const [cursorItem, setCursorItem] = useState<InventoryItem | null>(null);
  const [splitMode, setSplitMode] = useState(false);

  // 2x2 Crafting Matrix
  const [craftGrid, setCraftGrid] = useState<Array<InventoryItem | null>>([null, null, null, null]);
  const [craftResult, setCraftResult] = useState<InventoryItem | null>(null);

  // Check crafting recipes
  const checkRecipe = (grid: Array<InventoryItem | null>) => {
    const totalItems = grid.filter(Boolean).length;

    // 1 Wood Log -> 4 Oak Planks
    const logItem = grid.find((item) => item && (item.id === 'oak_log' || item.blockType === 'oak_log'));
    if (logItem && totalItems === 1) {
      setCraftResult({
        id: 'oak_planks',
        name: 'Oak Planks',
        count: 4,
        type: 'block',
        blockType: 'oak_planks',
      });
      return;
    }

    // 2 Planks vertically -> 4 Sticks
    if (
      (grid[0]?.id === 'oak_planks' && grid[2]?.id === 'oak_planks' && totalItems === 2) ||
      (grid[1]?.id === 'oak_planks' && grid[3]?.id === 'oak_planks' && totalItems === 2)
    ) {
      setCraftResult({
        id: 'stick',
        name: 'Stick',
        count: 4,
        type: 'material',
      });
      return;
    }

    // 4 Planks in 2x2 -> 1 Crafting Table
    if (
      grid[0]?.id === 'oak_planks' &&
      grid[1]?.id === 'oak_planks' &&
      grid[2]?.id === 'oak_planks' &&
      grid[3]?.id === 'oak_planks'
    ) {
      setCraftResult({
        id: 'crafting_table',
        name: 'Crafting Table',
        count: 1,
        type: 'block',
        blockType: 'crafting_table',
      });
      return;
    }

    // 1 Stick + 1 or 2 Diamonds -> Diamond Sword
    if (
      (grid[0]?.id === 'diamond' && grid[2]?.id === 'stick' && totalItems === 2) ||
      (grid[1]?.id === 'diamond' && grid[3]?.id === 'stick' && totalItems === 2) ||
      (grid[0]?.id === 'diamond' && grid[1]?.id === 'diamond' && grid[2]?.id === 'stick' && totalItems === 3)
    ) {
      setCraftResult({
        id: 'diamond_sword',
        name: 'Diamond Sword',
        count: 1,
        type: 'tool',
      });
      return;
    }

    // 2 Diamonds + 1 or 2 Sticks -> Diamond Pickaxe
    if (
      (grid[0]?.id === 'diamond' && grid[1]?.id === 'diamond' && (grid[2]?.id === 'stick' || grid[3]?.id === 'stick'))
    ) {
      setCraftResult({
        id: 'diamond_pickaxe',
        name: 'Diamond Pickaxe',
        count: 1,
        type: 'tool',
      });
      return;
    }

    // 1 Stick + 1 Cobblestone -> Stone Sword
    if (
      (grid[0]?.id === 'cobblestone' && grid[2]?.id === 'stick' && totalItems === 2) ||
      (grid[1]?.id === 'cobblestone' && grid[3]?.id === 'stick' && totalItems === 2)
    ) {
      setCraftResult({
        id: 'stone_sword',
        name: 'Stone Sword',
        count: 1,
        type: 'tool',
      });
      return;
    }

    // 4 Cobblestone (2x2) -> Furnace
    if (
      grid[0]?.id === 'cobblestone' &&
      grid[1]?.id === 'cobblestone' &&
      grid[2]?.id === 'cobblestone' &&
      grid[3]?.id === 'cobblestone'
    ) {
      setCraftResult({
        id: 'furnace',
        name: 'Furnace',
        count: 1,
        type: 'block',
        blockType: 'furnace',
      });
      return;
    }

    // 4 Sand -> TNT (convenient in 2x2 grid)
    if (
      grid[0]?.id === 'sand' &&
      grid[1]?.id === 'sand' &&
      grid[2]?.id === 'sand' &&
      grid[3]?.id === 'sand'
    ) {
      setCraftResult({
        id: 'tnt',
        name: 'TNT',
        count: 1,
        type: 'block',
        blockType: 'tnt',
      });
      return;
    }

    setCraftResult(null);
  };

  // Slot click handler (Hotbar or Main Inventory)
  const handleSlotClick = (
    isHotbar: boolean,
    slotIndex: number
  ) => {
    soundManager.playClick();
    const currentList = isHotbar ? [...hotbar] : [...inventory];
    const existing = currentList[slotIndex];

    if (!cursorItem && !existing) return;

    if (splitMode) {
      // Split / 1-item mode
      if (!cursorItem && existing) {
        if (existing.count === 1) {
          setCursorItem(existing);
          currentList[slotIndex] = null;
        } else {
          const takeCount = Math.ceil(existing.count / 2);
          existing.count -= takeCount;
          setCursorItem({ ...existing, count: takeCount });
        }
      } else if (cursorItem && !existing) {
        // Place 1 item down
        currentList[slotIndex] = { ...cursorItem, count: 1 };
        if (cursorItem.count > 1) {
          setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
        } else {
          setCursorItem(null);
        }
      } else if (cursorItem && existing) {
        if (cursorItem.id === existing.id && existing.count < 64) {
          // Deposit 1 item into stack
          existing.count++;
          if (cursorItem.count > 1) {
            setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
          } else {
            setCursorItem(null);
          }
        } else {
          // Swap
          currentList[slotIndex] = cursorItem;
          setCursorItem(existing);
        }
      }
    } else {
      // Full stack mode
      if (!cursorItem && existing) {
        // Pick up item
        setCursorItem(existing);
        currentList[slotIndex] = null;
      } else if (cursorItem && !existing) {
        // Place down item
        currentList[slotIndex] = cursorItem;
        setCursorItem(null);
      } else if (cursorItem && existing) {
        if (cursorItem.id === existing.id) {
          // Stack together
          const space = 64 - existing.count;
          if (space >= cursorItem.count) {
            existing.count += cursorItem.count;
            setCursorItem(null);
          } else {
            existing.count = 64;
            setCursorItem({ ...cursorItem, count: cursorItem.count - space });
          }
        } else {
          // Swap items
          currentList[slotIndex] = cursorItem;
          setCursorItem(existing);
        }
      }
    }

    if (isHotbar) {
      onUpdateSlots(currentList, inventory);
    } else {
      onUpdateSlots(hotbar, currentList);
    }
  };

  // Craft grid click
  const handleCraftSlotClick = (gridIdx: number) => {
    soundManager.playClick();
    const next = [...craftGrid];
    const existing = next[gridIdx];

    if (splitMode && cursorItem) {
      // Place 1 item into craft grid
      if (!existing) {
        next[gridIdx] = { ...cursorItem, count: 1 };
        if (cursorItem.count > 1) {
          setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
        } else {
          setCursorItem(null);
        }
      } else if (existing.id === cursorItem.id && existing.count < 64) {
        existing.count++;
        if (cursorItem.count > 1) {
          setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
        } else {
          setCursorItem(null);
        }
      }
    } else {
      if (!cursorItem && existing) {
        setCursorItem(existing);
        next[gridIdx] = null;
      } else if (cursorItem && !existing) {
        next[gridIdx] = cursorItem;
        setCursorItem(null);
      } else if (cursorItem && existing) {
        if (cursorItem.id === existing.id) {
          existing.count += cursorItem.count;
          setCursorItem(null);
        } else {
          next[gridIdx] = cursorItem;
          setCursorItem(existing);
        }
      }
    }

    setCraftGrid(next);
    checkRecipe(next);
  };

  // Craft Result click
  const handleTakeResult = () => {
    if (!craftResult) return;
    soundManager.playPop();

    if (!cursorItem) {
      setCursorItem(craftResult);
    } else if (cursorItem.id === craftResult.id) {
      cursorItem.count += craftResult.count;
    } else {
      return; // Cannot swap into result slot
    }

    // Decrement craft grid ingredients
    const next = craftGrid.map((item) => {
      if (!item) return null;
      if (item.count > 1) return { ...item, count: item.count - 1 };
      return null;
    });
    setCraftGrid(next);
    checkRecipe(next);
  };

  const getItemIconUrl = (item: InventoryItem | null) => {
    if (!item) return null;
    if (item.type === 'tool') return getItemIcon(item.id);
    return getBlockDataUrl(item.blockType || item.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center select-none p-2"
      onClick={() => {
        // Return cursor item to first empty slot if clicked outside
      }}
    >
      {/* Minecraft Java Inventory GUI Container */}
      <div
        className="mc-stone-bg border-4 border-gray-700 p-3 rounded shadow-2xl flex flex-col gap-2 relative max-h-[96vh] overflow-y-auto max-w-[98vw]"
        style={{ width: '470px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar with Touch Split Mode Toggle */}
        <div className="flex justify-between items-center text-xs font-bold text-gray-300 mc-text-shadow border-b border-gray-600 pb-1.5">
          <div className="flex items-center gap-2">
            <span>Crafting & Inventory</span>
            {/* Split Mode Toggle Button (Essential for Touch / Mobile) */}
            <button
              type="button"
              onClick={() => setSplitMode(!splitMode)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                splitMode
                  ? 'bg-yellow-600 border-yellow-300 text-yellow-100 font-bold'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              title="Dokunmatik ve mobilde tekli/yarım alma modu"
            >
              {splitMode ? '⚡ Mod: 1 Adet / Böl' : '📦 Mod: Tam Yığın'}
            </button>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="hover:text-red-400 p-0.5 rounded hover:bg-black/30"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top Section: Player 2D Preview & 2x2 Crafting Grid */}
        <div className="flex justify-between items-center bg-black/30 p-2 border-2 border-gray-700 rounded">
          {/* Armor Slots & Player Model */}
          <div className="flex items-center gap-3">
            {/* 4 Armor Slots */}
            <div className="flex flex-col gap-1">
              {['helmet', 'chestplate', 'leggings', 'boots'].map((type, idx) => (
                <div key={idx} className="mc-slot w-9 h-9 border border-gray-700 opacity-80">
                  <span className="text-[8px] text-gray-500 uppercase">{type[0]}</span>
                </div>
              ))}
            </div>

            {/* Player Preview Box */}
            <div className="w-20 h-36 bg-black/60 border-2 border-gray-800 flex flex-col items-center justify-center p-1">
              <div
                className="w-10 h-10 rounded-sm border border-black mb-1"
                style={{ backgroundColor: skin === 'alex' ? '#e6b89c' : '#bfa088' }}
              />
              <div
                className="w-12 h-14 rounded-sm border border-black"
                style={{ backgroundColor: skin === 'alex' ? '#5a7d45' : '#2e6b7d' }}
              />
              <span className="text-[9px] text-gray-400 mt-1">{skin === 'alex' ? 'Alex' : 'Steve'}</span>
            </div>
          </div>

          {/* 2x2 Crafting Grid & Output */}
          <div className="flex items-center gap-3 pr-4">
            <div className="grid grid-cols-2 gap-1">
              {craftGrid.map((item, idx) => {
                const icon = getItemIconUrl(item);
                return (
                  <div
                    key={idx}
                    onClick={() => handleCraftSlotClick(idx)}
                    className="mc-slot w-10 h-10 cursor-pointer"
                  >
                    {icon && (
                      <img
                        src={icon}
                        alt=""
                        className="w-7 h-7 object-contain pointer-events-none"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                    {item && item.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white mc-text-shadow pointer-events-none">
                        {item.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Craft Arrow */}
            <div className="text-gray-400">
              <ArrowRight size={20} />
            </div>

            {/* Result Slot */}
            <div
              onClick={handleTakeResult}
              className={`mc-slot w-12 h-12 border-2 ${
                craftResult ? 'border-yellow-400 bg-white/10 cursor-pointer' : 'border-gray-600'
              }`}
            >
              {craftResult && (
                <>
                  <img
                    src={getItemIconUrl(craftResult)!}
                    alt=""
                    className="w-9 h-9 object-contain pointer-events-none"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {craftResult.count > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[11px] font-bold text-yellow-300 mc-text-shadow pointer-events-none">
                      {craftResult.count}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Middle Section: 27 Inventory Slots (3 rows of 9) */}
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[10px] text-gray-400 mc-text-shadow">Inventory</span>
          <div className="grid grid-cols-9 gap-1 bg-black/20 p-1 border border-gray-700">
            {inventory.map((item, idx) => {
              const icon = getItemIconUrl(item);
              return (
                <div
                  key={idx}
                  id={`mc-inv-slot-${idx}`}
                  onClick={() => handleSlotClick(false, idx)}
                  className="mc-slot w-10 h-10 cursor-pointer"
                >
                  {icon && (
                    <img
                      src={icon}
                      alt=""
                      className="w-7 h-7 object-contain pointer-events-none"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  {item && item.count > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white mc-text-shadow pointer-events-none">
                      {item.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: 9 Hotbar Slots */}
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[10px] text-gray-400 mc-text-shadow">Hotbar</span>
          <div className="grid grid-cols-9 gap-1 bg-black/20 p-1 border border-gray-700">
            {hotbar.map((item, idx) => {
              const icon = getItemIconUrl(item);
              return (
                <div
                  key={idx}
                  id={`mc-inv-hotbar-${idx}`}
                  onClick={() => handleSlotClick(true, idx)}
                  className="mc-slot w-10 h-10 cursor-pointer"
                >
                  {icon && (
                    <img
                      src={icon}
                      alt=""
                      className="w-7 h-7 object-contain pointer-events-none"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  {item && item.count > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white mc-text-shadow pointer-events-none">
                      {item.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cursor Floating Item */}
        {cursorItem && (
          <div className="text-center text-[10px] text-yellow-300 mc-text-shadow mt-1">
            Holding: {cursorItem.name} ({cursorItem.count}) - Click slot to place
          </div>
        )}
      </div>
    </div>
  );
};
