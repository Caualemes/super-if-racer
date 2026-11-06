// Teclado + controles de toque
export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = { left: false, right: false, gas: false, brake: false, drift: false, item: false };
    this.pressed = new Set(); // eventos de borda (tecla recém-pressionada)
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || e.code === 'Space') e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const el = document.getElementById('touch');
    if (el) {
      el.querySelectorAll('button').forEach((b) => {
        const k = b.dataset.key;
        const on = (e) => {
          e.preventDefault();
          if (k === 'pause') { this.pressed.add('Escape'); return; }
          if (k === 'item' && !this.touch.item) this.pressed.add('ShiftLeft');
          this.touch[k] = true; b.classList.add('on');
        };
        const off = (e) => { e.preventDefault(); this.touch[k] = false; b.classList.remove('on'); };
        b.addEventListener('pointerdown', on);
        b.addEventListener('pointerup', off);
        b.addEventListener('pointercancel', off);
        b.addEventListener('pointerleave', off);
      });
    }
  }
  has(...codes) { return codes.some((c) => this.keys.has(c)); }
  get gas() { return this.has('KeyW', 'ArrowUp') || this.touch.gas; }
  get brake() { return this.has('KeyS', 'ArrowDown') || this.touch.brake; }
  get left() { return this.has('KeyA', 'ArrowLeft') || this.touch.left; }
  get right() { return this.has('KeyD', 'ArrowRight') || this.touch.right; }
  get drift() { return this.has('Space') || this.touch.drift; }
  consume(...codes) {
    for (const c of codes) if (this.pressed.has(c)) { this.pressed.delete(c); return true; }
    return false;
  }
  endFrame() { this.pressed.clear(); }
}
