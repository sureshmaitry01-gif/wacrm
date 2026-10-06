// PayPerDM 35 s launch film — shared timing for picture and sound.
// 150 BPM: one beat = 0.4 s, one bar = 1.6 s. Every cut sits on a beat.
export const W = 1920;
export const H = 1080;
export const FPS = 60;
export const DURATION = 35;
export const BPM = 150;
export const BEAT = 60 / BPM;

// Shots: [start, id, background]. A shot ends where the next begins (hard cuts).
export const SHOTS = [
  [0.0, 'marquee', 'cream'],
  [3.2, 'ring', 'cream'],
  [4.8, 'meet', 'deep'],
  [5.6, 'logo', 'deep'],
  [6.8, 'hero', 'deep'],
  [8.4, 'who', 'light'],
  [11.6, 'create', 'deep'],
  [13.2, 'send', 'deep'],
  [14.8, 'noweb', 'light'],
  [15.6, 'checkout', 'deep'],
  [18.8, 'verified', 'light'],
  [19.6, 'order', 'deep'],
  [21.2, 'ship', 'deep'],
  [23.6, 'notrack', 'light'],
  [24.4, 'track', 'deep'],
  [26.4, 'features', 'light'],
  [29.6, 'from', 'deep'],
  [32.8, 'end', 'light'],
];

export const T = {
  buried: 1.6,
  ringIn: 4.3,
  logoSlide: 6.0,
  whoWords: [8.4, 8.8, 9.2, 9.6, 10.0, 10.4],
  whoLast: 10.8,
  tapCreate: 12.4,
  linkSheet: 12.6,
  wantThis: 13.3,
  linkBubble: 13.6,
  delivered: 14.0,
  typing: [15.9, 16.3, 16.7],
  pays: 17.2,
  payTap: 17.6,
  verified: 18.0,
  steps: [21.6, 22.0, 22.4],
  notify: 25.0,
  deliveredTrack: 25.6,
  features: [26.4, 27.2, 28.0, 28.8],
  from: [29.6, 30.4, 31.2, 32.0],
  endSub: 33.1,
  endCta: 33.4,
  ctaTap: 34.2,
};

export const WHO = ['Home bakers', 'Boutiques', 'Jewellery', 'Resin artists', 'Hamper sellers', 'Tiffin services'];
export const FEATURES = ['Checkout links', 'Paid orders', 'Order status', 'Buyer tracking'];

// Chat snippets for the opening marquee rows.
export const ROW_A = ['Price?', 'Available?', 'I want this 😍', 'Size M?', 'Send QR', 'Paid ✅', 'COD?', 'Still there?'];
export const ROW_B = ['Address?', 'Did you get my payment?', 'Tracking?', 'Order confirmed?', 'Name: Priya', 'Pincode?', 'Shipped?', 'Which colour?'];
export const ROW_C = ['When will it arrive?', 'I paid yesterday', 'Wait, new address', 'Screenshot sent', 'Packed?', 'Hello??'];

// Sound cues.
export const SFX = [
  ...SHOTS.slice(1).map(([at, id]) => ({ at, type: 'cut', big: id === 'meet' || id === 'end' })),
  { at: 3.6, type: 'riser', dur: 1.2 },
  { at: 5.6, type: 'brand' },
  { at: 6.0, type: 'swish' },
  ...[8.4, 8.8, 9.2, 9.6, 10.0, 10.4, 10.8].map((at) => ({ at, type: 'tick' })),
  { at: 12.4, type: 'tap' },
  { at: 12.6, type: 'swish' },
  { at: 13.3, type: 'pop' },
  { at: 13.6, type: 'send' },
  { at: 15.9, type: 'type', n: 9, dur: 0.3 },
  { at: 16.3, type: 'type', n: 9, dur: 0.3 },
  { at: 16.7, type: 'type', n: 11, dur: 0.34 },
  { at: 17.6, type: 'tap' },
  { at: 18.0, type: 'chime' },
  { at: 18.8, type: 'ding' },
  ...[21.6, 22.0, 22.4].map((at, i) => ({ at, type: 'step', i })),
  { at: 25.0, type: 'notify' },
  { at: 25.6, type: 'step', i: 3 },
  ...[26.4, 27.2, 28.0, 28.8].map((at) => ({ at, type: 'tick' })),
  { at: 31.6, type: 'riser', dur: 1.2 },
  { at: 32.8, type: 'brand', final: true },
  { at: 34.2, type: 'tap' },
];
