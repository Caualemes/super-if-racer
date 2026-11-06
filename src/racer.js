// Piloto: física arcade, voltas/checkpoints, colisões, IA e visual
import * as THREE from 'three';
import { DRIVERS, physicsFor } from './config.js';
import { buildCharacter, poseRide, spinWheels, blobShadow } from './models.js';
import { angDiff, WALL_DIST } from './track.js';
import { textTexture } from './textures.js';
import { audio } from './audio.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const BIKE_SCALE = 1.7;

export class Racer {
  constructor(game, driverId, { isPlayer = false, skill = 1 } = {}) {
    this.game = game;
    this.track = game.track;
    this.def = DRIVERS[driverId];
    this.id = driverId;
    this.name = this.def.name;
    this.isPlayer = isPlayer;
    this.ph = physicsFor(this.def.stats);
    this.skill = skill;
    this.seed = Math.random() * 100;
    this.buildVisual();
    this.reset(0);
  }

  buildVisual() {
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();
    this.root.add(this.tilt);
    this.body = new THREE.Group();
    this.body.scale.setScalar(BIKE_SCALE);
    this.tilt.add(this.body);
    this.bike = this.def.bike();
    this.body.add(this.bike);
    this.char = buildCharacter(this.def.look);
    this.char.scale.setScalar(0.82);
    this.char.position.set(0, 0.92, -0.26);
    this.body.add(this.char);
    this.shadow = blobShadow(1.6, 3.6);
    this.root.add(this.shadow);
    // escudo (Recuperação de nota)
    this.shieldMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.35, wireframe: false, depthWrite: false }));
    this.shieldMesh.position.y = 1.6; this.shieldMesh.visible = false;
    this.root.add(this.shieldMesh);
    // prova surpresa acima da cabeça
    this.provaMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), new THREE.MeshBasicMaterial({ map: provaTexture(), side: THREE.DoubleSide, transparent: true }));
    this.provaMesh.position.y = 4.6; this.provaMesh.visible = false;
    this.root.add(this.provaMesh);
    // marcador de nome dos rivais
    this.label = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(this.def.short, { w: 256, h: 64, bg: 'rgba(0,0,0,0)', fg: this.def.color === '#1d1d22' ? '#ffffff' : '#ffffff', font: 'bold 40px Arial Black, sans-serif' }), depthTest: false, transparent: true }));
    this.label.scale.set(3.2, 0.8, 1); this.label.position.y = 4.4; this.label.visible = !this.isPlayer;
    this.root.add(this.label);
  }

  reset(gridIdx) {
    const tr = this.track;
    this.gridIdx = gridIdx;
    this.x = 0; this.z = 0; this.y = 0; this.vy = 0; this.grounded = true;
    this.speed = 0; this.heading = 0; this.velAngle = 0; this.turnRate = 0; this.lean = 0;
    this.idx = 0; this.lateral = 0; this.lap = 0; this.cpNext = tr.K; this.progress = 0;
    this.finished = false; this.finishTime = 0; this.lapStart = 0; this.lapTimes = [];
    this.item = null; this.rolling = 0;
    this.boost = 0; this.boostPower = 1; this.slow = 0; this.spin = 0; this.spinAngle = 0;
    this.shield = 0; this.invuln = 0; this.prova = 0;
    this.drifting = false; this.driftDir = 0; this.driftCharge = 0;
    this.offroad = false; this.padCd = 0; this.wrongWay = 0; this.aiItemDelay = 1 + Math.random() * 2;
    this.aiLane = (Math.random() - 0.5) * 8; this.gas = 0; this.cheer = 0; this.position = 1;
    this.bumpCd = 0;
  }

  placeOnGrid(idx, lat) {
    const p = this.track.pointAt(idx, lat);
    this.x = p.x; this.z = p.z;
    this.heading = this.velAngle = this.track.heading(idx);
    const pr = this.track.project(this.x, this.z, -1);
    this.idx = pr.idx;
    this.progress = this.idx;
    this.syncVisual(0, 0);
  }

  get maxSpeed() {
    let m = this.ph.maxSpeed * (this.isPlayer ? 1 : this.aiMul ?? 1);
    if (this.offroad) m *= 0.55;
    if (this.slow > 0) m *= 0.6;
    if (this.boost > 0) m *= this.boostPower;
    return m;
  }

  giveBoost(t, power) {
    this.boost = Math.max(this.boost, t);
    this.boostPower = Math.max(this.boost > 0 && this.boostPower > 1 ? this.boostPower : 1, power);
    this.speed = Math.max(this.speed, this.ph.maxSpeed * Math.min(power, 1.25));
  }

  // kind: spin | slow | wall | boleto ; retorna true se acertou
  hit(kind) {
    if (this.invuln > 0 && kind !== 'slow') return false;
    if (this.shield > 0) {
      this.shield = 0; this.invuln = 0.6;
      if (this.isPlayer || this.game.near(this)) audio.sfx('block');
      this.game.fx.emit(this.x, 2, this.z, { spread: 10, count: 20, size: 0.3, color: 0x7fd8ff, life: 0.5 });
      this.game.say(this, 'ESCUDO!');
      return false;
    }
    this.drifting = false; this.driftCharge = 0; this.boost = 0;
    if (kind === 'slow') { this.slow = 4; this.prova = 4; }
    else {
      this.spin = kind === 'wall' ? 1.2 : kind === 'boleto' ? 0.7 : 1.1;
      this.speed *= kind === 'wall' ? 0.15 : kind === 'boleto' ? 0.5 : 0.3;
      this.invuln = 1.6;
    }
    if (this.isPlayer || this.game.near(this)) audio.sfx(kind === 'slow' ? 'prova' : 'hit');
    this.game.fx.emit(this.x, 1.5, this.z, { vy: 4, spread: 7, count: 18, size: 0.35, color: [0xffd21f, 0xffffff, 0xff5a00], life: 0.6, gravity: -10 });
    return true;
  }

  // ---------------- UPDATE ----------------
  update(dt, ctrl, raceTime) {
    const tr = this.track;
    const N = tr.N;
    // timers
    this.boost = Math.max(0, this.boost - dt);
    if (this.boost <= 0) this.boostPower = 1;
    this.slow = Math.max(0, this.slow - dt);
    this.prova = Math.max(0, this.prova - dt);
    this.shield = Math.max(0, this.shield - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.padCd = Math.max(0, this.padCd - dt);
    this.bumpCd = Math.max(0, this.bumpCd - dt);

    const maxS = this.maxSpeed;
    let steer = ctrl.steer;
    let gas = ctrl.gas, brake = ctrl.brake;
    if (this.spin > 0) {
      this.spin -= dt; steer = 0; gas = 0; brake = 0;
      this.spinAngle += dt * 13;
      this.speed *= Math.pow(0.4, dt);
      if (this.spin <= 0) this.spinAngle = 0;
    }
    this.gas = gas ? 1 : 0;

    // aceleração
    if (this.boost > 0) {
      this.speed += (maxS - this.speed) * Math.min(1, 4 * dt);
    } else if (gas && this.grounded) {
      if (this.speed < maxS) this.speed += this.ph.accel * dt * (1 - 0.55 * Math.max(0, this.speed) / maxS);
    }
    if (this.speed > maxS) this.speed -= (this.speed - maxS) * Math.min(1, 2.2 * dt);
    if (brake && this.grounded) {
      this.speed -= (this.speed > 0 ? 34 : 12) * dt;
      if (this.speed < -9) this.speed = -9;
    } else if (!gas && this.boost <= 0) {
      const d = 7 * dt;
      this.speed = Math.abs(this.speed) < d ? 0 : this.speed - Math.sign(this.speed) * d;
    }

    // direção e derrapagem
    const absS = Math.abs(this.speed);
    const sf = clamp(absS / 7, 0, 1) * (1 - 0.28 * clamp(absS / this.ph.maxSpeed, 0, 1.2));
    let turn = -steer * this.ph.turn * sf;
    if (this.speed < 0) turn = -turn;
    if (ctrl.drift && !this.drifting && Math.abs(steer) > 0.3 && this.speed > 15 && this.grounded && this.spin <= 0) {
      this.drifting = true; this.driftDir = Math.sign(steer); this.driftCharge = 0;
      this.vy = 3.2; this.grounded = false; // pulinho
    }
    if (this.drifting) {
      const into = steer * this.driftDir; // -1..1
      turn = -this.driftDir * this.ph.turn * (0.78 + 0.45 * into) * clamp(absS / 20, 0.5, 1.15);
      this.driftCharge += dt * (1 + Math.max(0, into));
      if (this.grounded && (this.isPlayer || this.game.near(this))) {
        const lvl = this.driftCharge > 2.3 ? 2 : this.driftCharge > 1.1 ? 1 : 0;
        const col = [0xffffff, 0x3fa9ff, 0xff8a12][lvl];
        const s = Math.sin(this.heading), c = Math.cos(this.heading);
        for (const side of [-1, 1]) {
          const ox = -s * 1.2 + -c * side * 0.4, oz = -c * 1.2 + s * side * 0.4;
          this.game.fx.emit(this.x + ox, 0.3, this.z + oz, { vy: 2, spread: 2.5, life: 0.25, size: lvl ? 0.28 : 0.18, color: col, gravity: -8 });
        }
      }
      if (!ctrl.drift || this.speed < 10 || this.spin > 0) {
        if (this.driftCharge > 2.3) { this.giveBoost(1.1, 1.3); if (this.isPlayer) audio.sfx('mini'); }
        else if (this.driftCharge > 1.1) { this.giveBoost(0.6, 1.2); if (this.isPlayer) audio.sfx('mini'); }
        this.drifting = false; this.driftCharge = 0;
      }
    }
    this.turnRate += (turn - this.turnRate) * Math.min(1, 10 * dt);
    this.heading += this.turnRate * dt;
    // aderência: direção do movimento persegue a direção da moto
    const grip = this.drifting ? 3.2 : this.ph.grip;
    this.velAngle += angDiff(this.heading, this.velAngle) * Math.min(1, grip * dt);

    // movimento
    this.x += Math.sin(this.velAngle) * this.speed * dt;
    this.z += Math.cos(this.velAngle) * this.speed * dt;
    // vertical
    if (!this.grounded) {
      this.vy -= 24 * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0; this.vy = 0; this.grounded = true;
        if (this.airTime > 0.5) { this.giveBoost(0.5, 1.15); if (this.isPlayer) audio.sfx('land'); }
        this.airTime = 0;
      } else this.airTime = (this.airTime || 0) + dt;
    }

    // projeção na pista
    const prevIdx = this.idx;
    const pr = tr.project(this.x, this.z, this.idx, 25);
    this.idx = pr.idx; this.lateral = pr.lateral;
    this.offroad = Math.abs(this.lateral) > tr.width / 2 + 1.2 && this.grounded;
    // muro invisível
    if (Math.abs(this.lateral) > WALL_DIST) {
      const over = Math.abs(this.lateral) - WALL_DIST;
      const sgn = Math.sign(this.lateral);
      const tx = tr.tx[this.idx], tz = tr.tz[this.idx];
      this.x -= -tz * sgn * over; this.z -= tx * sgn * over;
      this.lateral = sgn * WALL_DIST;
      this.speed *= 0.97;
      const th = Math.atan2(tx, tz);
      this.heading += angDiff(th, this.heading) * Math.min(1, 3 * dt);
    }
    // poeira na grama
    if (this.offroad && absS > 6 && (this.isPlayer || this.game.near(this)) && Math.random() < 0.7) {
      this.game.fx.emit(this.x, 0.4, this.z, { vy: 2.5, spread: 2, life: 0.6, size: 0.45, color: [0x9a7a4a, 0xb8945e, 0x6aa040], gravity: -3, grow: 1.2 });
    }

    // rampas
    for (const r of tr.features.ramps) {
      const d = (this.idx - r.idx + N) % N;
      if (d < r.len && Math.abs(this.lateral) < r.half && this.grounded && this.speed > 10) {
        this.vy = 7 + this.speed * 0.14; this.grounded = false; this.airTime = 0;
        if (this.isPlayer) audio.sfx('jump');
      }
    }
    // placas de turbo
    for (const p of tr.features.pads) {
      const d = (this.idx - p.idx + N) % N;
      if (d < p.len && Math.abs(this.lateral - p.lat) < p.half && this.padCd <= 0) {
        this.giveBoost(1.2, 1.4); this.padCd = 1;
        if (this.isPlayer) audio.sfx('boost');
      }
    }

    // voltas e checkpoints
    if (!this.finished || true) {
      const K = tr.K, seg = N / K;
      if (prevIdx > N * 0.75 && this.idx < N * 0.25) {
        if (this.cpNext >= K) {
          this.lap++; this.cpNext = 1;
          if (this.lap > 1) this.lapTimes.push(raceTime - this.lapStart);
          this.lapStart = raceTime;
          this.game.onLap(this);
        }
      } else if (prevIdx < N * 0.25 && this.idx > N * 0.75) {
        if (this.cpNext <= 1) { this.lap--; this.cpNext = K; }
      }
      const cp = Math.floor(this.idx / seg);
      if (cp === this.cpNext && this.cpNext < K) this.cpNext++;
    }
    let fwd = this.idx + pr.frac;
    this.progress = this.lap * N + fwd;

    // contramão
    const th = tr.heading(this.idx);
    if (Math.abs(angDiff(this.heading, th)) > 2.0 && absS > 3) this.wrongWay += dt; else this.wrongWay = 0;

    this.syncVisual(dt, raceTime);
  }

  syncVisual(dt, t) {
    this.root.position.set(this.x, this.y, this.z);
    this.root.rotation.y = this.heading + this.spinAngle;
    const leanTarget = clamp(-this.turnRate / 2.4, -1, 1) * clamp(Math.abs(this.speed) / 20, 0, 1) * (this.drifting ? 1.25 : 1);
    this.lean += (leanTarget - this.lean) * Math.min(1, 8 * dt);
    this.tilt.rotation.z = this.lean * 0.42;
    this.tilt.rotation.x = this.grounded ? 0 : clamp(-this.vy * 0.03, -0.35, 0.35);
    this.shadow.position.y = 0.09 - this.y;
    this.shadow.scale.setScalar(Math.max(0.4, 1 - this.y * 0.08));
    spinWheels(this.bike, this.speed * dt / (0.33 * BIKE_SCALE));
    let mode = 'ride';
    if (this.cheer > 0 || (this.finished && this.position === 1)) mode = 'cheer';
    else if (this.spin > 0) mode = 'spin';
    else if (this.prova > 0) mode = 'dizzy';
    poseRide(this.char, this.lean, this.gas, t, mode);
    this.cheer = Math.max(0, this.cheer - dt);
    // escudo / prova
    this.shieldMesh.visible = this.shield > 0 && (this.shield > 1.5 || Math.sin(t * 30) > 0);
    if (this.shieldMesh.visible) this.shieldMesh.rotation.y += dt * 2;
    this.provaMesh.visible = this.prova > 0;
    if (this.provaMesh.visible) { this.provaMesh.rotation.y = -this.root.rotation.y + Math.sin(t * 5) * 0.3 + Math.PI; this.provaMesh.position.y = 4.6 + Math.sin(t * 4) * 0.25; }
    // pisca quando invulnerável
    this.body.visible = !(this.invuln > 0 && this.spin <= 0 && Math.sin(t * 40) > 0.3);
    // farol à noite
  }

  // ---------------- IA ----------------
  aiControl(dt, t) {
    const tr = this.track;
    const look = 6 + Math.max(0, this.speed) * 0.42;
    // pista "ideal" com variação de faixa
    let lane = this.aiLane + Math.sin(t * 0.35 + this.seed) * 2.5;
    const c = tr.curv[(this.idx + Math.round(look)) % tr.N];
    lane += clamp(c * 160, -4.5, 4.5); // corta para o lado interno
    // desviar de obstáculos à frente
    for (const ob of this.game.items.obstacles) {
      const d = (ob.idx - this.idx + tr.N) % tr.N;
      if (d > 0 && d < 30 && Math.abs(ob.lat - lane) < ob.half + 2.2) lane = ob.lat + (ob.lat > 0 ? -1 : 1) * (ob.half + 3);
    }
    // desviar de caixas quando já tem item? não — busca caixas se não tiver
    lane = clamp(lane, -tr.width / 2 + 1.5, tr.width / 2 - 1.5);
    const target = tr.pointAt(this.idx + look, lane);
    const desired = Math.atan2(target.x - this.x, target.z - this.z);
    const diff = angDiff(desired, this.heading);
    const steer = clamp(-diff * 2.8, -1, 1);
    const curv = tr.curvAhead(this.idx, 14 + Math.round(this.speed * 0.9));
    const tgtSpeed = Math.min(this.maxSpeed, (this.ph.turn * 0.72) / Math.max(curv, 0.001));
    const gas = this.speed < tgtSpeed;
    const brake = this.speed > tgtSpeed + 7;
    // rubber band leve
    const pl = this.game.player;
    const diffMul = [0.84, 0.93, 1.0][this.game.difficulty] * this.skill;
    let rb = 1;
    if (pl && pl !== this) {
      const gap = pl.progress - this.progress;
      rb = 1 + clamp(gap / 400, -0.07, 0.09);
    }
    this.aiMul = diffMul * rb;
    // se ficar preso, dá ré
    if (Math.abs(this.speed) < 1.5 && !this.finished) this.stuck = (this.stuck || 0) + dt; else this.stuck = 0;
    if (this.stuck > 1.5) { this.stuckRev = 0.8; this.stuck = 0; }
    if (this.stuckRev > 0) { this.stuckRev -= dt; return { gas: false, brake: true, steer: -steer, drift: false }; }
    // itens
    this.aiItemDelay -= dt;
    let useItem = false;
    if (this.item && this.aiItemDelay <= 0) useItem = this.game.items.aiWantsUse(this);
    return { gas, brake, steer, drift: false, useItem };
  }
}

let _prova;
function provaTexture() {
  if (_prova) return _prova;
  const c = document.createElement('canvas'); c.width = 96; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fffef5'; g.fillRect(0, 0, 96, 128);
  g.strokeStyle = '#9ab'; for (let y = 30; y < 128; y += 10) { g.beginPath(); g.moveTo(6, y); g.lineTo(90, y); g.stroke(); }
  g.fillStyle = '#111'; g.font = 'bold 14px Arial'; g.fillText('PROVA', 8, 18);
  g.fillStyle = '#e8262b'; g.font = 'bold 48px Arial Black, Arial'; g.fillText('0,0', 8, 92);
  g.strokeStyle = '#e8262b'; g.lineWidth = 4; g.beginPath(); g.arc(48, 76, 40, 0, Math.PI * 2); g.stroke();
  _prova = new THREE.CanvasTexture(c); _prova.colorSpace = THREE.SRGBColorSpace;
  return _prova;
}
