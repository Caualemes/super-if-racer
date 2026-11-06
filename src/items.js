// Sistema de itens: caixas "?", roleta, projéteis, obstáculos e efeitos
import * as THREE from 'three';
import { Tex, textTexture } from './textures.js';
import { rollItem, ITEMS } from './config.js';
import { M } from './models.js';
import { audio } from './audio.js';

const LANES = [-6, -3, 0, 3, 6];

export class Items {
  constructor(game) {
    this.game = game;
    this.track = game.track;
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.boxes = [];
    this.projectiles = [];
    this.obstacles = [];
    this.falling = []; // provas surpresa caindo
    const boxGeo = new THREE.BoxGeometry(1.7, 1.7, 1.7);
    const boxMat = new THREE.MeshLambertMaterial({ map: Tex.itemBox(), emissive: 0x553300, transparent: true, opacity: 0.92 });
    for (const idx of this.track.features.itemRows) {
      for (const lat of LANES) {
        const m = new THREE.Mesh(boxGeo, boxMat);
        const p = this.track.pointAt(idx, lat);
        m.position.set(p.x, 1.6, p.z);
        this.group.add(m);
        this.boxes.push({ idx, lat, mesh: m, cd: 0, phase: Math.random() * 6 });
      }
    }
    // texturas de obstáculos
    this.boletoTex = boletoTexture();
    this.wallTex = textTexture([{ text: 'TRABALHO', font: 'bold 34px Arial Black, sans-serif', color: '#fff' }, { text: 'EM GRUPO', font: 'bold 34px Arial Black, sans-serif', color: '#ffd21f' }], { w: 256, h: 128, bg: '#b5482a' });
  }

  reset() {
    for (const p of this.projectiles) this.group.remove(p.mesh);
    for (const o of this.obstacles) this.group.remove(o.mesh);
    for (const f of this.falling) this.group.remove(f.mesh);
    this.projectiles = []; this.obstacles = []; this.falling = [];
    for (const b of this.boxes) { b.cd = 0; b.mesh.visible = true; }
  }

  // distância em amostras (com volta)
  dIdx(a, b) { const N = this.track.N; let d = (a - b) % N; if (d > N / 2) d -= N; if (d < -N / 2) d += N; return d; }

