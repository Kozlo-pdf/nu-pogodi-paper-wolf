import { isDown, wasHit } from '../../js/input.js';
export default async (pq) => {
  const p = pq.start('beach1', 12); await pq.run(150); await p;
  const out = { present: !!document.getElementById('touch') };
  const ev = (el, t, x, y) => el.dispatchEvent(new PointerEvent(t, { pointerId: 1, clientX: x, clientY: y, bubbles: true }));
  const a = document.querySelector('.b.a'); a.setPointerCapture = () => {}; ev(a, 'pointerdown', 0, 0); out.jump = isDown('jump') && isDown('confirm'); ev(a, 'pointerup', 0, 0); out.jumpReleased = !isDown('jump');
  const pad = document.querySelector('.pad'); pad.setPointerCapture = () => {}; const r = pad.getBoundingClientRect();
  ev(pad, 'pointerdown', r.right - 5, r.top + r.height / 2); out.right = isDown('right'); const x0 = pq.world.p.x; await pq.run(40); out.moved = pq.world.p.x > x0 + 1; ev(pad, 'pointerup', 0, 0); out.rightReleased = !isDown('right');
  return out;
};
