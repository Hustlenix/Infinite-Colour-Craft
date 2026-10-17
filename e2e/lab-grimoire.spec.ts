import { test, expect, type Page } from '@playwright/test';
import { BASE_COLORS, blendColors } from '../src/utils/colorEngine';
import { generateDailyChallenge, rolloverDaily } from '../src/utils/dailyChallengeEngine';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('icc_test_started')) return;
    localStorage.clear();
    localStorage.setItem('icc_seen_welcome', 'true');
    sessionStorage.setItem('icc_test_started', 'true');
  });
});

const lab = (page: Page) => page.getByRole('button', { name: 'AI Lab', exact: true }).click();
const grimoire = (page: Page) => page.getByTitle('Grimoire: Recipes, Palettes, Quests, Daily', {exact:true}).click();
const section = (page: Page, name: string) => page.getByRole('navigation', { name: 'Grimoire sections' }).getByRole('button', { name, exact: true }).click();

async function sketch(page: Page, label = 'Doodle Vision canvas') {
  const canvas = page.getByLabel(label);
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const points = [[.5,.12],[.62,.4],[.91,.4],[.68,.59],[.78,.87],[.5,.7],[.22,.87],[.32,.59],[.09,.4],[.38,.4],[.5,.12]];
  await page.mouse.move(box.x + box.width * points[0][0], box.y + box.height * points[0][1]);
  await page.mouse.down();
  for (const [x, y] of points.slice(1)) await page.mouse.move(box.x + box.width*x, box.y + box.height*y, { steps: 3 });
  await page.mouse.up();
}

const pixels = (page: Page, label: string) => page.getByLabel(label).evaluate((c: HTMLCanvasElement) => c.toDataURL());

test('drawing survives theme changes, both modes and application navigation; blank does not predict', async ({ page }) => {
  await page.goto('./'); await lab(page);
  await page.getByRole('button', { name:'Recognize', exact:true }).click();
  await expect(page.getByText('Draw one of the ten supported objects first.')).toBeVisible();
  await sketch(page);
  const before = await pixels(page, 'Doodle Vision canvas');
  await page.getByRole('button', { name:'Dark Mode', exact:true }).click();
  expect(await pixels(page, 'Doodle Vision canvas')).toBe(before);
  await page.getByRole('button', { name:'Speed Challenge', exact:true }).click();
  await page.getByRole('button', { name:'Doodle Vision', exact:true }).click();
  expect(await pixels(page, 'Doodle Vision canvas')).toBe(before);
  await grimoire(page); await lab(page);
  expect(await pixels(page, 'Doodle Vision canvas')).toBe(before);
  await page.getByRole('button', { name:'Recognize', exact:true }).click();
  await expect(page.getByText('Top Predictions', { exact:true })).toBeVisible();
  await expect(page.getByText(/Detected:/)).toContainText('star');
  await page.screenshot({ path:'docs/verification/ai-lab-desktop.png' });
  await page.getByRole('button', { name:'Clear', exact:true }).click();
  expect(await pixels(page, 'Doodle Vision canvas')).not.toBe(before);
  await page.reload(); await lab(page);
  await expect(page.getByText('Top Predictions', { exact:true })).toBeHidden();
});

test('real model load failure has a working retry', async ({ page }) => {
  let fail = true;
  await page.route(/\/src\/data\/doodle_weights\.json$/, route => fail ? route.fulfill({status:503, body:'unavailable'}) : route.continue());
  await page.goto('./'); await lab(page);
  await expect(page.getByRole('alert')).toContainText('503');
  fail = false;
  await page.getByRole('button', { name:'Retry model' }).click();
  await expect(page.getByRole('button', {name:'Recognize', exact:true})).toBeEnabled();
  await expect(page.getByRole('alert')).toBeHidden();
});

test('challenge pauses on navigation, retains strokes, submits once per round, and restarts', async ({ page }) => {
  await page.goto('./'); await lab(page);
  await page.getByRole('button', {name:'Speed Challenge', exact:true}).click();
  await page.getByRole('button', {name:'Start Challenge'}).click();
  await sketch(page, 'Speed Challenge canvas');
  const before = await pixels(page, 'Speed Challenge canvas');
  await grimoire(page); await lab(page);
  await expect(page.getByRole('button', {name:'Resume round'})).toBeVisible();
  expect(await pixels(page, 'Speed Challenge canvas')).toBe(before);
  await page.getByRole('button', {name:'Resume round'}).click();
  for (let i=0;i<5;i++) {
    await page.getByRole('button', {name:'Submit', exact:true}).evaluate((b: HTMLButtonElement) => {b.click();b.click();});
    if (i<4) {
      await expect(page.getByRole('button', {name:'Next Round'})).toBeVisible();
      await page.getByRole('button', {name:'Next Round'}).click();
    }
  }
  await page.getByRole('button', {name:'See Final Results'}).click();
  await expect(page.getByRole('heading', {name:'Challenge Results'})).toBeVisible();
  await expect(page.getByText(/AI saw:/)).toHaveCount(5);
  await page.getByRole('button', {name:'Play Again'}).click();
  await expect(page.getByRole('button', {name:'Submit', exact:true})).toBeVisible();
  await expect(page.getByText('AI saw:')).toBeHidden();
});

