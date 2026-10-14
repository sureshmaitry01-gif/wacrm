// =====================================================================
//  styles/devakala/kit.js — Kerala mural / classical Indian style (premium)
//  Palette measured from 5 reference images (references/devakala/1-5.jpg).
//  Premium features: gradient petal fills, gold shadow glow, ornate halo with
//  outer petal ring, canvas shadow on key gold elements, dense scrollwork.
//  All shapes use ellipses or petalPts — no sharp corners. On 2s.
//  Built on kit/core.js. Needs HAND, CX from the piece head.
// =====================================================================
const DK = {
  ink:       '#1A0800',
  parchment: '#F5CB6B',
  parchL:    '#FCE8B0',
  parchD:    '#C49040',
  cosmic:    '#0D1E30',
  teal:      '#0C3240',
  gold:      '#D4943A',
  goldL:     '#F0B840',
  goldD:     '#8B5A10',
  blue:      '#4A80B8',
  blueD:     '#2A5080',
  ivory:     '#F0E5C8',
  ivoryD:    '#D4C8A0',
  red:       '#C03020',
  redL:      '#E05030',
  redD:      '#8A1810',
  lotus:     '#E890A0',
  lotusD:    '#C05070',
  green:     '#2A5C28',
  greenL:    '#4A8040',
  saffron:   '#E07030',
  saffronL:  '#F09040',
  paper:     '#E8C070',
};

// =====================================================================
//  Core shape: flat-fill, bold outline, gentle boil on 2s
// =====================================================================
function dkShape(P, c, o) {
  o = o ?? {};
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
//  Smooth lotus petal points — tip-to-base parametrisation, no corners.
//  tipX,tipY: where the tip points; baseX,baseY: petal base (lotus centre)
//  pw: half-width at widest; n: point count
// =====================================================================
function petalPts(tipX, tipY, baseX, baseY, pw, n) {
  n = n || 24;
  const dx = tipX - baseX, dy = tipY - baseY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let along, across;
    if (t < 0.5) {
      const u = t * 2;
      along = u;
      across = -pw * Math.sin(Math.PI * u);
    } else {
      const u = (t - 0.5) * 2;
      along = 1 - u;
      across = pw * Math.sin(Math.PI * (1 - u));
    }
    pts.push([baseX + ux * len * along + nx * across,
              baseY + uy * len * along + ny * across]);
  }
  return pts;
}

// =====================================================================
//  Gradient petal — premium fill (luminous centre, deeper at edges)
//  Draws one petal with a linear gradient fill and bold outline.
// =====================================================================
function dkPetalGrad(tipX, tipY, baseX, baseY, pw, c, ci, key, amt) {
  const pts = petalPts(tipX, tipY, baseX, baseY, pw, 24);
  const Q = wobble(pts, true, amt ?? 0.22, key, 7);
  const grd = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
  grd.addColorStop(0.0, ci);
  grd.addColorStop(0.3, c);
  grd.addColorStop(0.72, c);
  grd.addColorStop(1.0, ci);
  ctx.save();
  trace(Q, true);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = DK.ink;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

// =====================================================================
//  Lotus — redesigned with gradient petals & 12-petal default
// =====================================================================
function dkLotus(x, y, r, o) {
  o = o ?? {};
  const key  = o.key  ?? 'lot';
  const n    = o.n    ?? 12;
  const c    = o.c    ?? DK.lotus;
  const ci   = o.ci  ?? DK.lotusD;
  const open = clamp(o.open ?? 1);

  if (open < 0.08) {
    dkShape(petalPts(x, y - r * 0.55, x, y + r * 0.1, r * 0.18, 20), c, { key: key + 'bud', w: 3, amt: 0.25 });
    dkShape(ellipsePts(x, y + r * 0.22, r * 0.2, r * 0.14, 0, 18), DK.green, { key: key + 'sep', w: 2 });
    return;
  }

  const pw = r * 0.52;

  // Back layer (offset half-step, darker)
  for (let i = 0; i < n; i++) {
    const a = (i / n + 0.5 / n) * TAU;
    const cr = r * (0.78 + 0.22 * open);
    dkPetalGrad(x + Math.cos(a) * cr, y + Math.sin(a) * cr, x, y, pw * 0.82, ci, DK.redD || '#8A1810', key + 'bk' + i, 0.20);
  }

  // Front layer with inner vein highlight
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const cr = r * (0.84 + 0.16 * open);
    const tipX = x + Math.cos(a) * cr, tipY = y + Math.sin(a) * cr;
    dkPetalGrad(tipX, tipY, x, y, pw, c, ci, key + 'ft' + i, 0.23);
    // Thin vein
    const vx = x + Math.cos(a) * cr * 0.68, vy = y + Math.sin(a) * cr * 0.68;
    dkShape(petalPts(vx, vy, x + Math.cos(a) * cr * 0.12, y + Math.sin(a) * cr * 0.12, pw * 0.25, 12),
      ci, { key: key + 've' + i, amt: 0.14, w: 0, line: false });
  }

  // Sepal ring
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    dkShape(ellipsePts(x + Math.cos(a) * r * 0.13, y + Math.sin(a) * r * 0.13, r * 0.085, r * 0.17, a, 14),
      DK.green, { key: key + 'sp' + i, amt: 0.2, w: 2 });
  }

  // Centre disc (gold with glow)
  ctx.save();
  ctx.shadowColor = 'rgba(240,180,40,0.55)';
  ctx.shadowBlur = 18;
  dkShape(ellipsePts(x, y, r * 0.22, r * 0.22, 0, 28), DK.goldL, { key: key + 'ctr', w: 2.5, line: DK.goldD, amt: 0.1 });
  ctx.restore();

  // Stamen dots
  const Rs = RNG('lot', key);
  ctx.fillStyle = DK.goldD;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU, dr = r * Rs.r(0.04, 0.14);
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * dr, y + Math.sin(a) * dr, 4, 0, TAU); ctx.fill();
  }
}

