import React, { useEffect, useState } from 'react';
import type { ColorItem } from '../types';
import { DoodleAI } from './DoodleAI';
import { DoodleChallenge } from './DoodleChallenge';
import { Brain, Target, Bot } from 'lucide-react';

interface AILabProps {
  initialSubTab?: 'ai' | 'challenge';
  isDarkMode: boolean;
  active?:boolean;
  colors?:ColorItem[];
  ink?:ColorItem;
  onInk?:(c:ColorItem)=>void;
  onCraft?:()=>void;
  onStudio?:()=>void;
}

export const AILab: React.FC<AILabProps> = ({
  initialSubTab = 'ai',
  isDarkMode,
  active=true,colors=[],ink,onInk,onCraft,onStudio,
}) => {
  const [subTab, setSubTab] = useState<'ai' | 'challenge'>(initialSubTab);
  const labInk=colors.find(color=>color.hex===ink?.hex)||colors[0];
  useEffect(()=>{if(active)setSubTab(initialSubTab);},[initialSubTab]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Sleek Sub-Navigation Header */}
      <div
        className={`w-full border-b-2 border-black flex items-center justify-between px-4 md:px-8 py-2.5 z-10 select-none ${
          isDarkMode ? 'bg-slate-900/90 text-white backdrop-blur' : 'bg-white/90 text-black backdrop-blur'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-cyan-400/20 border border-cyan-500/40 flex items-center justify-center text-cyan-500">
            <Bot className="w-4 h-4" />
          </div>
          <span className="font-black uppercase tracking-tight text-sm hidden sm:inline">
            Chromatic AI Lab
          </span>
        </div>

        {/* Segmented Control Pill */}
        <div
          className={`flex items-center p-1 border-2 border-black shadow-[2px_2px_0px_0px_#000] rounded-xs ${
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}
        >
          <button
            onClick={() => setSubTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase transition-all rounded-xs ${
              subTab === 'ai'
                ? 'bg-cyan-300 text-black shadow-[1px_1px_0px_0px_#000]'
                : isDarkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-pink-500" />
            <span>Doodle Vision</span>
          </button>

          <button
            onClick={() => setSubTab('challenge')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase transition-all rounded-xs ${
              subTab === 'challenge'
                ? 'bg-emerald-300 text-black shadow-[1px_1px_0px_0px_#000]'
                : isDarkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>Speed Challenge</span>
          </button>
        </div>

        <div className="text-[11px] font-mono opacity-50 hidden md:block">
          {subTab === 'ai' && 'Neural QuickDraw Classifier'}
          {subTab === 'challenge' && '5 Rounds · 20s Target Guessing'}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs font-bold">
          <label>Drawing ink: <select aria-label="Drawing ink" className="border-2 border-black px-2 py-1 bg-white text-black" value={labInk?.hex||''} onChange={e=>{const c=colors.find(c=>c.hex===e.target.value);if(c)onInk?.(c);}}>{colors.map(c=><option key={c.id} value={c.hex}>{c.name}</option>)}</select></label>
          <button onClick={onCraft} className="border-2 border-black px-2 py-1 bg-yellow-300 text-black">Craft</button><button onClick={onStudio} className="border-2 border-black px-2 py-1 bg-white text-black">Studio</button>
        </div>
        <div hidden={subTab!=='ai'} className="flex-1"><DoodleAI isDarkMode={isDarkMode} active={active&&subTab==='ai'} ink={labInk?.hex}/></div>

        <div hidden={subTab!=='challenge'} className="flex-1"><DoodleChallenge isDarkMode={isDarkMode} active={active&&subTab==='challenge'} ink={labInk?.hex}/></div>
      </div>
    </div>
  );
};
