import * as THREE from 'three';
import * as A from './art.js';

export { THREE };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = { out: (u) => 1 - Math.pow(1 - u, 3), inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2), in: (u) => u * u * u, back: (u) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }, bounce: (u) => { const n = 7.5625, d = 2.75; if (u < 1 / d) return n * u * u; if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75; if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375; return n * (u -= 2.625 / d) * u + 0.984375; } };
export const damp = (k, dt) => 1 - Math.exp(-k * dt);

/* ---------- texture cache ---------- */
const texCache = new Map();
export function texOf(key, make) {
  if (!texCache.has(key)) {
    const c = make(); const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    texCache.set(key, { tex: t, w: c.width, h: c.height, canvas: c });
  }
  return texCache.get(key);
}

let shadowTex = null;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const [c, g] = A.mk(128, 64); const r = g.createRadialGradient(64, 32, 2, 64, 32, 62);
  r.addColorStop(0, 'rgba(30,18,10,0.55)'); r.addColorStop(1, 'rgba(30,18,10,0)'); g.fillStyle = r; g.save(); g.scale(1, 0.5); g.fillRect(0, 0, 128, 128); g.restore();
  shadowTex = new THREE.CanvasTexture(c); return shadowTex;
}

/* =====================================================================
   PaperSprite: a standing paper cutout.
   root (ground position, facing flip) > body (height, squash, tilt) > mesh
   ===================================================================== */
export class PaperSprite {
  constructor(key, make, worldH, { shadow = true, anchor = 'bottom' } = {}) {
    const t = texOf(key, make);
    this.h = worldH; this.w = worldH * (t.w / t.h);
    this.root = new THREE.Group(); this.body = new THREE.Group(); this.root.add(this.body);
    const geo = new THREE.PlaneGeometry(this.w, this.h); if (anchor === 'bottom') geo.translate(0, this.h / 2, 0);
    this.mat = new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat); this.body.add(this.mesh);
    this.flip = 0; this.flipTarget = 0; this.facing = 1; this.key = key;
    if (shadow) {
      this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(this.w * 0.9, this.w * 0.45), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
      this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.03; this.shadow.renderOrder = 1; this.root.add(this.shadow);
    }
  }
  setTex(key, make) { const t = texOf(key, make); this.mat.map = t.tex; this.mat.needsUpdate = true; this.key = key; }
  tint(hex) { this.mat.color.setHex(hex); }
  /** face -1 or 1: paper-flips around the vertical axis when the direction changes */
  face(dir) { if (dir !== this.facing) { this.facing = dir; this.flipTarget = dir < 0 ? Math.PI : 0; } }
  update(dt) {
    if (this.flip !== this.flipTarget) {
      const d = this.flipTarget - this.flip, st = Math.sign(d) * Math.min(Math.abs(d), dt * 14);
      this.flip += st; this.body.rotation.y = this.flip;
    }
    if (this.shadow) { const hgt = this.body.position.y; const s = clamp(1 - hgt * 0.12, 0.35, 1); this.shadow.scale.set(s, s, s); this.shadow.material.opacity = clamp(1 - hgt * 0.1, 0.4, 1); }
  }
  set visible(v) { this.root.visible = v; }
}

