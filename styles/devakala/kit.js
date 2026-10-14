// =====================================================================
//  styles/devakala/kit.js — Kerala mural / classical Indian mythological style
//  Palette measured from 5 reference images (references/devakala/1-5.jpg):
//    ref 1: bold modern Kerala-inspired (navy, red lotus, large reclining Vishnu)
//    ref 2: true Kerala mural (warm parchment, scrollwork, blue Krishna, teardrop border)
//    ref 3: Indian miniature (cream ground, Lakshmi with elephant, pink lotus)
//    ref 4: modern illustration (dark teal, Vishnu with Shesha, gold ornaments)
//    ref 5: Kerala/Rajput (ochre ground, reclining dark Vishnu, gold, curved lotus stem)
//  No sharp edges: all shapes use ellipses or smooth petal curves. Flat fills, bold
//  warm outlines, lotus motifs, gold halos, Kerala spiral foliage, teardrop borders.
//  On 2s. Built on kit/core.js. Needs HAND, CX from the piece head.
// =====================================================================
const DK = {
  ink:       '#1A0800',   // warm near-black outlines
  parchment: '#F5CB6B',   // warm gold parchment (ref 2)
  parchL:    '#FCE8B0',   // light parchment
  parchD:    '#C49040',   // deep ochre
  cosmic:    '#0D1E30',   // deep navy night (ref 1)
  teal:      '#0C3240',   // forest teal (ref 4)

  gold:      '#D4943A',   // ornament gold
  goldL:     '#F0B840',   // highlight gold
  goldD:     '#8B5A10',   // shadow gold

  blue:      '#4A80B8',   // divine skin (Krishna, Vishnu — refs 2, 4)
  blueD:     '#2A5080',   // deep divine blue

  ivory:     '#F0E5C8',   // ivory / light figures
  ivoryD:    '#D4C8A0',   // warm ivory shadow

  red:       '#C03020',   // vermillion (lotus, cosmic — ref 1)
  redL:      '#E05030',   // bright vermillion
  redD:      '#8A1810',   // deep red (back petals)

  lotus:     '#E890A0',   // pink lotus (ref 3)
  lotusD:    '#C05070',   // deep pink lotus

  green:     '#2A5C28',   // lotus stem / foliage
  greenL:    '#4A8040',   // light foliage

  saffron:   '#E07030',   // saffron garment
  saffronL:  '#F09040',   // bright saffron

  paper:     '#E8C070',   // morph paper
};

// =====================================================================
//  Core shape: flat-fill, bold outline, gentle boil on 2s
// =====================================================================
function dkShape(P, c, o = {}) {
  const key = o.key ?? 'dks';
  const Q = o.raw ? P : wobble(P, true, o.amt ?? 0.4, key, 7);
  ctx.save();
  trace(Q, true);
  ctx.fillStyle = c;
  ctx.fill();
  if (o.line !== false) {
    ctx.lineWidth = o.w ?? 3;
    ctx.strokeStyle = typeof o.line === 'string' ? o.line : DK.ink;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

// =====================================================================
//  Smooth lotus petal points — no sharp corners.
//  tipX, tipY: petal tip  |  baseX, baseY: petal base (lotus center)
//  pw: half-width at the widest point  |  n: point count
// =====================================================================
function petalPts(tipX, tipY, baseX, baseY, pw, n) {
  n = n || 24;
  const dx = tipX - baseX, dy = tipY - baseY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;   // along axis (base→tip)
  const nx = -uy, ny = ux;              // left normal
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let along, across;
    if (t < 0.5) {
      const u = t * 2;      // 0→1: base to tip, LEFT side
      along = u;
      across = -pw * Math.sin(Math.PI * u);
    } else {
      const u = (t - 0.5) * 2;  // 0→1: tip to base, RIGHT side
      along = 1 - u;
      across = pw * Math.sin(Math.PI * (1 - u));
    }
    pts.push([
      baseX + ux * len * along + nx * across,
      baseY + uy * len * along + ny * across,
    ]);
  }
  return pts;
}

// =====================================================================
//  Lotus — the style's signature motif (redesigned with petalPts)
//  Petals radiate from (x,y); r = tip-radius; open: 0=bud, 1=bloom
// =====================================================================
function dkLotus(x, y, r, o = {}) {
  const key  = o.key  ?? 'lot';
  const n    = o.n    ?? 8;
  const c    = o.c    ?? DK.lotus;
  const ci   = o.ci  ?? DK.lotusD;
  const open = clamp(o.open ?? 1);

  if (open < 0.08) {
    // Closed bud: one upright petal cluster
    dkShape(petalPts(x, y - r * 0.55, x, y + r * 0.1, r * 0.18, 20), c, { key: key + 'bud', w: 3, amt: 0.25 });
    dkShape(ellipsePts(x, y + r * 0.22, r * 0.2, r * 0.14, 0, 18), DK.green, { key: key + 'sep', w: 2 });
    return;
  }

  const pw = r * 0.56;

  // Back layer (offset half-step, slightly shorter, darker)
  for (let i = 0; i < n; i++) {
    const a = (i / n + 0.5 / n) * TAU;
    const cr = r * (0.8 + 0.2 * open);
    const pts = petalPts(x + Math.cos(a) * cr, y + Math.sin(a) * cr, x, y, pw * 0.85, 22);
    dkShape(pts, ci, { key: key + 'bk' + i, amt: 0.22, w: 3.5 });
  }

  // Front layer
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const cr = r * (0.85 + 0.15 * open);
    const pts = petalPts(x + Math.cos(a) * cr, y + Math.sin(a) * cr, x, y, pw, 22);
    dkShape(pts, c, { key: key + 'ft' + i, amt: 0.25, w: 3.5 });
    // Inner vein highlight
    const veinTipX = x + Math.cos(a) * cr * 0.7;
    const veinTipY = y + Math.sin(a) * cr * 0.7;
    const veinPts = petalPts(veinTipX, veinTipY, x + Math.cos(a) * cr * 0.1, y + Math.sin(a) * cr * 0.1, pw * 0.28, 14);
    dkShape(veinPts, ci, { key: key + 've' + i, amt: 0.18, w: 0, line: false });
  }

  // Sepal ring (green calyx)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    dkShape(ellipsePts(x + Math.cos(a) * r * 0.14, y + Math.sin(a) * r * 0.14, r * 0.09, r * 0.18, a, 14),
      DK.green, { key: key + 'sp' + i, amt: 0.22, w: 2 });
  }

  // Gold centre disc
  dkShape(ellipsePts(x, y, r * 0.2, r * 0.2, 0, 28), DK.goldL, { key: key + 'ctr', w: 2.5, line: DK.goldD, amt: 0.12 });
  // Stamen dots
  const Rs = RNG('lot', key);
  ctx.fillStyle = DK.goldD;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, dr = r * Rs.r(0.04, 0.12);
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * dr, y + Math.sin(a) * dr, 3.5, 0, TAU); ctx.fill();
  }
}

