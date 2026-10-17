import { computeOutcome, remainingSeconds, ROUND_SECONDS, ROUNDS, type ChallengePred } from '../utils/challengeLogic';
export type RoundResult = { prompt: string; topLabel: string; correct: boolean; score: number; seconds: number; topPct?:number };
export type SpeedSession = { phase: 'idle' | 'drawing' | 'paused' | 'evaluating' | 'feedback' | 'results'; prompts: string[]; deadline: number; seconds: number; results: RoundResult[]; streak: number };
export const idleSession = (): SpeedSession => ({ phase: 'idle', prompts: [], deadline: 0, seconds: 20, results: [], streak: 0 });
export function startSession(prompts: string[], now: number): SpeedSession {
  if (new Set(prompts).size < ROUNDS) throw Error('Five distinct prompts are required.');
  return { ...idleSession(), phase: 'drawing', prompts: prompts.slice(0, ROUNDS), deadline: now + ROUND_SECONDS * 1000 };
}
export function pauseSession(s: SpeedSession, now: number): SpeedSession {
  return s.phase === 'drawing' ? { ...s, phase: 'paused', seconds: remainingSeconds(s.deadline, now) } : s;
}
export function resumeSession(s: SpeedSession, now: number): SpeedSession {
  return s.phase === 'paused' ? { ...s, phase: 'drawing', deadline: now + s.seconds * 1000 } : s;
}
export function beginEvaluation(s: SpeedSession, now: number): SpeedSession {
  return s.phase === 'drawing' ? { ...s, phase: 'evaluating', seconds: remainingSeconds(s.deadline, now) } : s;
}
export function finishRound(s: SpeedSession, predictions: ChallengePred[]): SpeedSession {
  if (s.phase !== 'evaluating') return s;
  const prompt = s.prompts[s.results.length], outcome = computeOutcome(prompt, predictions, s.seconds, s.streak);
  const results = [...s.results, { prompt, topLabel: predictions[0]?.label || 'blank drawing', correct: outcome.correct, score: outcome.earned, seconds: s.seconds }];
  return { ...s, results, streak: outcome.streak, phase: 'feedback' };
}
export function nextRound(s: SpeedSession, now: number): SpeedSession {
  if(s.phase !== 'feedback')return s;
  return s.results.length===ROUNDS ? {...s,phase:'results'} : { ...s, phase: 'drawing', seconds: ROUND_SECONDS, deadline: now + ROUND_SECONDS * 1000 };
}
