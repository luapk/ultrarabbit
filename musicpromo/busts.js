// ULTRARABBIT music promo: the 3D wireframe busts of Eva and Andy.
//  - Intro (0:00 to 0:14.74): logo fades up, glitches, glows out into an alien HUD built from the
//    techno-totem glyphs, while both heads "load" left and right.
//  - Chant scenes in the final third: Eva over golden rectangles, then Andy over golden spirals, each
//    with a fast orbit that spirals into the head.
// Driven by window.burrowBusts.update(songTime, beats, ct) from the page; returns true while on screen.
(() => {
'use strict';
const PHI = (1 + Math.sqrt(5)) / 2;
const eOut = (p) => 1 - (1 - p) ** 3;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const COLS = ['#ff2d2d', '#000000', '#ffffff'];

const INFLECT = 14.849;                     // bar 9: the intro's second phrase, where the page cuts to the glitched logo
// Each orbit is planned over its full 10 bars (a..b) but only its second half is shown (from `on`),
// so it opens already halfway in and keeps the same ending.
const EVA = { a: 148.955, on: 157.132, b: 165.310 };   // bars 91-101; shown 96-101
const ANDY = { a: 165.310, on: 173.488, b: 181.664 };  // bars 101-111, ending into the 3:02.6 "ultrarabbit"; shown 106-111
// The loader starts the moment the visitor enters (the logo now comes after it, on the page's #cut layer).
const LOGO = { fadeIn: -3, glitch: -2, glow: 0 };
const LOADED = { eva: 11.508, andy: 12.708, module: 13.008 };
// Layout maths from the old match cut to the band clip (/ULTRARABBIT.mp4, 720x1280, shown object-fit: cover at
// object-position 50% 20%). Each head settles on its place in that clip's first frame. Anchored on the
// sunglasses: gy is the glasses' height in the model, ty the top of the head (crown, not ears), neck
// where the head is cut off; (vx, vy) the glasses in clip pixels, vt the crown's clip y; ry the turn.
const CLIP = { w: 720, h: 1280, ox: .5, oy: .2 };
const MATCH = {
  andy: { gy: .54, ty: .9, neck: .2, vx: 160, vy: 245, vt: 30, ry: .1 },
  eva: { gy: .2, ty: .47, neck: -.12, vx: 562, vy: 505, vt: 300, ry: -.15 },
};
// The loader shows the two as full-length low-poly wireframes (andy/eva-body.glb, from the B&W duo
// still), standing on one ground line at their real relative heights, then pushes in so their heads land
// on the band clip exactly as before. gy / ty here are the glasses and crown in each body model.
const MATCH_BODY = {
  andy: { ...MATCH.andy, gy: .836, ty: .95, neck: .62 },
  eva: { ...MATCH.eva, gy: .595, ty: .705, neck: .47 },
};
const BODY_H = { andy: 1, eva: 659 / 669 };   // Eva is a little shorter (her ear tips included)
const MCAM = { fov: 30, d: 8 };
const SETTLE = 14.008;
function matchHead(name, t) {
  const M = MATCH_BODY[name];
  const s = Math.max(W / CLIP.w, H / CLIP.h), ox = (W - CLIP.w * s) * CLIP.ox, oy = (H - CLIP.h * s) * CLIP.oy;
  const sx = ox + M.vx * s, sy = oy + M.vy * s;
  const wpp = 2 * MCAM.d * Math.tan(MCAM.fov * Math.PI / 360) / H;       // world units per screen px at z = 0
  const scale = ((M.vy - M.vt) * s * wpp) / (M.ty - M.gy);
  const match = { x: (sx - W / 2) * wpp, y: (H / 2 - sy) * wpp - M.gy * scale, scale };
  // While loading they sit comfortably in their own halves, the same size; once MODULE LOADED is up
  // they push in to the match pose, arriving at SETTLE.
  // Home: full length, feet on a shared ground line, Andy left and Eva right.
  const hx = (name === 'andy' ? .3 : .7) * W, ground = H * .8, tall = Math.min(H * .6, W * .9);
  const hs = (tall * wpp / 1.9) * BODY_H[name];
  const home = { x: (hx - W / 2) * wpp, y: (H / 2 - ground) * wpp + .95 * hs, scale: hs };
  const k = eInOut(clamp((t - LOADED.module) / (SETTLE - LOADED.module), 0, 1));
  // Move the glasses (not the model's centre) in a straight line, so the face stays on screen while
  // the scale grows: the push-in heads for the face.
  const sc = home.scale * (match.scale / home.scale) ** k;
  const gy = home.y + M.gy * home.scale + ((match.y + M.gy * match.scale) - (home.y + M.gy * home.scale)) * k;
  return { x: home.x + (match.x - home.x) * k, y: gy - M.gy * sc, scale: sc };
}
const eInOut = (p) => p * p * (3 - 2 * p);

const canvas = document.getElementById('bust3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// Rendered at twice the screen's pixel density (capped) and scaled down by the browser: WebGL lines can't
// be thinner than one pixel, so this halves the wireframe's on-screen line width.
renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 3));
const bg = document.createElement('canvas'), g = bg.getContext('2d');
const bgTex = new THREE.CanvasTexture(bg);
// Overlay above the 3D (MODULE LOADED), same pixel grid as the background canvas.
const ov = document.createElement('canvas'), og = ov.getContext('2d');
ov.className = 'layer';
Object.assign(ov.style, { width: '100%', height: '100%', zIndex: 2, display: 'none', pointerEvents: 'none' });
canvas.after(ov);
const OV = { on: false };
const scene = new THREE.Scene();
scene.background = bgTex;
const cam = new THREE.PerspectiveCamera(42, 1, .002, 100);
const res = new THREE.Vector2();

// Wire colour is chosen per pixel from the background behind it (black over light, white over dark
// or red). Above uReveal the mesh isn't loaded yet; a red line marks the loading edge.
const wireMat = () => new THREE.ShaderMaterial({
  uniforms: { uBg: { value: bgTex }, uRes: { value: res }, uReveal: { value: 2 }, uLo: { value: -.95 }, uHi: { value: .95 } },
  vertexShader: 'varying float vY; void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform sampler2D uBg; uniform vec2 uRes; uniform float uReveal, uLo, uHi; varying float vY;
    void main() {
      if (vY < uLo) discard;   // the intro shows heads only: nothing below the neck
      float h = (vY - uLo) / (uHi - uLo);
      if (h > uReveal) discard;
      vec3 b = texture2D(uBg, gl_FragCoord.xy / uRes).rgb;
      vec3 c = vec3(dot(b, vec3(.299, .587, .114)) > .6 ? 0. : 1.);
      if (uReveal < 1.5 && h > uReveal - .03) c = vec3(1., .18, .18);
      gl_FragColor = vec4(c, 1.);
    }`,
  wireframe: true });

const meshes = {};
const loader = new THREE.GLTFLoader(), draco = new THREE.DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
loader.setDRACOLoader(draco);
function load(name, url, cropBase) {
  loader.load(url, (gl) => {
    let geo = gl.scene.children[0].geometry.toNonIndexed();
    geo.computeBoundingBox();
    const b0 = geo.boundingBox, c0 = b0.getCenter(new THREE.Vector3()), k = 1.9 / (b0.max.y - b0.min.y);
    geo.translate(-c0.x, -c0.y, -c0.z); geo.scale(k, k, k);
    if (cropBase) {
      // Drop the plinth: every triangle dipping into the bottom `cropBase` of the bust.
      const p = geo.attributes.position.array, keep = [], floor = -.95 + 1.9 * cropBase;
      for (let i = 0; i < p.length; i += 9) {
        if (Math.min(p[i + 1], p[i + 4], p[i + 7]) < floor) continue;
        for (let j = 0; j < 9; j++) keep.push(p[i + j]);
      }
      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
    }
    const m = new THREE.Mesh(geo, wireMat());
    m.visible = false;
    scene.add(m);
    meshes[name] = m;
  });
}
load('eva', '/musicpromo/eva-wire.glb', 0);
load('andy', '/musicpromo/andy-wire.glb', .14);
load('evaBody', '/musicpromo/eva-body.glb', 0);
load('andyBody', '/musicpromo/andy-body.glb', 0);

const logo = new Image();
logo.src = '/logo.jpg';

/* ---------------- sizing ---------------- */
let W = 0, H = 0;
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  if (w === W && h === H) return;
  W = w; H = h;
  renderer.setSize(W, H, false);
  renderer.getDrawingBufferSize(res);
  // The background is drawn at up to 1280px wide; the wire samples it by screen fraction.
  const k = Math.min(1, 1280 / W);
  bg.width = Math.round(W * k); bg.height = Math.round(H * k);
  ov.width = bg.width; ov.height = bg.height;
  cam.aspect = W / H; cam.updateProjectionMatrix();
  golden = null;
}

/* ---------------- backgrounds ---------------- */
let golden = null;
function goldenSquares(w, h) {
  const h0 = Math.min(h, w / PHI), w0 = h0 * PHI;
  const build = (x, y, ww, hh, i0, n) => {
    const sq = [];
    for (let i = i0; i < i0 + n; i++) {
      const side = (i & 1) ? ww : hh, q = ((i % 4) + 4) % 4;
      if (q === 0) { sq.push({ x, y, s: side, cx: x + side, cy: y + side, a0: Math.PI, i }); x += side; ww -= side; }
      else if (q === 1) { sq.push({ x, y, s: side, cx: x, cy: y + side, a0: Math.PI * 1.5, i }); y += side; hh -= side; }
      else if (q === 2) { sq.push({ x: x + ww - side, y, s: side, cx: x + ww - side, cy: y, a0: 0, i }); ww -= side; }
      else { sq.push({ x, y: y + hh - side, s: side, cx: x + ww, cy: y + hh - side, a0: Math.PI / 2, i }); hh -= side; }
    }
    return { sq, eye: { x: x + ww / 2, y: y + hh / 2 } };
  };
  // The oversized starting rectangle is a whole turn (four squares, phi^4) out, so the construction
  // starts on the same side it would at i = 0 and every square lands where the spiral needs it.
  const x0 = (w - w0) / 2, y0 = (h - h0) / 2, eye = build(x0, y0, w0, h0, 0, 40).eye, kk = PHI ** 4;
  return { eye, sq: build(eye.x + (x0 - eye.x) * kk, eye.y + (y0 - eye.y) * kk, w0 * kk, h0 * kk, -4, 36).sq };
}

// Eva: golden rectangles zooming into the spiral by phi and a quarter turn per bar.
function drawGolden(beats) {
  const w = bg.width, h = bg.height;
  if (!golden) golden = goldenSquares(w, h);
  const { eye, sq } = golden, gen = Math.floor(beats / 4), u = (beats / 4) % 1;
  g.save();
  g.fillStyle = COLS[(gen + 15) % 3]; g.fillRect(0, 0, w, h);
  g.translate(eye.x, eye.y); g.rotate(-u * Math.PI / 2); g.scale(PHI ** u, PHI ** u); g.translate(-eye.x, -eye.y);
  const lw = 2 / PHI ** u;
  for (const q of sq) {
    if (q.s < 2) break;
    g.fillStyle = COLS[(q.i + gen + 15) % 3]; g.fillRect(q.x, q.y, q.s, q.s);
    g.strokeStyle = COLS[(q.i + gen + 16) % 3]; g.lineWidth = lw;
    g.beginPath(); g.arc(q.cx, q.cy, q.s, q.a0, q.a0 + Math.PI / 2); g.stroke();
  }
  g.restore();
}

// Andy: six interlocking golden-spiral arms, turning on the beat and zooming out by phi each bar.
const SB = Math.log(PHI) / (Math.PI / 2), ARMS = 6;
function drawSpirals(beats) {
  const w = bg.width, h = bg.height, cx = w / 2, cy = h / 2;
  const beat = Math.floor(beats), ph = beats - beat;
  const rot = (beat + eOut(Math.min(1, ph * 3))) * (Math.PI * 2 / ARMS) * .5;
  const scale = PHI ** -((beats / 4) % 1) * 2 * (w / 960);
  const shift = Math.floor(beats / 4);
  const pt = (th, o) => { const rr = Math.exp(SB * th) * scale; return [cx + Math.cos(th + o) * rr, cy + Math.sin(th + o) * rr]; };
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < ARMS; k++) {
    const o0 = rot + k * Math.PI * 2 / ARMS, o1 = rot + (k + 1) * Math.PI * 2 / ARMS;
    g.beginPath();
    for (let th = -8; th <= 22; th += .05) { const [x, y] = pt(th, o0); th === -8 ? g.moveTo(x, y) : g.lineTo(x, y); }
    for (let th = 22; th >= -8; th -= .05) { const [x, y] = pt(th, o1); g.lineTo(x, y); }
    g.closePath();
    g.fillStyle = COLS[(k + shift) % 3]; g.fill();
  }
}

/* ---------------- UI sound effects (synthesised, on the page's audio context) ---------------- */
let sfxBus = null;
function sfx() {
  const ctx = window.burrowAudioCtx;
  if (!ctx) return null;
  if (!sfxBus) { sfxBus = ctx.createGain(); sfxBus.gain.value = .55; sfxBus.connect(ctx.destination); }
  return ctx;
}
function tone(freq, dur = .06, type = 'square', vol = .12, at = 0, slideTo = 0) {
  const ctx = sfx(); if (!ctx) return;
  const t0 = ctx.currentTime + at, o = ctx.createOscillator(), gn = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(vol, t0 + .004);
  gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(gn); gn.connect(sfxBus); o.start(t0); o.stop(t0 + dur + .02);
}
function noise(dur = .6, vol = .2, from = 4000, to = 300, q = 4) {
  const ctx = sfx(); if (!ctx) return;
  const t0 = ctx.currentTime, n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  // Crackly digital noise: bursts of white noise gated at a stuttering rate.
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (Math.floor(i / 900) % 3 ? 1 : .15);
  const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), gn = ctx.createGain();
  src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = q;
  bp.frequency.setValueAtTime(from, t0); bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gn.gain.setValueAtTime(vol, t0); gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  src.connect(bp); bp.connect(gn); gn.connect(sfxBus); src.start(t0);
}
const SFX = {
  glitch: () => { noise(.75, .32, 6000, 400, 3); tone(90, .3, 'sawtooth', .08, 0, 45); },
  glow: () => { tone(180, .55, 'sawtooth', .07, 0, 1800); noise(.55, .12, 800, 7000, 1.5); },
  blip: (i) => tone(900 + (i % 5) * 230, .045, 'square', .05),
  tick: () => tone(3200, .018, 'square', .025),
  loaded: () => { tone(880, .12, 'triangle', .13); tone(1320, .2, 'triangle', .13, .09); },
  module: () => { tone(660, .12, 'square', .07); tone(990, .12, 'square', .07, .1); tone(1320, .35, 'triangle', .12, .2); },
};

/* ---------------- intro: logo, glitch, glow, HUD ---------------- */
const GLYPHS = ['EARS', 'ARROWS', 'GOGGLES', 'EYE', 'MOUTH', 'DIAMOND', 'VENT', 'CHEVRON', 'DOME', 'VISOR'];
const glyphMods = GLYPHS.map((k) => ({ ...newMod(k) }));
const ALIEN = 'ᚢᚱᛒᛏᛉᛗᚦᚨᛃᛇ◇◆△▽⊕⊗⌖⌬⍜⍟';
const alienStr = (n, seed) => Array.from({ length: n }, (_, i) => ALIEN[Math.floor(Math.abs(Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % ALIEN.length)]).join('');

function drawLogo(t) {
  const w = bg.width, h = bg.height;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  if (!logo.complete || !logo.naturalWidth) return;
  const s = Math.min(w / logo.naturalWidth, h / logo.naturalHeight) * .78;
  const lw = logo.naturalWidth * s, lh = logo.naturalHeight * s, lx = (w - lw) / 2, ly = (h - lh) / 2;
  if (t < LOGO.fadeIn) {
    g.globalAlpha = eOut(t / LOGO.fadeIn);
    g.drawImage(logo, lx, ly, lw, lh);
    g.globalAlpha = 1;
  } else if (t < LOGO.glitch) {
    // Quick glitch: horizontal slices jump sideways, with red bars and dropouts.
    const f = Math.floor(t * 24);
    const rnd = (k) => Math.abs(Math.sin(f * 91.3 + k * 17.7)) % 1;
    for (let i = 0; i < 14; i++) {
      const sy = (i / 14) * logo.naturalHeight, sh = logo.naturalHeight / 14;
      const off = (rnd(i) - .5) * lw * (rnd(i + 50) > .55 ? .22 : .02);
      if (rnd(i + 99) > .9) continue;
      g.drawImage(logo, 0, sy, logo.naturalWidth, sh, lx + off, ly + (i / 14) * lh, lw, lh / 14 + 1);
    }
    g.fillStyle = '#ff2d2d';
    for (let i = 0; i < 3; i++) if (rnd(i + 200) > .4) g.fillRect(0, h * rnd(i + 300), w, h * .012 * (1 + rnd(i + 400) * 3));
  } else {
    // Glow: the logo blows out to white, then the white fades to reveal the HUD underneath.
    const k = clamp((t - LOGO.glitch) / (LOGO.glow - LOGO.glitch), 0, 1);
    g.drawImage(logo, lx, ly, lw, lh);
    g.fillStyle = `rgba(255,255,255,${Math.min(1, k * 1.6)})`; g.fillRect(0, 0, w, h);
  }
}

function drawHud(t, beats) {
  const w = bg.width, h = bg.height, u = Math.min(w, h) / 540;
  const beat = Math.floor(beats), ph = beats - beat;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  // Fade in from the white glow.
  const fade = 0;
  const m = 22 * u;
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(1, u);
  g.strokeRect(m, m, w - m * 2, h - m * 2);
  // Red corner brackets.
  g.strokeStyle = '#ff2d2d'; g.lineWidth = 3 * u;
  const L = 34 * u;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]]) {
    g.beginPath(); g.moveTo(x + dx * L, y); g.lineTo(x, y); g.lineTo(x, y + dy * L); g.stroke();
  }
  // Header readouts.
  g.fillStyle = '#fff'; g.font = `600 ${13 * u}px "Fira Code", ui-monospace, monospace`; g.textBaseline = 'top';
  g.textAlign = 'left'; g.fillText('ULTRARABBIT // SUBJECT LOAD', m + 14 * u, m + 12 * u);
  g.textAlign = 'right'; g.fillText(`SYS·146.75 BPM · ${alienStr(6, beat)}`, w - m - 14 * u, m + 12 * u);
  // Alien glyph text rows, re-rolling on each beat.
  g.fillStyle = 'rgba(255,255,255,.45)'; g.font = `${12 * u}px "Fira Code", ui-monospace, monospace`; g.textAlign = 'left';
  for (let i = 0; i < 3; i++) g.fillText(alienStr(w < h ? 14 : 26, beat * 7 + i), m + 14 * u, m + 34 * u + i * 15 * u);
  // One techno-totem piece animating in each corner; each swaps to the next glyph every bar and
  // they take turns lighting red on the beat.
  const gs = 52 * u, bar = Math.floor(beats / 4);
  const corners = [
    [m + 16 * u, m + 88 * u, 1], [w - m - 16 * u - gs, m + 88 * u, -1],
    [m + 16 * u, h - m - 70 * u - gs * .75, 1], [w - m - 16 * u - gs, h - m - 70 * u - gs * .75, -1],
  ];
  corners.forEach(([x, y, flip], i) => {
    const mod = glyphMods[(((i * 3 + bar) % glyphMods.length) + glyphMods.length) % glyphMods.length], on = i === beat % 4;
    g.save(); g.translate(x + (flip < 0 ? gs : 0), y); g.scale(gs * flip, gs);
    g.lineWidth = TOT_LW;
    MODS[mod.k].draw(g, { c: on ? '#ff2d2d' : 'rgba(255,255,255,.8)', a: '#ff2d2d', t, ph, e: 0, look: Math.sin(t * 3 + i), beat, full: true });
    g.restore();
  });
  // Loading bars and labels under each head.
  // Eva finishes at 0:11.4, Andy at 0:12.6, leaving room for MODULE LOADED before the cut.
  const prog = (delay, end) => clamp((t - LOGO.glow - delay) / (end - LOGO.glow - delay), 0, 1);
  // 24 visible steps; never shows 100% until loading has actually finished, so it can't flick back.
  const steps = (p) => (p >= 1 ? 1 : Math.min(23, Math.floor(p * 24)) / 24);
  const pe = steps(prog(0, LOADED.eva)), pa = steps(prog(.8, LOADED.andy));
  const bars = [['SUBJECT 01 · ANDY', .25 * w, pa], ['SUBJECT 02 · EVA', .75 * w, pe]];
  for (const [name, x, p] of bars) {
    const bw = w < h ? w * .38 : Math.min(w * .3, 300 * u), bx = x - bw / 2, by = h - m - 34 * u;
    g.fillStyle = '#fff'; g.font = `600 ${12 * u}px "Fira Code", ui-monospace, monospace`; g.textAlign = 'left';
    g.fillText(name, bx, by - 18 * u);
    g.textAlign = 'right'; g.fillStyle = p >= 1 ? '#ff2d2d' : '#fff';
    g.fillText(p >= 1 ? 'LOADED' : `${Math.round(p * 100)}%`, bx + bw, by - 18 * u);
    g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, u); g.strokeRect(bx, by, bw, 8 * u);
    g.fillStyle = p >= 1 ? '#ff2d2d' : '#fff'; g.fillRect(bx + 2 * u, by + 2 * u, (bw - 4 * u) * p, 4 * u);
  }
  // Both in: MODULE LOADED, flashing on the beat until the cut. Drawn on the overlay canvas so it
  // sits on top of everything, wireframes included.
  og.clearRect(0, 0, ov.width, ov.height);
  // Until then, one big load counter over the wireframes in the arcade headline type.
  // Both drawn centred, pulsing on the beat; never wider than the frame.
  const centre = (c, y, pop) => {
    if (!c) return;
    const fit = Math.min(1, w * .9 / (c.width * c.px));
    og.save(); og.imageSmoothingEnabled = false;
    const cw = c.width * c.px * pop * fit, chh = c.height * c.px * pop * fit;
    og.drawImage(c, (w - cw) / 2, y - chh / 2, cw, chh);
    og.restore();
  };
  const px = Math.max(3, 4.6 * u);
  if (t < LOADED.module) {
    const pc = Math.round((pe + pa) / 2 * 100);
    centre(chunky(`${pc}%`, (w >= h ? 120 : 96) * u, px), h * .5, ph < .12 ? 1.04 : 1);
  } else if (ph < .8) {
    // MODULE LOADED in the same type, punching in on each beat and blinking off just before the next.
    const pop = 1 + Math.exp(-ph * 10) * .08;
    if (w >= h) centre(chunky('MODULE LOADED', 64 * u, px), h * .5, pop);
    else { centre(chunky('MODULE', 64 * u, px), h * .5 - 40 * u, pop); centre(chunky('LOADED', 64 * u, px), h * .5 + 40 * u, pop); }
  }
  if (fade > 0) { g.fillStyle = `rgba(255,255,255,${fade})`; g.fillRect(0, 0, w, h); }
  return [prog(0, LOADED.eva), prog(.8, LOADED.andy), pe, pa];
}

/* ---------------- arcade headline type ("Blood"): heavy, tilted, hard pixels, solid block ---------------- */
// Same look as the arcade HUD headlines: Dela Gothic drawn at low resolution, tilted, extruded into a
// black block with a white keyline, red face, snapped to the palette and blown up with hard pixels.
const DELA = new FontFace('DelaL', 'url(/musicpromo/dela_lat.woff2)');
DELA.load().then((f) => document.fonts.add(f)).catch(() => {});
const CHUNK = {}, CPAL = [[255, 255, 255], [255, 26, 46], [0, 0, 0]];
function chunky(text, size, px) {
  if (DELA.status !== 'loaded') return null;
  const key = `${text}|${Math.round(size)}|${Math.round(px * 10)}`; if (CHUNK[key]) return CHUNK[key];
  const s = size / px, depth = 6, tilt = .2, lw = 1.2, pad = Math.ceil(s * .6) + depth * 2;
  const c = document.createElement('canvas'); let x = c.getContext('2d');
  x.font = `${s}px DelaL`; const tw = x.measureText(text).width;
  c.width = Math.ceil(tw + pad * 2 + s * .4); c.height = Math.ceil(s * 1.5 + pad * 2);
  x = c.getContext('2d'); x.font = `${s}px DelaL`; x.textBaseline = 'middle'; x.lineJoin = 'miter';
  const y0 = c.height / 2, x0 = pad;
  x.setTransform(1, 0, -tilt, 1, tilt * y0, 0);
  for (let d = depth; d >= 1; d--) { x.fillStyle = x.strokeStyle = '#000'; x.lineWidth = lw * 2; x.strokeText(text, x0 + d, y0 + d); x.fillText(text, x0 + d, y0 + d); }
  x.save(); x.globalCompositeOperation = 'destination-over'; x.strokeStyle = '#fff'; x.lineWidth = lw * 3.2;
  for (let d = depth; d >= 0; d--) x.strokeText(text, x0 + d, y0 + d); x.restore();
  x.fillStyle = '#ff1a2e'; x.fillText(text, x0, y0);
  const im = x.getImageData(0, 0, c.width, c.height), D = im.data;
  for (let i = 0; i < D.length; i += 4) {
    if (D[i + 3] < 110) { D[i + 3] = 0; continue; }
    const a = D[i + 3] / 255; let best = 0, bd = 1e9;
    for (let k = 0; k < 3; k++) { const p = CPAL[k], e = (D[i] / a - p[0]) ** 2 + (D[i + 1] / a - p[1]) ** 2 + (D[i + 2] / a - p[2]) ** 2; if (e < bd) { bd = e; best = k; } }
    D[i] = CPAL[best][0]; D[i + 1] = CPAL[best][1]; D[i + 2] = CPAL[best][2]; D[i + 3] = 255;
  }
  x.setTransform(1, 0, 0, 1, 0, 0); x.putImageData(im, 0, 0);
  c.px = px;
  return (CHUNK[key] = c);
}

/* ---------------- intro sound cues: fire when the playhead crosses them (not on seeks) ---------------- */
const SF = { t: -1, beat: -1, pe: 0, pa: 0 };
function introSfx(t, beats, loads) {
  const dt = t - SF.t, beat = Math.floor(beats), [, , pe, pa] = loads;
  const cross = (x) => SF.t < x && t >= x;
  if (dt > 0 && dt < .3) {
    if (cross(LOGO.fadeIn)) SFX.glitch();
    if (cross(LOGO.glitch)) SFX.glow();
    if (t > LOGO.glow) {
      if (beat !== SF.beat) SFX.blip(beat);
      if ((pe > SF.pe && pe < 1) || (pa > SF.pa && pa < 1)) SFX.tick();
      if (pe >= 1 && SF.pe < 1) SFX.loaded();
      if (pa >= 1 && SF.pa < 1) SFX.loaded();
      if (cross(LOADED.module)) SFX.module();
    }
  }
  SF.t = t; SF.beat = beat; SF.pe = pe; SF.pa = pa;
}

/* ---------------- per-frame ---------------- */
function orbitIn(t, beats, a, b, head) {
  const u = clamp((t - a) / (b - a), 0, 1), p = Math.pow(u, 2.2), ph = beats - Math.floor(beats);
  // Tall screens start further out so the whole bust fits the width.
  const d0 = W < H ? 2.6 * Math.min(2, 1.1 / (W / H)) : 2.6;
  const dist = d0 * Math.pow(.02 / d0, p);
  const ang = (beats / 4) * Math.PI * 2 + eOut(ph) * .25;
  const aim = new THREE.Vector3(0, .25, 0).lerp(head, Math.min(1, p * 2));
  const bob = (.35 + Math.sin(beats * .5) * .5) * (1 - p);
  cam.fov = 42; cam.updateProjectionMatrix();
  cam.position.set(aim.x + Math.sin(ang) * dist, aim.y + bob, aim.z + Math.cos(ang) * dist);
  cam.lookAt(aim);
}

let shown = false;
function update(t, beats, live, idle) {
  if (idle && !live) return drawIdle();
  const which = !live ? null
    : t < INFLECT ? 'intro'
    : t < LOGO_END ? 'logo'
    : t >= EVA.on && t < EVA.b ? 'eva'
    : null;   // Andy's chant scene (ANDY) is replaced by the white-world ride (snow.mp4 on the page)
  const on = !!which && !!meshes.eva && !!meshes.andy && (which !== 'intro' || (!!meshes.evaBody && !!meshes.andyBody));
  if (on !== shown) { shown = on; canvas.classList.toggle('on', on); }
  if (on !== OV.on) { OV.on = on; ov.style.display = on ? 'block' : 'none'; }
  if (on) og.clearRect(0, 0, ov.width, ov.height);
  if (on && which === 'logo') { fit(); for (const m of Object.values(meshes)) m.visible = false; drawCalmLogo(t, beats); bgTex.needsUpdate = true; renderer.render(scene, cam); return true; }
  if (!on) return false;
  fit();
  const { eva, andy, evaBody, andyBody } = meshes;
  eva.visible = andy.visible = evaBody.visible = andyBody.visible = false;
  eva.position.set(0, 0, 0); andy.position.set(0, 0, 0);
  eva.rotation.set(0, 0, 0); andy.rotation.set(0, 0, 0);
  eva.material.uniforms.uReveal.value = andy.material.uniforms.uReveal.value = 2;
  if (which === 'eva') {
    drawGolden(beats);
    eva.visible = true;
    orbitIn(t, beats, EVA.a, EVA.b, new THREE.Vector3(0, .38, .02));
  } else if (which === 'andy') {
    drawSpirals(beats);
    andy.visible = true;
    orbitIn(t, beats, ANDY.a, ANDY.b, new THREE.Vector3(0, .5, .05));
  } else {
    let loads = [0, 0, 0, 0];
    if (t < LOGO.glow) drawLogo(t); else loads = drawHud(t, beats);
    introSfx(t, beats, loads);
    if (t >= LOGO.glow) {
      // Full length, side by side, turning as they load, then easing round to face camera and holding
      // there under MODULE LOADED until the cut to the logo.
      evaBody.visible = andyBody.visible = true;
      for (const [name, m, dir] of [['eva', evaBody, 1], ['andy', andyBody, -1]]) {
        const P = matchHead(name, LOADED.module);   // home pose (no push-in)
        m.material.uniforms.uLo.value = -.96; m.material.uniforms.uHi.value = .95;
        m.scale.setScalar(P.scale);
        m.position.set(P.x, P.y, 0);
        // Spin that decelerates to land front-on at SETTLE and holds there.
        const x = Math.max(0, SETTLE - t), f = x > 1 ? x - .5 : x * x / 2;
        m.rotation.y = dir * .9 * f;
      }
      const flick = (p) => (p > 0 && p < 1 && Math.random() < .04 ? p - .08 : p);
      evaBody.material.uniforms.uReveal.value = flick(loads[0]) * 1.02;
      andyBody.material.uniforms.uReveal.value = flick(loads[1]) * 1.02;
      cam.fov = MCAM.fov; cam.updateProjectionMatrix();
      cam.position.set(0, 0, MCAM.d); cam.lookAt(0, 0, 0);
      trackerData(t, [['andy', andyBody, loads[1]], ['eva', evaBody, loads[0]]]);
    }
  }
  if (which !== 'intro') {
    eva.scale.setScalar(1); andy.scale.setScalar(1);
    for (const m of [eva, andy]) { m.material.uniforms.uLo.value = -.95; m.material.uniforms.uHi.value = .95; }
  }
  bgTex.needsUpdate = true;
  renderer.render(scene, cam);
  return true;
}

// After the loader: the ULTRARABBIT logo on black, built in the techno-totem way. It is cut into five
// parts (ears, visor, goggles, word, mouth); one part arrives per beat, first as traced outline, then
// filled, with the totems' little pop and red echo. Once whole, a red scan line sweeps slowly down it.
// Fine CRT scan lines over everything, like the rest of the film.
const LOGO_END = 18.183;
const LOGO_BANDS = [0, .35, .47, .6, .76, 1];          // fractions of the logo's height
const LOGO_BEAT0 = (INFLECT - .130) * 146.75 / 60;    // beat count at the cut-in (on the bar)
let logoKey = null, logoEdge = null, logoRed = null;
function prepLogo() {
  const Wk = 1020, Hk = Math.round(Wk * logo.naturalHeight / logo.naturalWidth);
  const mk = () => { const c = document.createElement('canvas'); c.width = Wk; c.height = Hk; return c; };
  logoKey = mk(); logoEdge = mk(); logoRed = mk();
  const kg = logoKey.getContext('2d'); kg.drawImage(logo, 0, 0, Wk, Hk);
  const im = kg.getImageData(0, 0, Wk, Hk), d = im.data, al = new Float32Array(Wk * Hk);
  // Key the JPEG's near-black background out to transparent.
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const a = clamp((Math.max(d[i], d[i + 1], d[i + 2]) - 40) / 120, 0, 1);
    d[i + 3] = a * 255; al[p] = a;
  }
  kg.putImageData(im, 0, 0);
  // Outline: where the shape's alpha changes (a 2-px edge), drawn in white.
  const eg = logoEdge.getContext('2d'), em = eg.createImageData(Wk, Hk), e = em.data;
  for (let y = 2; y < Hk - 2; y++) for (let x = 2; x < Wk - 2; x++) {
    const p = y * Wk + x, v = al[p];
    const m = Math.min(al[p - 2], al[p + 2], al[p - 2 * Wk], al[p + 2 * Wk]);
    const M = Math.max(al[p - 2], al[p + 2], al[p - 2 * Wk], al[p + 2 * Wk]);
    const edge = clamp((M - m) * 1.6, 0, 1) * (v > .1 || M > .5 ? 1 : 0);
    const q = p * 4; e[q] = e[q + 1] = e[q + 2] = 255; e[q + 3] = edge * 255;
  }
  eg.putImageData(em, 0, 0);
  // A red copy, for the echo and the scan sweep.
  const rg = logoRed.getContext('2d'); rg.drawImage(logoKey, 0, 0);
  rg.globalCompositeOperation = 'source-in'; rg.fillStyle = '#ff2d2d'; rg.fillRect(0, 0, Wk, Hk);
}
// Warp drive behind the logo: a field of tiny stars drifting towards us, then on the lock the drive
// kicks in and they stretch into streaks rushing past. Positions are a pure function of time, so
// seeking lands on the right frame.
const STARS = Array.from({ length: 520 }, (_, i) => {
  const r = (n) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
  const a = r(1) * Math.PI * 2, d = .04 + Math.sqrt(r(2)) * 1.1;
  return { x: Math.cos(a) * d, y: Math.sin(a) * d, z0: r(3), red: r(4) < .14, s: .6 + r(5) * .9 };
});
function warpDist(tt, tk) {
  // Slow drift, then from tk the drive ramps over 0.9 s to full speed.
  const base = .07 * tt, V = 2.4, R = .9;
  if (tt <= tk) return base;
  const u = tt - tk;
  return base + (u < R ? V * u * u / (2 * R) : V * (R / 2 + (u - R)));
}
function drawWarp(t, tk) {
  const w = bg.width, h = bg.height, cx = w / 2, cy = h / 2, f = Math.min(w, h) * .42, u = Math.min(w, h) / 540;
  const tt = Math.max(0, t - INFLECT), D = warpDist(tt, tk), Dp = warpDist(Math.max(0, tt - 1 / 30), tk);
  const fast = clamp((D - Dp) * 30 / 2.4, 0, 1);
  g.lineCap = 'round';
  for (const st of STARS) {
    const z = 1 - ((st.z0 + D) % 1), zp = Math.min(1, z + (D - Dp) * (1 + fast * 1.5));
    if (z < .02) continue;
    const x = cx + st.x / z * f, y = cy + st.y / z * f;
    if (x < -50 || x > w + 50 || y < -50 || y > h + 50) continue;
    const xp = cx + st.x / zp * f, yp = cy + st.y / zp * f;
    const a = clamp((1 - z) * 1.4, 0, 1) * clamp((z - .02) * 20, 0, 1);
    const sz = Math.max(1, st.s * u * (1.6 - z));
    g.strokeStyle = g.fillStyle = st.red ? `rgba(255,45,45,${a})` : `rgba(255,255,255,${a})`;
    if (Math.hypot(x - xp, y - yp) > sz * 1.5) { g.lineWidth = sz; g.beginPath(); g.moveTo(xp, yp); g.lineTo(x, y); g.stroke(); }
    else g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
  }
}

// The logo compiles like a techno totem: its five parts arrive one per beat, stacked with gaps and
// joined by the totems' little connector lines and dots. Each traces on as outline, then fills with
// a pop and a red echo. When the last is in, the gaps snap shut into the whole logo, the warp drive
// kicks in behind it, and from then on it kicks on every beat with the totems' spring ripple.
const LOGO_LOCK = 5, LOGO_SNAP = .7;   // beats: when the stack starts closing, and how long it takes
function drawCalmLogo(t, beats) {
  const w = bg.width, h = bg.height;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const k = beats - LOGO_BEAT0;                                  // beats since the cut-in
  const spb = 60 / 146.75;
  drawWarp(t, (LOGO_LOCK + LOGO_SNAP * .6) * spb);
  if (!logo.complete || !logo.naturalWidth) return;
  if (!logoKey) prepLogo();
  const Wk = logoKey.width, Hk = logoKey.height, nb = LOGO_BANDS.length - 1;
  const GAP = .15;                                               // gap between parts, in logo heights
  const s = Math.min(w / Wk, h / (Hk * (1 + GAP * (nb - 1)))) * .74, lw = Wk * s, lh = Hk * s;
  const close = eInOut(clamp((k - LOGO_LOCK) / LOGO_SNAP, 0, 1)), gap = GAP * lh * (1 - close);
  const totalH = lh + gap * (nb - 1), top = (h - totalH) / 2, mid = h / 2;
  const beat = Math.floor(k), ph = k - beat;
  // Spring ripple down the stack on each beat (only once a part is in).
  const ripple = (i) => { const p = ph - i * .07; return p > 0 ? Math.exp(-p * 9) * Math.sin(p * 26) : 0; };
  const parts = [];
  for (let i = 0; i < nb; i++) {
    const y0 = LOGO_BANDS[i] * Hk, y1 = LOGO_BANDS[i + 1] * Hk, bh = y1 - y0;
    const py = top + y0 * s + gap * i;
    const yc = py + bh * s / 2, dy = k > i + 1 ? -ripple(i) * (yc - mid) * .045 : 0;
    parts.push({ i, y0, bh, py: py + dy, p: k - i });
  }
  // Connectors in the gaps, lit red in turn on the beat, fading as the stack closes.
  if (gap > 1) for (let i = 0; i < nb - 1; i++) {
    const a = parts[i], b = parts[i + 1];
    if (a.p < .5 || b.p < 0) continue;
    const y1 = a.py + a.bh * s, y2 = b.py, lit = ((beat % (nb - 1)) + nb - 1) % (nb - 1) === i;
    g.globalAlpha = 1 - close;
    g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, lw * .004);
    g.beginPath(); g.moveTo(w / 2, y1 + 2); g.lineTo(w / 2, y2 - 2); g.stroke();
    g.fillStyle = lit ? '#ff2d2d' : '#fff';
    g.beginPath(); g.arc(w / 2, (y1 + y2) / 2, lw * (lit ? .009 : .005), 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }
  for (const { i, y0, bh, py, p } of parts) {
    if (p < 0) continue;                                         // this part arrives on beat i
    const pop = Math.exp(-p * 7) + (close > 0 && close < 1 ? .25 * Math.sin(close * Math.PI) : 0);
    const z = 1 + pop * .14, cy = py + bh * s / 2;
    const blit = (img, ox = 0, reveal = 1) => {
      const rh = bh * reveal;
      g.drawImage(img, 0, y0, Wk, rh, w / 2 - lw * z / 2 + ox, cy - bh * s * z / 2, lw * z, rh * s * z);
    };
    if (p < .4) {
      // Tracing on, totem style: the outline draws down through the part, flickering.
      if (Math.random() < .85) blit(logoEdge, 0, Math.min(1, p / .4 + .1));
    } else {
      if (p < .9) { g.globalAlpha = Math.min(1, (.9 - p) * 3); blit(logoRed, lw * .035 * Math.exp(-p * 7) * 4); g.globalAlpha = 1; }
      blit(logoKey);
      if (p < .7) { g.globalAlpha = (.7 - p) / .3 * .6; blit(logoEdge); g.globalAlpha = 1; }
    }
  }
  // Once locked: a red scan line sweeps down the logo, one pass every two bars.
  const lx = (w - lw) / 2, ly = top;
  if (close >= 1) {
    const sp = ((k - LOGO_LOCK - LOGO_SNAP) / 8) % 1, sy = sp * Hk, band = Hk * .045;
    const y0 = Math.max(0, sy - band), y1 = Math.min(Hk, sy + band);
    if (y1 > y0) g.drawImage(logoRed, 0, y0, Wk, y1 - y0, lx, ly + y0 * s, lw, (y1 - y0) * s);
  }
  // Fine CRT scan lines (one pixel every three), a faint rolling band and a curved-glass vignette.
  g.fillStyle = 'rgba(0,0,0,.38)';
  for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  const tt = t - INFLECT, by = ((tt * .45) % 1.3 - .15) * h, rb = g.createLinearGradient(0, by - h * .08, 0, by + h * .08);
  rb.addColorStop(0, 'rgba(255,255,255,0)'); rb.addColorStop(.5, 'rgba(255,255,255,.04)'); rb.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rb; g.fillRect(0, by - h * .08, w, h * .16);
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.hypot(w, h) * .6);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)');
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
}

// Tracker read-out over the loading wireframes (same language as the walk tracker): short-lived
// sample boxes on real vertices, clustered at the loading edge, with tiny live numbers pushed outward;
// thin links between vertices that flicker in and out; a face tracker per figure once its head is in.
const TR = { pool: [], last: 0 };
const _v = new THREE.Vector3();
const rnd = Math.random;
const trNum = () => [() => rnd().toFixed(4), () => Math.floor(rnd() * 65536).toString(16).toUpperCase().padStart(4, '0'),
  () => (rnd() * 60 - 30).toFixed(1), () => String(Math.floor(rnd() * 360)).padStart(3, '0') + '°'][Math.floor(rnd() * 4)]();
function toScreen(m, i) {
  const p = m.geometry.attributes.position;
  _v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(m.matrixWorld).project(cam);
  return [(_v.x + 1) / 2 * ov.width, (1 - _v.y) / 2 * ov.height];
}
function trackerData(t, figs) {
  const u = Math.min(ov.width, ov.height) / 540, fs = Math.max(6, 7 * u);
  cam.updateMatrixWorld(); figs.forEach(([, m]) => m.updateMatrixWorld());
  const spawn = t - TR.last > 1 / 30;
  if (spawn) TR.last = t;
  og.save(); og.lineWidth = 1; og.font = `${fs}px "Fira Code", ui-monospace, monospace`; og.textBaseline = 'middle';
  figs.forEach(([name, m, load], fi) => {
    if (load <= 0) return;
    const pos = m.geometry.attributes.position, n = pos.count, U = m.material.uniforms;
    const hOf = (i) => (pos.getY(i) - U.uLo.value) / (U.uHi.value - U.uLo.value);
    // Screen centre line of the figure, for pushing read-outs outward.
    const [cx] = toScreen(m, 0);
    if (spawn) for (let k = 0; k < 5; k++) {
      // Bias half the samples to the loading edge, the rest anywhere already loaded.
      let i = -1;
      for (let tries = 0; tries < 30 && i < 0; tries++) {
        const j = Math.floor(rnd() * n), h = hOf(j);
        if (h <= load && (k % 2 || load >= 1 || h > load - .12)) i = j;
      }
      if (i < 0) continue;
      const [x, y] = toScreen(m, i);
      let j = i;
      for (let tries = 0; tries < 20; tries++) { const c = Math.floor(rnd() * n); if (hOf(c) <= load) { j = c; break; } }
      TR.pool.push({ k: rnd() < .78 ? 'box' : 'link', m, i, j, born: t, life: .08 + rnd() * .28, dir: x >= cx ? 1 : -1, off: (14 + rnd() * 26) * u, txt: [trNum(), trNum()] });
    }
    // Face tracker once the head has loaded.
    if (load > .85) {
      const M = MATCH_BODY[name];
      let best = null;
      for (let i = 0; i < n; i += 7) { const y = pos.getY(i); if (Math.abs(y - M.gy - (name === 'eva' ? .07 : 0)) < .06 && (!best || Math.abs(pos.getX(i)) < Math.abs(pos.getX(best)))) best = i; }
      if (best !== null) {
        const [hx, hy] = toScreen(m, best), r = 16 * u, L = r * .4;
        og.strokeStyle = '#fff';
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          og.beginPath(); og.moveTo(hx + sx * r, hy + sy * r - sy * L); og.lineTo(hx + sx * r, hy + sy * r); og.lineTo(hx + sx * r - sx * L, hy + sy * r); og.stroke();
        }
        const tx = fi === 0 ? hx - r - 4 * u : hx + r + 4 * u;
        og.textAlign = fi === 0 ? 'right' : 'left'; og.fillStyle = '#fff';
        og.fillText(`FACE_${'AB'[fi]} ${name.toUpperCase()}`, tx, hy - r + 2 * u);
        og.fillStyle = 'rgba(255,255,255,.75)';
        og.fillText(`LOCK ${(.9 + rnd() * .09).toFixed(3)}`, tx, hy - r + 2 * u + fs * 1.2);
        og.fillText(`ID ${String(Math.floor(rnd() * 65536)).padStart(5, '0')}`, tx, hy - r + 2 * u + fs * 2.4);
      }
    }
  });
  TR.pool = TR.pool.filter((e) => t - e.born < e.life && t >= e.born);
  for (const e of TR.pool) {
    const [x, y] = toScreen(e.m, e.i);
    og.strokeStyle = '#fff'; og.fillStyle = '#fff';
    if (e.k === 'link') {
      const [x2, y2] = toScreen(e.m, e.j);
      og.globalAlpha = .7; og.beginPath(); og.moveTo(x, y); og.lineTo(x2, y2); og.stroke(); og.globalAlpha = 1;
      continue;
    }
    const b = 2.6 * u, ox = x + e.dir * e.off;
    og.strokeRect(x - b, y - b, b * 2, b * 2);
    og.beginPath(); og.moveTo(x + e.dir * b, y); og.lineTo(ox, y); og.stroke();
    og.textAlign = e.dir > 0 ? 'left' : 'right';
    og.fillText(`V${String(e.i).padStart(4, '0')} ${e.txt[0]}`, ox + e.dir * 2 * u, y - fs * .55);
    og.globalAlpha = .7; og.fillText(trNum(), ox + e.dir * 2 * u, y + fs * .6); og.globalAlpha = 1;
  }
  og.restore();
}

// Before the visitor enters: the empty loader (frame, readouts, corner pieces, bars at 0%) behind the
// CLICK TO ENTER button.
function drawIdle() {
  if (!meshes.evaBody) return false;
  if (!shown) { shown = true; canvas.classList.add('on'); }
  fit();
  for (const m of Object.values(meshes)) m.visible = false;
  drawHud(0, performance.now() / 1000 * 146.75 / 60);
  bgTex.needsUpdate = true;
  renderer.render(scene, cam);
  return true;
}

window.burrowBusts = { update, INFLECT, SFX };
})();
