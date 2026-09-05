import React, { useEffect, useRef, useState, useCallback } from 'react';
import { predict } from '../utils/doodleNet';
import type { DoodleModel } from '../utils/doodleNet';
import { preprocessCanvas } from '../utils/doodlePreprocess';
import { Sparkles, Eraser, Wand2, Loader2, Brain, Eye, CheckCircle2 } from 'lucide-react';

interface Prediction {
  label: string;
  pct: number;
}

interface DoodleAIProps {
  isDarkMode: boolean;
}

const CANVAS_SIZE = 480;
const STROKE_WIDTH = 18;
const TOP_PREDICTIONS = 5;

const SUGGESTIONS = ['cat', 'dog', 'bird', 'fish', 'flower', 'tree', 'star', 'clock', 'car', 'book'];

export const DoodleAI: React.FC<DoodleAIProps> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<DoodleModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [radarUrl, setRadarUrl] = useState<string>('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const autoGuessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lazy-load the model weights
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = (await import('../data/doodle_weights.json')) as unknown as {
          meta: { categories: string[]; val_acc?: number };
          state: Record<string, number[][]>;
        };
        if (cancelled) return;
        setModel({
          categories: raw.meta.categories,
          state: raw.state as never,
        });
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Could not load the doodle neural model.');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    clearCanvas(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDarkMode]);

  const clearCanvas = (ctx?: CanvasRenderingContext2D | null) => {
    const canvas = canvasRef.current;
    const c = ctx ?? canvas?.getContext('2d');
    if (!c || !canvas) return;
    c.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
    c.fillRect(0, 0, canvas.width, canvas.height);
    setPredictions(null);
    setRadarUrl('');
    setHasDrawn(false);
  };

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const triggerGuess = useCallback(() => {
    if (!model || !canvasRef.current) return;
    const { bitmap, hasStrokes, previewUrl } = preprocessCanvas(canvasRef.current, isDarkMode);
    if (!hasStrokes) {
      setPredictions(null);
      setRadarUrl('');
      return;
    }
    setRadarUrl(previewUrl);
    const result = predict(bitmap, model);
    setPredictions(
      result.slice(0, TOP_PREDICTIONS).map((p) => ({ label: p.label, pct: p.pct }))
    );
  }, [model, isDarkMode]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    setHasDrawn(true);
    const p = getPos(e);
    lastPosRef.current = p;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#111827';
      ctx.beginPath();
      ctx.arc(p.x, p.y, STROKE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    e.preventDefault();
    const p = getPos(e);

    ctx.strokeStyle = isDarkMode ? '#ffffff' : '#111827';
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current ? lastPosRef.current.x : p.x, lastPosRef.current ? lastPosRef.current.y : p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPosRef.current = p;

    // Real-time debounced prediction for instant interactive feedback
    if (autoGuessTimeoutRef.current) clearTimeout(autoGuessTimeoutRef.current);
    autoGuessTimeoutRef.current = setTimeout(() => {
      triggerGuess();
    }, 180);
  };

  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPosRef.current = null;
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    triggerGuess();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto h-full">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center md:items-start justify-center gap-6">
        
        {/* Left Card: Drawing Canvas */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[460px]">
          <div
            className={`border-2 border-black shadow-[4px_4px_0px_0px_#000] p-1 w-full aspect-square ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDraw}
              onPointerCancel={endDraw}
              className="touch-none block cursor-crosshair rounded-xs w-full h-full"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-full justify-between items-center">
            <button
              onClick={() => clearCanvas()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-slate-200 text-black hover:bg-slate-100 transition-colors"
            >
              <Eraser className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={triggerGuess}
              disabled={loading || !!error || !hasDrawn}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-yellow-300 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Recognize
            </button>
          </div>

          {/* Neural Sensor Radar thumbnail */}
          {radarUrl && (
            <div className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 border-2 border-black/30 rounded-xs text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] ${isDarkMode ? 'bg-slate-900/80 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-pink-400 shrink-0" />
                <div>
                  <p className="font-black text-[11px] uppercase tracking-wide">CNN Sensor Input</p>
                  <p className="text-[10px] opacity-70">Preprocessed & normalized 28×28 neural matrix</p>
                </div>
              </div>
              <img
                src={radarUrl}
                alt="Neural Vision"
                className="w-12 h-12 border-2 border-black bg-black rounded-[2px] shrink-0"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}
        </div>

        {/* Right Card: Predictions & Guidance */}
        <div
          className={`w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 flex flex-col gap-3 ${
            isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-pink-400/20 border border-pink-500/40 flex items-center justify-center text-pink-500">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black uppercase text-sm tracking-tight">Doodle Neural Vision</h2>
                <p className="text-[10px] opacity-60">Real-time local CNN classifier (88.7% accuracy)</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              Active
            </span>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-xs opacity-60 py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Initializing local neural weights…
            </div>
          )}

          {error && <p className="text-xs text-rose-500 py-3">{error}</p>}

          {!loading && !error && (
            <>
              {predictions && predictions.length > 0 ? (
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-bold opacity-70">Top Predictions</span>
                    <span className="text-[11px] font-mono opacity-50">Confidence</span>
                  </div>

                  {predictions.map((p, i) => {
                    const barPct = Math.round(p.pct * 100);
                    const isTop = i === 0 && barPct >= 20;
                    return (
                      <div key={p.label} className="flex items-center gap-2.5">
                        <span className={`w-16 font-black uppercase text-xs text-left ${isTop ? 'text-pink-500' : 'opacity-70'}`}>
                          {p.label}
                        </span>
                        <div className="flex-1 h-4 border-2 border-black bg-slate-100 dark:bg-slate-800 overflow-hidden relative rounded-xs">
                          <div
                            className={`h-full transition-all duration-200 ${
                              i === 0
                                ? 'bg-pink-400'
                                : i === 1
                                ? 'bg-purple-400'
                                : 'bg-cyan-400'
                            }`}
                            style={{ width: `${Math.max(3, barPct)}%` }}
                          />
                        </div>
                        <span className={`w-10 text-right font-mono text-xs font-bold ${isTop ? 'text-pink-500' : 'opacity-70'}`}>
                          {barPct}%
                        </span>
                      </div>
                    );
                  })}

                  <div className="mt-2 p-2.5 rounded border border-pink-500/30 bg-pink-500/10 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 flex-shrink-0" />
                    <span>
                      Detected:{' '}
                      <strong className="uppercase font-black text-pink-500">
                        {predictions[0]?.pct >= 0.15 ? predictions[0].label : 'Doodling…'}
                      </strong>{' '}
                      ({Math.round(predictions[0]?.pct * 100)}% match)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs opacity-70 mb-3">
                    Draw any of the 10 supported objects on the canvas to see real-time AI recognition!
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {SUGGESTIONS.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 text-[11px] font-bold uppercase rounded border border-black/20 dark:border-white/20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
