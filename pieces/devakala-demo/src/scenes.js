
// =====================================================================
//  SCENES — one function per era, world coordinates 1080×1920.
//  Ref 1 structure (cosmic): large lotus dominates upper third, reclining
//    Vishnu head below, bottom petal row as Shesha's couch.
//  Ref 2 structure (garden): parchment mural with spiral scrollwork, blue
//    deity centered, halo, teardrop border.
//  All shapes use ellipses or petalPts — no rectangles or sharp corners.
// =====================================================================

// ── Era 1: Cosmic night — Shesha's dream ───────────────────────────
function sceneCosmic() {
  // 1. Full-bleed deep navy ground
  ctx.fillStyle = DK.cosmic;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle stars (upper two-thirds of frame)
  const RS = RNG('stars');
  ctx.fillStyle = 'rgba(240,230,200,0.55)';
  for (let i = 0; i < 70; i++) {
    const sx = RS.r(0, W), sy = RS.r(0, H * 0.6);
    const sr = RS.r(1.5, 3) * (0.7 + 0.3 * (B % 3 === i % 3 ? 1 : 0.6));
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
  }

  // 3. Cosmic bridge disc (behind lotus, centred upper third) — morph bridge object
  dkShape(ellipsePts(540, 480, 162, 162, 0, 56), DK.ivory, { key: 'disc', amt: 0.18, w: 6, line: DK.gold });
  dkShape(ellipsePts(540, 480, 132, 132, 0, 48), DK.parchL, { key: 'disci', amt: 0.12, w: 2, line: DK.goldD });

  // 4. Large lotus — the hero, centred at disc position (lotus ≈ 40% of frame width)
  const heroOpen = ev(TIMELINE.cues.lotusRise, 1.2);
  dkHero(540, 480, 210, { key: 'hero', open: heroOpen, stem: false, c: DK.red, ci: DK.redL });

  // 5. Two scroll clouds flanking the lotus
  dkCloud(195, 430, 130, 'cldL');
  dkCloud(885, 430, 130, 'cldR');

  // 6. Thick curved lotus stem — connects lotus base to the reclining figure's navel
  const stemPts = [
    [540, 690],
    [520, 820],
    [500, 960],
    [480, 1110],
    [465, 1210],
  ];
  ink(stemPts, { w: 26, color: DK.green, key: 'stem' });
  ink(stemPts, { w: 13, color: DK.greenL, key: 'stemL' });
  // Two leaves off the stem
  dkShape(petalPts(410, 880, 505, 930, 85, 18), DK.green, { key: 'leaf1', w: 3.5, amt: 0.38 });
  dkShape(petalPts(540, 1060, 480, 1000, 65, 16), DK.green, { key: 'leaf2', w: 3, amt: 0.35 });

  // 7. Shesha's coils — smooth overlapping ivory oval bands behind the divine body
  const coilY = 1340;
  for (let i = 0; i < 5; i++) {
    const cx = 520 + (i - 2) * 190;
    const cy = coilY + i * 16;
    dkShape(ellipsePts(cx, cy, 270 - i * 18, 68 - i * 6, 0, 36),
      i % 2 === 0 ? '#E0D8C0' : '#D4CCB0', { key: 'coil' + i, w: 4, amt: 0.22 });
    // Gold ring on each coil
    dkShape(ellipsePts(cx + 55, cy - 18, 30, 16, 0.3, 20),
      DK.gold, { key: 'cring' + i, w: 2.5, line: DK.goldD, amt: 0.18 });
  }

  // 8. Reclining divine body — smooth horizontal ellipse (no rectangles)
  dkShape(ellipsePts(570, 1250, 490, 88, 0, 48), DK.blue, { key: 'body', w: 5, amt: 0.28 });
  // Saffron garment — oval over the mid/lower torso
  dkShape(ellipsePts(630, 1260, 325, 55, 0.12, 36), DK.saffron, { key: 'garment', w: 3, amt: 0.22 });
  // Gold waistband
  dkShape(ellipsePts(570, 1235, 490, 22, 0, 36), DK.gold, { key: 'waist', w: 2.5, line: DK.goldD, amt: 0.18 });
  // Gold ankle ornament at far right
  dkShape(ellipsePts(968, 1252, 36, 22, 0.2, 22), DK.gold, { key: 'ankl', w: 2.5, line: DK.goldD, amt: 0.18 });

  // 9. Reclining divine head — large smooth oval, head at LEFT end
  // Neck connection
  dkShape(ellipsePts(270, 1195, 48, 62, 0, 24), DK.blue, { key: 'neck', w: 4, amt: 0.25 });
  // Head (ivory-toned divine face, reading reclined to the right)
  dkShape(ellipsePts(195, 1095, 152, 178, 0, 48), DK.blue, { key: 'head', w: 5, amt: 0.25 });
  // Face highlight (lighter inner glow on face centre)
  dkShape(ellipsePts(180, 1075, 90, 110, 0, 32), DK.blueD, { key: 'headhi', w: 0, line: false, amt: 0.18 });
  // Tilaka (the forehead mark — a small vertical ellipse)
  dkShape(ellipsePts(160, 1025, 10, 16, 0, 14), DK.gold, { key: 'tika', w: 0, raw: true, line: false });
  // Eye — almond-shaped, closed (reclining/sleeping)
  dkShape(ellipsePts(148, 1060, 48, 17, 0, 24), DK.ink, { key: 'eye', w: 0, raw: true, line: false });
  // Eye lower lid curve
  {
    const lidPts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      lidPts.push([100 + t * 96, 1068 + Math.sin(Math.PI * t) * 10]);
    }
    ink(lidPts, { w: 4, color: DK.ink, key: 'lid' });
  }
  // Eyebrow — curved arc
  {
    const browPts = [];
    for (let i = 0; i <= 12; i++) {
      const t = (i / 12) - 0.5;
      browPts.push([148 + t * 95, 1032 - Math.cos(t * Math.PI * 0.85) * 20]);
    }
    ink(browPts, { w: 6, color: DK.ink, key: 'brow' });
  }
  // Nose — small oval bump
  dkShape(ellipsePts(120, 1092, 11, 16, 0, 16), DK.ink, { key: 'nose', w: 0, raw: true, line: false });
  // Ear
  dkShape(ellipsePts(245, 1100, 20, 34, 0, 20), DK.blueD, { key: 'ear', w: 3, amt: 0.2 });
  // Gold earring
  dkShape(ellipsePts(245, 1125, 16, 22, 0, 18), DK.gold, { key: 'earing', w: 2, line: DK.goldD, amt: 0.15 });

  // 10. Crown / kirita — tall smooth tapering shape (no triangle, uses petalPts)
  dkShape(petalPts(195, 890, 195, 1000, 125, 28), DK.gold, { key: 'crown', w: 4, amt: 0.28 });
  dkShape(petalPts(195, 920, 195, 998, 82, 24), DK.goldL, { key: 'crownL', w: 2, amt: 0.2, line: DK.goldD });
  // Crown jewel
  dkShape(ellipsePts(195, 906, 16, 22, 0, 16), DK.red, { key: 'jewel', w: 2, line: DK.goldD, amt: 0.15 });

  // 11. Necklace on the figure
  dkShape(ellipsePts(250, 1162, 72, 22, -0.28, 28), DK.gold, { key: 'nkl', w: 3, amt: 0.18, line: DK.goldD });

  // 12. Two Kerala spiral coils at lower corners — foliage life detail
  dkCoil(82, 1570, 82, 'coilBL');
  dkCoil(998, 1570, 82, 'coilBR');

  // 13. Bottom petal row — the great lotus couch (Ananta/Shesha's lotus bed)
  //     Large red petals pointing up from the very bottom of the frame
  for (let i = 0; i < 9; i++) {
    const px = 36 + i * 114;
    // Outer petal (dark)
    dkShape(petalPts(px, 1610, px, 1970, 102, 22), DK.redD, { key: 'bp' + i, w: 4, amt: 0.32 });
    // Inner petal highlight
    dkShape(petalPts(px, 1640, px, 1940, 64, 18), DK.red, { key: 'bpL' + i, w: 2, amt: 0.25 });
  }

  dkYearTag('cosmic');
  dkCaption('Shesha\'s dream');
}

