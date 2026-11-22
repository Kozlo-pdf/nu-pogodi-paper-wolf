import { inject } from '../../js/input.js';
export default async (pq, q) => {
  const p0 = pq.start(q.get('lv') || 'site1', 12); await pq.run(150); await p0;
  const en = pq.world.enemies.find((e) => e.t === (q.get('e') || 'rivetbot')) || pq.world.enemies[0];
  const p = pq.onEncounter(en, 'player');
  for (let i = 0; i < +(q.get('n') || 500); i++) { if (i < 340 && i % 8 === 0) { inject.press('confirm'); } await pq.run(1); }
  return { mode: pq.mode, modal: !!pq.ui.modal };
};
