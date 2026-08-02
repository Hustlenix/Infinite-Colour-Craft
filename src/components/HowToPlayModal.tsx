import React from 'react';
import { Sparkles, Swords, Copy, Rocket, Palette } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
  onSpawnStarter?: () => void;
  isDarkMode?: boolean;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose, onSpawnStarter, isDarkMode = false }) => {
  const handleStart = () => {
    if (onSpawnStarter) {
      onSpawnStarter();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
      <div className={`relative w-full max-w-md border-4 p-5 md:p-6 shadow-[8px_8px_0px_0px_#000] space-y-4 ${
        isDarkMode ? 'bg-slate-900 border-slate-700 text-white shadow-[8px_8px_0px_0px_#1E293B]' : 'bg-white border-black text-black'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b-2 pb-3 ${isDarkMode ? 'border-slate-700' : 'border-black'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-300 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <Sparkles className="w-5 h-5 text-black fill-black" />
            </div>
            <div>
              <h3 className={`font-black text-lg uppercase italic leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Infinite Craft: Colour
              </h3>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Minimal & Addictive Alchemy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 flex items-center justify-center font-black border-2 text-xs transition-all shadow-[2px_2px_0px_0px_#000] ${
              isDarkMode ? 'bg-slate-800 text-white border-slate-700 hover:bg-yellow-300 hover:text-black' : 'bg-white text-black border-black hover:bg-yellow-300'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Minimal Instructions List */}
        <div className="space-y-3 py-1">
          <div className="flex items-start gap-3 bg-amber-50 p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <div className="w-7 h-7 bg-yellow-300 border border-black flex items-center justify-center shrink-0 font-black text-xs">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase text-black">1. Drag & Combine</h4>
              <p className="text-[11px] text-slate-700 font-medium leading-tight mt-0.5">
                Click or drag elements from your right sidebar onto the canvas. Drag one element onto another to craft something new!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-purple-50 p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <div className="w-7 h-7 bg-purple-300 border border-black flex items-center justify-center shrink-0 font-black text-xs">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase text-black">2. Clone & Clean</h4>
              <p className="text-[11px] text-slate-700 font-medium leading-tight mt-0.5">
                Double-click any element on the board to clone it instantly. Drag tiles to the bottom trash area to clear them.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-pink-50 p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <div className="w-7 h-7 bg-pink-300 border border-black flex items-center justify-center shrink-0 font-black text-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase text-black">3. Infinite Discoveries</h4>
              <p className="text-[11px] text-slate-700 font-medium leading-tight mt-0.5">
                Discover 100+ fun recipes ranging from Cyberpunk Neon to Dragon Gold & Cosmic Void, or draw in the Paint Studio!
              </p>
            </div>
          </div>
        </div>

        {/* Big Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-3 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <span>Start Crafting</span>
          <Rocket className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
