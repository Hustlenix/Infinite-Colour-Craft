import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeParseJSON,
  normalizeUnlockedColors,
  normalizeBoardTiles,
  normalizePalettes,
  normalizeDailyChallengeState,
  normalizeStringArray,
} from '../utils/storage';
import { BoardTile, ColorItem } from '../types';

// Minimal in-memory localStorage stand-in
function createMemoryStorage() {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => {
      store = new Map();
    }),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((i: number) => [...store.keys()][i] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

let storage: ReturnType<typeof createMemoryStorage>;

beforeEach(() => {
  storage = createMemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Realistic fixtures matching the ColorItem / BoardTile shapes
const colorItem = (id: string, name: string, hex: string): ColorItem => ({
  id,
  name,
  hex,
  rgb: { r: 255, g: 0, b: 0 },
  hsl: { h: 0, s: 100, l: 50 },
  emoji: '🔴',
  discoveredAt: 1,
  rarity: 'Common',
  category: 'Base',
});

const baseColors: ColorItem[] = [
  colorItem('1', 'Red', '#FF0000'),
  colorItem('2', 'Blue', '#0000FF'),
  colorItem('3', 'Green', '#008000'),
  colorItem('4', 'Black', '#000000'),
  colorItem('5', 'White', '#FFFFFF'),
];

describe('safeGetItem / safeSetItem / safeRemoveItem', () => {
  it('round-trips a value through localStorage', () => {
    safeSetItem('k', 'v');
    expect(storage.setItem).toHaveBeenCalledWith('k', 'v');
    expect(safeGetItem('k')).toBe('v');
  });

  it('returns null for a missing key', () => {
    expect(safeGetItem('missing')).toBeNull();
  });

  it('returns null and reports failure when localStorage throws (e.g. privacy mode)', () => {
    vi.stubGlobal(
      'localStorage',
      {
        ...storage,
        getItem: vi.fn(() => {
          throw new Error('denied');
        }),
        setItem: vi.fn(() => {
          throw new Error('denied');
        }),
      },
    );
    expect(safeGetItem('k')).toBeNull();
    expect(safeSetItem('k', 'v')).toBe(false);
    expect(() => safeRemoveItem('k')).not.toThrow();
  });

  it('removeItem deletes the key', () => {
    safeSetItem('k', 'v');
    safeRemoveItem('k');
    expect(storage.removeItem).toHaveBeenCalledWith('k');
    expect(safeGetItem('k')).toBeNull();
  });
});

describe('safeParseJSON', () => {
  it('parses valid JSON', () => {
    expect(safeParseJSON<{ a: number }>('{"a":1}', null)).toEqual({ a: 1 });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeParseJSON<unknown>('{oops', null)).toBeNull();
  });

  it('returns fallback for null/undefined input', () => {
    expect(safeParseJSON<unknown>(null, 'fb')).toBe('fb');
    expect(safeParseJSON<unknown>(undefined, 'fb')).toBe('fb');
  });
});

describe('normalizeUnlockedColors', () => {
  it('accepts an array of valid color items', () => {
    expect(normalizeUnlockedColors(baseColors)).toEqual(baseColors);
  });

  it('rejects arrays with fewer than 5 entries (guard rail)', () => {
    expect(normalizeUnlockedColors([baseColors[0]])).toBeNull();
  });

  it('drops malformed entries and rejects if fewer than 5 survive', () => {
    const malformed = [baseColors[0], { ...baseColors[1], hex: 'red' }, ...baseColors.slice(2)];
    expect(normalizeUnlockedColors(malformed)).toBeNull();
  });

  it('drops malformed entries but keeps the rest when 5+ survive', () => {
    const malformed = [
      { ...baseColors[0], hex: 'red' },
      ...baseColors.slice(1),
      colorItem('6', 'Yellow', '#FFFF00'),
    ];
    expect(normalizeUnlockedColors(malformed)).toEqual(baseColors.slice(1).concat([colorItem('6', 'Yellow', '#FFFF00')]));
  });

  it('rejects non-arrays and garbage', () => {
    expect(normalizeUnlockedColors('nope')).toBeNull();
    expect(normalizeUnlockedColors({})).toBeNull();
    expect(normalizeUnlockedColors(null)).toBeNull();
  });
});

describe('normalizeBoardTiles', () => {
  it('accepts valid board tiles', () => {
    const tiles: BoardTile[] = [
      { id: 't1', colorId: '1', name: 'Red', hex: '#FF0000', emoji: '🔴', x: 0, y: 0, zIndex: 1 },
      { id: 't2', colorId: '3', name: 'Green', hex: '#008000', emoji: '🟢', x: 1, y: 1, zIndex: 2 },
    ];
    expect(normalizeBoardTiles(tiles)).toEqual(tiles);
  });

  it('drops tiles with missing or invalid fields', () => {
    const bad = [
      { id: 't1' },
      { id: 't2', colorId: '1', name: 'Red', hex: 'nope', emoji: '🔴', x: 0, y: 0, zIndex: 1 },
    ];
    expect(normalizeBoardTiles(bad)).toEqual([]);
  });

  it('rejects non-arrays', () => {
    expect(normalizeBoardTiles(42)).toBeNull();
    expect(normalizeBoardTiles(null)).toBeNull();
  });
});

describe('normalizePalettes', () => {
  it('accepts palettes with valid hex colors', () => {
    const palettes = [
      { id: 'p1', name: 'Neon', colors: ['#FF00FF', '#00FFFF'], createdAt: 1 },
    ];
    expect(normalizePalettes(palettes)).toEqual(palettes);
  });

  it('drops palettes with invalid colors or structure', () => {
    expect(normalizePalettes([{ id: 'p1', name: 'Bad', colors: ['nope'], createdAt: 1 }])).toEqual([]);
    expect(normalizePalettes([{ id: 'p1', colors: [] }])).toEqual([]);
    expect(normalizePalettes('garbage')).toBeNull();
  });
});

describe('normalizeDailyChallengeState', () => {
  it('passes through a well-formed daily state unchanged', () => {
    const state = {
      lastDate: '2026-08-06',
      completed: true,
      claimed: false,
      progress: 7,
      streak: 2,
      lastCompletedDate: '2026-08-05',
    };
    expect(normalizeDailyChallengeState(state)).toEqual(state);
  });

  it('coerces missing optional fields to safe defaults', () => {
    const coerced = normalizeDailyChallengeState({ lastDate: '2026-08-06' });
    expect(coerced).toEqual({
      lastDate: '2026-08-06',
      completed: false,
      claimed: false,
      progress: 0,
      streak: 0,
      lastCompletedDate: '',
    });
  });

  it('coerces invalid numbers to 0 and floors fractional progress', () => {
    const state = {
      lastDate: '2026-08-06',
      completed: 'yes' as unknown as boolean,
      progress: 3.9,
      streak: -5,
      lastCompletedDate: 42 as unknown as string,
    };
    expect(normalizeDailyChallengeState(state)).toEqual({
      lastDate: '2026-08-06',
      completed: false,
      claimed: false,
      progress: 3,
      streak: 0,
      lastCompletedDate: '',
    });
  });

  it('rejects malformed states (missing lastDate)', () => {
    expect(normalizeDailyChallengeState(null)).toBeNull();
    expect(normalizeDailyChallengeState({ completed: true })).toBeNull();
    expect(normalizeDailyChallengeState('nope')).toBeNull();
  });
});

describe('normalizeStringArray', () => {
  it('accepts arrays of strings', () => {
    expect(normalizeStringArray(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('drops non-string entries instead of failing the whole array', () => {
    expect(normalizeStringArray(['a', 2, null])).toEqual(['a']);
  });

  it('rejects non-arrays', () => {
    expect(normalizeStringArray(null)).toBeNull();
    expect(normalizeStringArray('abc')).toBeNull();
  });
});