// ── Era 2: Parchment day — the garden ──────────────────────────────
function sceneGarden() {
  // 1. Full-bleed warm parchment ground
  ctx.fillStyle = DK.parchment;
  ctx.fillRect(0, 0, W, H);

  // 2. Teardrop border strips top and bottom
  dkBorder(0, 95, DK.parchD, DK.gold, 'bdrT');
  dkBorder(H - 95, 95, DK.parchD, DK.gold, 'bdrB');

  // 3. Spiral scrollwork background (Kerala ref 2 — green curling vines)
  dkCoil(75, 230, 100, 'coilTL');
  dkCoil(1005, 230, 100, 'coilTR');
  dkCoil(52, 820, 72, 'coilML');
  dkCoil(1028, 820, 72, 'coilMR');
  // Extra small coils weaving around the composition
  dkCoil(110, 550, 55, 'coilSL');
  dkCoil(970, 550, 55, 'coilSR');
  dkCoil(75, 1740, 90, 'coilBL');
  dkCoil(1005, 1740, 90, 'coilBR');

  // 4. The halo — the bridge object (gold mandorla, centred upper third)
  dkHalo(540, 480, 202, 'halo');

  // 5. Two scroll clouds framing the deity's head
  dkCloud(162, 740, 115, 'cldGL');
  dkCloud(918, 740, 115, 'cldGR');

  // 6. Deity — standing figure (all smooth ovals, no rectangles)

  // Head — blue oval
  dkShape(ellipsePts(540, 455, 90, 108, 0, 48), DK.blue, { key: 'dhead', w: 5, amt: 0.25 });
  // Face highlight
  dkShape(ellipsePts(530, 445, 54, 68, 0, 32), DK.blueD, { key: 'dheadhi', w: 0, line: false, amt: 0.15 });
  // Tilaka
  dkShape(ellipsePts(520, 415, 10, 16, 0, 14), DK.red, { key: 'dtika', w: 0, raw: true, line: false });
  // Right eye
  dkShape(ellipsePts(510, 440, 28, 12, -0.15, 20), DK.ink, { key: 'deye', w: 0, raw: true, line: false });
  // Left eye
  dkShape(ellipsePts(568, 440, 28, 12, 0.15, 20), DK.ink, { key: 'deye2', w: 0, raw: true, line: false });
  // Eyebrows
  {
    const browL = [];
    for (let i = 0; i <= 10; i++) {
      const t = (i / 10) - 0.5;
      browL.push([510 + t * 55, 426 - Math.cos(t * Math.PI * 0.85) * 12]);
    }
    ink(browL, { w: 5, color: DK.ink, key: 'dbrowL' });
    const browR = [];
    for (let i = 0; i <= 10; i++) {
      const t = (i / 10) - 0.5;
      browR.push([568 + t * 55, 426 - Math.cos(t * Math.PI * 0.85) * 12]);
    }
    ink(browR, { w: 5, color: DK.ink, key: 'dbrowR' });
  }
  // Nose
  dkShape(ellipsePts(540, 462, 10, 14, 0, 14), DK.ink, { key: 'dnose', w: 0, raw: true, line: false });
  // Ears
  dkShape(ellipsePts(458, 458, 18, 30, 0, 18), DK.blueD, { key: 'dearL', w: 3, amt: 0.18 });
  dkShape(ellipsePts(622, 458, 18, 30, 0, 18), DK.blueD, { key: 'dearR', w: 3, amt: 0.18 });
  // Gold earrings
  dkShape(ellipsePts(458, 480, 14, 20, 0, 16), DK.gold, { key: 'dearrL', w: 2, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(622, 480, 14, 20, 0, 16), DK.gold, { key: 'dearrR', w: 2, line: DK.goldD, amt: 0.15 });

  // Crown (kirita) — tall tapering petal shape, no sharp triangle
  dkShape(petalPts(540, 270, 540, 370, 145, 32), DK.gold, { key: 'dcrown', w: 4, amt: 0.28 });
  dkShape(petalPts(540, 300, 540, 368, 95, 28), DK.goldL, { key: 'dcrownL', w: 2, line: DK.goldD, amt: 0.2 });
  // Crown jewels
  dkShape(ellipsePts(540, 283, 18, 25, 0, 18), DK.red, { key: 'dcjewel', w: 2, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(510, 308, 11, 15, 0, 14), DK.lotus, { key: 'dcj2', w: 1.5, line: DK.goldD, amt: 0.12 });
  dkShape(ellipsePts(570, 308, 11, 15, 0, 14), DK.lotus, { key: 'dcj3', w: 1.5, line: DK.goldD, amt: 0.12 });

  // Torso — smooth blue oval (not a rectangle)
  dkShape(ellipsePts(540, 700, 122, 208, 0, 48), DK.blue, { key: 'dtor', w: 5, amt: 0.25 });
  // Saffron garment — oval draped over lower torso
  dkShape(ellipsePts(540, 850, 108, 145, 0, 40), DK.saffron, { key: 'dgar', w: 3.5, amt: 0.22 });
  // Saffron drape tails (two smooth leaf shapes hanging down)
  dkShape(petalPts(480, 1010, 500, 875, 60, 18), DK.saffronL, { key: 'dgarL', w: 3, amt: 0.28 });
  dkShape(petalPts(600, 1010, 580, 875, 60, 18), DK.saffronL, { key: 'dgarR', w: 3, amt: 0.28 });

  // Necklace (layered gold ovals)
  dkShape(ellipsePts(540, 572, 78, 22, 0, 28), DK.gold, { key: 'dneck1', w: 3, amt: 0.18, line: DK.goldD });
  dkShape(ellipsePts(540, 592, 88, 22, 0, 28), DK.goldL, { key: 'dneck2', w: 2.5, amt: 0.15, line: DK.goldD });

  // Two arms (smooth ovals angled out)
  dkShape(ellipsePts(392, 615, 88, 28, -0.55, 28), DK.blue, { key: 'darmL', w: 4, amt: 0.25 });
  dkShape(ellipsePts(688, 615, 88, 28, 0.55, 28), DK.blue, { key: 'darmR', w: 4, amt: 0.25 });
  // Arm bangles
  dkShape(ellipsePts(358, 628, 22, 15, -0.3, 18), DK.gold, { key: 'dbanL', w: 2.5, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(722, 628, 22, 15, 0.3, 18), DK.gold, { key: 'dbanR', w: 2.5, line: DK.goldD, amt: 0.15 });

  // 7. Water and lotus pond in the lower half
  // Water surface — smooth wide oval, not a hard rectangle
  dkShape(ellipsePts(540, 1380, 600, 240, 0, 48), '#3060A0', { key: 'water', w: 0, line: false, amt: 0.12 });
  // Water shimmer lines
  ctx.strokeStyle = 'rgba(160,200,255,0.28)'; ctx.lineWidth = 3;
  const RW = RNG('water');
  for (let i = 0; i < 8; i++) {
    const wy = 1250 + i * 38 + RW.n(8);
    ctx.beginPath(); ctx.moveTo(RW.r(0, 200), wy); ctx.lineTo(RW.r(800, W), wy); ctx.stroke();
  }

  // Three lotus flowers on the water — hero + two companions
  const heroBloom = ev(TIMELINE.cues.bloom, 1.0);
  dkHero(540, 1240, 130, { key: 'hero', open: heroBloom, stem: true, c: DK.red, ci: DK.redL });
  dkHero(230, 1310, 78, { key: 'lotL', open: ev(TIMELINE.cues.bloom + 0.3, 0.8), stem: true, c: DK.lotus, ci: DK.lotusD });
  dkHero(850, 1310, 78, { key: 'lotR', open: ev(TIMELINE.cues.bloom + 0.5, 0.8), stem: true, c: DK.lotus, ci: DK.lotusD });

  dkYearTag('garden');
  dkCaption('the lotus opens');
}
