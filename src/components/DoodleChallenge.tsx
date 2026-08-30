import React, { useEffect, useRef, useState, useCallback } from 'react';
import { predict } from '../utils/doodleNet';
import type { DoodleModel } from '../utils/doodleNet';
import { computePass, computeOutcome, ROUNDS, ROUND_SECONDS } from '../utils/challengeLogic';
import { Target, Eraser, Wand2, Loader2, Brain, Trophy, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface DoodleChallengeProps {
  isDarkMode: boolean;
}

const CANVAS_SIZE = 280;
const GRID = 28;

type Phase = 'idle' | 'playing' | 'feedback' | 'gameover';

interface RoundResult {
  prompt: string;
  correct: boolean;
  topLabel: string;
  topPct: number;
  score: number;
  timeLeft: number;
}

interface Feedback {
  correct: boolean;
  topLabel: string;
  topPct: number;
  earned: number;
  streak: number;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const DoodleChallenge: React.FC<DoodleChallengeProps> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<DoodleModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(1);
  const [prompt, setPrompt] = useState<string>('cat');
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [guessing, setGuessing] = useState(false);

  const promptQueueRef = useRef<string[]>([]);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Lazy-load the model weights (code-split)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = (await import('../data/doodle_weights.json')) as unknown as {
          meta: { categories: string[]; val_acc?: number };
          state: Record<string, number[][]>;
        };
        if (cancelled) return;
        const categories = raw.meta.categories;
        setModel({
          categories,
          state: raw.state as never,
        });
        promptQueueRef.current = shuffle(categories);
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

  // Set up canvas
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

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'playing') return;
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getPos(e);
    lastPosRef.current = p;
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

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      // time's up — auto guess
      handleGuess(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const startGame = () => {
    if (!model) return;
    promptQueueRef.current = shuffle(model.categories);
    setResults([]);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRound(1);
    setPrompt(promptQueueRef.current[0]);
    setTimeLeft(ROUND_SECONDS);
    setFeedback(null);
    setPhase('playing');
  };

  const nextPrompt = () => {
    const q = promptQueueRef.current;
    const nextIdx = round; // rounds are 1-based, next index = round
    if (nextIdx < q.length && nextIdx < ROUNDS) {
      setPrompt(q[nextIdx]);
    }
  };

  const getBitmap = (): number[] | null => {
    const canvas = canvasRef.current;
    const off = offscreenRef.current;
    if (!canvas || !off) return null;
    const ctx = canvas.getContext('2d');
    const octx = off.getContext('2d');
    if (!ctx || !octx) return null;
    octx.fillStyle = 'black';
    octx.fillRect(0, 0, GRID, GRID);
    octx.drawImage(canvas, 0, 0, GRID, GRID);
    const imgData = octx.getImageData(0, 0, GRID, GRID);
    const bitmap = new Array<number>(GRID * GRID);
    for (let i = 0; i < GRID * GRID; i++) {
      const idx = i * 4;
      const lum = 0.299 * imgData.data[idx] + 0.587 * imgData.data[idx + 1] + 0.114 * imgData.data[idx + 2];
      bitmap[i] = lum / 255;
    }
    return bitmap;
  };

  const handleGuess = useCallback(
    (timedOut = false) => {
      if (!model || phaseRef.current !== 'playing' || guessing) return;
      if (!timedOut) setGuessing(true);
      const bitmap = getBitmap();
      if (!bitmap) {
        setGuessing(false);
        return;
      }
      const preds = predict(bitmap, model); // sorted desc
      const topLabel = preds[0].label;
      const topPct = preds[0].pct;
      const outcome = computeOutcome(prompt, preds, timeLeft, streak);
      const correct = outcome.correct;
      const earned = outcome.earned;
      const newStreak = outcome.streak;

      setFeedback({ correct, topLabel, topPct, earned, streak: newStreak });
      setResults((r) => [
        ...r,
        { prompt, correct, topLabel, topPct, score: earned, timeLeft },
      ]);
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setScore((s) => s + earned);

      if (round >= ROUNDS) {
        setPhase('gameover');
      } else {
        setPhase('feedback');
      }
      setGuessing(false);
    },
    [model, prompt, round, timeLeft, streak, bestStreak, guessing]
  );

  const nextRound = () => {
    const q = promptQueueRef.current;
    const nextIdx = round; // next round index
    clearCanvas();
    setPrompt(q[nextIdx % q.length]);
    setTimeLeft(ROUND_SECONDS);
    setFeedback(null);
    setRound((r) => r + 1);
    setPhase('playing');
  };

  const pct = (p: number) => Math.round(p * 100);

  return (
    <div className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-y-auto h-full">
      <div className="w-full max-w-3xl flex flex-col items-center gap-4">
        {/* Header bar */}
        <div className={`w-full border-2 border-black shadow-[4px_4px_0px_0px_#000] p-3 flex items-center justify-between ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="font-black uppercase text-sm tracking-tight">Challenge</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-black uppercase">
            <span>Round <span className="text-emerald-400">{Math.min(round, ROUNDS)}/{ROUNDS}</span></span>
            <span>Score <span className="text-emerald-400">{score}</span></span>
            <span>Streak <span className="text-emerald-400">{streak}</span></span>
          </div>
        </div>

        {loading && (
          <div className="py-16 flex items-center gap-2 text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading the doodle brain…
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && phase === 'idle' && (
          <div className={`w-full border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 text-center ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Brain className="w-6 h-6 text-pink-400" />
              <span className="font-black uppercase">Draw it. The AI says true or false.</span>
            </div>
            <p className="text-sm mb-4 opacity-70">
              A real neural network trained on Google's{' '}
              <span className="font-bold">Quick, Draw!</span> dataset will watch your sketch.
              Draw the prompt before the clock runs out — we pass you if the AI sees{' '}
              <span className="font-bold">true</span> (your prompt is its top guess, or in its
              top-3 above 15% confidence).
            </p>
            <p className="text-xs mb-6 opacity-50">
              {ROUNDS} rounds · {ROUND_SECONDS}s each · {model ? model.categories.join(' · ') : ''}
            </p>
            <button
              onClick={startGame}
              disabled={!model}
              className="px-6 py-3 bg-emerald-300 border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] hover:bg-emerald-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" /> Start Challenge
            </button>
          </div>
        )}

        {(phase === 'playing' || phase === 'feedback') && (
          <>
            {/* Prompt + timer */}
            <div className={`w-full border-2 border-black shadow-[4px_4px_0px_0px_#000] p-3 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center justify-center gap-3">
                <span className="font-black uppercase text-xs opacity-60">Draw a</span>
                <span className="font-black uppercase text-2xl tracking-tight text-emerald-400">{prompt}</span>
                {phase === 'playing' && (
                  <span className={`flex items-center gap-1 font-mono text-sm ${timeLeft <= 5 ? 'text-red-500' : 'opacity-70'}`}>
                    <Clock className="w-4 h-4" /> {timeLeft}s
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-6 flex-col md:flex-row items-start">
              {/* Canvas */}
              <div className="flex flex-col gap-3 items-center">
                <div className={`border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'} ${phase === 'playing' ? '' : 'opacity-60 pointer-events-none'}`}>
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDraw}
                    onPointerCancel={endDraw}
                    className="touch-none w-full h-auto block cursor-crosshair"
                    style={{ maxWidth: 300 }}
                  />
                  <canvas ref={offscreenRef} width={GRID} height={GRID} className="hidden" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => clearCanvas()}
                    disabled={phase !== 'playing'}
                    className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-slate-200 text-black hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Eraser className="w-4 h-4" /> Clear
                  </button>
                  <button
                    onClick={() => handleGuess()}
                    disabled={phase !== 'playing' || guessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-emerald-300 text-black hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" /> {guessing ? 'Checking…' : 'Guess'}
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {phase === 'feedback' && feedback && (
                <div className={`w-full max-w-[340px] border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {feedback.correct ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                    <h3 className={`font-black uppercase text-lg ${feedback.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {feedback.correct ? 'TRUE — Right!' : 'FALSE — Not quite'}
                    </h3>
                  </div>
                  <p className="text-sm mb-1">
                    You drew <span className="font-black uppercase">{prompt}</span>. The AI was {pct(feedback.topPct)}% sure it was a{' '}
                    <span className="font-black uppercase">{feedback.topLabel}</span>.
                  </p>
                  <div className="h-3 w-full border-2 border-black bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                    <div className={`h-full ${feedback.correct ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${Math.max(2, pct(feedback.topPct))}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs font-black uppercase mb-4">
                    <span>+{feedback.earned} pts</span>
                    <span>Streak ×{Math.max(1, feedback.streak)}</span>
                  </div>
                  <button
                    onClick={nextRound}
                    className="w-full px-4 py-2 bg-yellow-300 border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    {round >= ROUNDS ? 'See Results' : 'Next Round →'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {phase === 'gameover' && (
          <div className={`w-full border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="w-7 h-7 text-yellow-400" />
              <h2 className="font-black uppercase text-2xl tracking-tight">Challenge Complete</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5 text-center">
              <div className="border-2 border-black p-3">
                <div className="text-2xl font-black text-emerald-400">{score}</div>
                <div className="text-[10px] font-black uppercase opacity-60">Total Score</div>
              </div>
              <div className="border-2 border-black p-3">
                <div className="text-2xl font-black text-emerald-400">{results.filter((r) => r.correct).length}/{results.length}</div>
                <div className="text-[10px] font-black uppercase opacity-60">Correct</div>
              </div>
              <div className="border-2 border-black p-3">
                <div className="text-2xl font-black text-emerald-400">{bestStreak}</div>
                <div className="text-[10px] font-black uppercase opacity-60">Best Streak</div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-5">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-5 h-5 flex items-center justify-center border-2 border-black ${r.correct ? 'bg-emerald-300' : 'bg-red-300'}`}>
                    {r.correct ? '✓' : '✗'}
                  </span>
                  <span className="font-black uppercase w-16">{r.prompt}</span>
                  <span className="opacity-60">AI saw a {r.topLabel} ({pct(r.topPct)}%)</span>
                  <span className="ml-auto font-mono font-black">+{r.score}</span>
                </div>
              ))}
            </div>

            <button
              onClick={startGame}
              className="mx-auto px-6 py-3 bg-emerald-300 border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] hover:bg-emerald-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
