import React from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Wand2, Paintbrush, Award, X, Heart } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

interface EasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToPaintWithTemplate: () => void;
  isDarkMode?: boolean;
}

export const EasterEggModal: React.FC<EasterEggModalProps> = ({
  isOpen,
  onClose,
  onJumpToPaintWithTemplate,
  isDarkMode = false,
}) => {
  if (!isOpen) return null;

  const handleCelebrate = () => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FF007F', '#00FFFF', '#FF4500', '#7000FF'],
    });
    audioSynth.playUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn select-none">
      <div className={`relative w-full max-w-md border-4 p-6 shadow-[10px_10px_0px_0px_#000] space-y-5 text-center ${
        isDarkMode ? 'bg-slate-900 border-amber-400 text-white' : 'bg-amber-50 border-black text-black'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center font-black border-2 border-black bg-white text-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Badge Header */}
        <div className="relative inline-block mx-auto mt-2">
          <div className="w-20 h-20 bg-yellow-300 border-4 border-black rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#000] animate-bounce">
            <span className="text-4xl">🥚✨</span>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-500 text-white font-black text-[10px] uppercase px-2 py-0.5 border-2 border-black tracking-widest shadow-[2px_2px_0px_0px_#000]">
            Easter Egg!
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-amber-500 drop-shadow-sm">
            Secret Found!
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            You tapped the secret logo 5 times!
          </p>
        </div>

        {/* Developer Note Card */}
        <div className={`p-4 border-2 border-black text-left space-y-2 shadow-[3px_3px_0px_0px_#000] ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-yellow-500">
            <Wand2 className="w-4 h-4" />
            <span>Alchemist Developer's Secret</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            "Color is the place where our brain and the universe meet." You've unlocked the rare 
            <strong className="text-amber-500 font-black"> Golden Easter Egg </strong> 
            stencil and exclusive cosmic pigment energy!
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              handleCelebrate();
              onJumpToPaintWithTemplate();
            }}
            className="w-full py-3 bg-yellow-300 text-black font-black uppercase text-xs border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
          >
            <Paintbrush className="w-4 h-4" />
            <span>Paint Golden Easter Egg Outline</span>
          </button>

          <button
            onClick={handleCelebrate}
            className="w-full py-2 bg-pink-300 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-pink-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Trigger Confetti Celebration</span>
          </button>
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
          <span>for Infinite Colour Craft</span>
        </div>

      </div>
    </div>
  );
};
