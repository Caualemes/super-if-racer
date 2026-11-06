// Personagens 3D low-poly no estilo boneco N64 (cabeça grande, corpo estilizado)
// O personagem olha para +Z; o lado esquerdo dele é +X. Origem nos pés.
import * as THREE from 'three';
import { M, Tx, mesh, G, flatShape, mulberry } from './common.js';

const FY = 0.32; // centro do rosto dentro do grupo da cabeça (ligeiramente acima para a cabeça maior)

export function buildCharacter(def) {
  const root = new THREE.Group();
  const J = {};
  // Texturas pixel-art com NearestFilter para o look N64 crocante
  const skin = Tx(def.skin, 0.05, {}, 'skin');
  const skinD = Tx(def.skinShade ?? shade(def.skin, 0.82), 0.04, {}, 'skin');
  const top = Tx(def.suit, 0.04, {}, 'stripe');
  const topD = Tx(def.suit2 ?? shade(def.suit, 0.8), 0.04, {}, 'stripe');
  const pants = Tx(def.pants ?? def.suit, 0.04, {}, 'stripe');
  const boots = M(def.boots ?? 0x1a1a1a);

  // ---------------- quadril e pernas ----------------
  const hips = new THREE.Group(); hips.position.y = 0.74; root.add(hips); J.hips = hips;
  mesh(G.box(0.4, 0.2, 0.26), pants, 0, -0.02, 0, hips);
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.11, -0.04, 0); hips.add(leg);
    mesh(G.cap(0.1, 0.18, 7), pants, 0, -0.15, 0, leg);
    if (def.outfit === 'flightsuit') mesh(G.box(0.05, 0.13, 0.13), topD, s * 0.1, -0.17, 0.01, leg); // bolso cargo
    const knee = new THREE.Group(); knee.position.y = -0.32; leg.add(knee);
    mesh(G.cap(0.092, 0.16, 7), pants, 0, -0.14, 0, knee);
    // barra da calça sobre a bota
    mesh(G.cyl(0.11, 0.115, 0.07, 7), pants, 0, -0.25, 0, knee);
    // bota arredondada
    mesh(G.box(0.19, 0.13, 0.27), boots, 0, -0.325, 0.035, knee);
    const toe = mesh(G.sphere(0.1, 7, 5), boots, 0, -0.33, 0.15, knee); toe.scale.set(0.95, 0.65, 1);
    mesh(G.box(0.2, 0.03, 0.31), M(0x0c0c0c), 0, -0.38, 0.05, knee); // sola
    J[s < 0 ? 'legR' : 'legL'] = leg; J[s < 0 ? 'kneeR' : 'kneeL'] = knee;
  }

  // ---------------- tronco ----------------
  const torso = new THREE.Group(); torso.position.y = 0.06; hips.add(torso); J.torso = torso;
  const chest = mesh(G.cyl(0.25, 0.21, 0.54, 8), top, 0, 0.29, 0, torso);
  chest.scale.z = 0.64;
  if (def.outfit === 'flightsuit') flightSuit(torso, top, topD);
  else if (def.outfit === 'jacket') bikerJacket(torso, top, topD);
  else mesh(G.box(0.46, 0.1, 0.3), topD, 0, 0.04, 0, torso);

  // ---------------- braços ----------------
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.29, 0.5, 0); torso.add(sh);
    mesh(G.sphere(0.11, 7, 5), top, 0, -0.01, 0, sh);
    mesh(G.cap(0.085, 0.14, 7), top, 0, -0.13, 0, sh);
    if (def.outfit === 'flightsuit' && s > 0) { // patch redondo no ombro esquerdo
      const p = mesh(G.cyl(0.05, 0.05, 0.02, 8), M(0x1fa83a), 0.088, -0.1, 0, sh); p.rotation.z = Math.PI / 2;
    }
    if (def.outfit === 'jacket') mesh(G.box(0.02, 0.2, 0.06), topD, s * 0.08, -0.13, 0, sh); // faixa discreta
    const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
    mesh(G.cap(0.08, 0.12, 7), top, 0, -0.1, 0, el);
    mesh(G.cyl(0.088, 0.088, 0.06, 7), topD, 0, -0.2, 0, el); // punho
    const hand = new THREE.Group(); hand.position.y = -0.25; el.add(hand);
    const fist = mesh(G.sphere(0.078, 7, 5), skin, 0, -0.03, 0.005, hand); fist.scale.set(0.85, 1.05, 1);
    const thumb = new THREE.Group(); thumb.position.set(-s * 0.03, -0.02, 0.04); hand.add(thumb);
    mesh(G.cap(0.024, 0.05, 5), skin, 0, -0.045, 0, thumb);
    thumb.rotation.x = -Math.PI / 2;
    J[s < 0 ? 'armR' : 'armL'] = sh; J[s < 0 ? 'elbowR' : 'elbowL'] = el;
    J[s < 0 ? 'handR' : 'handL'] = hand; J[s < 0 ? 'thumbR' : 'thumbL'] = thumb;
  }

  // ---------------- cabeça chibi (proporção N64: cabeça grande ~40% maior) ----------------
  const HR = 0.40; // raio da cabeça (era 0.34, agora maior para look chibi)
  mesh(G.cyl(0.082, 0.095, 0.14, 7), skin, 0, 0.6, 0, torso); // pescoço mais espesso
  const head = new THREE.Group(); head.position.y = 0.64; torso.add(head); J.head = head;
  const face = mesh(G.sphere(HR, 14, 10), skin, 0, FY, 0, head);
  face.scale.set(...(def.faceScale ?? [1, 1.02, 0.98]));
  if (def.chin) { const c = mesh(G.box(0.19, 0.08, 0.11), skin, 0, FY - 0.31, 0.15, head); c.rotation.x = 0.25; }
  // orelhas maiores para preencher a cabeça maior
  for (const s of [-1, 1]) { const e = mesh(G.sphere(0.088, 6, 5), skin, s * 0.395, FY - 0.03, 0.02, head); e.scale.set(0.45, 1, 0.75); }
  // nariz
  const nose = mesh(G.sphere((def.noseSize ?? 0.068) * 1.15, 7, 5), skinD, 0, FY - 0.055, 0.395, head);
  nose.scale.set(0.95, 0.9, 1.25);
  // sobrancelhas mais grossas e expressivas
  const browM = M(def.browColor ?? def.hairColor ?? 0x222222);
  for (const s of [-1, 1]) {
    const bw = def.thickBrows ? 0.062 : 0.042;
    const b = mesh(G.box(0.155, bw, 0.048), browM, s * 0.148, FY + 0.16, 0.358, head);
    b.rotation.z = s * (def.serious ? 0.18 : -0.09); b.rotation.y = s * 0.28;
  }
  // olhos (esclerótica branca + pupila escura) para chars sem óculos — dá expressão mesmo de longe
  if (!def.glasses) {
    for (const s of [-1, 1]) {
      mesh(G.sphere(0.085, 7, 5), M(0xf0f0f0), s * 0.148, FY + 0.055, 0.375, head).scale.set(0.7, 0.75, 0.6);
      mesh(G.sphere(0.065, 6, 4), M(0x1a1010), s * 0.148, FY + 0.045, 0.395, head).scale.set(0.6, 0.7, 0.55);
    }
  }
  // boca
  const mouthM = M(0x5a1e1e);
  const mouth = new THREE.Group(); mouth.position.set(0, FY - 0.23, 0.325); head.add(mouth); J.mouth = mouth;
  if (def.smile) {
    mesh(G.box(0.115, 0.034, 0.034), mouthM, 0, 0, 0, mouth);
    for (const s of [-1, 1]) { const c = mesh(G.box(0.05, 0.03, 0.034), mouthM, s * 0.075, 0.018, -0.012, mouth); c.rotation.z = s * 0.5; }
  } else {
    // boca séria: linha fina e escura
    mesh(G.box(0.138, 0.018, 0.022), M(0x3a2420), 0, 0, 0.006, mouth);
  }
  // marcas de expressão (rosto mais velho): sulcos finos e escuros, rentes ao rosto
  if (def.wrinkles) {
    const wm = M(shade(def.skin, 0.68));
    for (const s of [-1, 1]) {
      const w = mesh(G.box(0.012, 0.1, 0.012), wm, s * 0.12, FY - 0.17, 0.338, head); w.rotation.z = s * 0.4; w.rotation.y = s * 0.32;
    }
    mesh(G.box(0.165, 0.009, 0.012), wm, 0, FY + 0.23, 0.332, head); // ruga na testa
  }
  if (def.mustache) mustache(head, M(def.hairColor ?? 0x141012));
  if (def.glasses === 'aviator') aviators(head);
  else if (def.glasses === 'wrap') wrapGlasses(head);
  if (def.hair === 'pompadour') hairPompadour(head, M(def.hairColor ?? 0x141012), M(shade(def.hairColor ?? 0x141012, 1.8)));
  else if (def.hair === 'grayShort') hairGrayShort(head, def.hairColor ?? 0xb9bcc0);
  else if (def.hair === 'helmet') helmet(head, M(def.helmetColor ?? 0x2255dd));

  root.userData.joints = J;
  root.userData.def = def;
  return root;
}

