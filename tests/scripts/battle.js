export default async (pq, q) => {
  const p0 = pq.start(q.get('lv') || 'park1', 12); await pq.run(150); await p0;
  const en = pq.world.enemies.find((e) => e.t === (q.get('e') || 'hippo')) || pq.world.enemies[0];
  const grp = q.get('g'); if (grp) en.group = grp.split(',');
  const p = pq.onEncounter(en, q.get('first') || 'player');
  await pq.run(+(q.get('n') || 300));
  const b = pq.battle;
  return { mode: pq.mode, battle: !!b, foes: b ? b.foes.map((f) => f.t + ':' + f.hp) : null, hare: pq.S().party.hare.hp, result: b && b.result, applause: b && b.applause };
};
