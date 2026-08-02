export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'God';

export type ColorCategory = 
  | 'Base' 
  | 'Primary' 
  | 'Secondary' 
  | 'Pastel' 
  | 'Neon' 
  | 'Dark' 
  | 'Earth' 
  | 'Metallic' 
  | 'Cosmic';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorItem {
  id: string; // Unique hex or ID
  name: string;
  hex: string;
  rgb: RGB;
  hsl: HSL;
  emoji: string;
  isBase?: boolean;
  parents?: [string, string] | null; // Hex codes or names of parents
  discoveredAt: number; // Timestamp
  rarity: Rarity;
  category: ColorCategory;
  description?: string;
}

export interface BoardTile {
  id: string; // Unique instance ID
  colorId: string; // Refers to ColorItem.id
  name: string;
  hex: string;
  emoji: string;
  x: number;
  y: number;
  zIndex: number;
  isNew?: boolean;
}

export interface RecipeRule {
  key: string; // Standardized pair key e.g. "#FF0000+#0000FF"
  name: string;
  hex: string;
  emoji: string;
  rarity: Rarity;
  category: ColorCategory;
  description?: string;
}

export type BrushStyle = 'round' | 'soft' | 'calligraphy' | 'watercolor' | 'spray' | 'eraser' | 'bucket' | 'eyedropper';

export interface BrushConfig {
  color: string;
  size: number;
  opacity: number;
  style: BrushStyle;
}

export interface QuestReward {
  pigmentName: string;
  hex: string;
  emoji: string;
  rarity: Rarity;
  category: ColorCategory;
  description: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetType: 'count' | 'category' | 'rarity' | 'lightness' | 'hue';
  targetValue: string | number;
  requiredAmount: number;
  currentAmount: number;
  completed: boolean;
  rewardBadge: string;
  rewardPigment?: QuestReward;
  claimed?: boolean;
}

export interface Palette {
  id: string;
  name: string;
  colors: string[]; // Hex codes
  createdAt: number;
}

export type ActiveTab = 'board' | 'studio' | 'recipes' | 'palettes' | 'quests' | 'daily';

export interface DailyChallenge {
  id: string; // date string YYYY-MM-DD
  dateFormatted: string;
  title: string;
  description: string;
  hint: string;
  targetType: 'category' | 'rarity' | 'hue_range' | 'lightness' | 'combine_count';
  targetCategory?: ColorCategory;
  targetRarity?: Rarity;
  targetHueMin?: number;
  targetHueMax?: number;
  targetLightnessMin?: number;
  requiredAmount: number;
  rewardPigment: QuestReward;
}

export interface DailyChallengeState {
  lastDate: string;
  completed: boolean;
  claimed: boolean;
  progress: number;
  streak: number;
  lastCompletedDate: string;
}