  update(dt, t) {
    const g = this.game, tr = this.track;
    // caixas
    for (const b of this.boxes) {
      if (b.cd > 0) { b.cd -= dt; if (b.cd <= 0) { b.mesh.visible = true; b.mesh.scale.setScalar(0.1); } continue; }
      b.mesh.rotation.y += dt * 1.6; b.mesh.rotation.x = Math.sin(t * 1.3 + b.phase) * 0.4;
      b.mesh.position.y = 1.6 + Math.sin(t * 2 + b.phase) * 0.25;
      if (b.mesh.scale.x < 1) b.mesh.scale.setScalar(Math.min(1, b.mesh.scale.x + dt * 3));
      for (const r of g.racers) {
        if (Math.abs(this.dIdx(r.idx, b.idx)) < 2 && Math.abs(r.lateral - b.lat) < 1.9 && r.y < 3) {
          b.cd = 3; b.mesh.visible = false;
          g.fx.emit(b.mesh.position.x, 1.6, b.mesh.position.z, { spread: 9, count: 16, size: 0.35, life: 0.5, color: [0xffe35a, 0xff9d00, 0xff4fd8, 0xffffff] });
          if (!r.item && r.rolling <= 0) {
            r.rolling = r.isPlayer ? 1.4 : 0.5;
            r.pendingItem = rollItem(r.position, g.racers.length);
          }
          if (r.isPlayer) audio.sfx('box');
          break;
        }
      }
    }
    // roleta
    for (const r of g.racers) {
      if (r.rolling > 0) {
        r.rolling -= dt;
        if (r.isPlayer && Math.random() < 0.4) audio.sfx('roll');
        if (r.rolling <= 0) {
          r.item = r.pendingItem; r.aiItemDelay = 0.8 + Math.random() * 2.5;
          if (r.isPlayer) audio.sfx('got');
        }
      }
    }
    // projéteis (coxinhas) seguem a pista
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.prog += p.speed * dt / tr.seg;
      const tgt = p.target;
      if (tgt && !tgt.finished) {
        const d = this.dIdx(tgt.idx, p.prog);
        if (d > -5 && d < 70) p.lat += (tgt.lateral - p.lat) * Math.min(1, 4 * dt);
      }
      const pos = tr.pointAt(p.prog, p.lat);
      p.mesh.position.set(pos.x, 1.1 + Math.abs(Math.sin(t * 12)) * 0.4, pos.z);
      p.mesh.rotation.y = tr.heading(p.prog); p.mesh.rotation.x += dt * 10;
      if (Math.random() < 0.5) g.fx.emit(pos.x, 1.1, pos.z, { spread: 1, life: 0.3, size: 0.2, color: [0xd98a2a, 0xfff2c0] });
      let hit = false;
      for (const r of g.racers) {
        if (r === p.owner && p.age < 0.6) continue;
        const dx = r.x - pos.x, dz = r.z - pos.z;
        if (dx * dx + dz * dz < 4.5 && r.y < 2.5) {
          if (r.hit('spin') && p.owner.isPlayer) g.say(p.owner, 'ACERTOU!');
          hit = true; break;
        }
      }
      p.age += dt;
      if (hit || p.life <= 0) { this.group.remove(p.mesh); this.projectiles.splice(i, 1); }
    }
    // provas surpresa caindo do céu
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const f = this.falling[i];
      f.time += dt;
      const r = f.target;
      f.mesh.position.set(r.x, 30 - f.time * 30, r.z);
      f.mesh.rotation.y += dt * 8; f.mesh.rotation.z = Math.sin(f.time * 10) * 0.5;
      if (f.time >= 0.85) {
        r.hit('slow');
        this.group.remove(f.mesh); this.falling.splice(i, 1);
      }
    }
    // obstáculos
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.life -= dt;
      if (o.mesh.position.y > o.restY) o.mesh.position.y = Math.max(o.restY, o.mesh.position.y - dt * 25);
      if (o.type === 'boleto') o.mesh.rotation.y += dt * 1.5;
      let remove = o.life <= 0;
      if (!remove && o.mesh.position.y <= o.restY + 0.5) {
        for (const r of g.racers) {
          if (r === o.owner && o.age < 1.0) continue;
          if (Math.abs(this.dIdx(r.idx, o.idx)) < 1.6 && Math.abs(r.lateral - o.lat) < o.half + 0.9 && r.y < 2) {
            r.hit(o.type === 'wall' ? 'wall' : 'boleto');
            if (o.type === 'wall') { r.speed = Math.min(r.speed, 4); }
            remove = true; break;
          }
        }
      }
      o.age += dt;
      if (o.life < 1) o.mesh.scale.setScalar(Math.max(0.01, o.life));
      if (remove) {
        g.fx.emit(o.mesh.position.x, 1, o.mesh.position.z, { spread: 8, count: 14, life: 0.5, size: 0.35, color: o.type === 'wall' ? [0xb5482a, 0x8a3018, 0xdddddd] : [0xffffff, 0x222222] });
        this.group.remove(o.mesh); this.obstacles.splice(i, 1);
      }
    }
  }

  // ordem de corrida (1 = líder)
  ranked() { return [...this.game.racers].sort((a, b) => a.position - b.position); }

  // alvo "à frente": o piloto logo acima na classificação (ou o 2º se for o líder)
  targetAhead(r) {
    const rk = this.ranked();
    if (r.position > 1) return rk[r.position - 2];
    return rk[1] || null;
  }
  leaderTarget(r) {
    const rk = this.ranked();
    return rk[0] !== r ? rk[0] : rk[1] || null;
  }

  use(r) {
    const id = r.item;
    if (!id) return;
    r.item = null;
    const g = this.game, tr = this.track, near = r.isPlayer || g.near(r);
    switch (id) {
      case 'cafe': {
        r.giveBoost(2.6, 1.25);
        if (near) audio.sfx('boost');
        for (let k = 0; k < 10; k++) g.fx.emit(r.x, 2.5, r.z, { vy: 3, spread: 2, life: 1, size: 0.5, color: [0xffffff, 0xdddddd], grow: 2 });
        g.say(r, '☕ CAFÉ!');
        r.steam = 2.6;
        break;
      }
      case 'turbo': {
        r.giveBoost(1.6, 1.55);
        r.speed = r.ph.maxSpeed * 1.35;
        r.trail = 1.6;
        if (near) audio.sfx('turbo');
        g.say(r, 'TURBO IFSP!');
        break;
      }
      case 'coxinha': {
        const tgt = this.targetAhead(r);
        const target = tgt && tgt.progress > r.progress ? tgt : null;
        const mesh = coxinhaMesh();
        this.group.add(mesh);
        this.projectiles.push({ owner: r, target, prog: r.idx + 3, lat: r.lateral, speed: Math.max(55, r.speed + 22), life: 5, age: 0, mesh });
        if (near) audio.sfx('throw');
        break;
      }
      case 'prova': {
        const tgt = this.leaderTarget(r);
        if (tgt) {
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ map: r.provaMesh.material.map, side: THREE.DoubleSide }));
          this.group.add(mesh);
          this.falling.push({ target: tgt, time: 0, mesh });
          g.say(r, '📄 PROVA SURPRESA!');
          g.announce(tgt, 'PROVA SURPRESA!');
        }
        break;
      }
      case 'boletos': {
        for (let k = 0; k < 6; k++) {
          const idx = r.idx - 10 - k * 6 - Math.random() * 4;
          const lat = (Math.random() - 0.5) * (tr.width - 3);
          this.spawnObstacle('boleto', idx, lat, r);
        }
        if (near) audio.sfx('drop');
        g.say(r, '🧾 CHUVA DE BOLETOS!');
        break;
      }
      case 'trabalho': {
        const tgt = this.targetAhead(r);
        if (tgt) {
          const ahead = 18 + Math.max(0, tgt.speed) * 0.9;
          this.spawnObstacle('wall', tgt.idx + ahead, clampLat(tgt.lateral, tr), r);
          g.announce(tgt, 'TRABALHO EM GRUPO!');
        }
        if (near) audio.sfx('drop');
        break;
      }
      case 'nota': {
        r.shield = 8;
        if (near) audio.sfx('shield');
        g.say(r, '⚡ RECUPERAÇÃO!');
        break;
      }
    }
  }

  spawnObstacle(type, idx, lat, owner) {
    const tr = this.track;
    idx = ((idx % tr.N) + tr.N) % tr.N;
    const p = tr.pointAt(idx, lat);
    let mesh, half, restY;
    if (type === 'wall') {
      mesh = new THREE.Group();
      const bricks = new THREE.Mesh(new THREE.BoxGeometry(8, 2.6, 0.9), [M(0xb5482a), M(0xb5482a), M(0x9a3a20), M(0x9a3a20), new THREE.MeshLambertMaterial({ map: this.wallTex }), new THREE.MeshLambertMaterial({ map: this.wallTex })]);
      mesh.add(bricks);
      half = 4; restY = 1.3;
      mesh.rotation.y = tr.heading(idx);
    } else {
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshLambertMaterial({ map: this.boletoTex, side: THREE.DoubleSide }));
      half = 1.0; restY = 1.2;
    }
    mesh.position.set(p.x, restY + 25, p.z);
    this.group.add(mesh);
    this.obstacles.push({ type, idx, lat, half, mesh, restY, life: type === 'wall' ? 9 : 14, age: 0, owner });
  }

  // decisão da IA
  aiWantsUse(r) {
    const tr = this.track;
    switch (r.item) {
      case 'cafe': case 'turbo': return tr.curvAhead(r.idx, 40) < 0.02;
      case 'coxinha': { const t = this.targetAhead(r); return !!t && t.progress > r.progress && t.progress - r.progress < 120; }
      case 'boletos': return this.game.racers.some((o) => o !== r && r.progress - o.progress > 5 && r.progress - o.progress < 60) || Math.random() < 0.01;
      case 'nota': return true;
      default: return true;
    }
  }
}

function clampLat(l, tr) { return Math.max(-tr.width / 2 + 4, Math.min(tr.width / 2 - 4, l)); }

function coxinhaMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.5, 7), M(0xd98a2a));
  body.position.y = 0.35; g.add(body);
  const base = new THREE.Mesh(new THREE.SphereGeometry(0.75, 7, 5), M(0xc97a1f));
  base.scale.y = 0.6; g.add(base);
  return g;
}

function boletoTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 80;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 80);
  g.fillStyle = '#111'; g.font = 'bold 11px Arial'; g.fillText('BOLETO', 6, 14);
  g.fillStyle = '#e8262b'; g.font = 'bold 12px Arial'; g.fillText('R$ 999', 6, 30);
  g.fillStyle = '#111';
  for (let x = 6; x < 58; x += 2) if (Math.random() < 0.6) g.fillRect(x, 50, 1 + (Math.random() < 0.3 ? 1 : 0), 22);
  g.strokeStyle = '#111'; g.strokeRect(1, 1, 62, 78);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export { ITEMS };
