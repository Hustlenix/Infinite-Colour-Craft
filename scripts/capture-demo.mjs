import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = process.env.APP_URL ?? 'http://localhost:4173/Infinite-Colour-Craft/';
const SHOT_DIR = 'docs/screenshots';
const VIDEO_DIR = '../temp-opencode-video';

mkdirSync(SHOT_DIR, { recursive: true });
mkdirSync(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
});

const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// --- Welcome modal -> Start Crafting (spawns the five base pigments) ---
await page.getByRole('button', { name: /start crafting/i }).click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOT_DIR}/board.png` });
console.log('captured board.png');

// --- Mix #1: drag Red onto Blue -> NEW DISCOVERY modal ---
async function mixTileByName(sourceName, targetName) {
  const board = page.locator('main');
  const src = page.locator(`main [style*="z-index"]`, { hasText: sourceName }).last();
  const dst = page.locator(`main [style*="z-index"]`, { hasText: targetName }).last();

  const sb = await src.boundingBox();
  const db = await dst.boundingBox();
  if (!sb || !db) throw new Error(`tile not found: ${sourceName} / ${targetName}`);

  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await page.mouse.down();
  // glide toward the target in small steps so the drag registers
  const steps = 24;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      sb.x + sb.width / 2 + ((db.x + db.width / 2 - (sb.x + sb.width / 2)) * i) / steps,
      sb.y + sb.height / 2 + ((db.y + db.height / 2 - (sb.y + sb.height / 2)) * i) / steps,
    );
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(250); // hold overlap so fuse target highlights
  await page.mouse.up();
}

await mixTileByName('Red', 'Blue');
await page.waitForSelector('text=NEW DISCOVERY!', { timeout: 8000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOT_DIR}/discovery.png` });
console.log('captured discovery.png');
// dismiss the discovery toast via its close button
await page.locator('button[title="Dismiss"]').click();
await page.waitForTimeout(400);

// --- Mix #2: White + Green -> pastel discovery, then jump into the studio ---
await mixTileByName('White', 'Green');
await page.waitForSelector('text=NEW DISCOVERY!', { timeout: 8000 });
await page.waitForTimeout(400);
await page.getByRole('button', { name: /use in paint studio/i }).click();
await page.waitForTimeout(600);

// --- Draw expressive strokes on the canvas ---
const canvas = page.locator('canvas').first();
await canvas.click(); // focus/position sanity
const cb = await canvas.boundingBox();

async function stroke(points, perStepMs = 12) {
  await page.mouse.move(cb.x + points[0][0], cb.y + points[0][1]);
  await page.mouse.down();
  for (let i = 1; i < points.length; i++) {
    await page.mouse.move(cb.x + points[i][0], cb.y + points[i][1]);
    await page.waitForTimeout(perStepMs);
  }
  await page.mouse.up();
}

// big sweeping arc (default brush, active color)
const arc = [];
for (let t = 0; t <= Math.PI * 1.5; t += 0.15) {
  arc.push([430 + Math.cos(t) * 260, 380 + Math.sin(t) * 190]);
}
await stroke(arc);
await page.waitForTimeout(300);

// pick a different pigment from the inventory sidebar (second unlocked color)
await page.locator('aside button, aside [role="button"]').nth(1).click().catch(() => {});
await page.waitForTimeout(250);
const wave = [];
for (let x = 120; x <= 700; x += 18) {
  wave.push([x, 640 + Math.sin(x / 60) * 90]);
}
await stroke(wave);

// rainbow tool for a multicolor flourish
await page.keyboard.press('r');
await page.waitForTimeout(250);
const spiral = [];
for (let t = 0; t <= Math.PI * 6; t += 0.12) {
  spiral.push([720 + Math.cos(t) * (30 + t * 22), 420 + Math.sin(t) * (26 + t * 18)]);
}
await stroke(spiral);
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/studio.png` });
console.log('captured studio.png');

// --- Dark mode flourish ---
await page.keyboard.press('Alt+t');
await page.waitForTimeout(500);
await page.keyboard.press('b'); // back to brush
await page.waitForTimeout(200);
const wave2 = [];
for (let x = 780; x >= 180; x -= 16) {
  wave2.push([x, 220 + Math.sin(x / 70) * 70]);
}
await stroke(wave2);
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT_DIR}/studio-dark.png` });
console.log('captured studio-dark.png');

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'NO CONSOLE ERRORS');

await page.close();
const video = page.video();
if (video) {
  await video.saveAs('docs/demo-raw.webm');
  console.log('saved docs/demo-raw.webm');
}
await context.close();
await browser.close();
