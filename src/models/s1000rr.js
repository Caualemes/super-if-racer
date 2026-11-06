// BMW S1000RR low-poly: superbike carenada cinza/preta com grafismos vermelhos,
// faróis agressivos em fenda, bolha fumê, rabeta alta, escape metálico lateral.
// A moto olha para +Z. Roda dianteira em z=+0.76, traseira em z=-0.72, raio 0.33.
import * as THREE from 'three';
import { M, mesh, G, profile, rod, tube, wheel } from './common.js';

export function buildS1000() {
  const b = new THREE.Group();
  const black = M(0x141416), gray = M(0x646a72), grayL = M(0xa9aeb5), red = M(0xd0182a), white = M(0xf2f2f2);
  const steel = M(0xbfc4ca), smoke = M(0x3a4e66, { transparent: true, opacity: 0.85 });

  // rodas esportivas pretas com friso vermelho
  const fw = wheel({ r: 0.33, w: 0.15, rim: 0x101010, spokes: 5, stripe: 0xd0182a, discs: 2, caliper: 0x1f4fd8 });
  fw.position.set(0, 0.33, 0.76); b.add(fw);
  const rw = wheel({ r: 0.335, w: 0.23, rim: 0x101010, spokes: 5, stripe: 0xd0182a, discs: 1, discR: 0.34 });
  rw.position.set(0, 0.335, -0.72); b.add(rw);
  b.userData.wheels = [fw.userData.spin, rw.userData.spin];
  // carroceria rebaixada (proporção de superbike: banco e tanque baixos)
  const body = new THREE.Group(); body.position.y = -0.08; b.add(body);

  // quadro de alumínio, balança e amortecedor
  for (const s of [-1, 1]) {
    profile([[0.5, 1.02], [0.2, 0.88], [-0.2, 0.68], [-0.26, 0.56], [-0.14, 0.56], [0.2, 0.78], [0.48, 0.94]], 0.05, grayL, { x: s * 0.2, parent: body, bevel: 0.01 });
    profile([[-0.18, 0.5], [-0.72, 0.38], [-0.74, 0.3], [-0.18, 0.4]], 0.06, gray, { x: s * 0.13, parent: b, bevel: 0.01 });
  }
  rod([0, 0.5, -0.3], [0, 0.86, -0.32], 0.035, black, body);
  // motor (aparece por baixo da carenagem)
  profile([[-0.2, 0.3], [0.3, 0.28], [0.36, 0.48], [0.1, 0.62], [-0.2, 0.55]], 0.32, M(0x2a2b2f), { parent: body, bevel: 0.02 });

  // carenagem lateral grande (cinza) com barriga
  profile([[0.86, 0.94], [0.84, 0.78], [0.66, 0.6], [0.44, 0.46], [0.22, 0.42], [0.02, 0.5], [0.04, 0.68], [0.26, 0.86], [0.5, 1.0], [0.72, 1.06]], 0.44, gray, { parent: body, bevel: 0.03 });
  // carenagem inferior (barriga) preta, deixando o motor aparecer
  profile([[0.46, 0.46], [0.34, 0.27], [-0.02, 0.26], [0.0, 0.38], [0.22, 0.42]], 0.36, black, { parent: body, bevel: 0.02 });
  // parte superior preta da carenagem frontal
  profile([[0.94, 0.93], [0.86, 1.06], [0.62, 1.16], [0.44, 1.08], [0.5, 0.98], [0.72, 0.9]], 0.45, black, { parent: body, bevel: 0.03 });
  // grafismos vermelhos e brancos nas laterais
  for (const s of [-1, 1]) {
    profile([[0.08, 0.6], [0.56, 0.88], [0.62, 0.82], [0.14, 0.54]], 0.012, red, { x: s * 0.245, parent: body, bevel: 0 });
    profile([[0.16, 0.52], [0.62, 0.8], [0.66, 0.75], [0.2, 0.48]], 0.012, white, { x: s * 0.245, parent: body, bevel: 0 });
    profile([[0.3, 0.68], [0.48, 0.8], [0.52, 0.77], [0.34, 0.65]], 0.012, black, { x: s * 0.247, parent: body, bevel: 0 });
    // entrada de ar lateral
    profile([[0.48, 0.66], [0.66, 0.76], [0.66, 0.68], [0.52, 0.62]], 0.012, black, { x: s * 0.248, parent: body, bevel: 0 });
  }
  // bico vermelho sob os faróis
  profile([[0.86, 0.76], [0.97, 0.88], [0.94, 0.93], [0.82, 0.86]], 0.22, red, { parent: body, bevel: 0.01 });
  // faróis agressivos em fenda (dois "olhos") + entrada de ar central
  for (const s of [-1, 1]) {
    const eye = mesh(G.box(0.12, 0.035, 0.05), M(0xfff7d8, { emissive: 0xfff0b0 }), s * 0.1, 0.955, 0.925, body);
    eye.rotation.z = s * -0.35; eye.rotation.x = 0.5;
    if (s > 0) b.userData.headlight = eye;
  }
  mesh(G.box(0.08, 0.06, 0.05), black, 0, 0.9, 0.95, body).rotation.x = 0.4;
  // bolha fumê alta
  profile([[0.6, 1.14], [0.88, 1.06], [0.64, 1.36], [0.46, 1.3]], 0.32, smoke, { parent: body, bevel: 0.01 });
  // painel TFT
  mesh(G.box(0.16, 0.1, 0.02), M(0x0d1a2a, { emissive: 0x0a2040 }), 0, 1.16, 0.5, body).rotation.x = -0.7;

  // tanque preto com faixa cinza
  profile([[-0.08, 1.0], [0.42, 1.1], [0.36, 1.2], [0.06, 1.24], [-0.1, 1.16]], 0.4, black, { parent: body, bevel: 0.04 });
  mesh(G.box(0.3, 0.012, 0.3), grayL, 0, 1.27, 0.14, body).rotation.x = -0.15;
  // banco e rabeta alta e pontuda (vermelho/branco/preto)
  profile([[-0.1, 1.06], [-0.42, 1.1], [-0.42, 1.16], [-0.1, 1.14]], 0.26, black, { parent: body, bevel: 0.02 });
  profile([[-0.36, 1.04], [-0.9, 1.19], [-0.9, 1.24], [-0.6, 1.23], [-0.36, 1.17]], 0.22, red, { parent: body, bevel: 0.02 });
  profile([[-0.5, 1.2], [-0.9, 1.235], [-0.9, 1.255], [-0.5, 1.23]], 0.23, white, { parent: body, bevel: 0.005 });
  profile([[-0.3, 0.98], [-0.76, 1.1], [-0.76, 1.14], [-0.36, 1.06]], 0.24, black, { parent: body, bevel: 0.01 });
  mesh(G.box(0.12, 0.03, 0.03), M(0xff2a2a, { emissive: 0x991010 }), 0, 1.18, -0.91, body);
  // suporte de placa
  rod([0, 1.08, -0.8], [0, 0.86, -0.98], 0.018, black, body);
  mesh(G.box(0.14, 0.1, 0.01), white, 0, 0.84, -0.99, body);

  // escape metálico lateral (direita), subindo
  tube([[0.1, 0.24, 0.3], [0.12, 0.2, 0.0], [-0.12, 0.26, -0.2]], 0.035, steel, body, 8);
  const can = mesh(G.cyl(0.075, 0.085, 0.36, 8), steel, -0.2, 0.42, -0.42, body); can.rotation.x = Math.PI / 2 - 0.45;
  const tip = mesh(G.cyl(0.06, 0.06, 0.05, 8), M(0x1e1e1e), -0.2, 0.5, -0.6, body); tip.rotation.x = Math.PI / 2 - 0.45;
  mesh(G.box(0.012, 0.05, 0.2), M(0xd0182a), -0.28, 0.44, -0.44, body).rotation.x = -0.45;

  // garfo invertido dourado + mesas
  for (const s of [-1, 1]) {
    rod([s * 0.1, 0.33, 0.76], [s * 0.1, 0.72, 0.63], 0.036, M(0x2a2a2a), b);
    rod([s * 0.1, 0.72, 0.63], [s * 0.1, 1.06, 0.52], 0.042, M(0xd4a52c), body);
  }
  mesh(G.box(0.26, 0.04, 0.1), grayL, 0, 1.06, 0.52, body);
  // para-lama dianteiro vermelho/preto
  profile([[0.56, 0.64], [0.76, 0.71], [0.96, 0.62], [0.97, 0.58], [0.76, 0.66], [0.58, 0.6]], 0.14, black, { parent: body, bevel: 0.01 });
  // semi-guidões e retrovisores na carenagem
  for (const s of [-1, 1]) {
    rod([s * 0.1, 1.04, 0.5], [s * 0.3, 1.03, 0.44], 0.02, black, body);
    rod([s * 0.26, 1.03, 0.44], [s * 0.34, 1.03, 0.43], 0.03, M(0x0e0e0e), body);
    const mir = mesh(G.box(0.12, 0.05, 0.03), black, s * 0.29, 1.13, 0.66, body); mir.rotation.y = s * 0.2;
  }
  for (const s of [-1, 1]) mesh(G.box(0.1, 0.03, 0.05), steel, s * 0.19, 0.5, -0.24, body);
  b.userData.seat = { y: 1.05, z: -0.26 };
  return b;
}
