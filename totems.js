// ULTRARABBIT techno totem glyphs, shared by /burrow and /mirror.
// Modules built from the logo's geometry: angular ears, stacked arrows, goggles with red rings,
// dome, mouth discs, vents, chevrons, diamonds.
const totemPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ------------------------------------------------------------------ */
/* Techno totems: stacked glyphs built from the logo's geometry        */
/* ------------------------------------------------------------------ */

// Each module draws in a box 1 unit wide and `h` tall, in the logo's thick white strokes with red
// accents. Everything moves off o.t (time), o.ph (0..1 through the current beat), o.e (that
// module's spring kick, 0..1) and o.beat, so the motion stays locked to the music.
const TOT_LW = .075, TOT_GAP = .1, TOT_SPACER = .55;
const eOut = (p) => 1 - (1 - p) ** 3;

function tPoly(g, pts, close = true) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (close) g.closePath();
}
function tLine(g, x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
function tMirror(g, fn) { fn(); g.save(); g.translate(1, 0); g.scale(-1, 1); fn(); g.restore(); }
function tRing(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); }
// While a piece traces on its solid fills wait; TFILL.off skips them (set by the caller).
const TFILL = { off: false };
function tFill(g) { if (!TFILL.off) g.fill(); }
function tDot(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); tFill(g); }
function tDashed(g, o, pattern, offset, fn) {
  if (!o.full) return;
  g.save(); g.setLineDash(pattern); g.lineDashOffset = offset; fn(); g.restore();
}

const EAR = [[.1, .9], [.1, .06], [.45, .4], [.45, .9]];

