// Render the film: node render.mjs [--fps 60] [--out out/payperdm-launch.mp4]
//                  node render.mjs --sheet          (one frame per beat -> out/sheet.png)
//                  node render.mjs --still 9.5      (single frame -> out/still.png)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const { FPS, DURATION, BEAT, W, H } = await import('./timeline.js');
const fps = +arg('--fps', FPS);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none', '--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('PAGE ERROR', e); process.exit(1); });
await page.goto(url);
await page.evaluate(() => window.ready);

async function frame(t) {
  await page.evaluate((t) => window.seek(t), t);
  return page.screenshot({ type: 'png', animations: 'disabled', caret: 'initial' });
}

function run(cmd, a, input) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error(cmd + ' exited ' + c))));
    if (input) input(p.stdin);
  });
}

if (args.includes('--still')) {
  const t = +arg('--still', 0);
  fs.writeFileSync(path.join(OUT, `still-${t}.png`), await frame(t));
} else if (args.includes('--sheet')) {
  // One frame per beat (offset slightly so we see the state, not frame 0 of a spring).
  const dir = path.join(OUT, 'sheet');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir);
  const off = +arg('--offset', 0.25);
  const n = Math.round(DURATION / BEAT);
  for (let i = 0; i < n; i++) {
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.png`), await frame(i * BEAT + off));
  }
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(dir, 'f%03d.png'),
    '-vf', "scale=384:216,drawtext=text='%{n}':x=8:y=8:fontsize=20:fontcolor=red,tile=8x11:padding=6:color=white", '-frames:v', '1', path.join(OUT, 'sheet.png')]);
  console.log('sheet ->', path.join(OUT, 'sheet.png'));
} else {
  const out = arg('--out', path.join(OUT, 'video-only.mp4'));
  const total = Math.round(DURATION * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const buf = await frame(i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('exit', r));
  console.log('video ->', out);
}
await browser.close();
server.close();
