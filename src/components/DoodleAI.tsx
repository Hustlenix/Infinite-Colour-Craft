import React, { useEffect, useRef, useState, useCallback } from 'react';
import { predict } from '../utils/doodleNet';
import type { DoodleModel } from '../utils/doodleNet';
import { Sparkles, Eraser, Wand2, Loader2, Brain } from 'lucide-react';

interface Prediction {
  label: string;
  pct: number;
}

interface DoodleAIProps {
  isDarkMode: boolean;
}

const CANVAS_SIZE = 280; // display size
const GRID = 28; // model input

const TOP_PREDICTIONS = 3;

export const DoodleAI: React.FC<DoodleAIProps> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<DoodleModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Lazy-load the model weights (code-split into a separate chunk)
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
          setError('Could not load the doodle model. Please try again.');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Set up drawing on first render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const off = offscreenRef.current;
    const octx = off ? off.getContext('2d') : null;
    if (off && octx) {
      octx.fillStyle = 'black';
      octx.fillRect(0, 0, GRID, GRID);
    }
    clearCanvas(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearCanvas = (ctx?: CanvasRenderingContext2D | null) => {
    const canvas = canvasRef.current;
    const c = ctx ?? canvas?.getContext('2d');
    if (!c || !canvas) return;
    c.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
    c.fillRect(0, 0, canvas.width, canvas.height);
    setPredictions(null);
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

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.strokeStyle = isDarkMode ? '#ffffff' : '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getPos(e);
    lastPosRef.current = p;
    // draw a dot
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
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
    ctx.strokeStyle = isDarkMode ? '#ffffff' : '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current ? lastPosRef.current.x : p.x, lastPosRef.current ? lastPosRef.current.y : p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPosRef.current = p;
  };

  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPosRef.current = null;
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleGuess = useCallback(() => {
    if (!model) return;
    const canvas = canvasRef.current;
    const off = offscreenRef.current;
    if (!canvas || !off) return;
    const ctx = canvas.getContext('2d');
    const octx = off.getContext('2d');
    if (!ctx || !octx) return;

    // Downsample the display canvas to 28x28 grayscale
    octx.fillStyle = 'black';
    octx.fillRect(0, 0, GRID, GRID);
    // draw white strokes; note the display may be dark mode — use a luminance check instead
    octx.drawImage(canvas, 0, 0, GRID, GRID);
    const imgData = octx.getImageData(0, 0, GRID, GRID);
    const bitmap = new Array<number>(GRID * GRID);
    for (let i = 0; i < GRID * GRID; i++) {
      const idx = i * 4;
      const r = imgData.data[idx];
      const g = imgData.data[idx + 1];
      const b = imgData.data[idx + 2];
      // Brightness -> stroke presence (white stroke on any bg)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      bitmap[i] = lum / 255;
    }
    const result = predict(bitmap, model);
    setPredictions(
      result.slice(0, TOP_PREDICTIONS).map((p) => ({ label: p.label, pct: p.pct }))
    );
  }, [model]);

  return (
    <div className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-y-auto h-full md:flex-row flex-col gap-6">
      {/* Left: canvas + actions */}
      <div className="flex flex-col gap-4 items-center">
        <div className="w-full max-w-[340px]">
          <div
            className={`border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden ${
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
              className="touch-none w-full h-auto block cursor-crosshair"
            />
            <canvas ref={offscreenRef} width={GRID} height={GRID} className="hidden" />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => clearCanvas()}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-slate-200 text-black hover:bg-slate-100"
          >
            <Eraser className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleGuess}
            disabled={loading || !!error}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-pink-300 text-black hover:bg-pink-400 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Wand2 className="w-4 h-4" />
            Guess
          </button>
        </div>
      </div>

      {/* Right: results */}
      <div
        className={`w-full max-w-[340px] border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 ${
          isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-pink-400" />
          <h2 className="font-black uppercase text-sm tracking-tight">Doodle AI</h2>
        </div>
        <p className="text-[11px] mb-3 opacity-70 leading-snug">
          A real neural network trained on Google's{' '}
          <span className="font-bold">Quick, Draw!</span> dataset recognizes your doodle.
          Runs entirely in your browser — no network.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-xs opacity-60 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading brain…
          </div>
        )}

        {error && <p className="text-xs text-red-500 py-3">{error}</p>}

        {!loading && !error && (
          <>
            {predictions ? (
              <div className="flex flex-col gap-2">
                {predictions.map((p, i) => {
                  const barPct = Math.round(p.pct * 100);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-16 font-black uppercase text-[11px] text-left">{p.label}</span>
                      <div className="flex-1 h-4 border-2 border-black bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <div
                          className={`h-full transition-all ${
                            i === 0 ? 'bg-pink-300' : i === 1 ? 'bg-purple-300' : 'bg-cyan-300'
                          }`}
                          style={{ width: `${Math.max(2, barPct)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-[11px]">{barPct}%</span>
                    </div>
                  );
                })}
                <p className="text-[10px] mt-1 opacity-50 text-center">
                  I think it's a{' '}
                  <span className="font-bold uppercase text-pink-500">
                    {predictions[0]?.label ?? '…'}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-xs opacity-50 py-6 text-center">
                Draw something, then press{' '}
                <span className="font-bold uppercase">Guess</span>.
                <br />I can recognize:{' '}
                {model ? model.categories.join(', ') : '…'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