/* ---------- text popups on sprites ---------- */
export function textSprite(text, { color = '#fff', stroke = '#3a2a24', size = 64, w = 2.6 } = {}) {
  const [c, g] = A.mk(512, 160); g.font = `bold ${size}px "Bangers","Trebuchet MS",Impact,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 14; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(text, 256, 82); g.fillStyle = color; g.fillText(text, 256, 82);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false })); sp.scale.set(w, w * 160 / 512, 1); sp.renderOrder = 50;
  return sp;
}

/* =====================================================================
   Stage: renderer + camera + parallax backdrop + particles + shake
   ===================================================================== */
export class Stage {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: /[?&]manual/.test(location.search) });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.camera = new THREE.PerspectiveCamera(27, 1, 0.1, 200);
    this.camX = 0; this.camY = 3.4; this.dist = 19; this.shake = 0; this.time = 0; this.zoom = 1;
    this.fx = []; this.updaters = [];
    this.resize(); addEventListener('resize', () => this.resize());
    this.scene = new THREE.Scene(); this.dispose = [];
  }
  resize() { const w = innerWidth, h = innerHeight; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); if (this.scene && this.scene.children.length) this.render(); }
  newScene(bgColor = 0xbfe3ff) {
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(bgColor); this.fx = []; this.updaters = []; this.parallax = [];
    this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    return this.scene;
  }
  /** add a large parallax backdrop plane (follows camera by factor) */
  addBackdrop(kind, { z = -28, factor = 0.82, y = 6, hscale = 1.18 } = {}) {
    const t = texOf('bd:' + kind, () => A.drawBackdrop(kind));
    const H = 2 * (this.dist - z) * Math.tan(this.camera.fov * Math.PI / 360) * hscale, W = H * (t.w / t.h);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: t.tex }));
    m.position.set(0, y, z); this.scene.add(m); this.parallax.push({ m, factor }); return m;
  }
  burst(x, y, z, { n = 14, kind = 'confetti', color, power = 6, life = 0.9, size = 0.22 } = {}) {
    const cols = color ? [color] : [0xffd23f, 0xff7aa8, 0x6fb8ff, 0x6fe08a, 0xfff6e3, 0xff9446];
    for (let i = 0; i < n; i++) {
      const geo = kind === 'star' ? starGeo(size * 1.6) : new THREE.PlaneGeometry(size, size * (kind === 'puff' ? 1 : 0.6));
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: kind === 'puff' ? 0xfff6e3 : cols[i % cols.length], side: THREE.DoubleSide, transparent: true }));
      m.position.set(x, y, z + 0.4);
      const a = Math.random() * Math.PI * 2, sp = power * (0.35 + Math.random() * 0.8);
      this.scene.add(m); this.fx.push({ m, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (kind === 'puff' ? 0.6 : 1) + (kind === 'confetti' ? 2 : 0), vz: (Math.random() - 0.5) * 2, life, max: life, spin: (Math.random() - 0.5) * 14, g: kind === 'puff' ? 0 : -9, grow: kind === 'puff' ? 1.6 : 0 });
    }
  }
  /** ring/impact star burst at a point */
  impact(x, y, z, color = 0xffe27a) { this.burst(x, y, z, { n: 9, kind: 'star', color, power: 7, life: 0.5, size: 0.28 }); }
  poof(x, y, z) { this.burst(x, y, z, { n: 12, kind: 'puff', power: 3.5, life: 0.7, size: 0.7 }); }
  update(dt) {
    this.time += dt;
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.life -= dt;
      f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt; f.vy += f.g * dt;
      f.m.rotation.z += f.spin * dt; f.m.rotation.x += f.spin * 0.5 * dt;
      if (f.grow) f.m.scale.addScalar(f.grow * dt);
      f.m.material.opacity = clamp(f.life / f.max * 1.4, 0, 1);
      if (f.life <= 0) { this.scene.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); this.fx.splice(i, 1); }
    }
    for (const u of this.updaters) u(dt);
    this.shake = Math.max(0, this.shake - dt * 2.2);
  }
  snapshot() { return { scene: this.scene, parallax: this.parallax, fx: this.fx, updaters: this.updaters, camX: this.camX, camY: this.camY, zoom: this.zoom }; }
  restore(s) { this.scene = s.scene; this.parallax = s.parallax; this.fx = s.fx; this.updaters = s.updaters; this.camX = s.camX; this.camY = s.camY; this.zoom = s.zoom; }
  place() {
    const s = this.shake * this.shake, sx = (Math.random() - 0.5) * s * 0.7, sy = (Math.random() - 0.5) * s * 0.5;
    const d = this.dist / this.zoom;
    this.camera.position.set(this.camX + sx, this.camY + 0.9 + sy, d);
    this.camera.lookAt(this.camX + sx, this.camY, 0);
    for (const p of this.parallax || []) p.m.position.x = this.camX * p.factor;
  }
  render() { this.place(); this.renderer.render(this.scene, this.camera); }
  visibleHalfWidth() { return Math.tan(this.camera.fov * Math.PI / 360) * this.dist * this.camera.aspect; }
  /** world -> screen px */
  project(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; }
}

function starGeo(r) {
  const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  return new THREE.ShapeGeometry(s);
}

/* ---------- reusable scenery builders ---------- */
export const THEMES = {
  park: { dirA: '#b98a5c', dirB: '#8a5e3a', top: '#6fd07a', platA: '#e8c070', platB: '#c8923c', floor: 0x78c97c },
  forest: { dirA: '#5a4a7a', dirB: '#3a2e56', top: '#7a5ac2', platA: '#8a6ac2', platB: '#5a3f8a', floor: 0x5a4a8a },
  circus: { dirA: '#b0443a', dirB: '#7a2a28', top: '#ffd23f', platA: '#ff7a6a', platB: '#c0392b', floor: 0xd9a24a },
  dacha: { dirA: '#a8774a', dirB: '#7a5230', top: '#8ac250', platA: '#c9a070', platB: '#8a6a40', floor: 0x8ab24a },
  winter: { dirA: '#cfe0f0', dirB: '#9ab8d8', top: '#ffffff', platA: '#bfe3ff', platB: '#7aa8d8', floor: 0xeef5ff },
  street: { dirA: '#b0a090', dirB: '#7a6e60', top: '#8aba7a', platA: '#e8c070', platB: '#c8923c', floor: 0x9ac88a },
  beach: { dirA: '#f0d8a0', dirB: '#d8b878', top: '#f6e6b0', platA: '#e8c070', platB: '#c8923c', floor: 0xf6e6b0 },
  site: { dirA: '#9aa8c0', dirB: '#6a7890', top: '#ffd23f', platA: '#ffd27a', platB: '#e0961e', floor: 0xb0bcd0 },
  desk: { dirA: '#a8825a', dirB: '#7a5a3a', top: '#f2ecda', platA: '#e8d8b0', platB: '#c8b080', floor: 0xe8e2d2 },
  library: { dirA: '#8a5a3a', dirB: '#5a3a24', top: '#c9a070', platA: '#c9a070', platB: '#8a6a40', floor: 0xb08a5a },
};

/** ground strip (front face) + floor surface for a [x0,x1] segment */
export function addGround(scene, x0, x1, theme, { z = 2.4, depth = 11 } = {}) {
  const w = x1 - x0, tile = texOf('gt:' + theme.top, () => A.drawGroundTile(theme));
  const t = tile.tex.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(w / 4, 1); t.colorSpace = THREE.SRGBColorSpace;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, 4), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.1 }));
  front.position.set((x0 + x1) / 2, -2, z); scene.add(front);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, depth), new THREE.MeshBasicMaterial({ color: theme.floor }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((x0 + x1) / 2, -0.005, z - depth / 2); scene.add(floor);
  // faint stripes on the floor for depth
  const [c, g] = A.mk(8, 256); g.fillStyle = 'rgba(255,255,255,0.0)'; g.fillRect(0, 0, 8, 256); g.fillStyle = 'rgba(0,0,0,0.07)'; for (let i = 0; i < 8; i++) g.fillRect(0, i * 32, 8, 16);
  const st = new THREE.CanvasTexture(c); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(w / 2, 1);
  const stripes = new THREE.Mesh(new THREE.PlaneGeometry(w, depth), new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false }));
  stripes.rotation.x = -Math.PI / 2; stripes.position.set((x0 + x1) / 2, 0.002, z - depth / 2); scene.add(stripes);
  return front;
}

/** floating paper platform: front face + lighter top surface */
export function addPlatform(scene, x, y, w, theme, h = 0.7) {
  const t = texOf('pt:' + theme.platA, () => A.drawPlatformTile(theme)).tex.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(w / 2.6, 1); t.colorSpace = THREE.SRGBColorSpace;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.1 }));
  front.position.set(x, y - h / 2, 0.9); scene.add(front);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.8), new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.platA).offsetHSL(0, 0, 0.1) }));
  top.rotation.x = -Math.PI / 2; top.position.set(x, y + 0.004, 0); scene.add(top);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.95, 0.9), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.set(x, 0.01, 0.6); scene.add(sh);
  return front;
}
