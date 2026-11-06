// Definições de pilotos, itens, mensagens
import { buildTrident, buildS1000, buildGenericBike } from './models.js';

export const DRIVERS = {
  caua: {
    id: 'caua', name: 'CAUÃ', short: 'CAUÃ', bikeName: 'TRIUMPH TRIDENT 660', color: '#3b7a2a',
    stats: { vel: 7, acel: 9, ctrl: 9 },
    quote: '"Bora que hoje não tem aula, tem corrida!"',
    pose: 'wave',
    look: {
      skin: 0xc98d62, nose: 0xbf7f55, hair: 'curly', hairColor: 0x15110e, mustache: true, mustacheColor: 0x15110e,
      glasses: true, glassesFrame: 0xc9a24a, suit: 0x55623a, suit2: 0x434e2c, boots: 0x3a2a1a, gloves: 0x2b2b20, smile: true,
      outfit: 'flightsuit',
    },
    bike: () => buildTrident(),
  },
  renato: {
    id: 'renato', name: 'PROF. RENATO', short: 'RENATO', bikeName: 'BMW S1000RR', color: '#1d1d22',
    stats: { vel: 10, acel: 7, ctrl: 6 },
    quote: '"Quem chegar depois de mim leva falta."',
    pose: 'cross',
    look: {
      skin: 0xe0b08a, nose: 0xd49e78, hair: 'short', hairColor: 0xb9bcc0, browColor: 0x8a8d90, glasses: true, glassesFrame: 0x222222,
      suit: 0x1c1c20, suit2: 0x4a4d52, boots: 0x111111, gloves: 0x111111, serious: true, outfit: 'jacket',
    },
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
