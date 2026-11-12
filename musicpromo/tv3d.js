// ULTRARABBIT music promo: the CCTV lip-sync footage (band.mp4) playing on a red retro TV.
// A curved CRT screen in a deep red cabinet, on a black mirror floor in an endless void with a red
// horizon. The camera makes a slow orbit round the front over each run of back-to-back cues.
// Driven by window.tvCCTV.update(video, k, overlay) from the page, once per frame while a cue plays:
// k is 0..1 through the current run, overlay is { ts, cam, rec }. Returns false if WebGL is missing,
// so the page can fall back to the flat CCTV frame.
(() => {
'use strict';
const canvas = document.getElementById('tv3d');
if (!canvas || !window.THREE || !THREE.Reflector || !THREE.RoundedBoxGeometry) { window.tvCCTV = { update: () => false }; return; }

let r;
try {
  r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { window.tvCCTV = { update: () => false }; return; }
const mobile = Math.min(screen.width, screen.height) < 700;
r.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .85;
r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
r.shadowMap.autoUpdate = false;              // nothing moves but the camera: render the shadow once
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
const pmrem = new THREE.PMREMGenerator(r);
scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), .04).texture;
const cam = new THREE.PerspectiveCamera(32, 16 / 9, .05, 200);
const lin = (h) => new THREE.Color(h).convertSRGBToLinear();

/* ---------- screen: the footage plus the CCTV readout, scan lines and a rolling band ---------- */
const SW = mobile ? 960 : 1280, SH = SW * 9 / 16, U = SW / 1280;
const sc = document.createElement('canvas'); sc.width = SW; sc.height = SH;
const vc = document.createElement('canvas'); vc.width = SW; vc.height = SH;
const vg = vc.getContext('2d'); let vHas = false;
const sg = sc.getContext('2d'), screenTex = new THREE.CanvasTexture(sc);
screenTex.encoding = THREE.sRGBEncoding; screenTex.minFilter = THREE.LinearFilter; screenTex.generateMipmaps = false;
const font = new FontFace('PS', 'url(/musicpromo/ps2p.woff2)');
font.load().then((f) => document.fonts.add(f)).catch(() => {});
const FONT = (px) => `${Math.round(px * U)}px PS, "Fira Code", monospace`;
function drawScreen(video, ov, t) {
  // Hold the last good frame while the video seeks, so the screen never blinks to black.
  if (video.readyState >= 2) { vg.drawImage(video, 0, 0, SW, SH); vHas = true; }
  sg.fillStyle = '#000'; sg.fillRect(0, 0, SW, SH);
  if (vHas) sg.drawImage(vc, 0, 0);
  sg.strokeStyle = 'rgba(255,255,255,.8)'; sg.lineWidth = 4 * U;
  const m = 40 * U, L = 70 * U;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [SW - m, m, -1, 1], [m, SH - m, 1, -1], [SW - m, SH - m, -1, -1]]) {
    sg.beginPath(); sg.moveTo(x + dx * L, y); sg.lineTo(x, y); sg.lineTo(x, y + dy * L); sg.stroke();
  }
  sg.textBaseline = 'top';
  if (ov.rec) { sg.fillStyle = '#ff2d2d'; sg.beginPath(); sg.arc(m + 28 * U, m + 36 * U, 11 * U, 0, 7); sg.fill(); }
  sg.fillStyle = '#fff'; sg.font = FONT(22); sg.textAlign = 'left'; sg.fillText('REC', m + 48 * U, m + 25 * U);
  const [c1, c2 = ''] = ov.cam.split('<br>');
  sg.textAlign = 'right'; sg.fillText(c1, SW - m - 20 * U, m + 25 * U);
  sg.font = FONT(15); sg.fillText(c2, SW - m - 20 * U, m + 58 * U);
  sg.fillText('ULTRARABBIT SECURITY', SW - m - 20 * U, SH - m - 44 * U);
  sg.textAlign = 'left'; sg.font = FONT(18); sg.fillText(ov.ts, m + 20 * U, SH - m - 44 * U);
  sg.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < SH; y += 4 * U) sg.fillRect(0, y, SW, 2 * U);
  const by = ((t * .35) % 1.4 - .2) * SH, gr = sg.createLinearGradient(0, by - 60 * U, 0, by + 60 * U);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.07)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  sg.fillStyle = gr; sg.fillRect(0, by - 60 * U, SW, 120 * U);
  screenTex.needsUpdate = true;
}

