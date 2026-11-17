// ULTRARABBIT music promo: the 3D wireframe busts of Eva and Andy.
//  - Intro (0:00 to the portal at 0:18.18): after the coin goes in on the title screen, close-ups of
//    each part of Eva and Andy loading on an arcade monitor, then the two side by side as PLAYER 1 / 2.
//  - Chant scenes in the final third: Eva over golden rectangles, then Andy over golden spirals, each
//    with a fast orbit that spirals into the head.
// Driven by window.burrowBusts.update(songTime, beats, ct) from the page; returns true while on screen.
(() => {
'use strict';
const PHI = (1 + Math.sqrt(5)) / 2;
const eOut = (p) => 1 - (1 - p) ** 3;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const COLS = ['#ff2d2d', '#000000', '#ffffff'];

const INFLECT = 14.849;                     // bar 9: the intro's second phrase (the wide with READY?)
// Each orbit is planned over its full 10 bars (a..b) but only its second half is shown (from `on`),
// so it opens already halfway in and keeps the same ending.
const EVA = { a: 148.955, on: 157.132, b: 165.310 };   // bars 91-101; shown 96-101
const ANDY = { a: 165.310, on: 173.488, b: 181.664 };  // bars 101-111, ending into the 3:02.6 "ultrarabbit"; shown 106-111
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
// The load counter and COMPLETE sit on their own canvas at the very top of the page (above the HUD,
// tracker read-outs and every other layer; only the entry gate is higher).
const topc = document.createElement('canvas'), tg = topc.getContext('2d');
Object.assign(topc.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: 9, display: 'none', pointerEvents: 'none' });
document.body.appendChild(topc);
const TOPC = { on: false };
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
  topc.width = bg.width; topc.height = bg.height;
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

/* ---------------- intro: coin in, the two load part by part on an arcade monitor ---------------- */
// From the coin drop (0:00) to the portal (0:18.18). The film opens on the arcade title screen (CREDIT 01,
// PRESS START) for two bars; then both full-length wireframes load from the feet up, and the camera cuts on the half bar between close-ups of whichever part is loading, Andy then Eva:
// footwear, torso, face, ears. Bar 7 revisits the finished parts on the beat, bar 8 is the wide with
// COMPLETE, then PLAYER 1 / PLAYER 2 into the walk.
const BEAT = 60 / 146.75, BAR = (k) => .130 + k * 4 * BEAT;
const READY_END = 18.183;
const TITLE_END = BAR(2), START_AT = BAR(1.5);   // the film opens on the title screen; START pressed half a bar before the cut
const SHOTS = [
  { a: BAR(2), b: BAR(2.5), who: 'andy', part: 'FOOTWEAR', f: .05, d: .62, ang: .55, spin: .14, up: .16 },
  { a: BAR(2.5), b: BAR(3), who: 'eva', part: 'FOOTWEAR', f: .05, d: .62, ang: -.55, spin: -.14, up: .16 },
  { a: BAR(3), b: BAR(3.5), who: 'andy', part: 'TORSO', f: .62, d: .78, ang: -.35, spin: .1, up: .02 },
  { a: BAR(3.5), b: BAR(4), who: 'eva', part: 'TORSO', f: .6, d: .72, ang: .35, spin: -.1, up: .02 },
  // Faces and ears use the detailed head models (bust: true); rv is the load sweep across the shot.
  { a: BAR(4), b: BAR(5), who: 'andy', part: 'FACE', bust: true, f: .76, d: .95, ang: .3, spin: -.18, up: 0, rv: [.5, .92] },
  { a: BAR(5), b: BAR(6), who: 'eva', part: 'FACE', bust: true, f: .6, d: .95, ang: -.3, spin: .18, up: 0, rv: [.4, .8] },
  { a: BAR(6), b: BAR(6.5), who: 'andy', part: 'EARS', bust: true, f: .86, d: 1.25, ang: 2.3, spin: .3, up: .1, rv: [.84, 1.02] },
  { a: BAR(6.5), b: BAR(7), who: 'eva', part: 'EARS', bust: true, f: .85, d: 1.3, ang: -2.3, spin: -.3, up: .1, rv: [.78, 1.02] },
  { a: BAR(7), b: BAR(7) + BEAT, who: 'andy', part: 'FACE', bust: true, f: .76, d: .85, ang: .05, spin: .04, up: 0, lock: true },
  { a: BAR(7) + BEAT, b: BAR(7) + 2 * BEAT, who: 'eva', part: 'FACE', bust: true, f: .6, d: .85, ang: -.05, spin: -.04, up: 0, lock: true },
  { a: BAR(7) + 2 * BEAT, b: BAR(7) + 3 * BEAT, who: 'andy', part: 'FOOTWEAR', f: .04, d: .42, ang: .9, spin: .05, up: .1, lock: true },
  { a: BAR(7) + 3 * BEAT, b: BAR(8), who: 'eva', part: 'FOOTWEAR', f: .04, d: .42, ang: -.9, spin: -.05, up: .1, lock: true },
];
// Loading progress (fraction of height, feet up) per figure: each one's edge sweeps through the part on
// screen during its own shots, and carries on quietly while the other is shown.
const LOAD_KF = {
  andy: [[0, 0], [BAR(2), 0], [BAR(2.5), .14], [BAR(3), .5], [BAR(3.5), .82], [BAR(4), .84], [BAR(5), .97], [BAR(6), .97], [BAR(6.5), 1.02]],
  eva: [[0, 0], [BAR(2.5), 0], [BAR(3), .14], [BAR(3.5), .5], [BAR(4), .75], [BAR(5), .76], [BAR(6), .88], [BAR(6.5), .88], [BAR(7), 1.02]],
};
const loadAt = (kf, t) => {
  if (t <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) if (t < kf[i][0]) { const [a, va] = kf[i - 1], [b, vb] = kf[i]; return va + (vb - va) * (t - a) / (b - a); }
  return kf[kf.length - 1][1];
};
const NAMES = { andy: ['01', 'ANDY'], eva: ['02', 'EVA'] };

// The arcade monitor: black, red corner brackets, pixel-font read-outs (Press Start 2P), and a block
// progress bar for the part on screen. Drawn under the wireframe.
function drawArcade(t, beats, shot, la, le) {
  const w = bg.width, h = bg.height, u = Math.min(w, h) / 540, m = 22 * u, beat = Math.floor(beats);
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#ff2d2d'; g.lineWidth = 3 * u;
  const L = 34 * u;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]]) {
    g.beginPath(); g.moveTo(x + dx * L, y); g.lineTo(x, y); g.lineTo(x, y + dy * L); g.stroke();
  }
  const fs = Math.max(7, 10 * u), px = (sz, col) => { g.font = `${sz}px PS2P, "Fira Code", monospace`; g.fillStyle = col; };
  g.textBaseline = 'top';
  px(fs, '#ff2d2d'); g.textAlign = 'left'; g.fillText('1UP', m + 14 * u, m + 12 * u);
  px(fs, '#fff'); g.fillText(`ANDY ${String(Math.round(Math.min(1, la) * 100)).padStart(3, '0')}%`, m + 14 * u, m + 26 * u);
  px(fs, '#ff2d2d'); g.textAlign = 'right'; g.fillText('2UP', w - m - 14 * u, m + 12 * u);
  px(fs, '#fff'); g.fillText(`EVA ${String(Math.round(Math.min(1, le) * 100)).padStart(3, '0')}%`, w - m - 14 * u, m + 26 * u);
  px(fs, '#ff2d2d'); g.textAlign = 'center'; g.fillText('HI-SCORE', w / 2, m + 12 * u);
  px(fs, '#fff'); g.fillText('13371337', w / 2, m + 26 * u);
  if (!shot) return;
  const [num, name] = NAMES[shot.who], p = shot.lock ? 1 : Math.min(1, shot.who === 'andy' ? la : le);
  const by = h - m - 44 * u;
  px(fs, '#fff'); g.textAlign = 'left'; g.fillText(`SUBJECT ${num} · ${name}`, m + 14 * u, by);
  px(fs * 1.5, p >= 1 ? '#ff2d2d' : '#fff'); g.fillText(`▶ ${shot.part}`, m + 14 * u, by + 16 * u);
  // REC dot and status, blinking on the beat
  g.textAlign = 'right';
  px(fs, '#fff'); g.fillText(p >= 1 ? (shot.lock ? 'TRACK LOCK' : 'LOADED') : 'LOADING', w - m - 14 * u, by);
  // block bar: 20 cells
  const cells = 20, cw = 9 * u, gap = 3 * u, bw = cells * (cw + gap) - gap, bx = w - m - 14 * u - bw, cy = by + 18 * u;
  for (let i = 0; i < cells; i++) { g.fillStyle = i < Math.floor(p * cells) ? (p >= 1 ? '#ff2d2d' : '#fff') : 'rgba(255,255,255,.18)'; g.fillRect(bx + i * (cw + gap), cy, cw, 10 * u); }
  if (beats - beat < .5) { g.fillStyle = '#ff2d2d'; g.beginPath(); g.arc(m + 18 * u, m + 52 * u, 4 * u, 0, Math.PI * 2); g.fill(); px(fs * .8, '#fff'); g.textAlign = 'left'; g.fillText('REC', m + 26 * u, m + 48 * u); }
}

