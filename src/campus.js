// Cenário: campus IFSP Birigui estilizado em low-poly
import * as THREE from 'three';
import { Tex, textTexture, ifLogoTexture, rng } from './textures.js';
import { WALL_DIST } from './track.js';

const lam = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

export const VARIANTS = [
  { name: 'MANHÃ', skyTop: 0x2f7fff, skyBot: 0xbfe6ff, fog: 0xbfe6ff, hemiSky: 0xdff1ff, hemiGround: 0x5a8a3a, hemiI: 1.15, sun: 0xfff4dc, sunI: 1.9, sunPos: [180, 260, 120], night: false },
  { name: 'TARDE', skyTop: 0x3b4fb8, skyBot: 0xff9a4a, fog: 0xf7a868, hemiSky: 0xffd2a8, hemiGround: 0x6a5a2a, hemiI: 1.0, sun: 0xffb070, sunI: 1.8, sunPos: [-300, 120, -60], night: false },
  { name: 'NOITE', skyTop: 0x050a26, skyBot: 0x1a2a6a, fog: 0x14204e, hemiSky: 0x6f86d8, hemiGround: 0x1a2a3a, hemiI: 1.0, sun: 0xa8c0ff, sunI: 0.75, sunPos: [120, 220, -200], night: true },
];

export class Campus {
  constructor(scene, track) {
    this.scene = scene;
    this.track = track;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.colliders = [];
    this.cones = [];
    this.wallMats = [];
    this.lampMats = [];
    this.rects = []; // áreas ocupadas (sem árvores)
    this.r = rng(42);

    this.buildLights();
    this.buildSky();
    this.buildGround();
    this.group.add(track.buildMesh());
    this.buildMainBuilding();
    this.buildBlocks();
    this.buildLabs();
    this.buildSolar();
    this.buildParking();
    this.buildGateAndTower();
    this.buildSigns();
    this.buildLamps();
    this.buildFeatures();
    this.buildCones();
    this.buildTrees();
    this.buildFarAway();
  }