test('a throttled display tick uses elapsed time and expires exactly once', async ({ page }) => {
  await page.clock.install();
  await page.goto('./'); await lab(page);
  await page.getByRole('button', {name:'Speed Challenge', exact:true}).click();
  await page.getByRole('button', {name:'Start Challenge'}).click();
  await page.clock.fastForward(23000);
  await expect(page.getByRole('button', {name:'Next Round'})).toBeVisible();
  await expect(page.getByText('Score: +0 pts', {exact:true})).toBeVisible();
});

test('Grimoire sections, search, sort, detail focus and palette cross-link work', async ({ page }) => {
  await page.goto('./'); await grimoire(page);
  await page.getByLabel('Sort recipes').selectOption('name');
  const cards = page.getByRole('button', {name:/^Inspect /});
  expect(await cards.allTextContents()).toHaveLength(5);
  expect(await cards.first().getAttribute('aria-label')).toBe('Inspect Black');
  await page.getByLabel('Search recipes').fill('no-such-pigment');
  await expect(page.getByText(/No matching pigments/)).toBeVisible();
  await page.getByLabel('Search recipes').fill('#FF0000');
  await expect(cards).toHaveCount(1);
  await page.getByRole('button', {name:'Inspect Red', exact:true}).press('Enter');
  const dialog = page.getByRole('dialog', {name:'Red', exact:true});
  await expect(dialog).toContainText('Starter pigment');
  await expect(page.getByRole('button', {name:'Close pigment details'})).toBeFocused();
  await dialog.getByRole('button', {name:'Add to Palette'}).click();
  await expect(page.getByRole('button', {name:'Select Red for palette'})).toHaveAttribute('aria-pressed','true');
  await section(page, 'Quests'); await expect(page.getByRole('heading', {name:'Alchemy Quests & Rewards'})).toBeVisible();
  await section(page, 'Daily'); await expect(page.getByRole('button', {name:'LOCKED UNTIL COMPLETE'})).toBeVisible();
  await section(page, 'Recipes');
  await expect(page.getByLabel('Search recipes')).toHaveValue('#FF0000');
  await page.screenshot({path:'docs/verification/grimoire-desktop.png'});
});

test('palette creation, rename, reorder, removal, duplicate and reload preserve exact saved swatches', async ({ page }) => {
  await page.goto('./'); await grimoire(page); await section(page, 'Palettes');
  await page.getByLabel('Palette name').fill('Sunset');
  for(const c of ['Red','Blue','White']) await page.getByRole('button', {name:`Select ${c} for palette`}).click();
  await page.getByRole('button', {name:/Save Palette/}).click();
  const card=page.locator('div.bg-white.border-4').filter({has:page.getByRole('heading', {name:'Sunset',exact:true})});
  await card.getByRole('button', {name:'Edit palette'}).click();
  await page.getByLabel('Palette name').fill('Evening');
  await page.getByRole('button', {name:'Move White left'}).click();
  await page.getByRole('button', {name:'Remove Blue',exact:true}).click();
  await page.getByRole('button', {name:/Update Palette/}).click();
  await expect(card).toHaveCount(0);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('icc_palettes')!));
  expect(saved.find((p:any)=>p.name==='Evening').colors).toEqual(['#FF0000','#FFFFFF']);
  await page.reload(); await grimoire(page); await section(page,'Palettes');
  const renamed=page.locator('div.bg-white.border-4').filter({has:page.getByRole('heading', {name:'Evening',exact:true})});
  await renamed.getByRole('button', {name:'Duplicate',exact:true}).click();
  await expect(page.getByRole('heading', {name:'Evening copy',exact:true})).toBeVisible();
  await page.screenshot({path:'docs/verification/palettes-desktop.png'});
});

