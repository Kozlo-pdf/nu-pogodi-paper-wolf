export default async (pq, q) => {
  const p = pq.start(q.get('lv') || 'park1', q.has('x') ? +q.get('x') : null);
  await pq.run(+(q.get('n') || 200)); await Promise.race([p, Promise.resolve()]);
  return { mode: pq.mode, x: pq.world && +pq.world.p.x.toFixed(2), flow: pq.flow };
};
