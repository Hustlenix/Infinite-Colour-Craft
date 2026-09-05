import React from 'react';
import { ActiveTab } from '../types';
import { 
  Sparkles, 
  Palette, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  Swords,
  RotateCcw,
  Sun,
  Moon,
  Trophy,
  Bot,
  Users
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  discoveredCount: number;
  totalEstimate: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearBoard: () => void;
  onOpenHelp: () => void;
  onOpenHackTheArts: () => void;
  onOpenCollab?: () => void;
  boardTileCount: number;
  hasUnclaimedDaily?: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  discoveredCount,
  totalEstimate,
  soundEnabled,
  onToggleSound,
  onClearBoard,
  onOpenHelp,
  onOpenHackTheArts,
  onOpenCollab,
  boardTileCount,
  isDarkMode,
  onToggleTheme,
}) => {
  const isAITab = activeTab === 'ai' || activeTab === 'challenge';
  const isGrimoireTab = activeTab === 'recipes' || activeTab === 'palettes' || activeTab === 'quests' || activeTab === 'daily';

  return (
    <header className={`${isDarkMode ? 'bg-slate-900 border-black text-white shadow-[0_2px_0_0_#000]' : 'bg-white border-black text-black shadow-[0_2px_0_0_#000]'} border-b-2 sticky top-0 z-30 select-none`}>
      <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 flex items-center justify-between gap-2">
        
        {/* Logo & Title */}
        <div 
          className="flex items-center gap-2 cursor-pointer group flex-shrink-0" 
          onClick={() => setActiveTab('board')}
          title="Infinite Craft: Colour"
        >
          <div className="w-8 h-8 bg-yellow-300 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] group-hover:bg-yellow-400 transition-all rounded-xs">
            <Sparkles className="w-4 h-4 text-black fill-black" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-sm md:text-base tracking-tight uppercase italic">
              Infinite Craft
            </span>
            <span className="text-[9px] font-black uppercase bg-black text-yellow-300 px-1 py-0.5 rounded-xs hidden sm:inline">
              Colour
            </span>
          </div>
        </div>

        {/* Discovery Pill */}
        <div className={`hidden sm:flex items-center gap-1.5 border-2 border-black px-2.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000] rounded-xs ${
          isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-black'
        }`}>
          <span className="text-slate-400 text-[10px] uppercase">Unlocked</span>
          <span className="bg-yellow-300 text-black px-1.5 py-0.2 border border-black font-mono text-xs">{discoveredCount}</span>
          <span className="text-slate-400 font-mono text-[10px]">/{totalEstimate}+</span>
        </div>

        {/* Clean 4-Tab Navigation */}
        <nav className="flex items-center gap-1">
          {/* 1. Craft */}
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs ${
              activeTab === 'board'
                ? 'bg-yellow-300 text-black'
                : isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-black hover:bg-slate-100'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Craft</span>
            {boardTileCount > 0 && (
              <span className="ml-0.5 px-1 py-0.1 text-[9px] bg-black text-white font-mono rounded-xs">
                {boardTileCount}
              </span>
            )}
          </button>

          {/* 2. Studio / Paint */}
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs ${
              activeTab === 'studio'
                ? 'bg-pink-300 text-black'
                : isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-black hover:bg-slate-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Studio</span>
          </button>

          {/* 3. AI Lab (Unified) */}
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs ${
              isAITab
                ? 'bg-cyan-300 text-black'
                : isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-black hover:bg-slate-100'
            }`}
            title="Chromatic AI Lab: Doodle Vision & Speed Challenge"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Lab</span>
          </button>

          {/* 4. Grimoire / Recipes */}
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs ${
              isGrimoireTab
                ? 'bg-purple-300 text-black'
                : isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-black hover:bg-slate-100'
            }`}
            title="Grimoire: Recipes, Palettes, Quests, Daily"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grimoire</span>
          </button>
        </nav>

        {/* Minimal Action Controls */}
        <div className="flex items-center gap-1">
          {activeTab === 'board' && boardTileCount > 0 && (
            <button
              onClick={onClearBoard}
              className={`p-1.5 border-2 border-black ${isDarkMode ? 'bg-slate-800 text-white hover:bg-rose-900' : 'bg-white text-black hover:bg-rose-100'} shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs`}
              title="Clear Board"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenCollab && (
            <button
              onClick={onOpenCollab}
              className={`flex items-center gap-1 px-2 py-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs ${
                isDarkMode ? 'bg-emerald-900 text-emerald-200 hover:bg-emerald-800' : 'bg-emerald-300 text-black hover:bg-emerald-400'
              }`}
              title="Live Multiplayer Collaboration"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Collab</span>
            </button>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 border-2 border-black font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs ${
              isDarkMode ? 'bg-amber-300 text-black' : 'bg-slate-800 text-yellow-300'
            }`}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 border-2 border-black font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs ${
              soundEnabled ? 'bg-cyan-300 text-black' : 'bg-slate-200 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Hack The Arts Modal Icon */}
          <button
            onClick={onOpenHackTheArts}
            className="p-1.5 border-2 border-black bg-pink-300 text-black hover:bg-pink-400 font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs"
            title="Hack The Arts"
          >
            <Trophy className="w-3.5 h-3.5 text-black fill-black" />
          </button>

          {/* Help Modal */}
          <button
            onClick={onOpenHelp}
            className="p-1.5 border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400 font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-xs"
            title="How to Play"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
