import React, { useEffect, useRef, useState } from 'react';
import { useDoodleModel } from '../ai/modelService';
import { useDoodleDrawing } from '../ai/useDoodleDrawing';
import { recognizeDoodle } from '../ai/inference';
import { computeOutcome, ROUNDS, ROUND_SECONDS, remainingSeconds } from '../utils/challengeLogic';
import { beginEvaluation,finishRound,idleSession,nextRound as advanceRound,pauseSession,resumeSession,startSession,type SpeedSession } from '../ai/speedSession';
import { Target,Eraser,Wand2,Loader2,Brain,Trophy,RefreshCw,Clock,CheckCircle2,XCircle,ArrowRight } from 'lucide-react';
const CANVAS_SIZE=480;
interface DoodleChallengeProps { isDarkMode:boolean;active?:boolean;ink?:string }
export const DoodleChallenge:React.FC<DoodleChallengeProps>=({isDarkMode,active=true,ink})=>{
 const {model,loading,error,retry}=useDoodleModel(active);
 const [session,setSession]=useState(idleSession),current=useRef(session),[timeLeft,setTimeLeft]=useState(20),[evalError,setEvalError]=useState('');
 const commit=(s:SpeedSession)=>{current.current=s;setSession(s);};
 const drawing=useDoodleDrawing(ink||(isDarkMode?'#FFFFFF':'#111827'),active&&session.phase==='drawing');
 const canvasRef=drawing.canvas,clearCanvas=drawing.clear;
 const onPointerDown=drawing.handlers.onPointerDown,onPointerMove=drawing.handlers.onPointerMove,endDraw=drawing.handlers.onPointerUp;
 const phase=session.phase==='results'?'gameover':['drawing','paused','evaluating'].includes(session.phase)?'playing':session.phase;
 const paused=session.phase==='paused',guessing=session.phase==='evaluating';
 const round=Math.min(ROUNDS,session.results.length+(session.phase==='feedback'?0:1)),last=session.results.at(-1);
 const prompt=session.phase==='feedback'?last?.prompt:session.prompts[Math.min(session.results.length,4)];
 const results=session.results.map(r=>({...r,topPct:r.topPct||0,timeLeft:r.seconds})),score=results.reduce((n,r)=>n+r.score,0),streak=session.streak;
 const bestStreak=results.reduce((s,r)=>{s.run=r.correct?s.run+1:0;s.best=Math.max(s.best,s.run);return s;},{run:0,best:0}).best;
 const feedback=last?{correct:last.correct,topLabel:last.topLabel,topPct:last.topPct||0,earned:last.score,streak}:null;
 const evaluation=useRef<AbortController|null>(null),submitRef=useRef<()=>void>(()=>{});
 useEffect(()=>()=>evaluation.current?.abort(),[]);
 const handleGuess=async()=>{
  const s=current.current;if(!model||s.phase!=='drawing')return;
  const evaluating=beginEvaluation(s,performance.now());commit(evaluating);const controller=new AbortController();evaluation.current=controller;
  try{const input=drawing.preprocess(),preds=input.hasStrokes?await recognizeDoodle(input.bitmap,model,controller.signal):[];
   if(controller.signal.aborted)return;const next=finishRound(evaluating,preds);next.results[next.results.length-1].topPct=preds[0]?.pct||0;commit(next);setEvalError('');
  }catch(e){if(!controller.signal.aborted){commit({...evaluating,phase:'paused'});setEvalError('Evaluation failed. Resume to try again: '+String(e));}}
 };
 submitRef.current=handleGuess;
 useEffect(()=>{if(session.phase!=='drawing')return;const tick=()=>{if(current.current.phase!=='drawing')return;const seconds=remainingSeconds(current.current.deadline,performance.now());setTimeLeft(Math.ceil(seconds));if(!seconds)submitRef.current();};tick();const timer=setInterval(tick,100);return()=>clearInterval(timer);},[session.phase,session.deadline]);
 useEffect(()=>{const pause=()=>{if(current.current.phase==='drawing'){const s=pauseSession(current.current,performance.now());if(!s.seconds)submitRef.current();else commit(s);}};if(!active)pause();const hide=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[active]);
 const startGame=()=>{if(!model||!['idle','results'].includes(current.current.phase))return;const q=[...model.categories];for(let i=q.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[q[i],q[j]]=[q[j],q[i]];}clearCanvas();commit(startSession(q,performance.now()));};
 const nextRound=()=>{if(current.current.phase!=='feedback')return;clearCanvas();commit(advanceRound(current.current,performance.now()));};
 const pct=(p:number)=>Math.round(p*100);

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

        {error && <div role="alert" className="text-sm text-rose-500">{error}<button onClick={retry} className="border-2 border-black px-3 py-2 ml-2 bg-yellow-300 text-black">Retry model</button></div>}
        <p className="text-xs font-bold text-center">Five rounds · 20 seconds each. Pauses when you leave this section or hide the browser tab. Reload starts a new session.</p>
        {paused && <div role="status" className="border-2 border-black p-3 bg-yellow-300 text-black font-bold">Paused · {Math.ceil(session.seconds)} seconds remain. <button className="border-2 border-black px-3 py-2 bg-white" onClick={()=>commit(resumeSession(current.current,performance.now()))}>Resume round</button></div>}
        {evalError && <p role="alert">{evalError}</p>}

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
                    onPointerCancel={drawing.handlers.onPointerCancel}
                    onLostPointerCapture={drawing.handlers.onLostPointerCapture}
                    aria-label="Speed Challenge canvas"
                    className="touch-none block cursor-crosshair rounded-xs w-full h-full"
                  />
                </div>

                <div className="flex gap-2 w-full justify-between">
                  <button
                    onClick={() => clearCanvas()}
                    disabled={session.phase !== 'drawing'}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-slate-200 text-black hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <Eraser className="w-4 h-4" /> Clear
                  </button>
                  <button
                    onClick={() => handleGuess()}
                    disabled={session.phase !== 'drawing'}
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
                      Target was <strong className="uppercase">{prompt}</strong>. The model guessed{' '}
                      <strong className="uppercase">{feedback.topLabel}</strong> with a{' '}
                      <strong>{pct(feedback.topPct)}%</strong> model score. This is not guaranteed accuracy.
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
