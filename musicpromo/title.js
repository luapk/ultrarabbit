// ULTRARABBIT arcade title screen: the entry gate. Drawn on a 480x270 canvas in the three-colour arcade
// palette and shown with hard pixels. The logo head, the katakana wordmark (ウルトララビット) and the
// コインをいれてね prompt are pre-rendered sprites in /musicpromo/title/. Clicking inserts a coin: CREDIT
// ticks to 01 with a coin chime while the page starts the song (the gate fades over half a second).
(() => {
'use strict';
const W = 480, H = 270, RED = '#ff1a2e', WHITE = '#ffffff', BLACK = '#000000';
const cv = document.getElementById('titleCv');
if (!cv) return;
const x = cv.getContext('2d');
cv.width = W; cv.height = H;
x.imageSmoothingEnabled = false;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const img = (src) => { const i = new Image(); i.src = src; return i; };
const LOGO = img('/musicpromo/title/logo.png'), TITLE = img('/musicpromo/title/title.png'), JP = img('/musicpromo/title/jp.png');
let GLINT = null;

// Latin pixel text (Press Start 2P), white or red on a black backing so it reads over the grid.
const PS2P = new FontFace('PS2P', 'url(/musicpromo/ps2p.woff2)');
PS2P.load().then((f) => document.fonts.add(f)).catch(() => {});
const TX = {};
function pix(text, col) {
  const key = text + col; if (TX[key]) return TX[key];
  if (PS2P.status !== 'loaded') return null;
  const g0 = mk(4, 4).getContext('2d'); g0.font = "8px 'PS2P'";
  const c = mk(Math.ceil(g0.measureText(text).width) + 8, 14), g = c.getContext('2d');
  g.fillStyle = BLACK; g.fillRect(0, 0, c.width, c.height);
  g.font = "8px 'PS2P'"; g.textBaseline = 'top'; g.fillStyle = col; g.fillText(text, 4, 3);
  const im = g.getImageData(0, 0, c.width, c.height), D = im.data, [r, gg, b] = col === RED ? [255, 26, 46] : [255, 255, 255];
  for (let i = 0; i < D.length; i += 4) { const on = D[i] + D[i + 1] + D[i + 2] > 200; D[i] = on ? r : 0; D[i + 1] = on ? gg : 0; D[i + 2] = on ? b : 0; D[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  return (TX[key] = c);
}
const put = (c, px, py, align = 'c') => { if (c) x.drawImage(c, Math.round(align === 'c' ? px - c.width / 2 : align === 'r' ? px - c.width : px), Math.round(py)); };

const STARS = Array.from({ length: 140 }, (_, i) => [((Math.sin(i * 127.1) * 43758.5453 % 1) + 1) % 1, ((Math.sin(i * 311.7) * 9631.17 % 1) + 1) % 1, ((Math.sin(i * 74.7) * 5333.3 % 1) + 1) % 1]);
const HOR = 196, LOGO_Y = 10, LOGO_H = 180;
// mode: 'insert' (INSERT COIN), 'credit' (coin in, PRESS START blinking), 'start' (PRESS START flashing fast).
const ST = { credit: 0, mode: 'insert', modeAt: 0, run: true, base: 0 };

function render(t) {
  x.fillStyle = BLACK; x.fillRect(0, 0, W, H);
  for (const [sx, sy, z] of STARS) {
    const zz = ((z - t * .125) % 1 + 1) % 1, k = 1 / (.15 + zz * 1.6);
    const px = Math.round(W / 2 + (sx - .5) * W * k * .55), py = Math.round(90 + (sy - .5) * 200 * k * .55);
    if (py < 0 || py >= HOR - 2 || px < 0 || px >= W) continue;
    x.fillStyle = zz < .5 ? WHITE : RED; x.fillRect(px, py, zz < .2 ? 2 : 1, 1);
  }
  // striped arcade sunset behind the head
  const sr = 58;
  for (let yy = -sr; yy <= 0; yy++) {
    const half = Math.floor(Math.sqrt(sr * sr - yy * yy)), band = -yy;
    if (!(band < 26 && ((band + Math.floor(t * 7)) % 7 < 2 + Math.floor((26 - band) / 9)))) { x.fillStyle = RED; x.fillRect(W / 2 - half, HOR + yy, half * 2, 1); }
  }
  // scrolling grid floor
  x.fillStyle = BLACK; x.fillRect(0, HOR, W, H - HOR);
  x.fillStyle = RED; x.fillRect(0, HOR, W, 1);
  for (let i = 0; i < 14; i++) { const p = (i + (t * 1.6) % 1) / 14; x.fillRect(0, Math.round(HOR + Math.pow(p, 2.2) * (H - HOR)), W, 1); }
  for (let i = -20; i <= 20; i++) { const x0 = W / 2 + i * 6, x1 = W / 2 + i * 60; for (let y = HOR; y < H; y++) x.fillRect(Math.round(x0 + (x1 - x0) * (y - HOR) / (H - HOR)), y, 1, 1); }
  // logo head and the katakana wordmark across its band, with a glint every 4 s
  const bob = Math.round(Math.sin(t * Math.PI / 2) * 1.5);
  if (LOGO.complete && LOGO.naturalWidth) x.drawImage(LOGO, Math.round(W / 2 - LOGO.width / 2), LOGO_Y + bob);
  if (TITLE.complete && TITLE.naturalWidth) {
    const tw = TITLE.width, th = TITLE.height, tx = Math.round(W / 2 - tw / 2), ty = Math.round(LOGO_Y + bob + LOGO_H * .79 - th / 2);
    x.drawImage(TITLE, tx, ty);
    if (!GLINT) { GLINT = mk(tw, th); const g = GLINT.getContext('2d'); g.drawImage(TITLE, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = WHITE; g.fillRect(0, 0, tw, th); }
    const gp = (t % 4) / .7;
    if (gp < 1) { const gx = Math.round(gp * (tw + 30)) - 15; for (let k = 0; k < 7; k++) { const sx = gx + k - Math.floor(k / 2); if (sx >= 0 && sx < tw) x.drawImage(GLINT, sx, 0, 3, th, tx + sx, ty, 3, th); } }
  }
  // arcade HUD
  put(pix('000000', WHITE), 16, 17, 'l'); put(pix('13371337', WHITE), W / 2, 17); put(pix('000000', WHITE), W - 16, 17, 'r');
  put(pix('1UP', RED), 16, 3, 'l'); put(pix('HI-SCORE', RED), W / 2, 3); put(pix('2UP', RED), W - 16, 3, 'r');
  if (ST.mode === 'start') {
    if (((t - ST.modeAt) * 8) % 1 < .6) put(pix('PRESS START', WHITE), W / 2, 212);
  } else if (ST.mode === 'credit') {
    if ((t % 1) < .62) put(pix('PRESS START', WHITE), W / 2, 212);
  } else if ((t % 1) < .62) {
    put(pix('INSERT COIN', WHITE), W / 2, 212);
    if (JP.complete && JP.naturalWidth) { x.fillStyle = BLACK; x.fillRect(Math.round(W / 2 - JP.width / 2) - 3, 225, JP.width + 6, JP.height + 2); x.drawImage(JP, Math.round(W / 2 - JP.width / 2), 226); }
  }
  put(pix(`CREDIT ${String(ST.credit).padStart(2, '0')}`, WHITE), W - 8, H - 14, 'r');
  put(pix('© 2026 ULTRARABBIT', RED), W / 2, H - 14);
  x.fillStyle = 'rgba(0,0,0,.16)';
  for (let y = 0; y < H; y += 2) x.fillRect(0, y, W, 1);
}

// Coin chime: two quick square-wave notes (the classic arcade credit sound).
function chime() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [[988, 0], [1319, .07]].forEach(([f, at]) => {
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = 'square'; o.frequency.value = f;
      gn.gain.setValueAtTime(.0001, ac.currentTime + at); gn.gain.exponentialRampToValueAtTime(.12, ac.currentTime + at + .005);
      gn.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + at + (at ? .35 : .07));
      o.connect(gn).connect(ac.destination); o.start(ac.currentTime + at); o.stop(ac.currentTime + at + .4);
    });
    setTimeout(() => ac.close(), 800);
  } catch (e) { /* no audio */ }
}

const t0 = performance.now();
const now = () => (performance.now() - t0) / 1000;
window.burrowTitle = {
  // The coin: CREDIT 01, chime, and the gate's own loop hands over to the film (frame() below).
  coin() { ST.credit = 1; ST.mode = 'credit'; ST.base = now(); chime(); setTimeout(() => { ST.run = false; }, 700); },
  // The film opens on this screen: draw it at song time t ('credit' or 'start') and return the canvas.
  frame(t, mode, modeAt = 0) { ST.credit = 1; ST.mode = mode; ST.modeAt = ST.base + modeAt; render(ST.base + t); return cv; },
  render,
};
(function loop() { if (ST.run) { render(now()); requestAnimationFrame(loop); } })();
})();
