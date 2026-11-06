// Personagens cabeçudos estilo boneco N64 + motocicletas low-poly
import * as THREE from 'three';

const matCache = new Map();
export function M(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra }));
  return matCache.get(key);
}
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
const G = {
  sphere: (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h),
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  cyl: (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s),
  cap: (r, l, s = 6) => new THREE.CapsuleGeometry(r, l, 2, s),
};

// ===================== PERSONAGENS =====================
// def: { skin, hair:'curly'|'short'|'helmet', hairColor, suit, suit2, glasses, mustache, boots, gloves, helmetColor }
export function buildCharacter(def) {
  const root = new THREE.Group();
  const J = {};
  const skin = M(def.skin), suit = M(def.suit), suit2 = M(def.suit2 ?? def.suit), boots = M(def.boots ?? 0x2a2a2a), gloves = M(def.gloves ?? 0x222222);

  // quadril
  const hips = new THREE.Group(); hips.position.y = 0.62; root.add(hips); J.hips = hips;
  mesh(G.box(0.42, 0.2, 0.28), suit, 0, 0, 0, hips);
  // pernas (coxa + canela)
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.12, -0.05, 0); hips.add(leg);
    mesh(G.cap(0.1, 0.18), suit, 0, -0.16, 0, leg);
    const knee = new THREE.Group(); knee.position.y = -0.3; leg.add(knee);
    mesh(G.cap(0.095, 0.16), suit, 0, -0.13, 0, knee);
    mesh(G.box(0.2, 0.14, 0.3), boots, 0, -0.27, 0.05, knee);
    J[s < 0 ? 'legR' : 'legL'] = leg; J[s < 0 ? 'kneeR' : 'kneeL'] = knee;
  }
  // tronco
  const torso = new THREE.Group(); torso.position.y = 0.08; hips.add(torso); J.torso = torso;
  mesh(G.box(0.5, 0.46, 0.32), suit, 0, 0.25, 0, torso);
  mesh(G.box(0.52, 0.12, 0.34), suit2, 0, 0.02, 0, torso); // cinto/faixa
  if (def.outfit === 'flightsuit') {
    // macacão verde militar: zíper, bolsos no peito e emblemas
    mesh(G.box(0.03, 0.4, 0.02), M(0x2e3520), 0, 0.26, 0.165, torso);
    for (const s of [-1, 1]) mesh(G.box(0.15, 0.1, 0.03), M(0x48542f), s * 0.13, 0.36, 0.165, torso);
    mesh(G.box(0.1, 0.07, 0.02), M(0xc9a24a), 0.13, 0.36, 0.18, torso); // emblema dourado
    mesh(G.box(0.1, 0.07, 0.02), M(0x1fa83a), -0.13, 0.36, 0.18, torso); // patch IF
    mesh(G.box(0.4, 0.1, 0.1), M(0x48542f), 0, 0.5, -0.1, torso); // gola
  } else if (def.outfit === 'jacket') {
    // jaqueta preta de motociclista com faixas cinza
    mesh(G.box(0.03, 0.42, 0.02), M(0x999999), 0.04, 0.25, 0.165, torso);
    for (const s of [-1, 1]) {
      mesh(G.box(0.05, 0.44, 0.33), M(0x4a4d52), s * 0.235, 0.25, 0, torso);
      mesh(G.box(0.14, 0.12, 0.1), M(0x111114), s * 0.12, 0.5, 0.08, torso);
    }
    mesh(G.box(0.12, 0.04, 0.02), M(0xd11f2a), -0.13, 0.38, 0.17, torso);
  }
  // braços (ombro -> cotovelo)
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.32, 0.42, 0); torso.add(sh);
    mesh(G.sphere(0.11, 6, 4), suit, 0, 0, 0, sh);
    mesh(G.cap(0.085, 0.14), suit, 0, -0.13, 0, sh);
    const el = new THREE.Group(); el.position.y = -0.26; sh.add(el);
    mesh(G.cap(0.08, 0.13), suit, 0, -0.1, 0, el);
    mesh(G.sphere(0.1, 6, 5), gloves, 0, -0.23, 0, el);
    J[s < 0 ? 'armR' : 'armL'] = sh; J[s < 0 ? 'elbowR' : 'elbowL'] = el;
  }
  // cabeça grande
  const neck = new THREE.Group(); neck.position.y = 0.5; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.36; neck.add(head); J.head = head;
  mesh(G.cyl(0.1, 0.12, 0.14, 6), skin, 0, -0.3, 0, head);
  const face = mesh(G.sphere(0.4, 10, 8), skin, 0, 0, 0, head);
  face.scale.set(1, 1.05, 0.95);
  // orelhas
  for (const s of [-1, 1]) mesh(G.sphere(0.09, 5, 4), skin, s * 0.39, -0.02, 0, head).scale.set(0.5, 1, 0.8);
  // nariz
  mesh(G.sphere(0.085, 6, 4), M(def.nose ?? def.skin), 0, -0.04, 0.39, head).scale.set(1, 0.9, 1.1);
  // boca sorrindo ou séria
  const mouth = mesh(G.box(def.smile ? 0.18 : 0.14, 0.035, 0.04), M(0x5a1a1a), 0, -0.2, 0.355, head);
  J.mouth = mouth;
  // sobrancelhas
  for (const s of [-1, 1]) {
    const b = mesh(G.box(0.14, 0.04, 0.04), M(def.browColor ?? def.hairColor ?? 0x222222), s * 0.14, 0.17, 0.37, head);
    b.rotation.z = s * (def.serious ? 0.18 : -0.1);
  }
  if (def.mustache) {
    const mm = M(def.mustacheColor ?? 0x1a1410);
    mesh(G.box(0.3, 0.07, 0.08), mm, 0, -0.12, 0.37, head);
    for (const s of [-1, 1]) { const t = mesh(G.box(0.08, 0.1, 0.07), mm, s * 0.15, -0.15, 0.35, head); t.rotation.z = s * 0.4; }
  }
  if (def.glasses) {
    const fr = M(def.glassesFrame ?? 0xc9a24a), lens = M(0x101418, { emissive: 0x0a0d10 });
    for (const s of [-1, 1]) {
      const l = mesh(G.cyl(0.115, 0.1, 0.04, 8), lens, s * 0.15, 0.05, 0.38, head);
      l.rotation.x = Math.PI / 2; l.scale.set(1.15, 1, 0.95);
      const shine = mesh(G.box(0.05, 0.02, 0.01), M(0xffffff, { emissive: 0x666666 }), s * 0.15 - 0.04, 0.1, 0.405, head); shine.rotation.z = 0.6;
      mesh(G.box(0.1, 0.025, 0.025), fr, s * 0.31, 0.08, 0.3, head).rotation.y = s * 0.7;
    }
    mesh(G.box(0.1, 0.025, 0.03), fr, 0, 0.1, 0.4, head);
  }
  // cabelo
  const hairM = M(def.hairColor ?? 0x111111);
  if (def.hair === 'curly') {
    // cabelo cacheado volumoso: vários "cachos" em volta da cabeça
    const curl = G.sphere(0.13, 5, 4);
    const r = mulberry(7);
    for (let i = 0; i < 70; i++) {
      const th = r() * Math.PI * 2, ph = r() * 1.35;
      const back = Math.cos(th) < -0.2 ? 1 : 0;
      const rad = 0.42 + r() * 0.08;
      const x = Math.sin(ph) * Math.sin(th) * rad * 1.08;
      const y = Math.cos(ph) * rad + 0.08;
      const z = Math.sin(ph) * Math.cos(th) * rad;
      if (z > 0.18 && y < 0.3) continue; // deixa o rosto livre
      const c = mesh(curl, hairM, x, y + 0.05, z, head);
      const s = 0.9 + r() * 0.6; c.scale.set(s, s, s);
    }
    const top = mesh(G.sphere(0.46, 8, 6), hairM, 0, 0.2, -0.04, head); top.scale.set(1.12, 0.78, 1.05);
  } else if (def.hair === 'short') {
    const cap = mesh(new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM, 0, 0.04, -0.02, head);
    cap.scale.set(1.02, 1.0, 1.02);
    mesh(G.box(0.72, 0.18, 0.3), hairM, 0, 0.0, -0.25, head);
    for (const s of [-1, 1]) mesh(G.box(0.06, 0.2, 0.2), hairM, s * 0.4, 0.04, -0.02, head);
    mesh(G.box(0.4, 0.1, 0.12), hairM, 0, 0.36, 0.2, head).rotation.x = -0.3;
  } else if (def.hair === 'helmet') {
    const hm = M(def.helmetColor ?? 0x2255dd);
    const h = mesh(G.sphere(0.47, 10, 7), hm, 0, 0.08, -0.02, head); h.scale.set(1, 0.95, 1);
    const visor = mesh(G.box(0.62, 0.22, 0.1), M(0x223344, { emissive: 0x112233 }), 0, 0.05, 0.42, head); visor.rotation.x = -0.15;
    mesh(G.box(0.1, 0.12, 0.6), M(0xffffff), 0, 0.5, 0, head);
  }
  root.userData.joints = J;
  root.userData.def = def;
  return root;
}

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- poses ----------
function resetJ(J) {
  for (const k in J) if (J[k].rotation) J[k].rotation.set(0, 0, 0);
  J.torso.scale.set(1, 1, 1);
}

