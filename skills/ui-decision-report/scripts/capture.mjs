#!/usr/bin/env node
// Screenshots, pins, mockup renders and crops for a round, with Playwright
// (installed in this folder: npm install && npx playwright install chromium).
//
//   node capture.mjs login <url> <stateFile> [stepsFile]
//       Without stepsFile: opens a visible browser at <url>; the user signs in and closes the window.
//       With stepsFile (a JSON list of actions, test accounts only): signs in headless.
//       Either way the session is saved to <stateFile>. One stateFile per role.
//   node capture.mjs shoot <roundDir>
//       Reads <roundDir>/capture.json, writes full-page screenshots to <roundDir>/screens/
//       and the screen list to <roundDir>/screens.json.
//   node capture.mjs pins <roundDir>
//       For each finding in <roundDir>/findings.json with a `selector` and a `viewport` but no `pin`,
//       measures the element on the live page and writes the pin back as page percentages.
//   node capture.mjs snap <htmlFile> <outFile> <width> [height]
//       Renders a standalone mockup at one width, to check it looks right.
//   node capture.mjs crop <imageFile> <x,y,w,h> <outFile>
//       Cuts a region (percent of the image, as in a pin) with a margin around it.
//   node capture.mjs zoom <htmlFile> <outFile.jpg> <width> <selector | x,y,w,h> [pad]
//       Renders a mockup at <width> and cuts out the changed part at twice the pixel density:
//       the element <selector> matches, or the rectangle x,y,w,h in CSS pixels of the page, plus [pad]
//       pixels around it (default 24). Prints the rectangle it used, so the other options of the same
//       question can be cut with exactly the same one.
//
// capture.json:
//   { "baseUrl": "http://localhost:5173",
//     "roles": { "<role>": { "storageState": "<absolute path outside the repo>" } },
//     "viewports": { "desktop": { "w": 1440, "h": 900 }, "phone": { "w": 390, "h": 844 } },
//     "pages": [ { "view": "<view id>", "path": "/orders", "role": "<role>"?, "viewports": ["desktop"],
//                  "waitFor": "<selector>"?, "actions": [ <action> ]? } ] }
// action: { "click": sel } | { "fill": sel, "value": text } | { "focus": sel }
//       | { "press": key, "on": sel? }        key press, on the focused element or on <sel>
//       | { "waitFor": sel } | { "waitForText": text } | { "goto": path }
//       | { "evaluate": "<JavaScript run in the page>" }
//   An SVG control such as g[role=slider] often ignores click(): use focus, then press (ArrowRight, Enter).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Playwright is not installed. Run, in the skill\'s scripts folder: npm install && npx playwright install chromium'); process.exit(2); }

const [cmd, a1, a2, a3, a4] = process.argv.slice(2);
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));

async function runActions(page, actions, baseUrl) {
  for (const a of actions ?? []) {
    if (a.click) await page.click(a.click);
    else if (a.fill) await page.fill(a.fill, a.value ?? '');
    else if (a.focus) await page.focus(a.focus);
    else if (a.press) { if (a.on) await page.press(a.on, a.press); else await page.keyboard.press(a.press); }
    else if (a.waitFor) await page.waitForSelector(a.waitFor, { timeout: 15000 });
    else if (a.waitForText) await page.getByText(a.waitForText).first().waitFor({ timeout: 15000 });
    else if (a.evaluate) await page.evaluate(a.evaluate);
    else if (a.goto) await page.goto(new URL(a.goto, baseUrl ?? page.url()).href, { waitUntil: 'networkidle' });
    else throw new Error(`unknown action ${JSON.stringify(a)}`);
  }
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function openPage(browser, cfg, roundDir, p, vp) {
  let state;
  if (p.role) {
    const r = cfg.roles?.[p.role];
    if (!r) throw new Error(`role "${p.role}" is not in capture.json roles`);
    state = resolve(roundDir, r.storageState);
    if (!existsSync(state)) throw new Error(`no session for role "${p.role}" at ${state}; run login first`);
  }
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, storageState: state, reducedMotion: 'reduce' });
  return { context, page: await context.newPage() };
}

