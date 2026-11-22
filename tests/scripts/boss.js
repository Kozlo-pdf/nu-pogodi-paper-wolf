import { inject } from '../../js/input.js';
export default async (pq, q) => {
  const id = q.get('b') || 'cat', lv = { cat: 'beachboss', robothare: 'deskboss' }[id];
  const p0 = pq.start(lv, 3); await pq.run(150); await p0;
  const S = pq.S(); S.level = 3; S.items = { soup: 4, tea: 2 };
  const en = pq.world.enemies.find((e) => e.t === id);
  const p = pq.onEncounter(en, 'enemy');
  let steps = 0, done = false, maxFoes = 0; p.then(() => { done = true; });
  while (!done && steps < 20000) { if (steps % 10 === 0) inject.press('act'); inject.press('confirm'); await pq.run(1); steps++; if (pq.battle) maxFoes = Math.max(maxFoes, pq.battle.foes.filter((f) => f.alive).length); }
  return { id, steps, done, mode: pq.mode, lvl: pq.world && pq.world.lvl.id, pages: pq.S().pages, unlocked: pq.S().unlocked, hare: pq.S().party.hare.hp, maxFoes, level: pq.S().level };
};
