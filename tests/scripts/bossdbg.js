import { inject } from '../../js/input.js';
export default async (pq, q) => {
  const p0 = pq.start('deskboss', 3); await pq.run(200); await p0;
  const S = pq.S(); S.level = 3; S.items = { soup: 4, tea: 2 };
  const en = pq.world.enemies.find((e) => e.t === 'robothare'); const p = pq.onEncounter(en, 'enemy');
  const log = []; let steps = 0; window.__errs = []; addEventListener('unhandledrejection', (e) => window.__errs.push(String((e.reason && e.reason.stack) || e.reason).slice(0, 400)));
  while (steps < +(q.get('n') || 4000)) { if (steps % 10 === 0) { inject.press('act'); inject.press('confirm'); } await pq.run(1); steps++; if (steps % 400 === 0 && pq.battle) log.push(`${steps}: turn${pq.battle.turn} tasks${pq.battle.tasks.length} modal${!!pq.ui.modal} foes[${pq.battle.foes.map((f) => f.t + ':' + f.hp + (f.alive ? '' : 'x')).join(',')}] lead${pq.S().party.hare.hp} pal${pq.S().party.wolf.hp} res${pq.battle.result}`); }
  const b = pq.battle, t0 = b.t; await pq.run(30);
  const dbg = { trace: b._tr, dt: +(b.t - t0).toFixed(3), upd: pq.stage.updaters.length, hitstop: b.hitstop, foes: b.foes.map((f) => ({ t: f.t, busy: f.busy, alive: f.alive, p2: f.p2, stun: f.stun, scale: f.spr.root.scale.x })), party: Object.values(b.party).map((c) => ({ who: c.who, ko: c.ko, trapped: c.trapped, defending: c.defending })), scene: pq.stage.scene === b.scene };
  return { dbg, errs: window.__errs, err: (document.getElementById('fatal-msg') || {}).textContent, log: log.slice(-2) };
};