test('blocked clipboard exposes exact saved export and recipe HEX for manual copying', async ({ page }) => {
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(Error('Denied'))},configurable:true}));
  await page.goto('./'); await grimoire(page); await section(page,'Palettes');
  await page.getByRole('button', {name:'Tailwind',exact:true}).click();
  await expect(page.getByLabel('Manual copy text')).toHaveValue(/@theme \{/);
  await expect(page.getByLabel('Manual copy text')).toHaveValue(/--color-palette-4: #FFFF00/);
  await section(page,'Recipes'); await page.getByRole('button', {name:'Inspect Red',exact:true}).click();
  await page.getByRole('button', {name:'Copy HEX',exact:true}).click();
  await expect(page.getByRole('dialog').getByLabel('Manual copy text')).toHaveValue('#FF0000');
  await expect(page.getByRole('button', {name:'Copied',exact:true})).toHaveCount(0);
});

test('natural recipe ancestry and one-time reward claims survive refresh without rewarding other quests', async ({ page }) => {
  const red=BASE_COLORS[0],blue=BASE_COLORS[2],color=blendColors(red,blue);
  await page.addInitScript(({colors,color})=>{
    if(localStorage.getItem('icc_progression_v1'))return;
    localStorage.setItem('icc_unlocked_colors',JSON.stringify([color,...colors]));
  },{colors:BASE_COLORS,color});
  await page.goto('./'); await grimoire(page);
  await page.getByRole('button', {name:`Inspect ${color.name}`,exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('#FF0000');
  await expect(page.getByRole('dialog')).toContainText('#0000FF');
  await page.getByRole('button', {name:'Close pigment details'}).click();
  await section(page,'Quests');
  await page.getByRole('button', {name:'CLAIM BONUS PIGMENT',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('icc_progression_v1')!));
  expect(state.claims.filter((id:string)=>id==='q0')).toHaveLength(1);
  expect(state.colors.filter((c:any)=>c.hex==='#FF3366')).toHaveLength(1);
  expect(state.recipes).toHaveLength(1);
  await page.reload(); await grimoire(page); await section(page,'Quests');
  await expect(page.getByText('REWARD CLAIMED',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'CLAIM BONUS PIGMENT',exact:true})).toHaveCount(0);
});

test('daily updates across local midnight while open, without reloading', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026,9,17,23,59,58));
  await page.goto('./'); await grimoire(page); await section(page,'Daily');
  const before=generateDailyChallenge('2026-10-17');
  await expect(page.getByText(before.title,{exact:true})).toBeVisible();
  await page.clock.setFixedTime(new Date(2026,9,18,0,0,2));
  const after=generateDailyChallenge('2026-10-18');
  await expect(page.getByText(after.title,{exact:true})).toBeVisible();
  await expect(page.getByText(after.dateFormatted,{exact:false})).toBeVisible();
});

for(const [width,height,dpr] of [[1440,900,1],[1440,900,2],[1024,768,1],[820,1180,1],[800,900,1],[390,844,1],[320,568,1]]) {
  test(`feature controls remain reachable at ${width}x${height} DPR${dpr}`,async({browser})=>{
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:width<500});
    const page=await context.newPage();
    await page.addInitScript(()=>localStorage.setItem('icc_seen_welcome','true'));
    await page.goto('./');
    await lab(page);
    const canvas=page.getByLabel('Doodle Vision canvas');
    await canvas.scrollIntoViewIfNeeded();
    const box=(await canvas.boundingBox())!;
    expect(Math.abs(box.width-box.height)).toBeLessThan(2);
    expect(box.width).toBeGreaterThan(width<500?240:300);
    await sketch(page);
    await page.getByRole('button',{name:'Recognize',exact:true}).click();
    await expect(page.getByText('Top Predictions',{exact:true})).toBeVisible();
    await page.screenshot({path:`docs/verification/ai-${width}-${height}-${dpr}.png`});
    await grimoire(page);
    for(const name of ['Palettes','Quests','Daily','Recipes']) {
      await section(page,name);
      await expect(page.getByRole('navigation',{name:'Grimoire sections'}).getByRole('button',{name,exact:true})).toHaveAttribute('aria-current','page');
    }
    await page.screenshot({path:`docs/verification/grimoire-${width}-${height}-${dpr}.png`});
    await context.close();
  });
}

test('touch drawing, pointer cancellation and colored ink use real recognition', async ({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  const page=await context.newPage();
  await page.addInitScript(()=>localStorage.setItem('icc_seen_welcome','true'));
  await page.goto('./');await lab(page);
  const canvas=page.getByLabel('Doodle Vision canvas');
  await canvas.scrollIntoViewIfNeeded();const box=(await canvas.boundingBox())!;
  const cdp=await context.newCDPSession(page);
  const before=await pixels(page,'Doodle Vision canvas');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.3,y:box.y+box.height*.3}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.7,y:box.y+box.height*.7}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  expect(await pixels(page,'Doodle Vision canvas')).not.toBe(before);
  await page.getByLabel('Drawing ink').selectOption('#0000FF');
  await page.getByRole('button',{name:'Recognize',exact:true}).click();
  await expect(page.getByText('Top Predictions',{exact:true})).toBeVisible();
  await context.close();
});

