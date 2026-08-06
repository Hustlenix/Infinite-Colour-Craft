import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  formatTodayDateReadable,
  generateDailyChallenge,
  calculateTimeRemainingUntilMidnight,
  checkColorMatchesChallenge,
} from '../utils/dailyChallengeEngine';
import { ColorItem, DailyChallenge } from '../types';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'God'];
const CATEGORIES = ['Base', 'Primary', 'Secondary', 'Pastel', 'Neon', 'Dark', 'Earth', 'Metallic', 'Cosmic'];

const TEMPLATE_TITLES = [
  'Neon Transmutation',
  'Metallic Forging',
  'Pastel Bloom',
  'Cosmic Seeker',
  'High Brightness Spectrum',
  'Golden Spectrum Quest',
  'Master Combination',
  'Rare Tier Synthesizer',
];

const REWARD_PIGMENT_NAMES = [
  'Neon Green',
  'Platinum',
  'Mauve',
  'Deep Purple',
  'Gold',
  'Eerie Black',
  'Snow',
  'Turquoise',
  'Watermelon',
  'Sky Blue',
];

// Minimal ColorItem factory for challenge-matching tests
function makeColor(overrides: Partial<ColorItem>): ColorItem {
  return {
    id: '#000000',
    name: 'Test',
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    hsl: { h: 0, s: 0, l: 0 },
    emoji: '🎨',
    discoveredAt: 0,
    rarity: 'Common',
    category: 'Base',
    ...overrides,
  };
}

function makeChallenge(overrides: Partial<DailyChallenge>): DailyChallenge {
  return {
    id: '2026-08-06',
    dateFormatted: 'Thursday, Aug 6, 2026',
    title: 'Test Challenge',
    description: 'Test description',
    hint: 'Test hint',
    targetType: 'category',
    targetCategory: 'Neon',
    requiredAmount: 1,
    rewardPigment: {
      pigmentName: 'Gold',
      hex: '#FFD700',
      emoji: '☀️',
      rarity: 'God',
      category: 'Metallic',
      description: 'Test reward',
    },
    ...overrides,
  };
}

describe('getTodayDateString', () => {
  it('returns a YYYY-MM-DD date string', () => {
    const dateStr = getTodayDateString();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const [year, month, day] = dateStr.split('-').map(Number);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
    expect(year).toBeGreaterThan(2000);
  });
});

describe('formatTodayDateReadable', () => {
  it('formats a fixed date deterministically', () => {
    expect(formatTodayDateReadable('2026-08-06')).toContain('2026');
    expect(formatTodayDateReadable('2026-08-06')).toBe(formatTodayDateReadable('2026-08-06'));
  });
});

