// Moto genérica dos rivais NPC (naked simples com cores próprias)
import * as THREE from 'three';
import { M, mesh, G, profile, rod, wheel } from './common.js';

export function buildGenericBike(main = 0x2a7fff, accent = 0xffffff) {
  const b = new THREE.Group();
  const c = M(main), a = M(accent), black = M(0x1a1a1a);
  const fw = wheel({ r: 0.32, w: 0.16, rim: 0x333333, spokes: 5 }); fw.position.set(0, 0.32, 0.7); b.add(fw);
  const rw = wheel({ r: 0.32, w: 0.2, rim: 0x333333, spokes: 5 }); rw.position.set(0, 0.32, -0.68); b.add(rw);
  b.userData.wheels = [fw.userData.spin, rw.userData.spin];
  profile([[-0.2, 0.32], [0.3, 0.3], [0.36, 0.55], [-0.2, 0.6]], 0.34, M(0x444444), { parent: b, bevel: 0.02 });
  profile([[-0.08, 0.88], [0.38, 0.9], [0.46, 1.04], [0.1, 1.16], [-0.1, 1.08]], 0.4, c, { parent: b, bevel: 0.04 });
  mesh(G.box(0.06, 0.015, 0.42), a, 0, 1.19, 0.15, b);
  profile([[-0.1, 0.98], [-0.6, 1.02], [-0.62, 1.08], [-0.1, 1.07]], 0.28, black, { parent: b, bevel: 0.02 });
  profile([[-0.56, 0.98], [-0.86, 1.1], [-0.86, 1.14], [-0.6, 1.1]], 0.22, c, { parent: b, bevel: 0.02 });
  profile([[0.48, 0.88], [0.7, 0.92], [0.72, 1.08], [0.56, 1.12]], 0.3, c, { parent: b, bevel: 0.02 });
  const l = mesh(G.box(0.16, 0.08, 0.04), M(0xfff6c8, { emissive: 0xfff2a0 }), 0, 1.0, 0.73, b); l.rotation.x = 0.4;
  b.userData.headlight = l;
  for (const s of [-1, 1]) {
    rod([s * 0.1, 0.32, 0.7], [s * 0.1, 1.1, 0.48], 0.035, M(0xaaaaaa), b);
    profile([[-0.18, 0.45], [-0.68, 0.35], [-0.68, 0.29], [-0.18, 0.38]], 0.05, black, { x: s * 0.12, parent: b, bevel: 0.01 });
  }
  rod([-0.34, 1.18, 0.44], [0.34, 1.18, 0.44], 0.022, black, b);
  b.userData.seat = { y: 1.06, z: -0.3 };
  return b;
}
