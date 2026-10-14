
// =====================================================================
//  ERAS, CAMERAS, BRIDGES
//  The bridge: a large circular disc (the cosmic moon, top of era 1)
//  morphs into the golden halo circle (top of era 2).
//  Both are centred at (540, 480) — upper-third of the 9:16 frame.
// =====================================================================
const ERA_BG = [DK.cosmic, DK.parchment];
function pieceCam(era, t) { return null; }
const BRIDGES = [
  {
    tc: 4.0,
    A: () => ({ P: ellipsePts(540, 480, 160, 160, 0, 64), c: DK.ivory }),    // cosmic disc
    B: () => ({ P: ellipsePts(540, 480, 200, 200, 0, 64), c: DK.gold }),     // halo
  },
];