export function poseStand(char, t, style = 'idle') {
  const J = char.userData.joints;
  resetJ(J);
  J.hips.position.set(0, 0.62, 0);
  const br = Math.sin(t * 2.2);
  J.torso.scale.y = 1 + br * 0.025;
  J.head.rotation.y = Math.sin(t * 0.7) * 0.25;
  J.head.rotation.z = Math.sin(t * 1.1) * 0.05;
  J.armL.rotation.z = 0.12 + br * 0.03; J.armR.rotation.z = -0.12 - br * 0.03;
  J.legL.rotation.z = 0.04; J.legR.rotation.z = -0.04;
  if (style === 'wave') {
    // Cauã acena
    J.armR.rotation.z = -2.5; J.armR.rotation.x = -0.2;
    J.elbowR.rotation.z = -0.3 + Math.sin(t * 7) * 0.45;
    J.hips.rotation.y = 0.1;
    J.legL.rotation.x = -0.05;
  } else if (style === 'cross') {
    // Renato cruza os braços
    J.armL.rotation.set(-0.55, 0, 0.35); J.elbowL.rotation.set(-1.5, 0, 0); J.elbowL.rotation.y = 0;
    J.armR.rotation.set(-0.45, 0, -0.35); J.elbowR.rotation.set(-1.6, 0, 0);
    J.armL.rotation.y = -0.6; J.armR.rotation.y = 0.6;
    J.head.rotation.x = -0.08 + Math.sin(t * 0.9) * 0.03;
    J.legL.rotation.z = 0.12; J.legR.rotation.z = -0.12;
  } else if (style === 'cheer') {
    J.armR.rotation.z = -2.7 + Math.sin(t * 10) * 0.25;
    J.armL.rotation.z = 2.7 - Math.sin(t * 10) * 0.25;
    J.hips.position.y = 0.62 + Math.abs(Math.sin(t * 6)) * 0.15;
    J.head.rotation.x = -0.2;
  } else if (style === 'sad') {
    J.head.rotation.x = 0.35; J.torso.rotation.x = 0.15;
    J.armL.rotation.z = 0.05; J.armR.rotation.z = -0.05;
  } else if (style === 'clap') {
    J.armL.rotation.set(-1.1, 0, 0.3); J.armR.rotation.set(-1.1, 0, -0.3);
    const c = Math.sin(t * 12) * 0.25;
    J.armL.rotation.y = -0.4 - c; J.armR.rotation.y = 0.4 + c;
  }
}

