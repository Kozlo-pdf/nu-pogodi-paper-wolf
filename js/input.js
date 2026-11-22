/* Abstract actions over keyboard + gamepad (PS4 DualShock / standard mapping). */
const MAP = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  jump: ['KeyZ', 'Space'], hammer: ['KeyX'], partner: ['KeyC'], menu: ['Enter', 'Tab'], pause: ['Escape'],
  confirm: ['KeyZ', 'Space', 'Enter'], back: ['KeyX', 'Escape', 'Backspace'], act: ['KeyZ', 'Space', 'Enter'], guard: ['KeyX', 'ShiftLeft', 'ShiftRight'],
  talk: ['ArrowUp', 'KeyW', 'KeyE'],
};
let down = {}, hit = {};
const gp = { down: {}, hit: {} };
const PREVENT = new Set(['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace']);

addEventListener('keydown', (e) => {
  if (PREVENT.has(e.code)) e.preventDefault();
  if (!e.repeat) hit[e.code] = true;
  down[e.code] = true;
});
addEventListener('keyup', (e) => { down[e.code] = false; });
addEventListener('blur', () => { down = {}; });

export const isDown = (a) => (MAP[a] || []).some((k) => down[k]) || !!gp.down[a];
export const wasHit = (a) => (MAP[a] || []).some((k) => hit[k]) || !!gp.hit[a];
export const anyHit = () => Object.keys(hit).length > 0 || Object.keys(gp.hit).length > 0;
export function endFrame() { hit = {}; gp.hit = {}; }

// synthetic input for touch / tests
const holds = {};
export const inject = { press(a) { gp.hit[a] = true; gp.down[a] = true; }, release(a) { gp.down[a] = false; }, hold(a, v = true) { holds[a] = v; if (v) gp.hit[a] = true; } };

export function pollPad() {
  const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter((p) => p && p.connected);
  const now = {};
  const set = (acts, v) => { if (v) acts.forEach((a) => { now[a] = true; }); };
  for (const p of pads) {
    const ax = (i) => (Math.abs(p.axes[i] || 0) > 0.4 ? p.axes[i] : 0);
    const b = (i) => !!(p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5));
    set(['left'], ax(0) < 0 || b(14)); set(['right'], ax(0) > 0 || b(15)); set(['up', 'talk'], ax(1) < 0 || b(12)); set(['down'], ax(1) > 0 || b(13));
    set(['jump', 'confirm', 'act'], b(0)); set(['hammer', 'back', 'guard'], b(1)); set(['partner'], b(2)); set(['menu'], b(3)); set(['pause'], b(9));
  }
  for (const k of Object.keys(now)) if (!gp.down[k]) gp.hit[k] = true;
  for (const k of Object.keys(holds)) if (holds[k]) { now[k] = true; if (!gp.down[k]) gp.hit[k] = true; }
  gp.down = { ...now };
}
export const padConnected = () => [...(navigator.getGamepads ? navigator.getGamepads() : [])].some((p) => p && p.connected);
