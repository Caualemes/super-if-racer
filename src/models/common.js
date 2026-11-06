// Utilitários compartilhados pelos modelos low-poly (personagens e motos)
import * as THREE from 'three';

const matCache = new Map();
// Material Lambert com flat shading (visual N64), com cache
export function M(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra }));
  return matCache.get(key);
}

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

export const G = {
  sphere: (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h),
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  cyl: (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s),
  cap: (r, l, s = 6) => new THREE.CapsuleGeometry(r, l, 2, s),
};

// Peça extrudada a partir de um perfil lateral (pontos [z, y]); largura no eixo X, centrada.
export function profile(points, width, mat, { bevel = 0.025, x = 0, parent } = {}) {
  const s = new THREE.Shape();
  points.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
  s.closePath();
  const depth = Math.max(0.001, width - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 4 });
  geo.translate(0, 0, -depth / 2);
  geo.rotateY(-Math.PI / 2); // forma: x -> +z (frente), extrusão -> eixo x
  const m = new THREE.Mesh(geo, mat);
  m.position.x = x;
  if (parent) parent.add(m);
  return m;
}

// Cilindro ligando dois pontos (tubos de quadro, garfos, amortecedores)
const _up = new THREE.Vector3(0, 1, 0);
export function rod(a, b, r, mat, parent, seg = 6) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, vb.clone().sub(va).normalize());
  if (parent) parent.add(m);
  return m;
}

// Tubo curvo (escapamentos, quadro tubular)
export function tube(points, r, mat, parent, seg = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 6, false), mat);
  if (parent) parent.add(m);
  return m;
}

// Lente/forma plana extrudada no plano XY (olhando para +Z)
export function flatShape(points, depth, mat, parent) {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 3 });
  const m = new THREE.Mesh(geo, mat);
  if (parent) parent.add(m);
  return m;
}

export function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Roda esportiva: pneu, aro com raios, disco(s) de freio e pinça
export function wheel({ r = 0.33, w = 0.18, rim = 0x151515, spokes = 6, stripe = null, discs = 1, caliper = 0x222222, discR = 0.52 } = {}) {
  const g = new THREE.Group();
  const spin = new THREE.Group(); g.add(spin);
  const tire = mesh(new THREE.TorusGeometry(r - w * 0.38, w * 0.42, 6, 16), M(0x1a1a1a), 0, 0, 0, spin);
  tire.rotation.y = Math.PI / 2;
  tire.scale.set(1, 1, 1.15);
  const rimR = r - w * 0.78;
  const rimRing = mesh(new THREE.TorusGeometry(rimR, 0.028, 4, 16), M(rim), 0, 0, 0, spin); rimRing.rotation.y = Math.PI / 2;
  if (stripe) { const st = mesh(new THREE.TorusGeometry(rimR - 0.02, 0.012, 3, 16), M(stripe), 0.045, 0, 0, spin); st.rotation.y = Math.PI / 2; }
  const hub = mesh(G.cyl(0.055, 0.055, w * 0.9, 8), M(0x2a2a2a), 0, 0, 0, spin); hub.rotation.z = Math.PI / 2;
  for (let i = 0; i < spokes; i++) {
    const sp = mesh(G.box(0.03, rimR, 0.035), M(rim), 0, 0, 0, spin);
    const a = (i / spokes) * Math.PI * 2;
    sp.position.set(0, Math.cos(a) * rimR / 2, Math.sin(a) * rimR / 2);
    sp.rotation.x = a;
  }
  for (let d = 0; d < discs; d++) {
    const side = d === 0 ? 1 : -1;
    const disc = mesh(G.cyl(r * discR, r * discR, 0.012, 12), M(0xb4b8bc), side * (w * 0.32), 0, 0, spin); disc.rotation.z = Math.PI / 2;
    // pinça (não gira)
    mesh(G.box(0.05, 0.12, 0.09), M(caliper), side * (w * 0.36), r * (discR - 0.2), -r * 0.3, g).rotation.x = 0.6;
  }
  g.userData.spin = spin;
  return g;
}

// Sombra circular simples (estilo N64)
let shadowTex = null;
export function blobShadow(w = 1.2, l = 2.4) {
  if (!shadowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 4, 32, 32, 30);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.09;
  return m;
}
