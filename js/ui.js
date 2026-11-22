import * as A from './art.js';
import { wasHit, isDown } from './input.js';
import { sfx, duckMusic } from './audio.js';
import { S, carrotCount } from './state.js';

const $ = (id) => document.getElementById(id);

export const SPEAK = {
  hare: { name: 'Hare', pitch: 1.55, draw: (m) => A.drawHare(m) },
  wolf: { name: 'Wolf', pitch: 0.62, draw: (m) => A.drawWolf(m) },
  owl: { name: 'Librarian Owl', pitch: 0.95, draw: () => A.drawOwl() },
  mole: { name: 'Merchant Mole', pitch: 1.3, draw: () => A.drawMole() },
  hippo: { name: 'Hippo Cop', pitch: 0.48, draw: (m) => A.drawHippo(m) },
  sergeant: { name: 'Sergeant Hippo', pitch: 0.4, draw: (m) => A.drawHippo(m, true) },
  bear: { name: 'Ringmaster Bear', pitch: 0.38, draw: (m) => A.drawBear(m) },
  witch: { name: 'Baba Yaga', pitch: 0.85, draw: (m) => A.drawWitch(m) },
  robot: { name: 'Robot Hare', pitch: 1.1, draw: (m) => A.drawRobotHare(m) },
  mega: { name: 'Mega-Robot Hare', pitch: 0.3, draw: (m) => A.drawMegaRobot(m) },
  hedgehog: { name: 'Hedgehog', pitch: 1.4, draw: (m) => A.drawHedgehog(m) },
  lifeguard: { name: 'Lifeguard', pitch: 0.5, draw: (m) => A.drawLifeguard(m) },
  fox: { name: 'Fox', pitch: 1.1, draw: (m) => A.drawFox(m) },
  cat: { name: 'Cat Magician', pitch: 0.8, draw: (m) => A.drawCat(m) },
  eraser: { name: 'The Eraser', pitch: 0.25, draw: () => A.drawEraser() },
  narrator: { name: '', pitch: 0, draw: null },
};

export const ui = { modal: null, banner: null };
const timers = [];
/** frame-driven delay (resolved by uiTick) */
export function after(ms) { return new Promise((r) => timers.push({ t: ms / 1000, r })); }
export function uiTick(dt) {
  for (let i = timers.length - 1; i >= 0; i--) {
    const k = timers[i];
    if (k.tw) { k.t = Math.min(k.d, k.t + dt); k.fn(k.t / k.d); if (k.t >= k.d) { timers.splice(i, 1); k.r(); } }
    else { k.t -= dt; if (k.t <= 0) { timers.splice(i, 1); k.r(); } }
  }
}
export const tween = (d, fn) => tw(d, fn);
const tw = (d, fn) => new Promise((r) => { timers.push({ tw: true, d, t: 0, fn, r }); });
export const busy = () => !!ui.modal;

function portrait(canvas, who, mood = 'normal') {
  const sp = SPEAK[who]; const g = canvas.getContext('2d'); g.clearRect(0, 0, canvas.width, canvas.height);
  if (!sp || !sp.draw) return;
  const src = sp.draw(mood); const sw = src.width, sh = Math.min(src.height, sw * 0.95);
  g.drawImage(src, 0, 0, sw, sh, 4, 4, canvas.width - 8, canvas.height - 8);
}

/* ---------------- dialogue ---------------- */
function mark(t) { return t.replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); }
function plain(t) { return t.replace(/\*/g, ''); }