// =====================================================================
//  Halo — circular gold mandala
// =====================================================================
function dkHalo(x, y, r, key) {
  key = key ?? 'halo';
  dkShape(ellipsePts(x, y, r, r, 0, 56), DK.gold, { key: key + 'o', amt: 0.15, w: 6, line: DK.goldD });
  dkShape(ellipsePts(x, y, r * 0.84, r * 0.84, 0, 56), DK.goldL, { key: key + 'i', amt: 0.08, line: false });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    ctx.fillStyle = i % 3 === 0 ? DK.goldD : DK.gold;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92,
      i % 3 === 0 ? 5.5 : 3.5, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = DK.goldD; ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.22, y + Math.sin(a) * r * 0.22);
    ctx.lineTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
    ctx.stroke();
  }
}

// =====================================================================
//  Kerala spiral coil — smooth logarithmic spiral (no sharp corners)
// =====================================================================
function dkCoil(x, y, r, key) {
  key = key ?? 'coil';
  const P = [], nPts = 70, turns = 2.5;
  for (let i = 0; i <= nPts; i++) {
    const t = i / nPts, a = t * TAU * turns - Math.PI / 2;
    const rad = r * (0.05 + 0.95 * t);
    P.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]);
  }
  ink(P, { w: Math.max(3.5, r * 0.08), color: DK.green, key, amt: 0.45 });
  // Leaf at outer end
  dkShape(petalPts(x + r * 0.1, y - r * 0.95, x, y - r * 0.52, r * 0.22, 16),
    DK.greenL, { key: key + 'lf', w: 2.5, amt: 0.35 });
}

// =====================================================================
//  Scroll cloud — three rounded lobes (Kerala style, no sharp edges)
// =====================================================================
function dkCloud(x, y, s, key) {
  key = key ?? 'cld';
  // Main body
  dkShape(ellipsePts(x, y, s * 0.85, s * 0.38, 0, 32), DK.ivory, { key: key + 'b', amt: 0.35, w: 2.5 });
  // Left lobe
  dkShape(ellipsePts(x - s * 0.65, y + s * 0.08, s * 0.34, s * 0.26, -0.25, 26), DK.ivory, { key: key + 'l', amt: 0.30, w: 2.5 });
  // Right lobe
  dkShape(ellipsePts(x + s * 0.65, y + s * 0.08, s * 0.34, s * 0.26, 0.25, 26), DK.ivory, { key: key + 'r', amt: 0.30, w: 2.5 });
  // Top small bump
  dkShape(ellipsePts(x, y - s * 0.22, s * 0.42, s * 0.24, 0, 22), DK.ivory, { key: key + 't', amt: 0.28, w: 2 });
}

