import { DailyChallenge, ColorItem, QuestReward } from '../types';

// Deterministic seed pseudo-random generator based on date string e.g. "2026-07-25"
function getSeedFromDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const DAILY_REWARDS_POOL: QuestReward[] = [
  {
    pigmentName: 'Cyberpunk Volt',
    hex: '#39FF14',
    emoji: '⚡',
    rarity: 'Legendary',
    category: 'Neon',
    description: 'Exclusive daily reward: Radiant electric cybernetic plasma pigment.',
  },
  {
    pigmentName: 'Solstice Platinum',
    hex: '#E5E4E2',
    emoji: '🛡️',
    rarity: 'God',
    category: 'Metallic',
    description: 'Exclusive daily reward: Ultra-refined pure solstice platinum sheen.',
  },
  {
    pigmentName: 'Pastel Aurora',
    hex: '#E0AAFF',
    emoji: '🌌',
    rarity: 'Epic',
    category: 'Pastel',
    description: 'Exclusive daily reward: Soft glowing aurora pastel bloom.',
  },
  {
    pigmentName: 'Hypernova Purple',
    hex: '#7209B7',
    emoji: '🪐',
    rarity: 'Legendary',
    category: 'Cosmic',
    description: 'Exclusive daily reward: Deep interstellar hypernova violet pigment.',
  },
  {
    pigmentName: 'Helios Gold Dust',
    hex: '#FFD700',
    emoji: '☀️',
    rarity: 'God',
    category: 'Metallic',
    description: 'Exclusive daily reward: Golden dust gathered from solar rays.',
  },
  {
    pigmentName: 'Abyssal Midnight',
    hex: '#0B090A',
    emoji: '🖤',
    rarity: 'Epic',
    category: 'Dark',
    description: 'Exclusive daily reward: Dense abyssal shadow pigment.',
  },
  {
    pigmentName: 'Angel Wings White',
    hex: '#F8F9FA',
    emoji: '🕊️',
    rarity: 'Rare',
    category: 'Pastel',
    description: 'Exclusive daily reward: Feathery pure bright wing pigment.',
  },
  {
    pigmentName: 'Chromatic Prism',
    hex: '#00F5D4',
    emoji: '💎',
    rarity: 'Legendary',
    category: 'Secondary',
    description: 'Exclusive daily reward: Pure refracting crystal prism pigment.',
  },
  {
    pigmentName: 'Double Spark Crimson',
    hex: '#FF4D6D',
    emoji: '🔥',
    rarity: 'Epic',
    category: 'Secondary',
    description: 'Exclusive daily reward: Dual spark crimson pigment.',
  },
  {
    pigmentName: 'Lagoon Turquoise',
    hex: '#48CAE4',
    emoji: '🌊',
    rarity: 'Rare',
    category: 'Secondary',
    description: 'Exclusive daily reward: Shimmering tropical lagoon turquoise.',
  },
];

const CHALLENGE_TEMPLATES = [
  {
    title: 'Neon Transmutation',
    description: 'Synthesize 1 Neon category pigment on the crafting board today.',
    hint: 'Combine primary colors with bright yellow or light tones to spark Neon energy!',
    targetType: 'category' as const,
    targetCategory: 'Neon' as const,
    requiredAmount: 1,
  },
  {
    title: 'Metallic Forging',
    description: 'Synthesize 1 Metallic category pigment (Gold, Silver, Bronze, or Metal).',
    hint: 'Combine Yellow/Orange with White, Dark gray, or Warm earth tones.',
    targetType: 'category' as const,
    targetCategory: 'Metallic' as const,
    requiredAmount: 1,
  },
  {
    title: 'Pastel Bloom',
    description: 'Synthesize 2 delicate Pastel category pigments today.',
    hint: 'Mix vibrant pigments with White to soften them into gentle pastels.',
    targetType: 'category' as const,
    targetCategory: 'Pastel' as const,
    requiredAmount: 2,
  },
  {
    title: 'Cosmic Seeker',
    description: 'Synthesize 1 Cosmic category pigment today.',
    hint: 'Mix deep blues, purples, or cyan with glowing accents to touch the cosmos.',
    targetType: 'category' as const,
    targetCategory: 'Cosmic' as const,
    requiredAmount: 1,
  },
  {
    title: 'High Brightness Spectrum',
    description: 'Synthesize a pigment with Lightness over 70%.',
    hint: 'Blend in pure White (#FFFFFF) to elevate lightness.',
    targetType: 'lightness' as const,
    targetLightnessMin: 70,
    requiredAmount: 1,
  },
  {
    title: 'Golden Spectrum Quest',
    description: 'Synthesize a pigment with Yellow/Gold Hue (between 40° and 65°).',
    hint: 'Blend red and green or warm yellow combinations.',
    targetType: 'hue_range' as const,
    targetHueMin: 40,
    targetHueMax: 65,
    requiredAmount: 1,
  },
  {
    title: 'Master Combination',
    description: 'Perform 3 successful new color transmutations today.',
    hint: 'Drag and stack any two different colors on the board!',
    targetType: 'combine_count' as const,
    requiredAmount: 3,
  },
  {
    title: 'Rare Tier Synthesizer',
    description: 'Synthesize at least 1 Rare or higher tier pigment today.',
    hint: 'Combine secondary or pastel colors together for higher tier rarity.',
    targetType: 'rarity' as const,
    targetRarity: 'Rare' as const,
    requiredAmount: 1,
  },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTodayDateReadable(): string {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  return new Date().toLocaleDateString(undefined, options);
}

export function generateDailyChallenge(dateStr = getTodayDateString()): DailyChallenge {
  const seed = getSeedFromDate(dateStr);
  
  const templateIdx = seed % CHALLENGE_TEMPLATES.length;
  const rewardIdx = (seed * 3) % DAILY_REWARDS_POOL.length;

  const template = CHALLENGE_TEMPLATES[templateIdx];
  const reward = DAILY_REWARDS_POOL[rewardIdx];

  return {
    id: dateStr,
    dateFormatted: formatTodayDateReadable(),
    title: template.title,
    description: template.description,
    hint: template.hint,
    targetType: template.targetType,
    targetCategory: template.targetCategory,
    targetRarity: template.targetRarity,
    targetHueMin: template.targetHueMin,
    targetHueMax: template.targetHueMax,
    targetLightnessMin: template.targetLightnessMin,
    requiredAmount: template.requiredAmount,
    rewardPigment: reward,
  };
}

export function calculateTimeRemainingUntilMidnight(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return {
    hours,
    minutes,
    seconds,
    formatted: `${hStr}h ${mStr}m ${sStr}s`,
  };
}

export function checkColorMatchesChallenge(color: ColorItem, challenge: DailyChallenge): boolean {
  if (challenge.targetType === 'category') {
    return color.category === challenge.targetCategory;
  }
  if (challenge.targetType === 'rarity') {
    const ranks: Record<string, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, God: 6 };
    const targetRank = ranks[challenge.targetRarity || 'Rare'] || 3;
    const colorRank = ranks[color.rarity] || 1;
    return colorRank >= targetRank;
  }
  if (challenge.targetType === 'hue_range') {
    const h = color.hsl.h;
    const min = challenge.targetHueMin ?? 0;
    const max = challenge.targetHueMax ?? 360;
    return h >= min && h <= max;
  }
  if (challenge.targetType === 'lightness') {
    const l = color.hsl.l;
    const min = challenge.targetLightnessMin ?? 70;
    return l >= min;
  }
  if (challenge.targetType === 'combine_count') {
    return true; // Any color combination counts
  }
  return false;
}
