// PayPerDM — 35 s launch film (16:9). window.seek(t) paints frame t. Hard cuts on the beat, springs inside shots.
import { spring, go, track, swapAlpha, clamp, lerp, lin, mulberry32 } from './lib/motion.js';
import { SHOTS, T, WHO, FEATURES, ROW_A, ROW_B, ROW_C, DURATION, W, H } from './timeline.js';

const stage = document.getElementById('stage');
const BG = { cream: '#FAF8F2', deep: '#0E4D3B', light: '#E3F3EA' };

// ---------- helpers ----------
function make(html, parent) {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  const e = d.firstElementChild;
  parent.appendChild(e);
  return e;
}
const q = (r, s) => r.querySelector(s);
const qa = (r, s) => [...r.querySelectorAll(s)];
function place(e, cx, cy, w, h, s = 1, r = 0, o = 1) {
  e.style.transform = `translate(${(cx - w / 2).toFixed(2)}px,${(cy - h / 2).toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
  e.style.opacity = clamp(o, 0, 1).toFixed(3);
  e.style.visibility = o <= 0.001 || s <= 0.001 ? 'hidden' : 'visible';
}
const at = (e, x, y) => (e.style.transform = `translate(${x}px,${y}px)`);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(a, b, k) {
  const A = hex(a), B = hex(b);
  k = clamp(k, 0, 1);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
}
// *x* -> accent, " / " -> line break
function words(text) {
  return text.split(' / ').map((line) => `<span class="ln">${line.split(' ').map((w) => {
    const acc = /^\*.*\*$/.test(w) || /^\*/.test(w) || /\*$/.test(w);
    return `<span class="w"><span class="${acc ? 'acc' : ''}">${w.replace(/\*/g, '')}</span></span>`;
  }).join(' ')}</span>`).join('');
}
// Fix accent spans that open on one word and close on a later one.
function accentRuns(el, text) {
  const tokens = text.replace(/ \/ /g, ' ').split(' ');
  let on = false;
  qa(el, '.w > span').forEach((s, i) => {
    const tk = tokens[i] || '';
    const starts = tk.startsWith('*'), ends = tk.endsWith('*');
    if (starts) on = true;
    s.className = on ? 'acc' : '';
    if (ends) on = false;
  });
}
function text(parent, str, cls, style = '') {
  const e = make(`<div class="abs ${cls}" style="${style}">${words(str)}</div>`, parent);
  accentRuns(e, str);
  return { e, w: qa(e, '.w > span') };
}
// masked word reveal
function reveal(tx, t, inAt, outAt = Infinity, stagger = 0.04) {
  tx.w.forEach((e, j) => {
    const ch = [{ at: inAt + j * stagger, to: 0, p: 'heavy' }];
    if (outAt !== Infinity) ch.push({ at: outAt + j * 0.015, to: -120, p: 'snappy' });
    e.style.transform = `translateY(${track(t, 120, ch).toFixed(2)}%)`;
  });
}
function phone(parent, inner) {
  return make(`<div class="abs phone"><div class="scr"><div class="sbar"><span>9:41</span><span>●●●</span></div><div class="notch"></div>${inner}</div></div>`, parent);
}
// pop for UI elements (scale + rise), origin set in CSS
function pop(e, t, a, from = 0.6, rise = 20) {
  const k = spring(t - a, 'snappy');
  e.style.transform = `translateY(${((1 - k) * rise).toFixed(2)}px) scale(${lerp(from, 1, k).toFixed(4)})`;
  e.style.opacity = clamp((t - a) / 0.06, 0, 1).toFixed(3);
}
function makeTouch(parent) {
  return { dot: make(`<div class="abs touch"></div>`, parent), rip: make(`<div class="abs ripple"></div>`, parent) };
}
function touch(tc, t, x, y, inAt, press, leave, ripColor = '#fff') {
  const s = track(t, 0, [
    { at: inAt, to: 1, p: 'snappy' }, { at: press, to: 0.78, p: 'snappy' },
    { at: press + 0.1, to: 1, p: 'snappy' }, { at: leave, to: 0, p: 'snappy' },
  ]);
  const px = go(t, inAt, x + 120, x) + go(t, leave, 0, 120);
  const py = go(t, inAt, y + 200, y) + go(t, leave, 0, 180);
  place(tc.dot, px, py, 84, 84, Math.max(0, s), 0, clamp(s * 4, 0, 1));
  tc.rip.style.borderColor = ripColor;
  place(tc.rip, x, y, 100, 100, go(t, press, 0.3, 2.4), 0, t > press ? 0.6 * (1 - lin(t, press, press + 0.45)) : 0);
}
function typeInto(field, str, t, a, dur, nextAt) {
  const n = Math.round(clamp((t - a) / dur, 0, 1) * str.length);
  q(field, '.tx').textContent = str.slice(0, n);
  const focus = t >= a - 0.1 && t < nextAt - 0.06;
  field.style.borderColor = focus ? '#176B52' : '#E8E3D9';
  q(field, '.caret').style.opacity = focus && Math.floor((t - a) * 4) % 2 === 0 ? '1' : '0';
}

// ---------- screens (phone contents) ----------
const SCREEN_CHAT = `<div class="pg"><div class="bar"><div class="av">PS</div><div>Priya S.<div class="sub">Active now</div></div></div>
  <div class="msgs"><div class="msg in">Hi! Is the truffle cake available?</div><div class="msg out">Yes! ₹1,250 for 1 kg 🎂</div>
  <div class="msg in want">I want this 😍</div>
  <div class="lb"><div class="top"><div class="rc">RC</div><div><div style="font-weight:800;font-size:24px">Ravi Cakes</div><div class="sub">Checkout link · PayPerDM</div></div></div>
  <div class="bd"><div class="it">Chocolate truffle cake · 1 kg</div><div class="am disp">₹1,250</div><div class="ur">🔗 payperdm.com/c/RC1042</div><div class="bt">Pay securely →</div></div></div>
  <div class="dl">Delivered ✓✓</div></div></div>`;
const SCREEN_CHECKOUT = `<div class="pg co"><div class="top"><div class="shop">Ravi Cakes</div><div class="sec">🔒 Secure checkout</div></div>
  <div class="sum"><div><b>Chocolate truffle cake</b><span>1 kg · Qty 1</span></div><div class="p">₹1,250</div></div>
  <div class="lab">Full name</div><div class="in"><span class="tx"></span><span class="caret"></span></div>
  <div class="lab">Phone (WhatsApp)</div><div class="in"><span class="tx"></span><span class="caret"></span></div>
  <div class="lab">Delivery address</div><div class="in tall"><span class="tx"></span><span class="caret"></span></div>
  <div class="tot"><span>Total</span><span>₹1,250</span></div>
  <div class="pay"><div class="lbl la">Pay ₹1,250</div><div class="lbl lb2"><span class="vck">✓</span>Payment verified</div></div></div>`;
const SCREEN_ORDER = `<div class="pg"><div class="bar">← Order #RC-1042</div><div class="od">
  <div class="eb">New paid order</div><div class="am disp">₹1,250</div><div class="badge"><span class="vck">✓</span>Payment verified</div>
  <div class="r"><div class="k">Buyer</div><div class="v">Priya Sharma</div></div>
  <div class="r"><div class="k">Phone</div><div class="v">+91 98450 43210</div></div>
  <div class="r"><div class="k">Deliver to</div><div class="v">12, 4th Cross, Indiranagar, Bengaluru 560038</div></div>
  <div class="r"><div class="k">Item</div><div class="v">Chocolate truffle cake · 1 kg</div></div>
  <div class="r"><div class="k">Status</div><div class="v"><span class="pill">Ready to Pack</span></div></div></div></div>`;
const STEPS = [['Ready to Pack', 'Order confirmed'], ['Packed', 'Boxed and labelled'], ['Shipped', 'Tracking link shared'], ['Delivered', 'Handed to Priya']];
const SCREEN_STATUS = `<div class="pg"><div class="bar">← Order #RC-1042</div><div class="tl"><h3>Order status</h3><div class="ids">Priya Sharma · ₹1,250 · Paid</div>
  ${STEPS.map(([n, s], i) => `<div class="st"><div class="dot"><div class="fill">✓</div></div>${i < 3 ? '<div class="ln2"><i></i></div>' : ''}<div class="n">${n}</div><div class="s">${s}</div></div>`).join('')}
  </div></div>`;
const SCREEN_TRACK = `<div class="notif"><div class="ic">💬</div><div><b>Ravi Cakes</b><span class="tm">now</span><p>Your order is on the way! Track it here: payperdm.com/t/RC1042</p></div></div>
  <div class="pg trk"><div class="shop"><div class="lg">P</div>Ravi Cakes</div>
  <div class="card"><div class="ey">Order #RC-1042</div>
    <div class="big disp"><span class="w"><span>Shipped</span></span><span class="w"><span style="color:#176B52">Delivered</span></span></div>
    <div class="eta">Chocolate truffle cake · 1 kg</div>
    <div class="prog"><i></i>${[0, 1, 2, 3].map((i) => `<span class="pd" style="left:${(i / 3) * 100}%"></span>`).join('')}</div>
    <div class="pls"><span>Ready</span><span>Packed</span><span>Shipped</span><span>Delivered</span></div></div>
  <div class="item"><span>Paid</span><span>₹1,250 ✓</span></div></div>`;
const SCREEN_DASH = `<div class="pg" style="background:#FBFAF6;height:1134px"><img src="assets/dashboard.png" style="width:572px;display:block"></div>
  <div class="sheetDim"></div>
  <div class="sheet"><div class="grab"></div><h4><span class="vck">✓</span>Checkout link ready</h4>
    <div class="cardx"><div style="font-size:24px;font-weight:700;color:#52625B">Chocolate truffle cake · 1 kg</div><div class="disp" style="font-size:56px;margin-top:4px">₹1,250</div>
    <div class="lnk">🔗 payperdm.com/c/RC1042</div></div>
    <div class="btns"><div style="background:#F1EDE3">Copy link</div><div style="background:#176B52;color:#fff">Share</div></div></div>`;

// ---------- shots ----------
const shots = SHOTS.map(([start, id, bg], i) => {
  const el = make(`<div class="shot" style="background:${BG[bg]}"></div>`, stage);
  return { start, end: SHOTS[i + 1]?.[0] ?? DURATION, id, bg, el, seek: () => {} };
});
const S = Object.fromEntries(shots.map((s) => [s.id, s]));
const rnd = mulberry32(7);

// 1. marquee ------------------------------------------------------------
{
  const s = S.marquee;
  const mkRow = (items, y, green) => {
    const html = [0, 1, 2].map(() => items.map((m, i) => `<div class="chip${green(i) ? ' g' : ''}">${m}</div>`).join('')).join('');
    const e = make(`<div class="abs row">${html}</div>`, s.el);
    return { e, y };
  };
  const rows = [
    mkRow(ROW_A, 130, (i) => i % 3 === 2),
    mkRow(ROW_B, 836, (i) => i % 4 === 1),
    mkRow(ROW_C, 300, (i) => i % 3 === 0),
    mkRow([...ROW_A].reverse(), 666, (i) => i % 3 === 1),
  ];
  const box = make(`<div class="abs capbox"></div>`, s.el);
  const c1 = text(s.el, 'Your DMs bring the *orders.*', 'head onlight center', 'font-size:104px');
  const c2 = text(s.el, 'Then they get *buried.*', 'head onlight center', 'font-size:104px');
  s.seek = (t) => {
    rows.forEach((r, i) => {
      const dir = i % 2 ? 1 : -1;
      const extra = i >= 2 ? 1 : 0;
      const v = 230 + i * 30 + 220 * lin(t, T.buried, T.buried + 0.01) * 0; // constant drift
      let x = dir * (v * t + 520 * spring(t - T.buried, 'default') + 380 * (t > T.buried ? t - T.buried : 0));
      const base = dir < 0 ? -200 : -4200;
      // the two extra rows slide in when the chat gets crowded
      const slide = extra ? (1 - spring(t - (T.buried + (i - 2) * 0.08), 'default')) * (dir < 0 ? 2200 : -2200) : 0;
      r.e.style.transform = `translate(${(base + x + slide).toFixed(1)}px, ${r.y}px)`;
      r.e.style.visibility = extra && t < T.buried ? 'hidden' : 'visible';
    });
    const bw = track(t, 1220, [{ at: T.buried, to: 1080, p: 'default' }]);
    place(box, 960, 540, bw, 200, 1, 0, 1);
    box.style.width = bw + 'px';
    box.style.height = '200px';
    at(c1.e, 0, 470); at(c2.e, 0, 470);
    reveal(c1, t, -0.12, T.buried - 0.08, 0.05);
    reveal(c2, t, T.buried, Infinity, 0.05);
  };
}

// 2. ring ----------------------------------------------------------------
{
  const s = S.ring;
  const items = [
    ['📍 Flat 4B, Indiranagar', ''], ['Paid ✅', 'g'], ['Name? Priya', ''], ['₹1,250 · UPI screenshot', 's'], ['Tracking??', ''],
    ['Order confirmed?', 'g'], ['Wait, new address', ''], ['COD?', 's'], ['Did you get my payment?', ''], ['Size M?', 'g'], ['Shipped?', ''], ['Pincode 560038', 's'],
  ];
  const cards = items.map(([m, c], i) => ({ e: make(`<div class="abs chip ${c}" style="font-size:40px">${m}</div>`, s.el), a0: (i / items.length) * Math.PI * 2, r: (rnd() - 0.5) * 14 }));
  const tx = make(`<div class="abs head onlight center" style="font-size:96px"><span class="t1"></span><span class="acc t2"></span><span class="caret" style="height:80px;width:6px;background:#13895F"></span></div>`, s.el);
  const A = "There's a ", B = 'cleaner way.';
  let sizes = null;
  s.seek = (t, lt) => {
    if (!sizes) sizes = cards.map((c) => [c.e.offsetWidth, c.e.offsetHeight]);
    cards.forEach((c, i) => {
      const k = spring(lt - i * 0.025, 'snappy');
      const ang = c.a0 + 0.42 * lt;
      const pull = spring(t - (T.ringIn + i * 0.012), 'default');
      const x = 960 + Math.cos(ang) * 760 * (1 - pull);
      const y = 540 + Math.sin(ang) * 360 * (1 - pull);
      place(c.e, x, y, sizes[i][0], sizes[i][1], lerp(0.4, 1, k) * lerp(1, 0.05, pull), c.r * (1 - pull), clamp(lt / 0.05, 0, 1) * (1 - lin(pull, 0.8, 1)));
    });
    const full = A + B;
    const n = Math.round(clamp((lt - 0.08) / 0.85, 0, 1) * full.length);
    q(tx, '.t1').textContent = full.slice(0, Math.min(n, A.length));
    q(tx, '.t2').textContent = n > A.length ? full.slice(A.length, n) : '';
    q(tx, '.caret').style.opacity = Math.floor(lt * 5) % 2 === 0 || n < full.length ? '1' : '0';
    const ts = go(t, T.ringIn + 0.1, 1, 1.12, 'heavy');
    tx.style.transform = `translate(0px, 478px) scale(${ts.toFixed(4)})`;
  };
}

// 3. meet ----------------------------------------------------------------
{
  const s = S.meet;
  const e = make(`<div class="abs disp ondeep center" style="font-size:560px;line-height:1;top:150px">${'meet'.split('').map((c) => `<span style="display:inline-block">${c}</span>`).join('')}</div>`, s.el);
  const ls = qa(e, 'span');
  s.seek = (t, lt) => {
    ls.forEach((l, i) => {
      const x = track(lt, 1500 + i * 120, [{ at: -0.1 + i * 0.035, to: 0, p: 'heavy' }, { at: 0.55 + i * 0.025, to: -2100, p: 'snappy' }]);
      l.style.transform = `translateX(${x.toFixed(1)}px)`;
    });
  };
}

// 4. logo ----------------------------------------------------------------
function lockup(parent, size, onDark) {
  const g = make(`<div class="abs" style="display:flex;align-items:center;height:${size}px">
    <div class="logoSq" style="width:${size}px;height:${size}px;font-size:${size * 0.62}px;background:${onDark ? '#fff' : '#176B52'};color:${onDark ? '#176B52' : '#fff'};flex:none">P</div>
    <div class="mask" style="overflow:hidden;height:${size * 1.2}px;flex:none"><div class="wm disp" style="width:max-content;padding-right:0.08em;font-size:${size * 0.78}px;line-height:${size * 1.2}px;white-space:nowrap;padding-left:${size * 0.22}px;color:${onDark ? '#fff' : '#0B2F25'}">PayPerDM</div></div></div>`, parent);
  return { g, sq: q(g, '.logoSq'), mask: q(g, '.mask'), wm: q(g, '.wm'), size };
}
function seekLockup(L, t, popAt, slideAt, cy) {
  const wmW = L.wm.offsetWidth;
  const k = spring(t - popAt, 'heavy');
  const m = spring(t - slideAt, 'heavy') * wmW;
  L.mask.style.width = m.toFixed(1) + 'px';
  L.wm.style.transform = `translateX(${(m - wmW).toFixed(1)}px)`;
  const total = L.size + m;
  L.sq.style.transform = `scale(${lerp(0.3, 1, k).toFixed(4)}) rotate(${((1 - k) * -20).toFixed(2)}deg)`;
  L.sq.style.opacity = clamp((t - popAt) / 0.05, 0, 1);
  L.g.style.transform = `translate(${(960 - total / 2).toFixed(1)}px, ${(cy - L.size / 2).toFixed(1)}px)`;
}
{
  const s = S.logo;
  const L = lockup(s.el, 210, true);
  const tag = text(s.el, 'Checkout + order tracking for *DM sellers*', 'onlight center', 'font-size:44px;font-weight:700;color:#CFE9DC');
  q(tag.e, '.acc') && qa(tag.e, '.acc').forEach((a) => (a.style.color = '#8FF0C0'));
  s.seek = (t) => {
    seekLockup(L, t, 5.6, T.logoSlide, 500);
    at(tag.e, 0, 660);
    reveal(tag, t, 6.3, Infinity, 0.035);
  };
}

// 5. hero ----------------------------------------------------------------
{
  const s = S.hero;
  const ph = phone(s.el, SCREEN_CHECKOUT);
  const f = qa(ph, '.in');
  ['Priya Sharma', '+91 98450 43210', '12, 4th Cross, Indiranagar, Bengaluru 560038'].forEach((v, i) => (q(f[i], '.tx').textContent = v));
  qa(ph, '.caret').forEach((c) => (c.style.opacity = 0));
  q(ph, '.pay').style.background = '#DFF5EA';
  q(ph, '.la').style.opacity = 0;
  q(ph, '.lb2').style.color = '#0F5A44';
  const tx = text(s.el, 'Turn chat orders into / *paid, trackable orders.*', 'head ondeep', 'font-size:92px');
  s.seek = (t, lt) => {
    const y = track(lt, 1700, [{ at: 0, to: 700 }]);
    const r = track(lt, -24, [{ at: 0, to: -12 }]);
    place(ph, 560, y, 600, 1220, 0.86, r, 1);
    at(tx.e, 960, 380);
    reveal(tx, t, 7.0, Infinity, 0.045);
  };
}

// 6. who -----------------------------------------------------------------
{
  const s = S.who;
  const label = text(s.el, 'Built for', 'onlight center', 'font-size:48px;font-weight:700;color:#52625B');
  const ws = WHO.map((w) => text(s.el, w, 'disp onlight center', 'font-size:176px;line-height:1'));
  const last = text(s.el, 'anyone who sells in *DMs.*', 'disp onlight center', 'font-size:150px;line-height:1');
  s.seek = (t) => {
    at(label.e, 0, 330);
    reveal(label, t, 8.4, T.whoLast - 0.02);
    ws.forEach((w, i) => {
      at(w.e, 0, 430);
      reveal(w, t, T.whoWords[i], T.whoWords[i + 1] ?? T.whoLast, 0.03);
    });
    at(last.e, 0, 440);
    reveal(last, t, T.whoLast, Infinity, 0.05);
  };
}

// 7. create (real dashboard) ---------------------------------------------
{
  const s = S.create;
  const tx = text(s.el, 'Create a *checkout link*', 'head ondeep center', 'font-size:96px');
  const ph = phone(s.el, SCREEN_DASH);
  const dim = q(ph, '.sheetDim'), sheet = q(ph, '.sheet');
  const tc = makeTouch(s.el);
  const PS = 0.98, PCX = 960, PCY = 935;
  // button centre in screen px: image x (51+337)/2, y (273+329)/2 scaled 572/558, + status bar 58
  const k = 572 / 558, bx = k * 194, by = 58 + k * 301;
  s.seek = (t, lt) => {
    at(tx.e, 0, 120);
    reveal(tx, t, 11.62, Infinity, 0.04);
    const y = track(lt, 1800, [{ at: 0, to: PCY }]);
    place(ph, PCX, y, 600, 1220, PS, 0, 1);
    const sk = spring(t - T.linkSheet, 'default');
    sheet.style.transform = `translateY(${lerp(1192, 470, sk).toFixed(1)}px)`;
    dim.style.opacity = (0.999 * clamp((t - T.linkSheet) / 0.15, 0, 1)).toFixed(3);
    touch(tc, t, PCX + (14 + bx - 300) * PS, PCY + (14 + by - 610) * PS, T.tapCreate - 0.3, T.tapCreate, T.tapCreate + 0.3);
  };
}

// 8. send ----------------------------------------------------------------
{
  const s = S.send;
  const tx = text(s.el, 'Send it / *in the chat.*', 'head ondeep', 'font-size:124px');
  const ph = phone(s.el, SCREEN_CHAT);
  const want = q(ph, '.want'), lb = q(ph, '.lb'), dl = q(ph, '.dl');
  s.seek = (t, lt) => {
    at(tx.e, 170, 330);
    reveal(tx, t, 13.25, Infinity, 0.05);
    const y = track(lt, 1800, [{ at: 0, to: 720 }]);
    const r = track(lt, 20, [{ at: 0, to: 9 }]);
    place(ph, 1380, y, 600, 1220, 0.86, r, 1);
    pop(want, t, T.wantThis);
    pop(lb, t, T.linkBubble, 0.5, 30);
    pop(dl, t, T.delivered, 1, 10);
  };
}

// 9. no website ----------------------------------------------------------
{
  const s = S.noweb;
  const tx = text(s.el, '*No website* needed.', 'disp onlight center', 'font-size:170px;line-height:1');
  s.seek = (t) => { at(tx.e, 0, 440); reveal(tx, t, 14.8, Infinity, 0.06); };
}

// 10. checkout -----------------------------------------------------------
{
  const s = S.checkout;
  const a = text(s.el, 'Buyer / *enters details*', 'head ondeep', 'font-size:124px');
  const b = text(s.el, 'and / *pays.*', 'head ondeep', 'font-size:124px');
  const ph = phone(s.el, SCREEN_CHECKOUT);
  const f = qa(ph, '.in');
  const vals = ['Priya Sharma', '+91 98450 43210', '12, 4th Cross, Indiranagar, Bengaluru 560038'];
  const pay = q(ph, '.pay'), la = q(ph, '.la'), lb = q(ph, '.lb2');
  const tc = makeTouch(s.el);
  const PS = 0.86, PCX = 1400, PCY = 700;
  s.seek = (t, lt) => {
    at(a.e, 170, 330); at(b.e, 170, 330);
    reveal(a, t, 15.62, T.pays - 0.05, 0.05);
    reveal(b, t, T.pays, Infinity, 0.05);
    const y = track(lt, 1800, [{ at: 0, to: PCY }]);
    const r = track(lt, -18, [{ at: 0, to: -6 }]);
    place(ph, PCX, y, 600, 1220, PS, r, 1);
    vals.forEach((v, i) => typeInto(f[i], v, t, T.typing[i], 0.3, T.typing[i + 1] ?? T.payTap));
    const pp = track(t, 1, [{ at: T.payTap, to: 0.94, p: 'snappy' }, { at: T.payTap + 0.1, to: 1, p: 'snappy' }]);
    const vk = spring(t - T.verified, 'snappy');
    pay.style.transform = `scale(${pp.toFixed(4)})`;
    pay.style.background = mix('#176B52', '#DFF5EA', vk);
    la.style.color = '#fff'; lb.style.color = '#0F5A44';
    const aA = swapAlpha(t, -1, T.verified, 0), aB = swapAlpha(t, T.verified, Infinity, 0.05);
    la.style.opacity = aA; la.style.transform = `translateY(${(-(1 - aA) * 30).toFixed(1)}px)`;
    lb.style.opacity = aB; lb.style.transform = `translateY(${((1 - aB) * 30).toFixed(1)}px)`;
    // pay button position (rotated phone): approximate by phone transform
    const rr = (r * Math.PI) / 180;
    const lx = (14 + 286 - 300) * PS, ly = (14 + 58 + pay.offsetTop + 50 - 610) * PS;
    touch(tc, t, PCX + lx * Math.cos(rr) - ly * Math.sin(rr), y + lx * Math.sin(rr) + ly * Math.cos(rr), T.payTap - 0.28, T.payTap, T.payTap + 0.3);
  };
}

// 11. verified -----------------------------------------------------------
{
  const s = S.verified;
  const badge = make(`<div class="abs" style="width:200px;height:200px;border-radius:50%;background:#176B52;color:#fff;font-size:110px;font-weight:800;display:flex;align-items:center;justify-content:center">✓</div>`, s.el);
  const tx = text(s.el, 'Paid. *Verified.*', 'disp onlight', 'font-size:170px;line-height:1');
  let tw = 0;
  s.seek = (t, lt) => {
    if (!tw) tw = tx.e.offsetWidth;
    const total = 200 + 60 + tw, x0 = 960 - total / 2;
    const k = spring(lt, 'snappy');
    place(badge, x0 + 100, 540, 200, 200, lerp(0.2, 1, k), (1 - k) * -40, clamp(lt / 0.04, 0, 1));
    at(tx.e, x0 + 260, 455);
    reveal(tx, t, 18.85, Infinity, 0.07);
  };
}

// 12. order --------------------------------------------------------------
{
  const s = S.order;
  const tx = text(s.el, 'Every order, *in one place.*', 'head ondeep center', 'font-size:96px');
  const ph = phone(s.el, SCREEN_ORDER);
  const rows = qa(ph, '.r'), badge = q(ph, '.badge');
  s.seek = (t, lt) => {
    at(tx.e, 0, 120);
    reveal(tx, t, 19.62, Infinity, 0.04);
    const y = track(lt, 1900, [{ at: 0, to: 935 }]);
    place(ph, 960, y, 600, 1220, 0.98, 0, 1);
    pop(badge, t, 20.05, 0.6, 0);
    rows.forEach((r, i) => pop(r, t, 20.2 + i * 0.09, 0.96, 24));
  };
}

// 13. ship ---------------------------------------------------------------
{
  const s = S.ship;
  const ph = phone(s.el, SCREEN_STATUS);
  const steps = qa(ph, '.st');
  const tx = text(s.el, 'Pack. Ship. / *Deliver.*', 'head ondeep', 'font-size:132px');
  const sub = text(s.el, 'Update the order status in one tap.', 'ondeep', 'font-size:44px;font-weight:600;color:#CFE9DC');
  s.seek = (t, lt) => {
    const y = track(lt, 1800, [{ at: 0, to: 700 }]);
    const r = track(lt, -22, [{ at: 0, to: -10 }]);
    place(ph, 540, y, 600, 1220, 0.86, r, 1);
    const P = 1 + track(t, 0, T.steps.map((a, i) => ({ at: a, to: i + 1, p: 'snappy' })));
    steps.forEach((st, i) => {
      const d = clamp(P - i, 0, 1);
      q(st, '.fill').style.transform = `scale(${d.toFixed(4)})`;
      q(st, '.n').style.color = mix('#9AA39E', '#0B2F25', d);
      const l = q(st, '.ln2 i');
      if (l) l.style.transform = `scaleY(${clamp(P - i - 1, 0, 1).toFixed(4)})`;
    });
    at(tx.e, 1040, 300);
    // one word per beat, synced with the steps
    tx.w.forEach((e, j) => e.style.transform = `translateY(${track(t, 120, [{ at: T.steps[j], to: 0, p: 'heavy' }]).toFixed(2)}%)`);
    at(sub.e, 1046, 610);
    reveal(sub, t, 22.8, Infinity, 0.03);
  };
}

// 14. no more tracking ---------------------------------------------------
{
  const s = S.notrack;
  const tx = text(s.el, 'No more *“Tracking?”* DMs.', 'disp onlight center', 'font-size:150px;line-height:1');
  s.seek = (t) => { at(tx.e, 0, 450); reveal(tx, t, 23.6, Infinity, 0.05); };
}

// 15. track --------------------------------------------------------------
{
  const s = S.track;
  const tx = text(s.el, 'Your buyer / *tracks it.*', 'head ondeep', 'font-size:124px');
  const ph = phone(s.el, SCREEN_TRACK);
  const notif = q(ph, '.notif');
  const big = qa(ph, '.big .w > span');
  const fill = q(ph, '.prog i'), pds = qa(ph, '.pd');
  s.seek = (t, lt) => {
    at(tx.e, 170, 330);
    reveal(tx, t, 24.45, Infinity, 0.05);
    const y = track(lt, 1800, [{ at: 0, to: 720 }]);
    const r = track(lt, 20, [{ at: 0, to: 8 }]);
    place(ph, 1380, y, 600, 1220, 0.86, r, 1);
    const ny = track(t, -260, [{ at: T.notify, to: 0 }, { at: T.deliveredTrack + 0.35, to: -260, p: 'snappy' }]);
    notif.style.transform = `translateY(${ny.toFixed(1)}px)`;
    big[0].style.transform = `translateY(${track(t, 0, [{ at: T.deliveredTrack, to: -120, p: 'snappy' }]).toFixed(1)}%)`;
    big[1].style.transform = `translateY(${track(t, 120, [{ at: T.deliveredTrack + 0.03, to: 0, p: 'heavy' }]).toFixed(1)}%)`;
    const P = 2 + track(t, 0, [{ at: T.deliveredTrack, to: 1, p: 'snappy' }]);
    fill.style.transform = `scaleX(${(P / 3).toFixed(4)})`;
    pds.forEach((d, i) => {
      const k = clamp(P - i + 1, 0, 1);
      d.style.borderColor = mix('#D8D3C7', '#176B52', k);
      d.style.background = mix('#FFFFFF', '#176B52', k);
    });
  };
}

// 16. features -----------------------------------------------------------
{
  const s = S.features;
  const label = text(s.el, 'Everything after *“I want this”*', 'onlight center', 'font-size:48px;font-weight:700;color:#52625B');
  const ws = FEATURES.map((w) => text(s.el, w, 'disp onlight center', 'font-size:190px;line-height:1'));
  const dots = make(`<div class="abs dots">${FEATURES.map(() => '<i><b></b></i>').join('')}</div>`, s.el);
  const bars = qa(dots, 'b');
  s.seek = (t) => {
    at(label.e, 0, 300);
    reveal(label, t, 26.4, Infinity, 0.04);
    ws.forEach((w, i) => { at(w.e, 0, 410); reveal(w, t, T.features[i], T.features[i + 1] ?? Infinity, 0.03); });
    dots.style.transform = `translate(${960 - (4 * 60 + 3 * 18) / 2}px, 680px)`;
    bars.forEach((b, i) => (b.style.transform = `scaleX(${spring(t - T.features[i], 'snappy').toFixed(4)})`));
  };
}

// 17. from → to ----------------------------------------------------------
{
  const s = S.from;
  const lines = [
    text(s.el, 'From *“I want this”*', 'disp ondeep center', 'font-size:160px;line-height:1'),
    text(s.el, 'to *paid*', 'disp ondeep center', 'font-size:160px;line-height:1'),
    text(s.el, 'to *delivered*', 'disp ondeep center', 'font-size:160px;line-height:1'),
    text(s.el, 'it all happens on *PayPerDM*', 'disp ondeep center', 'font-size:132px;line-height:1'),
  ];
  s.seek = (t) => lines.forEach((l, i) => { at(l.e, 0, 450); reveal(l, t, T.from[i], T.from[i + 1] ?? Infinity, 0.04); });
}

// 18. end ----------------------------------------------------------------
{
  const s = S.end;
  const L = lockup(s.el, 170, false);
  const sub = text(s.el, 'Turn chat orders into paid, trackable orders.', 'onlight center', 'font-size:50px;font-weight:700;color:#52625B');
  const row = make(`<div class="abs" style="display:flex;align-items:center;gap:40px"><div class="cta">Start free <span>→</span></div><div class="url" style="font-size:46px;font-weight:800">payperdm.com</div></div>`, s.el);
  const cta = q(row, '.cta'), url = q(row, '.url');
  const note = text(s.el, 'No website needed.', 'onlight center', 'font-size:36px;font-weight:700;color:#13895F');
  const tc = makeTouch(s.el);
  let rw = 0;
  s.seek = (t) => {
    seekLockup(L, t, 32.8, 32.95, 380);
    at(sub.e, 0, 520);
    reveal(sub, t, T.endSub, Infinity, 0.025);
    if (!rw) rw = row.offsetWidth;
    const k = spring(t - T.endCta, 'snappy');
    const press = track(t, 1, [{ at: T.ctaTap, to: 0.94, p: 'snappy' }, { at: T.ctaTap + 0.1, to: 1, p: 'snappy' }]);
    row.style.transform = `translate(${960 - rw / 2}px, ${(650 + (1 - k) * 40).toFixed(1)}px)`;
    cta.style.transform = `scale(${(lerp(0.6, 1, k) * press).toFixed(4)})`;
    cta.style.opacity = clamp((t - T.endCta) / 0.06, 0, 1);
    pop(url, t, T.endCta + 0.12, 0.9, 20);
    at(note.e, 0, 820);
    reveal(note, t, 33.7, Infinity, 0.04);
    touch(tc, t, 960 - rw / 2 + cta.offsetWidth / 2 + 30, 708, T.ctaTap - 0.3, T.ctaTap, T.ctaTap + 0.4, '#176B52');
  };
}

// ---------- frame ----------
function seek(t) {
  for (const s of shots) {
    const on = t >= s.start && t < s.end;
    s.el.style.display = on ? 'block' : 'none';
    if (on) s.seek(t, t - s.start);
  }
}
window.DURATION = DURATION;
window.ready = document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {})))).then(() => { seek(0); return true; });
window.seek = seek;
const params = new URLSearchParams(location.search);
window.ready.then(() => {
  if (params.has('t')) seek(parseFloat(params.get('t')));
  if (params.has('play')) {
    const t0 = performance.now();
    const loop = () => { seek(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
});
