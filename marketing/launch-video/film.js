// PayPerDM launch film. window.seek(t) paints frame t; nothing carries between frames.
import { spring, go, track, swapAlpha, clamp, lerp, lin } from './lib/motion.js';
import { S, THREAD, CHAOS, CAPTIONS, DURATION } from './timeline.js';

const world = document.getElementById('world');
const capsRoot = document.getElementById('caps');
const W = 1080;

// ---------- helpers ----------
const make = (html, parent = world) => {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  const e = d.firstElementChild;
  parent.appendChild(e);
  return e;
};
const q = (root, sel) => root.querySelector(sel);
const qa = (root, sel) => [...root.querySelectorAll(sel)];
// Place by center. w/h are the element's layout size.
function place(e, cx, cy, w, h, s = 1, r = 0, o = 1) {
  e.style.transform = `translate(${(cx - w / 2).toFixed(2)}px,${(cy - h / 2).toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
  e.style.opacity = clamp(o, 0, 1).toFixed(3);
  e.style.visibility = o <= 0.001 || s <= 0.001 ? 'hidden' : 'visible';
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(a, b, k) {
  const A = hex(a), B = hex(b);
  k = clamp(k, 0, 1);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
}
function mixN(colors, k) {
  const i = clamp(Math.floor(k), 0, colors.length - 2);
  return mix(colors[i], colors[i + 1], k - i);
}
const C = { green: '#176B52', white: '#FFFFFF', ink: '#14201B', ink3: '#9AA09A', mint: '#DFF5EA', sand: '#F1EDE3', greenInk: '#0F5A44', line: '#D8D3C7' };

// Wrap words for masked slide reveals. *x* -> accent, " / " -> line break.
function words(text) {
  return text
    .split(' / ')
    .map(
      (line) =>
        `<span class="ln">${line
          .split(' ')
          .map((w) => {
            const acc = /^\*.*\*$/.test(w);
            return `<span class="w"><span class="${acc ? 'acc' : ''}">${w.replace(/\*/g, '')}</span></span>`;
          })
          .join(' ')}</span>`,
    )
    .join('');
}
// Masked word reveal: in (heavy, staggered) then out (snappy, leading edge).
function revealWords(inner, t, inAt, outAt = Infinity, stagger = 0.045) {
  inner.forEach((e, j) => {
    const ch = [{ at: inAt + j * stagger, to: 0, p: 'heavy' }];
    if (outAt !== Infinity) ch.push({ at: outAt + j * 0.018, to: -118, p: 'snappy' });
    e.style.transform = `translateY(${track(t, 118, ch).toFixed(2)}%)`;
  });
}

// ---------- captions ----------
const caps = CAPTIONS.map(([a, b, text]) => {
  const e = make(`<div class="cap disp">${words(text)}</div>`, capsRoot);
  return { a, b, e, inner: qa(e, '.w > span') };
});

// ---------- phone ----------
const phone = make(`
<div id="phone" class="abs"><div id="screen">
  <div class="sbar"><span>9:41</span><span>●●●</span></div><div class="notch"></div>
  <div class="chead"><div class="av">PS</div><div><div class="cname">Priya S.</div><div class="csub">Active now</div></div><div id="unread">1</div></div>
  <div class="thread" id="t1"><div class="tin">${THREAD.map((m) =>
    m.kind === 'shot'
      ? `<div class="msg in shotmsg"><div class="shot"><div class="ck">✓</div><b>₹1,250</b><i>screenshot.jpg</i></div><div style="padding:10px 14px 4px">Paid</div></div>`
      : `<div class="msg ${m.side}${m.big ? ' big' : ''}">${m.text}</div>`,
  ).join('')}</div></div>
  <div class="thread" id="t2"><div class="tin" style="padding-top:24px"><div class="msg in big">I want this 😍</div></div>
    <div id="delivered" class="abs" style="font-size:21px;font-weight:700;color:#9AA09A;white-space:nowrap">Delivered ✓✓</div></div>
  <div class="comp"><div>Message…</div></div>
</div></div>`);
const PH = { w: 600, h: 1220, cx: 540, cy: 1180 };
const SCREEN = { x: PH.cx - 286, y: PH.cy - 596, w: 572, h: 1192 };
const t1 = q(phone, '#t1'), t2 = q(phone, '#t2');
const t1in = q(t1, '.tin');
const msgs = qa(t1in, '.msg');
const unread = q(phone, '#unread');
const delivered = q(phone, '#delivered');

// ---------- chaos cards ----------
const chaos = CHAOS.map((c) => {
  const e = c.kind === 'shot'
    ? make(`<div class="abs chaos shotcard"><div class="shot"><div class="ck">✓</div><b>₹1,250</b><i>UPI · 9:14 PM</i></div><span class="fn">IMG_0412.jpg</span></div>`)
    : make(`<div class="abs chaos">${c.text}</div>`);
  return { ...c, e };
});

// ---------- real product UI: seller workbench ----------
const wb = make(`<div id="shotWB" class="abs"><img src="assets/workbench.png" alt=""></div>`);
const WB = { w: 865, h: 372, cx: 540, cy: 1120 };
const K = 865 / 509; // screenshot scale
const BTN = { cx: WB.cx - WB.w / 2 + K * ((26 + 312) / 2), cy: WB.cy - WB.h / 2 + K * ((135 + 192) / 2), w: K * 286, h: K * 57, r: K * 10 };

// ---------- the one morphing object ----------
const box = make(`<div id="box" class="abs">
  <div class="layer P" id="lP">P</div>
  <div class="layer" id="lBtn" style="display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;white-space:nowrap">+ Create Checkout Link</div>
  <div class="layer lk" id="lLink">
    <div class="row"><div class="seller">RC</div><div><div class="sname">Ravi Cakes</div><div class="via">Checkout link · PayPerDM</div></div></div>
    <div class="item">Chocolate truffle cake · 1 kg</div>
    <div class="amt disp">₹1,250</div>
    <div class="url">🔗 payperdm.com/c/RC1042</div>
    <div class="btn">Pay securely →</div>
  </div>
  <div class="layer co" id="lCo">
    <div class="top"><div class="shop">Ravi Cakes</div><div class="sec">🔒 Secure checkout</div></div>
    <div class="sum"><div><b>Chocolate truffle cake</b><span>1 kg · Qty 1</span></div><div class="p">₹1,250</div></div>
    <div class="lab">Full name</div><div class="in" data-f="0"><span class="tx"></span><span class="caret"></span></div>
    <div class="lab">Phone (WhatsApp)</div><div class="in" data-f="1"><span class="tx"></span><span class="caret"></span></div>
    <div class="lab">Delivery address</div><div class="in tall" data-f="2"><span class="tx"></span><span class="caret"></span></div>
    <div class="tot"><span>Total</span><span>₹1,250</span></div>
    <div class="pay" id="pay"><div class="lbl" id="payA">Pay ₹1,250</div><div class="lbl" id="payB"><span class="vck">✓</span>Payment verified</div></div>
  </div>
  <div class="layer od" id="lOd">
    <div class="hd"><span class="eyebrow">New paid order <span class="oid">#RC-1042</span></span></div>
    <div class="amtrow"><span class="amt disp">₹1,250</span><span class="badge" id="badge"><span class="vck">✓</span>Payment verified</span></div>
    <div class="pill" id="pill" style="right:56px;top:50px">
      <span class="pl">Ready to Pack</span><span class="pl">Packed</span><span class="pl">Shipped</span><span class="pl">Delivered</span>
    </div>
  </div>
  <div class="layer od" id="lRows"><div class="rows">
    <div class="r"><div class="k">Buyer</div><div class="v">Priya Sharma</div></div>
    <div class="r"><div class="k">Phone</div><div class="v">+91 98450 43210</div></div>
    <div class="r tall"><div class="k">Deliver to</div><div class="v">12, 4th Cross, Indiranagar,<br>Bengaluru 560038</div></div>
    <div class="r"><div class="k">Item</div><div class="v">Chocolate truffle cake · 1 kg</div></div>
  </div></div>
  <div class="layer od" id="lTl"><div class="tl">
    ${[['Ready to Pack', 'Order confirmed'], ['Packed', 'Boxed and labelled'], ['Shipped', 'Tracking link shared'], ['Delivered', 'Handed to Priya']]
      .map(([n, s], i) => `<div class="st"><div class="dot"><div class="fill">✓</div></div>${i < 3 ? '<div class="bar"><i></i></div>' : ''}<div class="n">${n}</div><div class="s">${s}</div></div>`)
      .join('')}
  </div></div>
</div>`);
const L = Object.fromEntries(['lP', 'lBtn', 'lLink', 'lCo', 'lOd', 'lRows', 'lTl'].map((id) => [id, q(box, '#' + id)]));
const fields = qa(L.lCo, '.in');
const FIELD_TEXT = ['Priya Sharma', '+91 98450 43210', '12, 4th Cross, Indiranagar, Bengaluru 560038'];
const FIELD_AT = [S.typeName, S.typePhone, S.typeAddr];
const FIELD_DUR = [0.42, 0.4, 0.45];
const pay = q(L.lCo, '#pay'), payA = q(L.lCo, '#payA'), payB = q(L.lCo, '#payB');
const badge = q(L.lOd, '#badge');
const pill = q(L.lOd, '#pill');
const pillLabels = qa(pill, '.pl');
const rows = qa(L.lRows, '.r');
const steps = qa(L.lTl, '.st');

// ---------- buyer tracking card ----------
const trk = make(`<div id="track" class="abs">
  <div class="hd"><div class="lg P">P</div>Track your order · <span style="color:#9AA09A">#RC-1042</span></div>
  <div class="stat disp">${['Packed', 'Shipped', '<span class="acc">Delivered</span>'].map((w) => `<span class="w"><span>${w}</span></span>`).join('')}</div>
  <div class="meta">Ravi Cakes · Updates on WhatsApp</div>
  <div class="prog"><i></i>${[0, 1, 2, 3].map((i) => `<span class="pd" style="left:${(i / 3) * 100}%"></span>`).join('')}</div>
  ${['Ready', 'Packed', 'Shipped', 'Delivered'].map((n, i) => `<span class="pl2" style="left:${60 + (i / 3) * 740}px">${n}</span>`).join('')}
</div>`);
const trkStat = qa(trk, '.stat .w > span');
const trkFill = q(trk, '.prog i');
const trkDots = qa(trk, '.pd');
const trkLabels = qa(trk, '.pl2');

// ---------- end card ----------
const lockWM = make(`<div id="lockWM" class="abs disp">${words('Pay*Per*DM')}</div>`);
const lockWMW = qa(lockWM, '.w > span');
const endLogo = make(`<div id="endLogo" class="abs"><div class="lg P">P</div><span class="wm disp">PayPerDM</span></div>`);
const endHead = make(`<div id="endHead" class="abs disp">${words('Turn chat orders / into *paid,* / *trackable* *orders.*')}</div>`);
const endSub = make(`<div id="endSub" class="abs">${words('No website needed.')}</div>`);
const cta = make(`<div id="cta" class="abs">Start free <span>→</span></div>`);
const ctaUrl = make(`<div id="ctaUrl" class="abs">${words('payperdm.com')}</div>`);
const endHeadW = qa(endHead, '.w > span'), endSubW = qa(endSub, '.w > span'), ctaUrlW = qa(ctaUrl, '.w > span');

// ---------- touches ----------
const TAPS = [
  { at: 7.3, press: S.tap1, leave: 7.85, get x() { return BTN.cx + 40; }, get y() { return BTN.cy + 10; } },
  { at: 8.7, press: S.tap2, leave: 9.18, x: 560, y: 1158 },
  { at: 10.88, press: S.payTap, leave: 11.38, x: 560, y: 0 /* measured */ },
  { at: 19.0, press: S.ctaTap, leave: 19.62, x: 300, y: 960 },
];
TAPS.forEach((tp) => {
  tp.dot = make(`<div id="touch" class="abs"></div>`);
  tp.rip = make(`<div class="abs ripple"></div>`);
});

// ---------- measurement (layout only, once) ----------
let MSG = [], PAY_Y = 0, PILL_W = [];
function measure() {
  t2.style.display = 'block'; delivered.dataset.w = delivered.offsetWidth; t2.style.display = 'none';
  MSG = msgs.map((m) => ({ top: m.offsetTop, bottom: m.offsetTop + m.offsetHeight }));
  PAY_Y = SCREEN.y + pay.offsetTop + pay.offsetHeight / 2;
  TAPS[2].y = PAY_Y;
  PILL_W = pillLabels.map((p) => p.offsetWidth);
  chaos.forEach((c) => { c.w = c.e.offsetWidth; c.h = c.e.offsetHeight; });
  
}

// ---------- the frame function ----------
function seek(t) {
  // camera
  const camS = track(t, 1.2, [
    { at: S.chaos, to: 0.9 },
    { at: S.collapse, to: 1 },
    { at: S.checkout, to: 1.05 },
    { at: S.order, to: 1 },
  ]);
  const camY = track(t, 1040, [{ at: S.chaos, to: 960 }, { at: S.checkout, to: 1040 }, { at: S.order, to: 960 }]);
  const camX = 540;
  world.style.transform = `translate(${(540 - camX * camS).toFixed(2)}px,${(960 - camY * camS).toFixed(2)}px) scale(${camS.toFixed(4)})`;

  // captions
  caps.forEach((c) => {
    const vis = t > c.a - 0.02 && t < c.b + 0.7;
    c.e.style.display = vis ? 'block' : 'none';
    if (vis) revealWords(c.inner, t, c.a, c.b);
  });

  // phone
  const py = track(t, 0, [
    { at: S.collapse, to: 1500 },
    { at: 8.3, to: 0 },
    { at: S.order, to: 1650 },
  ]);
  const pIn = go(t, -0.4, 0.94, 1, 'default'); // already settling at frame 0
  place(phone, PH.cx, PH.cy + py, PH.w, PH.h, pIn);
  const phase1 = t < 7.4;
  t1.style.display = phase1 ? 'block' : 'none';
  t2.style.display = phase1 ? 'none' : 'block';
  // thread 1
  const viewH = 936 - 18;
  const scroll = track(t, MSG[0].bottom - viewH, THREAD.map((m, i) => ({ at: m.at, to: Math.max(MSG[i].bottom - viewH, MSG[0].bottom - viewH) })));
  t1in.style.transform = `translateY(${(-scroll).toFixed(2)}px)`;
  msgs.forEach((m, i) => {
    const a = THREAD[i].at;
    const k = spring(t - a, 'snappy');
    m.style.transform = `translateY(${((1 - k) * 30).toFixed(2)}px) scale(${lerp(0.6, 1, k).toFixed(4)})`;
    m.style.opacity = clamp((t - a) / 0.07, 0, 1).toFixed(3);
  });
  // unread counter
  const times = [...THREAD.filter((m) => m.side === 'in' && m.at > -1).map((m) => m.at), ...CHAOS.map((c) => c.at)];
  const n = times.filter((a) => a <= t).length;
  const last = Math.max(-9, ...times.filter((a) => a <= t));
  unread.textContent = String(Math.max(1, n));
  unread.style.transform = `scale(${(1 + 0.25 * (1 - spring(t - last, 'snappy'))).toFixed(3)})`;
  // thread 2 delivered tick
  const delW = +delivered.dataset.w || 140;
  delivered.style.transform = `translate(${(572 - 26 - delW).toFixed(1)}px, ${(1040 + 168 + 14 - SCREEN.y - 156 + 0).toFixed(1)}px) translateY(${((1 - spring(t - 8.85, 'snappy')) * 16).toFixed(2)}px)`;
  delivered.style.opacity = clamp((t - 8.85) / 0.1, 0, 1).toFixed(3);

  // chaos cards + collapse into one point
  chaos.forEach((c, i) => {
    const k = spring(t - c.at, 'default');
    const col = spring(t - (S.collapse + i * 0.018), 'default');
    const x = lerp(c.x, 540, col), y = lerp(c.y + (1 - k) * 50, 1060, col);
    const s = lerp(0.55, 1, k) * lerp(1, 0.06, col);
    const r = lerp(c.r * 1.6, c.r, k) * (1 - col);
    const o = clamp((t - c.at) / 0.07, 0, 1) * (1 - lin(col, 0.75, 0.98));
    place(c.e, x, y, c.w, c.h, s, r, o);
  });
  // thread messages fly with the phone; nothing else to do.

  // ---- morphing box ----
  const bx = track(t, 540, [
    { at: S.lockupOut, to: BTN.cx },
    { at: S.linkCard, to: 540 },
    { at: S.intoChat, to: 548 },
    { at: S.checkout, to: 540 },
    { at: S.order, to: 540 },
    { at: S.end, to: 400 },
  ]);
  const by = track(t, 1060, [
    { at: S.lockupOut, to: BTN.cy },
    { at: S.linkCard, to: 1110 },
    { at: S.intoChat, to: 1040 },
    { at: S.checkout, to: PH.cy },
    { at: S.order, to: 1110 },
    { at: S.timeline, to: 900 },
    { at: S.end, to: 1420 },
  ]);
  const size0 = track(t, 0, [{ at: 6.2, to: 230, p: 'heavy' }]);
  // (width/height expressed as offsets from the logo size so the logo grow stays its own spring)
  const dW = (to, from) => to - from;
  const bW = size0 + track(t, 0, [
    { at: S.lockupOut, to: dW(BTN.w, 230) },
    { at: S.linkCard, to: dW(860, 230) },
    { at: S.checkout, to: dW(572, 230) },
    { at: S.order, to: dW(900, 230) },
  ]);
  const bH = size0 + track(t, 0, [
    { at: S.lockupOut, to: dW(BTN.h, 230) },
    { at: S.linkCard, to: dW(560, 230) },
    { at: S.checkout, to: dW(1192, 230) },
    { at: S.order, to: dW(840, 230) },
    { at: S.timeline, to: dW(770, 230) },
  ]);
  const bR = track(t, 0.27 * size0, [
    { at: S.lockupOut, to: BTN.r },
    { at: S.linkCard, to: 40 },
    { at: S.checkout, to: 68 },
    { at: S.order, to: 44 },
  ]);
  const bS = track(t, 1, [
    { at: S.tap1, to: 0.94, p: 'snappy' },
    { at: S.tap1 + 0.12, to: 1, p: 'snappy' },
    { at: S.intoChat, to: 0.62 },
    { at: S.tap2, to: 0.59, p: 'snappy' },
    { at: S.tap2 + 0.1, to: 0.62, p: 'snappy' },
    { at: S.checkout, to: 1 },
    { at: S.end, to: 0.56 },
  ]);
  const bRot = track(t, 0, [{ at: S.end, to: -4 }]);
  const white = spring(t - S.linkCard, 'snappy');
  box.style.width = bW.toFixed(2) + 'px';
  box.style.height = bH.toFixed(2) + 'px';
  box.style.borderRadius = Math.max(0, bR).toFixed(2) + 'px';
  box.style.background = mix(C.green, C.white, white);
  box.style.boxShadow = `0 ${(40 * bS).toFixed(1)}px 70px -30px rgba(20,40,30,${(0.35).toFixed(2)}), 0 2px 8px rgba(20,40,30,.08)`;
  place(box, bx, by, bW, bH, bS, bRot, size0 > 0.5 ? 1 : 0);

  // layers inside the box (text enters after each morph starts, leaves before the next)
  const layer = (e, a, slide = 18) => {
    e.style.opacity = a.toFixed(3);
    e.style.visibility = a <= 0.001 ? 'hidden' : 'visible';
    e.style.transform = `translateY(${((1 - a) * slide).toFixed(2)}px)`;
  };
  // P mark
  const aP = swapAlpha(t, 6.2, S.lockupOut, 0.12);
  L.lP.style.width = bW + 'px'; L.lP.style.height = bH + 'px'; L.lP.style.fontSize = (0.6 * Math.min(bW, bH)).toFixed(1) + 'px';
  layer(L.lP, aP, 0);
  // button label (matches the real dashboard button)
  L.lBtn.style.width = bW + 'px'; L.lBtn.style.height = bH + 'px'; L.lBtn.style.fontSize = (K * 17.5).toFixed(1) + 'px';
  layer(L.lBtn, swapAlpha(t, S.lockupOut, S.linkCard), 8);
  layer(L.lLink, swapAlpha(t, S.linkCard, S.checkout));
  layer(L.lCo, swapAlpha(t, S.checkout, S.order, 0.05));
  const aOd = swapAlpha(t, S.order);
  layer(L.lOd, aOd);
  L.lRows.style.visibility = t > S.order && t < S.timeline + 0.5 ? 'visible' : 'hidden';
  rows.forEach((r, i) => {
    const a = swapAlpha(t, S.order + 0.12 + i * 0.1, S.timeline - i * 0.03);
    r.style.opacity = a.toFixed(3);
    r.style.transform = `translateY(${((1 - a) * 26).toFixed(2)}px)`;
  });
  const aTl = swapAlpha(t, S.timeline);
  layer(L.lTl, aTl, 24);

  // checkout typing + focus
  fields.forEach((f, i) => {
    const str = FIELD_TEXT[i];
    const nCh = Math.round(clamp((t - FIELD_AT[i]) / FIELD_DUR[i], 0, 1) * str.length);
    q(f, '.tx').textContent = str.slice(0, nCh);
    const focus = t >= FIELD_AT[i] - 0.15 && t < (FIELD_AT[i + 1] ?? S.payTap) - 0.1;
    const fk = focus ? spring(t - (FIELD_AT[i] - 0.15), 'snappy') : 0;
    f.style.borderColor = mix('#E8E3D9', C.green, fk);
    q(f, '.caret').style.opacity = focus && Math.floor((t - FIELD_AT[i]) * 3.2) % 2 === 0 ? '1' : '0';
  });
  const payPress = track(t, 1, [{ at: S.payTap, to: 0.95, p: 'snappy' }, { at: S.payTap + 0.12, to: 1, p: 'snappy' }]);
  const vk = spring(t - S.verified, 'snappy');
  pay.style.transform = `scale(${payPress.toFixed(4)})`;
  pay.style.background = mix(C.green, C.mint, vk);
  payA.style.color = '#fff'; payB.style.color = C.greenInk;
  const aA = swapAlpha(t, -1, S.verified, 0), aB = swapAlpha(t, S.verified, Infinity, 0.06);
  payA.style.opacity = aA.toFixed(3); payA.style.transform = `translateY(${(-(1 - aA) * 30).toFixed(2)}px)`;
  payB.style.opacity = aB.toFixed(3); payB.style.transform = `translateY(${((1 - aB) * 30).toFixed(2)}px)`;

  // order badge + status pill
  const bk = spring(t - S.badge, 'snappy');
  badge.style.transform = `scale(${lerp(0.6, 1, bk).toFixed(4)})`;
  badge.style.opacity = clamp((t - S.badge) / 0.08, 0, 1).toFixed(3);
  const P = track(t, 0, S.steps.map((at, i) => ({ at, to: i + 1, p: 'snappy' })));
  const kIdx = track(t, 0, S.steps.slice(1).map((at, i) => ({ at, to: i + 1, p: 'snappy' })));
  const pk = spring(t - S.ready, 'snappy');
  const pw = track(t, PILL_W[0], S.steps.slice(1).map((at, i) => ({ at, to: PILL_W[i + 1], p: 'snappy' })));
  pill.style.width = pw.toFixed(2) + 'px';
  pill.style.background = mixN([C.sand, C.mint, C.mint, C.green], kIdx);
  pill.style.transformOrigin = '100% 50%';
  pill.style.transform = `scale(${lerp(0.6, 1, pk).toFixed(4)})`;
  pill.style.opacity = clamp((t - S.ready) / 0.08, 0, 1).toFixed(3);
  const winStart = [S.ready, ...S.steps.slice(1)];
  pillLabels.forEach((lbl, i) => {
    const a = swapAlpha(t, winStart[i] - 0.2, winStart[i + 1] ?? Infinity, 0.06);
    lbl.style.opacity = a.toFixed(3);
    lbl.style.transform = `translateY(${((1 - a) * (t < winStart[i] ? 26 : -26)).toFixed(2)}px)`;
    lbl.style.color = i === 3 ? '#fff' : i === 0 ? C.ink : C.greenInk;
  });
  // timeline steps
  steps.forEach((st, i) => {
    const d = clamp(P - i, 0, 1);
    const fill = q(st, '.fill');
    fill.style.transform = `scale(${d.toFixed(4)})`;
    q(st, '.n').style.color = mix(C.ink3, C.ink, d);
    const bar = q(st, '.bar i');
    if (bar) bar.style.transform = `scaleY(${clamp(P - i - 1, 0, 1).toFixed(4)})`;
  });

  // tracking card
  const tY = track(t, 2500, [{ at: S.tracking, to: 1560 }, { at: S.end, to: 1650 }]);
  const tX = track(t, 540, [{ at: S.end, to: 710 }]);
  const tS = track(t, 1, [{ at: S.end, to: 0.62 }]);
  const tR = track(t, 5, [{ at: S.tracking, to: 0 }, { at: S.end, to: 3 }]);
  place(trk, tX, tY, 860, 430, tS, tR, t > S.tracking - 0.05 ? 1 : 0);
  const sw = [S.tracking - 1, S.steps[2], S.steps[3]];
  trkStat.forEach((e, i) => {
    const ch = [];
    if (i > 0) ch.push({ at: sw[i], to: 0, p: 'heavy' });
    if (i < 2) ch.push({ at: sw[i + 1], to: -118, p: 'snappy' });
    e.style.transform = `translateY(${track(t, i > 0 ? 118 : 0, ch).toFixed(2)}%)`;
  });
  trkFill.style.transform = `scaleX(${clamp((P - 1) / 3, 0, 1).toFixed(4)})`;
  trkDots.forEach((d, i) => {
    const k = clamp(P - i, 0, 1);
    d.style.borderColor = mix(C.line, C.green, k);
    d.style.background = mix('#FFFFFF', C.green, k);
  });
  trkLabels.forEach((l, i) => { l.style.color = mix(C.ink3, C.ink, clamp(P - i, 0, 1)); });

  // lockup wordmark
  lockWM.style.display = t > 6.2 && t < 7.6 ? 'block' : 'none';
  lockWM.style.transform = `translate(${(540 - lockWM.offsetWidth / 2).toFixed(1)}px, 1220px)`;
  revealWords(lockWMW, t, 6.38, 6.92, 0);

  // workbench screenshot (real UI)
  const wy = track(t, 2600, [{ at: 6.85, to: WB.cy }, { at: S.linkCard, to: 2700 }]);
  place(wb, WB.cx, wy, WB.w, WB.h, 1, 0, t > 6.6 && t < 9 ? 1 : 0);

  // end card
  const showEnd = t > S.end - 0.05;
  [endLogo, endHead, endSub, cta, ctaUrl].forEach((e) => (e.style.display = showEnd ? 'flex' : 'none'));
  endHead.style.display = endSub.style.display = ctaUrl.style.display = showEnd ? 'block' : 'none';
  if (showEnd) {
    const lk = spring(t - (S.end + 0.02), 'heavy');
    endLogo.style.transformOrigin = '0 50%';
    endLogo.style.transform = `translate(84px, ${(300 + (1 - lk) * 70).toFixed(2)}px) scale(${lerp(0.7, 1, lk).toFixed(4)})`;
    endLogo.style.opacity = clamp((t - S.end) / 0.1, 0, 1).toFixed(3);
    endHead.style.transform = `translate(80px, 470px)`;
    revealWords(endHeadW, t, S.end + 0.14, Infinity, 0.05);
    endSub.style.transform = `translate(84px, 808px)`;
    revealWords(endSubW, t, S.end + 0.6, Infinity, 0.05);
    const ck = spring(t - (S.end + 0.78), 'snappy');
    const cPress = track(t, 1, [{ at: S.ctaTap, to: 0.94, p: 'snappy' }, { at: S.ctaTap + 0.12, to: 1, p: 'snappy' }]);
    cta.style.transformOrigin = '0 50%';
    cta.style.transform = `translate(84px, ${(900 + (1 - ck) * 40).toFixed(2)}px) scale(${(lerp(0.7, 1, ck) * cPress).toFixed(4)})`;
    cta.style.opacity = clamp((t - S.end - 0.78) / 0.08, 0, 1).toFixed(3);
    ctaUrl.style.transform = `translate(548px, 930px)`;
    revealWords(ctaUrlW, t, S.end + 0.95);
  }

  // touches + ripples
  TAPS.forEach((tp) => {
    const s = track(t, 0, [
      { at: tp.at, to: 1, p: 'snappy' },
      { at: tp.press, to: 0.78, p: 'snappy' },
      { at: tp.press + 0.12, to: 1, p: 'snappy' },
      { at: tp.leave, to: 0, p: 'snappy' },
    ]);
    const x = go(t, tp.at, tp.x + 150, tp.x) + go(t, tp.leave, 0, 140);
    const y = go(t, tp.at, tp.y + 230, tp.y) + go(t, tp.leave, 0, 200);
    place(tp.dot, x, y, 92, 92, Math.max(0, s), 0, clamp(s * 4, 0, 1));
    const rk = go(t, tp.press, 0.3, 2.6, 'default');
    const ro = t > tp.press ? 0.55 * (1 - lin(t, tp.press, tp.press + 0.5)) : 0;
    place(tp.rip, tp.x, tp.y, 100, 100, rk, 0, ro);
  });
}

// z-order: chaos under box, box above phone, end/touch on top
world.append(lockWM, wb, box, trk, endLogo, endHead, endSub, cta, ctaUrl);
TAPS.forEach((tp) => world.append(tp.rip, tp.dot));

window.DURATION = DURATION;
window.ready = document.fonts.ready.then(() => {
  measure();
  seek(0);
  return true;
});
window.seek = seek;

// Preview mode: scrub with ?t=, or play with ?play
const params = new URLSearchParams(location.search);
window.ready.then(() => {
  if (params.has('t')) seek(parseFloat(params.get('t')));
  if (params.has('play')) {
    const t0 = performance.now();
    const loop = () => { seek(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
});
