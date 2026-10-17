import { describe, expect, it, vi, afterEach } from 'vitest';
import { beginEvaluation, finishRound, nextRound, pauseSession, resumeSession, startSession } from '../ai/speedSession';
import { forward } from '../utils/doodleNet';
import { validateModel } from '../ai/modelService';
import weights from '../data/doodle_weights.json';
import { BASE_COLORS, blendColors } from '../utils/colorEngine';
import { evaluateQuest, QUESTS, recordCraft } from '../utils/quests';
import { advanceDailyChallenge, generateDailyChallenge, rolloverDaily } from '../utils/dailyChallengeEngine';
import { exportPalette, moveSwatch, uniquePaletteName } from '../utils/palettes';
import { restoreProgression, craftedEvidence } from '../hooks/useProgression';
import { normalizeDailyChallengeState } from '../utils/storage';

const prompts=['cat','dog','bird','fish','flower'];
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('doodle model contract',()=>{
  it('validates real weight dimensions and rejects corrupt models',()=>{
    expect(validateModel(weights).categories).toHaveLength(10);
    expect(()=>validateModel({...weights,state:{...weights.state,'conv1.bias':[NaN]}})).toThrow();
    expect(()=>validateModel({})).toThrow();
    expect(()=>forward([0],validateModel(weights))).toThrow();
    expect(()=>forward(new Array(784).fill(NaN),validateModel(weights))).toThrow();
  });
  it('retries a failed model fetch and shares a successful load',async()=>{
    vi.resetModules(); const {loadDoodleModel}=await import('../ai/modelService');
    const fetcher=vi.fn().mockResolvedValueOnce({ok:false,status:503}).mockResolvedValue({ok:true,json:async()=>weights});vi.stubGlobal('fetch',fetcher);
    await expect(loadDoodleModel()).rejects.toThrow('503');
    const [a,b]=await Promise.all([loadDoodleModel(),loadDoodleModel()]);expect(a).toBe(b);expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
describe('speed draw transitions',()=>{
  it('uses a monotonic deadline even if the display timer never ticks',()=>{
    let s=startSession(prompts,1000);s=beginEvaluation(s,17000);expect(s.seconds).toBe(4);
    s=finishRound(s,[{label:'cat',pct:1,logit:1}]);expect(s.results).toHaveLength(1);expect(s.results[0].score).toBe(168);
    expect(finishRound(s,[])).toBe(s);expect(beginEvaluation(s,18000)).toBe(s);
  });
  it('pauses, resumes and produces exactly five results',()=>{
    let s=startSession(prompts,0);s=pauseSession(s,4000);expect(s.seconds).toBe(16);s=resumeSession(s,99000);expect(s.deadline).toBe(115000);
    for(let i=0;i<5;i++){s=finishRound(beginEvaluation(s,s.deadline),[]);if(i<4)s=nextRound(s,200000+i*30000);}
    expect(s.phase).toBe('feedback');s=nextRound(s,999999);expect(s.phase).toBe('results');expect(s.results).toHaveLength(5);expect(s.results.every(r=>r.score===0)).toBe(true);
    expect(nextRound(s,999999)).toBe(s);
  });
});
describe('evidence based quests',()=>{
  const red=BASE_COLORS.find(c=>c.name==='Red')!,blue=BASE_COLORS.find(c=>c.name==='Blue')!;
  it('rewards and high rarity possession alone cannot complete crafting quests',()=>{
    expect(evaluateQuest(QUESTS.find(q=>q.id==='q8')!,{}).complete).toBe(false);
    const c=blendColors(red,blue),records=recordCraft({},c,[red.hex,blue.hex]);
    expect(evaluateQuest(QUESTS[0],records).complete).toBe(true);expect(evaluateQuest(QUESTS[1],records).amount).toBe(6);
    expect(Object.keys(recordCraft(records,c,[red.hex,blue.hex]))).toHaveLength(1);
  });
  it('requires verified multi-step ancestry and does not inflate depth through self mixes',()=>{
    const c={...blendColors(red,blue),rarity:'Epic' as const};let records=recordCraft({},c,[red.hex,blue.hex]);
    records=recordCraft(records,c,[c.hex,c.hex]);expect(records[c.hex].depth).toBe(1);
    expect(evaluateQuest(QUESTS.find(q=>q.id==='q8')!,records).complete).toBe(false);
    const second={...blendColors(c,red),rarity:'Epic' as const};records=recordCraft(records,second,[c.hex,red.hex]);
    expect(evaluateQuest(QUESTS.find(q=>q.id==='q8')!,records).complete).toBe(true);
  });
});
describe('local daily calendar and event progress',()=>{
  it('preserves consecutive streaks and resets missed days and per-day event lists',()=>{
    const old={...rolloverDaily(null,'2026-10-17'),completed:true,claimed:true,streak:3,lastCompletedDate:'2026-10-17',processedEventIds:['one']};
    expect(rolloverDaily(old,'2026-10-18')).toMatchObject({streak:3,progress:0,claimed:false,processedEventIds:[]});
    expect(rolloverDaily(old,'2026-10-19').streak).toBe(0);
    expect(rolloverDaily(old,'2027-01-01').lastDate).toBe('2027-01-01');
  });
  it('distinguishes new discoveries, unique matching pigments and duplicate event delivery',()=>{
    const date='2026-10-17',challenge={...generateDailyChallenge(date),targetType:'combine_count' as const,requiredAmount:3,requiresNewDiscovery:true};
    let s=rolloverDaily(null,date);s=advanceDailyChallenge(s,challenge,BASE_COLORS[0],false,date,'a');expect(s.progress).toBe(0);
    s=advanceDailyChallenge(s,challenge,BASE_COLORS[0],true,date,'a');s=advanceDailyChallenge(s,challenge,BASE_COLORS[0],true,date,'a');expect(s.progress).toBe(1);
    const repeatable={...challenge,requiresNewDiscovery:false};s=advanceDailyChallenge(s,repeatable,BASE_COLORS[0],false,date,'b');expect(s.progress).toBe(2);
    const category={...challenge,targetType:'category' as const,targetCategory:'Base' as const,requiresNewDiscovery:false};let t=rolloverDaily(null,date);t=advanceDailyChallenge(t,category,BASE_COLORS[0],false,date,'a');t=advanceDailyChallenge(t,category,BASE_COLORS[0],false,date,'b');expect(t.progress).toBe(1);
  });
});
describe('palette editing and exact exports',()=>{
  const p={id:'p',name:'Study',colors:['#FF0000','#0000FF'],createdAt:10};
  it('reorders without mutating the saved palette and handles duplicate or blank names',()=>{
    expect(moveSwatch(p.colors,1,-1)).toEqual(['#0000FF','#FF0000']);expect(p.colors[0]).toBe('#FF0000');
    expect(uniquePaletteName('study',[p])).toBe('study (2)');expect(uniquePaletteName(' ',[])).toBe('Untitled palette');
  });
  it('exports the supplied saved palette in all four formats',()=>{
    expect(exportPalette(p,'HEX')).toBe('#FF0000\n#0000FF');expect(exportPalette(p,'CSS')).toContain(':root {');
    expect(exportPalette(p,'Tailwind v4')).toBe('@theme {\n  --color-palette-1: #FF0000;\n  --color-palette-2: #0000FF;\n}');
    expect(JSON.parse(exportPalette(p,'JSON'))).toEqual(p);
  });
});

describe('save migration and event cleanup',()=>{
  it('does not restore yesterday’s processed events after midnight',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date(2026,9,18,0,0,1));
    const value={version:1,colors:BASE_COLORS,recipes:[null],claims:[],daily:{...rolloverDaily(null,'2026-10-17'),processedEventIds:['old'],discoveredHexes:['#FF0000']}};
    vi.stubGlobal('localStorage',{getItem:(key:string)=>key==='icc_progression_v1'?JSON.stringify(value):null});
    expect(restoreProgression().daily).toMatchObject({lastDate:'2026-10-18',progress:0,processedEventIds:[],discoveredHexes:[]});
  });
  it('keeps same-day unique discoveries and ignores malformed optional arrays',()=>{
    expect(normalizeDailyChallengeState({lastDate:'2026-10-18',processedEventIds:42,discoveredHexes:'bad'})).not.toHaveProperty('discoveredHexes');
    expect(normalizeDailyChallengeState({lastDate:'2026-10-18',processedEventIds:['a',3],discoveredHexes:['#aabbcc','invalid']})).toMatchObject({processedEventIds:['a'],discoveredHexes:['#AABBCC']});
  });
  it('resolves deep reverse-ordered legacy ancestry and keeps cyclic alternatives stable',()=>{
    const first=blendColors(BASE_COLORS[0],BASE_COLORS[2]);
    const colors=[...BASE_COLORS,first];
    const recipes=[{parents:first.parentIds!,result:first.hex,time:1}];
    for(let i=0;i<6;i++){
      const color={...blendColors(colors.at(-1)!,BASE_COLORS[3]),hex:'#12345'+i,id:'#12345'+i};
      recipes.push({parents:[colors.at(-1)!.hex,BASE_COLORS[3].hex],result:color.hex,time:i+2});colors.push(color);
    }
    const records=craftedEvidence({colors,recipes:[...recipes].reverse()});
    expect(records[colors.at(-1)!.hex].depth).toBe(7);
    const replay=recordCraft(records,first,[colors.at(-1)!.hex,BASE_COLORS[0].hex]);
    expect(recordCraft(replay,first,[colors.at(-1)!.hex,BASE_COLORS[0].hex])).toBe(replay);
    expect(replay[first.hex].depth).toBe(1);
  });
  it('aborting inference removes its pending timeout and ignores late worker replies',async()=>{
    vi.useFakeTimers();vi.resetModules();
    let instance:any;
    class WorkerStub {onmessage:any;onerror:any;postMessage=vi.fn();terminate=vi.fn();constructor(){instance=this;}}
    vi.stubGlobal('Worker',WorkerStub);
    const {recognizeDoodle}=await import('../ai/inference');
    const abort=new AbortController();
    const prediction=recognizeDoodle(new Array(784).fill(0),validateModel(weights),abort.signal);
    const rejected=expect(prediction).rejects.toMatchObject({name:'AbortError'});
    expect(vi.getTimerCount()).toBe(1);abort.abort();await rejected;expect(vi.getTimerCount()).toBe(0);
    expect(()=>instance.onmessage({data:{id:1,result:[]}})).not.toThrow();
  });
  it('uses actual crafting metadata when a previously gifted pigment is mixed naturally',()=>{
    const natural=blendColors(BASE_COLORS[0],BASE_COLORS[2]);
    const gift={...natural,rarity:'God' as const};
    const records=craftedEvidence({colors:[...BASE_COLORS,gift],recipes:[{parents:natural.parentIds!,result:natural.hex,time:1,pigment:natural}]});
    expect(evaluateQuest(QUESTS.find(q=>q.id==='q9')!,records).complete).toBe(false);
  });
});