/* ---------- the set ---------- */
function curvedScreen(w, h, bulge) {
  // A CRT face: a subdivided plane pushed out into a shallow dome.
  const g = new THREE.PlaneGeometry(w, h, 48, 36), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2);
    p.setZ(i, bulge * (1 - .5 * (x * x + y * y)));
  }
  g.computeVertexNormals(); return g;
}
function mesh(geo, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
const tv = new THREE.Group(); scene.add(tv);
const deepRed = new THREE.MeshPhysicalMaterial({ color: lin(0x8a000c), roughness: .32, metalness: 0, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: .12 });
const trueBlack = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: .4, clearcoat: .6, envMapIntensity: .05 });
mesh(new THREE.RoundedBoxGeometry(2.42, 1.5, 1.55, 5, .09), deepRed, 0, .8, -.08, tv);
mesh(new THREE.RoundedBoxGeometry(2.26, 1.34, .08, 4, .05), trueBlack, 0, .8, .68, tv);        // thin black bezel
const scr = new THREE.Group(); scr.position.set(0, .8, .71); tv.add(scr);
scr.add(new THREE.Mesh(curvedScreen(2.16, 1.215, .07), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })));
scr.add(new THREE.Mesh(curvedScreen(2.16, 1.215, .076), new THREE.MeshPhysicalMaterial({
  color: 0x000000, roughness: .05, transparent: true, opacity: .07, clearcoat: 1, clearcoatRoughness: .02, depthWrite: false })));
const glow = new THREE.PointLight(0xdfe8ff, .45, 3, 2); glow.position.set(0, 0, .6); scr.add(glow);
mesh(new THREE.SphereGeometry(.014, 12, 10), new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 4 }), 1.05, .11, .72, tv);

// Black mirror floor: a reflector under a dark glossy film.
const mir = new THREE.Reflector(new THREE.PlaneGeometry(200, 200), { textureWidth: 1024, textureHeight: 576, color: 0x3a3a3a });
mir.rotation.x = -Math.PI / 2; scene.add(mir);
// The film is matte (no highlight of its own): the gloss comes from the mirror under it, so the key
// light doesn't flare across the floor when the camera pulls back on a tall phone screen.
const film = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x000000, transparent: true, opacity: .9 }));
film.rotation.x = -Math.PI / 2; film.position.y = .002; film.receiveShadow = true; scene.add(film);
// Faint red grid running out to a red horizon.
const pts = [];
for (let i = -40; i <= 40; i++) pts.push(new THREE.Vector3(i, .004, -80), new THREE.Vector3(i, .004, 20), new THREE.Vector3(-40, .004, i - 30), new THREE.Vector3(40, .004, i - 30));
scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xff1a2e, transparent: true, opacity: .3 })));
scene.add(new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader: 'varying vec3 vP; void main(){ float h = exp(-abs(vP.y) * 22.); gl_FragColor = vec4(vec3(.85,.02,.05) * h, 1.); }' })));
// A soft key from above-front and one red light high behind for the edge glow.
const key = new THREE.SpotLight(0xfff2ea, 3.2, 20, .35, .8, 1.5); key.position.set(1.2, 5.5, 3.5); key.target.position.set(0, .9, 0);
key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key, key.target);
const back = new THREE.SpotLight(0xff1a2e, 7, 20, .45, .8, 1.4); back.position.set(0, 4.5, -4); back.target.position.set(0, 1, 0); scene.add(back, back.target);
r.shadowMap.needsUpdate = true;

/* ---------- camera: a slow orbit, nearly front-on, about 22 degrees ---------- */
const ORBIT = { r: 3.9, h: .88, look: .8, a0: -.08, a1: .3 };
let W = 0, H = 0;
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w === W && h === H) return;
  W = w; H = h; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
}
const t0 = performance.now();
window.tvCCTV = {
  update(video, k, ov) {
    resize();
    if (!W || !H) return true;
    drawScreen(video, ov, (performance.now() - t0) / 1000);
    // Back off on narrow screens so the whole set stays in shot.
    const fit = 1.4 / (Math.tan(cam.fov * Math.PI / 360) * cam.aspect) + .8;
    const rad = Math.max(ORBIT.r, fit), e = k * k * (3 - 2 * k), a = ORBIT.a0 + (ORBIT.a1 - ORBIT.a0) * e;
    cam.position.set(Math.sin(a) * rad, ORBIT.h + Math.sin(k * Math.PI) * .12, Math.cos(a) * rad);
    cam.lookAt(0, ORBIT.look, 0);
    r.render(scene, cam);
    return true;
  },
};
})();