export function poseRide(char, lean = 0, accel = 0, t = 0, mode = 'ride') {
  const J = char.userData.joints;
  resetJ(J);
  J.hips.position.set(0, 0, 0);
  J.legL.rotation.x = -1.25; J.legR.rotation.x = -1.25;
  J.legL.rotation.z = 0.25; J.legR.rotation.z = -0.25;
  J.kneeL.rotation.x = 1.75; J.kneeR.rotation.x = 1.75;
  J.torso.rotation.x = 0.5 + accel * 0.15;
  J.head.rotation.x = -0.45 - accel * 0.1;
  J.armL.rotation.set(-1.15, 0, 0.25); J.armR.rotation.set(-1.15, 0, -0.25);
  J.elbowL.rotation.x = -0.35; J.elbowR.rotation.x = -0.35;
  J.torso.rotation.z = lean * 0.35;
  J.head.rotation.z = -lean * 0.2;
  if (mode === 'cheer') {
    J.torso.rotation.x = 0.05;
    J.armR.rotation.set(0, 0, -2.6 + Math.sin(t * 10) * 0.3);
    J.elbowR.rotation.x = 0;
    J.head.rotation.x = -0.15;
  } else if (mode === 'spin') {
    J.head.rotation.y = Math.sin(t * 20) * 0.5;
    J.armL.rotation.z = 1.2; J.armR.rotation.z = -1.2;
  } else if (mode === 'dizzy') {
    J.head.rotation.z = Math.sin(t * 6) * 0.35;
  }
}

