// Ponto único de importação dos modelos (componentes em ./models/)
export { M, blobShadow } from './models/common.js';
export { buildCharacter } from './models/character.js';
export { poseStand, poseRide } from './models/poses.js';
export { buildTrident } from './models/trident.js';
export { buildS1000 } from './models/s1000rr.js';
export { buildGenericBike } from './models/genericBike.js';

export function spinWheels(bike, amount) {
  for (const w of bike.userData.wheels) w.rotation.x += amount;
}
