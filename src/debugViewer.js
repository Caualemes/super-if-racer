// Ferramenta de desenvolvimento: inspeção dos modelos no palco de seleção.
// Só é carregada em `npm run dev`. Uso no console:
//   viewModel(slot, giroY, [dx, alturaCam, dz], [lx, alturaAlvo, lz], fov, ['wave','cross'], t)
import { poseStand } from './models.js';

export function installViewer(game) {
  window.viewModel = (slot = 0, turnY = 0, camOff = [0, 1.4, 5], look = [0, 0.9, 0], fov = 38, poses = ['wave', 'cross'], t = 0.3) => {
    if (game.state !== 'debug') {
      game.gotoScreen('select');
      document.getElementById('scr-select').classList.remove('active');
      game.state = 'debug';
    }
    game.renderer.setSize(innerWidth, innerHeight, false);
    game.stageSlots.forEach((s, i) => { s.turn.rotation.y = 0; s.slot.scale.setScalar(1); s.ring.visible = false; poseStand(s.ch, t, poses[i]); });
    const s = game.stageSlots[slot];
    s.turn.rotation.y = turnY;
    const p = s.slot.getWorldPosition(game.camera.position.clone());
    game.camera.position.set(p.x + camOff[0], camOff[1], p.z + camOff[2]);
    game.camera.fov = fov; game.camera.aspect = innerWidth / innerHeight; game.camera.updateProjectionMatrix();
    game.camera.lookAt(p.x + look[0], look[1], p.z + look[2]);
    game.renderer.render(game.scene, game.camera);
  };
}
