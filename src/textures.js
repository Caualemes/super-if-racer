// Texturas procedurais desenhadas em canvas (baixa resolução, estilo N64)
import * as THREE from 'three';

const cache = new Map();

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTex(canvas, { repeat = [1, 1], nearest = false } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  if (nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; }
  t.anisotropy = 1;
  return t;
}

// gerador pseudo-aleatório determinístico
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function noise(ctx, w, h, base, vari, count, size = 2, seed = 3) {
  const r = rng(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const v = vari[(r() * vari.length) | 0];
    ctx.fillStyle = v;
    ctx.fillRect((r() * w) | 0, (r() * h) | 0, size, size);
  }
}

function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

export const Tex = {
  grass: () => cached('grass', () => {
    const [c, g] = makeCanvas(64, 64);
    noise(g, 64, 64, '#3fae35', ['#4fc23e', '#35982c', '#58c94a', '#2f8a28'], 700, 2, 7);
    return toTex(c, { repeat: [120, 120] });
  }),
  asphalt: () => cached('asphalt', () => {
    const [c, g] = makeCanvas(64, 128);
    noise(g, 64, 128, '#55575e', ['#4a4c52', '#60626a', '#505258', '#6a6c72'], 1400, 2, 11);
    // linha central tracejada
    g.fillStyle = '#f2f2f2';
    g.fillRect(30, 0, 4, 52);
    // bordas brancas
    g.fillRect(0, 0, 3, 128); g.fillRect(61, 0, 3, 128);
    return toTex(c, { repeat: [1, 1] });
  }),
  curb: () => cached('curb', () => {
    const [c, g] = makeCanvas(8, 32);
    g.fillStyle = '#e8262b'; g.fillRect(0, 0, 8, 16);
    g.fillStyle = '#ffffff'; g.fillRect(0, 16, 8, 16);
    return toTex(c, { nearest: true });
  }),
  checker: () => cached('checker', () => {
    const [c, g] = makeCanvas(64, 16);
    for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) {
      g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 4, y * 4, 4, 4);
    }
    return toTex(c, { nearest: true });
  }),
  parking: () => cached('parking', () => {
    const [c, g] = makeCanvas(128, 128);
    noise(g, 128, 128, '#5d5f66', ['#54565c', '#67696f', '#5a5c62'], 1500, 2, 21);
    g.fillStyle = '#f4f4f4';
    for (let x = 0; x < 128; x += 16) { g.fillRect(x, 0, 2, 44); g.fillRect(x, 84, 2, 44); }
    g.fillStyle = '#f5d300'; g.fillRect(0, 62, 128, 3);
    return toTex(c, { repeat: [6, 2] });
  }),
  sidewalk: () => cached('sidewalk', () => {
    const [c, g] = makeCanvas(32, 32);
    noise(g, 32, 32, '#c9c4b8', ['#bdb8ac', '#d4cfc3'], 120, 2, 5);
    g.fillStyle = '#a8a397'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32); g.fillRect(16, 0, 1, 32); g.fillRect(0, 16, 32, 1);
    return toTex(c, { repeat: [1, 1] });
  }),
  dirt: () => cached('dirt', () => {
    const [c, g] = makeCanvas(32, 32);
    noise(g, 32, 32, '#b5562c', ['#a64a24', '#c4663a', '#9a4320'], 260, 2, 9);
    return toTex(c, { repeat: [1, 1] });
  }),
  cane: () => cached('cane', () => {
    const [c, g] = makeCanvas(32, 32);
    g.fillStyle = '#7ec23a'; g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#5ea22c'; for (let x = 0; x < 32; x += 4) g.fillRect(x, 0, 2, 32);
    return toTex(c, { repeat: [10, 10] });
  }),
  wall: (variant = 0) => cached('wall' + variant, () => {
    // fachada com faixas de janelas
    const [c, g] = makeCanvas(128, 64);
    const base = ['#f1efe8', '#e9e6dc', '#dfe7ee'][variant % 3];
    g.fillStyle = base; g.fillRect(0, 0, 128, 64);
    const trim = ['#1fa83a', '#2e7d4f', '#c0392b'][variant % 3];
    g.fillStyle = trim; g.fillRect(0, 0, 128, 4); g.fillRect(0, 60, 128, 4);
    for (let row = 0; row < 2; row++) {
      for (let x = 4; x < 128; x += 16) {
        g.fillStyle = '#2a3f5a'; g.fillRect(x, 10 + row * 26, 12, 14);
        g.fillStyle = '#6fa3d8'; g.fillRect(x + 1, 11 + row * 26, 10, 6);
        g.fillStyle = '#3d5f86'; g.fillRect(x + 1, 17 + row * 26, 10, 6);
      }
    }
    return toTex(c, { repeat: [1, 1] });
  }),
  roof: () => cached('roof', () => {
    const [c, g] = makeCanvas(32, 32);
    noise(g, 32, 32, '#b8bcc2', ['#a9adb3', '#c6c9ce'], 100, 2, 4);
    g.fillStyle = '#9da1a7'; for (let y = 0; y < 32; y += 4) g.fillRect(0, y, 32, 1);
    return toTex(c, { repeat: [4, 4] });
  }),
  solar: () => cached('solar', () => {
    const [c, g] = makeCanvas(32, 32);
    g.fillStyle = '#1a2d6b'; g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#3a5fc8';
    for (let x = 0; x < 32; x += 8) for (let y = 0; y < 32; y += 8) g.fillRect(x + 1, y + 1, 6, 6);
    g.fillStyle = '#8fb0ff'; g.fillRect(2, 2, 3, 1);
    return toTex(c, { nearest: true });
  }),
  itemBox: () => cached('itembox', () => {
    const [c, g] = makeCanvas(64, 64);
    const grd = g.createLinearGradient(0, 0, 64, 64);
    grd.addColorStop(0, '#ffe35a'); grd.addColorStop(0.5, '#ff9d00'); grd.addColorStop(1, '#ff4fd8');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(3, 3, 58, 58);
    g.font = 'bold 46px Arial Black, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = '#222'; g.strokeText('?', 32, 35);
    g.fillStyle = '#fff'; g.fillText('?', 32, 35);
    return toTex(c);
  }),
  boost: () => cached('boost', () => {
    const [c, g] = makeCanvas(32, 64);
    g.fillStyle = '#0d5c22'; g.fillRect(0, 0, 32, 64);
    g.fillStyle = '#37e05a';
    for (let y = 0; y < 64; y += 32) {
      g.beginPath(); g.moveTo(4, y + 26); g.lineTo(16, y + 6); g.lineTo(28, y + 26); g.lineTo(22, y + 26); g.lineTo(16, y + 16); g.lineTo(10, y + 26); g.closePath(); g.fill();
    }
    return toTex(c, { repeat: [1, 1] });
  }),
  hazard: () => cached('hazard', () => {
    const [c, g] = makeCanvas(32, 32);
    g.fillStyle = '#ffd21f'; g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#111';
    for (let i = -32; i < 32; i += 12) { g.beginPath(); g.moveTo(i, 32); g.lineTo(i + 6, 32); g.lineTo(i + 38, 0); g.lineTo(i + 32, 0); g.fill(); }
    return toTex(c, { nearest: true });
  }),
};

