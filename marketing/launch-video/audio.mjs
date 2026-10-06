// Synthesized score + SFX, all placed from timeline.js. Writes out/mix-raw.wav and beats.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DURATION, BEAT, SFX } from './timeline.js';
import { mulberry32 } from './lib/motion.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SR = 48000;
const N = Math.round(DURATION * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const rnd = mulberry32(1042);
const TAU = Math.PI * 2;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// add a mono voice with pan (-1..1)
function add(at, dur, fn, gain = 1, pan = 0) {
  const s0 = Math.max(0, Math.round(at * SR)), s1 = Math.min(N, Math.round((at + dur) * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = s0; i < s1; i++) {
    const v = fn((i - at * SR) / SR);
    L[i] += v * gl; R[i] += v * gr;
  }
}
const noise = () => rnd() * 2 - 1;

// ---------- instruments ----------
const kick = (at, g = 1) => add(at, 0.45, (t) => {
  const f = 45 + 95 * Math.exp(-t * 28);
  return Math.sin(TAU * (45 * t + (95 / 28) * (1 - Math.exp(-t * 28)))) * Math.exp(-t * 7) * (t < 0.002 ? t / 0.002 : 1) + 0 * f;
}, 0.9 * g);
function hat(at, g = 1, pan = 0.2) {
  let prev = 0;
  add(at, 0.06, (t) => { const n = noise(); const v = n - prev; prev = n; return v * Math.exp(-t * 70); }, 0.09 * g, pan);
}
function clap(at, g = 1) {
  let lp = 0;
  add(at, 0.25, (t) => {
    const n = noise(); lp += 0.35 * (n - lp);
    const env = Math.exp(-t * 18) * (t < 0.03 ? 0.6 + 0.4 * Math.sin(t * 600) : 1);
    return (n - lp) * env;
  }, 0.22 * g);
}
function pluck(at, m, g = 1, pan = 0) {
  const f = hz(m);
  add(at, 0.6, (t) => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 12) + 0.12 * Math.sin(TAU * 3 * f * t) * Math.exp(-t * 20)) * Math.exp(-t * 7) * Math.min(1, t / 0.004), 0.09 * g, pan);
}
function pad(at, dur, notes, g = 1) {
  notes.forEach((m, k) => {
    const f = hz(m);
    const det = [0.997, 1.003];
    det.forEach((d, j) => add(at, dur + 0.6, (t) => {
      const env = Math.min(1, t / 0.35) * (t > dur ? Math.exp(-(t - dur) * 6) : 1);
      const ph = TAU * f * d * t;
      return (Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph)) * env;
    }, (0.028 * g) / notes.length * 3, j ? 0.45 : -0.45));
  });
}
function bass(at, dur, m, g = 1) {
  const f = hz(m);
  add(at, dur, (t) => {
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 2.2) * (t > dur - 0.05 ? Math.max(0, (dur - t) / 0.05) : 1);
    return Math.tanh(1.6 * Math.sin(TAU * f * t)) * env;
  }, 0.16 * g);
}
function bell(at, m, g = 1, pan = 0, decay = 3) {
  const f = hz(m);
  add(at, 2.2, (t) => {
    const a = Math.min(1, t / 0.002);
    return a * (Math.sin(TAU * f * t) * Math.exp(-t * decay) + 0.4 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * decay * 2.2) + 0.18 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * decay * 4));
  }, 0.16 * g, pan);
}

// ---------- score: 120 BPM, 10 bars of 2 s ----------
// chords as MIDI notes; roots for bass
const BARS = [
  { pad: [57, 64, 67, 71], root: 45, arp: [69, 72, 76, 79] }, // Am9
  { pad: [53, 60, 64, 69], root: 41, arp: [65, 69, 72, 76] }, // Fmaj7
  { pad: [57, 64, 67, 71], root: 45, arp: [69, 72, 76, 79] }, // Am9
  { pad: [60, 64, 67, 71, 74], root: 48, arp: [72, 76, 79, 83] }, // Cmaj9 (lift at 6 s)
  { pad: [55, 62, 64, 71], root: 43, arp: [71, 74, 76, 79] }, // G6
  { pad: [57, 60, 64, 67], root: 45, arp: [69, 72, 76, 79] }, // Am7
  { pad: [53, 57, 60, 64, 67], root: 41, arp: [69, 72, 76, 79] }, // Fmaj9
  { pad: [60, 64, 67, 71, 74], root: 48, arp: [72, 76, 79, 83] }, // Cmaj9
  { pad: [55, 62, 65, 67], root: 43, arp: [71, 74, 77, 79] }, // G7sus-ish
  { pad: [53, 57, 60, 64, 67], root: 41, arp: [72, 76, 79, 84] }, // Fmaj9 -> end
];
const beats = [];
for (let b = 0; b < DURATION / BEAT; b++) beats.push(+(b * BEAT).toFixed(3));

