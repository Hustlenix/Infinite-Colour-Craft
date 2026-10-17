import type { ColorItem, QuestReward } from '../types';
import { BASE_COLORS } from './colorEngine';
export type CraftedRecord = { color: ColorItem; parents: [string, string]; depth: number; alternatives?: [string,string][] };
export type CraftedCollection = Record<string, CraftedRecord>;
export type QuestDefinition = { id: string; title: string; description: string; required: number; kind: 'first' | 'count' | 'category' | 'dark' | 'rarity' | 'multistep'; value?: string; reward: QuestReward };
const reward = (pigmentName: string, hex: string, category: QuestReward['category'], rarity: QuestReward['rarity'] = 'Rare'): QuestReward => ({ pigmentName, hex, category, rarity, emoji: '✦', description: `A pigment awarded for exploration: ${pigmentName}.` });
export const QUESTS: QuestDefinition[] = [
  { id:'q0', title:'First Transmutation', description:'Craft a new pigment from two starter pigments.', required:1, kind:'first', reward:reward('Radical Red','#FF3366','Secondary') },
  { id:'q1', title:'Spectrum Initiate', description:'Collect 10 starter or naturally crafted pigments. Rewards do not count.', required:10, kind:'count', reward:reward('Deep Sky Blue','#00B4D8','Secondary','Uncommon') },
  { id:'q2', title:'Neon Catalyst', description:'Craft a Neon pigment.', required:1, kind:'category', value:'Neon', reward:reward('Neon Green','#39FF14','Neon') },
  { id:'q3', title:'Pastel Whisperer', description:'Craft 3 different Pastel pigments.', required:3, kind:'category', value:'Pastel', reward:reward('Cherry Blossom Pink','#FFB7B2','Pastel') },
  { id:'q4', title:'Dark Shadow Alchemist', description:'Craft 3 different Dark pigments using Black as a direct ingredient.', required:3, kind:'dark', reward:reward('Eerie Black','#121212','Dark') },
  { id:'q5', title:'Metallic Forge', description:'Craft a Metallic pigment.', required:1, kind:'category', value:'Metallic', reward:reward('Bronze','#CD7F32','Metallic') },
  { id:'q6', title:'Cosmic Voyager', description:'Craft a Cosmic pigment.', required:1, kind:'category', value:'Cosmic', reward:reward('Amethyst','#9D4EDD','Cosmic','Epic') },
  { id:'q7', title:'Rare Collector', description:'Craft 3 different pigments of exactly Rare rarity.', required:3, kind:'rarity', value:'Rare', reward:reward('Turquoise','#00F5D4','Secondary') },
  { id:'q8', title:'Legendary Synthesizer', description:'Craft an Epic, Legendary or God pigment through a verified chain of at least two mixes.', required:1, kind:'multistep', reward:reward('Gold','#FFD100','Metallic','Legendary') },
  { id:'q9', title:'Godlike Alchemist', description:'Craft a God rarity pigment.', required:1, kind:'rarity', value:'God', reward:reward('Mauve','#E0AAFF','Cosmic','God') },
  { id:'q10', title:'Master Colorist', description:'Collect 25 starter or naturally crafted pigments.', required:25, kind:'count', reward:reward('Deep Purple','#7209B7','Cosmic','Legendary') },
  { id:'q11', title:'Chromatic Sovereign', description:'Collect 50 starter or naturally crafted pigments.', required:50, kind:'count', reward:reward('Orange','#FF9F1C','Neon','God') },
];
const bases = new Set(BASE_COLORS.map(c => c.hex));
export function evaluateQuest(quest: QuestDefinition, crafted: CraftedCollection) {
  const records = Object.values(crafted).filter(r => !bases.has(r.color.hex));
  let amount = 0;
  if (quest.kind === 'count') amount = records.length + bases.size;
  if (quest.kind === 'first') amount = records.filter(r => r.parents.every(p => bases.has(p))).length;
  if (quest.kind === 'category') amount = records.filter(r => r.color.category === quest.value).length;
  if (quest.kind === 'dark') amount = records.filter(r => r.color.category === 'Dark' && [r.parents,...(r.alternatives||[])].some(pair=>pair.includes('#000000'))).length;
  if (quest.kind === 'rarity') amount = records.filter(r => r.color.rarity === quest.value).length;
  if (quest.kind === 'multistep') amount = records.filter(r => r.depth >= 2 && ['Epic','Legendary','God'].includes(r.color.rarity)).length;
  return { amount: Math.min(quest.required, amount), complete: amount >= quest.required };
}
export function recordCraft(crafted: CraftedCollection, color: ColorItem, parents: [string, string]): CraftedCollection {
  const known = !parents.includes(color.hex) && parents.every(p => bases.has(p) || crafted[p]?.depth > 0);
  const depth = known ? 1 + Math.max(...parents.map(p => bases.has(p) ? 0 : crafted[p].depth)) : 0;
  const previous = crafted[color.hex];
  if (previous) {
    const key=[...parents].sort().join('+'),recorded=[previous.parents,...(previous.alternatives||[])].some(pair=>[...pair].sort().join('+')===key);
    // Once a chain is verified, keep it stable. Replaying cyclic alternative recipes
    // must not increase its depth on every restore.
    if(recorded && (previous.depth>0 || !depth))return crafted;
    return {...crafted,[color.hex]:{...previous,depth:previous.depth||depth,alternatives:recorded?previous.alternatives:[...(previous.alternatives||[]),parents]}};
  }
  return { ...crafted, [color.hex]: { color, parents, depth } };
}
