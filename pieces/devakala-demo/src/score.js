  // =====================================================================
  //  SCORE — devakala demo. Indian classical atmosphere.
  //  Era 1 (0-4s): deep drone + slow pad, meditative. A pluck cascade on the lotus rise.
  //  Era 2 (4-8s): warm chord opens, a pentatonic pluck cascade as the lotus blooms.
  // =====================================================================
  const T = TIMELINE, cu = T.cues;
  to = 'm';

  // Era 1: deep drone + meditative pad (Sa-Pa / D-A)
  drone(0.0, 4.1, 73.4, 0.018);                          // D2 drone — the cosmic sustain
  pad(0.0, 4.1, ['D3', 'A3', 'D4'], 0.030, { type: 'triangle', cut: 600, att: 0.2, rel: 0.3 });

  // A gentle pluck motif as the lotus rises
  ['A4', 'D5', 'Fs5'].forEach((n, i) => pluck(cu.lotusRise + i * E8, nz(n), 0.14, 0, 0.7, 2800, 0.3));

  // Era 2: the halo opens — a warm bright chord
  pad(4.0, 8.05, ['D3', 'A3', 'Fs4', 'A4'], 0.048, { cut: 1400, att: 0.35, rel: 0.4, send: 0.45 });
  chime(4.0, ['D5', 'Fs5', 'A5'], 0.12);

  // Pluck cascade as the lotus blooms
  ['D5', 'E5', 'Fs5', 'A5', 'B5', 'D6'].forEach((n, i) =>
    pluck(cu.bloom + i * E16, nz(n), 0.10, 0.25 - i * 0.08, 0.5, 4400, 0.35));

  to = 's';
  sweep(3.7, 4.05, 0.010, 400, 2200, 0);   // a soft shimmer into the morph
