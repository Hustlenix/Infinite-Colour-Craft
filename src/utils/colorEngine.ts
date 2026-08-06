import { ColorItem, ColorCategory, HSL, Rarity, RGB } from '../types';
import { REAL_COLOR_NAMES } from '../data/realColors';

// Convert Hex to RGB
export function hexToRgb(hex: string): RGB {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Convert RGB to RYB (Red, Yellow, Blue) paint domain for physical subtractive mixing
export function rgbToRyb(rgb: RGB): { r: number; y: number; b: number } {
  let { r, g, b } = rgb;
  const w = Math.min(r, g, b);
  r -= w;
  g -= w;
  b -= w;

  const mg = Math.max(r, g, b);

  let y = Math.min(r, g);
  r -= y;
  g -= y;

  if (b > 0 && g > 0) {
    b /= 2;
    g /= 2;
  }

  y += g;
  b += g;

  const my = Math.max(r, y, b);
  if (my > 0) {
    const n = mg / my;
    r *= n;
    y *= n;
    b *= n;
  }

  r += w;
  y += w;
  b += w;

  return { r, y, b };
}

// Convert RYB back to RGB
export function rybToRgb(ryb: { r: number; y: number; b: number }): RGB {
  let { r, y, b } = ryb;

  const w = Math.min(r, y, b);
  r -= w;
  y -= w;
  b -= w;

  const my = Math.max(r, y, b);

  let g = Math.min(y, b);
  y -= g;
  b -= g;

  if (b > 0 && g > 0) {
    b *= 2;
    g *= 2;
  }

  r += y;
  g += y;

  const mg = Math.max(r, g, b);
  if (mg > 0) {
    const n = my / mg;
    r *= n;
    g *= n;
    b *= n;
  }

  r += w;
  g += w;
  b += w;

  return {
    r: Math.min(255, Math.max(0, Math.round(r))),
    g: Math.min(255, Math.max(0, Math.round(g))),
    b: Math.min(255, Math.max(0, Math.round(b))),
  };
}

// Realistic Subtractive Paint Mixing
export function mixPaint(rgb1: RGB, rgb2: RGB): RGB {
  const ryb1 = rgbToRyb(rgb1);
  const ryb2 = rgbToRyb(rgb2);

  // Blend in RYB space for true paint behavior (Red + Yellow = Orange, Blue + Yellow = Green)
  const rybMixed = {
    r: (ryb1.r + ryb2.r) / 2,
    y: (ryb1.y + ryb2.y) / 2,
    b: (ryb1.b + ryb2.b) / 2,
  };

  const rgbPaint = rybToRgb(rybMixed);

  // Average with RGB optical lightness for brightness accuracy
  return {
    r: Math.round((rgbPaint.r * 0.7) + ((rgb1.r + rgb2.r) / 2) * 0.3),
    g: Math.round((rgbPaint.g * 0.7) + ((rgb1.g + rgb2.g) / 2) * 0.3),
    b: Math.round((rgbPaint.b * 0.7) + ((rgb1.b + rgb2.b) / 2) * 0.3),
  };
}

// Standard 5 Base Elements
export const BASE_COLORS: ColorItem[] = [
  {
    id: '#FF0000',
    name: 'Red',
    hex: '#FF0000',
    rgb: { r: 255, g: 0, b: 0 },
    hsl: { h: 0, s: 100, l: 50 },
    emoji: '🔴',
    isBase: true,
    parents: null,
    discoveredAt: Date.now(),
    rarity: 'Common',
    category: 'Base',
    description: 'The primary red paint.',
  },
  {
    id: '#00FF00',
    name: 'Green',
    hex: '#00FF00',
    rgb: { r: 0, g: 255, b: 0 },
    hsl: { h: 120, s: 100, l: 50 },
    emoji: '🟢',
    isBase: true,
    parents: null,
    discoveredAt: Date.now(),
    rarity: 'Common',
    category: 'Base',
    description: 'The primary green paint.',
  },
  {
    id: '#0000FF',
    name: 'Blue',
    hex: '#0000FF',
    rgb: { r: 0, g: 0, b: 255 },
    hsl: { h: 240, s: 100, l: 50 },
    emoji: '🔵',
    isBase: true,
    parents: null,
    discoveredAt: Date.now(),
    rarity: 'Common',
    category: 'Base',
    description: 'The primary blue paint.',
  },
  {
    id: '#FFFFFF',
    name: 'White',
    hex: '#FFFFFF',
    rgb: { r: 255, g: 255, b: 255 },
    hsl: { h: 0, s: 0, l: 100 },
    emoji: '⚪',
    isBase: true,
    parents: null,
    discoveredAt: Date.now(),
    rarity: 'Common',
    category: 'Base',
    description: 'The bright white paint.',
  },
  {
    id: '#000000',
    name: 'Black',
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    hsl: { h: 0, s: 0, l: 0 },
    emoji: '🖤',
    isBase: true,
    parents: null,
    discoveredAt: Date.now(),
    rarity: 'Common',
    category: 'Base',
    description: 'The dark black paint.',
  },
];

// Helper to normalize parent key order
export function makeRecipeKey(c1: string, c2: string): string {
  const norm1 = c1.toUpperCase();
  const norm2 = c2.toUpperCase();
  return norm1 < norm2 ? `${norm1}+${norm2}` : `${norm2}+${norm1}`;
}

// Curated Iconic Recipes Map
const KNOWN_RECIPES: Record<string, {
  name: string;
  hex: string;
  emoji: string;
  rarity: Rarity;
  category: ColorCategory;
  description: string;
}> = {
  // Base Pairs
  [makeRecipeKey('#FF0000', '#0000FF')]: {
    name: 'Magenta',
    hex: '#FF00FF',
    emoji: '🩷',
    rarity: 'Uncommon',
    category: 'Secondary',
    description: 'A mix of Red and Blue.',
  },
  [makeRecipeKey('#00FF00', '#0000FF')]: {
    name: 'Cyan',
    hex: '#00FFFF',
    emoji: '🩵',
    rarity: 'Uncommon',
    category: 'Secondary',
    description: 'A mix of Green and Blue.',
  },
  [makeRecipeKey('#FF0000', '#00FF00')]: {
    name: 'Yellow',
    hex: '#FFFF00',
    emoji: '💛',
    rarity: 'Uncommon',
    category: 'Secondary',
    description: 'A mix of Red and Green.',
  },
  [makeRecipeKey('#FF0000', '#FFFFFF')]: {
    name: 'Light Pink',
    hex: '#FFB6C1',
    emoji: '🌸',
    rarity: 'Common',
    category: 'Pastel',
    description: 'Red lightened with White.',
  },
  [makeRecipeKey('#0000FF', '#FFFFFF')]: {
    name: 'Sky Blue',
    hex: '#87CEEB',
    emoji: '☁️',
    rarity: 'Common',
    category: 'Pastel',
    description: 'Blue lightened with White.',
  },
  [makeRecipeKey('#00FF00', '#FFFFFF')]: {
    name: 'Mint Green',
    hex: '#98FF98',
    emoji: '🌿',
    rarity: 'Common',
    category: 'Pastel',
    description: 'Green lightened with White.',
  },
  [makeRecipeKey('#000000', '#FFFFFF')]: {
    name: 'Gray',
    hex: '#808080',
    emoji: '🩶',
    rarity: 'Common',
    category: 'Base',
    description: 'An even mix of White and Black.',
  },
  [makeRecipeKey('#FF0000', '#000000')]: {
    name: 'Maroon',
    hex: '#800000',
    emoji: '🍷',
    rarity: 'Uncommon',
    category: 'Dark',
    description: 'Red darkened with Black.',
  },
  [makeRecipeKey('#0000FF', '#000000')]: {
    name: 'Navy Blue',
    hex: '#000080',
    emoji: '🌌',
    rarity: 'Uncommon',
    category: 'Dark',
    description: 'Blue darkened with Black.',
  },
  [makeRecipeKey('#00FF00', '#000000')]: {
    name: 'Forest Green',
    hex: '#005500',
    emoji: '🌲',
    rarity: 'Uncommon',
    category: 'Dark',
    description: 'Green darkened with Black.',
  },

  // Secondary Combinations
  [makeRecipeKey('#FFFF00', '#FF0000')]: {
    name: 'Orange',
    hex: '#FFA500',
    emoji: '🍊',
    rarity: 'Uncommon',
    category: 'Secondary',
    description: 'A mix of Yellow and Red.',
  },
  [makeRecipeKey('#00FFFF', '#FF00FF')]: {
    name: 'Blue Violet',
    hex: '#8A2BE2',
    emoji: '🔮',
    rarity: 'Rare',
    category: 'Neon',
    description: 'A mix of Cyan and Magenta.',
  },
  [makeRecipeKey('#FFFF00', '#0000FF')]: {
    name: 'Jade',
    hex: '#00A86B',
    emoji: '🥦',
    rarity: 'Rare',
    category: 'Earth',
    description: 'A mix of Yellow and Blue.',
  },
  [makeRecipeKey('#FF00FF', '#FFFF00')]: {
    name: 'Coral',
    hex: '#FF6F61',
    emoji: '🪸',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'A mix of Magenta and Yellow.',
  },
  [makeRecipeKey('#808080', '#FF0000')]: {
    name: 'Terracotta',
    hex: '#E07A5F',
    emoji: '🧱',
    rarity: 'Rare',
    category: 'Earth',
    description: 'A mix of Red and Gray.',
  },
  [makeRecipeKey('#808080', '#FFFF00')]: {
    name: 'Amber',
    hex: '#FFBF00',
    emoji: '🪙',
    rarity: 'Rare',
    category: 'Metallic',
    description: 'A mix of Yellow and Gray.',
  },
  [makeRecipeKey('#800000', '#FFFF00')]: {
    name: 'Burnt Sienna',
    hex: '#E97451',
    emoji: '🍂',
    rarity: 'Rare',
    category: 'Earth',
    description: 'A mix of Maroon and Yellow.',
  },
  [makeRecipeKey('#FF00FF', '#FFFFFF')]: {
    name: 'Lavender',
    hex: '#E6E6FA',
    emoji: '🪻',
    rarity: 'Uncommon',
    category: 'Pastel',
    description: 'Magenta lightened with White.',
  },
  [makeRecipeKey('#00FFFF', '#FFFFFF')]: {
    name: 'Light Cyan',
    hex: '#E0FFFF',
    emoji: '🧊',
    rarity: 'Uncommon',
    category: 'Pastel',
    description: 'Cyan lightened with White.',
  },
  [makeRecipeKey('#FFA500', '#FFFFFF')]: {
    name: 'Peach',
    hex: '#FFDAB9',
    emoji: '🍑',
    rarity: 'Uncommon',
    category: 'Pastel',
    description: 'Orange lightened with White.',
  },
  [makeRecipeKey('#FFA500', '#000000')]: {
    name: 'Chocolate',
    hex: '#7B3F00',
    emoji: '🍫',
    rarity: 'Uncommon',
    category: 'Earth',
    description: 'Orange darkened with Black.',
  },
  [makeRecipeKey('#8A2BE2', '#FFFFFF')]: {
    name: 'Periwinkle',
    hex: '#CCCCFF',
    emoji: '🪻',
    rarity: 'Rare',
    category: 'Pastel',
    description: 'Blue Violet lightened with White.',
  },
  [makeRecipeKey('#8A2BE2', '#000000')]: {
    name: 'Deep Purple',
    hex: '#301934',
    emoji: '🔮',
    rarity: 'Epic',
    category: 'Dark',
    description: 'Blue Violet darkened with Black.',
  },
  [makeRecipeKey('#00A86B', '#00FFFF')]: {
    name: 'Turquoise',
    hex: '#40E0D0',
    emoji: '💎',
    rarity: 'Rare',
    category: 'Cosmic',
    description: 'A mix of Jade and Cyan.',
  },
  [makeRecipeKey('#FFBF00', '#800000')]: {
    name: 'Copper',
    hex: '#B87333',
    emoji: '🥉',
    rarity: 'Epic',
    category: 'Metallic',
    description: 'A mix of Amber and Maroon.',
  },
  [makeRecipeKey('#00FFFF', '#0000FF')]: {
    name: 'Cobalt Blue',
    hex: '#0047AB',
    emoji: '🌊',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'A mix of Cyan and Blue.',
  },
  [makeRecipeKey('#FFFF00', '#00FF00')]: {
    name: 'Chartreuse',
    hex: '#7FFF00',
    emoji: '🍋',
    rarity: 'Uncommon',
    category: 'Neon',
    description: 'A mix of Yellow and Green.',
  },
  [makeRecipeKey('#FF00FF', '#FF0000')]: {
    name: 'Vermilion',
    hex: '#E34234',
    emoji: '💥',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'A mix of Magenta and Red.',
  },
  [makeRecipeKey('#00A86B', '#FFFFFF')]: {
    name: 'Seafoam',
    hex: '#9FE2BF',
    emoji: '🌊',
    rarity: 'Rare',
    category: 'Pastel',
    description: 'Jade lightened with White.',
  },
  [makeRecipeKey('#40E0D0', '#8A2BE2')]: {
    name: 'Indigo',
    hex: '#4B0082',
    emoji: '🌌',
    rarity: 'Legendary',
    category: 'Cosmic',
    description: 'A mix of Turquoise and Blue Violet.',
  },
  [makeRecipeKey('#FFBF00', '#FFFFFF')]: {
    name: 'Cream',
    hex: '#FFFDD0',
    emoji: '🍦',
    rarity: 'Epic',
    category: 'Metallic',
    description: 'Amber lightened with White.',
  },
  // God Tier Pigments - Gold and Silver
  [makeRecipeKey('#FFFF00', '#FFBF00')]: {
    name: 'Gold',
    hex: '#FFD700',
    emoji: '🥇',
    rarity: 'God',
    category: 'Metallic',
    description: 'A mix of Yellow and Amber.',
  },
  [makeRecipeKey('#808080', '#FFFFFF')]: {
    name: 'Silver',
    hex: '#C0C0C0',
    emoji: '🥈',
    rarity: 'God',
    category: 'Metallic',
    description: 'A mix of Gray and White.',
  },

  // Fun Whimsical Craft Discoveries
  [makeRecipeKey('#FFB6C1', '#FFFFFF')]: {
    name: 'Cotton Candy',
    hex: '#FFD1DC',
    emoji: '🦄',
    rarity: 'Epic',
    category: 'Pastel',
    description: 'Light Pink lightened with White.',
  },
  [makeRecipeKey('#FFA500', '#FFB6C1')]: {
    name: 'Sunset Orange',
    hex: '#FD5E53',
    emoji: '🌅',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'A mix of Orange and Light Pink.',
  },
  [makeRecipeKey('#7FFF00', '#000000')]: {
    name: 'Neon Green',
    hex: '#39FF14',
    emoji: '🧪',
    rarity: 'Rare',
    category: 'Neon',
    description: 'Chartreuse darkened with Black.',
  },
  [makeRecipeKey('#FFD700', '#800000')]: {
    name: 'Orange Red',
    hex: '#FF4500',
    emoji: '🔥',
    rarity: 'Legendary',
    category: 'Neon',
    description: 'A mix of Gold and Maroon.',
  },
  [makeRecipeKey('#FFD700', '#00A86B')]: {
    name: 'Metallic Gold',
    hex: '#D4AF37',
    emoji: '🐉',
    rarity: 'God',
    category: 'Metallic',
    description: 'A mix of Gold and Jade.',
  },
  [makeRecipeKey('#C0C0C0', '#000080')]: {
    name: 'Lavender Mist',
    hex: '#E6E6FA',
    emoji: '🌙',
    rarity: 'Epic',
    category: 'Cosmic',
    description: 'A mix of Silver and Navy Blue.',
  },
  [makeRecipeKey('#87CEEB', '#FFB6C1')]: {
    name: 'Baby Pink',
    hex: '#F4C2C2',
    emoji: '🌈',
    rarity: 'Legendary',
    category: 'Cosmic',
    description: 'A mix of Sky Blue and Light Pink.',
  },
  [makeRecipeKey('#FFD700', '#FF00FF')]: {
    name: 'Deep Pink',
    hex: '#FF1493',
    emoji: '⚡',
    rarity: 'God',
    category: 'Neon',
    description: 'A mix of Gold and Magenta.',
  },
  [makeRecipeKey('#000000', '#4B0082')]: {
    name: 'Eerie Black',
    hex: '#0B0B12',
    emoji: '🕳️',
    rarity: 'God',
    category: 'Dark',
    description: 'Black darkened with Indigo.',
  },
};

// Procedural Emoji Selector based on HSL properties
export function getProceduralEmoji(hsl: HSL): string {
  const { h, s, l } = hsl;

  if (l <= 12) return '🖤';
  if (l >= 92) return '🤍';
  if (s <= 15) {
    if (l < 40) return '🖤';
    if (l < 70) return '🩶';
    return '🤍';
  }

  // Hue based
  if (h >= 345 || h < 15) {
    return l > 75 ? '🌸' : l < 35 ? '🍷' : '🔴';
  }
  if (h >= 15 && h < 45) {
    return l > 75 ? '🍑' : l < 40 ? '🍂' : '🍊';
  }
  if (h >= 45 && h < 70) {
    return l > 80 ? '🍦' : '💛';
  }
  if (h >= 70 && h < 165) {
    return l > 75 ? '🌿' : l < 35 ? '🌲' : '🟢';
  }
  if (h >= 165 && h < 200) {
    return l > 75 ? '🧊' : '🩵';
  }
  if (h >= 200 && h < 260) {
    return l > 75 ? '☁️' : l < 35 ? '🌌' : '🔵';
  }
  if (h >= 260 && h < 315) {
    return l > 75 ? '🪻' : l < 35 ? '🔮' : '💜';
  }
  if (h >= 315 && h < 345) {
    return l > 75 ? '🌸' : '🩷';
  }

  return '🎨';
}

// Find the closest real color name for a given RGB color.
// Compares in HSL space so the hue match dominates the result:
// a bright red always gets a red name, a dark teal gets a teal name, etc.
export function nearestRealColorName(rgb: RGB): string {
  const target = rgbToHsl(rgb.r, rgb.g, rgb.b);

  let bestName = REAL_COLOR_NAMES[0].name;
  let bestDistance = Infinity;

  for (const real of REAL_COLOR_NAMES) {
    const realRgb = hexToRgb(real.hex);
    const realHsl = rgbToHsl(realRgb.r, realRgb.g, realRgb.b);

    let hueDiff = Math.abs(target.h - realHsl.h);
    hueDiff = Math.min(hueDiff, 360 - hueDiff) / 180; // 0..1, circular

    const satDiff = Math.abs(target.s - realHsl.s) / 100;
    const lightDiff = Math.abs(target.l - realHsl.l) / 100;

    // Hue matters most, then lightness, then saturation.
    const distance = hueDiff * 3 + lightDiff * 2 + satDiff;

    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = real.name;
    }
  }

  return bestName;
}

