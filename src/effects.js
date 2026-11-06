// Partículas "cúbicas" estilo N64 usando um único InstancedMesh
import * as THREE from 'three';

const MAX = 700;

export class Particles {
  constructor(scene) {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    const col = new THREE.Color(1, 1, 1);
    for (let i = 0; i < MAX; i++) this.mesh.setColorAt(i, col);
    scene.add(this.mesh);
    this.p = [];
    for (let i = 0; i < MAX; i++) this.p.push({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.3, g: 0, grow: 0, rot: 0 });
    this.cursor = 0;
    this.tmpM = new THREE.Matrix4(); this.tmpQ = new THREE.Quaternion(); this.tmpE = new THREE.Euler();
    this.tmpC = new THREE.Color(); this.tmpV = new THREE.Vector3(); this.tmpS = new THREE.Vector3();
    this.hide = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAX; i++) this.mesh.setMatrixAt(i, this.hide);
  }

  emit(x, y, z, { vx = 0, vy = 0, vz = 0, spread = 1, life = 0.6, size = 0.3, color = 0xffffff, gravity = 0, grow = 0, count = 1 } = {}) {
    for (let k = 0; k < count; k++) {
      const i = this.cursor; this.cursor = (this.cursor + 1) % MAX;
      const p = this.p[i];
      p.life = p.max = life * (0.7 + Math.random() * 0.6);
      p.x = x; p.y = y; p.z = z;
      p.vx = vx + (Math.random() - 0.5) * spread; p.vy = vy + (Math.random() - 0.5) * spread; p.vz = vz + (Math.random() - 0.5) * spread;
      p.s = size; p.g = gravity; p.grow = grow; p.rot = Math.random() * 6;
      this.mesh.setColorAt(i, this.tmpC.set(Array.isArray(color) ? color[(Math.random() * color.length) | 0] : color));
    }
    this.mesh.instanceColor.needsUpdate = true;
  }

  // explosão de confete
  confetti(x, y, z, n = 60) {
    this.emit(x, y, z, { vy: 9, spread: 12, life: 2.2, size: 0.35, gravity: -9, count: n, color: [0xff3b3b, 0xffd21f, 0x1fa83a, 0x2a7fff, 0xff6fd8, 0xffffff] });
  }

  update(dt) {
    const m = this.tmpM;
    for (let i = 0; i < MAX; i++) {
      const p = this.p[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { this.mesh.setMatrixAt(i, this.hide); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.05) { p.y = 0.05; p.vy *= -0.3; }
      p.rot += dt * 4;
      const k = p.life / p.max;
      const s = Math.max(0.001, p.s * (k + p.grow * (1 - k)));
      this.tmpE.set(p.rot, p.rot * 0.7, 0);
      this.tmpQ.setFromEuler(this.tmpE);
      m.compose(this.tmpV.set(p.x, p.y, p.z), this.tmpQ, this.tmpS.set(s, s, s));
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    for (let i = 0; i < MAX; i++) { this.p[i].life = 0; this.mesh.setMatrixAt(i, this.hide); }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
