import React from 'react';
import { X, Sparkles, Trophy, Cpu, Wand2, ShieldCheck, ExternalLink, Volume2, Palette } from 'lucide-react';

interface HackTheArtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchStudio: () => void;
  isDarkMode: boolean;
}

export const HackTheArtsModal: React.FC<HackTheArtsModalProps> = ({
  isOpen,
  onClose,
  onLaunchStudio,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-black ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'} shadow-[8px_8px_0px_0px_#000] p-6 md:p-8`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-black mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-300 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
              <Trophy className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <span className="text-xs font-black uppercase bg-pink-300 text-black px-2 py-0.5 border-2 border-black">
                Hack The Arts Submission
              </span>
              <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight mt-1">
                Infinite Colour Craft
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-red-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] hover:bg-red-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Close"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Theme Banner */}
        <div className={`p-4 border-2 border-black ${isDarkMode ? 'bg-slate-800' : 'bg-yellow-50'} mb-6 shadow-[4px_4px_0px_0px_#000]`}>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-yellow-600 dark:text-yellow-400 mb-1">
            <Sparkles className="w-4 h-4 fill-yellow-400" />
            <span>Theme: "Create art that couldn’t exist without technology."</span>
          </div>
          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Rather than replicating traditional media, Infinite Colour Craft merges <strong>perceptual RYB paint-mixing math</strong> (blue + yellow makes green, not grey), <strong>interpolated brush physics</strong>, a <strong>neural network trained on Google's Quick, Draw! dataset</strong> that guesses your doodles in real time, and <strong>procedural Web Audio synthesis</strong> into a computational art medium that responds to every stroke.
          </p>
        </div>

        {/* Judging Criteria Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          
          <div className={`p-4 border-2 border-black ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} shadow-[4px_4px_0px_0px_#000]`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-black uppercase text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" /> Creativity & Originality
              </span>
              <span className="bg-yellow-300 text-black font-black text-xs px-2 py-0.5 border border-black">30%</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Turns color discovery into combinatorial play grounded in real paint behavior — mixes resolve to 150+ real pigment names, from classics like Orange to hidden gems like Madder Lake.
            </p>
          </div>

          <div className={`p-4 border-2 border-black ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} shadow-[4px_4px_0px_0px_#000]`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-black uppercase text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Use of Technology
              </span>
              <span className="bg-yellow-300 text-black font-black text-xs px-2 py-0.5 border border-black">25%</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              A <strong>convolutional neural network trained on Google's Quick, Draw! dataset</strong> runs <strong>fully in-browser</strong> to recognize your doodles; plus perceptual RYB color-space blending, RAF-batched stroke interpolation for gap-free brushes, and a live Web Audio synthesis graph — all browser-native, zero paid APIs.
            </p>
          </div>

          <div className={`p-4 border-2 border-black ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} shadow-[4px_4px_0px_0px_#000]`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-black uppercase text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" /> Interactivity & Experience
              </span>
              <span className="bg-yellow-300 text-black font-black text-xs px-2 py-0.5 border border-black">20%</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Frictionless drag-and-drop workspace, eleven brush tools with symmetry stencils and blend modes, live synthesized audio feedback on every stroke, and a <strong>Quick, Draw!-style Doodle AI</strong> that watches your sketch and guesses what you drew.
            </p>
          </div>

          <div className={`p-4 border-2 border-black ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} shadow-[4px_4px_0px_0px_#000]`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-black uppercase text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Execution & Theme
              </span>
              <span className="bg-yellow-300 text-black font-black text-xs px-2 py-0.5 border border-black">25%</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Fully tested with Vitest (86 passing unit tests incl. the neural-net inference engine), responsive UI, dark/light modes, and zero external paid dependencies.
            </p>
          </div>

        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t-2 border-black">
          <div className="text-xs font-mono text-slate-400">
            Status: Ready for submission • 100% Browser Native
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onLaunchStudio();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-yellow-300 text-black border-2 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2"
            >
              <Palette className="w-4 h-4" />
              <span>Launch Paint Studio</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-black dark:text-white border-2 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_#000] hover:bg-slate-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