// ===================== MOTOS =====================
function wheel(r, w, rimColor, parent, z) {
  const g = new THREE.Group(); g.position.set(0, r, z); parent.add(g);
  const tire = mesh(G.cyl(r, r, w, 12), M(0x1a1a1a), 0, 0, 0, g); tire.rotation.z = Math.PI / 2;
  const rim = mesh(G.cyl(r * 0.68, r * 0.68, w + 0.02, 10), M(rimColor), 0, 0, 0, g); rim.rotation.z = Math.PI / 2;
  const hub = mesh(G.cyl(r * 0.25, r * 0.25, w + 0.06, 6), M(0x999999), 0, 0, 0, g); hub.rotation.z = Math.PI / 2;
  for (let i = 0; i < 3; i++) { const sp = mesh(G.box(w + 0.03, r * 1.3, 0.05), M(0x2a2a2a), 0, 0, 0, g); sp.rotation.x = i * Math.PI / 3; }
  // disco de freio
  const disc = mesh(G.cyl(r * 0.5, r * 0.5, 0.02, 10), M(0xb8b8b8), w / 2 + 0.03, 0, 0, g); disc.rotation.z = Math.PI / 2;
  return g;
}

// Triumph Trident 660 (naked, tanque cinza, farol redondo, detalhes preto/vermelho)
export function buildTrident() {
  const b = new THREE.Group();
  const black = M(0x1b1b1d), gray = M(0x8d939b), red = M(0xd8202a), chrome = M(0xd0d4d8), dark = M(0x3a3c40);
  b.userData.wheels = [wheel(0.33, 0.17, 0x111111, b, 0.72), wheel(0.33, 0.2, 0x111111, b, -0.68)];
  for (const w of b.userData.wheels) mesh(G.cyl(0.24, 0.24, 0.22, 10), red, 0, 0, 0, w).rotation.z = Math.PI / 2; // friso vermelho
  // quadro
  const fr = mesh(G.box(0.12, 0.08, 1.05), black, 0, 0.78, 0.02, b); fr.rotation.x = 0.12;
  mesh(G.box(0.36, 0.34, 0.5), dark, 0, 0.5, 0.06, b);            // motor
  for (const x of [-0.11, 0, 0.11]) mesh(G.box(0.08, 0.2, 0.12), chrome, x, 0.73, 0.22, b); // cilindros
  // tanque cinza com faixa
  const tank = mesh(G.sphere(0.3, 8, 6), gray, 0, 0.9, 0.18, b); tank.scale.set(0.85, 0.62, 1.15);
  mesh(G.box(0.05, 0.03, 0.52), red, 0, 1.06, 0.18, b);
  for (const s of [-1, 1]) { const sp = mesh(G.box(0.03, 0.12, 0.34), black, s * 0.24, 0.86, 0.16, b); sp.rotation.y = s * 0.15; }
  // banco e rabeta curta
  mesh(G.box(0.28, 0.09, 0.5), black, 0, 0.9, -0.3, b);
  const tail = mesh(G.box(0.22, 0.1, 0.32), black, 0, 0.95, -0.62, b); tail.rotation.x = -0.25;
  mesh(G.box(0.14, 0.05, 0.04), M(0xff2020, { emissive: 0x880000 }), 0, 0.97, -0.79, b);
  // balança traseira
  for (const s of [-1, 1]) { const sw = mesh(G.box(0.05, 0.08, 0.7), black, s * 0.12, 0.38, -0.36, b); sw.rotation.x = 0.1; }
  // escapamento curto embaixo
  const ex = mesh(G.cyl(0.08, 0.1, 0.4, 8), M(0x555555), 0.16, 0.3, -0.12, b); ex.rotation.x = Math.PI / 2;
  // garfo dianteiro
  for (const s of [-1, 1]) { const fk = mesh(G.cyl(0.035, 0.035, 0.8, 6), M(0xc49a2c), s * 0.11, 0.7, 0.62, b); fk.rotation.x = -0.42; }
  // farol redondo característico
  const hl = mesh(G.cyl(0.14, 0.14, 0.1, 12), chrome, 0, 1.0, 0.82, b); hl.rotation.x = Math.PI / 2;
  const lens = mesh(G.cyl(0.115, 0.115, 0.02, 12), M(0xfff6c8, { emissive: 0xfff2a0 }), 0, 1.0, 0.875, b); lens.rotation.x = Math.PI / 2;
  b.userData.headlight = lens;
  // guidão e retrovisores
  const hb = mesh(G.cyl(0.025, 0.025, 0.72, 6), black, 0, 1.12, 0.6, b); hb.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) {
    mesh(G.cyl(0.015, 0.015, 0.22, 4), black, s * 0.3, 1.24, 0.6, b);
    mesh(G.cyl(0.06, 0.06, 0.02, 8), black, s * 0.3, 1.35, 0.6, b).rotation.x = Math.PI / 2;
  }
  // para-lama dianteiro
  const fen = mesh(G.box(0.16, 0.04, 0.4), black, 0, 0.7, 0.75, b); fen.rotation.x = 0.4;
  return b;
}

