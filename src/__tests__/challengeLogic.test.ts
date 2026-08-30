import { describe, it, expect } from 'vitest';
import { computePass, computeOutcome, CONFIDENCE_BAR, ROUNDS, ROUND_SECONDS } from '../utils/challengeLogic';

const P = (label: string, pct: number) => ({ label, pct, logit: pct });

describe('computePass (true/false positive gate)', () => {
  it('passes when the prompt is the top-1 guess', () => {
    const preds = [P('cat', 0.8), P('dog', 0.1), P('bird', 0.05), P('fish', 0.03), P('tree', 0.02)];
    expect(computePass('cat', preds)).toBe(true);
  });

  it('passes when the prompt is in the top-3 at/above the confidence bar', () => {
    const preds = [P('dog', 0.7), P('cat', CONFIDENCE_BAR), P('bird', 0.1), P('fish', 0.03)];
    expect(computePass('cat', preds)).toBe(true);
  });

  it('fails when the prompt is in the top-3 but below the confidence bar', () => {
    const preds = [P('dog', 0.9), P('bird', 0.05), P('cat', 0.03), P('fish', 0.01)];
    expect(computePass('cat', preds)).toBe(false);
  });

  it('fails when the prompt is not in the top-3', () => {
    const preds = [P('dog', 0.5), P('bird', 0.4), P('fish', 0.05), P('cat', 0.04)];
    expect(computePass('cat', preds)).toBe(false);
  });

  it('fails when the prompt is completely absent', () => {
    const preds = [P('dog', 0.9), P('bird', 0.1)];
    expect(computePass('cat', preds)).toBe(false);
  });
});

describe('computeOutcome scoring', () => {
  it('a correct top-1 with full time earns base + confidence + time bonus, streak 1', () => {
    const out = computeOutcome('cat', [P('cat', 1.0), P('dog', 0)], ROUND_SECONDS, 0);
    expect(out.correct).toBe(true);
    expect(out.promptConfidence).toBe(1.0);
    // base 100 + conf 60 + time 40 = 200
    expect(out.earned).toBe(200);
    expect(out.streak).toBe(1);
  });

  it('streak multiplier compounds on consecutive correct (streak 3 → x2)', () => {
    const out = computeOutcome('cat', [P('cat', 1.0), P('dog', 0)], ROUND_SECONDS, 2);
    expect(out.streak).toBe(3);
    // base 100 + conf 60 + time 40 = 200, x2 = 400
    expect(out.earned).toBe(400);
  });

  it('a wrong guess earns 0 and resets the streak', () => {
    const out = computeOutcome('cat', [P('dog', 0.9), P('bird', 0.1)], 10, 4);
    expect(out.correct).toBe(false);
    expect(out.earned).toBe(0);
    expect(out.streak).toBe(0);
  });

  it('a time-out (timeLeft 0) still passes if the prediction is correct', () => {
    const out = computeOutcome('cat', [P('cat', 0.9), P('dog', 0.1)], 0, 0);
    expect(out.correct).toBe(true);
    // base 100 + conf 54, time bonus 0
    expect(out.earned).toBe(154);
  });

  it('clamps a negative time to no bonus', () => {
    const out = computeOutcome('cat', [P('cat', 0.5), P('dog', 0.3)], -5, 0);
    expect(out.earned).toBe(130); // 100 + 30 + 0
  });
});

describe('constants', () => {
  it('exposes the expected game knobs', () => {
    expect(ROUNDS).toBe(5);
    expect(ROUND_SECONDS).toBe(20);
    expect(CONFIDENCE_BAR).toBe(0.15);
  });
});
