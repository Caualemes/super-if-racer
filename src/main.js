// IFSP MOTO KART 64 — ponto de entrada: renderer, telas, corrida, resultado
import * as THREE from 'three';
import './style.css';
import { Track } from './track.js';
import { Campus, VARIANTS } from './campus.js';
import { Particles } from './effects.js';
import { Items } from './items.js';
import { Racer } from './racer.js';
import { HUD, fmtTime } from './hud.js';
import { Input } from './input.js';
import { audio } from './audio.js';
import { DRIVERS, MESSAGES } from './config.js';
import { buildCharacter, poseStand, M, blobShadow } from './models.js';
import { angDiff } from './track.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[(Math.random() * a.length) | 0];
const PLAYABLE = ['caua', 'renato'];
const POINTS = [10, 6, 3, 1];
const STAGE = new THREE.Vector3(0, 0, 51); // palco de seleção/pódio no estacionamento

class Game {
  constructor() {
    this.canvas = $('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.5, 3000);
    this.track = new Track();
    this.campus = new Campus(this.scene, this.track);
    this.fx = new Particles(this.scene);
    this.items = new Items(this);
    this.input = new Input();
    this.hud = new HUD(this.track);
    this.racers = [];
    this.player = null;
    this.laps = 3;
    this.raceTime = 0;
    this.t = 0;
    this.state = 'title';
    this.mode = 'quick';
    this.selIdx = 0;
    this.variant = 0;
    this.camYaw = 0;
    this.champ = null;
    this.loadOptions();
    this.campus.setVariant(0);
    this.buildStage();
    this.buildPodium();
    this.bindUI();
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.setupRacers(['caua', 'renato', 'calouro', 'veterana'], null);
    this.gotoScreen('title');
    $('loading').classList.add('hidden');
    this.last = performance.now();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---------------- opções ----------------
  loadOptions() {
    let o = {};
    try { o = JSON.parse(localStorage.getItem('ifsp64-opts') || '{}'); } catch (e) { /* sem storage */ }
    this.opts = { music: o.music ?? '1', sfx: o.sfx ?? '1', retro: o.retro ?? '360', diff: o.diff ?? '1' };
    $('opt-music').value = this.opts.music; $('opt-sfx').value = this.opts.sfx; $('opt-retro').value = this.opts.retro; $('opt-diff').value = this.opts.diff;
    this.applyOptions();
  }
  applyOptions() {
    this.opts = { music: $('opt-music').value, sfx: $('opt-sfx').value, retro: $('opt-retro').value, diff: $('opt-diff').value };
    try { localStorage.setItem('ifsp64-opts', JSON.stringify(this.opts)); } catch (e) { /* ok */ }
    audio.setMusic(this.opts.music === '1'); audio.setSfx(this.opts.sfx === '1');
    this.difficulty = +this.opts.diff;
    this.resize();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    const target = +(this.opts?.retro ?? 360);
    const scale = target > 0 && h > target ? target / h : Math.min(devicePixelRatio, 1.5);
    this.renderer.setSize(Math.round(w * scale), Math.round(h * scale), false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------- palco de seleção (no estacionamento, em frente ao prédio) ----------------
  buildStage() {
    const g = this.stage = new THREE.Group();
    g.position.copy(STAGE);
    this.scene.add(g);
    this.stageSlots = PLAYABLE.map((id, i) => {
      const slot = new THREE.Group();
      slot.position.set(i === 0 ? -3.4 : 3.4, 0, 0);
      g.add(slot);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.35, 16), M(i === 0 ? 0x1fa83a : 0x2a2d36));
      disc.position.y = 0.17; slot.add(disc);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.12, 4, 24), M(0xffd21f, { emissive: 0x664400 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.36; slot.add(ring);
      const turn = new THREE.Group(); turn.position.y = 0.35; slot.add(turn);
      const ch = buildCharacter(DRIVERS[id].look);
      ch.position.set(-0.85, 0, 0.3);
      turn.add(ch);
      const sh = blobShadow(1, 1); sh.position.set(-0.85, 0.02, 0.3); turn.add(sh);
      const bike = DRIVERS[id].bike();
      bike.scale.setScalar(1.35);
      bike.position.set(0.95, 0, -0.2);
      bike.rotation.y = -1.15;
      turn.add(bike);
      const bs = blobShadow(1.4, 2.6); bs.position.set(0.95, 0.02, -0.2); bs.rotation.z = -1.15; turn.add(bs);
      return { id, slot, turn, ch, ring };
    });
    g.visible = false;
  }

  buildPodium() {
    const g = this.podium = new THREE.Group();
    g.position.copy(STAGE);
    this.scene.add(g);
    const blocks = [[0, 2.2, 0xffc21f, '1'], [-3.2, 1.5, 0xc9ccd2, '2'], [3.2, 1.0, 0xc87a3a, '3']];
    this.podiumSpots = [];
    for (const [x, h, col, n] of blocks) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(3, h, 2.6), M(col));
      b.position.set(x, h / 2, 0); g.add(b);
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const cx = c.getContext('2d'); cx.fillStyle = '#' + col.toString(16).padStart(6, '0'); cx.fillRect(0, 0, 64, 64);
      cx.font = 'bold 50px Arial Black'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineWidth = 6; cx.strokeStyle = '#333'; cx.strokeText(n, 32, 35); cx.fillStyle = '#fff'; cx.fillText(n, 32, 35);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: t }));
      pl.position.set(x, h / 2, 1.31); g.add(pl);
      this.podiumSpots.push(new THREE.Vector3(x, h, 0));
    }
    this.podiumChars = [];
    g.visible = false;
  }

  // ---------------- UI ----------------
  bindUI() {
    const click = (sel, fn) => document.querySelectorAll(sel).forEach((b) => b.addEventListener('click', (e) => { audio.init(); audio.sfx('select'); fn(e.currentTarget); }));
    click('#scr-title [data-act=start]', () => this.gotoScreen('mode'));
    click('#scr-title [data-act=options]', () => this.gotoScreen('options'));
    click('#scr-mode [data-mode]', (b) => { this.mode = b.dataset.mode; this.gotoScreen('select'); });
    click('#scr-mode [data-act=back]', () => this.gotoScreen('title'));
    click('#scr-options [data-act=back]', () => { this.applyOptions(); this.gotoScreen('title'); });
    document.querySelectorAll('#scr-options select').forEach((s) => s.addEventListener('change', () => this.applyOptions()));
    click('#scr-select [data-act=prev]', () => this.changeSel(-1));
    click('#scr-select [data-act=next]', () => this.changeSel(1));
    click('#scr-select [data-act=back]', () => this.gotoScreen('mode'));
    click('#scr-select [data-act=confirm]', () => this.confirmSel());
    click('#scr-map [data-variant]', (b) => this.setVariant(+b.dataset.variant));
    click('#scr-map [data-act=back]', () => this.gotoScreen('select'));
    click('#scr-map [data-act=go]', () => this.startFromMenu());
    click('#scr-pause [data-act=resume]', () => this.resume());
    click('#scr-pause [data-act=restart]', () => { this.resume(); this.startRace(); });
    click('#scr-pause [data-act=quit]', () => { this.champ = null; this.toTitle(); });
    // canvas toca = start no título
    this.canvas.addEventListener('pointerdown', () => { audio.init(); });
    document.addEventListener('keydown', () => audio.init(), { once: true });
  }

  gotoScreen(name) {
    this.state = name;
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const map = { title: 'scr-title', mode: 'scr-mode', select: 'scr-select', map: 'scr-map', options: 'scr-options', results: 'scr-results', pause: 'scr-pause' };
    if (map[name]) $(map[name]).classList.add('active');
    const inRace = name === 'race' || name === 'pause' || name === 'countdown';
    this.hud.show(inRace);
    $('touch').classList.toggle('hidden', !(inRace && this.input.isTouch));
    this.stage.visible = name === 'select';
    this.podium.visible = name === 'results';
    for (const c of this.podiumChars) c.visible = name === 'results';
    if (['title', 'mode', 'options'].includes(name)) audio.play('menu');
    if (name === 'select') this.updateSelUI();
    if (name === 'map') {
      document.querySelectorAll('#map-variants .chip').forEach((c) => {
        c.classList.toggle('on', +c.dataset.variant === this.variant);
        c.disabled = this.mode === 'champ';
      });
      if (this.mode === 'champ') this.setVariant(0);
    }
    // botão padrão para teclado
    const first = map[name] && $(map[name]).querySelector('.btn.big, .card, .btn');
    if (first && !this.input.isTouch) setTimeout(() => first.focus({ preventScroll: true }), 30);
  }

  setVariant(v) {
    this.variant = v;
    this.campus.setVariant(v);
    document.querySelectorAll('#map-variants .chip').forEach((c) => c.classList.toggle('on', +c.dataset.variant === v));
  }

  changeSel(d) {
    this.selIdx = (this.selIdx + d + PLAYABLE.length) % PLAYABLE.length;
    this.updateSelUI();
  }
  updateSelUI() {
    const d = DRIVERS[PLAYABLE[this.selIdx]];
    $('sel-name').textContent = d.name;
    $('sel-bike').textContent = d.bikeName;
    $('sel-quote').textContent = d.quote + (this.mode === 'duel' ? `  —  rival: ${DRIVERS[PLAYABLE[1 - this.selIdx]].name}` : '');
    const s = d.stats;
    $('sel-stats').innerHTML = [['VELOCIDADE', s.vel], ['ACELERAÇÃO', s.acel], ['CONTROLE', s.ctrl]]
      .map(([n, v]) => `<span>${n}</span><div class="stat-bar"><i style="width:${v * 10}%"></i></div>`).join('');
  }
  confirmSel() { this.gotoScreen('map'); }

  startFromMenu() {
    if (this.mode === 'champ') this.champ = { race: 0, points: {} };
    else this.champ = null;
    this.startRace();
  }

  toTitle() {
    this.campus.setVariant(0); this.variant = 0;
    this.items.reset(); this.fx.clear();
    this.setupRacers(['caua', 'renato', 'calouro', 'veterana'], null);
    this.gotoScreen('title');
  }

  // ---------------- corrida ----------------
  setupRacers(ids, playerId) {
    for (const r of this.racers) this.scene.remove(r.root);
    this.items.reset();
    this.racers = ids.map((id) => new Racer(this, id, { isPlayer: id === playerId, skill: id === 'renato' && this.mode === 'duel' ? 1.04 : 1 }));
    this.player = this.racers.find((r) => r.isPlayer) || null;
    // grid: jogador por último
    const order = [...this.racers].sort((a, b) => (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0));
    order.forEach((r, i) => {
      r.reset(0);
      r.placeOnGrid(this.track.N - 6 - i * 7, i % 2 ? 4 : -4);
      this.scene.add(r.root);
      r.position = i + 1;
    });
    this.raceTime = 0;
  }

  startRace() {
    const playerId = PLAYABLE[this.selIdx];
    let ids;
    if (this.mode === 'duel') ids = [playerId, PLAYABLE[1 - this.selIdx]];
    else ids = [playerId, PLAYABLE[1 - this.selIdx], 'calouro', 'veterana'];
    if (this.champ) this.setVariant(this.champ.race);
    this.setupRacers(ids, playerId);
    this.fx.clear();
    this.countdown = 3.999;
    this.lastCount = 4;
    this.gasHeld = -1;
    this.finishTimer = -1;
    this.camYaw = this.player.heading;
    const p = this.player;
    this.camera.position.set(p.x - Math.sin(p.heading) * 30, 14, p.z - Math.cos(p.heading) * 30);
    this.gotoScreen('countdown');
    $('hud-count').textContent = '';
    audio.init();
    audio.stopMusic();
    this.hud.message(VARIANTS[this.variant].name === 'NOITE' ? 'CORRIDA NOTURNA!' : (this.champ ? `CAMPEONATO • CORRIDA ${this.champ.race + 1}/3` : 'IFSP BIRIGUI'), 2.2, '#fff');
  }

  near(r) {
    if (!this.player || !(this.state === 'race' || this.state === 'countdown')) return false;
    const dx = r.x - this.player.x, dz = r.z - this.player.z;
    return dx * dx + dz * dz < 60 * 60;
  }

  say(r, text) { if (r.isPlayer) this.hud.message(text, 1.3); }
  announce(target, text) { if (target.isPlayer) this.hud.message(text + ' 😱', 1.6, '#ff6b6b'); }

  onLap(r) {
    if (r.lap > this.laps && !r.finished) {
      r.finished = true; r.finishTime = this.raceTime; r.cheer = 3;
      if (r.isPlayer) {
        this.finishTimer = 3.5;
        const pos = this.racers.filter((o) => o.finished).length;
        this.hud.message(pos === 1 ? '🏁 VITÓRIA! 🏁' : '🏁 CHEGADA!', 3, pos === 1 ? '#ffd21f' : '#fff');
        audio.play(pos === 1 ? 'win' : 'lose');
        this.flash();
      }
      return;
    }
    if (r.isPlayer && r.lap > 1) {
      if (r.lap === this.laps) { this.hud.message('VOLTA FINAL!', 2, '#ff5a3a'); audio.sfx('final'); }
      else { this.hud.message(`VOLTA ${r.lap}`, 1.5); audio.sfx('lap'); }
    }
  }

  flash() { const f = $('flash'); f.style.opacity = 0.8; setTimeout(() => (f.style.opacity = 0), 80); }

  pause() { if (this.state !== 'race') return; this.gotoScreen('pause'); audio.engine(0, 0, false); }
  resume() { this.gotoScreen('race'); }

  // atualização de todos os pilotos (corrida ou modo demonstração)
  simulate(dt, controlPlayer) {
    const inp = this.input;
    for (const r of this.racers) {
      let ctrl;
      if (r.isPlayer && controlPlayer && !r.finished && !this.autopilot) {
        ctrl = { gas: inp.gas, brake: inp.brake, steer: (inp.right ? 1 : 0) - (inp.left ? 1 : 0), drift: inp.drift };
        if (inp.consume('ShiftLeft', 'ShiftRight', 'KeyE') && r.item && r.rolling <= 0) this.items.use(r);
      } else {
        ctrl = r.aiControl(dt, this.t);
        if (ctrl.useItem && r.item && r.rolling <= 0) this.items.use(r);
      }
      r.update(dt, ctrl, this.raceTime);
      // efeitos contínuos
      if (r.steam > 0) { r.steam -= dt; if (Math.random() < 0.5) this.fx.emit(r.x, 3.4, r.z, { vy: 2, spread: 0.8, life: 0.8, size: 0.4, color: 0xffffff, grow: 2 }); }
      if (r.trail > 0) {
        r.trail -= dt;
        const s = Math.sin(r.heading), c = Math.cos(r.heading);
        this.fx.emit(r.x - s * 1.6, 0.8, r.z - c * 1.6, { spread: 0.8, life: 0.7, size: 0.55, color: [0x1fa83a, 0x5bff7a, 0xffffff, 0xe8262b] });
      } else if (r.boost > 0 && (r.isPlayer || this.near(r))) {
        const s = Math.sin(r.heading), c = Math.cos(r.heading);
        this.fx.emit(r.x - s * 1.5 + c * 0.35, 0.8, r.z - c * 1.5 - s * 0.35, { vx: -s * 6, vz: -c * 6, spread: 1, life: 0.25, size: 0.4, color: [0xff8a12, 0xffd21f, 0xff3b1f] });
      }
    }
    this.collide(dt);
    // classificação
    const sorted = [...this.racers].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
    sorted.forEach((r, i) => { r.position = i + 1; });
  }

  collide(dt) {
    const rs = this.racers;
    // entre pilotos
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      const dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz, R = 2.0;
      if (d2 < R * R && d2 > 0.0001 && Math.abs(a.y - b.y) < 1.5) {
        const d = Math.sqrt(d2), nx = dx / d, nz = dz / d, push = (R - d) / 2;
        a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
        // quem está atrás perde um pouco, quem está na frente ganha um empurrão
        const av = a.speed, bv = b.speed;
        a.speed = av * 0.92 + bv * 0.04; b.speed = bv * 0.92 + av * 0.04;
        if ((a.isPlayer || b.isPlayer) && a.bumpCd <= 0 && b.bumpCd <= 0) { audio.sfx('bump'); a.bumpCd = b.bumpCd = 0.4; }
      }
    }
    // objetos fixos e cones
    for (const r of rs) {
      for (const c of this.campus.colliders) {
        const dx = r.x - c.x, dz = r.z - c.z, R = c.r + 0.9;
        if (Math.abs(dx) > R || Math.abs(dz) > R) continue;
        const d2 = dx * dx + dz * dz;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 0.01;
          r.x = c.x + dx / d * R; r.z = c.z + dz / d * R;
          if (r.speed > 8) {
            r.speed *= 0.45;
            if (r.isPlayer && r.bumpCd <= 0) { audio.sfx('wall'); r.bumpCd = 0.5; this.fx.emit(r.x, 1.4, r.z, { spread: 6, count: 10, size: 0.3, color: [0xffffff, 0xffd21f], life: 0.4 }); }
          }
        }
      }
      for (const c of this.campus.cones) {
        if (c.knocked > 0) continue;
        const dx = r.x - c.x, dz = r.z - c.z;
        if (dx * dx + dz * dz < 2.2) {
          c.knocked = 2.5;
          const s = Math.max(6, r.speed) * 0.6;
          c.vx = Math.sin(r.velAngle) * s + dx * -2; c.vz = Math.cos(r.velAngle) * s + dz * -2; c.vy = 7;
          r.speed *= 0.9;
          if (r.isPlayer) audio.sfx('cone');
        }
      }
    }
  }

  updateChaseCam(dt, snap = false) {
    const p = this.player;
    const yawT = p.heading;
    this.camYaw += angDiff(yawT, this.camYaw) * Math.min(1, (snap ? 100 : 4.5) * dt);
    const dist = (7.6 + Math.max(0, p.speed) * 0.05) * (this.camera.aspect < 1 ? 1.6 : 1);
    const h = 3.9 + Math.max(0, p.speed) * 0.01;
    const s = Math.sin(this.camYaw), c = Math.cos(this.camYaw);
    const tx = p.x - s * dist, tz = p.z - c * dist, ty = p.y * 0.6 + h;
    const k = snap ? 1 : 1 - Math.exp(-7 * dt);
    this.camera.position.x += (tx - this.camera.position.x) * k;
    this.camera.position.y += (ty - this.camera.position.y) * k;
    this.camera.position.z += (tz - this.camera.position.z) * k;
    this.camera.lookAt(p.x + s * 6, p.y * 0.8 + 2.0, p.z + c * 6);
    const fov = 66 + (p.boost > 0 ? 10 : 0) + clamp(p.speed, 0, 50) * 0.12;
    this.camera.fov += (fov - this.camera.fov) * Math.min(1, 4 * dt);
    this.camera.updateProjectionMatrix();
  }

  // ---------------- resultados ----------------
  showResults() {
    const order = [...this.racers].sort((a, b) => a.position - b.position);
    // estima tempo de quem não terminou
    for (const r of order) {
      if (!r.finished) {
        const remaining = ((this.laps + 1) * this.track.N - r.progress) * this.track.seg;
        r.finishTime = this.raceTime + remaining / (r.ph.maxSpeed * 0.8);
        r.estimated = true;
      }
    }
    order.sort((a, b) => a.finishTime - b.finishTime);
    order.forEach((r, i) => (r.position = i + 1));
    const p = this.player;
    const n = order.length;
    const win = p.position === 1, last = p.position === n;
    const msgs = MESSAGES[p.id];
    $('res-title').textContent = win ? '1º LUGAR!' : last ? `${p.position}º LUGAR... REPROVADO!` : `${p.position}º LUGAR!`;
    $('res-msg').textContent = pick(win ? msgs.win : last ? msgs.lose : msgs.mid);
    // campeonato
    let champRows = null;
    if (this.champ) {
      order.forEach((r, i) => { this.champ.points[r.id] = (this.champ.points[r.id] || 0) + POINTS[i]; });
      champRows = this.champ.points;
    }
    const best = (r) => (r.lapTimes.length ? fmtTime(Math.min(...r.lapTimes)) : '--');
    let html = `<tr><th>POS</th><th>PILOTO</th><th>MOTO</th><th>TEMPO</th><th>MELHOR VOLTA</th>${champRows ? '<th>PTS</th><th>TOTAL</th>' : ''}</tr>`;
    order.forEach((r, i) => {
      html += `<tr class="${r.isPlayer ? 'me' : ''}"><td>${i + 1}º</td><td>${r.name}</td><td>${r.def.bikeName}</td><td>${r.estimated ? '~' : ''}${fmtTime(r.finishTime)}</td><td>${best(r)}</td>${champRows ? `<td>+${POINTS[i]}</td><td>${champRows[r.id]}</td>` : ''}</tr>`;
    });
    $('res-table').innerHTML = html;
    // botões
    const btns = $('res-buttons');
    btns.innerHTML = '';
    const add = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label; b.onclick = () => { audio.sfx('select'); fn(); }; btns.appendChild(b); };
    if (this.champ && this.champ.race < 2) {
      add('PRÓXIMA CORRIDA ▶', 'big ok', () => { this.champ.race++; this.startRace(); });
    } else if (this.champ) {
      const standings = Object.entries(this.champ.points).sort((a, b) => b[1] - a[1]);
      const champId = standings[0][0];
      const champWin = champId === p.id;
      $('res-title').textContent = champWin ? '🏆 CAMPEÃO! 🏆' : `CAMPEÃO: ${DRIVERS[champId].name}`;
      $('res-msg').textContent = champWin ? 'Formado com honras no Campeonato IFSP Birigui!' : `Você somou ${this.champ.points[p.id]} pontos. Semestre que vem tem mais!`;
      add('NOVO CAMPEONATO', 'big ok', () => { this.champ = { race: 0, points: {} }; this.startRace(); });
      add('MENU', '', () => { this.champ = null; this.toTitle(); });
    } else {
      add('REVANCHE', 'big ok', () => this.startRace());
      add('TROCAR PILOTO', '', () => this.gotoScreen('select'));
      add('MENU', '', () => this.toTitle());
    }
    // pódio 3D
    for (const c of this.podiumChars) this.podium.remove(c);
    this.podiumChars = [];
    let podiumOrder = order.slice(0, 3);
    if (this.champ && this.champ.race >= 2) {
      podiumOrder = Object.entries(this.champ.points).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => this.racers.find((r) => r.id === id));
    }
    podiumOrder.forEach((r, i) => {
      const ch = buildCharacter(r.def.look);
      ch.position.copy(this.podiumSpots[i]);
      ch.userData.style = i === 0 ? 'cheer' : 'clap';
      ch.userData.place = i;
      this.podium.add(ch);
      this.podiumChars.push(ch);
    });
    // jogador fora do pódio aparece triste ao lado
    if (!podiumOrder.includes(p)) {
      const ch = buildCharacter(p.def.look);
      ch.position.set(6.5, 0, 1.2); ch.userData.style = 'sad'; ch.rotation.y = -0.5;
      this.podium.add(ch); this.podiumChars.push(ch);
    }
    this.gotoScreen('results');
    this.resultsT = 0;
    if (!this.champ || this.champ.race >= 2) audio.play(win ? 'win' : 'lose');
    this.campus.setVariant(this.variant);
  }

  // ---------------- loop ----------------
  frame() {
    const now = performance.now();
    let dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    const inp = this.input;
    const st = this.state;

    // atalhos de teclado nos menus
    if (st === 'title' && inp.consume('Enter', 'Space')) { audio.init(); audio.sfx('select'); this.gotoScreen('mode'); }
    else if (st === 'select') {
      if (inp.consume('ArrowLeft', 'KeyA')) { this.changeSel(-1); audio.sfx('select'); }
      if (inp.consume('ArrowRight', 'KeyD')) { this.changeSel(1); audio.sfx('select'); }
      if (inp.consume('Escape')) { audio.sfx('back'); this.gotoScreen('mode'); }
    } else if (st === 'map') {
      if (inp.consume('ArrowLeft', 'KeyA') && this.mode !== 'champ') this.setVariant((this.variant + 2) % 3);
      if (inp.consume('ArrowRight', 'KeyD') && this.mode !== 'champ') this.setVariant((this.variant + 1) % 3);
      if (inp.consume('Escape')) { audio.sfx('back'); this.gotoScreen('select'); }
    } else if ((st === 'mode' || st === 'options') && inp.consume('Escape')) { audio.sfx('back'); if (st === 'options') this.applyOptions(); this.gotoScreen('title'); }
    else if (st === 'race' && inp.consume('Escape', 'KeyP')) this.pause();
    else if (st === 'pause' && inp.consume('Escape', 'KeyP')) this.resume();

    switch (this.state) {
      case 'title': case 'mode': case 'options': case 'map': {
        // modo demonstração: IA corre pelo campus enquanto a câmera orbita
        this.raceTime += dt;
        this.simulate(dt, false);
        this.items.update(dt, this.t);
        const high = this.state === 'map';
        const a = this.t * (high ? 0.12 : 0.08);
        const R = high ? 250 : 210, H = high ? 210 : 70;
        this.camera.position.set(Math.cos(a) * R, H, Math.sin(a) * R + 10);
        this.camera.fov = 60; this.camera.updateProjectionMatrix();
        this.camera.lookAt(0, high ? -40 : 0, 0);
        break;
      }
      case 'select': {
        this.raceTime += dt;
        this.simulate(dt, false);
        this.stageSlots.forEach((s, i) => {
          const sel = i === this.selIdx;
          const targetS = sel ? 1.08 : 0.86;
          s.slot.scale.setScalar(s.slot.scale.x + (targetS - s.slot.scale.x) * Math.min(1, 8 * dt));
          s.turn.rotation.y = sel ? Math.sin(this.t * 0.6) * 0.75 : s.turn.rotation.y * 0.95;
          s.ring.visible = sel;
          poseStand(s.ch, this.t + i * 1.3, DRIVERS[s.id].pose);
        });
        const cx = this.selIdx === 0 ? -1.2 : 1.2;
        const camT = new THREE.Vector3(STAGE.x + cx, 2.3, STAGE.z + 8.2);
        this.camera.position.lerp(camT, Math.min(1, 4 * dt));
        this.camera.fov = 50; this.camera.updateProjectionMatrix();
        this.camera.lookAt(STAGE.x + cx * 0.6, 0.75, STAGE.z);
        break;
      }
      case 'countdown': {
        const prev = Math.ceil(this.countdown);
        this.countdown -= dt;
        const now = Math.ceil(this.countdown);
        if (now !== prev && now > 0) { this.hud.countdown(String(now)); audio.sfx('beep'); }
        if (inp.gas && this.gasHeld < 0) this.gasHeld = this.countdown;
        if (!inp.gas) this.gasHeld = -1;
        for (const r of this.racers) r.syncVisual(dt, this.t);
        this.updateChaseCam(dt, this.countdown > 3.8);
        if (this.countdown <= 0) {
          this.hud.countdown('VAI!');
          audio.sfx('go'); audio.play('race');
          setTimeout(() => { if (this.state === 'race' || this.state === 'pause') $('hud-count').textContent = ''; }, 900);
          // largada perfeita: acelerar no último segundo
          if (this.gasHeld >= 0 && this.gasHeld < 0.9) { this.player.giveBoost(1.0, 1.3); this.hud.message('LARGADA PERFEITA!', 1.4); audio.sfx('boost'); }
          else if (this.gasHeld > 1.6) { this.player.spin = 0.6; this.hud.message('AFOGOU O MOTOR!', 1.2, '#ff6b6b'); }
          // IA também ganha largadas aleatórias
          for (const r of this.racers) if (!r.isPlayer && Math.random() < 0.4) r.giveBoost(0.8, 1.2);
          this.state = 'race';
        }
        this.hud.update(this, dt);
        break;
      }
      case 'race': {
        this.raceTime += dt;
        this.simulate(dt, true);
        this.items.update(dt, this.t);
        this.updateChaseCam(dt);
        this.hud.update(this, dt);
        const p = this.player;
        audio.engine(clamp(p.speed / 50, 0, 1.2), inp.gas ? 1 : 0, true);
        if (this.finishTimer > 0) {
          this.finishTimer -= dt;
          if (this.finishTimer <= 0) { audio.engine(0, 0, false); this.showResults(); }
        }
        break;
      }
      case 'pause':
        break;
      case 'results': {
        this.resultsT += dt;
        this.raceTime += dt;
        this.simulate(dt, false);
        for (const ch of this.podiumChars) {
          poseStand(ch, this.t + (ch.userData.place || 0), ch.userData.style);
          ch.rotation.y = ch.userData.style === 'sad' ? -0.4 : Math.sin(this.t * 0.5 + (ch.userData.place || 0)) * 0.15;
        }
        if (Math.random() < 0.08) this.fx.confetti(STAGE.x + (Math.random() - 0.5) * 8, 7, STAGE.z + (Math.random() - 0.5) * 3, 6);
        const a = Math.sin(this.t * 0.3) * 0.25;
        this.camera.position.set(STAGE.x + Math.sin(a) * 11, 4.2, STAGE.z + Math.cos(a) * 11);
        this.camera.fov = 55; this.camera.updateProjectionMatrix();
        this.camera.lookAt(STAGE.x, 1.0, STAGE.z);
        if (inp.consume('Enter')) { const b = $('res-buttons').querySelector('button'); if (b) b.click(); }
        break;
      }
    }

    if (this.state !== 'pause') {
      this.fx.update(dt);
      this.campus.update(dt, this.t);
    }
    this.renderer.render(this.scene, this.camera);
    inp.endFrame();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    window.game = new Game();
  } catch (e) {
    console.error(e);
    $('loading').textContent = 'Erro ao iniciar: ' + e.message;
  }
});
