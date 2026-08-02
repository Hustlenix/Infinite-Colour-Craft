import React, { useEffect } from 'react';
import { ColorItem } from '../types';
import confetti from 'canvas-confetti';
import { Sparkles, Palette, X } from 'lucide-react';

interface UnlockModalProps {
  color: ColorItem | null;
  onClose: () => void;
  onGoToStudio: (color: ColorItem) => void;
  isDarkMode?: boolean;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  color,
  onClose,
  onGoToStudio,
  isDarkMode = false,
}) => {
  useEffect(() => {
    if (color) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.2, x: 0.8 },
          colors: [color.hex, '#FFFF00', '#000000', '#FFFFFF'],
        });
      } catch {
        // Ignore confetti error
      }

      // Auto dismiss after 3.5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [color, onClose]);

  if (!color) return null;

  return (
    <div className="fixed top-16 right-4 z-50 pointer-events-auto max-w-sm w-full animate-bounce-short">
      <div className={`border-4 p-3.5 shadow-[6px_6px_0px_0px_#000] space-y-2.5 relative ${
        isDarkMode ? 'bg-slate-900 border-slate-700 text-white shadow-[6px_6px_0px_0px_#1E293B]' : 'bg-white border-black text-black'
      }`}>
        
        {/* Header row */}
        <div className={`flex items-center justify-between gap-2 border-b-2 pb-2 ${isDarkMode ? 'border-slate-700' : 'border-black'}`}>
          <div className="flex items-center gap-1.5 bg-yellow-300 px-2 py-0.5 border border-black font-black uppercase text-[10px] text-black">
            <Sparkles className="w-3 h-3 fill-black text-black" />
            <span>NEW DISCOVERY!</span>
          </div>

          <button
            onClick={onClose}
            className={`p-1 border text-xs font-black ${
              isDarkMode ? 'text-white border-slate-700 hover:bg-yellow-300 hover:text-black' : 'text-black border-black hover:bg-yellow-300'
            }`}
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Info Card */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: color.hex }}
          >
            <span className="drop-shadow-sm">{color.emoji}</span>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-black text-xs uppercase tracking-tight text-black truncate">
              {color.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono font-black uppercase bg-yellow-300 px-1.5 py-0.5 border border-black">
                {color.hex}
              </span>
              <span className="text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 border border-black text-slate-800">
                {color.rarity}
              </span>
            </div>
          </div>
        </div>

        {/* Parents Recipe Tag */}
        {color.parents && (
          <div className="text-[10px] font-black uppercase text-slate-700 bg-yellow-50 border border-black p-1.5 flex items-center gap-1">
            <span className="text-slate-500">From:</span>
            <span className="truncate">{color.parents[0]} + {color.parents[1]}</span>
          </div>
        )}

        {/* Quick Action */}
        <button
          onClick={() => onGoToStudio(color)}
          className="w-full py-1.5 px-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-black text-black font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
        >
          <Palette className="w-3 h-3" />
          <span>Use in Paint Studio</span>
        </button>

      </div>
    </div>
  );
};

