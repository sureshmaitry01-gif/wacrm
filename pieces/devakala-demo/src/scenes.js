
// =====================================================================
//  SCENES — one function per era, world coordinates 1080×1920.
//  Premium: radial glows, gradient petals, dense scrollwork, layered
//  ornaments, glowing gold on key elements. All shapes are ellipses or
//  petalPts — no rectangles or sharp corners.
// =====================================================================

// ── Era 1: Cosmic night — Shesha's dream ───────────────────────────
function sceneCosmic() {
  // 1. Full-bleed deep navy ground
  ctx.fillStyle = DK.cosmic;
  ctx.fillRect(0, 0, W, H);

  // 2. Ambient radial glow at the lotus/disc centre — premium ethereal quality
  const grdBg = ctx.createRadialGradient(540, 480, 0, 540, 480, 420);
  grdBg.addColorStop(0,   'rgba(60,100,180,0.30)');
  grdBg.addColorStop(0.4, 'rgba(30,50,120,0.14)');
  grdBg.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grdBg;
  ctx.fillRect(0, 0, W, H);

  // 3. Stars — 80 stars, some with a subtle glow halo
  const RS = RNG('stars');
  for (let i = 0; i < 80; i++) {
    const sx = RS.r(0, W), sy = RS.r(0, H * 0.65);
    const sr = RS.r(1.2, 3.5) * (0.75 + 0.25 * (B % 4 === i % 4 ? 1 : 0.5));
    const isGlow = i % 8 === 0;
    ctx.save();
    if (isGlow) {
      ctx.shadowColor = 'rgba(240,230,200,0.85)';
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = `rgba(240,230,200,${isGlow ? 0.92 : 0.55})`;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // 4. Cosmic bridge disc (behind lotus, centred upper third)
  dkShape(ellipsePts(540, 480, 162, 162, 0, 56), DK.ivory, { key: 'disc', amt: 0.18, w: 6, line: DK.gold });
  dkShape(ellipsePts(540, 480, 132, 132, 0, 48), DK.parchL, { key: 'disci', amt: 0.12, w: 2, line: DK.goldD });

  // 5. Large lotus — the hero, centred at disc position (≈ 40% of frame width)
  const heroOpen = ev(TIMELINE.cues.lotusRise, 1.2);
  dkHero(540, 480, 210, { key: 'hero', open: heroOpen, stem: false, c: DK.red, ci: DK.redL });

  // 6. Two scroll clouds flanking the lotus
  dkCloud(195, 430, 130, 'cldL');
  dkCloud(885, 430, 130, 'cldR');

  // 7. Thick curved lotus stem — connects lotus base to the figure's navel
  const stemPts = [
    [540, 690],
    [522, 820],
    [502, 960],
    [484, 1110],
    [468, 1215],
  ];
  ink(stemPts, { w: 28, color: DK.green, key: 'stem' });
  ink(stemPts, { w: 14, color: DK.greenL, key: 'stemL' });
  // Two leaves off the stem
  dkShape(petalPts(408, 878, 506, 930, 88, 20), DK.green, { key: 'leaf1', w: 3.5, amt: 0.38 });
  dkShape(petalPts(542, 1058, 480, 1000, 68, 18), DK.green, { key: 'leaf2', w: 3, amt: 0.35 });

  // 8. Shesha's coils — smooth overlapping ivory oval bands behind the body
  const coilY = 1340;
  for (let i = 0; i < 5; i++) {
    const cx = 520 + (i - 2) * 190;
    const cy = coilY + i * 16;
    dkShape(ellipsePts(cx, cy, 272 - i * 18, 68 - i * 6, 0, 36),
      i % 2 === 0 ? '#E2DAC2' : '#D6CEB2', { key: 'coil' + i, w: 4, amt: 0.22 });
    // Gold ring on each coil
    dkShape(ellipsePts(cx + 55, cy - 18, 30, 16, 0.3, 20),
      DK.gold, { key: 'cring' + i, w: 2.5, line: DK.goldD, amt: 0.18 });
  }

  // 9. Reclining divine body — smooth horizontal ellipse
  ctx.save();
  ctx.shadowColor = 'rgba(100,160,240,0.35)';
  ctx.shadowBlur = 22;
  dkShape(ellipsePts(570, 1250, 490, 88, 0, 48), DK.blue, { key: 'body', w: 5, amt: 0.28 });
  ctx.restore();
  // Saffron garment — oval over mid/lower torso
  dkShape(ellipsePts(632, 1260, 326, 55, 0.12, 36), DK.saffron, { key: 'garment', w: 3, amt: 0.22 });
  // Gold waistband
  dkShape(ellipsePts(570, 1236, 492, 22, 0, 36), DK.gold, { key: 'waist', w: 2.5, line: DK.goldD, amt: 0.18 });
  // Chest ornament (Srivatsa disc — premium detail)
  ctx.save();
  ctx.shadowColor = 'rgba(240,180,40,0.45)';
  ctx.shadowBlur = 16;
  dkShape(ellipsePts(242, 1218, 32, 32, 0, 24), DK.gold, { key: 'chest', w: 2.5, line: DK.goldD, amt: 0.12 });
  ctx.restore();
  dkShape(ellipsePts(242, 1218, 15, 15, 0, 16), DK.red, { key: 'chestI', w: 0, line: false, raw: true });
  // Upper arm band
  dkShape(ellipsePts(340, 1230, 20, 30, -0.18, 18), DK.gold, { key: 'armb', w: 2.5, line: DK.goldD, amt: 0.15 });
  // Gold ankle ornament at far right
  dkShape(ellipsePts(968, 1252, 36, 22, 0.2, 22), DK.gold, { key: 'ankl', w: 2.5, line: DK.goldD, amt: 0.18 });

  // 10. Reclining divine head — large smooth oval, head at LEFT end
  dkShape(ellipsePts(270, 1196, 48, 62, 0, 24), DK.blue, { key: 'neck', w: 4, amt: 0.25 });
  ctx.save();
  ctx.shadowColor = 'rgba(100,160,240,0.38)';
  ctx.shadowBlur = 20;
  dkShape(ellipsePts(195, 1095, 152, 178, 0, 48), DK.blue, { key: 'head', w: 5, amt: 0.25 });
  ctx.restore();
  // Face highlight (lighter inner oval on face centre)
  dkShape(ellipsePts(180, 1078, 90, 110, 0, 32), DK.blueD, { key: 'headhi', w: 0, line: false, amt: 0.18 });
  // Tilaka (forehead mark)
  dkShape(ellipsePts(160, 1026, 10, 16, 0, 14), DK.gold, { key: 'tika', w: 0, raw: true, line: false });
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
  // Eyebrow
  {
    const browPts = [];
    for (let i = 0; i <= 12; i++) {
      const t = (i / 12) - 0.5;
      browPts.push([148 + t * 95, 1032 - Math.cos(t * Math.PI * 0.85) * 20]);
    }
    ink(browPts, { w: 6, color: DK.ink, key: 'brow' });
  }
  // Nose — small oval
  dkShape(ellipsePts(120, 1092, 11, 16, 0, 16), DK.ink, { key: 'nose', w: 0, raw: true, line: false });
  // Ear
  dkShape(ellipsePts(245, 1100, 20, 34, 0, 20), DK.blueD, { key: 'ear', w: 3, amt: 0.2 });
  // Gold earring
  dkShape(ellipsePts(245, 1126, 16, 22, 0, 18), DK.gold, { key: 'earing', w: 2, line: DK.goldD, amt: 0.15 });

  // 11. Crown — multi-tier kirita with gradient petals (no sharp triangle)
  ctx.save();
  ctx.shadowColor = 'rgba(240,180,40,0.40)';
  ctx.shadowBlur = 22;
  dkShape(petalPts(195, 875, 195, 1008, 130, 28), DK.gold, { key: 'crown', w: 4, amt: 0.28 });
  ctx.restore();
  dkShape(petalPts(195, 902, 195, 998, 84, 24), DK.goldL, { key: 'crownM', w: 2, amt: 0.22, line: DK.goldD });
  dkShape(petalPts(195, 930, 195, 992, 48, 20), DK.parchL, { key: 'crownI', w: 1.5, amt: 0.18, line: DK.goldD });
  // Three crown jewels — apex + flanking
  dkShape(ellipsePts(195, 884, 18, 25, 0, 18), DK.red, { key: 'jewel', w: 2, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(165, 912, 11, 15, 0, 14), DK.lotus, { key: 'jewelL', w: 1.5, line: DK.goldD, amt: 0.12 });
  dkShape(ellipsePts(225, 912, 11, 15, 0, 14), DK.lotus, { key: 'jewelR', w: 1.5, line: DK.goldD, amt: 0.12 });

  // 12. Necklace on the figure (layered)
  dkShape(ellipsePts(250, 1160, 72, 22, -0.28, 28), DK.gold, { key: 'nkl1', w: 3, amt: 0.18, line: DK.goldD });
  dkShape(ellipsePts(250, 1180, 82, 20, -0.22, 26), DK.goldL, { key: 'nkl2', w: 2, amt: 0.15, line: DK.goldD });

  // 13. Two Kerala spiral coils at lower corners — foliage life detail
  dkCoil(80, 1572, 84, 'coilBL');
  dkCoil(1000, 1572, 84, 'coilBR');

  // 14. Bottom petal row — Ananta/Shesha's lotus couch (11 petals with gold sepal detail)
  for (let i = 0; i < 11; i++) {
    const px = 24 + i * 94;
    // Outer petal (dark red)
    dkShape(petalPts(px, 1608, px, 1972, 94, 22), DK.redD, { key: 'bp' + i, w: 4, amt: 0.32 });
    // Inner petal highlight
    dkShape(petalPts(px, 1640, px, 1944, 58, 18), DK.red, { key: 'bpL' + i, w: 2, amt: 0.25 });
    // Gold sepal detail at petal base — premium finish
    dkShape(ellipsePts(px, 1958, 20, 12, 0, 14), DK.gold, { key: 'bps' + i, w: 1.5, line: DK.goldD, raw: true });
  }

  dkYearTag('cosmic');
  dkCaption('Shesha\'s dream');
}

// ── Era 2: Parchment day — the garden ──────────────────────────────
function sceneGarden() {
  // 1. Full-bleed warm parchment ground
  ctx.fillStyle = DK.parchment;
  ctx.fillRect(0, 0, W, H);

  // 2. Warm radial glow behind the halo — gilded light emanating from the deity
  const haloGrd = ctx.createRadialGradient(540, 480, 0, 540, 480, 320);
  haloGrd.addColorStop(0,   'rgba(240,200,80,0.28)');
  haloGrd.addColorStop(0.45,'rgba(240,170,40,0.10)');
  haloGrd.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = haloGrd;
  ctx.fillRect(0, 0, W, H);

  // 3. Teardrop border strips top and bottom
  dkBorder(0, 95, DK.parchD, DK.gold, 'bdrT');
  dkBorder(H - 95, 95, DK.parchD, DK.gold, 'bdrB');

  // 4. Dense spiral scrollwork background — 16 positions fill the frame
  dkCoil(62, 195, 110, 'coilTL');
  dkCoil(1018, 195, 110, 'coilTR');
  dkCoil(38, 598, 80, 'coilML1');
  dkCoil(1042, 598, 80, 'coilMR1');
  dkCoil(56, 968, 74, 'coilML2');
  dkCoil(1024, 968, 74, 'coilMR2');
  dkCoil(72, 1345, 70, 'coilBL1');
  dkCoil(1008, 1345, 70, 'coilBR1');
  dkCoil(72, 1645, 90, 'coilBL2');
  dkCoil(1008, 1645, 90, 'coilBR2');
  // Mid-density fill coils between primaries
  dkCoil(162, 400, 56, 'coilTL2');
  dkCoil(918, 400, 56, 'coilTR2');
  dkCoil(160, 752, 50, 'coilML3');
  dkCoil(920, 752, 50, 'coilMR3');
  dkCoil(148, 1148, 54, 'coilBL3');
  dkCoil(932, 1148, 54, 'coilBR3');

  // 5. The halo — bridge object, gold mandorla centred upper third
  ctx.save();
  ctx.shadowColor = 'rgba(240,180,40,0.38)';
  ctx.shadowBlur = 50;
  dkHalo(540, 480, 202, 'halo');
  ctx.restore();

  // 6. Two scroll clouds framing the deity's head
  dkCloud(162, 740, 115, 'cldGL');
  dkCloud(918, 740, 115, 'cldGR');

  // 7. Deity figure — standing, all smooth ovals, no rectangles

  // Head — blue oval with glow
  ctx.save();
  ctx.shadowColor = 'rgba(74,128,184,0.38)';
  ctx.shadowBlur = 18;
  dkShape(ellipsePts(540, 455, 90, 108, 0, 48), DK.blue, { key: 'dhead', w: 5, amt: 0.25 });
  ctx.restore();
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
  // Gold earrings — layered for premium look
  dkShape(ellipsePts(458, 480, 14, 20, 0, 16), DK.gold, { key: 'dearrL1', w: 2, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(458, 495, 10, 10, 0, 14), DK.goldL, { key: 'dearrL2', w: 0, line: false, raw: true });
  dkShape(ellipsePts(622, 480, 14, 20, 0, 16), DK.gold, { key: 'dearrR1', w: 2, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(622, 495, 10, 10, 0, 14), DK.goldL, { key: 'dearrR2', w: 0, line: false, raw: true });

  // 8. Crown — tall kirita with peacock feather accents (no sharp triangle)
  ctx.save();
  ctx.shadowColor = 'rgba(240,180,40,0.45)';
  ctx.shadowBlur = 26;
  dkShape(petalPts(540, 268, 540, 370, 148, 32), DK.gold, { key: 'dcrown', w: 4, amt: 0.28 });
  ctx.restore();
  dkShape(petalPts(540, 296, 540, 368, 98, 28), DK.goldL, { key: 'dcrownM', w: 2.5, line: DK.goldD, amt: 0.22 });
  dkShape(petalPts(540, 322, 540, 366, 58, 24), DK.parchL, { key: 'dcrownI', w: 2, line: DK.goldD, amt: 0.18 });
  // Crown jewels — apex + flanking pair
  dkShape(ellipsePts(540, 278, 19, 26, 0, 18), DK.red, { key: 'dcjewel', w: 2, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(508, 308, 12, 16, 0, 14), DK.lotus, { key: 'dcj2', w: 1.5, line: DK.goldD, amt: 0.12 });
  dkShape(ellipsePts(572, 308, 12, 16, 0, 14), DK.lotus, { key: 'dcj3', w: 1.5, line: DK.goldD, amt: 0.12 });
  // Peacock feather accents flanking the crown tip
  dkShape(petalPts(504, 256, 524, 322, 26, 16), DK.green, { key: 'pfL', w: 2, amt: 0.28 });
  dkShape(petalPts(576, 256, 556, 322, 26, 16), DK.green, { key: 'pfR', w: 2, amt: 0.28 });
  dkShape(ellipsePts(504, 254, 10, 13, 0, 13), DK.blue, { key: 'pfLe', w: 0, line: false, raw: true });
  dkShape(ellipsePts(576, 254, 10, 13, 0, 13), DK.blue, { key: 'pfRe', w: 0, line: false, raw: true });

  // 9. Torso and garment
  ctx.save();
  ctx.shadowColor = 'rgba(74,128,184,0.32)';
  ctx.shadowBlur = 20;
  dkShape(ellipsePts(540, 700, 122, 208, 0, 48), DK.blue, { key: 'dtor', w: 5, amt: 0.25 });
  ctx.restore();
  // Saffron garment
  dkShape(ellipsePts(540, 850, 108, 145, 0, 40), DK.saffron, { key: 'dgar', w: 3.5, amt: 0.22 });
  // Saffron drape tails
  dkShape(petalPts(480, 1010, 500, 875, 60, 18), DK.saffronL, { key: 'dgarL', w: 3, amt: 0.28 });
  dkShape(petalPts(600, 1010, 580, 875, 60, 18), DK.saffronL, { key: 'dgarR', w: 3, amt: 0.28 });

  // 10. 3-layer necklace + chest ornament — premium ornamentation
  dkShape(ellipsePts(540, 562, 80, 22, 0, 28), DK.gold, { key: 'dneck1', w: 3, amt: 0.18, line: DK.goldD });
  dkShape(ellipsePts(540, 584, 90, 22, 0, 28), DK.goldL, { key: 'dneck2', w: 2.5, amt: 0.15, line: DK.goldD });
  dkShape(ellipsePts(540, 608, 100, 22, 0, 32), DK.gold, { key: 'dneck3', w: 2, amt: 0.12, line: DK.goldD });
  // Srivatsa chest ornament with glow
  ctx.save();
  ctx.shadowColor = 'rgba(240,180,40,0.50)';
  ctx.shadowBlur = 18;
  dkShape(ellipsePts(540, 648, 28, 28, 0, 24), DK.gold, { key: 'dchest', w: 2.5, line: DK.goldD, amt: 0.12 });
  ctx.restore();
  dkShape(ellipsePts(540, 648, 13, 13, 0, 16), DK.red, { key: 'dchestI', w: 0, line: false, raw: true });

  // 11. Belt ornament
  dkShape(ellipsePts(540, 800, 130, 18, 0, 36), DK.gold, { key: 'dbelt', w: 3, amt: 0.15, line: DK.goldD });
  dkShape(ellipsePts(540, 800, 22, 22, 0, 20), DK.goldL, { key: 'dbeltC', w: 2, line: DK.goldD, amt: 0.10 });

  // 12. Two arms + two bangles each
  dkShape(ellipsePts(392, 615, 88, 28, -0.55, 28), DK.blue, { key: 'darmL', w: 4, amt: 0.25 });
  dkShape(ellipsePts(688, 615, 88, 28, 0.55, 28), DK.blue, { key: 'darmR', w: 4, amt: 0.25 });
  // Left arm bangles (two)
  dkShape(ellipsePts(356, 628, 22, 15, -0.3, 18), DK.gold, { key: 'dbanL1', w: 2.5, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(340, 638, 20, 14, -0.25, 16), DK.goldL, { key: 'dbanL2', w: 2, line: DK.goldD, amt: 0.12 });
  // Right arm bangles (two)
  dkShape(ellipsePts(724, 628, 22, 15, 0.3, 18), DK.gold, { key: 'dbanR1', w: 2.5, line: DK.goldD, amt: 0.15 });
  dkShape(ellipsePts(740, 638, 20, 14, 0.25, 16), DK.goldL, { key: 'dbanR2', w: 2, line: DK.goldD, amt: 0.12 });

  // 13. Water and lotus pond in the lower half
  dkShape(ellipsePts(540, 1380, 600, 240, 0, 48), '#2855A0', { key: 'water', w: 0, line: false, amt: 0.12 });
  // Water shimmer lines
  ctx.strokeStyle = 'rgba(160,200,255,0.28)'; ctx.lineWidth = 3;
  const RW = RNG('water');
  for (let i = 0; i < 8; i++) {
    const wy = 1252 + i * 38 + RW.n(8);
    ctx.beginPath(); ctx.moveTo(RW.r(0, 200), wy); ctx.lineTo(RW.r(800, W), wy); ctx.stroke();
  }

  // Lily pads — premium botanical detail
  dkShape(ellipsePts(205, 1328, 62, 28, 0.3, 24), DK.green, { key: 'pad1', w: 2.5, amt: 0.25 });
  dkShape(ellipsePts(878, 1328, 62, 28, -0.3, 24), DK.green, { key: 'pad2', w: 2.5, amt: 0.25 });
  dkShape(ellipsePts(385, 1358, 46, 22, 0.1, 20), DK.green, { key: 'pad3', w: 2, amt: 0.22 });
  dkShape(ellipsePts(695, 1358, 46, 22, -0.1, 20), DK.green, { key: 'pad4', w: 2, amt: 0.22 });

  // 14. Five lotus flowers on the water — centre + 2 companions + 2 edge
  const heroBloom = ev(TIMELINE.cues.bloom, 1.0);
  dkHero(540, 1240, 130, { key: 'hero', open: heroBloom, stem: true, c: DK.red, ci: DK.redL });
  dkHero(248, 1312, 78, { key: 'lotL1', open: ev(TIMELINE.cues.bloom + 0.3, 0.8), stem: true, c: DK.lotus, ci: DK.lotusD });
  dkHero(832, 1312, 78, { key: 'lotR1', open: ev(TIMELINE.cues.bloom + 0.5, 0.8), stem: true, c: DK.lotus, ci: DK.lotusD });
  dkHero(118, 1382, 55, { key: 'lotL2', open: ev(TIMELINE.cues.bloom + 0.6, 0.7), stem: false, c: DK.red, ci: DK.redL });
  dkHero(962, 1382, 55, { key: 'lotR2', open: ev(TIMELINE.cues.bloom + 0.7, 0.7), stem: false, c: DK.red, ci: DK.redL });

  dkYearTag('garden');
  dkCaption('the lotus opens');
}
