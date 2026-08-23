import { BoardTile, ColorItem, DailyChallengeState, Palette } from '../types';

// Safe localStorage primitives: every access goes through try/catch so a
// blocked or quota-exceeded storage can never crash the app.

export function safeGetItem(key: string): string | null {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    globalThis.localStorage.setItem(key, value);
    return true;
  } catch {
    // Quota exceeded, private mode, or storage disabled — fail silently.
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    globalThis.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

export function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// State shape validation: loaded state is untrusted (hand-edited, stale from
// an older version, or corrupted). Each normalizer returns null when the
// stored shape is unusable so callers can fall back to defaults.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function isColorItem(value: unknown): value is ColorItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isValidHex(value.hex) &&
    isRecord(value.rgb) &&
    typeof value.rgb.r === 'number' &&
    typeof value.rgb.g === 'number' &&
    typeof value.rgb.b === 'number' &&
    isRecord(value.hsl) &&
    typeof value.hsl.h === 'number' &&
    typeof value.hsl.s === 'number' &&
    typeof value.hsl.l === 'number' &&
    typeof value.emoji === 'string' &&
    typeof value.rarity === 'string' &&
    typeof value.category === 'string'
  );
}

/** Keeps only well-formed ColorItems; null if fewer than the 5 base colors survive. */
export function normalizeUnlockedColors(raw: unknown): ColorItem[] | null {
  if (!Array.isArray(raw)) return null;
  const colors = raw.filter(isColorItem);
  if (colors.length < 5) return null;
  return colors;
}

export function normalizeBoardTiles(raw: unknown): BoardTile[] | null {
  if (!Array.isArray(raw)) return null;
  const tiles = raw.filter(
    (t): t is BoardTile =>
      isRecord(t) &&
      typeof t.id === 'string' &&
      typeof t.colorId === 'string' &&
      typeof t.name === 'string' &&
      isValidHex(t.hex) &&
      typeof t.emoji === 'string' &&
      typeof t.x === 'number' &&
      isFinite(t.x) &&
      typeof t.y === 'number' &&
      isFinite(t.y) &&
      typeof t.zIndex === 'number'
  );
  return tiles;
}

export function normalizePalettes(raw: unknown): Palette[] | null {
  if (!Array.isArray(raw)) return null;
  const palettes = raw.filter(
    (p): p is Palette =>
      isRecord(p) &&
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      Array.isArray(p.colors) &&
      p.colors.length > 0 &&
      p.colors.every(isValidHex) &&
      typeof p.createdAt === 'number'
  );
  return palettes;
}

export function normalizeDailyChallengeState(raw: unknown): DailyChallengeState | null {
  if (!isRecord(raw) || typeof raw.lastDate !== 'string') return null;
  return {
    lastDate: raw.lastDate,
    completed: typeof raw.completed === 'boolean' ? raw.completed : false,
    claimed: typeof raw.claimed === 'boolean' ? raw.claimed : false,
    progress:
      typeof raw.progress === 'number' && raw.progress >= 0 ? Math.floor(raw.progress) : 0,
    streak: typeof raw.streak === 'number' && raw.streak >= 0 ? Math.floor(raw.streak) : 0,
    lastCompletedDate:
      typeof raw.lastCompletedDate === 'string' ? raw.lastCompletedDate : '',
  };
}

export function normalizeStringArray(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const strings = raw.filter((s): s is string => typeof s === 'string');
  return strings;
}