async function visit(page, cfg, p) {
  await page.goto(new URL(p.path, cfg.baseUrl).href, { waitUntil: 'networkidle' });
  if (p.waitFor) await page.waitForSelector(p.waitFor, { timeout: 15000 });
  await runActions(page, p.actions, cfg.baseUrl);
  await page.evaluate(() => document.fonts?.ready);
}

if (cmd === 'login') {
  if (!a1 || !a2) { console.error('Usage: node capture.mjs login <url> <stateFile> [stepsFile]'); process.exit(2); }
  if (a3) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(a1, { waitUntil: 'networkidle' });
    await runActions(page, readJson(a3));
    await context.storageState({ path: a2 });
    await browser.close();
    console.log(`Signed in; session saved to ${a2}. Check one screenshot to confirm.`);
  } else {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(a1);
    console.log('Sign in in the browser window, then close the window.');
    let open = true;
    page.on('close', () => { open = false; });
    browser.on('disconnected', () => { open = false; });
    while (open) {
      try { await context.storageState({ path: a2 }); } catch { break; }
      await new Promise(r => setTimeout(r, 2000));
    }
    await browser.close().catch(() => {});
    console.log(existsSync(a2) ? `Session saved to ${a2}` : 'No session was saved.');
  }
} else if (cmd === 'shoot') {
  const roundDir = a1; const cfg = readJson(join(roundDir, 'capture.json'));
  mkdirSync(join(roundDir, 'screens'), { recursive: true });
  const browser = await chromium.launch();
  const screens = [], failures = [];
  for (const p of cfg.pages) for (const name of p.viewports) {
    const vp = cfg.viewports[name]; if (!vp) { failures.push(`${p.view}: unknown viewport ${name}`); continue; }
    let context;
    try {
      let page; ({ context, page } = await openPage(browser, cfg, roundDir, p, vp));
      await visit(page, cfg, p);
      const file = `screens/${p.view}.${name}.jpg`;
      await page.screenshot({ path: join(roundDir, file), fullPage: true, type: 'jpeg', quality: 78 });
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      screens.push({ view: p.view, viewport: name, w: vp.w, h, file });
      console.log(`ok   ${file}`);
    } catch (e) { failures.push(`${p.view} @ ${name}: ${e.message.split('\n')[0]}`); }
    await context?.close();
  }
  await browser.close();
  writeFileSync(join(roundDir, 'screens.json'), JSON.stringify(screens, null, 2));
  if (failures.length) { console.error(`${failures.length} page(s) failed:\n- ` + failures.join('\n- ')); process.exit(1); }
} else if (cmd === 'pins') {
  const roundDir = a1; const cfg = readJson(join(roundDir, 'capture.json'));
  const path = join(roundDir, 'findings.json'); const data = readJson(path);
  // A finding with a viewport gets `pin`; one without (it holds at every width) gets `pins` per viewport.
  const todo = data.findings.filter(f => f.selector && (f.viewport ? !f.pin : !f.pins));
  const browser = await chromium.launch(); const misses = [];
  for (const f of todo) {
    const p = cfg.pages.find(x => x.view === f.view);
    if (!p) { misses.push(`${f.id}: no capture page for view ${f.view}`); continue; }
    const names = f.viewport ? [f.viewport] : p.viewports;
    for (const name of names) {
      const vp = cfg.viewports[name];
      let context;
      try {
        let page; ({ context, page } = await openPage(browser, cfg, roundDir, p, vp));
        await visit(page, cfg, p);
        const box = await page.evaluate(sel => {
          const e = [...document.querySelectorAll(sel)].find(x => x.getClientRects().length); if (!e) return null;
          const r = e.getBoundingClientRect(), W = document.documentElement.scrollWidth, H = document.documentElement.scrollHeight;
          const pct = (v, t) => Math.max(0, Math.min(100, Math.round(1000 * v / t) / 10));
          return { x: pct(r.left + scrollX, W), y: pct(r.top + scrollY, H), w: pct(r.width, W), h: pct(r.height, H) };
        }, f.selector);
        if (!box) misses.push(`${f.id} @ ${name}: selector ${f.selector} matched nothing visible`);
        else if (f.viewport) { f.pin = box; console.log(`ok   ${f.id}`); }
        else { (f.pins ??= {})[name] = box; console.log(`ok   ${f.id} @ ${name}`); }
      } catch (e) { misses.push(`${f.id} @ ${name}: ${e.message.split('\n')[0]}`); }
      await context?.close();
    }
  }
  await browser.close();
  writeFileSync(path, JSON.stringify(data, null, 2));
  if (misses.length) { console.error(`${misses.length} pin(s) missing:\n- ` + misses.join('\n- ')); process.exit(1); }
} else if (cmd === 'snap') {
  if (!a1 || !a2 || !a3) { console.error('Usage: node capture.mjs snap <htmlFile> <outFile> <width> [height]'); process.exit(2); }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +a3, height: +(a4 ?? 900) } });
  await page.goto(pathToFileURL(resolve(a1)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts?.ready);
  await page.screenshot({ path: a2, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await browser.close();
  console.log(`ok   ${a2}${overflow ? '  WARNING: the page scrolls sideways at this width' : ''}`);
} else if (cmd === 'crop') {
  if (!a1 || !a2 || !a3) { console.error('Usage: node capture.mjs crop <imageFile> <x,y,w,h> <outFile>'); process.exit(2); }
  const [x, y, w, h] = a2.split(',').map(Number);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve(a1)).href);
  const size = await page.evaluate(() => { const i = document.querySelector('img'); return { W: i.naturalWidth, H: i.naturalHeight }; });
  await page.setViewportSize({ width: size.W, height: Math.min(size.H, 16000) });
  await page.goto(pathToFileURL(resolve(a1)).href);
  await page.addStyleTag({ content: 'body{margin:0}img{display:block}' });
  const margin = 40, px = v => v / 100;
  const cx = Math.max(0, size.W * px(x) - margin), cy = Math.max(0, size.H * px(y) - margin);
  const clip = { x: cx, y: cy, width: Math.min(size.W - cx, size.W * px(w) + 2 * margin), height: Math.min(size.H - cy, size.H * px(h) + 2 * margin) };
  await page.screenshot({ path: a3, clip, fullPage: true, type: 'jpeg', quality: 82 });
  await browser.close();
  console.log(`ok   ${a3}`);
} else if (cmd === 'zoom') {
  if (!a1 || !a2 || !a3 || !a4) { console.error('Usage: node capture.mjs zoom <htmlFile> <outFile.jpg> <width> <selector | x,y,w,h> [pad]'); process.exit(2); }
  const pad = Number(process.argv[7] ?? 24);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +a3, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(resolve(a1)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts?.ready);
  let box;
  if (/^\d+(\.\d+)?(,\d+(\.\d+)?){3}$/.test(a4)) { const [x, y, width, height] = a4.split(',').map(Number); box = { x, y, width, height }; }
  else {
    const el = page.locator(a4).first();
    if (!(await el.count())) { await browser.close(); console.error(`no element matches "${a4}" in ${a1}`); process.exit(1); }
    await el.scrollIntoViewIfNeeded();
    box = await el.evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; });
  }
  const size = await page.evaluate(() => ({ W: document.documentElement.scrollWidth, H: document.documentElement.scrollHeight }));
  const x = Math.max(0, Math.floor(box.x - pad)), y = Math.max(0, Math.floor(box.y - pad));
  const clip = { x, y, width: Math.min(size.W - x, Math.ceil(box.width + 2 * pad)), height: Math.min(size.H - y, Math.ceil(box.height + 2 * pad)) };
  await page.screenshot({ path: a2, clip, fullPage: true, type: 'jpeg', quality: 85 });
  await browser.close();
  console.log(`ok   ${a2}  rect=${clip.x},${clip.y},${clip.width},${clip.height}  (pass this rect with pad 0 to cut the other options the same way)`);
} else {
  console.error('Usage: node capture.mjs login | shoot | pins | snap | crop | zoom  (see the header of this file)'); process.exit(2);
}
