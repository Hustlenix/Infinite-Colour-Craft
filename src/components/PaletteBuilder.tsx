import React, { useState } from 'react';
import { ColorItem, Palette } from '../types';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Download,
  Code2
} from 'lucide-react';

interface PaletteBuilderProps {
  unlockedColors: ColorItem[];
  palettes: Palette[];
  onSavePalette: (palette: Palette) => void;
  onDeletePalette: (id: string) => void;
  isDarkMode?: boolean;
}

export const PaletteBuilder: React.FC<PaletteBuilderProps> = ({
  unlockedColors,
  palettes,
  onSavePalette,
  onDeletePalette,
  isDarkMode = false,
}) => {
  const [selectedColors, setSelectedColors] = useState<ColorItem[]>([]);
  const [paletteName, setPaletteName] = useState('My Custom Palette');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const toggleSelectColor = (color: ColorItem) => {
    if (selectedColors.some((c) => c.hex === color.hex)) {
      setSelectedColors((prev) => prev.filter((c) => c.hex !== color.hex));
    } else {
      if (selectedColors.length < 6) {
        setSelectedColors((prev) => [...prev, color]);
      }
    }
  };

  const handleCreatePalette = () => {
    if (selectedColors.length < 2) return;
    const newPalette: Palette = {
      id: Date.now().toString(),
      name: paletteName || 'Custom Palette',
      colors: selectedColors.map((c) => c.hex),
      createdAt: Date.now(),
    };
    onSavePalette(newPalette);
    setSelectedColors([]);
    setPaletteName('My Custom Palette');
  };

  const handleCopyCode = (format: 'hex' | 'css' | 'tailwind', colorsHex: string[]) => {
    let text = '';
    if (format === 'hex') {
      text = JSON.stringify(colorsHex, null, 2);
    } else if (format === 'css') {
      text = colorsHex.map((hex, i) => `--color-${i + 1}: ${hex};`).join('\n');
    } else if (format === 'tailwind') {
      text = `colors: {\n` + colorsHex.map((hex, i) => `  brand${i + 1}: '${hex}',`).join('\n') + `\n}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className={`flex-1 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-4 md:p-8 overflow-y-auto custom-scrollbar transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F3F3EF] text-black'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className={`border-b-4 pb-6 p-6 border-2 shadow-[6px_6px_0px_0px_#000] ${
          isDarkMode ? 'bg-slate-900 border-slate-700 shadow-[6px_6px_0px_0px_#1E293B]' : 'bg-white border-black shadow-[6px_6px_0px_0px_#000]'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Layers className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            <h2 className={`text-2xl md:text-3xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Color Palette Studio
            </h2>
          </div>
          <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Combine discovered pigments into custom design palettes and export CSS / Tailwind variables.
          </p>
        </div>

        {/* Builder Area */}
        <div className={`border-4 p-6 shadow-[8px_8px_0px_0px_#000] space-y-6 ${
          isDarkMode ? 'bg-slate-900 border-slate-700 shadow-[8px_8px_0px_0px_#1E293B]' : 'bg-white border-black shadow-[8px_8px_0px_0px_#000]'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <input
              type="text"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              placeholder="PALETTE TITLE..."
              className={`w-full md:w-72 border-2 px-4 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:bg-yellow-50 ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-700' : 'bg-white border-black text-black'
              }`}
            />

            <button
              onClick={handleCreatePalette}
              disabled={selectedColors.length < 2}
              className="w-full md:w-auto px-6 py-2.5 bg-yellow-300 border-2 border-black text-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_#000] disabled:opacity-40 hover:bg-yellow-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Save Palette ({selectedColors.length}/6)</span>
            </button>
          </div>

          {/* Palette Preview Bar */}
          <div className="h-24 border-2 border-black shadow-[4px_4px_0px_0px_#000] flex overflow-hidden">
            {selectedColors.length === 0 ? (
              <div className="w-full h-full bg-[#FAFAFA] flex items-center justify-center text-xs text-black font-black uppercase p-4 text-center">
                Click pigments below to compose your palette swatch bar (2 to 6 colors)
              </div>
            ) : (
              selectedColors.map((color, i) => (
                <div
                  key={i}
                  className="flex-1 h-full flex flex-col justify-end p-3 transition-all relative group border-r border-black/20 last:border-0"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="text-xs font-mono font-black drop-shadow-md text-black bg-white/80 px-1 border border-black inline-block self-start">
                    {color.hex}
                  </span>
                  <button
                    onClick={() => toggleSelectColor(color)}
                    className="absolute top-2 right-2 p-1 bg-black text-white hover:bg-red-500 border border-black opacity-0 group-hover:opacity-100 transition-opacity font-black text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pick Pigments List */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-black">Select Pigments:</label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-[#FAFAFA] border-2 border-black shadow-[2px_2px_0px_0px_#000] custom-scrollbar">
              {unlockedColors.map((color) => {
                const isSelected = selectedColors.some((c) => c.hex === color.hex);
                return (
                  <button
                    key={color.id}
                    onClick={() => toggleSelectColor(color)}
                    className={`flex items-center gap-2 px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                      isSelected
                        ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_0px_#000]'
                        : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className="w-4 h-4 border border-black shadow-[1px_1px_0px_0px_#000]"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Saved Palettes Gallery */}
        <div className="space-y-4">
          <h3 className="text-xl font-black uppercase italic tracking-tight text-black">Your Saved Palettes ({palettes.length})</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {palettes.map((p) => (
              <div
                key={p.id}
                className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm uppercase text-black">{p.name}</h4>
                  <button
                    onClick={() => onDeletePalette(p.id)}
                    className="p-1.5 text-black hover:bg-red-400 border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Swatch Strip */}
                <div className="h-16 border-2 border-black shadow-[3px_3px_0px_0px_#000] flex overflow-hidden">
                  {p.colors.map((hex, i) => (
                    <div
                      key={i}
                      className="flex-1 h-full border-r border-black/20 last:border-0"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>

                {/* Copy Export Buttons */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <button
                    onClick={() => handleCopyCode('hex', p.colors)}
                    className="flex-1 py-1.5 bg-white hover:bg-yellow-300 border-2 border-black font-black uppercase text-black flex items-center justify-center gap-1 text-[10px] shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    {copiedFormat === 'hex' ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3" />}
                    <span>HEX</span>
                  </button>

                  <button
                    onClick={() => handleCopyCode('css', p.colors)}
                    className="flex-1 py-1.5 bg-white hover:bg-yellow-300 border-2 border-black font-black uppercase text-black flex items-center justify-center gap-1 text-[10px] shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    {copiedFormat === 'css' ? <Check className="w-3 h-3 text-black" /> : <Code2 className="w-3 h-3" />}
                    <span>CSS</span>
                  </button>

                  <button
                    onClick={() => handleCopyCode('tailwind', p.colors)}
                    className="flex-1 py-1.5 bg-white hover:bg-yellow-300 border-2 border-black font-black uppercase text-black flex items-center justify-center gap-1 text-[10px] shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    {copiedFormat === 'tailwind' ? <Check className="w-3 h-3 text-black" /> : <Sparkles className="w-3 h-3" />}
                    <span>Tailwind</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