// BMW S1000RR (esportiva carenada preto/cinza/vermelho)
export function buildS1000() {
  const b = new THREE.Group();
  const black = M(0x161618), gray = M(0x6d7278), red = M(0xd11f2a), chrome = M(0xc8ccd0), glass = M(0x2a3644, { transparent: true, opacity: 0.8 });
  b.userData.wheels = [wheel(0.33, 0.16, 0x222222, b, 0.75), wheel(0.33, 0.22, 0x222222, b, -0.72)];
  for (const w of b.userData.wheels) mesh(G.cyl(0.235, 0.235, 0.23, 10), red, 0, 0, 0, w).rotation.z = Math.PI / 2;
  // carenagem lateral grande
  const side = mesh(G.box(0.4, 0.42, 0.9), gray, 0, 0.62, 0.12, b); side.rotation.x = -0.08;
  for (const s of [-1, 1]) {
    const pan = mesh(G.box(0.03, 0.3, 0.62), red, s * 0.205, 0.66, 0.16, b); pan.rotation.x = -0.15;
    const pan2 = mesh(G.box(0.03, 0.14, 0.4), black, s * 0.21, 0.48, 0.3, b); pan2.rotation.x = 0.3;
  }
  // carenagem frontal em cunha
  const nose = mesh(G.box(0.42, 0.3, 0.5), black, 0, 0.92, 0.62, b); nose.rotation.x = 0.45;
  const nose2 = mesh(G.box(0.34, 0.16, 0.3), red, 0, 0.84, 0.86, b); nose2.rotation.x = 0.6;
  // faróis assimétricos
  const l1 = mesh(G.box(0.12, 0.06, 0.04), M(0xfff6c8, { emissive: 0xfff2a0 }), -0.1, 0.92, 0.92, b); l1.rotation.x = 0.5;
  const l2 = mesh(G.box(0.09, 0.08, 0.04), M(0xfff6c8, { emissive: 0xfff2a0 }), 0.1, 0.9, 0.93, b); l2.rotation.x = 0.5;
  b.userData.headlight = l1;
  // bolha
  const ws = mesh(G.box(0.3, 0.04, 0.34), glass, 0, 1.12, 0.6, b); ws.rotation.x = 0.55;
  // tanque
  const tank = mesh(G.sphere(0.28, 8, 6), black, 0, 0.95, 0.15, b); tank.scale.set(0.95, 0.6, 1.1);
  mesh(G.box(0.3, 0.03, 0.32), gray, 0, 1.11, 0.16, b);
  // banco e rabeta alta
  mesh(G.box(0.26, 0.08, 0.32), black, 0, 0.98, -0.25, b);
  const tail = mesh(G.box(0.26, 0.16, 0.5), red, 0, 1.06, -0.55, b); tail.rotation.x = -0.32;
  const tail2 = mesh(G.box(0.27, 0.06, 0.4), M(0xf2f2f2), 0, 1.14, -0.55, b); tail2.rotation.x = -0.32;
  mesh(G.box(0.12, 0.04, 0.04), M(0xff2020, { emissive: 0x880000 }), 0, 1.15, -0.8, b);
  // balança e escapamento lateral
  for (const s of [-1, 1]) { const sw = mesh(G.box(0.05, 0.1, 0.72), gray, s * 0.13, 0.4, -0.36, b); sw.rotation.x = 0.1; }
  const ex = mesh(G.cyl(0.07, 0.09, 0.42, 8), M(0x3a3a3a), 0.2, 0.42, -0.38, b); ex.rotation.x = Math.PI / 2 - 0.25;
  // garfo dourado
  for (const s of [-1, 1]) { const fk = mesh(G.cyl(0.035, 0.035, 0.75, 6), M(0xd4a52c), s * 0.1, 0.66, 0.66, b); fk.rotation.x = -0.4; }
  // semi-guidões
  for (const s of [-1, 1]) { const hb = mesh(G.cyl(0.022, 0.022, 0.2, 6), black, s * 0.24, 1.02, 0.48, b); hb.rotation.z = Math.PI / 2; }
  const fen = mesh(G.box(0.16, 0.04, 0.42), red, 0, 0.7, 0.78, b); fen.rotation.x = 0.4;
  return b;
}