function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * k); c.g = Math.min(1, c.g * k); c.b = Math.min(1, c.b * k);
  return c.getHex();
}

// ---------- roupas ----------
function flightSuit(torso, top, topD) {
  // macacão verde-militar de piloto: gola, zíper, bolsos, bandeira e emblemas
  mesh(G.box(0.025, 0.46, 0.02), M(0x2f3720), 0, 0.29, 0.162, torso);           // zíper
  for (const s of [-1, 1]) {
    const lap = mesh(G.box(0.13, 0.12, 0.04), topD, s * 0.08, 0.52, 0.12, torso); // gola aberta
    lap.rotation.z = s * -0.5; lap.rotation.x = -0.3;
    mesh(G.box(0.14, 0.1, 0.025), topD, s * 0.12, 0.36, 0.16, torso);           // bolso
    mesh(G.box(0.14, 0.03, 0.03), M(0x323a22), s * 0.12, 0.41, 0.165, torso);  // aba do bolso
  }
  // bandeira do Brasil (lado esquerdo = +x)
  const flag = new THREE.Group(); flag.position.set(0.12, 0.44, 0.17); torso.add(flag);
  mesh(G.box(0.11, 0.07, 0.012), M(0x1f9a3a), 0, 0, 0, flag);
  const dia = mesh(G.box(0.05, 0.05, 0.014), M(0xffd21f), 0, 0, 0.002, flag); dia.rotation.z = Math.PI / 4; dia.scale.set(1.15, 0.75, 1);
  mesh(G.cyl(0.018, 0.018, 0.012, 8), M(0x1f3fb0), 0, 0, 0.006, flag).rotation.x = Math.PI / 2;
  // plaqueta de nome + asas douradas (lado direito)
  mesh(G.box(0.12, 0.045, 0.014), M(0x232a17), -0.12, 0.44, 0.168, torso);
  mesh(G.box(0.08, 0.015, 0.016), M(0xd8b04a), -0.12, 0.445, 0.172, torso);
  // cinto
  mesh(G.cyl(0.215, 0.215, 0.07, 8), M(0x3a4326), 0, 0.05, 0, torso).scale.z = 0.66;
  mesh(G.box(0.07, 0.055, 0.02), M(0x9a9a8a), 0, 0.05, 0.145, torso);
}