export function say(lines) {
  if (!Array.isArray(lines)) lines = [lines];
  lines = lines.map((l) => (typeof l === 'string' ? { who: 'narrator', text: l } : l));
  return new Promise((resolve) => {
    const el = $('dialog'); el.classList.remove('hidden'); duckMusic(true);
    let idx = -1, chars = 0, full = '', who = 'narrator', blipT = 0, done = false;
    const next = () => {
      idx++;
      if (idx >= lines.length) { el.classList.add('hidden'); ui.modal = null; duckMusic(false); resolve(); return; }
      const l = lines[idx]; who = l.who || 'narrator'; full = plain(l.text); chars = 0; done = false;
      const sp = SPEAK[who] || SPEAK.narrator; $('d-name').textContent = sp.name; el.classList.toggle('noface', !sp.draw);
      if (sp.draw) portrait($('d-face'), who, l.mood || 'normal');
      $('d-next').style.visibility = 'hidden'; $('d-text').innerHTML = '';
      if (l.sfx && sfx[l.sfx]) sfx[l.sfx]();
    };
    ui.modal = {
      update(dt) {
        const sp = SPEAK[who] || SPEAK.narrator;
        if (!done) {
          chars += dt * (isDown('act') ? 150 : 46);
          const n = Math.min(full.length, Math.floor(chars));
          const shown = full.slice(0, n);
          $('d-text').innerHTML = markPartial(lines[idx].text, n);
          blipT -= dt; if (blipT <= 0 && n < full.length && sp.pitch && shown.slice(-1) !== ' ') { sfx.blip(sp.pitch * (0.92 + Math.random() * 0.16)); blipT = 0.05; }
          if (n >= full.length) { done = true; $('d-next').style.visibility = 'visible'; }
          if (wasHit('act') && !done) { chars = full.length; }
        } else if (wasHit('act') || wasHit('confirm')) { sfx.select(); next(); }
      },
    };
    next();
  });
}
// show first n visible characters of a *marked* string, keeping <em> balanced
function markPartial(raw, n) {
  let out = '', vis = 0, inEm = false;
  for (const ch of raw) {
    if (ch === '*') { inEm = !inEm; out += inEm ? '<em>' : '</em>'; continue; }
    if (vis >= n) break; out += ch === '\n' ? '<br>' : ch; vis++;
  }
  if (inEm && !out.endsWith('</em>')) out += '</em>';
  return out;
}

/* ---------------- menus ---------------- */
export function pick({ title = '', items, cancel = true, pos = 'center', into = null, start = 0, onMove = null, note = '' }) {
  return new Promise((resolve) => {
    let sel = Math.min(start, items.length - 1);
    const root = into || $('menu');
    const wrap = document.createElement('div'); wrap.className = into ? 'wrapin' : 'm card';
    if (!into) { root.className = pos === 'side' ? 'side' : pos === 'bottom' ? 'bottom' : ''; root.classList.remove('hidden'); }
    root.innerHTML = ''; root.appendChild(wrap);
    const render = () => {
      wrap.innerHTML = (title ? `<h3>${title}</h3>` : '') + (note ? `<div class="desc" style="border:0;margin:0 0 8px">${note}</div>` : '') +
        items.map((it, i) => `<div class="mi ${i === sel ? 'sel' : ''} ${it.disabled ? 'dis' : ''}" data-i="${i}"><span>${it.label}</span>${it.right ? `<small>${it.right}</small>` : ''}</div>`).join('') +
        (items.some((it) => it.desc) ? `<div class="desc">${items[sel].desc || ''}</div>` : '');
      wrap.querySelectorAll('.mi').forEach((e) => { e.onclick = () => { sel = +e.dataset.i; activate(); }; e.onmouseenter = () => { if (sel !== +e.dataset.i) { sel = +e.dataset.i; sfx.move(); render(); onMove && onMove(sel); } }; });
    };
    const close = (v) => { ui.modal = null; if (!into) root.classList.add('hidden'); root.innerHTML = ''; resolve(v); };
    const activate = () => { if (items[sel].disabled) { sfx.deny(); return; } sfx.select(); close(sel); };
    ui.modal = {
      update() {
        if (wasHit('up')) { sel = (sel + items.length - 1) % items.length; sfx.move(); render(); onMove && onMove(sel); }
        else if (wasHit('down')) { sel = (sel + 1) % items.length; sfx.move(); render(); onMove && onMove(sel); }
        else if (wasHit('confirm')) activate();
        else if (cancel && wasHit('back')) { sfx.back(); close(-1); }
      },
    };
    render(); onMove && onMove(sel);
  });
}