// Moto genérica para os rivais NPC
export function buildGenericBike(main = 0x2a7fff, accent = 0xffffff) {
  const b = new THREE.Group();
  const c = M(main), a = M(accent), black = M(0x1a1a1a);
  b.userData.wheels = [wheel(0.32, 0.16, 0x333333, b, 0.7), wheel(0.32, 0.2, 0x333333, b, -0.68)];
  mesh(G.box(0.36, 0.34, 0.5), M(0x444444), 0, 0.52, 0.05, b);
  const tank = mesh(G.sphere(0.28, 8, 6), c, 0, 0.9, 0.16, b); tank.scale.set(0.9, 0.62, 1.1);
  mesh(G.box(0.06, 0.03, 0.5), a, 0, 1.06, 0.16, b);
  mesh(G.box(0.28, 0.09, 0.5), black, 0, 0.92, -0.3, b);
  const tail = mesh(G.box(0.24, 0.12, 0.36), c, 0, 0.98, -0.6, b); tail.rotation.x = -0.25;
  const nose = mesh(G.box(0.36, 0.26, 0.3), c, 0, 0.96, 0.66, b); nose.rotation.x = 0.4;
  const l = mesh(G.box(0.18, 0.08, 0.04), M(0xfff6c8, { emissive: 0xfff2a0 }), 0, 0.96, 0.82, b); l.rotation.x = 0.4;
  b.userData.headlight = l;
  for (const s of [-1, 1]) { const fk = mesh(G.cyl(0.035, 0.035, 0.75, 6), M(0xaaaaaa), s * 0.1, 0.66, 0.6, b); fk.rotation.x = -0.4; }
  const hb = mesh(G.cyl(0.025, 0.025, 0.66, 6), black, 0, 1.12, 0.52, b); hb.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { const sw = mesh(G.box(0.05, 0.08, 0.7), black, s * 0.12, 0.38, -0.36, b); sw.rotation.x = 0.1; }
  return b;
}

export function spinWheels(bike, amount) {
  for (const w of bike.userData.wheels) w.rotation.x += amount;
}

// Sombra circular simples (estilo N64)
const shadowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
export function blobShadow(w = 1.2, l = 2.4) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.09;
  return m;
}
