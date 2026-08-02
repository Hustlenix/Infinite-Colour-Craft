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
  Moon
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
  boardTileCount: number;
  hasUnclaimedDaily?: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onTriggerEasterEgg?: () => void;
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
  boardTileCount,
  isDarkMode,
  onToggleTheme,
  onTriggerEasterEgg,
}) => {
  const logoClickRef = React.useRef<{ count: number; timer: NodeJS.Timeout | null }>({ count: 0, timer: null });

  const handleLogoClick = () => {
    setActiveTab('board');

    if (logoClickRef.current.timer) {
      clearTimeout(logoClickRef.current.timer);
    }

    logoClickRef.current.count += 1;

    if (logoClickRef.current.count >= 5) {
      logoClickRef.current.count = 0;
      if (onTriggerEasterEgg) {
        onTriggerEasterEgg();
      }
    } else {
      logoClickRef.current.timer = setTimeout(() => {
        logoClickRef.current.count = 0;
      }, 3000);
    }
  };

  return (
    <header className={`${isDarkMode ? 'bg-slate-900 border-slate-700 text-white shadow-[0_2px_0_0_#334155]' : 'bg-white border-black text-black shadow-[0_2px_0_0_#000]'} border-b-2 sticky top-0 z-30 select-none`}>
      <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-2">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={handleLogoClick}>
          <div className="w-8 h-8 md:w-9 md:h-9 bg-yellow-300 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] group-hover:bg-yellow-400 transition-all">
            <Sparkles className="w-5 h-5 text-black fill-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className={`font-black text-base md:text-xl tracking-tight uppercase italic ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Infinite Craft
            </h1>
            <span className="text-[10px] font-black uppercase bg-black text-yellow-300 px-1.5 py-0.5 rounded-xs">
              Colour
            </span>
          </div>
        </div>

        {/* Discovery Counter */}
        <div className={`flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-black text-black'} border-2 px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000]`}>
          <span className="text-slate-400 uppercase text-[10px] hidden sm:inline">Discovered</span>
          <span className="bg-yellow-300 text-black px-2 py-0.5 border border-black font-mono text-xs">{discoveredCount}</span>
          <span className="text-slate-400 font-mono text-[11px]">/ {totalEstimate}+</span>
        </div>

        {/* Minimal Mode Navigation */}
        <nav className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              activeTab === 'board'
                ? 'bg-yellow-300 text-black'
                : isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700 border-slate-700' : 'bg-white text-black hover:bg-slate-100'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Craft</span>
            {boardTileCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-black text-white font-mono rounded-xs">
                {boardTileCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              activeTab === 'studio'
                ? 'bg-pink-300 text-black'
                : isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700 border-slate-700' : 'bg-white text-black hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Paint</span>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              activeTab === 'recipes'
                ? 'bg-purple-300 text-black'
                : isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700 border-slate-700' : 'bg-white text-black hover:bg-slate-100'
            }`}
            title="Recipes & Discoveries"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Recipes</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'board' && boardTileCount > 0 && (
            <button
              onClick={onClearBoard}
              className={`p-1.5 border-2 border-black ${isDarkMode ? 'bg-slate-800 text-white hover:bg-red-900 border-slate-700' : 'bg-white text-black hover:bg-red-200'} shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-black text-xs uppercase flex items-center gap-1`}
              title="Clear Board Canvas"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">Clear</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 border-2 border-black font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors ${
              isDarkMode ? 'bg-amber-300 text-black' : 'bg-slate-800 text-yellow-300'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleSound}
            className={`p-1.5 border-2 border-black font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors ${
              soundEnabled ? 'bg-cyan-300 text-black' : 'bg-slate-200 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenHelp}
            className="p-1.5 border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400 font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