function bikerJacket(torso, top, topD) {
  // jaqueta de couro preta de motociclista, detalhes discretos
  mesh(G.box(0.022, 0.48, 0.02), M(0xa8acb2), 0.035, 0.29, 0.162, torso);       // zíper prata
  mesh(G.cyl(0.13, 0.15, 0.09, 8), top, 0, 0.58, 0, torso);                      // gola alta
  mesh(G.cyl(0.135, 0.135, 0.02, 8), topD, 0, 0.625, 0, torso);
  for (const s of [-1, 1]) {
    mesh(G.box(0.17, 0.12, 0.03), topD, s * 0.12, 0.47, 0.135, torso).rotation.x = -0.15; // painel do ombro
    mesh(G.box(0.12, 0.015, 0.02), M(0x34353c), s * 0.11, 0.3, 0.155, torso);     // costura/bolso
  }
  mesh(G.box(0.08, 0.02, 0.012), M(0xc0262d), -0.13, 0.42, 0.165, torso);         // detalhe vermelho discreto
  mesh(G.cyl(0.225, 0.225, 0.08, 8), topD, 0, 0.04, 0, torso).scale.z = 0.68;     // barra da jaqueta
}

// ---------- rosto ----------
function mustache(head, mat) {
  // bigode proporcionalmente maior para a cabeça HR=0.40
  const g = new THREE.Group(); g.position.set(0, FY - 0.145, 0.372); head.add(g);
  mesh(G.box(0.26, 0.082, 0.078), mat, 0, 0, 0, g);
  for (const s of [-1, 1]) {
    const t = mesh(G.box(0.09, 0.085, 0.065), mat, s * 0.135, -0.022, -0.016, g); t.rotation.z = s * 0.52; t.rotation.y = s * 0.38;
  }
}