// Big arcade headlines on the top canvas, in Japanese: コンプリート！ (bar 8), レディ？ (bar 9), ゴー！ (bar 10
// to the portal). Baked in the Blood style (title/hd_*.png) at the size chunky() would draw them, then
// blown up with hard pixels.
const HEADS = Object.fromEntries(['complete', 'ready', 'go'].map((k) => { const i = new Image(); i.src = `/musicpromo/title/hd_${k}.png`; return [k, i]; }));
function drawTopText(t, beats) {
  const w = topc.width, h = topc.height, u = Math.min(w, h) / 540, ph = beats - Math.floor(beats);
  tg.clearRect(0, 0, w, h);
  // READY? / GO! now play over the walk, just before they step into the wall portal (in the edit).
  const word = t >= BAR(8) && t < BAR(9) ? 'complete' : null;
  if (!word || ph >= .8 && word !== 'go') return;
  if (word === 'go' && t >= READY_END - .25) return;
  const c = HEADS[word], px = Math.max(3, 4.6 * u);
  if (!c.complete || !c.naturalWidth) return;
  const fit = Math.min(1, w * .9 / (c.width * px)), pop = 1 + Math.exp(-ph * 10) * .08;
  const cw = c.width * px * pop * fit, chh = c.height * px * pop * fit;
  tg.save(); tg.imageSmoothingEnabled = false; tg.drawImage(c, (w - cw) / 2, h * .5 - chh / 2, cw, chh); tg.restore();
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
const SF = { t: -1, shot: -2, beat: -1, la: 0, le: 0 };
function introSfx(t, beats, shot, la, le) {
  const dt = t - SF.t, beat = Math.floor(beats), cross = (x) => SF.t < x && t >= x;
  if (dt > 0 && dt < .3) {
    if (cross(START_AT)) SFX.module();
    if (shot !== SF.shot && shot !== -2) SFX.blip(beat);
    else if (beat !== SF.beat && shot >= 0 && !SHOTS[shot].lock) SFX.tick();
    if ((la >= 1 && SF.la < 1) || (le >= 1 && SF.le < 1)) SFX.loaded();
    if (cross(BAR(8))) SFX.module();
  }
  Object.assign(SF, { t, shot, beat, la, le });
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
function update(t, beats, live) {
  const which = !live ? null
    : t < READY_END ? 'intro'
    : t >= EVA.on && t < EVA.b ? 'eva'
    : null;   // Andy's chant scene (ANDY) is replaced by the white-world ride (snow.mp4 on the page)
  const on = !!which && !!meshes.eva && !!meshes.andy && (which !== 'intro' || (!!meshes.evaBody && !!meshes.andyBody));
  if (on !== shown) { shown = on; canvas.classList.toggle('on', on); }
  if (on !== OV.on) { OV.on = on; ov.style.display = on ? 'block' : 'none'; }
  const topOn = on && which === 'intro' && (t < TITLE_END || t >= BAR(8));
  if (topOn !== TOPC.on) { TOPC.on = topOn; topc.style.display = topOn ? 'block' : 'none'; }
  if (on) og.clearRect(0, 0, ov.width, ov.height);
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
    eva.scale.setScalar(1);
    eva.material.uniforms.uLo.value = -.95; eva.material.uniforms.uHi.value = .95;
  } else if (t < TITLE_END) {
    // The arcade title screen, coin already in: PRESS START, then START pressed half a bar before the cut.
    g.fillStyle = '#000'; g.fillRect(0, 0, bg.width, bg.height);
    const tc = window.burrowTitle && burrowTitle.frame(t, t >= START_AT ? 'start' : 'credit', START_AT);
    const w = topc.width, h = topc.height;
    tg.fillStyle = '#000'; tg.fillRect(0, 0, w, h);
    if (tc) { const s = Math.min(w / tc.width, h / tc.height), dw = tc.width * s, dh = tc.height * s; tg.imageSmoothingEnabled = false; tg.drawImage(tc, (w - dw) / 2, (h - dh) / 2, dw, dh); }
    introSfx(t, beats, -2, 0, 0);
  } else {
    const la = loadAt(LOAD_KF.andy, t), le = loadAt(LOAD_KF.eva, t);
    const si = SHOTS.findIndex((s) => t >= s.a && t < s.b), shot = SHOTS[si];
    const bodies = { andy: andyBody, eva: evaBody };
    for (const m of [andyBody, evaBody]) { m.material.uniforms.uLo.value = -.96; m.material.uniforms.uHi.value = .95; }
    const rev = (p) => (p >= 1 ? 2 : p * 1.02);
    if (shot) {
      // Close-up on one part: the figure at the origin, the camera drifting round the part.
      const p = (t - shot.a) / (shot.b - shot.a), m = shot.bust ? meshes[shot.who] : bodies[shot.who];
      const load = shot.lock ? 1 : shot.rv ? shot.rv[0] + (shot.rv[1] - shot.rv[0]) * p : (shot.who === 'andy' ? la : le);
      m.visible = true; m.scale.setScalar(1); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0);
      if (shot.bust) { m.material.uniforms.uLo.value = -.95; m.material.uniforms.uHi.value = .95; }
      m.material.uniforms.uReveal.value = rev(load);
      const ty = -.95 + 1.9 * shot.f, ang = shot.ang + shot.spin * p, dist = shot.d * (1 - .12 * p);
      cam.fov = 42; cam.updateProjectionMatrix();
      cam.position.set(Math.sin(ang) * dist, ty + shot.up, Math.cos(ang) * dist); cam.lookAt(0, ty, 0);
      drawArcade(t, beats, shot, la, le);
      trackerData(t, [[shot.who, m, Math.min(1, load), shot.bust ? MATCH[shot.who] : null]]);
    } else {
      // The wide: both full length, side by side and front-on, PLAYER 1 and PLAYER 2.
      evaBody.visible = andyBody.visible = true;
      for (const [name, m] of [['eva', evaBody], ['andy', andyBody]]) {
        const P = matchHead(name, LOADED.module);
        m.scale.setScalar(P.scale); m.position.set(P.x, P.y, 0); m.rotation.set(0, 0, 0);
        m.material.uniforms.uReveal.value = 2;
      }
      cam.fov = MCAM.fov; cam.updateProjectionMatrix();
      cam.position.set(0, 0, MCAM.d); cam.lookAt(0, 0, 0);
      drawArcade(t, beats, null, 1, 1);
      const w = bg.width, h = bg.height, u = Math.min(w, h) / 540;
      g.font = `${Math.max(7, 10 * u)}px PS2P, "Fira Code", monospace`; g.textAlign = 'center'; g.textBaseline = 'top';
      g.fillStyle = '#ff2d2d'; g.fillText('PLAYER 1', w * .3, h * .86); g.fillText('PLAYER 2', w * .7, h * .86);
      g.fillStyle = '#fff'; g.fillText('ANDY', w * .3, h * .86 + 16 * u); g.fillText('EVA', w * .7, h * .86 + 16 * u);
      trackerData(t, [['andy', andyBody, 1], ['eva', evaBody, 1]]);
    }
    drawTopText(t, beats);
    introSfx(t, beats, si, la, le);
  }
  bgTex.needsUpdate = true;
  renderer.render(scene, cam);
  return true;
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
  figs.forEach(([name, m, load, MM], fi) => {
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
      const M = MM || MATCH_BODY[name];
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

window.burrowBusts = { update, INFLECT, SFX };
})();
