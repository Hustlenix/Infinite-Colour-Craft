import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToRyb,
  rybToRgb,
  mixPaint,
  blendColors,
  makeRecipeKey,
  getProceduralEmoji,
  nearestRealColorName,
  generateProceduralName,
  BASE_COLORS,
} from '../utils/colorEngine';
import { REAL_COLOR_NAMES } from '../data/realColors';
import { ColorItem } from '../types';

// Helper: find a base color by name
const base = (name: string): ColorItem => {
  const color = BASE_COLORS.find((c) => c.name === name);
  if (!color) throw new Error(`Base color "${name}" not found`);
  return color;
};

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'God'];
const CATEGORIES = ['Base', 'Primary', 'Secondary', 'Pastel', 'Neon', 'Dark', 'Earth', 'Metallic', 'Cosmic'];

describe('hexToRgb', () => {
  it('parses 6-digit hex with #', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('parses hex without leading #', () => {
    expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('expands 3-digit shorthand', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('round-trips with rgbToHex', () => {
    const samples: Array<[number, number, number]> = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [128, 128, 128],
      [245, 130, 32],
      [12, 34, 56],
    ];
    for (const [r, g, b] of samples) {
      expect(hexToRgb(rgbToHex(r, g, b))).toEqual({ r, g, b });
    }
  });
});

describe('rgbToHex', () => {
  it('formats as uppercase 6-digit hex with #', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
    expect(rgbToHex(0, 255, 0)).toBe('#00FF00');
    expect(rgbToHex(0, 0, 255)).toBe('#0000FF');
  });

  it('clamps out-of-range channels', () => {
    expect(rgbToHex(300, -5, 128)).toBe('#FF0080');
  });
});

describe('rgbToHsl / hslToRgb', () => {
  it('converts primaries to expected HSL', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
    expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
    expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('round-trips RGB -> HSL -> RGB within rounding tolerance', () => {
    const samples: Array<[number, number, number]> = [
      [123, 45, 67],
      [200, 100, 50],
      [10, 200, 150],
      [240, 240, 10],
      [75, 75, 75],
    ];
    for (const [r, g, b] of samples) {
      const hsl = rgbToHsl(r, g, b);
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      // Integer quantization through HSL can legitimately drift a channel by 2
      expect(Math.abs(rgb.r - r)).toBeLessThanOrEqual(2);
      expect(Math.abs(rgb.g - g)).toBeLessThanOrEqual(2);
      expect(Math.abs(rgb.b - b)).toBeLessThanOrEqual(2);
    }
  });
});

describe('rgbToRyb / rybToRgb', () => {
  it('round-trips RGB -> RYB -> RGB within rounding tolerance', () => {
    const samples: Array<[number, number, number]> = [
      [255, 0, 0],
      [255, 255, 0],
      [0, 0, 255],
      [128, 128, 128],
      [200, 100, 50],
    ];
    for (const [r, g, b] of samples) {
      const ryb = rgbToRyb({ r, g, b });
      const rgb = rybToRgb(ryb);
      expect(Math.abs(rgb.r - r)).toBeLessThanOrEqual(2);
      expect(Math.abs(rgb.g - g)).toBeLessThanOrEqual(2);
      expect(Math.abs(rgb.b - b)).toBeLessThanOrEqual(2);
    }
  });
});

describe('mixPaint', () => {
  it('mixes Red + Yellow toward orange (R highest, B lowest)', () => {
    const result = mixPaint({ r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 0 });
    expect(result.r).toBeGreaterThan(150);
    expect(result.g).toBeGreaterThanOrEqual(20);
    expect(result.g).toBeLessThan(100);
    expect(result.b).toBeLessThan(30);
    expect(result.r).toBeGreaterThan(result.g);
    expect(result.g).toBeGreaterThan(result.b);
  });

  it('mixes Blue + Yellow toward green (G highest)', () => {
    const result = mixPaint({ r: 0, g: 0, b: 255 }, { r: 255, g: 255, b: 0 });
    expect(result.g).toBeGreaterThan(result.r);
    expect(result.g).toBeGreaterThan(result.b);
    const hsl = rgbToHsl(result.r, result.g, result.b);
    expect(hsl.h).toBeGreaterThanOrEqual(90);
    expect(hsl.h).toBeLessThanOrEqual(150);
  });

  it('mixes Red + Blue toward purple (R and B high, G low)', () => {
    const result = mixPaint({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 });
    expect(Math.abs(result.r - result.b)).toBeLessThan(10);
    expect(result.g).toBeLessThan(60);
  });

  it('mixes White + Black to a neutral gray', () => {
    const result = mixPaint({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 });
    expect(result.r).toBe(result.g);
    expect(result.g).toBe(result.b);
  });

  it('is symmetric (order of operands does not matter)', () => {
    const a = { r: 200, g: 100, b: 50 };
    const b = { r: 30, g: 180, b: 220 };
    expect(mixPaint(a, b)).toEqual(mixPaint(b, a));
  });
});

describe('makeRecipeKey', () => {
  it('normalizes to uppercase hex pairs joined with +', () => {
    expect(makeRecipeKey('#FF0000', '#0000FF')).toBe('#0000FF+#FF0000');
  });

  it('is order-independent', () => {
    expect(makeRecipeKey('#FF0000', '#0000FF')).toBe(makeRecipeKey('#0000FF', '#FF0000'));
  });

  it('is case-insensitive', () => {
    expect(makeRecipeKey('#ff0000', '#0000ff')).toBe(makeRecipeKey('#FF0000', '#0000FF'));
  });
});

describe('blendColors (known recipes)', () => {
  it('mixes Red + Green into curated Yellow', () => {
    const result = blendColors(base('Red'), base('Green'));
    expect(result.name).toBe('Yellow');
    expect(result.hex).toBe('#FFFF00');
    expect(result.rarity).toBe('Uncommon');
    expect(result.category).toBe('Secondary');
  });

  it('mixes Red + Blue into curated Magenta', () => {
    const result = blendColors(base('Red'), base('Blue'));
    expect(result.name).toBe('Magenta');
    expect(result.hex).toBe('#FF00FF');
  });

  it('mixes Green + Blue into curated Cyan', () => {
    const result = blendColors(base('Green'), base('Blue'));
    expect(result.name).toBe('Cyan');
    expect(result.hex).toBe('#00FFFF');
  });

  it('mixes Yellow + Red into curated Orange (key normalization across spellings)', () => {
    const yellow = blendColors(base('Red'), base('Green')); // #FFFF00
    const result = blendColors(yellow, base('Red'));
    expect(result.name).toBe('Orange');
    expect(result.hex).toBe('#FFA500');
  });

  it('mixes Yellow + Blue into curated Jade (multi-step mixing)', () => {
    const yellow = blendColors(base('Red'), base('Green'));
    const result = blendColors(yellow, base('Blue'));
    expect(result.name).toBe('Jade');
    expect(result.hex).toBe('#00A86B');
  });

  it('mixes Red + White into curated Light Pink', () => {
    const result = blendColors(base('Red'), base('White'));
    expect(result.name).toBe('Light Pink');
    expect(result.hex).toBe('#FFB6C1');
  });

  it('mixes Black + White into curated Gray', () => {
    const result = blendColors(base('Black'), base('White'));
    expect(result.name).toBe('Gray');
    expect(result.hex).toBe('#808080');
  });

  it('mixes Red + Black into curated Maroon', () => {
    const result = blendColors(base('Red'), base('Black'));
    expect(result.name).toBe('Maroon');
    expect(result.hex).toBe('#800000');
  });

  it('mixes Yellow + Amber into curated Gold', () => {
    const yellow = blendColors(base('Red'), base('Green')); // Yellow #FFFF00
    const gray = blendColors(base('Black'), base('White')); // Gray #808080
    const amber = blendColors(yellow, gray); // Amber #FFBF00
    const gold = blendColors(yellow, amber); // Gold #FFD700
    expect(gold.name).toBe('Gold');
    expect(gold.hex).toBe('#FFD700');
  });
});

describe('blendColors (procedural fallback)', () => {
  it('produces a valid ColorItem with a real color name for unknown pairs', () => {
    const cyan = blendColors(base('Green'), base('Blue'));
    const maroon = blendColors(base('Red'), base('Black'));
    const result = blendColors(cyan, maroon);

    expect(result.id).toBe(result.hex);
    expect(result.hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.parents).toEqual(['Cyan', 'Maroon']);
    expect(RARITIES).toContain(result.rarity);
    expect(CATEGORIES).toContain(result.category);
    expect(REAL_COLOR_NAMES.some((c) => c.name === result.name)).toBe(true);
  });
});

describe('nearestRealColorName', () => {
  it('returns the exact name for exact dictionary matches', () => {
    const cases: Array<[string, string]> = [
      ['#FF0000', 'Red'],
      ['#0000FF', 'Blue'],
      ['#FFFFFF', 'White'],
      ['#000000', 'Black'],
      ['#808080', 'Gray'],
      ['#FFD700', 'Gold'],
      ['#00A86B', 'Jade'],
      ['#87CEEB', 'Sky Blue'],
      ['#FF00FF', 'Magenta'],
      ['#800000', 'Maroon'],
      ['#C0C0C0', 'Silver'],
    ];
    for (const [hex, expected] of cases) {
      expect(nearestRealColorName(hexToRgb(hex))).toBe(expected);
    }
  });

  it('keeps hue sanity: a bright red never gets a blue name', () => {
    const name = nearestRealColorName({ r: 255, g: 20, b: 20 });
    expect(name.toLowerCase()).toContain('red');
  });
});

describe('getProceduralEmoji', () => {
  it('maps lightness extremes and hues to sensible emoji', () => {
    expect(getProceduralEmoji({ h: 0, s: 0, l: 5 })).toBe('🖤');
    expect(getProceduralEmoji({ h: 0, s: 0, l: 95 })).toBe('🤍');
    expect(getProceduralEmoji({ h: 0, s: 0, l: 50 })).toBe('🩶');
    expect(getProceduralEmoji({ h: 0, s: 100, l: 50 })).toBe('🔴');
    expect(getProceduralEmoji({ h: 120, s: 100, l: 50 })).toBe('🟢');
    expect(getProceduralEmoji({ h: 240, s: 100, l: 50 })).toBe('🔵');
    expect(getProceduralEmoji({ h: 30, s: 100, l: 50 })).toBe('🍊');
  });
});

describe('generateProceduralName', () => {
  it('is deterministic for the same HSL input', () => {
    const a = generateProceduralName({ h: 210, s: 80, l: 55 });
    const b = generateProceduralName({ h: 210, s: 80, l: 55 });
    expect(a).toEqual(b);
  });

  it('names pure red as Red', () => {
    const meta = generateProceduralName({ h: 0, s: 100, l: 50 });
    expect(meta.name).toBe('Red');
    expect(meta.rarity).toBe('Rare');
    expect(meta.category).toBe('Secondary');
    expect(meta.description).toBe('A rare secondary shade.');
  });

  it('classifies dark colors as Dark', () => {
    const meta = generateProceduralName({ h: 120, s: 100, l: 10 });
    expect(meta.category).toBe('Dark');
    // s > 95 and l < 15 pushes this to Legendary
    expect(meta.rarity).toBe('Legendary');
    expect(meta.description).toBe('A legendary dark shade.');
  });

  it('classifies light colors as Pastel', () => {
    const meta = generateProceduralName({ h: 120, s: 100, l: 90 });
    expect(meta.category).toBe('Pastel');
  });

  it('classifies desaturated colors as Earth', () => {
    const meta = generateProceduralName({ h: 0, s: 0, l: 50 });
    expect(meta.category).toBe('Earth');
    expect(meta.rarity).toBe('Uncommon');
    expect(meta.description).toBe('An uncommon earth shade.');
  });

  it('classifies deep violet as Epic Cosmic', () => {
    const meta = generateProceduralName({ h: 270, s: 80, l: 40 });
    expect(meta.rarity).toBe('Epic');
    expect(meta.category).toBe('Cosmic');
    expect(meta.description).toBe('An epic cosmic shade.');
  });

  it('classifies golden hues as Metallic', () => {
    const meta = generateProceduralName({ h: 60, s: 70, l: 45 });
    expect(meta.category).toBe('Metallic');
  });
});