// Placa com texto
export function textTexture(lines, { w = 256, h = 64, bg = '#ffffff', fg = '#111111', font = 'bold 34px Arial Black, Impact, sans-serif', border = null, align = 'center' } = {}) {
  const [c, g] = makeCanvas(w, h);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = border; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); }
  g.fillStyle = fg; g.font = font; g.textAlign = align; g.textBaseline = 'middle';
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((l, i) => {
    const y = h * (i + 0.5) / arr.length;
    if (typeof l === 'object') { g.font = l.font || font; g.fillStyle = l.color || fg; g.fillText(l.text, align === 'center' ? w / 2 : 10, y); }
    else g.fillText(l, align === 'center' ? w / 2 : 10, y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Logo estilizado do IF (grade de quadrados verdes + círculo vermelho)
export function ifLogoTexture(withText = true) {
  return cached('iflogo' + withText, () => {
    const W = 128, H = withText ? 200 : 128;
    const [c, g] = makeCanvas(W, H);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    const s = 26, pad = 18, gap = 4;
    for (let r = 0; r < 3; r++) for (let col = 0; col < 3; col++) {
      if (r === 0 && col === 0) {
        g.fillStyle = '#e8262b'; g.beginPath(); g.arc(pad + s / 2, pad + s / 2, s / 2, 0, Math.PI * 2); g.fill();
        continue;
      }
      if ((r === 0 && col === 2) || (r === 2 && col === 2)) continue;
      g.fillStyle = '#1fa83a'; g.fillRect(pad + col * (s + gap), pad + r * (s + gap), s, s);
    }
    g.fillStyle = '#1fa83a';
    g.fillRect(pad, pad + 3 * (s + gap), s, s);
    if (withText) {
      g.fillStyle = '#111'; g.font = 'bold 15px Arial Black, sans-serif'; g.textAlign = 'center';
      g.fillText('INSTITUTO', W / 2, 160); g.fillText('FEDERAL', W / 2, 180);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// Emojis em textura (para itens/partículas)
export function emojiTexture(emoji, size = 64) {
  return cached('emoji' + emoji + size, () => {
    const [c, g] = makeCanvas(size, size);
    g.font = `${size * 0.8}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(emoji, size / 2, size / 2 + size * 0.05);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}
