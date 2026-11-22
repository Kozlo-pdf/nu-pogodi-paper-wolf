import { inject } from '../../js/input.js';
export default async (pq) => {
  const out = {};
  const begin = async (id, x) => { const p = pq.start(id, x); await pq.run(200); await p; pq.world.enemies.forEach((e) => { e.state = 'dead'; pq.world.scene.remove(e.s.root); }); };
  const W = () => pq.world;
  // 1. glide across the 7-wide gap on beach1 (x 30..37)
  await begin('beach1', 25); inject.hold('right'); let steps = 0, crossed = false, jumped = false;
  while (steps < 400) { if (!jumped && W().p.x > 29.4) { inject.hold('jump'); jumped = true; } await pq.run(1); steps++; if (W().p.x > 37.6 && W().p.ground) { crossed = true; break; } if (W().p.y < -5) break; }
  inject.hold('right', false); inject.hold('jump', false); out.glide = { crossed, x: +W().p.x.toFixed(1), y: +W().p.y.toFixed(1) };
  // 2. a plain jump cannot cross it
  await begin('beach1', 25); inject.hold('right'); steps = 0; jumped = false; let plain = false;
  while (steps < 400) { if (!jumped && W().p.x > 29.4) { inject.press('jump'); jumped = true; } await pq.run(1); steps++; if (W().p.x > 37.6 && W().p.ground) { plain = true; break; } if (W().p.y < -5) break; }
  inject.hold('right', false); out.plainJumpCrosses = plain;
  // 3. fastener reveals the dock
  await begin('beach1', 46); const g0 = W().ground.length; inject.press('talk'); await pq.run(5); out.dock = [g0, W().ground.length];
  // 4. roll under the low beams on site1 (x 24..29)
  await begin('site1', 18.5); inject.hold('right'); inject.hold('down'); steps = 0; const tr = [];
  while (steps < 300 && W().p.x < 33) { await pq.run(1); steps++; if (steps % 30 === 0) tr.push(+W().p.x.toFixed(1) + (W().rolling ? 'r' : '')); }
  inject.hold('right', false); inject.hold('down', false); out.roll = { x: +W().p.x.toFixed(1), passed: W().p.x >= 33, tr };
  // 5. walking upright is blocked by the beams
  await begin('site1', 18.5); inject.hold('right'); steps = 0; while (steps < 200) { await pq.run(1); steps++; } inject.hold('right', false); out.uprightX = +W().p.x.toFixed(1);
  return out;
};
