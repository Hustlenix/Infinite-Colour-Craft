export const TOP = 3;
export const CONFIDENCE_BAR = 0.15; // pass if prompt is in top-3 above this bar
export const ROUNDS = 5;
export const ROUND_SECONDS = 20;
export const BASE_SCORE = 100;
export const CONF_MAX_BONUS = 60;
export const TIME_MAX_BONUS = 40;

export interface ChallengePred {
  label: string;
  pct: number;
  logit: number;
}

export interface ChallengeOutcome {
  correct: boolean;
  promptConfidence: number; // model confidence assigned to the prompt label (0 if not a top label)
  earned: number;
  streak: number;
}

/**
 * True-positive / false-positive pass condition.
 * correct = prompt is the model's top guess, OR prompt appears in the top-3 with >= CONFIDENCE_BAR.
 * preds must be sorted descending by pct (as `predict` returns).
 */
export function computePass(prompt: string, preds: ChallengePred[]): boolean {
  const topLabels = preds.slice(0, TOP).map((p) => p.label);
  const promptPred = preds.find((p) => p.label === prompt);
  if (preds[0]?.label === prompt) return true;
  if (promptPred && topLabels.includes(prompt) && promptPred.pct >= CONFIDENCE_BAR) return true;
  return false;
}

export function computeOutcome(
  prompt: string,
  preds: ChallengePred[],
  timeLeft: number,
  priorStreak: number
): ChallengeOutcome {
  const correct = computePass(prompt, preds);
  const promptPred = preds.find((p) => p.label === prompt);
  const promptConfidence = correct && promptPred ? promptPred.pct : 0;
  const confidenceBonus = correct ? Math.round(promptConfidence * CONF_MAX_BONUS) : 0;
  const timeBonus = Math.round((Math.max(0, timeLeft) / ROUND_SECONDS) * TIME_MAX_BONUS);
  const streak = correct ? priorStreak + 1 : 0;
  const multiplier = correct ? 1 + Math.max(0, streak - 1) * 0.5 : 1;
  const earned = correct ? Math.round((BASE_SCORE + confidenceBonus + timeBonus) * multiplier) : 0;
  return { correct, promptConfidence, earned, streak };
}
