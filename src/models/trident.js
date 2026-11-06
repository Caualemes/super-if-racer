// Triumph Trident 660 low-poly: naked, tanque cinza, farol redondo, motor de 3 cilindros,
// defletores vermelhos do radiador, rodas pretas e escape curto metálico.
// A moto olha para +Z. Roda dianteira em z=+0.72, traseira em z=-0.70, raio 0.33.
import * as THREE from 'three';
import { M, mesh, G, profile, rod, tube, wheel } from './common.js';

export function buildTrident() {
  const b = new THREE.Group();
  const black = M(0x18181a), satin = M(0x2b2c30), gray = M(0x9ea4ab), grayD = M(0x6b7178);
  const silver = M(0xc9ced4), chrome = M(0xe2e6ea), red = M(0xd71f28), steel = M(0xb0b5bb);

  // rodas
  const fw = wheel({ r: 0.33, w: 0.16, rim: 0x141414, spokes: 6, discs: 2, caliper: 0x2a2a2a });
  fw.position.set(0, 0.33, 0.72); b.add(fw);
  const rw = wheel({ r: 0.33, w: 0.21, rim: 0x141414, spokes: 6, discs: 1, discR: 0.34 });
  rw.position.set(0, 0.33, -0.7); b.add(rw);
  b.userData.wheels = [fw.userData.spin, rw.userData.spin];

  // quadro tubular preto (dos dois lados)
  for (const s of [-1, 1]) {
    tube([[s * 0.09, 1.02, 0.47], [s * 0.16, 0.86, 0.22], [s * 0.17, 0.7, -0.05], [s * 0.15, 0.52, -0.22]], 0.032, black, b, 8);
    tube([[s * 0.15, 0.85, -0.12], [s * 0.12, 0.9, -0.45], [s * 0.08, 0.96, -0.72]], 0.022, black, b, 6); // subchassi
  }
  // balança traseira e amortecedor com mola vermelha
  for (const s of [-1, 1]) profile([[-0.18, 0.47], [-0.7, 0.36], [-0.72, 0.3], [-0.18, 0.4]], 0.05, black, { x: s * 0.12, parent: b, bevel: 0.01 });
  rod([0.06, 0.48, -0.32], [0.06, 0.86, -0.36], 0.035, black, b);
  const spring = mesh(G.cyl(0.05, 0.05, 0.22, 8), red, 0.06, 0.66, -0.34, b); spring.rotation.x = 0.1;

  // motor: bloco + 3 cilindros com aletas + tampas prateadas
  profile([[-0.24, 0.32], [0.3, 0.3], [0.38, 0.5], [0.32, 0.66], [-0.05, 0.62], [-0.26, 0.5]], 0.36, satin, { parent: b, bevel: 0.02 });
  for (let i = 0; i < 4; i++) mesh(G.box(0.38, 0.02, 0.2), silver, 0, 0.64 + i * 0.045, 0.2 - i * 0.02, b).rotation.x = 0.35;
  mesh(G.box(0.34, 0.06, 0.18), black, 0, 0.82, 0.13, b).rotation.x = 0.35; // cabeçote
  for (const s of [-1, 1]) {
    const cov = mesh(G.cyl(0.12, 0.12, 0.03, 10), silver, s * 0.19, 0.45, 0.02, b); cov.rotation.z = Math.PI / 2;
    const cov2 = mesh(G.cyl(0.07, 0.07, 0.03, 8), grayD, s * 0.2, 0.47, -0.16, b); cov2.rotation.z = Math.PI / 2;
  }
  // coletores (3 tubos) descendo pela frente até o escape curto embaixo
  for (const x of [-0.09, 0, 0.09]) {
    tube([[x, 0.66, 0.36], [x * 1.1, 0.5, 0.46], [x * 0.8, 0.24, 0.38], [0.06 + x * 0.3, 0.17, 0.1], [0.1, 0.19, -0.1]], 0.026, steel, b, 10);
  }
  // panela de escape curta, sob o motor (lado direito)
  const can = mesh(G.cyl(0.085, 0.1, 0.32, 8), steel, -0.13, 0.22, -0.22, b); can.rotation.x = Math.PI / 2 - 0.15;
  const tip = mesh(G.cyl(0.06, 0.06, 0.04, 8), M(0x2a2a2a), -0.13, 0.24, -0.39, b); tip.rotation.x = Math.PI / 2 - 0.15;

  // radiador + defletores vermelhos característicos
  mesh(G.box(0.36, 0.26, 0.05), black, 0, 0.72, 0.42, b).rotation.x = -0.3;
  for (const s of [-1, 1]) {
    profile([[0.3, 0.66], [0.5, 0.74], [0.52, 0.92], [0.4, 0.98], [0.3, 0.86]], 0.035, red, { x: s * 0.215, parent: b, bevel: 0.008 });
  }

  // tanque cinza esculpido, com faixa escura e joelheiras
  profile([[-0.08, 0.88], [0.38, 0.9], [0.5, 1.02], [0.42, 1.16], [0.1, 1.2], [-0.12, 1.1]], 0.42, gray, { parent: b, bevel: 0.05 });
  profile([[0.0, 0.9], [0.32, 0.92], [0.36, 1.0], [0.04, 1.0]], 0.47, grayD, { parent: b, bevel: 0.01 });
  mesh(G.box(0.07, 0.015, 0.4), black, 0, 1.235, 0.16, b).rotation.x = -0.08; // faixa central
  mesh(G.cyl(0.05, 0.05, 0.02, 8), M(0x3a3a3a), 0, 1.23, 0.28, b);              // tampa do tanque

  // banco degrau e rabeta curta
  profile([[-0.12, 0.98], [-0.48, 1.0], [-0.62, 1.07], [-0.66, 1.12], [-0.44, 1.1], [-0.14, 1.09]], 0.3, black, { parent: b, bevel: 0.03 });
  mesh(G.box(0.28, 0.012, 0.3), grayD, 0, 1.1, -0.3, b); // costura cinza
  profile([[-0.6, 1.0], [-0.86, 1.08], [-0.88, 1.13], [-0.66, 1.14]], 0.22, black, { parent: b, bevel: 0.02 });
  mesh(G.box(0.14, 0.04, 0.03), M(0xff2a2a, { emissive: 0x991010 }), 0, 1.1, -0.88, b);
  // suporte de placa/para-lama traseiro
  rod([0, 1.02, -0.82], [0, 0.82, -0.98], 0.02, black, b);
  mesh(G.box(0.16, 0.11, 0.01), M(0xf2f2f2), 0, 0.8, -0.99, b);

  // garfo dianteiro (preto com bainhas douradas) + mesas
  for (const s of [-1, 1]) {
    rod([s * 0.1, 0.33, 0.72], [s * 0.1, 0.72, 0.6], 0.04, M(0x3a3c40), b);
    rod([s * 0.1, 0.72, 0.6], [s * 0.1, 1.12, 0.48], 0.034, black, b);
  }
  mesh(G.box(0.28, 0.04, 0.1), satin, 0, 1.1, 0.49, b);
  mesh(G.box(0.28, 0.035, 0.1), satin, 0, 0.98, 0.52, b);
  // para-lama dianteiro
  profile([[0.5, 0.62], [0.7, 0.7], [0.92, 0.6], [0.94, 0.56], [0.7, 0.65], [0.52, 0.58]], 0.15, black, { parent: b, bevel: 0.01 });

  // farol redondo característico
  const hlG = new THREE.Group(); hlG.position.set(0, 1.0, 0.66); b.add(hlG);
  const shell = mesh(G.cyl(0.13, 0.11, 0.12, 12), black, 0, 0, 0, hlG); shell.rotation.x = Math.PI / 2;
  const ring = mesh(new THREE.TorusGeometry(0.12, 0.018, 4, 14), chrome, 0, 0, 0.065, hlG);
  const lens = mesh(G.cyl(0.108, 0.108, 0.02, 12), M(0xfff7d0, { emissive: 0xfff0a0 }), 0, 0, 0.065, hlG); lens.rotation.x = Math.PI / 2;
  const drl = mesh(new THREE.TorusGeometry(0.075, 0.012, 3, 12), M(0xffffff, { emissive: 0xffffff }), 0, 0, 0.078, hlG);
  b.userData.headlight = lens;
  // painel redondo
  const dash = mesh(G.cyl(0.07, 0.07, 0.04, 10), black, 0, 1.17, 0.5, b); dash.rotation.x = 1.0;

  // guidão largo, manoplas e retrovisores redondos
  rod([-0.37, 1.2, 0.44], [0.37, 1.2, 0.44], 0.022, black, b);
  for (const s of [-1, 1]) {
    rod([s * 0.3, 1.2, 0.44], [s * 0.4, 1.2, 0.43], 0.032, M(0x0e0e0e), b);
    rod([s * 0.24, 1.21, 0.44], [s * 0.3, 1.38, 0.42], 0.012, black, b);
    const mir = mesh(G.cyl(0.055, 0.055, 0.025, 10), black, s * 0.31, 1.4, 0.42, b); mir.rotation.x = Math.PI / 2;
  }
  // pedaleiras
  for (const s of [-1, 1]) mesh(G.box(0.1, 0.03, 0.05), steel, s * 0.2, 0.42, -0.16, b);
  b.userData.seat = { y: 1.08, z: -0.3 };
  return b;
}
