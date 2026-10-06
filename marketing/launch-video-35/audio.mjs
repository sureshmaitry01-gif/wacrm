// Fast 150 BPM synthesized score + SFX. Writes out/mix-raw.wav and beats.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DURATION, BEAT, SFX } from './timeline.js';
import { mulberry32 } from './lib/motion.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SR = 48000, N = Math.round(DURATION * SR), TAU = Math.PI * 2;
const bus = () => [new Float32Array(N), new Float32Array(N)];
const DR = bus(), MU = bus(), FX = bus();
const rnd = mulberry32(150);
const noise = () => rnd() * 2 - 1;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const BAR = BEAT * 4, S16 = BEAT / 4;

function add(b, at, dur, fn, gain = 1, pan = 0) {
  const s0 = Math.max(0, Math.round(at * SR)), s1 = Math.min(N, Math.round((at + dur) * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = s0; i < s1; i++) { const v = fn(i / SR - at); b[0][i] += v * gl; b[1][i] += v * gr; }
}

// ---- sections ----
const DROP = 4.8, BREAKS = [[14.8, 15.6], [23.6, 24.4]], OUTRO = 32.8;
const inBreak = (t) => BREAKS.some(([a, b]) => t >= a && t < b);
const kicks = [];

// ---- drums ----
function kick(at, g = 1) {
  kicks.push(at);
  add(DR, at, 0.4, (t) => Math.sin(TAU * (48 * t + (110 / 30) * (1 - Math.exp(-t * 30)))) * Math.exp(-t * 8) * Math.min(1, t / 0.0015)
    + 0.3 * noise() * Math.exp(-t * 300), 0.95 * g);
}
function hatC(at, g = 1, pan = 0.25) { let p = 0; add(DR, at, 0.05, (t) => { const n = noise(), v = n - p; p = n; return v * Math.exp(-t * 90); }, 0.07 * g, pan); }
function hatO(at, g = 1) { let p = 0; add(DR, at, 0.22, (t) => { const n = noise(), v = n - p; p = n; return v * Math.exp(-t * 16); }, 0.06 * g, -0.2); }
function clap(at, g = 1) {
  let lp = 0;
  add(DR, at, 0.3, (t) => { const n = noise(); lp += 0.4 * (n - lp); const burst = t < 0.03 ? 0.55 + 0.45 * Math.cos(t * 700) : 1; return (n - lp) * Math.exp(-t * 14) * burst; }, 0.26 * g);
}
function snare(at, g = 1) {
  let lp = 0;
  add(DR, at, 0.16, (t) => { const n = noise(); lp += 0.5 * (n - lp); return ((n - lp) * 0.8 + 0.5 * Math.sin(TAU * 190 * t)) * Math.exp(-t * 22); }, 0.18 * g);
}

// ---- synths ----
function saw(f, t, nh, fc) {
  let v = 0;
  for (let n = 1; n <= nh; n++) { const fn = f * n; if (fn > 16000) break; v += Math.sin(TAU * fn * t) / n / (1 + Math.pow(fn / fc, 2)); }
  return v;
}
function stab(at, notes, dur, g, fc) {
  notes.forEach((m, i) => [0.996, 1.004].forEach((d, j) => {
    const f = hz(m) * d;
    add(MU, at, dur + 0.08, (t) => saw(f, t, 10, fc) * Math.min(1, t / 0.004) * Math.exp(-t * 5) * (t > dur ? Math.exp(-(t - dur) * 40) : 1), (0.05 * g) / Math.sqrt(notes.length), j ? 0.5 : -0.5);
  }));
}
function pad(at, dur, notes, g, fc) {
  notes.forEach((m) => [0.995, 1.005].forEach((d, j) => {
    const f = hz(m) * d;
    add(MU, at, dur + 0.3, (t) => saw(f, t, 6, fc) * Math.min(1, t / 0.12) * (t > dur ? Math.exp(-(t - dur) * 10) : 1), (0.022 * g) / Math.sqrt(notes.length), j ? 0.6 : -0.6);
  }));
}
function bass(at, dur, m, g = 1) {
  const f = hz(m);
  add(MU, at, dur, (t) => Math.tanh(2.2 * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t))) * Math.min(1, t / 0.004) * Math.min(1, (dur - t) / 0.01), 0.17 * g);
}
function pluck(at, m, g = 1, pan = 0) {
  const f = hz(m);
  add(MU, at, 0.25, (t) => saw(f, t, 8, 2400 + 6000 * Math.exp(-t * 30)) * Math.exp(-t * 14) * Math.min(1, t / 0.002), 0.07 * g, pan);
}
function bell(b, at, m, g = 1, pan = 0, decay = 3) {
  const f = hz(m);
  add(b, at, 1.8, (t) => Math.min(1, t / 0.002) * (Math.sin(TAU * f * t) * Math.exp(-t * decay) + 0.4 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * decay * 2.2) + 0.15 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * decay * 4)), 0.14 * g, pan);
}

