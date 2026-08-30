import { describe, it, expect } from 'vitest';
import { forward, softmax, predict } from '../utils/doodleNet';
import rawModel from '../data/doodle_weights.json';
import fixture from './fixture_doodle.json';

const model = rawModel as unknown as {
  meta: { categories: string[] };
  state: Record<string, number[][]>;
};

describe('doodleNet inference engine', () => {
  it('forward + softmax match the reference numpy forward exactly', () => {
    const cats = model.meta.categories;
    const m = { categories: cats, state: model.state as never };
    for (const c of fixture.cases) {
      const logits = forward(c.bitmap, m);
      const probs = softmax(logits);
      for (let i = 0; i < c.probs.length; i++) {
        expect(Math.abs(probs[i] - c.probs[i])).toBeLessThan(1e-4);
      }
    }
  });

  it('predict returns categories sorted by confidence', () => {
    const cats = model.meta.categories;
    const m = { categories: cats, state: model.state as never };
    const blank = new Array(784).fill(0);
    const res = predict(blank, m);
    expect(res).toHaveLength(cats.length);
    for (let i = 1; i < res.length; i++) {
      expect(res[i - 1].pct).toBeGreaterThanOrEqual(res[i].pct);
    }
    expect(Object.keys(res[0])).toEqual(['label', 'pct', 'logit']);
  });

  it('has the expected 10 categories and weight shapes', () => {
    const s = model.state;
    expect(model.meta.categories).toHaveLength(10);
    expect(s['conv1.weight'].length).toBe(8);
    expect(s['conv2.weight'].length).toBe(16);
    expect(s['fc1.weight'].length).toBe(64);
    expect(s['fc2.weight'].length).toBe(10);
    expect(s['fc1.weight'][0]).toHaveLength(784);
  });
});
