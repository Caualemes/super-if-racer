// Definições de pilotos, itens, mensagens
import { buildTrident, buildS1000, buildGenericBike } from './models.js';

export const DRIVERS = {
  caua: {
    id: 'caua', name: 'CAUÃ', short: 'CAUÃ', bikeName: 'TRIUMPH TRIDENT 660', color: '#3b7a2a',
    stats: { vel: 7, acel: 9, ctrl: 9 },
    quote: '"Bora que hoje não tem aula, tem corrida!"',
    pose: 'wave',
    look: {
      skin: 0xc8956a, hair: 'wavyLong', hairColor: 0x141012, thickBrows: true, mustache: true, goatee: true,
      glasses: 'wrap', glassesLens: 0x0a6b28,
      suit: 0x1a1215, suit2: 0x2a2230, pants: 0x3a5a9a, boots: 0xf0ede8, sole: 0xd4d0cc,
      outfit: 'jacket', faceScale: [1, 1.0, 0.98], rideStyle: 'naked',
    },
    altPose: 'hips',
    bike: () => buildTrident(),
  },
  renato: {
    id: 'renato', name: 'PROF. RENATO', short: 'RENATO', bikeName: 'BMW S1000RR', color: '#1d1d22',
    stats: { vel: 10, acel: 7, ctrl: 6 },
    quote: '"Quem chegar depois de mim leva falta."',
    pose: 'cross',
    look: {
      skin: 0xe2b48e, hair: 'grayShort', hairColor: 0xb4b7bb, browColor: 0x8e9194, glasses: 'wrap',
      suit: 0x1a1a1e, suit2: 0x2e2f35, pants: 0x1c2230, boots: 0x111111, serious: true, outfit: 'jacket',
      faceScale: [0.95, 1.06, 0.95], chin: true, wrinkles: true, noseSize: 0.074, rideStyle: 'sport',
    },
    altPose: 'thumbs',
    bike: () => buildS1000(),
  },
  calouro: {
    id: 'calouro', name: 'CALOURO LUCAS', short: 'LUCAS', bikeName: 'MOTO DO TIO', color: '#2a7fff', npc: true,
    stats: { vel: 7, acel: 7, ctrl: 7 },
    look: { skin: 0xd9a27a, hair: 'helmet', helmetColor: 0x2a7fff, suit: 0x2a5fc0, suit2: 0xffffff, boots: 0x222222, gloves: 0xffffff, smile: true },
    bike: () => buildGenericBike(0x2a7fff, 0xffffff),
  },
  veterana: {
    id: 'veterana', name: 'VETERANA BIA', short: 'BIA', bikeName: 'NAKED 300', color: '#c040c0', npc: true,
    stats: { vel: 8, acel: 7, ctrl: 7 },
    look: { skin: 0x8d5a3b, hair: 'helmet', helmetColor: 0xffc21f, suit: 0xa03aa8, suit2: 0xffc21f, boots: 0x222222, gloves: 0x222222, smile: true },
    bike: () => buildGenericBike(0xffc21f, 0xa03aa8),
  },
};

// atributos de física derivados das estrelas
export function physicsFor(stats) {
  return {
    maxSpeed: 31 + stats.vel * 0.9,        // u/s
    accel: 9 + stats.acel * 1.3,
    turn: 1.55 + stats.ctrl * 0.09,         // rad/s
    grip: 5 + stats.ctrl * 0.5,
  };
}

export const ITEMS = {
  cafe: { id: 'cafe', name: 'CAFÉ', icon: '☕', desc: '+velocidade' },
  coxinha: { id: 'coxinha', name: 'COXINHA', icon: '🥟', desc: 'projétil' },
  prova: { id: 'prova', name: 'PROVA SURPRESA', icon: '📄', desc: 'lentidão no líder' },
  turbo: { id: 'turbo', name: 'TURBO IFSP', icon: '🟢', desc: 'aceleração instantânea' },
  boletos: { id: 'boletos', name: 'CHUVA DE BOLETOS', icon: '🧾', desc: 'obstáculos' },
  trabalho: { id: 'trabalho', name: 'TRABALHO EM GRUPO', icon: '🧱', desc: 'parede à frente do rival' },
  nota: { id: 'nota', name: 'RECUPERAÇÃO DE NOTA', icon: '⚡', desc: 'escudo' },
};

// probabilidade por posição (quem está atrás ganha itens melhores)
export function rollItem(pos, total) {
  const back = total > 1 ? (pos - 1) / (total - 1) : 0; // 0 = líder, 1 = último
  const table = [
    ['cafe', 3 + back * 2], ['coxinha', 4], ['prova', 0.5 + back * 3], ['turbo', 1 + back * 4],
    ['boletos', 3.5 - back * 2], ['trabalho', 1 + back * 2], ['nota', 3 - back],
  ];
  let sum = table.reduce((a, b) => a + b[1], 0), r = Math.random() * sum;
  for (const [id, w] of table) { r -= w; if (r <= 0) return id; }
  return 'cafe';
}

export const MESSAGES = {
  caua: {
    win: ['Cauã passou direto! Nem precisou de recuperação.', 'Aprovado com nota 10 e sem pegar DP!', 'O bigode cortou o vento!'],
    lose: ['Estudou para a prova, mas esqueceu de acelerar!', 'Ficou de exame... de pilotagem.', 'A Trident queria mais, o piloto que travou!'],
    mid: ['Passou raspando, igual na média final.', 'Nota 6: aprovado, mas sem elogios.'],
  },
  renato: {
    win: ['O professor deu aula... de pilotagem!', 'Quem manda na pista é quem corrige a prova.', 'Chamada feita: todos atrás do professor.'],
    lose: ['Reprovado por falta... de velocidade!', 'Professor, isso vai cair na prova?', 'A S1000RR tem 200 cv, o problema foi a didática.'],
    mid: ['Pódio, mas vai rever o plano de aula.', 'Corrigiu a rota, mas não a tempo.'],
  },
};