// ---- arrangement: Am | F | C | G, one chord per bar ----
const PROG = [
  { root: 33, ch: [57, 60, 64, 67], arp: [69, 72, 76, 79] },
  { root: 29, ch: [57, 60, 65, 69], arp: [65, 69, 72, 77] },
  { root: 36, ch: [55, 60, 64, 67], arp: [67, 72, 76, 79] },
  { root: 31, ch: [55, 59, 62, 67], arp: [67, 71, 74, 79] },
];
const nBars = Math.ceil(DURATION / BAR);
for (let b = 0; b < nBars; b++) {
  const t0 = b * BAR, P = PROG[b % 4];
  const intro = t0 < DROP, outro = t0 >= OUTRO - 0.01;
  for (let s = 0; s < 16; s++) {
    const t = t0 + s * S16;
    if (t >= DURATION) break;
    const brk = inBreak(t), beat = s % 4 === 0, off = s % 4 === 2;
    if (outro) {
      if (t < OUTRO + 0.01 && beat) kick(t, 1.1);
      if (s % 2 === 0 && t < DURATION - 0.6) hatC(t, 0.5);
      continue;
    }
    // drums
    if (beat && !brk) kick(t, intro ? 0.75 : 1);
    if (!brk && !intro && (s === 4 || s === 12)) clap(t);
    if (intro && t >= 1.6 && (s === 4 || s === 12)) clap(t, 0.6);
    if (off && !intro && !brk) hatO(t);
    hatC(t, (s % 2 ? 0.55 : 1) * (intro ? 0.7 : 1), s % 2 ? 0.3 : -0.1);
    // music
    if (!intro && !brk) {
      // rolling offbeat bass (sidechained below)
      if (s % 2 === 1 || off) bass(t, S16 * 0.9, P.root + 12 + (s === 14 ? 7 : 0));
      // chord stabs on a syncopated pattern
      if ([0, 3, 6, 10, 12].includes(s)) stab(t, P.ch, S16 * 1.6, 1, 4200);
      // 16th arpeggio lead
      pluck(t, P.arp[s % 4] + (s >= 8 ? 12 : 0), 0.8, s % 2 ? 0.4 : -0.4);
    }
    if (intro && s % 2 === 0) pluck(t, P.arp[(s / 2) % 4], 0.6, s % 4 ? 0.3 : -0.3);
  }
  if (!outro) pad(t0, BAR, P.ch, intro ? 0.9 : 1, intro ? 900 + 2500 * (t0 / DROP) : 2600);
}
// builds: snare rolls into the drop and the final hit
for (const [a, b] of [[3.2, DROP], [31.2, OUTRO]]) {
  for (let t = a, k = 0; t < b - 0.01; k++) {
    const p = (t - a) / (b - a);
    snare(t, 0.35 + 0.8 * p);
    t += p < 0.5 ? S16 * 2 : p < 0.85 ? S16 : S16 / 2;
  }
}
for (const [a] of BREAKS) pad(a, 0.8, [69, 72, 76, 79], 1.1, 3000);
// outro chord ring
pad(OUTRO, 1.9, [45, 57, 64, 69, 72, 76], 1.6, 2400);
stab(OUTRO, [57, 64, 69, 72, 76], 0.5, 1.4, 5000);

