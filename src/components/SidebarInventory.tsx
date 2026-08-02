import React, { useState, useMemo } from 'react';
import { ColorItem, ColorCategory } from '../types';
import { 
  Search, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  SlidersHorizontal,
  Flame,
  Droplets,
  Zap,
  Moon,
  Compass,
  Palette
} from 'lucide-react';

interface SidebarInventoryProps {
  unlockedColors: ColorItem[];
  activeColor: ColorItem | null;
  onSelectColorForBrush: (color: ColorItem) => void;
  onSpawnTileToBoard: (color: ColorItem) => void;
  onResetProgress: () => void;
  activeTab: string;
  isTrashOver?: boolean;
  isDarkMode?: boolean;
}

export const SidebarInventory: React.FC<SidebarInventoryProps> = ({
  unlockedColors,
  activeColor,
  onSelectColorForBrush,
  onSpawnTileToBoard,
  onResetProgress,
  activeTab,
  isTrashOver,
  isDarkMode = false,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'tiers' | 'grid'>('tiers');
  const [sortBy, setSortBy] = useState<'time' | 'hue' | 'lightness' | 'name' | 'rarity'>('rarity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({});

  // Categories list
  const categories: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: 'All Categories', value: 'All', icon: <Compass className="w-3.5 h-3.5" /> },
    { label: 'Base', value: 'Base', icon: <Flame className="w-3.5 h-3.5 text-rose-500" /> },
    { label: 'Secondary', value: 'Secondary', icon: <Droplets className="w-3.5 h-3.5 text-blue-500" /> },
    { label: 'Pastel', value: 'Pastel', icon: <Sparkles className="w-3.5 h-3.5 text-pink-500" /> },
    { label: 'Neon', value: 'Neon', icon: <Zap className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'Dark', value: 'Dark', icon: <Moon className="w-3.5 h-3.5 text-purple-600" /> },
    { label: 'Cosmic', value: 'Cosmic', icon: <Palette className="w-3.5 h-3.5 text-indigo-600" /> },
  ];

  // Rarity Order definition
  const rarityTiers = [
    { id: 'Common', label: 'Common', bg: 'bg-slate-100', text: 'text-black', badgeBg: 'bg-slate-200' },
    { id: 'Uncommon', label: 'Uncommon', bg: 'bg-emerald-100', text: 'text-black', badgeBg: 'bg-emerald-300' },
    { id: 'Rare', label: 'Rare', bg: 'bg-blue-100', text: 'text-black', badgeBg: 'bg-blue-300' },
    { id: 'Epic', label: 'Epic', bg: 'bg-purple-100', text: 'text-black', badgeBg: 'bg-purple-300' },
    { id: 'Legendary', label: 'Legendary', bg: 'bg-amber-100', text: 'text-black', badgeBg: 'bg-amber-300' },
    { id: 'God', label: 'God Tier', bg: 'bg-yellow-300', text: 'text-black', badgeBg: 'bg-yellow-400' },
  ];

  // Base primaries for pinned bar
  const basePrimaries = useMemo(() => {
    return unlockedColors.filter((c) => c.category === 'Base');
  }, [unlockedColors]);

  // Filter & Sort logic
  const filteredColors = useMemo(() => {
    return unlockedColors
      .filter((color) => {
        const matchesSearch =
          color.name.toLowerCase().includes(search.toLowerCase()) ||
          color.hex.toLowerCase().includes(search.toLowerCase()) ||
          (color.category && color.category.toLowerCase().includes(search.toLowerCase())) ||
          (color.rarity && color.rarity.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = categoryFilter === 'All' || color.category === categoryFilter;
        const matchesRarity = rarityFilter === 'All' || color.rarity === rarityFilter;

        return matchesSearch && matchesCategory && matchesRarity;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'time') {
          cmp = (a.discoveredAt || 0) - (b.discoveredAt || 0);
        } else if (sortBy === 'hue') {
          cmp = a.hsl.h - b.hsl.h;
        } else if (sortBy === 'lightness') {
          cmp = a.hsl.l - b.hsl.l;
        } else if (sortBy === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortBy === 'rarity') {
          const rank: Record<string, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, God: 6 };
          cmp = (rank[a.rarity] || 1) - (rank[b.rarity] || 1);
          if (cmp === 0) {
            cmp = (a.discoveredAt || 0) - (b.discoveredAt || 0);
          }
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });
  }, [unlockedColors, search, categoryFilter, rarityFilter, sortBy, sortOrder]);

  // Grouped by Rarity
  const groupedByRarity = useMemo(() => {
    const map: Record<string, ColorItem[]> = {
      Common: [],
      Uncommon: [],
      Rare: [],
      Epic: [],
      Legendary: [],
      God: [],
    };

    filteredColors.forEach((color) => {
      const r = color.rarity || 'Common';
      if (!map[r]) map[r] = [];
      map[r].push(color);
    });

    return map;
  }, [filteredColors]);

  const toggleTierCollapse = (tier: string) => {
    setCollapsedTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  const handleDragStart = (e: React.DragEvent, color: ColorItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(color));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-full md:w-80 bg-white dark:bg-slate-900 border-t-4 md:border-t-0 md:border-l-4 border-black dark:border-slate-700 text-black dark:text-white flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] select-none shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#1E293B] shrink-0 transition-colors duration-300">
      {/* Sidebar Header & Search */}
      <div className="p-3 md:p-4 border-b-2 border-black dark:border-slate-700 space-y-2.5 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-black dark:text-white" />
            <h2 className="font-black text-xs md:text-sm uppercase tracking-wider text-black dark:text-white">Inventory</h2>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] px-2 py-0.5 border border-black bg-yellow-300 font-mono font-black text-black shadow-[2px_2px_0px_0px_#000]">
              {unlockedColors.length} Pigments
            </span>
          </div>
        </div>

        {/* Pinned Base Primaries Quick Strip */}
        <div className="bg-[#FAFAFA] dark:bg-slate-800 p-2 border-2 border-black dark:border-slate-700 shadow-[2px_2px_0px_0px_#000]">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1.5">
            <span>Base Primaries (Quick Pick)</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">1-TAP</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            {basePrimaries.map((color) => {
              const isSelected = activeColor?.hex === color.hex;
              return (
                <button
                  key={color.id}
                  onClick={() => {
                    if (activeTab === 'studio') {
                      onSelectColorForBrush(color);
                    } else {
                      onSpawnTileToBoard(color);
                    }
                  }}
                  className={`flex-1 p-1 border-2 border-black dark:border-slate-700 flex flex-col items-center gap-0.5 transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                    isSelected ? 'bg-yellow-300 text-black border-black ring-2 ring-black' : 'bg-white dark:bg-slate-700 text-black dark:text-white hover:bg-yellow-50 dark:hover:bg-slate-600'
                  }`}
                  title={`${color.name} (${color.hex})`}
                >
                  <div
                    className="w-5 h-5 border border-black shadow-[1px_1px_0px_0px_#000] flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span>{color.emoji}</span>
                  </div>
                  <span className="text-[8px] font-black uppercase text-black dark:text-white truncate w-full text-center">
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-slate-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH PIGMENTS, HEX, TIER..."
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-700 text-xs font-bold text-black dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-700 shadow-[2px_2px_0px_0px_#000] uppercase"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-black dark:text-white hover:bg-yellow-300 dark:hover:text-black px-1 border border-black dark:border-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Rarity Tier Filter Pills */}
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Filter Rarity Tier:</span>
            <span className="text-black dark:text-white font-mono font-bold text-[10px]">{rarityFilter}</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <button
              onClick={() => setRarityFilter('All')}
              className={`px-2 py-0.5 border-2 border-black dark:border-slate-700 text-[9px] font-black uppercase whitespace-nowrap transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                rarityFilter === 'All' ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_#000]' : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              All Tiers
            </button>
            {rarityTiers.map((tier) => {
              const count = unlockedColors.filter((c) => c.rarity === tier.id).length;
              return (
                <button
                  key={tier.id}
                  onClick={() => setRarityFilter(tier.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 border-2 border-black dark:border-slate-700 text-[9px] font-black uppercase whitespace-nowrap transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                    rarityFilter === tier.id ? `${tier.badgeBg} text-black shadow-[2px_2px_0px_0px_#000]` : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tier.label}</span>
                  <span className="text-[8px] bg-black text-white px-1 font-mono">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode & Sort Bar */}
        <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 pt-1 border-t border-black/20 dark:border-slate-700">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('tiers')}
              className={`px-2 py-0.5 border-2 border-black dark:border-slate-700 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] ${
                viewMode === 'tiers' ? 'bg-yellow-300 text-black' : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Tier Folders
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-0.5 border-2 border-black dark:border-slate-700 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] ${
                viewMode === 'grid' ? 'bg-yellow-300 text-black' : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Flat Grid
            </button>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-black uppercase text-black dark:text-white focus:outline-none shadow-[1px_1px_0px_0px_#000]"
            >
              <option value="rarity">By Rarity</option>
              <option value="name">Name A-Z</option>
              <option value="time">Newest</option>
              <option value="hue">Hue</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-700 text-black dark:text-white font-black text-[9px] shadow-[1px_1px_0px_0px_#000]"
              title="Toggle Sort Direction"
            >
              {sortOrder === 'desc' ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </div>

      {/* Colors Grid / List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-[#FAFAFA] dark:bg-slate-950">
        {filteredColors.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-2">
            <Sparkles className="w-8 h-8 text-black dark:text-white mx-auto animate-bounce" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-black uppercase">No pigments match filter.</p>
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('All');
                setRarityFilter('All');
              }}
              className="text-xs font-black uppercase text-black dark:text-white underline hover:bg-yellow-300 dark:hover:text-black px-2 py-0.5 border border-black dark:border-slate-700"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === 'tiers' ? (
          /* Tier Accordions Mode */
          <div className="space-y-3">
            {rarityTiers.map((tier) => {
              const colorsInTier = groupedByRarity[tier.id] || [];
              if (colorsInTier.length === 0) return null;
              const isCollapsed = collapsedTiers[tier.id];

              return (
                <div key={tier.id} className="border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[3px_3px_0px_0px_#000]">
                  {/* Tier Accordion Header */}
                  <button
                    onClick={() => toggleTierCollapse(tier.id)}
                    className={`w-full p-2 ${tier.badgeBg} border-b-2 border-black dark:border-slate-700 flex items-center justify-between font-black uppercase text-xs text-black active:bg-yellow-300 transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-mono">
                        {colorsInTier.length}
                      </span>
                      <span className="tracking-wider">{tier.label} Tier</span>
                    </div>
                    <span className="font-mono text-xs font-bold">{isCollapsed ? '+' : '−'}</span>
                  </button>

                  {/* Tier Colors Grid */}
                  {!isCollapsed && (
                    <div className="p-2 grid grid-cols-2 gap-2 bg-[#FAFAFA] dark:bg-slate-950">
                      {colorsInTier.map((color) => {
                        const isSelectedForBrush = activeColor?.hex === color.hex;

                        return (
                          <div
                            key={color.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, color)}
                            onClick={() => {
                              if (activeTab === 'studio') {
                                onSelectColorForBrush(color);
                              } else {
                                onSpawnTileToBoard(color);
                              }
                            }}
                            className={`group relative p-2 border-2 border-black dark:border-slate-700 transition-all cursor-grab active:cursor-grabbing hover:-translate-y-0.5 ${
                              isSelectedForBrush
                                ? 'bg-yellow-300 border-black text-black shadow-[3px_3px_0px_0px_#000]'
                                : 'bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-yellow-50 dark:hover:bg-slate-800 shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {/* Swatch Box */}
                              <div
                                className="w-6 h-6 border border-black shadow-[1px_1px_0px_0px_#000] flex items-center justify-center text-xs shrink-0"
                                style={{ backgroundColor: color.hex }}
                              >
                                <span className="drop-shadow-sm">{color.emoji}</span>
                              </div>

                              {/* Color Info */}
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black uppercase text-black dark:text-white truncate leading-tight">
                                  {color.name}
                                </p>
                                <p className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                                  {color.hex}
                                </p>
                              </div>
                            </div>

                            {isSelectedForBrush && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-black border border-white text-white flex items-center justify-center shadow-[1px_1px_0px_0px_#000]">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Grid Mode */
          <div className="grid grid-cols-2 gap-2">
            {filteredColors.map((color) => {
              const isSelectedForBrush = activeColor?.hex === color.hex;

              return (
                <div
                  key={color.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, color)}
                  onClick={() => {
                    if (activeTab === 'studio') {
                      onSelectColorForBrush(color);
                    } else {
                      onSpawnTileToBoard(color);
                    }
                  }}
                  className={`group relative p-2.5 border-2 border-black dark:border-slate-700 transition-all cursor-grab active:cursor-grabbing hover:-translate-y-0.5 ${
                    isSelectedForBrush
                      ? 'bg-yellow-300 border-black text-black shadow-[4px_4px_0px_0px_#000]'
                      : 'bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-yellow-50 dark:hover:bg-slate-800 shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Swatch Box */}
                    <div
                      className="w-7 h-7 border border-black shadow-[1px_1px_0px_0px_#000] flex items-center justify-center text-xs shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                    >
                      <span className="drop-shadow-sm">{color.emoji}</span>
                    </div>

                    {/* Color Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase text-black dark:text-white truncate group-hover:underline">
                        {color.name}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold flex items-center gap-1">
                        <span>{color.hex}</span>
                      </p>
                    </div>
                  </div>

                  {/* Rarity Tag */}
                  <div className="mt-2 flex items-center justify-between border-t border-black/20 dark:border-slate-700 pt-1.5 text-[10px] text-black dark:text-white">
                    <span className="px-1.5 py-0.2 border border-black dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-black dark:text-white font-mono font-bold text-[9px] uppercase">
                      {color.rarity || 'Common'}
                    </span>

                    <span className="flex items-center gap-0.5 text-black font-black uppercase bg-yellow-300 px-1 border border-black opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3" />
                      <span>{activeTab === 'studio' ? 'Brush' : 'Spawn'}</span>
                    </span>
                  </div>

                  {isSelectedForBrush && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-black border border-white text-white flex items-center justify-center shadow-[1px_1px_0px_0px_#000]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trash Zone / Footer */}
      <div className="p-3 border-t-2 border-black dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
        <div
          id="trash-zone"
          className={`flex-1 py-2 px-3 border-2 border-dashed border-black flex items-center justify-center gap-2 text-xs transition-all ${
            isTrashOver
              ? 'bg-red-400 text-black font-black scale-105 shadow-[4px_4px_0px_0px_#000]'
              : 'bg-red-100 dark:bg-red-900/40 text-black dark:text-red-200 font-black hover:bg-red-200 dark:hover:bg-red-900/60 shadow-[2px_2px_0px_0px_#000]'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span className="font-black uppercase text-[10px] tracking-wider">Drop Tile To Delete</span>
        </div>

        <button
          onClick={onResetProgress}
          className="px-3 py-2 border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white font-black uppercase text-xs hover:bg-red-400 dark:hover:bg-red-500 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors"
          title="Reset All Discovered Progress"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};
