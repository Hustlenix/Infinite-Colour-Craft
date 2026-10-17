import React, { useEffect,useRef,useState } from 'react';
import {exportPalette,uniquePaletteName,moveSwatch} from '../utils/palettes';
import {hexToRgb,rgbToHsl} from '../utils/colorEngine';
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
  onStudio?:(color:ColorItem)=>void;
  seed?:{color:ColorItem;key:number};
}

export const PaletteBuilder: React.FC<PaletteBuilderProps> = ({
  unlockedColors,
  palettes,
  onSavePalette,
  onDeletePalette,
  isDarkMode = false,onStudio,seed,
}) => {
  const [selectedColors, setSelectedColors] = useState<ColorItem[]>([]);
  const [paletteName, setPaletteName] = useState('My Custom Palette');
  const [copiedFormat,setCopiedFormat]=useState<string|null>(null),[editing,setEditing]=useState<string|null>(null),[manual,setManual]=useState('');
  const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(copyTimer.current)clearTimeout(copyTimer.current);},[]);
  useEffect(()=>{if(seed)setSelectedColors(c=>c.some(p=>p.hex===seed.color.hex)?c:[...c,seed.color]);},[seed]);
  const colorFor=(hex:string):ColorItem=>{const rgb=hexToRgb(hex);return unlockedColors.find(c=>c.hex===hex)||{id:hex,name:hex,hex,rgb,hsl:rgbToHsl(rgb.r,rgb.g,rgb.b),emoji:'🎨',rarity:'Common',category:'Secondary',discoveredAt:0};};
  const edit=(p:Palette)=>{setEditing(p.id);setPaletteName(p.name);setSelectedColors(p.colors.map(colorFor));};
  const move=(i:number,d:number)=>setSelectedColors(c=>moveSwatch(c.map(c=>c.hex),i,d).map(colorFor));

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
      id: editing||crypto.randomUUID(),
      name: uniquePaletteName(paletteName,palettes,editing||undefined),
      colors: selectedColors.map((c) => c.hex),
      createdAt: Date.now(),
    };
    onSavePalette(newPalette);
    setEditing(null);
    setSelectedColors([]);
    setPaletteName('My Custom Palette');
  };

  const handleCopyCode=async(format:'hex'|'css'|'tailwind'|'json',palette:Palette)=>{
    const text=exportPalette(palette,format==='hex'?'HEX':format==='css'?'CSS':format==='tailwind'?'Tailwind v4':'JSON');
    try{await navigator.clipboard.writeText(text);setCopiedFormat(palette.id+':'+format);setManual('');if(copyTimer.current)clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopiedFormat(null),2000);}
    catch{setCopiedFormat(null);setManual(text);}
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
              aria-label="Palette name"
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
              <span>{editing?'Update':'Save'} Palette ({selectedColors.length}/6)</span>
            </button>
          </div>

          {editing&&<button onClick={()=>{setEditing(null);setSelectedColors([]);setPaletteName('My Custom Palette');}} className="border-2 border-black px-3 py-2 bg-white text-black text-xs font-black">Cancel edit / New palette</button>}
          {manual&&<label role="status" className="block text-xs font-bold">Clipboard access was blocked. Select and copy manually:<textarea aria-label="Manual copy text" value={manual} readOnly onFocus={e=>e.currentTarget.select()} className="block w-full min-h-24 border-2 border-black p-2 bg-white text-black mt-2"/></label>}
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
                  className="flex-1 min-w-0 h-full flex flex-col justify-end p-3 transition-all relative group border-r border-black/20 last:border-0"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="max-w-full truncate text-xs font-mono font-black drop-shadow-md text-black bg-white/80 px-1 border border-black inline-block self-start">
                    {color.hex}
                  </span>
                </div>
              ))
            )}
          </div>

          {!!selectedColors.length&&<ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">{selectedColors.map((color,i)=><li key={color.hex} className="flex items-center justify-between gap-2 border-2 border-black p-2"><span className="min-w-0 truncate">{i+1}. {color.name}</span><div className="flex shrink-0 gap-1"><button aria-label={`Move ${color.name} left`} disabled={i===0} onClick={()=>move(i,-1)} className="border border-black bg-white text-black px-3 py-2 disabled:opacity-40">←</button><button aria-label={`Move ${color.name} right`} disabled={i===selectedColors.length-1} onClick={()=>move(i,1)} className="border border-black bg-white text-black px-3 py-2 disabled:opacity-40">→</button><button aria-label={`Remove ${color.name}`} onClick={()=>toggleSelectColor(color)} className="border border-black bg-black text-white px-3 py-2">✕</button></div></li>)}</ol>}

          {/* Pick Pigments List */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-black">Select Pigments:</label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-[#FAFAFA] border-2 border-black shadow-[2px_2px_0px_0px_#000] custom-scrollbar">
              {unlockedColors.map((color) => {
                const isSelected = selectedColors.some((c) => c.hex === color.hex);
                return (
                  <button
                    key={color.id}
                    aria-label={`Select ${color.name} for palette`}
                    aria-pressed={isSelected}
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
                    aria-label={`Delete ${p.name}`}
                    onClick={() => {if(confirm('Delete palette “'+p.name+'”?')){onDeletePalette(p.id);if(editing===p.id){setEditing(null);setSelectedColors([]);}}}}
                    className="p-1.5 text-black hover:bg-red-400 border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2"><button onClick={()=>edit(p)} className="px-3 py-2 border-2 border-black bg-yellow-300 text-black font-black text-xs">Edit palette</button><button onClick={()=>onSavePalette({...p,id:crypto.randomUUID(),name:uniquePaletteName(p.name+' copy',palettes),createdAt:Date.now()})} className="px-3 py-2 border-2 border-black bg-white text-black font-black text-xs">Duplicate</button><button onClick={()=>handleCopyCode('json',p)} className="px-3 py-2 border-2 border-black bg-white text-black font-black text-xs">JSON</button></div>
                {/* Swatch Strip */}
                <div className="h-16 border-2 border-black shadow-[3px_3px_0px_0px_#000] flex overflow-hidden">
                  {p.colors.map((hex, i) => (
                    <div
                      key={i}
                      className="flex-1 h-full border-r border-black/20 last:border-0"
                      style={{ backgroundColor: hex }}
                      title={hex}
                      role="button" tabIndex={0} aria-label={`Use ${colorFor(hex).name} in Studio`} onClick={()=>onStudio?.(colorFor(hex))} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onStudio?.(colorFor(hex));}}}
                    />
                  ))}
                </div>

                {/* Copy Export Buttons */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <button
                    onClick={() => handleCopyCode('hex', p)}
                    className="flex-1 py-1.5 bg-white hover:bg-yellow-300 border-2 border-black font-black uppercase text-black flex items-center justify-center gap-1 text-[10px] shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    {copiedFormat === p.id+':hex' ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3" />}
                    <span>HEX</span>
                  </button>

                  <button
                    onClick={() => handleCopyCode('css', p)}
                    className="flex-1 py-1.5 bg-white hover:bg-yellow-300 border-2 border-black font-black uppercase text-black flex items-center justify-center gap-1 text-[10px] shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    {copiedFormat === p.id+':css' ? <Check className="w-3 h-3 text-black" /> : <Code2 className="w-3 h-3" />}
                    <span>CSS</span>
                  </button>

                  <button
                    onClick={() => handleCopyCode('tailwind', p)}
                    className="flex-1 py-1.5 bg-white hover:bg-yellow-300 border-2 border-black font-black uppercase text-black flex items-center justify-center gap-1 text-[10px] shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    {copiedFormat === p.id+':tailwind' ? <Check className="w-3 h-3 text-black" /> : <Sparkles className="w-3 h-3" />}
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
