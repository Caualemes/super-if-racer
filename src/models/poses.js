// Poses e animações dos personagens (em pé, comemoração e pilotando)
// Convenções: braço pendurado em -Y; rotation.x negativo = para frente;
// rotation.z positivo abre o braço esquerdo (+X), negativo abre o direito.

function reset(J) {
  for (const k in J) if (J[k].rotation) J[k].rotation.set(0, 0, 0);
  J.torso.scale.set(1, 1, 1);
  J.torso.position.y = 0.06;
  J.thumbL.rotation.set(-Math.PI / 2, 0, 0); J.thumbR.rotation.set(-Math.PI / 2, 0, 0);
  J.thumbL.scale.setScalar(1); J.thumbR.scale.setScalar(1);
}

export function poseStand(char, t, style = 'idle') {
  const J = char.userData.joints;
  reset(J);
  J.hips.position.set(0, 0.74, 0);
  const br = Math.sin(t * 2.2);
  J.torso.scale.y = 1 + br * 0.02;
  J.head.rotation.y = Math.sin(t * 0.7) * 0.2;
  J.head.rotation.z = Math.sin(t * 1.1) * 0.04;
  J.armL.rotation.z = 0.1 + br * 0.02; J.armR.rotation.z = -0.1 - br * 0.02;
  J.elbowL.rotation.x = -0.15; J.elbowR.rotation.x = -0.15;
  J.legL.rotation.z = 0.03; J.legR.rotation.z = -0.03;

  switch (style) {
    case 'wave': // Cauã acena
      J.armR.rotation.set(-0.2, 0, -2.45);
      J.elbowR.rotation.set(0, 0, -0.35 + Math.sin(t * 7) * 0.45);
      J.armL.rotation.set(0.15, 0, 0.45); J.elbowL.rotation.set(0, 0, -1.3); // mão na cintura
      J.hips.rotation.y = 0.12; J.head.rotation.z = -0.08;
      break;
    case 'hips': // mãos na cintura, postura confiante
      J.armL.rotation.set(0.15, 0, 0.5); J.elbowL.rotation.set(0, 0, -1.45);
      J.armR.rotation.set(0.15, 0, -0.5); J.elbowR.rotation.set(0, 0, 1.45);
      J.legL.rotation.z = 0.1; J.legR.rotation.z = -0.1;
      J.head.rotation.x = -0.05;
      break;
    case 'cross': // Renato cruza os braços
      J.armL.rotation.set(-0.5, -0.55, 0.3); J.elbowL.rotation.set(-1.55, 0, 0);
      J.armR.rotation.set(-0.42, 0.55, -0.3); J.elbowR.rotation.set(-1.65, 0, 0);
      J.head.rotation.x = -0.06 + Math.sin(t * 0.9) * 0.03;
      J.legL.rotation.z = 0.1; J.legR.rotation.z = -0.1;
      break;
    case 'thumbs': // joinha
      J.armR.rotation.set(-0.15, 0, -0.18); J.elbowR.rotation.set(-1.45, 0, 0);
      J.thumbR.scale.setScalar(1.5);
      J.handR.rotation.y = 0.3;
      J.armL.rotation.z = 0.12;
      J.head.rotation.z = 0.1; J.head.rotation.y = -0.15;
      break;
    case 'victory': { // punho para o alto
      const k = Math.sin(t * 6);
      J.armR.rotation.set(0, 0, -2.85 + k * 0.12); J.elbowR.rotation.set(0, 0, -0.2);
      J.armL.rotation.set(0.15, 0, 0.5); J.elbowL.rotation.set(0, 0, -1.4);
      J.head.rotation.x = -0.18; J.head.rotation.y = 0;
      J.hips.position.y = 0.74 + Math.max(0, k) * 0.05;
      break;
    }
    case 'cheer': { // pulando com os dois braços para cima
      const k = Math.abs(Math.sin(t * 6));
      J.armR.rotation.z = -2.7 + Math.sin(t * 10) * 0.25;
      J.armL.rotation.z = 2.7 - Math.sin(t * 10) * 0.25;
      J.elbowL.rotation.x = 0; J.elbowR.rotation.x = 0;
      J.hips.position.y = 0.74 + k * 0.18;
      J.legL.rotation.x = -k * 0.3; J.kneeL.rotation.x = k * 0.6;
      J.legR.rotation.x = -k * 0.3; J.kneeR.rotation.x = k * 0.6;
      J.head.rotation.x = -0.2;
      break;
    }
    case 'clap': {
      J.armL.rotation.set(-1.0, -0.35, 0.2); J.armR.rotation.set(-1.0, 0.35, -0.2);
      const c = Math.sin(t * 12) * 0.22;
      J.elbowL.rotation.set(-0.5, 0, -0.25 - c); J.elbowR.rotation.set(-0.5, 0, 0.25 + c);
      break;
    }
    case 'sad':
      J.head.rotation.x = 0.35; J.head.rotation.y = 0; J.torso.rotation.x = 0.15;
      J.armL.rotation.z = 0.04; J.armR.rotation.z = -0.04;
      break;
  }
}

// rideStyle: 'naked' (postura ereta, Trident) | 'sport' (deitado no tanque, S1000RR)
// accel: 1 acelerando, 0 neutro, -1 freando
export function poseRide(char, lean = 0, accel = 0, t = 0, mode = 'ride') {
  const J = char.userData.joints;
  const sport = char.userData.def.rideStyle === 'sport';
  reset(J);
  J.hips.position.set(0, 0, 0);
  // pernas dobradas até as pedaleiras
  J.legL.rotation.set(-1.15, 0, 0.2); J.legR.rotation.set(-1.15, 0, -0.2);
  J.kneeL.rotation.x = sport ? 1.95 : 1.7; J.kneeR.rotation.x = sport ? 1.95 : 1.7;
  // tronco: inclina mais ao acelerar e volta ao frear
  const baseLean = sport ? 0.85 : 0.42;
  J.torso.rotation.x = baseLean + accel * 0.1;
  J.head.rotation.x = -baseLean * 0.85 - accel * 0.08;
  // braços até o guidão
  const armF = sport ? -0.75 : -1.05;
  J.armL.rotation.set(armF, 0, 0.32); J.armR.rotation.set(armF, 0, -0.32);
  J.elbowL.rotation.x = sport ? -0.75 : -0.5; J.elbowR.rotation.x = sport ? -0.75 : -0.5;
  // curva: o corpo pende para dentro, a cabeça compensa
  J.torso.rotation.z = lean * 0.4;
  J.hips.position.x = -lean * 0.06;
  J.head.rotation.z = -lean * 0.25;
  // joelho de dentro abre para a curva (lean < 0 = curva à esquerda)
  if (lean < 0) J.legL.rotation.z += -lean * 0.35;
  else J.legR.rotation.z -= lean * 0.35;

  if (mode === 'cheer') {
    J.torso.rotation.x = 0.1;
    J.head.rotation.x = -0.15;
    J.armR.rotation.set(0, 0, -2.7 + Math.sin(t * 10) * 0.3);
    J.elbowR.rotation.x = 0;
  } else if (mode === 'spin') {
    J.head.rotation.y = Math.sin(t * 20) * 0.5;
    J.armL.rotation.z = 1.3; J.armR.rotation.z = -1.3;
  } else if (mode === 'dizzy') {
    J.head.rotation.z = Math.sin(t * 6) * 0.35;
  }
}