const LENS = () => M(0x0e1218, { emissive: 0x0a1424 });
function aviators(head) {
  // óculos aviador: lentes em gota maiores, armação dourada — proporção para HR=0.40
  const frame = M(0xd4ac4c), lens = LENS(), shine = M(0xffffff, { emissive: 0xaaaaaa });
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * 0.148, FY + 0.052, 0.368); g.rotation.y = s * 0.28; head.add(g);
    const pts = [[-0.1, 0.052], [0.1, 0.052], [0.118, 0.0], [0.084, -0.088], [0.0, -0.112], [-0.078, -0.082], [-0.108, -0.012]].map(([x, y]) => [x * s, y]);
    const l = flatShape(pts, 0.022, lens, g); l.position.z = 0.014;
    const f = flatShape(pts.map(([x, y]) => [x * 1.12, y * 1.12 + 0.005]), 0.019, frame, g); f.position.z = 0.002;
    const sh = mesh(G.box(0.052, 0.014, 0.006), shine, -s * 0.04, 0.018, 0.038, g); sh.rotation.z = s * 0.5;
    // haste até a orelha (mais longa para cabeça maior)
    const t = mesh(G.box(0.014, 0.014, 0.35), frame, s * 0.12, 0.034, -0.165, g); t.rotation.y = s * 0.12;
  }
  mesh(G.box(0.082, 0.014, 0.018), frame, 0, FY + 0.1, 0.395, head);
  mesh(G.box(0.06, 0.012, 0.018), frame, 0, FY + 0.074, 0.395, head);
}

function wrapGlasses(head) {
  // óculos retangulares envolventes, armação preta grossa — escala para HR=0.40
  const frame = M(0x141416), lens = LENS(), shine = M(0xffffff, { emissive: 0xaaaaaa });
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * 0.148, FY + 0.045, 0.365); g.rotation.y = s * 0.3; head.add(g);
    mesh(G.box(0.224, 0.13, 0.03), frame, 0, 0, 0, g);
    mesh(G.box(0.195, 0.1, 0.024), lens, 0, -0.004, 0.014, g);
    const sh = mesh(G.box(0.06, 0.012, 0.006), shine, -s * 0.048, 0.024, 0.028, g); sh.rotation.z = s * 0.4;
    mesh(G.box(0.028, 0.04, 0.38), frame, s * 0.112, 0.034, -0.175, g).rotation.y = s * 0.1;
  }
  mesh(G.box(0.082, 0.035, 0.03), frame, 0, FY + 0.074, 0.395, head);
}