/* ---------------- HUD ---------------- */
let faces = null;
const spk = (slot) => (slot === 'hare' ? 'wolf' : S().partner);
export function hudBuild() {
  const h = $('hud'); h.innerHTML = '';
  faces = {};
  for (const who of ['hare', 'wolf']) {
    const d = document.createElement('div'); d.className = 'pcard card notape'; d.id = 'pc-' + who;
    const cv = document.createElement('canvas'); cv.width = cv.height = 92; portrait(cv, spk(who));
    d.appendChild(cv); const t = document.createElement('div'); t.innerHTML = `<div class="nm">${SPEAK[spk(who)].name.toUpperCase()}</div><div class="row hp"></div><div class="bar"><i></i></div><div class="row fp"></div><div class="bar fp"><i></i></div>`; d.appendChild(t); h.appendChild(d);
  }
  let r = $('hudr'); if (!r) { r = document.createElement('div'); r.id = 'hudr'; r.className = 'hidden'; document.body.appendChild(r); }
  r.innerHTML = `<div class="chip card notape">🪙 <b id="h-coins">0</b></div><div class="chip card notape">🥕 <b id="h-carrots">0</b></div><div class="chip card notape">⭐ Lv <b id="h-lv">1</b></div>`;
}
export function hudUpdate() {
  const s = S(); if (!$('pc-hare')) return;
  for (const who of ['hare', 'wolf']) {
    const c = s.party[who], d = $('pc-' + who);
    d.querySelector('.hp').textContent = `HP ${c.hp}/${c.maxHp}`; d.querySelector('.fp').textContent = `FP ${c.fp}/${c.maxFp}`;
    d.querySelector('.bar i').style.width = (c.hp / c.maxHp * 100) + '%'; d.querySelector('.fp i').style.width = (c.fp / c.maxFp * 100) + '%';
    d.classList.toggle('ko', c.hp <= 0);
  }
  $('h-coins').textContent = s.coins; $('h-carrots').textContent = carrotCount(); $('h-lv').textContent = s.level;
}
export function hudShow(on) { $('hud').classList.toggle('hidden', !on); const r = $('hudr'); if (r) r.classList.toggle('hidden', !on); }

/* ---------------- banner / toast / prompt / flash ---------------- */
export function banner(title, sub = '', ms = 1800) {
  return new Promise((res) => {
    const b = $('banner'); b.innerHTML = `<div class="b card notape"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>`; b.classList.remove('hidden');
    after(ms).then(() => { b.classList.add('hidden'); res(); });
  });
}
let toastId = 0;
export function toast(text, ms = 1800) {
  const t = $('toast'); t.className = 'card notape'; t.textContent = text; const id = ++toastId; after(ms).then(() => { if (id === toastId) t.classList.add('hidden'); });
}
export function prompt(text, x, y) { const p = $('prompt'); if (!text) { p.classList.add('hidden'); return; } p.className = 'card notape'; p.textContent = text; p.style.left = x + 'px'; p.style.top = y + 'px'; }
export function flash() { const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); after(400).then(() => f.remove()); }

/* ---------------- iris wipe ---------------- */
function tweenIris(from, to, ms) {
  const el = $('iris');
  return tw(ms / 1000, (u) => { const e = u * u * (3 - 2 * u); el.style.setProperty('--r', (from + (to - from) * e) + 'vmax'); });
}
export function irisClose(ms = 450, x = 50, y = 55) { const el = $('iris'); el.style.setProperty('--x', x + '%'); el.style.setProperty('--y', y + '%'); return tweenIris(120, 0, ms); }
export function irisOpen(ms = 500, x = 50, y = 55) { const el = $('iris'); el.style.setProperty('--x', x + '%'); el.style.setProperty('--y', y + '%'); return tweenIris(0, 120, ms); }

export function updateModal(dt) { if (ui.modal) ui.modal.update(dt); }
export { portrait };