const MODS = {
  EARS: { h: .95, draw(g, o) {
    const hinge = o.e * .22 + Math.sin(o.t * 2.2) * .03;
    tMirror(g, () => {
      g.save();
      g.translate(.27, .9); g.rotate(-hinge); g.translate(-.27, -.9);
      g.strokeStyle = o.c;
      tPoly(g, EAR); g.stroke();
      tLine(g, .17, .9, .17, .97);
      const k = .5 + Math.sin(o.t * 3) * .07 + o.e * .18;
      g.translate(.27, .55); g.scale(k, k); g.translate(-.27, -.55);
      g.lineWidth = TOT_LW * .5; g.strokeStyle = o.e > .3 ? o.a : o.c;
      tPoly(g, EAR); g.stroke();
      g.restore();
    });
  } },
  ARROWS: { h: .52, draw(g, o) {
    g.save();
    g.beginPath(); g.rect(-.1, 0, 1.2, .52); g.clip();
    const lift = eOut(o.ph) * .16, w = .13 * (1 + o.e * .35);
    for (let k = 0; k < 4; k++) {
      const y = .03 + k * .16 + .16 - lift;
      g.fillStyle = (k + o.beat) % 3 === 0 ? o.a : o.c;
      tPoly(g, [[.5, y], [.5 - w, y + .13], [.5 + w, y + .13]]); tFill(g);
    }
    g.restore();
  } },
  DOME: { h: .58, draw(g, o) {
    g.strokeStyle = o.c; g.fillStyle = o.c;
    g.beginPath(); g.arc(.5, .56, .36, Math.PI, 0); g.stroke();
    g.lineWidth = TOT_LW * .4;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + ((i / 9 + o.t * .05) % 1) * Math.PI;
      g.strokeStyle = i === o.beat % 9 ? o.a : o.c;
      tLine(g, .5 + Math.cos(a) * .42, .56 + Math.sin(a) * .42, .5 + Math.cos(a) * .48, .56 + Math.sin(a) * .48);
    }
    g.strokeStyle = o.c;
    tDashed(g, o, [.04, .035], -o.t * .25, () => { g.beginPath(); g.arc(.5, .56, .24, Math.PI, 0); g.stroke(); });
    g.lineWidth = TOT_LW;
    const sh = .15 + o.e * .14;
    tPoly(g, [[.5, .17 - sh], [.41, .17], [.59, .17]]); tFill(g);
    tMirror(g, () => tLine(g, .1, .2, .1, .56));
  } },
  CHEVRON: { h: .34, draw(g, o) {
    const amp = 1 - o.e * .55;
    const pts = (dy) => [[.08, .05], [.29, .29], [.5, .1], [.71, .29], [.92, .05]]
      .map(([x, y], i) => [x, .05 + (y - .05) * amp + Math.sin(o.t * 5 + i * 1.3) * .015 + dy]);
    if (o.e > .12) {
      g.strokeStyle = o.a; g.lineWidth = TOT_LW * .4;
      tPoly(g, pts(o.e * .12), false); g.stroke();
      tPoly(g, pts(-o.e * .08), false); g.stroke();
      g.lineWidth = TOT_LW;
    }
    g.strokeStyle = o.c;
    tPoly(g, pts(0), false); g.stroke();
  } },
  GOGGLES: { h: .5, draw(g, o) {
    g.strokeStyle = o.c;
    tPoly(g, [[.1, .1], [.9, .1], [.98, .2], [.98, .38], [.9, .46], [.1, .46], [.02, .38], [.02, .2]]); g.stroke();
    g.lineWidth = TOT_LW * .45;
    tMirror(g, () => {
      for (let k = 0; k < 3; k++) { g.strokeStyle = k === o.beat % 3 ? o.a : o.c; tLine(g, .045 + k * .022, .22, .045 + k * .022, .34); }
    });
    g.strokeStyle = o.c;
    const w1 = .07 + Math.sin(o.t * 4) * .025, w2 = .05 + Math.cos(o.t * 4) * .02;
    tLine(g, .5 - w1, .18, .5 + w1, .18); tLine(g, .5 - w2, .24, .5 + w2, .24);
    for (const [x, dir] of [[.3, 1], [.7, -1]]) {
      g.strokeStyle = o.a; g.lineWidth = TOT_LW * .8;
      tRing(g, x, .29, .145);
      g.strokeStyle = o.c; g.lineWidth = TOT_LW * .25;
      tDashed(g, o, [.035, .03], o.t * .3 * dir, () => tRing(g, x, .29, .19));
      g.fillStyle = o.c;
      tDot(g, x + o.look * .065, .29 + o.e * .02, .048 * (1 + o.e * .5));
    }
  } },
  EYE: { h: .46, draw(g, o) {
    g.strokeStyle = o.a; g.lineWidth = TOT_LW * .9;
    tRing(g, .5, .23, .19);
    g.strokeStyle = o.c; g.lineWidth = TOT_LW * .4;
    for (let i = 0; i < 4; i++) {
      const a = o.t * .8 + i * Math.PI / 2;
      tLine(g, .5 + Math.cos(a) * .235, .23 + Math.sin(a) * .235, .5 + Math.cos(a) * .275, .23 + Math.sin(a) * .275);
    }
    g.lineWidth = TOT_LW * .25;
    tDashed(g, o, [.03, .025], -o.t * .4, () => tRing(g, .5, .23, .135));
    g.fillStyle = o.c;
    tDot(g, .5 + o.look * .09, .23, .065 * (1 + o.e * .6));
    g.lineWidth = TOT_LW * .6;
    tMirror(g, () => tLine(g, .03, .23, .2 - o.e * .07, .23));
  } },
  VISOR: { h: .22, draw(g, o) {
    g.strokeStyle = o.c;
    const seg = (a, b, y, p) => {
      const gx = a + (b - a) * p, gw = .05;
      if (gx - gw > a) tLine(g, a, y, gx - gw, y);
      if (gx + gw < b) tLine(g, gx + gw, y, b, y);
      g.fillStyle = o.a; g.fillRect(gx - .015, y - .03, .03, .06);
    };
    const p = (o.t * .7) % 1;
    seg(.28, .72, .05, p); seg(.35, .65, .17, 1 - p);
  } },
  MOUTH: { h: .62, draw(g, o) {
    g.strokeStyle = o.c; g.fillStyle = o.c; g.lineWidth = TOT_LW * .6;
    tRing(g, .5, .31, .29);
    g.lineWidth = TOT_LW * .2;
    tDashed(g, o, [.05, .04], o.t * .2, () => tRing(g, .5, .31, .335));
    const j = o.e * .06 + Math.sin(o.t * 3) * .008;
    g.beginPath(); g.arc(.5, .27 - j, .18, Math.PI, 0); g.closePath(); tFill(g);
    g.beginPath(); g.arc(.5, .36 + j, .18, 0, Math.PI); g.closePath(); tFill(g);
    if (j > .02) { g.strokeStyle = o.a; g.lineWidth = TOT_LW * .45; tLine(g, .36, .315, .64, .315); }
  } },
  VENT: { h: .42, draw(g, o) {
    const shape = [[.04, .06], [.24, .06], [.33, .2], [.24, .34], [.04, .34]];
    tMirror(g, () => {
      g.strokeStyle = o.c; g.lineWidth = TOT_LW * .6;
      tPoly(g, shape); g.stroke();
      g.save();
      tPoly(g, shape); g.clip();
      g.lineWidth = TOT_LW * .35;
      const off = (o.t * .25) % .07;
      for (let x = -.15 + off; x < .4; x += .07) tLine(g, x, .34, x + .12, .06);
      g.restore();
    });
    g.save();
    g.translate(.5, .2); g.rotate((o.beat + eOut(o.ph)) * Math.PI * 2 / 3);
    g.fillStyle = o.a;
    tPoly(g, [[0, -.09], [.08, .05], [-.08, .05]]); tFill(g);
    g.restore();
  } },
  DIAMOND: { h: .42, draw(g, o) {
    const spin = (o.beat + eOut(o.ph)) * Math.PI / 2;
    g.save(); g.translate(.5, .21); g.rotate(spin * .5);
    g.strokeStyle = o.c;
    tPoly(g, [[0, -.17], [.17, 0], [0, .17], [-.17, 0]]); g.stroke();
    g.restore();
    g.save(); g.translate(.5, .21); g.rotate(-spin);
    g.fillStyle = o.a;
    tPoly(g, [[0, -.07], [.07, 0], [0, .07], [-.07, 0]]); tFill(g);
    g.restore();
    g.fillStyle = o.c;
    for (let i = 0; i < 4; i++) {
      const a = o.t * 1.5 + i * Math.PI / 2;
      tDot(g, .5 + Math.cos(a) * .3, .21 + Math.sin(a) * .17, .018 * (1 + o.e));
    }
  } },
};
const MOD_SWAP = {
  EARS: ['DOME', 'CHEVRON'], DOME: ['EARS', 'CHEVRON'], CHEVRON: ['EARS', 'DOME', 'VISOR'], ARROWS: ['CHEVRON', 'VISOR'],
  GOGGLES: ['EYE'], EYE: ['GOGGLES', 'DIAMOND'], VISOR: ['CHEVRON', 'ARROWS'],
  MOUTH: ['VENT', 'DIAMOND'], VENT: ['MOUTH', 'DIAMOND'], DIAMOND: ['EYE', 'VENT'],
};

const newMod = (k) => ({ k, flip: 0, pop: 0, inv: false, sp: 0, sv: 0, kickAt: -1, kickStr: 0, draw: 1, go: true });

function makeTotem() {
  const ks = [totemPick(['EARS', 'EARS', 'DOME', 'CHEVRON'])];
  if (Math.random() < .6) ks.push('ARROWS');
  ks.push(totemPick(['GOGGLES', 'GOGGLES', 'EYE']));
  if (Math.random() < .5) ks.push('VISOR');
  ks.push(totemPick(['MOUTH', 'MOUTH', 'VENT', 'DIAMOND']));
  if (Math.random() < .35) ks.push(totemPick(['VENT', 'DIAMOND', 'CHEVRON']));
  return ks.map(newMod);
}
const totemH = (tt) => tt.reduce((a, m) => a + MODS[m.k].h + TOT_GAP, 0) - TOT_GAP;
