// Closed-form springs. Every value is a pure function of time.
// spring(t) goes 0 -> 1 starting at t = 0 (returns 0 for t <= 0).

export const PRESETS = {
  snappy: { f: 3.2, z: 0.84 }, // buttons, toggles, leading edges (~1% overshoot)
  default: { f: 2.2, z: 0.8 }, // cards, containers, camera (~1.5% overshoot)
  heavy: { f: 1.8, z: 1.0 }, // big type, logo lockups (no overshoot)
  playful: { f: 2.4, z: 0.45 }, // visible overshoot, mascots only
};

export function spring(t, preset = 'default') {
  if (t <= 0) return 0;
  const { f, z } = typeof preset === 'string' ? PRESETS[preset] : preset;
  const w = 2 * Math.PI * f;
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w * t) * (1 + w * t);
}

// One spring from `from` to `to` that starts at time `at`.
export function go(t, at, from, to, preset = 'default') {
  return from + (to - from) * spring(t - at, preset);
}

// A value with several targets. Each change gets its own spring starting at
// its own time; springs superpose, so nothing is ever restarted.
// changes: [{ at, to, p }]
export function track(t, initial, changes) {
  let v = initial;
  let prev = initial;
  for (const c of changes) {
    v += (c.to - prev) * spring(t - c.at, c.p || 'default');
    prev = c.to;
  }
  return v;
}

// Alpha for content living inside a morphing box: enters shortly after the
// morph starts, leaves shortly before the next morph.
export function swapAlpha(t, inAt, outAt = Infinity, lead = 0.1) {
  const a = spring(t - (inAt + lead), 'snappy');
  const b = outAt === Infinity ? 0 : spring(t - (outAt - lead - 0.12), 'snappy');
  return clamp(a - b, 0, 1);
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

// Seeded noise. Never Math.random.
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