// ---- SFX ----
function click(at, g = 1, tone = 2200) { add(FX, at, 0.03, (t) => (noise() * 0.25 + Math.sin(TAU * tone * t)) * Math.exp(-t * 220), 0.12 * g); }
function blip(at, f0, f1, dur, g, pan = 0) { add(FX, at, dur, (t) => Math.sin(TAU * (f0 + (f1 - f0) * Math.min(1, t / dur)) * t) * Math.min(1, t / 0.002) * Math.exp(-t * (6 / dur)), g, pan); }
function noiseSweep(at, dur, g, rise) {
  let lp = 0;
  add(FX, at, dur, (t) => { const k = t / dur; const c = rise ? 0.01 + 0.3 * k * k : 0.25 * (1 - k) + 0.02; lp += c * (noise() - lp); return lp * (rise ? k * k : Math.pow(1 - k, 2)) * 3; }, g);
}
SFX.forEach((e) => {
  switch (e.type) {
    case 'cut':
      noiseSweep(e.at - 0.02, e.big ? 0.5 : 0.22, e.big ? 0.22 : 0.09, false);
      if (e.big) add(FX, e.at, 1.2, (t) => Math.sin(TAU * (42 * t + 3 * (1 - Math.exp(-t * 20)))) * Math.exp(-t * 3), 0.5);
      break;
    case 'riser': noiseSweep(e.at, e.dur, 0.16, true); break;
    case 'swish': noiseSweep(e.at - 0.03, 0.25, 0.08, false); break;
    case 'brand': [76, 81, 84, 88].forEach((m, i) => bell(FX, e.at + i * 0.015, m, e.final ? 0.6 : 0.45, i % 2 ? 0.4 : -0.4, 1.8)); break;
    case 'tick': click(e.at, 0.5, 3200); break;
    case 'tap': click(e.at, 1.1, 1800); blip(e.at, 420, 300, 0.05, 0.08); break;
    case 'pop': blip(e.at, hz(79), hz(84), 0.09, 0.13, -0.2); break;
    case 'send': blip(e.at, 700, 1150, 0.12, 0.12, 0.2); break;
    case 'type': for (let k = 0; k < e.n; k++) click(e.at + (k / e.n) * e.dur + rnd() * 0.01, 0.35 + rnd() * 0.2, 2600 + rnd() * 900); break;
    case 'chime': bell(FX, e.at, 88, 0.9, -0.2, 2.2); bell(FX, e.at + 0.09, 95, 0.75, 0.2, 2.2); break;
    case 'ding': bell(FX, e.at, 84, 0.6, 0, 3); break;
    case 'step': bell(FX, e.at, [79, 83, 86, 91][e.i], 0.55, [-0.3, -0.1, 0.1, 0.3][e.i], 4); break;
    case 'notify': bell(FX, e.at, 86, 0.5, 0.3, 5); bell(FX, e.at + 0.08, 91, 0.45, 0.3, 5); break;
  }
});

// ---- mix: sidechain music to the kick, sum, fade tail ----
kicks.sort((a, b) => a - b);
let ki = 0;
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  while (ki + 1 < kicks.length && kicks[ki + 1] <= t) ki++;
  const dt = kicks.length && kicks[ki] <= t ? t - kicks[ki] : 9;
  const sc = 1 - 0.65 * Math.exp(-dt / 0.07);
  L[i] = DR[0][i] + MU[0][i] * sc + FX[0][i];
  R[i] = DR[1][i] + MU[1][i] * sc + FX[1][i];
}
for (let i = N - Math.round(0.4 * SR); i < N; i++) { const k = (N - i) / (0.4 * SR); L[i] *= k; R[i] *= k; }

const out = path.join(ROOT, 'out');
fs.mkdirSync(out, { recursive: true });
const data = Buffer.alloc(N * 8);
for (let i = 0; i < N; i++) { data.writeFloatLE(L[i], i * 8); data.writeFloatLE(R[i], i * 8 + 4); }
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
fs.writeFileSync(path.join(out, 'mix-raw.wav'), Buffer.concat([h, data]));
const beats = [];
for (let b = 0; b * BEAT < DURATION; b++) beats.push(+(b * BEAT).toFixed(3));
fs.writeFileSync(path.join(ROOT, 'beats.json'), JSON.stringify({ bpm: 150, beats }) + '\n');
console.log('audio -> out/mix-raw.wav');