// =====================================================================
//  Halo — ornate gold mandorla with outer petal crown and shadow glow
// =====================================================================
function dkHalo(x, y, r, key) {
  key = key ?? 'halo';

  // Outermost lotus petal ring (8 petal points radiating outward)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const tpX = x + Math.cos(a) * r * 1.38, tpY = y + Math.sin(a) * r * 1.38;
    const bsX = x + Math.cos(a) * r * 0.90, bsY = y + Math.sin(a) * r * 0.90;
    dkPetalGrad(tpX, tpY, bsX, bsY, r * 0.22, DK.goldL, DK.gold, key + 'lp' + i, 0.14);
  }
  // Alternating small petals
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * TAU;
    const tpX = x + Math.cos(a) * r * 1.18, tpY = y + Math.sin(a) * r * 1.18;
    const bsX = x + Math.cos(a) * r * 0.88, bsY = y + Math.sin(a) * r * 0.88;
    dkShape(petalPts(tpX, tpY, bsX, bsY, r * 0.13, 16), DK.gold, { key: key + 'lps' + i, w: 2, line: DK.goldD, amt: 0.12 });
  }

  // Outer ring with glow
  ctx.save();
  ctx.shadowColor = 'rgba(240,180,40,0.50)';
  ctx.shadowBlur = 45;
  dkShape(ellipsePts(x, y, r, r, 0, 56), DK.gold, { key: key + 'o', amt: 0.12, w: 6, line: DK.goldD });
  ctx.restore();

  dkShape(ellipsePts(x, y, r * 0.84, r * 0.84, 0, 56), DK.goldL, { key: key + 'i', amt: 0.07, line: false });

  // Outer dot ring — large-small-small-red pattern
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    const isRed = i % 9 === 0, isBig = i % 3 === 0;
    ctx.fillStyle = isRed ? DK.red : (isBig ? DK.goldD : DK.gold);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.93, y + Math.sin(a) * r * 0.93,
      isRed ? 7 : (isBig ? 5 : 3.5), 0, TAU);
    ctx.fill();
  }

  // Middle dot ring
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    ctx.fillStyle = i % 5 === 0 ? DK.red : DK.goldD;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.73, y + Math.sin(a) * r * 0.73,
      i % 5 === 0 ? 5 : 3, 0, TAU);
    ctx.fill();
  }

  // Radial spokes (16)
  ctx.strokeStyle = DK.goldD; ctx.lineWidth = 1.8;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.20, y + Math.sin(a) * r * 0.20);
    ctx.lineTo(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66);
    ctx.stroke();
  }

  // Inner centre disc
  dkShape(ellipsePts(x, y, r * 0.18, r * 0.18, 0, 28), DK.goldL, { key: key + 'c', amt: 0.06, w: 2, line: DK.goldD });
}

