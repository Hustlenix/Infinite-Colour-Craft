import React, {useEffect,useRef,useState} from 'react';
import type {RecipeRecord} from '../hooks/useProgression';
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
  recipes?:RecipeRecord[];
  onAddToPalette?:(c:ColorItem)=>void;
}

export const RecipeBook: React.FC<RecipeBookProps> = ({
  unlockedColors,
  onSpawnToBoard,
  onSelectForStudio,
  isDarkMode = false,recipes=[],onAddToPalette,
}) => {
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [copiedHex,setCopiedHex]=useState(false),[manual,setManual]=useState(''),[sort,setSort]=useState('rarity'),[category,setCategory]=useState('All');
  const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null),modalRef=useRef<HTMLDivElement>(null);
  const selectedHex=useRef<string|undefined>(undefined);selectedHex.current=selectedColor?.hex;
  useEffect(()=>()=>{if(copyTimer.current)clearTimeout(copyTimer.current);},[]);
  useEffect(()=>{if(!selectedColor)return;const previous=document.activeElement as HTMLElement;const modal=modalRef.current;const focusables=()=>[...(modal?.querySelectorAll<HTMLElement>('button,input,select,textarea,[tabindex="0"]')||[])];focusables()[0]?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setSelectedColor(null);if(e.key==='Tab'){const f=focusables(),first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};},[selectedColor]);
  const parents=(c:ColorItem)=>c.parentIds||recipes.find(r=>r.result===c.hex)?.parents;
  const nameFor=(id:string)=>unlockedColors.find(c=>c.hex===id||c.id===id)?.name||id;
  const lineage=(color:ColorItem,seen=new Set<string>(),depth=0):React.ReactNode=>{if(seen.has(color.hex)||depth>=6)return <span>Further ancestry unavailable.</span>;const ids=parents(color);if(!ids)return <span>{color.isBase?'Starter pigment':'Parent information not recorded (legacy or reward pigment).'}</span>;return <ul className="pl-3 border-l border-black/30 space-y-2">{ids.map((id,i)=>{const c=unlockedColors.find(c=>c.hex===id);return <li key={id+i}><strong>{nameFor(id)}</strong> <code>{id}</code>{c&&lineage(c,new Set(seen).add(color.hex),depth+1)}</li>;})}</ul>;};

  const rank: Record<string, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, God: 6 };

  const filteredColors = unlockedColors
    .filter((c) =>
      (category==='All'||c.category===category) && (c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.hex.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.rarity.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if(sort==='name')return a.name.localeCompare(b.name);
      if(sort==='hue')return a.hsl.h-b.hsl.h;
      if(sort==='date')return (b.discoveredAt||0)-(a.discoveredAt||0);
      const rA = rank[a.rarity] || 1;
      const rB = rank[b.rarity] || 1;
      if (rA !== rB) return rA - rB;
      return (a.discoveredAt || 0) - (b.discoveredAt || 0);
    });

  useEffect(()=>{setCopiedHex(false);setManual('');if(copyTimer.current)clearTimeout(copyTimer.current);},[selectedColor]);
  const handleCopy=async(hex:string)=>{try{await navigator.clipboard.writeText(hex);if(selectedHex.current!==hex)return;setCopiedHex(true);setManual('');if(copyTimer.current)clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopiedHex(false),2000);}catch{if(selectedHex.current===hex){setCopiedHex(false);setManual(hex);}}};

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
              type="text" aria-label="Search recipes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH RECIPES & PIGMENTS..."
              className={`w-full pl-9 pr-3 py-2 border-2 text-xs font-bold uppercase placeholder-slate-400 focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_0px_#000] ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-700' : 'bg-white border-black text-black'
              }`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold"><label>Sort: <select aria-label="Sort recipes" value={sort} onChange={e=>setSort(e.target.value)} className="border-2 border-black px-2 py-2 bg-white text-black"><option value="rarity">Rarity</option><option value="date">Discovery date</option><option value="name">Name</option><option value="hue">Hue</option></select></label><label>Category: <select aria-label="Filter recipe category" value={category} onChange={e=>setCategory(e.target.value)} className="border-2 border-black px-2 py-2 bg-white text-black">{['All',...new Set(unlockedColors.map(c=>c.category))].map(c=><option key={c}>{c}</option>)}</select></label></div>
        {!filteredColors.length&&<p role="status" className="border-2 border-black p-4 text-sm font-bold">No matching pigments. Try another name, hex or category.</p>}
        {/* Recipe Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredColors.map((color) => (
            <div
              key={color.id}
              role="button" tabIndex={0} aria-label={`Inspect ${color.name}`} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedColor(color);}}}
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
                <h3 className={`font-black text-sm uppercase group-hover:underline ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {color.name}
                </h3>
                <p className={`text-xs font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{color.hex}</p>
              </div>

              {/* Parents Recipe Tag */}
              <div className={`text-[11px] font-black uppercase border-t-2 border-black/20 pt-2 flex items-center justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>Parents:</span>
                {color.parents ? (
                  <span className="font-black text-black truncate max-w-[150px] bg-yellow-300 px-1 border border-black">
                    {color.parents[0]} + {color.parents[1]}
                  </span>
                ) : (
                  <span className="bg-red-300 px-1 border border-black text-black font-black">{color.isBase?'Primary Base':'Unknown / Reward'}</span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Selected Color Lineage Modal */}
      {selectedColor && (
        <div ref={modalRef} role="dialog" aria-modal="true" aria-label={selectedColor.name} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_#000] space-y-5 text-black">
            
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
                aria-label="Close pigment details" onClick={() => setSelectedColor(null)}
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

              <div className="text-xs space-y-2">{lineage(selectedColor)}</div>
              {recipes.filter(r=>r.result===selectedColor.hex).length>1&&<details className="text-xs"><summary>Alternative recorded recipes</summary>{recipes.filter(r=>r.result===selectedColor.hex).map((r,i)=><p key={i}>{r.parents.map(nameFor).join(' + ')}</p>)}</details>}

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

            <p className="text-xs">{selectedColor.isBase?'Starter collection':selectedColor.discoveredAt?'Discovered '+new Date(selectedColor.discoveredAt).toLocaleDateString():'Discovery date unavailable'}</p>
            <button className="border-2 border-black px-3 py-2 bg-white text-black text-xs font-black" onClick={()=>handleCopy(selectedColor.hex)}>{copiedHex?'Copied':'Copy HEX'}</button>
            {manual&&<label className="block text-xs">Clipboard access blocked. Copy manually:<textarea aria-label="Manual copy text" value={manual} readOnly onFocus={e=>e.currentTarget.select()} className="block w-full border-2 border-black p-2"/></label>}
            <button className="border-2 border-black px-3 py-2 bg-purple-300 text-black text-xs font-black ml-2" onClick={()=>{onAddToPalette?.(selectedColor);setSelectedColor(null);}}>Add to Palette</button>
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
