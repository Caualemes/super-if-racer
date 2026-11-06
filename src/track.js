// Circuito: spline fechada + geometria da pista + consultas espaciais
import * as THREE from 'three';
import { Tex } from './textures.js';

// Pontos de controle (x, z) — layout inspirado no campus IFSP Birigui
// Sentido: largada no estacionamento (sul) indo para leste.
export const CONTROL_POINTS = [
  [-30, 95], [40, 98], [100, 94], [140, 72], [158, 32], [161, -15],
  [152, -62], [122, -96], [84, -104], [60, -84], [30, -76], [2, -96],
  [-38, -120], [-90, -118], [-136, -94], [-158, -48], [-140, -4],
  [-162, 36], [-148, 76], [-102, 98],
];

export const TRACK_WIDTH = 18;
export const WALL_DIST = TRACK_WIDTH / 2 + 11; // distância lateral máxima

export class Track {
  constructor(points = CONTROL_POINTS, width = TRACK_WIDTH) {
    this.width = width;
    const v3 = points.map(([x, z]) => new THREE.Vector3(x, 0, z));
    this.curve = new THREE.CatmullRomCurve3(v3, true, 'centripetal', 0.5);
    this.length = this.curve.getLength();
    const N = this.N = Math.round(this.length / 1.25);
    const pts = this.curve.getSpacedPoints(N);
    pts.pop();
    this.px = new Float32Array(N); this.pz = new Float32Array(N);
    this.tx = new Float32Array(N); this.tz = new Float32Array(N);
    this.curv = new Float32Array(N);
    for (let i = 0; i < N; i++) { this.px[i] = pts[i].x; this.pz[i] = pts[i].z; }
    this.seg = this.length / N;
    for (let i = 0; i < N; i++) {
      const a = (i - 1 + N) % N, b = (i + 1) % N;
      let dx = this.px[b] - this.px[a], dz = this.pz[b] - this.pz[a];
      const l = Math.hypot(dx, dz) || 1; this.tx[i] = dx / l; this.tz[i] = dz / l;
    }
    for (let i = 0; i < N; i++) {
      const a = (i - 4 + N) % N, b = (i + 4) % N;
      const ha = Math.atan2(this.tx[a], this.tz[a]), hb = Math.atan2(this.tx[b], this.tz[b]);
      this.curv[i] = angDiff(hb, ha) / (8 * this.seg); // rad por unidade (+ = esquerda)
    }
    // checkpoints
    this.K = 8;
    this.features = { ramps: [], pads: [], itemRows: [] };
  }

  idx(i) { const N = this.N; return ((Math.round(i) % N) + N) % N; }
  heading(i) { i = this.idx(i); return Math.atan2(this.tx[i], this.tz[i]); }

  // ponto da pista (com offset lateral; + = direita)
  pointAt(i, lateral = 0, out = new THREE.Vector3()) {
    const N = this.N;
    const fi = ((i % N) + N) % N;
    const i0 = Math.floor(fi), i1 = (i0 + 1) % N, f = fi - i0;
    const x = this.px[i0] + (this.px[i1] - this.px[i0]) * f;
    const z = this.pz[i0] + (this.pz[i1] - this.pz[i0]) * f;
    const tx = this.tx[i0], tz = this.tz[i0];
    out.set(x - tz * lateral, 0, z + tx * lateral);
    return out;
  }

  // Projeção de (x,z) na pista, buscando perto de 'hint'
  project(x, z, hint = -1, range = 30) {
    const N = this.N;
    let best = -1, bd = Infinity;
    if (hint < 0) {
      for (let i = 0; i < N; i++) {
        const d = (this.px[i] - x) ** 2 + (this.pz[i] - z) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
    } else {
      for (let k = -range; k <= range; k++) {
        const i = (hint + k + N) % N;
        const d = (this.px[i] - x) ** 2 + (this.pz[i] - z) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
    }
    const tx = this.tx[best], tz = this.tz[best];
    const dx = x - this.px[best], dz = z - this.pz[best];
    const along = dx * tx + dz * tz;
    const lateral = -dx * tz + dz * tx; // direita = (-tz, tx)
    return { idx: best, frac: along / this.seg, lateral, dist: Math.sqrt(bd) };
  }

  distToCenter(x, z) { return this.project(x, z, -1).dist; }

  // máxima curvatura absoluta em um trecho à frente
  curvAhead(i, count) {
    let m = 0;
    for (let k = 0; k < count; k += 2) m = Math.max(m, Math.abs(this.curv[(i + k) % this.N]));
    return m;
  }

  // ---------- geometria -----------
  buildMesh() {
    const group = new THREE.Group();
    const N = this.N, w = this.width;
    // estrada
    group.add(this.ribbon(-w / 2, w / 2, 0.03, Tex.asphalt(), 9, 'road'));
    // calçada/acostamento
    const sw = new THREE.MeshLambertMaterial({ color: 0xbfb8a4 });
    group.add(this.ribbon(w / 2, w / 2 + 2.2, 0.02, null, 1, 'shoulderR', sw));
    group.add(this.ribbon(-w / 2 - 2.2, -w / 2, 0.02, null, 1, 'shoulderL', sw));
    // zebras nas curvas
    const curbMat = new THREE.MeshLambertMaterial({ map: Tex.curb() });
    const mask = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (Math.abs(this.curv[i]) > 0.012) for (let k = -10; k <= 10; k++) mask[(i + k + N) % N] = 1;
    group.add(this.ribbon(w / 2 - 0.2, w / 2 + 2.0, 0.05, null, 3, 'curbR', curbMat, mask));
    group.add(this.ribbon(-w / 2 - 2.0, -w / 2 + 0.2, 0.05, null, 3, 'curbL', curbMat, mask));
    // linha de largada quadriculada
    const chk = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.4), new THREE.MeshLambertMaterial({ map: Tex.checker() }));
    const p0 = this.pointAt(0);
    const holder = new THREE.Group();
    holder.position.set(p0.x, 0.06, p0.z);
    holder.rotation.y = this.heading(0);
    chk.rotation.x = -Math.PI / 2;
    holder.add(chk);
    group.add(holder);
    this.mesh = group;
    return group;
  }

  ribbon(l0, l1, y, tex, vScale, name, mat = null, mask = null) {
    const N = this.N;
    const pos = [], uv = [], idx = [];
    let d = 0;
    const startV = [];
    for (let i = 0; i <= N; i++) {
      const k = i % N;
      const tx = this.tx[k], tz = this.tz[k];
      const x = this.px[k], z = this.pz[k];
      pos.push(x - tz * l0, y, z + tx * l0, x - tz * l1, y, z + tx * l1);
      const v = d / vScale;
      uv.push(0, v, 1, v);
      d += this.seg;
    }
    for (let i = 0; i < N; i++) {
      if (mask && !mask[i]) continue;
      const a = i * 2, b = a + 1, c = a + 2, e = a + 3;
      idx.push(a, b, c, b, e, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    // normals for flat ribbon are up; ensure
    const nrm = geo.getAttribute('normal');
    for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
    const m = new THREE.Mesh(geo, mat || new THREE.MeshLambertMaterial({ map: tex }));
    m.name = name;
    return m;
  }
}

export function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