// =====================================================================
//  Kerala spiral coil — smooth logarithmic spiral
// =====================================================================
function dkCoil(x, y, r, key) {
  key = key ?? 'coil';
  const P = [], nPts = 70, turns = 2.5;
  for (let i = 0; i <= nPts; i++) {
    const t = i / nPts, a = t * TAU * turns - Math.PI / 2;
    P.push([x + Math.cos(a) * r * (0.05 + 0.95 * t),
            y + Math.sin(a) * r * (0.05 + 0.95 * t)]);
  }
  ink(P, { w: Math.max(3.5, r * 0.08), color: DK.green, key, amt: 0.45 });
  dkShape(petalPts(x + r * 0.1, y - r * 0.95, x, y - r * 0.52, r * 0.22, 16),
    DK.greenL, { key: key + 'lf', w: 2.5, amt: 0.35 });
}

// =====================================================================
//  Scroll cloud — three rounded lobes
// =====================================================================
function dkCloud(x, y, s, key) {
  key = key ?? 'cld';
  dkShape(ellipsePts(x, y, s * 0.85, s * 0.38, 0, 32), DK.ivory, { key: key + 'b', amt: 0.32, w: 2.5 });
  dkShape(ellipsePts(x - s * 0.65, y + s * 0.08, s * 0.34, s * 0.26, -0.25, 26), DK.ivory, { key: key + 'l', amt: 0.28, w: 2.5 });
  dkShape(ellipsePts(x + s * 0.65, y + s * 0.08, s * 0.34, s * 0.26, 0.25, 26), DK.ivory, { key: key + 'r', amt: 0.28, w: 2.5 });
  dkShape(ellipsePts(x, y - s * 0.22, s * 0.42, s * 0.24, 0, 22), DK.ivory, { key: key + 't', amt: 0.26, w: 2 });
}

// =====================================================================
//  Teardrop border strip — top/bottom decorative band with red dot accents
// =====================================================================
function dkBorder(y0, h, c1, c2, key) {
  key = key ?? 'bdr';
  dkShape(rrectPts(-20, y0, W + 40, h, 0), c1, { key: key + 'bg', raw: true, line: false });
  // Outer line
  ctx.strokeStyle = DK.goldD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.stroke();
  const n = Math.floor(W / (h * 0.82)) + 1, gap = W / n;
  for (let i = 0; i < n; i++) {
    const cx = i * gap + gap / 2, cy = y0 + h / 2;
    const rx = gap * 0.30, ry = h * 0.42;
    const P = [];
    for (let j = 0; j <= 30; j++) {
      const t = j / 30, a = t * TAU - Math.PI / 2;
      P.push([cx + Math.cos(a) * rx * (t < 0.5 ? 1 - t * 0.45 : 1),
              cy + Math.sin(a) * ry]);
    }
    dkShape(P, c2, { key: key + 't' + i, amt: 0.16, w: 1.8 });
    // Red dot inside each teardrop
    ctx.fillStyle = DK.red;
    ctx.beginPath(); ctx.arc(cx, cy - ry * 0.12, ry * 0.2, 0, TAU); ctx.fill();
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
    ctx.save();
    ctx.shadowColor = 'rgba(180,130,20,0.35)';
    ctx.shadowBlur = 20;
    dkShape(rrectPts(x0, y0, bw, bh, 10), DK.parchL, { key: 'cap' + str, raw: true, w: 2.5, line: DK.goldD });
    ctx.restore();
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
    ctx.save();
    ctx.shadowColor = 'rgba(180,130,20,0.35)';
    ctx.shadowBlur = 16;
    dkShape(rrectPts(x0, y0, bw, bh, 10), DK.parchL, { key: 'yt' + str, raw: true, w: 3, line: DK.gold });
    ctx.restore();
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
  dkLotus(x, y, r, { key: o.key ?? 'hero', open: o.open ?? 1, n: 12, c: o.c ?? DK.red, ci: o.ci ?? DK.redL });
  if ((o.open ?? 1) > 0.5) {
    ctx.save();
    ctx.globalAlpha = ((o.open ?? 1) - 0.5) * 0.18;
    dkShape(ellipsePts(x, y, r * 1.4, r * 1.4, 0, 36), DK.goldL, { key: (o.key ?? 'h') + 'aur', line: false, raw: true });
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
