import React, { useEffect, useRef, useState, useCallback } from 'react';
import { predict } from '../utils/doodleNet';
import type { DoodleModel } from '../utils/doodleNet';
import { computeOutcome, ROUNDS, ROUND_SECONDS } from '../utils/challengeLogic';
import { preprocessCanvas } from '../utils/doodlePreprocess';
import { Target, Eraser, Wand2, Loader2, Brain, Trophy, RefreshCw, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface DoodleChallengeProps {
  isDarkMode: boolean;
}

const CANVAS_SIZE = 480;
const STROKE_WIDTH = 18;

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

  // Lazy-load model weights
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
          setError('Could not load the doodle model.');
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

  const handleGuess = useCallback(
    (timedOut = false) => {
      if (!model || phaseRef.current !== 'playing' || guessing) return;
      if (!timedOut) setGuessing(true);

      const canvas = canvasRef.current;
      if (!canvas) {
        setGuessing(false);
        return;
      }

      const { bitmap, hasStrokes } = preprocessCanvas(canvas, isDarkMode);

      let topLabel = 'nothing';
      let topPct = 0;
      let earned = 0;
      let correct = false;
      let newStreak = 0;

      if (hasStrokes) {
        const preds = predict(bitmap, model);
        topLabel = preds[0].label;
        topPct = preds[0].pct;
        const outcome = computeOutcome(prompt, preds, timeLeft, streak);
        correct = outcome.correct;
        earned = outcome.earned;
        newStreak = outcome.streak;
      } else {
        // Blank canvas submission
        correct = false;
        newStreak = 0;
        earned = 0;
      }

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
    [model, prompt, round, timeLeft, streak, bestStreak, guessing, isDarkMode]
  );

  // Countdown Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      handleGuess(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, handleGuess]);

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
    setTimeout(() => clearCanvas(), 50);
  };

  const nextRound = () => {
    const q = promptQueueRef.current;
    const nextIdx = round;
    clearCanvas();
    setPrompt(q[nextIdx % q.length]);
    setTimeLeft(ROUND_SECONDS);
    setFeedback(null);
    setRound((r) => r + 1);
    setPhase('playing');
  };

  const pct = (p: number) => Math.round(p * 100);

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto h-full">
      <div className="w-full max-w-5xl flex flex-col items-center gap-4">
        
        {/* Top Status Header */}
        <div
          className={`w-full border-2 border-black shadow-[4px_4px_0px_0px_#000] p-3 flex items-center justify-between ${
            isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <h2 className="font-black uppercase text-sm tracking-tight">Speed Doodle Challenge</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-black uppercase">
            <span>
              Round <strong className="text-emerald-500">{Math.min(round, ROUNDS)}/{ROUNDS}</strong>
            </span>
            <span>
              Score <strong className="text-emerald-500">{score}</strong>
            </span>
            <span>
              Streak <strong className="text-emerald-500">{streak}</strong>
            </span>
          </div>
        </div>

        {loading && (
          <div className="py-16 flex items-center gap-2 text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading doodle brain…
          </div>
        )}

        {error && <p className="text-sm text-rose-500">{error}</p>}

        {/* Phase: Idle */}
        {!loading && !error && phase === 'idle' && (
          <div
            className={`w-full border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 text-center ${
              isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-6 h-6 text-pink-500" />
              <span className="font-black uppercase text-base tracking-tight">Test Your Drawing Skills</span>
            </div>
            <p className="text-xs mb-4 opacity-75 max-w-md mx-auto leading-relaxed">
              Sketch the prompted object within {ROUND_SECONDS} seconds. The local AI classifier will judge if it can recognize your doodle!
            </p>
            <div className="text-[11px] mb-6 opacity-60 flex flex-wrap justify-center gap-1.5 max-w-lg mx-auto">
              {model?.categories.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded border border-black/20 dark:border-white/20 font-bold uppercase">
                  {c}
                </span>
              ))}
            </div>
            <button
              onClick={startGame}
              disabled={!model}
              className="px-6 py-2.5 bg-emerald-300 text-black border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:bg-emerald-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 flex items-center gap-2 mx-auto transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Start Challenge
            </button>
          </div>
        )}

        {/* Phase: Playing or Feedback */}
        {(phase === 'playing' || phase === 'feedback') && (
          <div className="w-full flex flex-col gap-4 items-center">
            
            {/* Prompt banner */}
            <div
              className={`w-full border-2 border-black shadow-[4px_4px_0px_0px_#000] p-3 flex items-center justify-between ${
                isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-black uppercase text-xs opacity-60">Target:</span>
                <span className="font-black uppercase text-xl tracking-tight text-emerald-500">
                  {prompt}
                </span>
              </div>
              {phase === 'playing' && (
                <div className={`flex items-center gap-1.5 font-mono font-bold text-sm px-2.5 py-0.5 rounded border ${
                  timeLeft <= 5 
                    ? 'border-rose-500 text-rose-500 bg-rose-500/10 animate-pulse' 
                    : 'border-black/20 text-emerald-500 bg-emerald-500/10'
                }`}>
                  <Clock className="w-4 h-4" /> {timeLeft}s
                </div>
              )}
            </div>

            <div className="flex gap-6 flex-col md:flex-row items-center md:items-start justify-center w-full">
              {/* Canvas area */}
              <div className="flex flex-col gap-3 items-center w-full max-w-[460px]">
                <div
                  className={`border-2 border-black shadow-[4px_4px_0px_0px_#000] p-1 w-full aspect-square ${
                    isDarkMode ? 'bg-slate-800' : 'bg-white'
                  } ${phase === 'playing' ? '' : 'opacity-80'}`}
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

                <div className="flex gap-2 w-full justify-between">
                  <button
                    onClick={() => clearCanvas()}
                    disabled={phase !== 'playing'}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-slate-200 text-black hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <Eraser className="w-4 h-4" /> Clear
                  </button>
                  <button
                    onClick={() => handleGuess()}
                    disabled={phase !== 'playing' || guessing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-emerald-300 text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" /> {guessing ? 'Judging…' : 'Submit'}
                  </button>
                </div>
              </div>

              {/* Feedback panel */}
              {phase === 'feedback' && feedback && (
                <div
                  className={`w-full max-w-sm border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 flex flex-col justify-between ${
                    isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {feedback.correct ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                      )}
                      <h3
                        className={`font-black uppercase text-base ${
                          feedback.correct ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {feedback.correct ? 'Match Confirmed!' : 'AI Guessed: ' + feedback.topLabel}
                      </h3>
                    </div>

                    <p className="text-xs mb-3 opacity-80 leading-snug">
                      Target was <strong className="uppercase">{prompt}</strong>. The neural model was{' '}
                      <strong>{pct(feedback.topPct)}%</strong> confident you drew a{' '}
                      <strong className="uppercase">{feedback.topLabel}</strong>.
                    </p>

                    <div className="h-3 w-full border-2 border-black bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3 rounded-xs">
                      <div
                        className={`h-full transition-all duration-300 ${
                          feedback.correct ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.max(4, pct(feedback.topPct))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-black uppercase mb-4 opacity-75">
                      <span>Score: +{feedback.earned} pts</span>
                      <span>Streak: ×{Math.max(1, feedback.streak)}</span>
                    </div>
                  </div>

                  <button
                    onClick={nextRound}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-300 text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] hover:bg-yellow-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors"
                  >
                    <span>{round >= ROUNDS ? 'See Final Results' : 'Next Round'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase: Gameover */}
        {phase === 'gameover' && (
          <div
            className={`w-full border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 text-center ${
              isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="font-black uppercase text-xl tracking-tight">Challenge Results</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-3 my-4 text-center">
              <div className="border-2 border-black p-2.5 bg-slate-50 dark:bg-slate-800">
                <div className="text-xl font-black text-emerald-500">{score}</div>
                <div className="text-[10px] font-black uppercase opacity-60">Total Score</div>
              </div>
              <div className="border-2 border-black p-2.5 bg-slate-50 dark:bg-slate-800">
                <div className="text-xl font-black text-emerald-500">
                  {results.filter((r) => r.correct).length}/{results.length}
                </div>
                <div className="text-[10px] font-black uppercase opacity-60">Correct</div>
              </div>
              <div className="border-2 border-black p-2.5 bg-slate-50 dark:bg-slate-800">
                <div className="text-xl font-black text-emerald-500">{bestStreak}</div>
                <div className="text-[10px] font-black uppercase opacity-60">Best Streak</div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-5 max-h-44 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs p-1.5 border border-black/10 dark:border-white/10 rounded"
                >
                  <span
                    className={`w-5 h-5 flex items-center justify-center border border-black text-[10px] font-black ${
                      r.correct ? 'bg-emerald-300 text-black' : 'bg-rose-300 text-black'
                    }`}
                  >
                    {r.correct ? '✓' : '✗'}
                  </span>
                  <span className="font-black uppercase w-16 text-left">{r.prompt}</span>
                  <span className="opacity-60 text-left flex-1">
                    AI saw: {r.topLabel} ({pct(r.topPct)}%)
                  </span>
                  <span className="font-mono font-black text-right">+{r.score}</span>
                </div>
              ))}
            </div>

            <button
              onClick={startGame}
              className="mx-auto px-6 py-2.5 bg-emerald-300 text-black border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:bg-emerald-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
