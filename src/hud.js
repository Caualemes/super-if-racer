// HUD da corrida (DOM) + minimapa em canvas
import { ITEMS } from './config.js';

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor(track) {
    this.track = track;
    this.root = $('hud');
    this.el = {
      lap: $('hud-lap'), time: $('hud-time'), pos: $('hud-pos'), speed: $('hud-speed'), bar: $('hud-speed-bar'),
      slot: $('hud-item-slot'), msg: $('hud-msg'), count: $('hud-count'), status: $('hud-status'),
    };
    this.mm = $('minimap');
    this.mctx = this.mm.getContext('2d');
    this.buildMinimap();
    this.cache = {};
    this.msgTimer = 0;
  }

  buildMinimap() {
    const tr = this.track, W = this.mm.width, pad = 16;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < tr.N; i++) { x0 = Math.min(x0, tr.px[i]); x1 = Math.max(x1, tr.px[i]); z0 = Math.min(z0, tr.pz[i]); z1 = Math.max(z1, tr.pz[i]); }
    const s = (W - pad * 2) / Math.max(x1 - x0, z1 - z0);
    const ox = pad + ((W - pad * 2) - (x1 - x0) * s) / 2, oz = pad + ((W - pad * 2) - (z1 - z0) * s) / 2;
    this.map = (x, z) => [ox + (x - x0) * s, oz + (z - z0) * s];
    const c = document.createElement('canvas'); c.width = c.height = W;
    const g = c.getContext('2d');
    const path = () => { g.beginPath(); for (let i = 0; i <= tr.N; i += 3) { const [x, y] = this.map(tr.px[i % tr.N], tr.pz[i % tr.N]); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
    g.lineJoin = 'round';
    path(); g.strokeStyle = '#000'; g.lineWidth = 11; g.stroke();
    path(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke();
    // linha de chegada
    const [sx, sy] = this.map(tr.px[0], tr.pz[0]);
    g.fillStyle = '#e8262b'; g.fillRect(sx - 2, sy - 7, 4, 14);
    // prédio principal
    const [bx, by] = this.map(-43, -7), [bx2, by2] = this.map(43, 19);
    g.fillStyle = 'rgba(31,168,58,.85)'; g.fillRect(bx, by, bx2 - bx, by2 - by);
    this.mmBg = c;
  }

  show(v) { this.root.classList.toggle('hidden', !v); }

  set(key, el, val, html = false) {
    if (this.cache[key] === val) return;
    this.cache[key] = val;
    if (html) el.innerHTML = val; else el.textContent = val;
  }

  update(game, dt) {
    const p = game.player;
    if (!p) return;
    const laps = game.laps;
    this.set('lap', this.el.lap, `${Math.min(Math.max(p.lap, 1), laps)}/${laps}`);
    this.set('time', this.el.time, fmtTime(game.raceTime));
    this.set('pos', this.el.pos, `${p.position}<sup>º</sup><small>/${game.racers.length}</small>`, true);
    const kmh = Math.round(Math.max(0, p.speed) * 4.2);
    this.set('spd', this.el.speed, String(kmh));
    this.el.bar.style.width = Math.min(100, kmh / 2) + '%';
    // item
    let icon = '';
    if (p.rolling > 0) {
      const keys = Object.keys(ITEMS);
      icon = ITEMS[keys[Math.floor(performance.now() / 70) % keys.length]].icon;
    } else if (p.item) icon = ITEMS[p.item].icon;
    this.set('item', this.el.slot, icon);
    this.el.slot.classList.toggle('rolling', p.rolling > 0);
    // status
    let st = '';
    if (p.wrongWay > 1) st = '⚠ CONTRAMÃO! ⚠';
    else if (p.item && p.rolling <= 0) st = ITEMS[p.item].name + ' • SHIFT';
    else if (p.drifting && p.driftCharge > 2.3) st = '🔥 TURBO MÁXIMO 🔥';
    else if (p.drifting && p.driftCharge > 1.1) st = '💨 MINI TURBO';
    this.set('st', this.el.status, st);
    if (this.msgTimer > 0) { this.msgTimer -= dt; if (this.msgTimer <= 0) this.el.msg.classList.remove('show'); }
    this.drawMinimap(game);
  }

  drawMinimap(game) {
    const g = this.mctx;
    g.clearRect(0, 0, this.mm.width, this.mm.height);
    g.drawImage(this.mmBg, 0, 0);
    const list = [...game.racers].sort((a, b) => (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0));
    for (const r of list) {
      const [x, y] = this.map(r.x, r.z);
      g.beginPath(); g.arc(x, y, r.isPlayer ? 7 : 5, 0, Math.PI * 2);
      g.fillStyle = r.def.color === '#1d1d22' ? '#555' : r.def.color; g.fill();
      g.lineWidth = r.isPlayer ? 3 : 2; g.strokeStyle = r.isPlayer ? '#ffd21f' : '#fff'; g.stroke();
    }
    // itens/obstáculos
    g.fillStyle = '#ff5a00';
    for (const o of game.items.obstacles) { const [x, y] = this.map(o.mesh.position.x, o.mesh.position.z); g.fillRect(x - 2, y - 2, 4, 4); }
  }

  message(text, dur = 1.6, color = null) {
    this.el.msg.textContent = text;
    this.el.msg.style.color = color || '';
    this.el.msg.classList.remove('show'); void this.el.msg.offsetWidth; this.el.msg.classList.add('show');
    this.msgTimer = dur;
  }

  countdown(text) {
    const c = this.el.count;
    c.textContent = text;
    c.classList.toggle('go', text === 'VAI!');
    c.classList.remove('anim'); void c.offsetWidth; c.classList.add('anim');
  }
}

export function fmtTime(t) {
  if (!isFinite(t)) return '--:--.--';
  const m = Math.floor(t / 60), s = Math.floor(t % 60), cs = Math.floor((t * 100) % 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
