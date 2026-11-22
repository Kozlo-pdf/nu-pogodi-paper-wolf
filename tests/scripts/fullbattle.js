import { inject } from '../../js/input.js';
export default async (pq, q) => {
  const p0 = pq.start(q.get('lv') || 'street', 12); await pq.run(150); await p0;
  const en = pq.world.enemies.find((e) => e.t === (q.get('e') || 'hippo')) || pq.world.enemies[0];
  const grp = q.get('g'); if (grp) en.group = grp.split(',');
  const sp0 = pq.S().sp, coins0 = pq.S().coins;
  const p = pq.onEncounter(en, q.get('first') || 'player');
  let steps = 0, done = false; p.then(() => { done = true; });
  while (!done && steps < 6000) { if (steps % 12 === 0) inject.press('act'); inject.press('confirm'); await pq.run(1); steps++; }
  return { steps, done, mode: pq.mode, hare: pq.S().party.hare.hp, wolf: pq.S().party.wolf.hp, sp: pq.S().sp - sp0, coins: pq.S().coins - coins0, level: pq.S().level, enemiesLeft: pq.world.enemies.filter((e) => e.state !== 'dead').length };
};
