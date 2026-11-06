// Áudio sintetizado com WebAudio: motor, músicas chiptune originais e efeitos
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
// notação: número MIDI, 0 = pausa
const SONGS = {
  menu: {
    bpm: 132,
    lead: [72, 0, 76, 79, 0, 76, 74, 72, 74, 0, 77, 81, 0, 79, 77, 76, 72, 0, 76, 79, 84, 0, 83, 81, 79, 0, 77, 76, 74, 0, 72, 0],
    bass: [48, 48, 55, 55, 50, 50, 57, 57, 53, 53, 60, 60, 55, 55, 50, 50],
    drum: [1, 0, 2, 0, 1, 1, 2, 0, 1, 0, 2, 0, 1, 1, 2, 2],
  },
  race: {
    bpm: 156,
    lead: [76, 76, 0, 79, 0, 81, 79, 76, 74, 0, 72, 74, 76, 0, 79, 0, 81, 81, 0, 84, 0, 83, 81, 79, 77, 0, 76, 74, 72, 74, 76, 0,
           69, 72, 76, 0, 74, 72, 69, 0, 71, 74, 77, 0, 76, 74, 71, 0, 72, 76, 79, 84, 83, 79, 76, 74, 72, 0, 72, 0, 74, 0, 76, 0],
    bass: [45, 45, 52, 45, 43, 43, 50, 43, 41, 41, 48, 41, 43, 43, 50, 47, 45, 45, 52, 45, 43, 43, 50, 43, 41, 41, 48, 41, 43, 47, 50, 55],
    drum: [1, 0, 2, 1, 1, 0, 2, 0, 1, 0, 2, 1, 1, 2, 2, 2],
  },
  win: {
    bpm: 140, once: true,
    lead: [72, 76, 79, 84, 0, 79, 84, 0, 86, 0, 88, 88, 88, 0, 0, 0],
    bass: [48, 52, 55, 60, 55, 60, 62, 64],
    drum: [1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 2, 1, 0, 0, 0],
  },
  lose: {
    bpm: 110, once: true,
    lead: [72, 0, 71, 0, 70, 0, 69, 69, 69, 0, 0, 0, 0, 0, 0, 0],
    bass: [48, 47, 46, 45, 45, 0, 0, 0],
    drum: [1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
  },
};

export class Audio {
  constructor() {
    this.ctx = null;
    this.musicOn = true; this.sfxOn = true;
    this.song = null; this.step = 0; this.nextTime = 0;
  }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(ctx.destination);
    this.musicGain = ctx.createGain(); this.musicGain.gain.value = this.musicOn ? 0.32 : 0; this.musicGain.connect(this.master);
    this.sfxGain = ctx.createGain(); this.sfxGain.gain.value = this.sfxOn ? 0.8 : 0; this.sfxGain.connect(this.master);
    // ruído
    const len = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // motor
    this.engOsc = ctx.createOscillator(); this.engOsc.type = 'sawtooth';
    this.engOsc2 = ctx.createOscillator(); this.engOsc2.type = 'square';
    this.engFilter = ctx.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 600;
    this.engGain = ctx.createGain(); this.engGain.gain.value = 0;
    this.engOsc.connect(this.engFilter); this.engOsc2.connect(this.engFilter);
    this.engFilter.connect(this.engGain); this.engGain.connect(this.sfxGain);
    this.engOsc.start(); this.engOsc2.start();
    setInterval(() => this.schedule(), 25);
  }
  setMusic(on) { this.musicOn = on; if (this.musicGain) this.musicGain.gain.value = on ? 0.32 : 0; }
  setSfx(on) { this.sfxOn = on; if (this.sfxGain) this.sfxGain.gain.value = on ? 0.8 : 0; }

  play(name) {
    if (!this.ctx) return;
    if (this.songName === name && !SONGS[name].once) return;
    this.songName = name; this.song = SONGS[name]; this.step = 0; this.nextTime = this.ctx.currentTime + 0.05;
  }
  stopMusic() { this.song = null; this.songName = null; }

  schedule() {
    if (!this.ctx || !this.song) return;
    const s = this.song, dt = 60 / s.bpm / 2; // colcheias
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      const st = this.step;
      if (s.once && st >= s.lead.length) { this.song = null; this.songName = null; return; }
      const n = s.lead[st % s.lead.length];
      if (n) this.tone(NOTE(n), this.nextTime, dt * 0.9, 'square', 0.16, this.musicGain);
      if (st % 2 === 0) {
        const b = s.bass[(st / 2) % s.bass.length];
        if (b) this.tone(NOTE(b), this.nextTime, dt * 1.8, 'triangle', 0.38, this.musicGain);
      }
      const dr = s.drum[st % s.drum.length];
      if (dr === 1) this.kick(this.nextTime);
      if (dr === 2) this.noise(this.nextTime, 0.05, 6000, 0.12, this.musicGain);
      this.step++; this.nextTime += dt;
    }
  }

  tone(freq, t, dur, type = 'square', vol = 0.2, dest = this.sfxGain, slideTo = null) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(t, dur, freq = 2000, vol = 0.3, dest = this.sfxGain, type = 'highpass') {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  kick(t) { this.tone(150, t, 0.12, 'sine', 0.6, this.musicGain, 40); }

  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'beep': this.tone(440, t, 0.25, 'square', 0.25); break;
      case 'go': this.tone(880, t, 0.6, 'square', 0.28); break;
      case 'select': this.tone(660, t, 0.06, 'square', 0.18); this.tone(990, t + 0.06, 0.08, 'square', 0.18); break;
      case 'back': this.tone(500, t, 0.08, 'square', 0.15, this.sfxGain, 300); break;
      case 'box': for (let i = 0; i < 4; i++) this.tone(600 + i * 200, t + i * 0.04, 0.06, 'square', 0.15); break;
      case 'roll': this.tone(900 + Math.random() * 400, t, 0.03, 'square', 0.08); break;
      case 'got': this.tone(1046, t, 0.1, 'square', 0.2); this.tone(1568, t + 0.08, 0.2, 'square', 0.2); break;
      case 'boost': this.noise(t, 0.6, 800, 0.4, this.sfxGain, 'bandpass'); this.tone(200, t, 0.5, 'sawtooth', 0.15, this.sfxGain, 900); break;
      case 'turbo': this.noise(t, 0.9, 500, 0.5, this.sfxGain, 'bandpass'); this.tone(150, t, 0.8, 'sawtooth', 0.2, this.sfxGain, 1200); break;
      case 'mini': this.tone(500, t, 0.25, 'sawtooth', 0.15, this.sfxGain, 1000); break;
      case 'throw': this.tone(700, t, 0.2, 'triangle', 0.25, this.sfxGain, 250); break;
      case 'hit': this.noise(t, 0.35, 300, 0.6, this.sfxGain, 'lowpass'); this.tone(220, t, 0.4, 'square', 0.2, this.sfxGain, 60); break;
      case 'bump': this.noise(t, 0.15, 400, 0.4, this.sfxGain, 'lowpass'); break;
      case 'cone': this.tone(300, t, 0.1, 'triangle', 0.25, this.sfxGain, 600); break;
      case 'shield': for (let i = 0; i < 5; i++) this.tone(500 + i * 150, t + i * 0.05, 0.12, 'triangle', 0.18); break;
      case 'block': this.tone(1200, t, 0.15, 'triangle', 0.25, this.sfxGain, 2400); break;
      case 'prova': this.tone(300, t, 0.15, 'square', 0.2); this.tone(250, t + 0.15, 0.15, 'square', 0.2); this.tone(200, t + 0.3, 0.4, 'square', 0.2, this.sfxGain, 100); break;
      case 'drop': this.tone(400, t, 0.15, 'triangle', 0.2, this.sfxGain, 200); break;
      case 'jump': this.tone(300, t, 0.3, 'square', 0.15, this.sfxGain, 700); break;
      case 'land': this.noise(t, 0.12, 300, 0.3, this.sfxGain, 'lowpass'); break;
      case 'lap': this.tone(784, t, 0.12, 'square', 0.2); this.tone(1046, t + 0.12, 0.25, 'square', 0.2); break;
      case 'final': [784, 784, 1046, 1318].forEach((f, i) => this.tone(f, t + i * 0.12, 0.15, 'square', 0.22)); break;
      case 'wall': this.tone(1100, t, 0.5, 'square', 0.12, this.sfxGain, 500); this.noise(t, 0.4, 200, 0.4, this.sfxGain, 'lowpass'); break;
    }
  }

  engine(speedNorm, throttle, active) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const f = 55 + speedNorm * 150 + throttle * 15;
    this.engOsc.frequency.setTargetAtTime(f, t, 0.05);
    this.engOsc2.frequency.setTargetAtTime(f * 0.501, t, 0.05);
    this.engFilter.frequency.setTargetAtTime(400 + speedNorm * 1600 + throttle * 300, t, 0.05);
    this.engGain.gain.setTargetAtTime(active ? 0.1 + throttle * 0.06 : 0, t, 0.08);
  }
}

export const audio = new Audio();