// =====================================================================
//  Teardrop border strip — top/bottom decorative band (ref 2)
// =====================================================================
function dkBorder(y0, h, c1, c2, key) {
  key = key ?? 'bdr';
  dkShape(rrectPts(-20, y0, W + 40, h, 0), c1, { key: key + 'bg', raw: true, line: false });
  const n = Math.floor(W / (h * 0.82)) + 1, gap = W / n;
  for (let i = 0; i < n; i++) {
    const cx = i * gap + gap / 2, cy = y0 + h / 2;
    const rx = gap * 0.30, ry = h * 0.42;
    const P = [];
    for (let j = 0; j <= 30; j++) {
      const t = j / 30, a = t * TAU - Math.PI / 2;
      const taper = t < 0.5 ? 1 - t * 0.45 : 1;
      P.push([cx + Math.cos(a) * rx * taper, cy + Math.sin(a) * ry]);
    }
    dkShape(P, c2, { key: key + 't' + i, amt: 0.18, w: 1.8 });
  }
}

// =====================================================================
//  Caption + year tag (drawn after camera via DEFER)
// =====================================================================
function dkCaption(str) {
  const f = () => {
    const size = 52;
    ctx.save(); ctx.font = `500 ${size}px ${HAND}`;
    const tw = ctx.measureText(str).width;
    ctx.restore();
    const pad = 28, bw = tw + pad * 2, bh = size * 1.5;
    const x0 = CX - bw / 2, y0 = H - SAFE.bottom - 90;
    dkShape(rrectPts(x0, y0, bw, bh, 10), DK.parchL, { key: 'cap' + str, raw: true, w: 2.5, line: DK.goldD });
    ctx.save(); ctx.font = `500 ${size}px ${HAND}`; ctx.fillStyle = DK.ink;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fr = ev(E0 + 0.4, 0.5);
    if (fr < 1) { ctx.beginPath(); ctx.rect(x0, y0, bw * fr, bh); ctx.clip(); }
    ctx.fillText(str, CX, y0 + bh / 2);
    ctx.restore();
  };
  if (DEFER) DEFER.push(f); else f();
}

function dkYearTag(str) {
  const f = () => {
    const size = 68;
    ctx.save(); ctx.font = `600 ${size}px ${HAND}`;
    const tw = ctx.measureText(str).width;
    ctx.restore();
    const pad = 24, bw = tw + pad * 2 + 60, bh = size * 1.45;
    const x0 = 56, y0 = SAFE.top + 56;
    dkShape(rrectPts(x0, y0, bw, bh, 10), DK.parchL, { key: 'yt' + str, raw: true, w: 3, line: DK.gold });
    dkLotus(x0 + bw + 34, y0 + bh / 2, 22, { key: 'ytl' + str, n: 5, open: popS(E0 + 0.1), c: DK.red, ci: DK.redL });
    ctx.save(); ctx.font = `600 ${size}px ${HAND}`; ctx.fillStyle = DK.ink;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(str, x0 + pad, y0 + bh / 2);
    ctx.restore();
  };
  if (DEFER) DEFER.push(f); else f();
}

// =====================================================================
//  Hero — blooming lotus with gentle idle bob; sets SPARK_AT
// =====================================================================
function dkHero(x, y, r, o) {
  o = o ?? {};
  y += Math.sin(TT * TAU * 0.7 + ((o.key ?? 'h').length)) * r * 0.05;
  SPARK_AT = toScreen(x, y);
  if (o.stem !== false) {
    const P = [[x, y + r * 0.9], [x - r * 0.12, y + r * 1.55], [x + r * 0.06, y + r * 2.3]];
    ink(P, { w: Math.max(4, r * 0.09), color: DK.green, key: (o.key ?? 'h') + 'st' });
  }
  dkLotus(x, y, r, { key: o.key ?? 'hero', open: o.open ?? 1, c: o.c ?? DK.red, ci: o.ci ?? DK.redL });
  if ((o.open ?? 1) > 0.5) {
    ctx.save();
    ctx.globalAlpha = ((o.open ?? 1) - 0.5) * 0.15;
    dkShape(ellipsePts(x, y, r * 1.35, r * 1.35, 0, 36), DK.goldL, { key: (o.key ?? 'h') + 'aur', line: false, raw: true });
    ctx.restore();
  }
}

// =====================================================================
//  STYLE hooks (kit/morph.js contract)
// =====================================================================
const STYLE = {
  name: 'devakala',
  paper: DK.paper,

  backdrop(c) {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, W, H);
  },

  window(P, key, src) {
    ctx.save(); trace(P, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    ctx.save(); trace(P, true); ctx.lineWidth = 9; ctx.strokeStyle = DK.gold; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
    ctx.save(); trace(P, true); ctx.lineWidth = 3.5; ctx.strokeStyle = DK.goldD; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  },

  blob(P, c, key) { dkShape(P, c, { key, amt: 0.45 }); },

  hero(x, y, r, o) { dkHero(x, y, r * 0.65, { ...(o ?? {}), stem: false }); },
  heroColor: DK.red,

  post() {},

  ones: false,
};
