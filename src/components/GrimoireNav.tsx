import {BookOpen,Palette,Trophy,Calendar} from 'lucide-react';
import type {ActiveTab} from '../types';
export function GrimoireNav({activeTab,onNavigate,isDarkMode}:{activeTab:ActiveTab;onNavigate:(tab:ActiveTab)=>void;isDarkMode:boolean}){
 return <nav aria-label="Grimoire sections" className={`flex flex-wrap gap-2 px-4 md:px-8 py-2.5 border-b-2 border-black ${isDarkMode?'bg-slate-900 text-white':'bg-white text-black'}`}>
  {([{id:'recipes',name:'Recipes',Icon:BookOpen},{id:'palettes',name:'Palettes',Icon:Palette},{id:'quests',name:'Quests',Icon:Trophy},{id:'daily',name:'Daily',Icon:Calendar}] as const).map(({id,name,Icon})=><button key={id} onClick={()=>onNavigate(id)} aria-current={activeTab===id?'page':undefined} className={`flex items-center gap-1.5 px-3 py-2 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] ${activeTab===id?'bg-purple-300 text-black':isDarkMode?'bg-slate-800 text-white':'bg-white text-black'}`}><Icon size={14}/>{name}</button>)}
 </nav>;
}
