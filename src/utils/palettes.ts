import type { Palette } from '../types';
export type PaletteFormat = 'HEX' | 'CSS' | 'Tailwind v4' | 'JSON';
export function exportPalette(palette: Palette, format: PaletteFormat): string {
  if (format === 'HEX') return palette.colors.join('\n');
  if (format === 'JSON') return JSON.stringify(palette, null, 2);
  const declarations = palette.colors.map((hex, i) => `  --color-palette-${i + 1}: ${hex};`).join('\n');
  return format === 'Tailwind v4' ? `@theme {\n${declarations}\n}` : `:root {\n${declarations}\n}`;
}
export function uniquePaletteName(name: string, palettes: Palette[], exceptId?: string): string {
  const base = name.trim().slice(0, 60) || 'Untitled palette'; let candidate = base, n = 2;
  while (palettes.some(p => p.id !== exceptId && p.name.toLowerCase() === candidate.toLowerCase())) candidate = `${base} (${n++})`;
  return candidate;
}
export function moveSwatch(colors: string[], index: number, direction: number) {
  const next = [...colors], to = index + direction;
  if (index < 0 || index >= next.length || to < 0 || to >= next.length) return next;
  [next[index], next[to]] = [next[to], next[index]]; return next;
}
