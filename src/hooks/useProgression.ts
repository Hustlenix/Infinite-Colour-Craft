import {useCallback,useEffect,useRef,useState} from 'react';
import type {ColorItem,DailyChallengeState,QuestReward} from '../types';
import {BASE_COLORS,hexToRgb,rgbToHsl} from '../utils/colorEngine';
import {isColorItem,normalizeDailyChallengeState,normalizeStringArray,normalizeUnlockedColors,safeGetItem,safeParseJSON,safeSetItem} from '../utils/storage';
import {advanceDailyChallenge,generateDailyChallenge,getTodayDateString,rolloverDaily} from '../utils/dailyChallengeEngine';
import {evaluateQuest,QUESTS,recordCraft,type CraftedCollection} from '../utils/quests';
export type RecipeRecord={parents:[string,string];result:string;time:number;pigment?:ColorItem};
type Progression={version:1;colors:ColorItem[];claims:string[];daily:DailyChallengeState;recipes:RecipeRecord[]};
const key='icc_progression_v1';
export function restoreProgression():Progression{
 const raw=safeParseJSON<Progression|null>(safeGetItem(key),null);
 let colors=normalizeUnlockedColors(raw?.colors)||normalizeUnlockedColors(safeParseJSON(safeGetItem('icc_unlocked_colors'),null))||BASE_COLORS;
 // Resolve only unambiguous legacy parent names. A missing chain remains unknown.
 colors=colors.map(c=>{if(c.parentIds||!c.parents)return c;const matches=c.parents.map(name=>colors.filter(p=>p.name===name||p.hex===name));return matches.every(m=>m.length===1)?{...c,parentIds:matches.map(m=>m[0].hex) as [string,string]}:c;});
 const recipes:RecipeRecord[]=Array.isArray(raw?.recipes)?raw.recipes.filter(r=>r&&Array.isArray(r.parents)&&r.parents.length===2&&r.parents.every(p=>typeof p==='string'&&/^#[\da-f]{6}$/i.test(p))&&typeof r.result==='string'&&/^#[\da-f]{6}$/i.test(r.result)).map(r=>({...r,parents:r.parents.map(p=>p.toUpperCase()) as [string,string],result:r.result.toUpperCase(),pigment:isColorItem(r.pigment)?r.pigment:undefined})):[];
 for(const c of colors)if(c.parentIds&&!recipes.some(r=>r.result===c.hex))recipes.push({parents:c.parentIds,result:c.hex,time:c.discoveredAt});
 const daily=rolloverDaily(normalizeDailyChallengeState(raw?.daily)||normalizeDailyChallengeState(safeParseJSON(safeGetItem('icc_daily_challenge_state'),null)),getTodayDateString());
 return{version:1,colors,recipes,claims:normalizeStringArray(raw?.claims)||normalizeStringArray(safeParseJSON(safeGetItem('icc_claimed_quests'),[]))||[],daily};
}
export function craftedEvidence(state:Pick<Progression,'colors'|'recipes'>):CraftedCollection{
 let records:CraftedCollection={};
 // Resolve legacy saves in either discovery order, including chains deeper than three mixes.
 for(let pass=0;pass<=state.recipes.length;pass++){
  const before=records;
  for(const recipe of state.recipes){const c=recipe.pigment||state.colors.find(c=>c.hex===recipe.result);if(c)records=recordCraft(records,c,recipe.parents);}
  if(records===before)break;
 }
 return records;
}
export function useProgression(){
 const[state,setState]=useState(restoreProgression),current=useRef(state),[warning,setWarning]=useState('');
 const commit=useCallback((next:Progression,requireSave=false)=>{
  const saved=safeSetItem(key,JSON.stringify(next));setWarning(saved?'':'Progress could not be saved. Free browser storage, then retry.');
  if(requireSave&&!saved)return false;
  current.current=next;setState(next);
  // Keep legacy keys readable by the original app and existing user exports.
  safeSetItem('icc_unlocked_colors',JSON.stringify(next.colors));safeSetItem('icc_claimed_quests',JSON.stringify(next.claims));safeSetItem('icc_daily_challenge_state',JSON.stringify(next.daily));
  return saved;
 },[]);
 useEffect(()=>{const refresh=()=>{const s=current.current,daily=rolloverDaily(s.daily,getTodayDateString());if(daily!==s.daily)commit({...s,daily});};const timer=setInterval(refresh,1000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};},[commit]);
 const discover=useCallback((color:ColorItem)=>{
  const s=current.current,existing=s.colors.find(c=>c.hex.toUpperCase()===color.hex.toUpperCase());
  const validParents=color.parentIds?.length===2&&color.parentIds.every(id=>s.colors.some(c=>c.hex===id));
  const colors=existing?s.colors:[color,...s.colors];
  const recipes=validParents&&!s.recipes.some(r=>r.result===color.hex&&[...r.parents].sort().join('+')===[...color.parentIds!].sort().join('+'))?[...s.recipes,{parents:color.parentIds!,result:color.hex,time:Date.now(),pigment:color}]:s.recipes;
  const daily=validParents?advanceDailyChallenge(s.daily,generateDailyChallenge(),color,!existing,getTodayDateString(),crypto.randomUUID()):rolloverDaily(s.daily,getTodayDateString());
  if(colors!==s.colors||recipes!==s.recipes||daily!==s.daily)commit({...s,colors,recipes,daily});
  return !existing;
 },[commit]);
 const claim=useCallback((id:string,reward:QuestReward,daily?:DailyChallengeState)=>{
  const s=current.current;if(s.claims.includes(id))return null;
  const existing=s.colors.find(c=>c.hex===reward.hex),rgb=hexToRgb(reward.hex);
  const color:ColorItem=existing||{id:reward.hex,hex:reward.hex,name:reward.pigmentName,rgb,hsl:rgbToHsl(rgb.r,rgb.g,rgb.b),emoji:reward.emoji,rarity:reward.rarity,category:reward.category,description:reward.description,discoveredAt:Date.now()};
  // One persisted snapshot for REWARD_CLAIMED + unlock; no crafting event is emitted.
  if(!commit({...s,claims:[...s.claims,id],colors:existing?s.colors:[color,...s.colors],daily:daily||s.daily},true))return null;
  return existing?null:color;
 },[commit]);
 const claimQuest=useCallback((id:string)=>{const q=QUESTS.find(q=>q.id===id);if(!q||!evaluateQuest(q,craftedEvidence(current.current)).complete)return null;return claim(q.id,q.reward);},[claim]);
 const claimDaily=useCallback(()=>{const daily=rolloverDaily(current.current.daily,getTodayDateString());if(!daily.completed||daily.claimed)return null;return claim('daily:'+daily.lastDate,generateDailyChallenge().rewardPigment,{...daily,claimed:true});},[claim]);
 return{state,discover,claimQuest,claimDaily,warning,retry:()=>commit(current.current),reset:()=>commit({version:1,colors:BASE_COLORS,claims:[],recipes:[],daily:rolloverDaily(null,getTodayDateString())})};
}
