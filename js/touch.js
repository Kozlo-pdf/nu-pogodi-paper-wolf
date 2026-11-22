/* On-screen touch controls: D-pad (left side) + action buttons (right side). Shown on touch devices only. */
import { touch } from './input.js';

const isTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window || new URLSearchParams(location.search).has('touch');
if (isTouch) {
  const css = document.createElement('style');
  css.textContent = `
  #touch { position: fixed; inset: 0; z-index: 30; pointer-events: none; user-select: none; -webkit-user-select: none; touch-action: none; font-family: "Bangers", sans-serif; }
  #touch .pad { position: absolute; left: max(14px, env(safe-area-inset-left)); bottom: max(14px, env(safe-area-inset-bottom)); width: 168px; height: 168px; pointer-events: auto; touch-action: none; }
  #touch .pad i { position: absolute; width: 56px; height: 56px; border-radius: 14px; background: rgba(255,246,227,.55); border: 3px solid rgba(58,36,24,.7); }
  #touch .pad i.on, #touch .b.on { background: rgba(255,210,63,.9); transform: scale(.94); }
  #touch .pad .l { left: 0; top: 56px; } #touch .pad .r { right: 0; top: 56px; } #touch .pad .u { left: 56px; top: 0; } #touch .pad .d { left: 56px; bottom: 0; }
  #touch .btns { position: absolute; right: max(14px, env(safe-area-inset-right)); bottom: max(14px, env(safe-area-inset-bottom)); width: 210px; height: 168px; }
  #touch .b { position: absolute; width: 76px; height: 76px; border-radius: 50%; background: rgba(255,246,227,.55); border: 3px solid rgba(58,36,24,.7); color: #3a2418; font-size: 30px; display: flex; align-items: center; justify-content: center; flex-direction: column; pointer-events: auto; touch-action: none; line-height: 1; }
  #touch .b small { font-size: 12px; display: block; text-align: center; margin-top: 2px; }
  #touch .b.a { right: 0; bottom: 0; } #touch .b.x { right: 84px; bottom: 28px; } #touch .b.c { right: 14px; bottom: 90px; width: 64px; height: 64px; }
  #touch .sm { position: absolute; top: max(10px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); display: flex; gap: 10px; }
  #touch .sm .b { position: static; width: 54px; height: 34px; border-radius: 12px; font-size: 16px; }
  @media (max-height: 420px) { #touch .pad { transform: scale(.8); transform-origin: left bottom; } #touch .btns { transform: scale(.8); transform-origin: right bottom; } }`;
  document.head.appendChild(css);

  const root = document.createElement('div'); root.id = 'touch';
  root.innerHTML = `<div class="pad"><i class="u"></i><i class="l"></i><i class="r"></i><i class="d"></i></div>
  <div class="sm"><div class="b" data-a="menu,pause">MENU</div></div>
  <div class="btns"><div class="b a" data-a="jump,confirm,act">A<small>jump</small></div><div class="b x" data-a="hammer,back,guard">B<small>smash</small></div><div class="b c" data-a="partner">C<small>pal</small></div></div>`;
  document.body.appendChild(root);

  // buttons (multi-touch safe via pointer capture)
  for (const el of root.querySelectorAll('.b')) {
    const acts = el.dataset.a.split(',');
    const set = (v) => { acts.forEach((a) => touch.set(a, v)); el.classList.toggle('on', v); };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); set(true); });
    for (const t of ['pointerup', 'pointercancel']) el.addEventListener(t, () => set(false));
  }
  // D-pad: one touch point decides direction, so sliding works
  const pad = root.querySelector('.pad'); const keys = { l: ['left'], r: ['right'], u: ['up', 'talk'], d: ['down'] }; let cur = {};
  const apply = (want) => { for (const k of Object.keys(keys)) { const v = !!want[k]; if (!!cur[k] !== v) { keys[k].forEach((a) => touch.set(a, v)); pad.querySelector('.' + k).classList.toggle('on', v); } } cur = { ...want }; };
  const calc = (e) => { const r = pad.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; const w = {}; if (Math.hypot(x, y) < 0.12) return w; if (x < -0.17) w.l = 1; if (x > 0.17) w.r = 1; if (y < -0.17) w.u = 1; if (y > 0.17) w.d = 1; return w; };
  pad.addEventListener('pointerdown', (e) => { e.preventDefault(); pad.setPointerCapture(e.pointerId); apply(calc(e)); });
  pad.addEventListener('pointermove', (e) => { if (pad.hasPointerCapture(e.pointerId)) apply(calc(e)); });
  for (const t of ['pointerup', 'pointercancel']) pad.addEventListener(t, () => apply({}));
  // keep the page from scrolling/zooming
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  // auto-fullscreen on first tap where supported (hides browser bars on phones)
  addEventListener('pointerdown', () => { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen && !matchMedia('(display-mode: fullscreen)').matches) d.requestFullscreen().catch(() => {}); }, { once: true });
}