BARS.forEach((bar, i) => {
  const t0 = i * 2;
  const intro = i < 3, last = i === 9;
  pad(t0, 2, bar.pad, intro ? 0.8 : 1);
  // arpeggio on 8ths
  for (let k = 0; k < 8; k++) {
    if (last && k > 1) break;
    const m = bar.arp[k % 4] + (k >= 4 && !intro ? 12 : 0) * 0;
    pluck(t0 + k * BEAT / 2, m, intro ? 0.75 : 1, k % 2 ? 0.35 : -0.35);
  }
  // drums
  for (let k = 0; k < 4; k++) {
    const t = t0 + k * BEAT;
    if (last && k > 0) break;
    if (intro) { if (k % 2 === 0) kick(t, 0.7); }
    else kick(t);
    if (!intro && (k === 1 || k === 3) && i >= 4) clap(t, 0.8);
    hat(t + BEAT / 2, intro ? 0.7 : 1);
    if (!intro) hat(t + BEAT / 4, 0.45, -0.25);
  }
  // bass
  if (!intro) {
    if (last) bass(t0, 1.9, bar.root);
    else for (let k = 0; k < 4; k++) bass(t0 + k * BEAT, BEAT * 0.9, bar.root + (k === 3 ? 7 : 0), 0.9);
  } else bass(t0, 1.9, bar.root, 0.7);
});
// final chord ring-out
pad(18, 1.4, [48, 55, 60, 64, 67, 71, 74], 1.2);

// ---------- SFX ----------
function blip(at, f0, f1, dur, g, pan = 0) {
  add(at, dur, (t) => {
    const f = f0 + (f1 - f0) * Math.min(1, t / dur);
    return Math.sin(TAU * f * t) * Math.min(1, t / 0.002) * Math.exp(-t * (6 / dur));
  }, g, pan);
}
function click(at, g = 1, tone = 2200) {
  add(at, 0.03, (t) => (noise() * 0.25 + Math.sin(TAU * tone * t)) * Math.exp(-t * 220), 0.12 * g);
}
function whoosh(at, dur, g, rise = false) {
  let lp = 0;
  add(at, dur, (t) => {
    const k = t / dur;
    const env = rise ? Math.pow(k, 2.2) : Math.sin(Math.PI * Math.min(1, k * 1.4)) * (1 - k);
    const c = rise ? 0.02 + 0.25 * k : 0.03 + 0.22 * Math.sin(Math.PI * k);
    lp += c * (noise() - lp);
    return lp * env * 3;
  }, g, 0);
}
const POP_NOTES = [76, 79, 81, 84, 79, 83, 86, 81, 84, 88, 83, 86];
SFX.forEach((e) => {
  switch (e.type) {
    case 'pop': {
      const m = e.pitch != null ? POP_NOTES[e.pitch % POP_NOTES.length] : 79;
      blip(e.at, hz(m), hz(m) * 1.25, 0.09, 0.13, (e.pitch ?? 0) % 2 ? 0.3 : -0.3);
      click(e.at, 0.4, 3000);
      break;
    }
    case 'send': blip(e.at, 700, 1150, 0.12, 0.12, 0.2); break;
    case 'riser': whoosh(e.at - 0.85, 1.0, 0.16, true); break;
    case 'whoosh': whoosh(e.at - 0.05, e.soft ? 0.4 : 0.55, e.soft ? 0.1 : 0.2); break;
    case 'brand':
      add(e.at, 1.6, (t) => Math.sin(TAU * (50 * t + (60 / 18) * (1 - Math.exp(-t * 18)))) * Math.exp(-t * (e.final ? 2.4 : 3.5)), e.final ? 0.7 : 0.55);
      [72, 79, 84, 88].forEach((m, i) => bell(e.at + i * 0.012, m, e.final ? 0.55 : 0.4, i % 2 ? 0.4 : -0.4, 1.6));
      break;
    case 'tap': click(e.at, 1.1, 1800); blip(e.at, 420, 300, 0.05, 0.08); break;
    case 'type':
      for (let k = 0; k < e.n; k++) { const tt = e.at + (k / e.n) * e.dur + rnd() * 0.012; click(tt, 0.35 + rnd() * 0.2, 2600 + rnd() * 900); }
      break;
    case 'chime': bell(e.at, 88, 0.9, -0.2, 2.2); bell(e.at + 0.09, 95, 0.75, 0.2, 2.2); break;
    case 'ding': bell(e.at, 84, 0.7, 0, 3); break;
    case 'tick': click(e.at, 0.8, 1200); bell(e.at, 79, 0.35, 0, 6); break;
    case 'step': bell(e.at, [79, 81, 84, 88][e.i], 0.6, [-0.3, -0.1, 0.1, 0.3][e.i], 4); click(e.at, 0.6, 1400); break;
  }
});

// gentle fade on the last 0.25 s so the loop point is clean
for (let i = N - Math.round(0.25 * SR); i < N; i++) { const k = (N - i) / (0.25 * SR); L[i] *= k; R[i] *= k; }

// ---------- write float WAV ----------
const out = path.join(ROOT, 'out');
fs.mkdirSync(out, { recursive: true });
const data = Buffer.alloc(N * 8);
for (let i = 0; i < N; i++) { data.writeFloatLE(L[i], i * 8); data.writeFloatLE(R[i], i * 8 + 4); }
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
fs.writeFileSync(path.join(out, 'mix-raw.wav'), Buffer.concat([h, data]));
fs.writeFileSync(path.join(ROOT, 'beats.json'), JSON.stringify({ bpm: 120, beats }, null, 0) + '\n');
console.log('audio -> out/mix-raw.wav');