  // ---------------- luz / céu ----------------
  buildLights() {
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x447733, 1.1);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.8);
    this.scene.add(this.hemi, this.sun);
  }

  buildSky() {
    const geo = new THREE.SphereGeometry(1400, 16, 10);
    const colors = new Float32Array(geo.attributes.position.count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.skyGeo = geo;
    this.sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);
    // nuvens
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, emissive: 0x666666, fog: false });
    this.cloudMat = cloudMat;
    const ico = new THREE.IcosahedronGeometry(1, 0);
    this.clouds = new THREE.Group();
    for (let i = 0; i < 22; i++) {
      const c = new THREE.Group();
      const n = 3 + ((this.r() * 3) | 0);
      for (let k = 0; k < n; k++) {
        const m = new THREE.Mesh(ico, cloudMat);
        const s = 14 + this.r() * 14;
        m.scale.set(s * 1.3, s * 0.7, s);
        m.position.set(k * 18 - n * 9, this.r() * 6, this.r() * 10);
        c.add(m);
      }
      const a = this.r() * Math.PI * 2, d = 500 + this.r() * 450;
      c.position.set(Math.cos(a) * d, 160 + this.r() * 140, Math.sin(a) * d);
      c.rotation.y = this.r() * 3;
      this.clouds.add(c);
    }
    this.scene.add(this.clouds);
    // estrelas (noite)
    const sg = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 500; i++) {
      const a = this.r() * Math.PI * 2, e = 0.15 + this.r() * 1.3;
      sp.push(Math.cos(a) * Math.cos(e) * 1300, Math.sin(e) * 1300, Math.sin(a) * Math.cos(e) * 1300);
    }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, fog: false }));
    this.scene.add(this.stars);
  }

  setVariant(i) {
    const v = VARIANTS[i];
    this.variant = v;
    const top = new THREE.Color(v.skyTop), bot = new THREE.Color(v.skyBot);
    const pos = this.skyGeo.attributes.position, col = this.skyGeo.attributes.color;
    const c = new THREE.Color();
    for (let k = 0; k < pos.count; k++) {
      const t = THREE.MathUtils.clamp(pos.getY(k) / 900, 0, 1);
      c.copy(bot).lerp(top, Math.pow(t, 0.6));
      col.setXYZ(k, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    this.scene.fog = new THREE.Fog(v.fog, 220, 1100);
    this.scene.background = new THREE.Color(v.fog);
    this.hemi.color.set(v.hemiSky); this.hemi.groundColor.set(v.hemiGround); this.hemi.intensity = v.hemiI;
    this.sun.color.set(v.sun); this.sun.intensity = v.sunI; this.sun.position.set(...v.sunPos);
    this.stars.visible = v.night;
    this.cloudMat.emissive.set(v.night ? 0x111a33 : (i === 1 ? 0x884422 : 0x666666));
    this.cloudMat.color.set(v.night ? 0x334466 : 0xffffff);
    for (const m of this.wallMats) { m.emissive.set(v.night ? 0x554422 : 0x000000); m.emissiveMap = v.night ? m.map : null; m.needsUpdate = true; }
    for (const m of this.lampMats) m.emissive.set(v.night ? 0xfff2a0 : 0x222222);
    if (this.lampGlow) this.lampGlow.visible = v.night;
  }

  // ---------------- chão ----------------
  buildGround() {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ map: Tex.grass() }));
    g.rotation.x = -Math.PI / 2;
    g.material.map.repeat.set(220, 220);
    this.group.add(g);
  }

  flat(w, d, x, z, mat, y = 0.015, rot = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot;
    m.position.set(x, y, z);
    this.group.add(m);
    return m;
  }

  box(w, h, d, mat, x, y, z, parent = this.group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  // prédio genérico com janelas
  building(x, z, w, d, h, variant = 0, { roofColor = 0xb8bcc2, rotY = 0, trim = 0x1fa83a } = {}) {
    const g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = rotY;
    const floors = Math.max(1, Math.round(h / 4));
    const tW = Tex.wall(variant).clone(); tW.needsUpdate = true; tW.repeat.set(Math.max(1, Math.round(w / 14)), floors / 2);
    const tD = Tex.wall(variant).clone(); tD.needsUpdate = true; tD.repeat.set(Math.max(1, Math.round(d / 14)), floors / 2);
    const mW = new THREE.MeshLambertMaterial({ map: tW });
    const mD = new THREE.MeshLambertMaterial({ map: tD });
    this.wallMats.push(mW, mD);
    const roof = lam(roofColor);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [mD, mD, roof, roof, mW, mW]);
    body.position.y = h / 2;
    g.add(body);
    // platibanda
    this.box(w + 0.8, 0.8, d + 0.8, lam(trim), 0, h + 0.2, 0, g);
    this.box(w - 0.6, 0.5, d - 0.6, roof, 0, h + 0.4, 0, g);
    this.group.add(g);
    this.rects.push([x, z, (rotY ? d : w) / 2 + 4, (rotY ? w : d) / 2 + 4]);
    return g;
  }

  buildMainBuilding() {
    // Prédio principal (entrada / administração), fachada voltada para o estacionamento (sul)
    const g = this.building(0, 6, 86, 26, 8.5, 0, { roofColor: 0xd9d9d9 });
    // telhado central em duas águas
    const prism = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 46, 3, 1), lam(0xe0e0e0));
    prism.rotation.z = Math.PI / 2; prism.rotation.x = Math.PI / 2 * 0 + Math.PI / 6 * 0;
    prism.rotation.set(0, 0, Math.PI / 2);
    prism.scale.set(1, 1, 0.55);
    prism.position.set(0, 9.4 + 2, 6);
    prism.rotation.x = Math.PI; // aresta para cima
    this.group.add(prism);
    // bloco de entrada saliente
    const entr = this.box(26, 10, 6, lam(0xf4f4f0), 0, 5, 21);
    this.box(28, 0.8, 7, lam(0x1fa83a), 0, 10.2, 21);
    // marquise
    this.box(30, 0.6, 9, lam(0xffffff), 0, 4.2, 27);
    for (const px of [-13, -5, 5, 13]) this.box(0.6, 4.2, 0.6, lam(0x888888), px, 2.1, 31);
    // portas de vidro
    this.box(10, 3.6, 0.3, lam(0x2f5b8a, { emissive: 0x0a1a2a }), 0, 1.8, 24.1);
    // letreiro INSTITUTO FEDERAL
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(22, 3.2), new THREE.MeshBasicMaterial({ map: textTexture([
      { text: 'INSTITUTO FEDERAL', font: 'bold 40px Arial Black, sans-serif', color: '#1a1a1a' },
    ], { w: 512, h: 72, bg: '#f4f4f0' }) }));
    sign.position.set(0, 7.6, 24.1);
    this.group.add(sign);
    const sub = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.4), new THREE.MeshBasicMaterial({ map: textTexture('São Paulo • Campus Birigui', { w: 512, h: 52, bg: '#f4f4f0', fg: '#1fa83a', font: 'bold 34px Arial, sans-serif' }) }));
    sub.position.set(0, 5.7, 24.12);
    this.group.add(sub);
    // logo IF na fachada
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: ifLogoTexture(false) }));
    logo.position.set(-10.5, 7.2, 24.13);
    this.group.add(logo);
    // calçada ao redor
    this.flat(100, 46, 0, 10, new THREE.MeshLambertMaterial({ map: (() => { const t = Tex.sidewalk().clone(); t.needsUpdate = true; t.repeat.set(30, 14); return t; })() }), 0.012);
  }

  buildBlocks() {
    // Blocos de salas de aula (leste)
    const zs = [32, 7, -18, -43];
    zs.forEach((z, i) => {
      this.building(97, z, 52, 12, 7.5, i % 2 ? 2 : 0, { trim: i % 2 ? 0x2e7d4f : 0x1fa83a });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.2), new THREE.MeshBasicMaterial({ map: textTexture('BLOCO ' + 'ABCD'[i], { w: 256, h: 80, bg: '#1fa83a', fg: '#fff', font: 'bold 44px Arial Black, sans-serif' }) }));
      s.position.set(124, 5.5, z); s.rotation.y = Math.PI / 2;
      this.group.add(s);
    });
    // passarelas cobertas
    const cover = lam(0x2e7d4f), post = lam(0xaaaaaa);
    for (const z of [19.5, -5.5, -30.5]) {
      this.box(3, 0.4, 13, cover, 97, 3.4, z);
      for (const dz of [-5, 5]) for (const dx of [-1.2, 1.2]) this.box(0.25, 3.4, 0.25, post, 97 + dx, 1.7, z + dz);
    }
    // passarela até o prédio principal
    this.box(28, 0.4, 3, cover, 57, 3.4, 7);
    for (let x = 45; x <= 69; x += 6) this.box(0.25, 3.4, 0.25, post, x, 1.7, 8.2);
    // cantina / biblioteca
    this.building(36, -40, 22, 16, 6, 1, { trim: 0xc0392b, roofColor: 0xc76b3a });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(10, 2), new THREE.MeshBasicMaterial({ map: textTexture('BIBLIOTECA', { w: 256, h: 60, bg: '#c0392b', fg: '#fff', font: 'bold 34px Arial Black, sans-serif' }) }));
    s.position.set(36, 4.2, -31.9);
    this.group.add(s);
  }

  buildLabs() {
    // Laboratórios: prédios compridos com telhado em shed
    const labs = [[-55, -74, 70, 14], [-50, -45, 58, 12]];
    labs.forEach(([x, z, w, d], i) => {
      const g = this.building(x, z, w, d, 6.5, 1, { trim: 0x2f6fb0, roofColor: 0x9aa3ad });
      const shedMat = lam(0xc8ccd2);
      for (let k = -w / 2 + 4; k < w / 2 - 2; k += 6) {
        const shed = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, d - 1, 3, 1), shedMat);
        shed.rotation.x = Math.PI / 2; shed.rotation.z = Math.PI / 2 * 0;
        shed.rotation.set(Math.PI / 2, 0, -Math.PI / 6);
        shed.position.set(k, 7.4, 0);
        g.add(shed);
      }
      const s = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.2), new THREE.MeshBasicMaterial({ map: textTexture(i ? 'LAB. INFORMÁTICA' : 'LABORATÓRIOS', { w: 384, h: 60, bg: '#2f6fb0', fg: '#fff', font: 'bold 30px Arial Black, sans-serif' }) }));
      s.position.set(x, 4.5, z - d / 2 - 0.05); s.rotation.y = Math.PI;
      this.group.add(s);
    });
    // caixa d'água
    const t = new THREE.Group();
    const leg = lam(0x777777);
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) this.box(0.5, 14, 0.5, leg, dx, 7, dz, t);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 6, 8), lam(0x3a8fd8));
    tank.position.y = 17; t.add(tank);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4.3, 2, 8), lam(0x2a6fb0)); cap.position.y = 21; t.add(cap);
    t.position.set(-5, 0, -60);
    this.group.add(t);
  }

  buildSolar() {
    // Usina de painéis solares: dentro (oeste) e fora (leste do circuito)
    const panelGeo = new THREE.BoxGeometry(6, 0.2, 3.2);
    const mats = [lam(0x9aa0a8), lam(0x9aa0a8), new THREE.MeshLambertMaterial({ map: Tex.solar() }), lam(0x444444), lam(0x9aa0a8), lam(0x9aa0a8)];
    const tex = Tex.solar().clone(); tex.needsUpdate = true; tex.repeat.set(3, 2);
    mats[2] = new THREE.MeshLambertMaterial({ map: tex, emissive: 0x081030 });
    const areas = [[-110, -70, -28, 42], [190, 236, -70, 50]];
    const list = [];
    for (const [x0, x1, z0, z1] of areas) {
      for (let x = x0; x <= x1; x += 7) for (let z = z0; z <= z1; z += 5) list.push([x, z]);
      this.rects.push([(x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2 + 4, (z1 - z0) / 2 + 4]);
      this.flat(x1 - x0 + 8, z1 - z0 + 8, (x0 + x1) / 2, (z0 + z1) / 2, lam(0xa59a7a), 0.01);
    }
    const inst = new THREE.InstancedMesh(panelGeo, mats, list.length);
    const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 1.4, 0.3), lam(0x666666), list.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(-0.4, 0, 0);
    q.setFromEuler(e);
    list.forEach(([x, z], i) => {
      m.compose(new THREE.Vector3(x, 1.6, z), q, new THREE.Vector3(1, 1, 1));
      inst.setMatrixAt(i, m);
      m.makeTranslation(x, 0.7, z);
      legs.setMatrixAt(i, m);
    });
    this.group.add(inst, legs);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.4), new THREE.MeshBasicMaterial({ map: textTexture('☀ USINA SOLAR IFSP', { w: 384, h: 64, bg: '#ffd21f', fg: '#111', font: 'bold 32px Arial Black, sans-serif' }) }));
    s.position.set(-90, 3.2, 47); this.group.add(s);
    this.box(0.4, 2, 0.4, lam(0x666666), -95, 1, 47); this.box(0.4, 2, 0.4, lam(0x666666), -85, 1, 47);
  }

  buildParking() {
    const t = Tex.parking().clone(); t.needsUpdate = true; t.repeat.set(7, 2);
    this.flat(112, 40, 0, 53, new THREE.MeshLambertMaterial({ map: t }), 0.014);
    this.rects.push([0, 53, 60, 24]);
    // carros estacionados
    const colors = [0xd23b3b, 0xf2f2f2, 0x2a5bd8, 0x222222, 0xc9c9c9, 0xffc21f, 0x3b9a4a];
    const carGeo = new THREE.BoxGeometry(2.2, 1.1, 4.2), cabGeo = new THREE.BoxGeometry(1.9, 0.9, 2.2);
    const glass = lam(0x223344);
    for (let k = 0; k < 26; k++) {
      const row = k % 2, slot = (this.r() * 26) | 0;
      const x = -52 + slot * 4 + 2 + (this.r() < 0.5 ? 0 : 0);
      const z = row ? 70 : 37;
      const c = new THREE.Group();
      const mat = lam(colors[(this.r() * colors.length) | 0]);
      const b = new THREE.Mesh(carGeo, mat); b.position.y = 0.75; c.add(b);
      const cab = new THREE.Mesh(cabGeo, glass); cab.position.set(0, 1.7, -0.2); c.add(cab);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.2, 2.0), mat); roof.position.set(0, 2.2, -0.2); c.add(roof);
      c.position.set(x, 0, z + (row ? -3 : 3)); c.rotation.y = row ? 0 : Math.PI;
      this.group.add(c);
    }
    // guarita
    this.building(-48, 84, 6, 5, 3.4, 0, { trim: 0x1fa83a });
  }

  buildGateAndTower() {
    const tr = this.track;
    // Pórtico de entrada sobre a pista
    const pi = tr.project(40, 97).idx;
    const p = tr.pointAt(pi), h = tr.heading(pi);
    const gate = new THREE.Group();
    gate.position.copy(p); gate.rotation.y = h;
    const white = lam(0xf4f4f4), green = lam(0x1fa83a);
    for (const s of [-1, 1]) {
      this.box(1.6, 9, 1.6, white, s * (tr.width / 2 + 2.6), 4.5, 0, gate);
      this.box(2, 0.6, 2, green, s * (tr.width / 2 + 2.6), 9.2, 0, gate);
      const wp = tr.pointAt(pi, s * -(tr.width / 2 + 2.6));
      this.colliders.push({ x: wp.x, z: wp.z, r: 1.4 });
    }
    this.box(tr.width + 8, 2.6, 1, green, 0, 9.3, 0, gate);
    const tex = textTexture([{ text: 'IFSP • CAMPUS BIRIGUI', font: 'bold 44px Arial Black, sans-serif', color: '#ffffff' }], { w: 640, h: 70, bg: '#1fa83a' });
    for (const s of [1, -1]) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(tr.width + 6, 2.2), new THREE.MeshBasicMaterial({ map: tex }));
      sign.position.set(0, 9.3, 0.52 * -s); if (s === 1) sign.rotation.y = Math.PI;
      gate.add(sign);
    }
    this.group.add(gate);

    // Totem / torre IFSP (como na foto aérea)
    const tower = new THREE.Group();
    this.box(3.4, 22, 1.6, white, 0, 11, 0, tower);
    this.box(3.8, 0.6, 2.0, green, 0, 22.2, 0, tower);
    const logo = ifLogoTexture(true);
    for (const s of [1, -1]) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.7), new THREE.MeshBasicMaterial({ map: logo }));
      pl.position.set(0, 17, s * 0.82); if (s < 0) pl.rotation.y = Math.PI;
      tower.add(pl);
    }
    tower.position.set(70, 0, 120);
    tower.rotation.y = 0.2;
    this.group.add(tower);
    this.tower = tower;

    // bandeiras
    const flagCols = [[0x1fa83a, 0xffd21f], [0xffffff, 0xe8262b], [0x1fa83a, 0xffffff]];
    flagCols.forEach(([a, b], i) => {
      const x = -6 + i * 6, z = 34;
      this.box(0.25, 11, 0.25, lam(0xcccccc), x, 5.5, z);
      const f = this.box(3.2, 2, 0.08, lam(a), x + 1.7, 9.6, z);
      this.box(1.0, 0.9, 0.1, lam(b), x + 1.7, 9.6, z);
      f.userData.flag = true;
    });
  }

  buildSigns() {
    const tr = this.track;
    const post = lam(0x777777);
    const signs = [
      [[150, 50], 'BLOCOS DE AULA ⟶', '#1fa83a'],
      [[105, -101], 'CURVA DO BLOCO D', '#e8262b'],
      [[-15, -112], 'LABORATÓRIOS', '#2f6fb0'],
      [[-150, -30], 'PAINÉIS SOLARES ☀', '#d9a400'],
      [[-155, 55], 'ÁREA ESCOLAR: ACELERE!', '#e8262b'],
      [[-60, 98], 'RETA FINAL', '#1fa83a'],
      [[125, 84], 'CANTINA: COXINHA R$ 6', '#c0392b'],
    ];
    for (const [[x, z], text, color] of signs) {
      const pr = tr.project(x, z);
      const side = pr.lateral >= 0 ? 1 : -1;
      const p = tr.pointAt(pr.idx, side * (tr.width / 2 + 6));
      const g = new THREE.Group();
      g.position.copy(p);
      g.rotation.y = tr.heading(pr.idx) + Math.PI; // de frente para quem chega
      this.box(0.3, 4.5, 0.3, post, -3.6, 2.25, 0, g);
      this.box(0.3, 4.5, 0.3, post, 3.6, 2.25, 0, g);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 2.2), new THREE.MeshBasicMaterial({ map: textTexture(text, { w: 384, h: 96, bg: color, fg: '#fff', border: '#fff', font: 'bold 30px Arial Black, sans-serif' }), side: THREE.DoubleSide }));
      pl.position.set(0, 4.2, 0.2);
      g.add(pl);
      g.rotation.y = tr.heading(pr.idx) + Math.PI;
      this.group.add(g);
      this.colliders.push({ x: p.x, z: p.z, r: 0.6 });
    }
  }

  buildLamps() {
    const tr = this.track;
    const poleMat = lam(0x55585e);
    const bulbMat = lam(0xffffff, { emissive: 0x222222 });
    this.lampMats.push(bulbMat);
    const glowPos = [];
    for (let i = 0; i < tr.N; i += 34) {
      const side = (i / 34) % 2 ? 1 : -1;
      const p = tr.pointAt(i, side * (tr.width / 2 + 3.5));
      const g = new THREE.Group();
      g.position.copy(p);
      g.rotation.y = tr.heading(i);
      this.box(0.35, 8, 0.35, poleMat, 0, 4, 0, g);
      this.box(2.6, 0.25, 0.4, poleMat, -side * 1.2, 8, 0, g);
      this.box(1.2, 0.35, 0.7, bulbMat, -side * 2.3, 7.8, 0, g);
      this.group.add(g);
      this.colliders.push({ x: p.x, z: p.z, r: 0.5 });
      const lp = tr.pointAt(i, side * (tr.width / 2 + 3.5 - 2.3));
      glowPos.push(lp.x, 0.08, lp.z);
    }
    // poças de luz no chão (noite)
    const glow = new THREE.InstancedMesh(new THREE.CircleGeometry(5, 10), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.22, depthWrite: false }), glowPos.length / 3);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    for (let k = 0; k < glowPos.length / 3; k++) {
      m.compose(new THREE.Vector3(glowPos[k * 3], 0.08, glowPos[k * 3 + 2]), q, new THREE.Vector3(1, 1, 1));
      glow.setMatrixAt(k, m);
    }
    glow.visible = false;
    this.lampGlow = glow;
    this.group.add(glow);
  }

  // rampas, placas de turbo e caixas de item
  buildFeatures() {
    const tr = this.track;
    const f = tr.features;
    // Rampas
    for (const [x, z] of [[-70, -119], [160, -2]]) {
      const pr = tr.project(x, z);
      f.ramps.push({ idx: pr.idx, len: 6, half: 6.5 });
      const p = tr.pointAt(pr.idx + 3);
      const g = new THREE.Group(); g.position.copy(p); g.rotation.y = tr.heading(pr.idx);
      // cunha
      const shape = new THREE.Shape();
      shape.moveTo(-3.75, 0); shape.lineTo(3.75, 0); shape.lineTo(3.75, 1.6); shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 13, bevelEnabled: false });
      geo.translate(0, 0, -6.5);
      const w = new THREE.Mesh(geo, [new THREE.MeshLambertMaterial({ map: Tex.hazard() }), new THREE.MeshLambertMaterial({ color: 0xffd21f })]);
      w.rotation.y = -Math.PI / 2;
      g.add(w);
      this.group.add(g);
    }
    // Placas de turbo (Turbo IFSP)
    const padTex = Tex.boost();
    for (const [x, z, lat] of [[-152, 18, 0], [-10, 96, -4], [110, -100, 3]]) {
      const pr = tr.project(x, z);
      f.pads.push({ idx: pr.idx, lat, len: 5, half: 3 });
      const p = tr.pointAt(pr.idx + 2.5, lat);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 6), new THREE.MeshBasicMaterial({ map: padTex }));
      pad.rotation.x = -Math.PI / 2;
      const g = new THREE.Group(); g.position.set(p.x, 0.07, p.z); g.rotation.y = tr.heading(pr.idx) + Math.PI; g.add(pad);
      this.group.add(g);
      this.padTex = padTex;
    }
    // Fileiras de caixas de item
    for (const [x, z] of [[78, 97], [156, -40], [-20, -108], [-150, -24], [-128, 92]]) {
      f.itemRows.push(tr.project(x, z).idx);
    }
  }

  buildCones() {
    const tr = this.track;
    const coneGeo = new THREE.ConeGeometry(0.45, 1.1, 6);
    const mat = lam(0xff7a12), stripe = lam(0xffffff);
    const places = [];
    // Cones nas zebras internas das curvas mais fechadas
    for (let i = 0; i < tr.N; i += 9) {
      const c = tr.curv[i];
      if (Math.abs(c) > 0.022) {
        const side = c > 0 ? -1 : 1; // lado interno
        places.push(tr.pointAt(i, side * (tr.width / 2 + 1.6)));
      }
    }
    for (const p of places) {
      const g = new THREE.Group();
      const c = new THREE.Mesh(coneGeo, mat); c.position.y = 0.55; g.add(c);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.2, 6), stripe); s.position.y = 0.6; g.add(s);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), mat); base.position.y = 0.04; g.add(base);
      g.position.copy(p);
      this.group.add(g);
      const cone = { x: p.x, z: p.z, r: 0.55, cone: true, mesh: g, home: p.clone(), vx: 0, vy: 0, vz: 0, knocked: 0 };
      this.cones.push(cone);
    }
    // pneus empilhados na saída das curvas
    const tire = new THREE.TorusGeometry(0.55, 0.25, 4, 8);
    const tm = lam(0x222222), tw = lam(0xe8262b);
    for (let i = 0; i < tr.N; i += 13) {
      const c = tr.curv[i];
      if (Math.abs(c) > 0.018) {
        const side = c > 0 ? 1 : -1; // lado externo
        const p = tr.pointAt(i, side * (tr.width / 2 + 7));
        const g = new THREE.Group();
        for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(tire, k === 1 ? tw : tm); t.rotation.x = Math.PI / 2; t.position.y = 0.25 + k * 0.45; g.add(t); }
        g.position.copy(p); this.group.add(g);
        this.colliders.push({ x: p.x, z: p.z, r: 0.9 });
      }
    }
  }

  occupied(x, z) {
    for (const [cx, cz, hw, hd] of this.rects) if (Math.abs(x - cx) < hw && Math.abs(z - cz) < hd) return true;
    return false;
  }

  buildTrees() {
    const tr = this.track;
    const r = this.r;
    const pts = [];
    let tries = 0;
    while (pts.length < 420 && tries < 6000) {
      tries++;
      const x = (r() - 0.5) * 560, z = (r() - 0.5) * 420;
      if (this.occupied(x, z)) continue;
      const d = tr.distToCenter(x, z);
      if (d < tr.width / 2 + 9) continue;
      if (Math.abs(x - 70) < 6 && Math.abs(z - 120) < 6) continue;
      pts.push([x, z, d]);
    }
    // alameda ao longo da reta principal
    for (let x = -120; x <= 130; x += 14) { pts.push([x, 118, 20]); }
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 3, 5);
    const canGeo = new THREE.IcosahedronGeometry(2.6, 0);
    const trunks = new THREE.InstancedMesh(trunkGeo, lam(0x7a4a22), pts.length);
    const cans = new THREE.InstancedMesh(canGeo, lam(0xffffff), pts.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
    const greens = [0x2f9a2c, 0x3fb33a, 0x27802a, 0x52c043, 0x1f7a33];
    pts.forEach(([x, z, d], i) => {
      const s = 0.8 + r() * 0.8;
      m.compose(new THREE.Vector3(x, 1.5 * s, z), q, new THREE.Vector3(s, s, s));
      trunks.setMatrixAt(i, m);
      q.setFromEuler(new THREE.Euler(0, r() * 3, 0));
      m.compose(new THREE.Vector3(x, 3 * s + 2.2 * s, z), q, new THREE.Vector3(s * 1.15, s * (0.9 + r() * 0.4), s * 1.15));
      cans.setMatrixAt(i, m);
      q.identity();
      const rr = r();
      // ipês floridos de vez em quando
      col.set(rr < 0.05 ? 0xff6fb8 : rr < 0.09 ? 0xffd21f : greens[(r() * greens.length) | 0]);
      cans.setColorAt(i, col);
      if (d < WALL_DIST + 3) this.colliders.push({ x, z, r: 0.9 * s });
    });
    this.group.add(trunks, cans);
  }

  buildFarAway() {
    const r = this.r;
    // canaviais e terra vermelha (interior paulista)
    const cane = new THREE.MeshLambertMaterial({ map: Tex.cane() });
    const dirt = new THREE.MeshLambertMaterial({ map: (() => { const t = Tex.dirt().clone(); t.needsUpdate = true; t.repeat.set(20, 20); return t; })() });
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + r() * 0.2, d = 420 + r() * 220;
      const w = 120 + r() * 120, dd = 90 + r() * 120;
      this.flat(w, dd, Math.cos(a) * d, Math.sin(a) * d, i % 3 === 0 ? dirt : cane, 0.01, r() * 3);
    }
    // morros distantes
    const hillGeo = new THREE.ConeGeometry(1, 1, 7, 1);
    const n = 46;
    const hills = new THREE.InstancedMesh(hillGeo, lam(0xffffff), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, d = 900 + r() * 200;
      const w = 120 + r() * 160, h = 40 + r() * 90;
      m.compose(new THREE.Vector3(Math.cos(a) * d, h / 2 - 2, Math.sin(a) * d), q, new THREE.Vector3(w, h, w * 0.8));
      hills.setMatrixAt(i, m);
      hills.setColorAt(i, col.set([0x3d8a3a, 0x4f9e44, 0x2f7a3a][i % 3]));
    }
    this.group.add(hills);
    // cerca do campus
    const fence = lam(0x2e7d4f);
    const X = 250, Z = 190;
    for (const [x, z, w, d] of [[0, -Z, 2 * X, 0.2], [0, Z, 2 * X, 0.2], [-X, 0, 0.2, 2 * Z], [X, 0, 0.2, 2 * Z]]) {
      this.box(w, 1.8, d, fence, x, 0.9, z);
    }
  }

  update(dt, t) {
    for (const c of this.clouds.children) { c.position.x += dt * 2; if (c.position.x > 1000) c.position.x = -1000; }
    if (this.padTex) this.padTex.offset.y -= dt * 1.5;
    // cones derrubados
    for (const c of this.cones) {
      if (c.knocked > 0) {
        c.knocked -= dt;
        c.vy -= 25 * dt;
        c.mesh.position.x += c.vx * dt; c.mesh.position.y += c.vy * dt; c.mesh.position.z += c.vz * dt;
        c.mesh.rotation.x += dt * 9; c.mesh.rotation.z += dt * 6;
        if (c.mesh.position.y < 0) { c.mesh.position.y = 0; c.vy *= -0.4; c.vx *= 0.7; c.vz *= 0.7; }
        if (c.knocked <= 0) { c.mesh.position.copy(c.home); c.mesh.rotation.set(0, 0, 0); }
      }
    }
  }
}
