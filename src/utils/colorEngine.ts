import { ColorItem, ColorCategory, HSL, Rarity, RGB } from '../types';

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
    description: 'The fundamental primary element of warmth, passion, and fire.',
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
    description: 'The fundamental vibrant pigment of flora, nature, and vitality.',
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
    description: 'The deep elemental pigment of the oceans, sky, and serenity.',
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
    description: 'The pure reflective light element that softens and brightens pigments.',
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
    description: 'The total absorbent shade that creates depth, shadows, and darkness.',
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
    description: 'A vivid fusion of pure Red and Blue light.',
  },
  [makeRecipeKey('#00FF00', '#0000FF')]: {
    name: 'Cyan',
    hex: '#00FFFF',
    emoji: '🩵',
    rarity: 'Uncommon',
    category: 'Secondary',
    description: 'An electric aqua pigment born from Green and Blue.',
  },
  [makeRecipeKey('#FF0000', '#00FF00')]: {
    name: 'Yellow',
    hex: '#FFFF00',
    emoji: '💛',
    rarity: 'Uncommon',
    category: 'Secondary',
    description: 'A radiant sunny hue synthesized by combining Red and Green.',
  },
  [makeRecipeKey('#FF0000', '#FFFFFF')]: {
    name: 'Pink',
    hex: '#FFB6C1',
    emoji: '🌸',
    rarity: 'Common',
    category: 'Pastel',
    description: 'A delicate pastel shade of Red lightened by White.',
  },
  [makeRecipeKey('#0000FF', '#FFFFFF')]: {
    name: 'Sky Blue',
    hex: '#87CEEB',
    emoji: '☁️',
    rarity: 'Common',
    category: 'Pastel',
    description: 'An airy, tranquil blue tint reminiscent of clear afternoon skies.',
  },
  [makeRecipeKey('#00FF00', '#FFFFFF')]: {
    name: 'Mint Green',
    hex: '#98FF98',
    emoji: '🌿',
    rarity: 'Common',
    category: 'Pastel',
    description: 'A refreshing light pastel green.',
  },
  [makeRecipeKey('#000000', '#FFFFFF')]: {
    name: 'Slate Gray',
    hex: '#808080',
    emoji: '🩶',
    rarity: 'Common',
    category: 'Base',
    description: 'A neutral balance between light and darkness.',
  },
  [makeRecipeKey('#FF0000', '#000000')]: {
    name: 'Crimson',
    hex: '#800000',
    emoji: '🍷',
    rarity: 'Uncommon',
    category: 'Dark',
    description: 'A rich, dark blood-red tone forged in shadow.',
  },
  [makeRecipeKey('#0000FF', '#000000')]: {
    name: 'Midnight Blue',
    hex: '#000080',
    emoji: '🌌',
    rarity: 'Uncommon',
    category: 'Dark',
    description: 'The deep, mysterious color of the nocturnal sky.',
  },
  [makeRecipeKey('#00FF00', '#000000')]: {
    name: 'Forest Green',
    hex: '#005500',
    emoji: '🌲',
    rarity: 'Uncommon',
    category: 'Dark',
    description: 'A deep, dense evergreen hue.',
  },

  // Secondary Combinations
  [makeRecipeKey('#FFFF00', '#FF0000')]: {
    name: 'Orange',
    hex: '#FFA500',
    emoji: '🍊',
    rarity: 'Uncommon',
    category: 'Secondary',
    description: 'A warm, energetic citrus blend of Yellow and Red.',
  },
  [makeRecipeKey('#00FFFF', '#FF00FF')]: {
    name: 'Electric Violet',
    hex: '#8A2BE2',
    emoji: '🔮',
    rarity: 'Rare',
    category: 'Neon',
    description: 'A vibrant magical purple synthesized from Cyan and Magenta.',
  },
  [makeRecipeKey('#FFFF00', '#0000FF')]: {
    name: 'Emerald Green',
    hex: '#00A86B',
    emoji: '🥦',
    rarity: 'Rare',
    category: 'Earth',
    description: 'A rich jewel-toned green crafted by blending Yellow and Blue paint.',
  },
  [makeRecipeKey('#FF00FF', '#FFFF00')]: {
    name: 'Coral Rose',
    hex: '#FF6F61',
    emoji: '🪸',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'A tropical oceanic reef pigment combining Magenta and Yellow.',
  },
  [makeRecipeKey('#808080', '#FF0000')]: {
    name: 'Terracotta',
    hex: '#E07A5F',
    emoji: '🧱',
    rarity: 'Rare',
    category: 'Earth',
    description: 'A warm clay earthenware pigment made with Red and Slate.',
  },
  [makeRecipeKey('#808080', '#FFFF00')]: {
    name: 'Amber Gold',
    hex: '#FFBF00',
    emoji: '🪙',
    rarity: 'Rare',
    category: 'Metallic',
    description: 'A lustrous golden metallic pigment.',
  },
  [makeRecipeKey('#800000', '#FFFF00')]: {
    name: 'Burnt Sienna',
    hex: '#E97451',
    emoji: '🍂',
    rarity: 'Rare',
    category: 'Earth',
    description: 'An earthy reddish-brown pigment prized by classical painters.',
  },
  [makeRecipeKey('#FF00FF', '#FFFFFF')]: {
    name: 'Lavender',
    hex: '#E6E6FA',
    emoji: '🪻',
    rarity: 'Uncommon',
    category: 'Pastel',
    description: 'A soft floral purple bloom lightened with White.',
  },
  [makeRecipeKey('#00FFFF', '#FFFFFF')]: {
    name: 'Ice Aqua',
    hex: '#E0FFFF',
    emoji: '🧊',
    rarity: 'Uncommon',
    category: 'Pastel',
    description: 'A crisp, freezing pale aqua tone.',
  },
  [makeRecipeKey('#FFA500', '#FFFFFF')]: {
    name: 'Peach',
    hex: '#FFDAB9',
    emoji: '🍑',
    rarity: 'Uncommon',
    category: 'Pastel',
    description: 'A soft, velvety pastel fruit pigment.',
  },
  [makeRecipeKey('#FFA500', '#000000')]: {
    name: 'Chocolate Brown',
    hex: '#7B3F00',
    emoji: '🍫',
    rarity: 'Uncommon',
    category: 'Earth',
    description: 'A rich cocoa brown resulting from darkening Orange.',
  },
  [makeRecipeKey('#8A2BE2', '#FFFFFF')]: {
    name: 'Periwinkle',
    hex: '#CCCCFF',
    emoji: '🪻',
    rarity: 'Rare',
    category: 'Pastel',
    description: 'An ethereal pastel violet-blue shade.',
  },
  [makeRecipeKey('#8A2BE2', '#000000')]: {
    name: 'Deep Obsidian Purple',
    hex: '#301934',
    emoji: '🔮',
    rarity: 'Epic',
    category: 'Dark',
    description: 'A shadowy, mystical violet bordering dark void.',
  },
  [makeRecipeKey('#00A86B', '#00FFFF')]: {
    name: 'Turquoise',
    hex: '#40E0D0',
    emoji: '💎',
    rarity: 'Rare',
    category: 'Cosmic',
    description: 'A prized gemstone color sparkling between emerald and cyan.',
  },
  [makeRecipeKey('#FFBF00', '#800000')]: {
    name: 'Copper Bronze',
    hex: '#B87333',
    emoji: '🥉',
    rarity: 'Epic',
    category: 'Metallic',
    description: 'An ancient metallic alloy sheen blending gold and crimson.',
  },
  [makeRecipeKey('#00FFFF', '#0000FF')]: {
    name: 'Cobalt Blue',
    hex: '#0047AB',
    emoji: '🌊',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'An intense, deep ceramic blue.',
  },
  [makeRecipeKey('#FFFF00', '#00FF00')]: {
    name: 'Chartreuse Lime',
    hex: '#7FFF00',
    emoji: '🍋',
    rarity: 'Uncommon',
    category: 'Neon',
    description: 'An electric zesty yellow-green.',
  },
  [makeRecipeKey('#FF00FF', '#FF0000')]: {
    name: 'Vermilion',
    hex: '#E34234',
    emoji: '💥',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'A fiery scarlet red with strong magenta undertones.',
  },
  [makeRecipeKey('#00A86B', '#FFFFFF')]: {
    name: 'Seafoam Green',
    hex: '#9FE2BF',
    emoji: '🌊',
    rarity: 'Rare',
    category: 'Pastel',
    description: 'A soothing oceanic foam color.',
  },
  [makeRecipeKey('#40E0D0', '#8A2BE2')]: {
    name: 'Cosmic Nebula Indigo',
    hex: '#4B0082',
    emoji: '🌌',
    rarity: 'Legendary',
    category: 'Cosmic',
    description: 'A deep celestial violet discovered by fusing Turquoise and Electric Violet.',
  },
  [makeRecipeKey('#FFBF00', '#FFFFFF')]: {
    name: 'Radiant Ivory Gold',
    hex: '#FFFDD0',
    emoji: '🍦',
    rarity: 'Epic',
    category: 'Metallic',
    description: 'A warm, luxurious cream gold sheen.',
  },
  // God Tier Pigments - Gold and Silver
  [makeRecipeKey('#FFFF00', '#FFBF00')]: {
    name: 'Pure Gold',
    hex: '#FFD700',
    emoji: '🥇',
    rarity: 'God',
    category: 'Metallic',
    description: 'The supreme, radiant divine gold pigment of absolute alchemy.',
  },
  [makeRecipeKey('#808080', '#FFFFFF')]: {
    name: 'Sterling Silver',
    hex: '#C0C0C0',
    emoji: '🥈',
    rarity: 'God',
    category: 'Metallic',
    description: 'The supreme, brilliant divine silver pigment of absolute alchemy.',
  },

  // Fun Whimsical Craft Discoveries
  [makeRecipeKey('#FFB6C1', '#FFFFFF')]: {
    name: 'Unicorn Cotton Candy',
    hex: '#FFD1DC',
    emoji: '🦄',
    rarity: 'Epic',
    category: 'Pastel',
    description: 'A fluffy magical pastel cloud spun from pure pink & white energy.',
  },
  [makeRecipeKey('#FFA500', '#FFB6C1')]: {
    name: 'Tropical Sunset',
    hex: '#FD5E53',
    emoji: '🌅',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'The breathtaking warm glow of a summer horizon.',
  },
  [makeRecipeKey('#7FFF00', '#000000')]: {
    name: 'Toxic Slime',
    hex: '#39FF14',
    emoji: '🧪',
    rarity: 'Rare',
    category: 'Neon',
    description: 'A glowing bio-hazardous radioactive pigment.',
  },
  [makeRecipeKey('#FFD700', '#800000')]: {
    name: 'Phoenix Flame',
    hex: '#FF4500',
    emoji: '🔥',
    rarity: 'Legendary',
    category: 'Neon',
    description: 'An immortal incandescent scarlet fire born from gold and crimson.',
  },
  [makeRecipeKey('#FFD700', '#00A86B')]: {
    name: 'Dragon Scale Gold',
    hex: '#D4AF37',
    emoji: '🐉',
    rarity: 'God',
    category: 'Metallic',
    description: 'An ancient metallic dragon skin luster forged in dragonfire.',
  },
  [makeRecipeKey('#C0C0C0', '#000080')]: {
    name: 'Moonlight Silver',
    hex: '#E6E6FA',
    emoji: '🌙',
    rarity: 'Epic',
    category: 'Cosmic',
    description: 'A serene silvery moonlight beam reflected on nocturnal waters.',
  },
  [makeRecipeKey('#87CEEB', '#FFB6C1')]: {
    name: 'Rainbow Prism',
    hex: '#F4C2C2',
    emoji: '🌈',
    rarity: 'Legendary',
    category: 'Cosmic',
    description: 'Refracted multi-spectral light shining through morning dew.',
  },
  [makeRecipeKey('#FFD700', '#FF00FF')]: {
    name: 'Hyperdrive Cyberpunk',
    hex: '#FF1493',
    emoji: '⚡',
    rarity: 'God',
    category: 'Neon',
    description: 'The ultimate synthwave glow blending golden solar power and magenta.',
  },
  [makeRecipeKey('#000000', '#4B0082')]: {
    name: 'Black Hole Void',
    hex: '#0B0B12',
    emoji: '🕳️',
    rarity: 'God',
    category: 'Dark',
    description: 'An infinite gravitational singularity absorbing all visible spectrum light.',
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

// Procedural Name Generator
export function generateProceduralName(hsl: HSL): {
  name: string;
  category: ColorCategory;
  rarity: Rarity;
  description: string;
} {
  const { h, s, l } = hsl;

  // Prefix based on Lightness & Saturation
  let prefix = '';
  if (s > 85 && l > 45 && l < 65) prefix = 'Vibrant ';
  else if (s > 90 && l >= 65) prefix = 'Neon ';
  else if (l >= 80 && s > 20) prefix = 'Pastel ';
  else if (l >= 88) prefix = 'Ethereal ';
  else if (l <= 20) prefix = 'Obsidian ';
  else if (l <= 35) prefix = 'Deep ';
  else if (s <= 25 && l > 35) prefix = 'Dusty ';
  else if (s <= 40 && l <= 35) prefix = 'Shadow ';
  else if (h >= 230 && h <= 290 && l < 45) prefix = 'Mystic ';
  else if (h >= 30 && h <= 70 && s > 70) prefix = 'Luminous ';
  else prefix = 'Radiant ';

  // Hue Base Noun
  let baseNoun = 'Spectrum';
  let category: ColorCategory = 'Secondary';

  if (l <= 15) {
    baseNoun = 'Void Shadow';
    category = 'Dark';
  } else if (l >= 90 && s <= 15) {
    baseNoun = 'Moonlight';
    category = 'Pastel';
  } else if (s <= 15) {
    baseNoun = 'Ashen Slate';
    category = 'Earth';
  } else if (h >= 345 || h < 15) {
    baseNoun = l < 35 ? 'Maroon Crimson' : l > 75 ? 'Rose Petal' : 'Fiery Scarlet';
  } else if (h >= 15 && h < 45) {
    baseNoun = l < 40 ? 'Burnt Umber' : l > 75 ? 'Peach Blossom' : 'Amber Flame';
    category = 'Earth';
  } else if (h >= 45 && h < 70) {
    baseNoun = l > 80 ? 'Cream Chiffon' : 'Sunburst Gold';
    category = 'Metallic';
  } else if (h >= 70 && h < 150) {
    baseNoun = l < 35 ? 'Jade Forest' : l > 75 ? 'Mint Dew' : 'Verdant Meadow';
  } else if (h >= 150 && h < 200) {
    baseNoun = l > 75 ? 'Arctic Breeze' : 'Cerulean Tide';
  } else if (h >= 200 && h < 250) {
    baseNoun = l < 35 ? 'Abyssal Blue' : l > 75 ? 'Sky Horizon' : 'Sapphire Wave';
  } else if (h >= 250 && h < 310) {
    baseNoun = l < 35 ? 'Midnight Amethyst' : l > 75 ? 'Soft Lavender' : 'Cosmic Violet';
    category = 'Cosmic';
  } else {
    baseNoun = l > 75 ? 'Blush Blossom' : 'Fuchsia Spark';
  }

  const fullName = `${prefix}${baseNoun}`.trim();

  // Determine Rarity
  let rarity: Rarity = 'Uncommon';
  if (s > 90 || l < 20 || l > 85) rarity = 'Rare';
  if ((h >= 260 && h <= 290) || (h >= 160 && h <= 180 && s > 80)) rarity = 'Epic';
  if (s > 95 && (l < 15 || l > 90)) rarity = 'Legendary';

  const description = `A vibrant ${category.toLowerCase()} pigment with a unique ${rarity.toLowerCase()} shade.`;

  return {
    name: fullName,
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