describe('generateDailyChallenge', () => {
  it('is deterministic for the same date', () => {
    const a = generateDailyChallenge('2026-08-06');
    const b = generateDailyChallenge('2026-08-06');
    expect(a).toEqual(b);
  });

  it('sets id to the date string and formats the date from it', () => {
    const challenge = generateDailyChallenge('2026-08-06');
    expect(challenge.id).toBe('2026-08-06');
    expect(challenge.dateFormatted).toBe(formatTodayDateReadable('2026-08-06'));
  });

  it('varies across dates', () => {
    const dates: string[] = [];
    for (let day = 1; day <= 30; day++) {
      dates.push(`2026-01-${String(day).padStart(2, '0')}`);
    }
    const combos = new Set(
      dates.map((d) => {
        const c = generateDailyChallenge(d);
        return `${c.title}|${c.rewardPigment.pigmentName}`;
      })
    );
    // 30 dates must not all land on one template+reward combo
    expect(combos.size).toBeGreaterThan(1);
  });

  it('produces only valid templates and rewards from the pools', () => {
    for (let i = 0; i < 60; i++) {
      const dateStr = `2026-03-${String((i % 28) + 1).padStart(2, '0')}`;
      const challenge = generateDailyChallenge(dateStr);
      expect(TEMPLATE_TITLES).toContain(challenge.title);
      expect(REWARD_PIGMENT_NAMES).toContain(challenge.rewardPigment.pigmentName);
      expect(challenge.rewardPigment.hex).toMatch(/^#[0-9A-F]{6}$/i);
      expect(RARITIES).toContain(challenge.rewardPigment.rarity);
      expect(CATEGORIES).toContain(challenge.rewardPigment.category);
      expect(challenge.requiredAmount).toBeGreaterThan(0);
      expect(challenge.targetType).toMatch(/^(category|rarity|hue_range|lightness|combine_count)$/);
    }
  });

  it('defaults to today when no date is passed', () => {
    expect(generateDailyChallenge().id).toBe(getTodayDateString());
  });
});

describe('calculateTimeRemainingUntilMidnight', () => {
  it('returns sane time components and a formatted string', () => {
    const result = calculateTimeRemainingUntilMidnight();
    expect(result.hours).toBeGreaterThanOrEqual(0);
    expect(result.hours).toBeLessThanOrEqual(23);
    expect(result.minutes).toBeGreaterThanOrEqual(0);
    expect(result.minutes).toBeLessThanOrEqual(59);
    expect(result.seconds).toBeGreaterThanOrEqual(0);
    expect(result.seconds).toBeLessThanOrEqual(59);
    expect(result.formatted).toMatch(/^\d{2}h \d{2}m \d{2}s$/);
  });
});

describe('checkColorMatchesChallenge', () => {
  it('matches category challenges', () => {
    const challenge = makeChallenge({ targetType: 'category', targetCategory: 'Neon' });
    expect(checkColorMatchesChallenge(makeColor({ category: 'Neon' }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ category: 'Pastel' }), challenge)).toBe(false);
  });

  it('matches rarity challenges at or above the target tier', () => {
    const challenge = makeChallenge({ targetType: 'rarity', targetRarity: 'Rare' });
    expect(checkColorMatchesChallenge(makeColor({ rarity: 'Rare' }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ rarity: 'Epic' }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ rarity: 'God' }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ rarity: 'Common' }), challenge)).toBe(false);
    expect(checkColorMatchesChallenge(makeColor({ rarity: 'Uncommon' }), challenge)).toBe(false);
  });

  it('matches hue range challenges inclusively', () => {
    const challenge = makeChallenge({ targetType: 'hue_range', targetHueMin: 40, targetHueMax: 65 });
    expect(checkColorMatchesChallenge(makeColor({ hsl: { h: 50, s: 100, l: 50 } }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ hsl: { h: 40, s: 100, l: 50 } }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ hsl: { h: 65, s: 100, l: 50 } }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ hsl: { h: 20, s: 100, l: 50 } }), challenge)).toBe(false);
    expect(checkColorMatchesChallenge(makeColor({ hsl: { h: 90, s: 100, l: 50 } }), challenge)).toBe(false);
  });

  it('matches lightness challenges at or above the minimum', () => {
    const challenge = makeChallenge({ targetType: 'lightness', targetLightnessMin: 70 });
    expect(checkColorMatchesChallenge(makeColor({ hsl: { h: 0, s: 0, l: 80 } }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ hsl: { h: 0, s: 0, l: 70 } }), challenge)).toBe(true);
    expect(checkColorMatchesChallenge(makeColor({ hsl: { h: 0, s: 0, l: 50 } }), challenge)).toBe(false);
  });

  it('treats combine_count challenges as always matching', () => {
    const challenge = makeChallenge({ targetType: 'combine_count' });
    expect(checkColorMatchesChallenge(makeColor({}), challenge)).toBe(true);
  });

  it('returns false for unknown target types', () => {
    const challenge = makeChallenge({ targetType: 'combine_count' });
    expect(checkColorMatchesChallenge(makeColor({}), { ...challenge, targetType: 'count' as never })).toBe(false);
  });
});
