// Shared timing for picture and sound. 120 BPM -> one beat every 0.5 s.
export const FPS = 60;
export const DURATION = 20;
export const BPM = 120;
export const BEAT = 60 / BPM;

// Scene boundaries (all on the beat grid).
export const S = {
  hook: 0,
  chaos: 3,
  collapse: 6,
  lockupOut: 7,
  tap1: 7.65,
  linkCard: 7.95,
  intoChat: 8.35,
  tap2: 9.0,
  checkout: 9.2,
  typeName: 9.6,
  typePhone: 10.1,
  typeAddr: 10.6,
  payTap: 11.15,
  verified: 11.4,
  order: 12.0,
  badge: 12.5,
  ready: 13.5,
  timeline: 14.9,
  steps: [15.0, 15.75, 16.5, 17.25],
  tracking: 16.4,
  end: 18.0,
  ctaTap: 19.35,
};

// Phase-1 chat messages inside the phone.
export const THREAD = [
  { at: -9, side: 'in', text: 'Hi! Do you make custom cakes?' },
  { at: -8, side: 'out', text: 'Yes 😊 Sharing the menu' },
  { at: -7, side: 'in', text: 'Saw your reel, so pretty!' },
  { at: -0.12, side: 'in', text: 'Price?' },
  { at: 0.38, side: 'in', text: 'Available for Saturday?' },
  { at: 0.88, side: 'out', text: 'Yes! ₹1,250 for 1 kg' },
  { at: 1.38, side: 'in', text: 'I want this 😍', big: true },
  { at: 1.88, side: 'in', kind: 'shot', text: 'Paid' },
  { at: 2.38, side: 'out', text: 'Address?' },
  { at: 2.62, side: 'in', text: 'Sent it somewhere above ↑' },
];

// Chaos cards bursting around the phone (frame coords at camera scale 1).
export const CHAOS = [
  { at: 3.0, x: 250, y: 720, r: -6, text: '📍 Flat 4B, Rose Apts, Indiranagar' },
  { at: 3.25, x: 830, y: 860, r: 5, text: 'Name? Priya. Priya S.' },
  { at: 3.5, x: 290, y: 1040, r: 4, text: 'Wait, deliver to office instead' },
  { at: 3.75, x: 820, y: 1200, r: -4, text: 'Pincode 560038?' },
  { at: 4.0, x: 270, y: 1380, r: -5, kind: 'shot' },
  { at: 4.25, x: 820, y: 1530, r: 6, text: 'Did you get my payment?' },
  { at: 4.5, x: 330, y: 1690, r: -3, text: "I'll pay tonight 🙏" },
  { at: 4.75, x: 790, y: 640, r: -3, text: 'Sent ₹1,200 or ₹1,250?' },
  { at: 5.0, x: 250, y: 900, r: 4, text: 'Order confirmed?' },
  { at: 5.25, x: 850, y: 1050, r: -6, text: 'Packed?' },
  { at: 5.5, x: 280, y: 1230, r: -4, text: 'Shipped yet?' },
  { at: 5.75, x: 810, y: 1380, r: 5, text: 'Tracking??' },
];

// Captions: [in, out, text]. *word* marks the accent color. "/" forces a break.
export const CAPTIONS = [
  [-0.1, 1.45, 'DM selling *works.*'],
  [1.5, 2.95, 'Managing orders / in DMs doesn’t.'],
  [3.0, 3.95, 'Addresses / get buried.'],
  [4.0, 4.95, 'Payments get / confusing.'],
  [5.0, 5.95, 'Buyers keep / asking.'],
  [7.0, 8.95, 'Send one / *checkout link.*'],
  [9.0, 11.95, 'Buyer enters / details and *pays.*'],
  [12.0, 14.85, 'You get a *paid,* / *trackable* order.'],
  [14.95, 16.4, 'Pack it. Ship it. / *Buyer tracks it.*'],
  [16.45, 17.85, 'Your buyer knows / *what’s next.*'],
];

// Sound cues (seconds). Kept here so picture and sound never drift.
export const SFX = [
  ...THREAD.filter((m) => m.at > -1).map((m) => ({ at: Math.max(0, m.at + 0.04), type: m.side === 'out' ? 'send' : 'pop' })),
  ...CHAOS.map((c, i) => ({ at: c.at + 0.03, type: 'pop', pitch: i })),
  { at: 5.85, type: 'riser' },
  { at: S.collapse, type: 'whoosh' },
  { at: 6.25, type: 'brand' },
  { at: S.tap1, type: 'tap' },
  { at: S.linkCard, type: 'whoosh', soft: true },
  { at: S.intoChat + 0.1, type: 'send' },
  { at: S.tap2, type: 'tap' },
  { at: S.checkout, type: 'whoosh', soft: true },
  { at: S.typeName, type: 'type', n: 12, dur: 0.42 },
  { at: S.typePhone, type: 'type', n: 10, dur: 0.4 },
  { at: S.typeAddr, type: 'type', n: 14, dur: 0.45 },
  { at: S.payTap, type: 'tap' },
  { at: S.verified, type: 'chime' },
  { at: S.order, type: 'whoosh' },
  { at: S.badge, type: 'ding' },
  { at: S.ready, type: 'tick' },
  { at: S.timeline, type: 'whoosh', soft: true },
  ...S.steps.map((at, i) => ({ at, type: 'step', i })),
  { at: S.tracking, type: 'whoosh', soft: true },
  { at: S.end, type: 'brand', final: true },
  { at: S.ctaTap, type: 'tap' },
];
