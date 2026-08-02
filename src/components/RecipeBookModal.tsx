import React, { useState } from 'react';
import { ColorItem } from '../types';
import { 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  GitBranch, 
  Flame, 
  Palette,
  ExternalLink
} from 'lucide-react';

interface RecipeBookProps {
  unlockedColors: ColorItem[];
  onSpawnToBoard: (color: ColorItem) => void;
  onSelectForStudio: (color: ColorItem) => void;
  isDarkMode?: boolean;
}

export const RecipeBook: React.FC<RecipeBookProps> = ({
  unlockedColors,
  onSpawnToBoard,
  onSelectForStudio,
  isDarkMode = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [copiedHex, setCopiedHex] = useState(false);

  const rank: Record<string, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, God: 6 };

  const filteredColors = unlockedColors
    .filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.hex.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.rarity.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const rA = rank[a.rarity] || 1;
      const rB = rank[b.rarity] || 1;
      if (rA !== rB) return rA - rB;
      return (a.discoveredAt || 0) - (b.discoveredAt || 0);
    });

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  return (
    <div className={`flex-1 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-4 md:p-8 overflow-y-auto custom-scrollbar transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F3F3EF] text-black'
    }`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 pb-6 p-6 border-2 shadow-[6px_6px_0px_0px_#000] ${
          isDarkMode ? 'bg-slate-900 border-slate-700 shadow-[6px_6px_0px_0px_#1E293B]' : 'bg-white border-black shadow-[6px_6px_0px_0px_#000]'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Alchemical Recipe Book
              </h2>
            </div>
            <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Inspect discovered pigment lineages, parent components, and color specs.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-300' : 'text-black'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH RECIPES & PIGMENTS..."
              className={`w-full pl-9 pr-3 py-2 border-2 text-xs font-bold uppercase placeholder-slate-400 focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_0px_#000] ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-700' : 'bg-white border-black text-black'
              }`}
            />
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredColors.map((color) => (
            <div
              key={color.id}
              onClick={() => setSelectedColor(color)}
              className={`group p-4 border-2 transition-all cursor-pointer shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-0.5 space-y-3 relative overflow-hidden ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-black text-black hover:bg-yellow-50'
              }`}
            >
              {/* Color Swatch Banner */}
              <div
                className="h-20 border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-3xl relative"
                style={{ backgroundColor: color.hex }}
              >
                <span className="drop-shadow-sm">{color.emoji}</span>
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-white border border-black text-[10px] text-black font-mono font-black uppercase shadow-[1px_1px_0px_0px_#000]">
                  {color.rarity}
                </span>
              </div>

              {/* Title & Hex */}
              <div>
                <h3 className="font-black text-sm uppercase text-black group-hover:underline">
                  {color.name}
                </h3>
                <p className="text-xs font-mono font-bold text-black">{color.hex}</p>
              </div>

              {/* Parents Recipe Tag */}
              <div className="text-[11px] font-black uppercase text-slate-700 border-t-2 border-black/20 pt-2 flex items-center justify-between">
                <span>Parents:</span>
                {color.parents ? (
                  <span className="font-black text-black truncate max-w-[150px] bg-yellow-300 px-1 border border-black">
                    {color.parents[0]} + {color.parents[1]}
                  </span>
                ) : (
                  <span className="bg-red-300 px-1 border border-black text-black font-black">Primary Base</span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Selected Color Lineage Modal */}
      {selectedColor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_#000] space-y-5 text-black">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_#000]"
                  style={{ backgroundColor: selectedColor.hex }}
                >
                  <span>{selectedColor.emoji}</span>
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase text-black">{selectedColor.name}</h3>
                  <p className="text-xs font-mono font-bold text-black">{selectedColor.hex}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedColor(null)}
                className="px-2.5 py-1 text-black font-black hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xs"
              >
                ✕
              </button>
            </div>

            {/* Lineage Tree Section */}
            <div className="bg-[#FAFAFA] p-4 border-2 border-black space-y-3 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
                <GitBranch className="w-4 h-4 text-black" />
                <span>Recipe Lineage</span>
              </div>

              {selectedColor.parents ? (
                <div className="flex items-center justify-center gap-2 py-3 text-xs bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <span className="px-2.5 py-1 bg-yellow-300 border border-black text-black font-black uppercase">
                    {selectedColor.parents[0]}
                  </span>
                  <span className="text-black font-black text-base">+</span>
                  <span className="px-2.5 py-1 bg-yellow-300 border border-black text-black font-black uppercase">
                    {selectedColor.parents[1]}
                  </span>
                  <ArrowRight className="w-4 h-4 text-black" />
                  <span
                    className="px-2.5 py-1 border border-black font-black uppercase text-black shadow-[1px_1px_0px_0px_#000]"
                    style={{ backgroundColor: selectedColor.hex }}
                  >
                    {selectedColor.name}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-black font-black uppercase bg-red-200 border border-black p-2">
                  Primary Base Spectrum Element (Cannot be broken down further).
                </p>
              )}
            </div>

            {/* Color Specifications */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold bg-[#FAFAFA] p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <div>
                <span className="text-slate-600">RGB:</span>{' '}
                <span className="text-black">
                  {selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b}
                </span>
              </div>
              <div>
                <span className="text-slate-600">HSL:</span>{' '}
                <span className="text-black">
                  {selectedColor.hsl.h}°, {selectedColor.hsl.s}%, {selectedColor.hsl.l}%
                </span>
              </div>
              <div>
                <span className="text-slate-600">Category:</span>{' '}
                <span className="text-black uppercase">{selectedColor.category}</span>
              </div>
              <div>
                <span className="text-slate-600">Rarity:</span>{' '}
                <span className="text-black uppercase">{selectedColor.rarity}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  onSpawnToBoard(selectedColor);
                  setSelectedColor(null);
                }}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-black text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Spawn on Board</span>
              </button>

              <button
                onClick={() => {
                  onSelectForStudio(selectedColor);
                  setSelectedColor(null);
                }}
                className="py-2.5 px-3 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Use in Studio</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
