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

const INFLECT = 14.742;                     // bar 9: the intro's second phrase, where the red walk cuts in
const EVA = { a: 148.868, b: 165.225 };     // bars 91-101, from the first chanted "ultrarabbit"
const ANDY = { a: 165.225, b: 181.582 };    // bars 101-111, ending into the 3:02.6 "ultrarabbit"
const LOGO = { fadeIn: 2.2, glitch: 3.0, glow: 3.6 };

const canvas = document.getElementById('bust3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const bg = document.createElement('canvas'), g = bg.getContext('2d');
const bgTex = new THREE.CanvasTexture(bg);
const scene = new THREE.Scene();
scene.background = bgTex;
const cam = new THREE.PerspectiveCamera(42, 1, .002, 100);
const res = new THREE.Vector2();

// Wire colour is chosen per pixel from the background behind it (black over light, white over dark
// or red). Above uReveal the mesh isn't loaded yet; a red line marks the loading edge.
const wireMat = () => new THREE.ShaderMaterial({
  uniforms: { uBg: { value: bgTex }, uRes: { value: res }, uReveal: { value: 2 } },
  vertexShader: 'varying float vY; void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform sampler2D uBg; uniform vec2 uRes; uniform float uReveal; varying float vY;
    void main() {
      float h = (vY + .95) / 1.9;
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
  const x0 = (w - w0) / 2, y0 = (h - h0) / 2, eye = build(x0, y0, w0, h0, 0, 40).eye, kk = PHI ** 5;
  return { eye, sq: build(eye.x + (x0 - eye.x) * kk, eye.y + (y0 - eye.y) * kk, w0 * kk, h0 * kk, -5, 32).sq };
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

/* ---------------- intro: logo, glitch, glow, HUD ---------------- */
const GLYPHS = ['EARS', 'ARROWS', 'GOGGLES', 'EYE', 'MOUTH', 'DIAMOND', 'VENT', 'CHEVRON', 'DOME', 'VISOR'];
const glyphMods = GLYPHS.map((k) => ({ ...newMod(k) }));
const hudTotem = makeTotem();
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
  const fade = clamp(1 - (t - LOGO.glow) / .5, 0, 1);
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
  g.textAlign = 'right'; g.fillText(`SYS·146.73 BPM · ${alienStr(6, beat)}`, w - m - 14 * u, m + 12 * u);
  // Alien glyph text rows, re-rolling on each beat.
  g.fillStyle = 'rgba(255,255,255,.45)'; g.font = `${12 * u}px "Fira Code", ui-monospace, monospace`; g.textAlign = 'left';
  for (let i = 0; i < 3; i++) g.fillText(alienStr(w < h ? 14 : 26, beat * 7 + i), m + 14 * u, m + 34 * u + i * 15 * u);
  // Side glyph columns built from the totem modules; one highlighted per beat.
  const gs = 30 * u;
  glyphMods.forEach((mod, i) => {
    const on = i === beat % glyphMods.length;
    for (const [x, flip] of [[m + 16 * u, 1], [w - m - 16 * u - gs, -1]]) {
      const y = m + 86 * u + i * (gs * .78);
      if (y + gs * .7 > h - m - 70 * u) continue;
      g.save(); g.translate(x + (flip < 0 ? gs : 0), y); g.scale(gs * flip, gs);
      g.lineWidth = TOT_LW;
      MODS[mod.k].draw(g, { c: on ? '#ff2d2d' : 'rgba(255,255,255,.75)', a: '#ff2d2d', t, ph, e: 0, look: Math.sin(t * 3), beat, full: true });
      g.restore();
    }
  });
  // A small totem pulsing in the centre, between the two heads.
  const ts = 54 * u, th = totemH(hudTotem) * ts;
  if (w >= h) drawTotem(g, hudTotem, (w - ts) / 2, h * .22, ts, { scan: ((beats % 4) / 4) });
  // Loading bars and labels under each head.
  const prog = (delay) => clamp((t - LOGO.glow - delay) / (INFLECT - LOGO.glow - delay - .7), 0, 1);
  const steps = (p) => Math.min(1, Math.floor(p * 24 + eOut(ph) * .99) / 24 + (p >= 1 ? 1 : 0));
  const bars = [['SUBJECT 01 · EVA', .25 * w, steps(prog(0))], ['SUBJECT 02 · ANDY', .75 * w, steps(prog(.8))]];
  for (const [name, x, p] of bars) {
    const bw = w < h ? w * .38 : Math.min(w * .3, 300 * u), bx = x - bw / 2, by = h - m - 34 * u;
    g.fillStyle = '#fff'; g.font = `600 ${12 * u}px "Fira Code", ui-monospace, monospace`; g.textAlign = 'left';
    g.fillText(name, bx, by - 18 * u);
    g.textAlign = 'right'; g.fillStyle = p >= 1 ? '#ff2d2d' : '#fff';
    g.fillText(p >= 1 ? 'LOADED' : `${Math.round(p * 100)}%`, bx + bw, by - 18 * u);
    g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, u); g.strokeRect(bx, by, bw, 8 * u);
    g.fillStyle = p >= 1 ? '#ff2d2d' : '#fff'; g.fillRect(bx + 2 * u, by + 2 * u, (bw - 4 * u) * p, 4 * u);
  }
  if (fade > 0) { g.fillStyle = `rgba(255,255,255,${fade})`; g.fillRect(0, 0, w, h); }
  return [prog(0), prog(.8)];
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
    : t < INFLECT ? 'intro'
    : t >= EVA.a && t < EVA.b ? 'eva'
    : t >= ANDY.a && t < ANDY.b ? 'andy' : null;
  const on = !!which && !!meshes.eva && !!meshes.andy;
  if (on !== shown) { shown = on; canvas.classList.toggle('on', on); }
  if (!on) return false;
  fit();
  const { eva, andy } = meshes;
  eva.visible = andy.visible = false;
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
    let loads = [0, 0];
    if (t < LOGO.glow) drawLogo(t); else loads = drawHud(t, beats);
    if (t >= LOGO.glow) {
      // Heads left and right, turning slowly as they load from the base up.
      // Landscape: side by side. Portrait: Eva above Andy.
      const portrait = W < H;
      eva.visible = andy.visible = true;
      if (portrait) { eva.position.set(0, .95, 0); andy.position.set(0, -.85, 0); eva.scale.setScalar(.85); andy.scale.setScalar(.85); }
      else { eva.position.set(-1.2, .26, 0); andy.position.set(1.2, .26, 0); eva.scale.setScalar(1.08); andy.scale.setScalar(1.08); }
      eva.rotation.y = .5 + t * .35; andy.rotation.y = -.5 - t * .35;
      const flick = (p) => (p > 0 && p < 1 && Math.random() < .04 ? p - .08 : p);
      eva.material.uniforms.uReveal.value = flick(loads[0]) * 1.02;
      andy.material.uniforms.uReveal.value = flick(loads[1]) * 1.02;
      cam.fov = 38; cam.updateProjectionMatrix();
      cam.position.set(0, portrait ? .05 : .2, portrait ? 5.6 : 4.1); cam.lookAt(0, portrait ? .05 : .15, 0);
    }
  }
  if (which !== 'intro') { eva.scale.setScalar(1); andy.scale.setScalar(1); }
  bgTex.needsUpdate = true;
  renderer.render(scene, cam);
  return true;
}

window.burrowBusts = { update, INFLECT };
})();