// Procedural Name Generator
export function generateProceduralName(hsl: HSL): {
  name: string;
  category: ColorCategory;
  rarity: Rarity;
  description: string;
} {
  const { h, s, l } = hsl;

  // Match the mixed color to the closest real color name
  const rgb = hslToRgb(h, s, l);
  const name = nearestRealColorName(rgb);

  // Determine Rarity
  let rarity: Rarity = 'Uncommon';
  if (s > 90 || l < 20 || l > 85) rarity = 'Rare';
  if ((h >= 260 && h <= 290) || (h >= 160 && h <= 180 && s > 80)) rarity = 'Epic';
  if (s > 95 && (l < 15 || l > 90)) rarity = 'Legendary';

  // Determine Category from lightness & hue
  let category: ColorCategory = 'Secondary';
  if (l <= 20) category = 'Dark';
  else if (l >= 80) category = 'Pastel';
  else if (s <= 15) category = 'Earth';
  else if (s > 90 && l > 55) category = 'Neon';
  else if (h >= 45 && h <= 70 && s > 60 && l > 25 && l <= 65) category = 'Metallic';
  else if (h >= 230 && h <= 310 && s > 50 && l <= 45) category = 'Cosmic';

  const article = /^[aeiou]/i.test(rarity) ? 'An' : 'A';
  const description = `${article} ${rarity.toLowerCase()} ${category.toLowerCase()} shade.`;

  return {
    name,
    category,
    rarity,
    description,
  };
}

// Core Blend Function: Blends two colors and returns resulting ColorItem
export function blendColors(c1: ColorItem, c2: ColorItem): ColorItem {
  const recipeKey = makeRecipeKey(c1.hex, c2.hex);

  // 1. Check Known Recipes
  if (KNOWN_RECIPES[recipeKey]) {
    const known = KNOWN_RECIPES[recipeKey];
    const rgb = hexToRgb(known.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return {
      id: known.hex,
      name: known.name,
      hex: known.hex,
      rgb,
      hsl,
      emoji: known.emoji,
      isBase: false,
      parents: [c1.name, c2.name],
      discoveredAt: Date.now(),
      rarity: known.rarity,
      category: known.category,
      description: known.description,
    };
  }

  // 2. Procedural Optical + RYB Fallback Blend
  const rgb = mixPaint(c1.rgb, c2.rgb);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const emoji = getProceduralEmoji(hsl);
  const meta = generateProceduralName(hsl);

  return {
    id: hex,
    name: meta.name,
    hex,
    rgb,
    hsl,
    emoji,
    isBase: false,
    parents: [c1.name, c2.name],
    discoveredAt: Date.now(),
    rarity: meta.rarity,
    category: meta.category,
    description: meta.description,
  };
}