// ---------- cabelos ----------
function hairPompadour(head, mat, hi) {
  // cabelo preto, volumoso e ondulado — escala para HR=0.40
  const main = mesh(G.sphere(0.44, 10, 7), mat, 0, FY + 0.2, -0.09, head); main.scale.set(1.08, 0.66, 1.03);
  const back = mesh(G.sphere(0.42, 10, 7), mat, 0, FY + 0.02, -0.11, head); back.scale.set(0.99, 0.95, 0.88);
  // volume lateral acima das orelhas
  for (const s of [-1, 1]) {
    const side = mesh(G.sphere(0.2, 7, 5), mat, s * 0.355, FY + 0.14, -0.05, head); side.scale.set(0.75, 1, 1.25);
    mesh(G.box(0.06, 0.155, 0.095), mat, s * 0.385, FY - 0.0, 0.12, head); // costeletas
  }
  // topete ondulado na frente
  const r = mulberry(11);
  const front = [[-0.24, 0.29, 0.22, 0.13], [-0.12, 0.36, 0.26, 0.155], [0.02, 0.4, 0.27, 0.165], [0.15, 0.37, 0.25, 0.155], [0.26, 0.3, 0.22, 0.13]];
  for (const [x, y, z, rr] of front) { const w = mesh(G.sphere(rr, 7, 5), mat, x, FY + y, z, head); w.scale.set(1.1, 0.85, 1); }
  // ondas/cachos no topo para quebrar a silhueta
  for (let i = 0; i < 18; i++) {
    const a = r() * Math.PI * 2, d = 0.09 + r() * 0.28;
    const x = Math.cos(a) * d * 1.05, z = Math.sin(a) * d - 0.05;
    const y = FY + 0.43 - d * d * 1.2;
    const c = mesh(G.sphere(0.082 + r() * 0.045, 6, 4), i % 5 === 0 ? hi : mat, x, y, z, head);
    c.scale.set(1.2, 0.7, 1);
  }
}

function hairGrayShort(head, color) {
  // cabelo curto, grisalho e texturizado — escala para HR=0.40
  const base = M(color), light = M(shade(color, 1.15)), dark = M(shade(color, 0.75));
  const cap = mesh(new THREE.SphereGeometry(0.42, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.5), base, 0, FY + 0.02, -0.02, head);
  cap.rotation.x = -0.32;
  for (const s of [-1, 1]) mesh(G.box(0.06, 0.165, 0.305), dark, s * 0.385, FY + 0.03, -0.07, head);
  mesh(G.box(0.6, 0.19, 0.14), dark, 0, FY - 0.0, -0.34, head);
  const r = mulberry(5);
  const mats = [base, light, dark];
  for (let i = 0; i < 52; i++) {
    const th = r() * Math.PI * 2, ph = r() * 1.2;
    const rad = 0.415;
    const x = Math.sin(ph) * Math.sin(th) * rad, y = Math.cos(ph) * rad, z = Math.sin(ph) * Math.cos(th) * rad;
    const c = Math.cos(-0.32), sn = Math.sin(-0.32);
    const y2 = y * c - z * sn, z2 = y * sn + z * c;
    if (z2 > 0.24 && y2 < 0.18) continue;
    mesh(G.sphere(0.062 + r() * 0.024, 5, 4), mats[i % 3], x, FY + 0.02 + y2, -0.02 + z2, head);
  }
}

function helmet(head, mat) {
  // capacete proporcional para HR=0.40
  const h = mesh(G.sphere(0.51, 10, 7), mat, 0, FY + 0.07, -0.02, head); h.scale.set(1, 0.98, 1.02);
  const visor = mesh(G.box(0.66, 0.24, 0.12), M(0x223344, { emissive: 0x112233 }), 0, FY + 0.055, 0.45, head); visor.rotation.x = -0.15;
  mesh(G.box(0.095, 0.12, 0.74), M(0xffffff), 0, FY + 0.54, -0.02, head);
}