test('storage failure keeps a reward claim available and does not grant its pigment',async({page})=>{
  const color=blendColors(BASE_COLORS[0],BASE_COLORS[2]);
  await page.addInitScript(({colors,color})=>{
    localStorage.setItem('icc_unlocked_colors',JSON.stringify([color,...colors]));
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(key==='icc_progression_v1')throw Error('Quota exceeded');return original.call(this,key,value);};
  },{colors:BASE_COLORS,color});
  await page.goto('./');await grimoire(page);await section(page,'Quests');
  await page.getByRole('button',{name:'CLAIM BONUS PIGMENT',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Progress could not be saved');
  await expect(page.getByRole('button',{name:'CLAIM BONUS PIGMENT',exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('icc_unlocked_colors')!));
  expect(saved.some((c:any)=>c.hex==='#FF3366')).toBe(false);
});

test('an already-owned daily reward is claimed once without emitting a crafting event',async({page})=>{
  const date='2026-10-17',challenge=generateDailyChallenge(date);
  const reward={...BASE_COLORS[0],id:challenge.rewardPigment.hex,hex:challenge.rewardPigment.hex,name:challenge.rewardPigment.pigmentName,isBase:false};
  await page.clock.setFixedTime(new Date(2026,9,17,12));
  await page.addInitScript(({colors,reward,date})=>{
    if(localStorage.getItem('icc_progression_v1'))return;
    localStorage.setItem('icc_progression_v1',JSON.stringify({version:1,colors:[reward,...colors],recipes:[],claims:[],daily:{lastDate:date,completed:true,progress:1,streak:1,lastCompletedDate:date,claimed:false}}));
  },{colors:BASE_COLORS,reward,date});
  await page.goto('./');await grimoire(page);await section(page,'Daily');
  await page.getByRole('button',{name:'CLAIM EXCLUSIVE PIGMENT',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  await expect(page.getByText('CLAIMED TODAY',{exact:true})).toBeVisible();
  await page.reload();await grimoire(page);await section(page,'Daily');
  await expect(page.getByText('CLAIMED TODAY',{exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('icc_progression_v1')!));
  expect(saved.colors.filter((c:any)=>c.hex===reward.hex)).toHaveLength(1);
  expect(saved.claims).toEqual(['daily:'+date]);expect(saved.recipes).toHaveLength(0);
});

test('a real board mix connects Recipes, Palette, Studio and AI Lab without losing work',async({page})=>{
  await page.goto('./');
  await page.getByRole('button',{name:'Spawn Base Spectrum',exact:true}).click();
  const board=page.getByRole('main');
  const red=board.getByText('Red',{exact:true}),blue=board.getByText('Blue',{exact:true});
  const from=(await red.boundingBox())!,to=(await blue.boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();
  await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:20});await page.mouse.up();
  await page.getByRole('button',{name:'Dismiss',exact:true}).click();
  await grimoire(page);await page.getByRole('button',{name:'Inspect Magenta',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('#FF0000');
  await expect(page.getByRole('dialog')).toContainText('#0000FF');
  await page.getByRole('button',{name:'Add to Palette',exact:true}).click();
  await page.getByRole('button',{name:'Select White for palette'}).click();
  await page.getByLabel('Palette name').fill('Craft journey');await page.getByRole('button',{name:/Save Palette/}).click();
  const saved=page.locator('div.bg-white.border-4').filter({has:page.getByRole('heading',{name:'Craft journey',exact:true})});
  await saved.getByRole('button',{name:'Use Magenta in Studio',exact:true}).click();
  const studio=page.locator('canvas').filter({visible:true}).first();
  await studio.scrollIntoViewIfNeeded();const box=(await studio.boundingBox())!;
  await page.mouse.move(box.x+100,box.y+100);await page.mouse.down();await page.mouse.move(box.x+200,box.y+200,{steps:15});await page.mouse.up();
  const art=await studio.evaluate((c:HTMLCanvasElement)=>c.toDataURL());
  await lab(page);await expect(page.getByLabel('Drawing ink')).toHaveValue('#FF00FF');
  await sketch(page);const doodle=await pixels(page,'Doodle Vision canvas');
  await page.getByRole('button',{name:'Studio',exact:true}).last().click();
  expect(await studio.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(art);
  await lab(page);expect(await pixels(page,'Doodle Vision canvas')).toBe(doodle);
  await page.getByRole('button',{name:'Craft',exact:true}).last().click();
  await expect(board.getByText('Magenta',{exact:true})).toBeVisible();
});
