import { inject } from '../../js/input.js';
export default async (pq) => {
  const p = pq.start('site1', 21); await pq.run(200); await p; pq.world.enemies.forEach((e) => { e.state = 'dead'; pq.world.scene.remove(e.s.root); });
  const st = () => ({ flow: pq.flow, modal: !!pq.ui.modal, mode: pq.mode, locked: pq.world.locked, x: +pq.world.p.x.toFixed(2), vx: +pq.world.p.vx.toFixed(2), ground: pq.world.p.ground, rolling: pq.world.rolling, ph: pq.world.ph });
  const a = st(); inject.hold('right'); await pq.run(30); return { a, b: st(), blocks: pq.world.blocks.filter((b) => Math.abs(b.x - 21) < 4).map((b) => b.x + ':' + b.y) };
};
