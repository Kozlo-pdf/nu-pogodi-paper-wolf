import { PaperSprite, THREE, clamp, lerp, ease, textSprite, texOf, damp } from './paper.js';
import * as A from './art.js';
import { wasHit, isDown } from './input.js';
import { sfx, playMusic, stopMusic, rumble } from './audio.js';
import { ui, pick, banner, say, hudUpdate, flash } from './ui.js';
import { S, ITEMS, addItem, addSP, applyLevelChoice, saveGame } from './state.js';
import { ENEMIES, LEVELS, PARTNERS } from './data.js';

const $ = (id) => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const slotKey = (who) => (who === 'hare' ? 'wolf' : 'pal:' + S().partner);
const slotArt = (who, mood = 'normal') => (who === 'hare' ? A.drawWolf(mood) : PARTNERS[S().partner].art(mood));
const slotName = (who) => (who === 'hare' ? 'Wolf' : PARTNERS[S().partner].name);
const pickW = (arr) => { const t = arr.reduce((s, a) => s + (a.w || 1), 0); let r = Math.random() * t; for (const a of arr) { r -= a.w || 1; if (r <= 0) return a; } return arr[0]; };

const POS_P = { hare: -3.3, wolf: -5.6 };
const SLOTS = { 1: [3.9], 2: [2.9, 5.9], 3: [1.7, 4.3, 6.7], 4: [1.1, 3.1, 5.1, 7.1] };

export class Battle {
  /** opts: { enemies:[types], first:'player'|'enemy'|null, boss:bool, bg, theme, music, auto } */
  constructor(stage, opts) {
    this.st = stage; this.o = opts; this.tasks = []; this.t = 0; this.hitstop = 0; this.auto = !!opts.auto || !!window.__PQ_AUTO;
    this.applause = opts.applause ?? 0; this.cmdEl = null; this.alive = true; this.result = null; this.dmgDealt = 0; this.turn = 0;
    this.scene = stage.newScene(0x2a1830); stage.camX = 0; stage.camY = 3.0; stage.zoom = 0.86;
    this.buildStage(opts.bg || 'park');
    this.crowd = []; this.buildAudience();
    const P = S().party;
    this.party = {};
    for (const who of ['hare', 'wolf']) {
      const spr = new PaperSprite(slotKey(who), () => slotArt(who), who === 'hare' ? 2.3 : PARTNERS[S().partner].h);
      spr.root.position.set(POS_P[who], 0, 0.6); this.scene.add(spr.root);
      this.party[who] = { who, spr, x: POS_P[who], defending: false, ko: P[who].hp <= 0, st: P[who] };
      if (this.party[who].ko) { spr.body.rotation.z = -1.4; spr.tint(0x999999); }
    }
    this.foes = []; this.spawnFoes(opts.enemies);
    stage.updaters.push((dt) => this.tick(dt));
  }

  tr(n) { (this._tr = this._tr || []).push(n + '@' + this.t.toFixed(1)); if (this._tr.length > 14) this._tr.shift(); }
  /* ---------- infrastructure ---------- */
  tick(dt) {
    this.t += dt;
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      const k = this.tasks[i];
      if (k.tw) { k.t = Math.min(k.d, k.t + dt); k.fn(k.d ? k.t / k.d : 1); if (k.t >= k.d) { this.tasks.splice(i, 1); k.r(); } }
      else { k.t -= dt; if (k.t <= 0) { this.tasks.splice(i, 1); k.r(); } }
    }
    for (const c of Object.values(this.party)) c.spr.update(dt);
    for (const f of this.foes) { f.spr.update(dt); if (f.alive && !f.busy) { f.spr.body.position.y = f.def.flying ? Math.sin(this.t * 2.2 + f.id) * 0.25 : Math.abs(Math.sin(this.t * 2 + f.id)) * 0.04; } }
    for (const c of this.crowd) { c.t += dt; c.s.body.position.y = Math.max(0, Math.sin(c.t * 3 + c.ph) * 0.08) + (c.jump > 0 ? Math.sin((1 - c.jump / 0.5) * Math.PI) * 0.8 : 0); c.jump = Math.max(0, c.jump - dt); c.s.body.rotation.z = Math.sin(c.t * 1.6 + c.ph) * 0.06; }
    this.updateMeter(); this.updatePopups(dt);
    this.st.zoom = lerp(this.st.zoom, this.zoomT ?? 0.86, damp(6, dt));
  }
  sleep(s) { return new Promise((r) => this.tasks.push({ t: s, r })); }
  tween(d, fn) { return new Promise((r) => this.tasks.push({ tw: true, d, t: 0, fn, r })); }
  freeze(s = 0.07) { this.hitstop = Math.max(this.hitstop, s); }

  buildStage(kind) {
    this.st.addBackdrop(kind, { z: -22, factor: 0.05, y: 5.5, hscale: 1.25 });
    const [fc, fg] = A.mk(512, 128); const pl = fg.createLinearGradient(0, 0, 0, 128); pl.addColorStop(0, '#d9a066'); pl.addColorStop(1, '#a8703e'); fg.fillStyle = pl; fg.fillRect(0, 0, 512, 128);
    fg.strokeStyle = 'rgba(58,42,36,0.5)'; fg.lineWidth = 3; for (let i = 0; i < 8; i++) { fg.beginPath(); fg.moveTo(i * 64, 0); fg.lineTo(i * 64, 128); fg.stroke(); } fg.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 40; i++) fg.fillRect((i * 97) % 512, (i * 31) % 128, 40, 3);
    const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(5, 1); ft.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 12), new THREE.MeshBasicMaterial({ map: ft })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -1); this.scene.add(floor);
    const lip = new THREE.Mesh(new THREE.PlaneGeometry(44, 1.2), new THREE.MeshBasicMaterial({ color: 0x7a4a24 })); lip.position.set(0, -0.6, 5); this.scene.add(lip);
    // curtains
    const [cc, cg] = A.mk(128, 512); const cr = cg.createLinearGradient(0, 0, 128, 0); cr.addColorStop(0, '#8a1228'); cr.addColorStop(0.5, '#d9363e'); cr.addColorStop(1, '#8a1228');
    for (let i = 0; i < 4; i++) { const g2 = cg.createLinearGradient(i * 32, 0, i * 32 + 32, 0); g2.addColorStop(0, '#7a0e22'); g2.addColorStop(0.5, '#e8454f'); g2.addColorStop(1, '#7a0e22'); cg.fillStyle = g2; cg.fillRect(i * 32, 0, 32, 512); }
    const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 15), new THREE.MeshBasicMaterial({ map: ct, side: THREE.DoubleSide })); m.position.set(s * 11.6, 6, 1.5); m.rotation.y = s * -0.25; this.scene.add(m); }
    const [vc, vg] = A.mk(512, 96); vg.fillStyle = '#c0182e'; vg.fillRect(0, 0, 512, 52); for (let i = 0; i < 8; i++) { vg.beginPath(); vg.arc(32 + i * 64, 52, 32, 0, Math.PI); vg.fill(); vg.lineWidth = 4; vg.strokeStyle = '#3a2a24'; vg.stroke(); } vg.fillStyle = '#ffd23f'; vg.fillRect(0, 44, 512, 8); vg.fillStyle = 'rgba(255,255,255,0.18)'; vg.fillRect(0, 4, 512, 8);
    const vt = new THREE.CanvasTexture(vc); vt.wrapS = THREE.RepeatWrapping; vt.repeat.set(3, 1); vt.colorSpace = THREE.SRGBColorSpace;
    const val = new THREE.Mesh(new THREE.PlaneGeometry(36, 3.4), new THREE.MeshBasicMaterial({ map: vt, transparent: true })); val.position.set(0, 8.2, 2.2); this.scene.add(val);
  }
  buildAudience() {
    for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++) {
      const s = new PaperSprite('aud' + ((i + r) % 5), () => A.drawAudience((i + r) % 5), 1.9 - r * 0.1, { shadow: false });
      s.root.position.set(-13 + i * 1.75 + r * 0.8 + Math.sin(i * 3.1) * 0.25, -2.3 - r * 0.6 + 0, 7.2 + r * 0.9); s.tint(r ? 0xc8b8c0 : 0xdacfd6); this.scene.add(s.root);
      this.crowd.push({ s, t: Math.random() * 6, ph: Math.random() * 6, jump: 0 });
    }
  }
  cheer(n = 6) { sfx.cheer(); for (let i = 0; i < n; i++) this.crowd[Math.floor(Math.random() * this.crowd.length)].jump = 0.5; }

  spawnFoes(types) {
    const list = []; for (const t of types) { list.push(t); }
    const n = Math.min(4, list.length), slots = SLOTS[n] || SLOTS[4];
    list.slice(0, 4).forEach((t, i) => this.addFoe(t, slots[i]));
  }
  addFoe(t, x, anim = false) {
    const d = ENEMIES[t]; const spr = new PaperSprite('e:' + t, () => d.art('normal'), d.h);
    const sc = d.boss ? 1 : 1; spr.root.position.set(x, 0, 0.5); this.scene.add(spr.root);
    const f = { id: this.foes.length * 1.7 + Math.random(), t, def: d, spr, x, y: 0, hp: d.hp, maxHp: d.hp, alive: true, stun: 0, charged: false, busy: false, w: d.w };
    if (d.flying) spr.root.position.y = 1.6;
    f.baseY = d.flying ? 1.6 : 0; this.foes.push(f);
    if (anim) { spr.root.position.y = 6; spr.root.scale.set(0.2, 0.2, 0.2); this.tween(0.5, (u) => { spr.root.position.y = lerp(6, f.baseY, ease.out(u)); const s = lerp(0.2, 1, ease.back(u)); spr.root.scale.set(s, s, s); }); }
    return f;
  }
  living() { return this.foes.filter((f) => f.alive); }
  partyAlive() { return Object.values(this.party).filter((c) => !c.ko); }

  /* ---------- popups & feedback ---------- */
  pop(text, x, y, color = '#fff', size = 60, w = 2.6) {
    const sp = textSprite(text, { color, size, w }); sp.position.set(x, y, 2); this.scene.add(sp);
    this.pops = this.pops || []; this.pops.push({ sp, t: 0, y, vy: 1.8 });
  }
  updatePopups(dt) {
    if (!this.pops) return;
    for (let i = this.pops.length - 1; i >= 0; i--) { const q = this.pops[i]; q.t += dt; q.sp.position.y = q.y + ease.out(clamp(q.t / 0.5, 0, 1)) * 0.9 + q.t * 0.3; q.sp.material.opacity = clamp(1.8 - q.t * 1.4, 0, 1); if (q.t > 1.3) { this.scene.remove(q.sp); q.sp.material.map.dispose(); q.sp.material.dispose(); this.pops.splice(i, 1); } }
  }
  addApplause(n) { this.applause = clamp(this.applause + n, 0, 100); }
  updateMeter() {
    let m = $('applause'); if (!m) { m = document.createElement('div'); m.id = 'applause'; m.className = 'meter card notape'; document.body.appendChild(m); }
    m.innerHTML = `<div class="nm">APPLAUSE ${this.applause >= 100 ? '— FULL!' : ''}</div><div class="bar"><i style="width:${this.applause}%"></i></div>`; m.classList.toggle('full', this.applause >= 100);
  }

  /* ---------- action command UI ---------- */
  cmdShow(html, wx, wy) { this.cmdHide(); const p = this.st.project(wx, wy, 0.6); const e = document.createElement('div'); e.className = 'cmd'; e.innerHTML = html; e.style.left = p.x + 'px'; e.style.top = p.y + 'px'; $('battle-ui').appendChild(e); this.cmdEl = e; return e; }
  cmdHide() { if (this.cmdEl) { this.cmdEl.remove(); this.cmdEl = null; } }
  grade(text, x, y, color) { this.pop(text, x, y, color, 64, 2.8); }

  /* ---------- main flow ---------- */
  async run() {
    $('battle-ui').classList.remove('hidden');
    playMusic(this.o.boss ? 'boss' : 'battle');
    await banner(this.o.boss ? 'BOSS BATTLE!' : 'BATTLE!', '', 900);
    if (this.o.first === 'player') { await this.freeStrike(); }
    let enemyFirst = this.o.first === 'enemy';
    while (this.alive) {
      if (!enemyFirst) { await this.playerPhase(); if (this.result) break; }
      enemyFirst = false;
      await this.enemyPhase(); if (this.result) break;
      this.turn++;
    }
    this.cmdHide();
    return this.result;
  }

  async freeStrike() {
    const t = this.living()[0]; if (!t) return;
    this.pop('FIRST STRIKE!', 0, 4.6, '#ffd23f', 64, 3.4); sfx.alert();
    await this.moveJump(this.party.hare, t, { free: true });
    this.checkEnd();
  }

  checkEnd() {
    if (this.living().length === 0) this.result = 'win';
    else if (this.party.hare.st.hp <= 0) this.result = 'lose';
    return !!this.result;
  }

  async playerPhase() {
    for (const c of Object.values(this.party)) c.defending = false;
    for (const who of ['hare', 'wolf']) {
      const c = this.party[who]; if (c.ko || c.st.hp <= 0) continue;
      if (c.trapped > 0) { c.trapped--; this.pop('Stuck in the hat!', c.x, 3.4, '#ff9a8a'); sfx.deny(); await this.sleep(0.8); if (!c.trapped) c.spr.tint(0xffffff); continue; }
      let acted = false;
      while (!acted && !this.result) { acted = await this.menuFor(c); }
      if (this.checkEnd()) return;
    }
  }

  async menuFor(c) {
    const who = c.who, st = c.st, items = []; const PM = PARTNERS[S().partner].moves;
    const grounded = this.living().filter((f) => !f.def.flying), hasAny = this.living().length > 0;
    const spikedOnly = this.living().every((f) => f.def.spiked);
    if (who === 'hare') {
      items.push({ k: 'jump', label: 'Jump', right: 'FP 0', desc: 'Hop on an enemy. Press *Z* as you land for a bonus bounce!', disabled: !hasAny || this.living().every((f) => f.def.spiked) });
      items.push({ k: 'mallet', label: 'Guitar Smash', right: 'FP 0', desc: 'Hold *Z* to wind up the guitar, release in the green zone. Cannot hit flyers.', disabled: grounded.length === 0 });
    } else {
      items.push({ k: 'claw', label: PM.claw[0], right: 'FP 0', desc: PM.claw[1], disabled: !hasAny });
      items.push({ k: 'howl', label: PM.howl[0], right: 'FP 2', desc: PM.howl[1], disabled: st.fp < 2 });
      items.push({ k: 'slam', label: PM.slam[0], right: 'FP 3', desc: PM.slam[1], disabled: st.fp < 3 || grounded.length === 0 });
    }
    items.push({ k: 'special', label: this.applause >= 100 ? '★ Nu, Pogodi! Combo' : 'Combo (applause)', right: 'FULL', desc: 'Wolf and his partner team up! Needs a full applause meter.', disabled: this.applause < 100 || this.party.wolf.ko });
    items.push({ k: 'items', label: 'Items', desc: 'Use soup, tea and other goodies.', disabled: Object.keys(S().items).length === 0 });
    items.push({ k: 'defend', label: 'Defend', desc: 'Take 1 less damage this turn.' });
    if (who === 'hare') items.push({ k: 'flee', label: 'Run Away', desc: this.o.boss ? 'Bosses will not let you escape!' : 'Try to flee from the battle.', disabled: !!this.o.boss });
    this.bannerTurn(c);
    if (this.auto && st.hp <= Math.ceil(st.maxHp / 2) && S().items.soup) { addItem('soup', -1); st.hp = Math.min(st.maxHp, st.hp + 5); this.pop('+5 HP', c.x, 3.2, '#8fe8a4'); sfx.heal(); hudUpdate(); await this.sleep(0.4); return true; }
    const i = this.auto ? items.findIndex((x) => !x.disabled) : await pick({ title: slotName(who).toUpperCase() + ': your move!', items, cancel: false, pos: 'bottom' });
    const k = items[i].k;
    if (k === 'defend') { c.defending = true; sfx.guard(); this.pop('GUARDING', c.x, 2.9, '#9ad0ff'); c.spr.body.scale.set(1.1, 0.88, 1); await this.sleep(0.5); c.spr.body.scale.set(1, 1, 1); return true; }
    if (k === 'items') return await this.useItemMenu(c);
    if (k === 'flee') return await this.tryFlee(c);
    if (k === 'howl') { st.fp -= 2; hudUpdate(); await this.moveHowl(c); return true; }
    if (k === 'slam') { st.fp -= 3; hudUpdate(); await this.moveSlam(c); return true; }
    if (k === 'special') { this.applause = 0; await this.moveSpecial(); return true; }
    // single-target moves
    const cands = this.living().filter((f) => (k === 'mallet' ? !f.def.flying : k === 'jump' ? !f.def.spiked : true));
    const tgt = this.auto ? cands.slice().sort((x, y) => y.maxHp - x.maxHp)[0] : await this.chooseTarget(cands);
    if (!tgt) return false;
    if (k === 'jump') await this.moveJump(c, tgt); else if (k === 'mallet') await this.moveMallet(c, tgt); else if (k === 'claw') await this.moveClaw(c, tgt);
    return true;
  }
  bannerTurn(c) { c.spr.body.position.y = 0; }

  chooseTarget(cands) {
    return new Promise((resolve) => {
      if (cands.length === 1 && false) { resolve(cands[0]); return; }
      let i = 0; const arrow = textSprite('▼', { color: '#ffd23f', size: 90, w: 1.2 }); this.scene.add(arrow);
      const lab = document.createElement('div'); lab.className = 'estat card notape'; $('battle-ui').appendChild(lab);
      const upd = () => { const f = cands[i]; arrow.position.set(f.x, f.spr.root.position.y + f.def.h + 0.7, 1.5); const p = this.st.project(f.x, f.spr.root.position.y + f.def.h + 1.1, 1); lab.style.left = p.x + 'px'; lab.style.top = p.y + 'px'; lab.textContent = `${f.def.name}  HP ${f.hp}/${f.maxHp}${f.stun ? ' 💫' : ''}${f.def.flying ? ' ✈' : ''}${f.def.spiked ? ' ✦' : ''}`; };
      const done = (v) => { this.scene.remove(arrow); lab.remove(); ui.modal = null; resolve(v); };
      ui.modal = { update: (dt) => { arrow.position.y += Math.sin(this.t * 8) * 0.01; upd();
        if (wasHit('left') && cands.length > 1) { i = (i + cands.length - 1) % cands.length; sfx.move(); }
        else if (wasHit('right') && cands.length > 1) { i = (i + 1) % cands.length; sfx.move(); }
        else if (wasHit('confirm')) { sfx.select(); done(cands[i]); }
        else if (wasHit('back')) { sfx.back(); done(null); } } };
      upd();
    });
  }

  async useItemMenu(c) {
    const s = S(); const list = Object.keys(s.items).map((id) => ({ id, label: `${ITEMS[id].icon} ${ITEMS[id].name}`, right: '×' + s.items[id], desc: ITEMS[id].desc }));
    const i = await pick({ title: 'Items', items: list, pos: 'bottom' }); if (i < 0) return false;
    const it = ITEMS[list[i].id], id = list[i].id;
    if (it.kind === 'flee') { if (this.o.boss) { ui.modal = null; this.pop("Can't escape!", c.x, 3, '#ff7a7a'); sfx.deny(); await this.sleep(0.6); return false; } addItem(id, -1); this.result = 'flee'; sfx.poof(); this.st.poof(c.x, 1, 1); return true; }
    if (it.kind === 'dmg') { addItem(id, -1); sfx.slam(); this.st.shake = 1; flash(); for (const f of [...this.living()]) await this.damageFoe(f, it.amt, { pierce: true }); await this.sleep(0.4); this.checkEnd(); return true; }
    let target = null;
    if (it.kind === 'revive') { const ko = Object.values(this.party).filter((p) => p.ko); if (!ko.length) { sfx.deny(); this.pop('Nobody is down!', c.x, 3, '#ff7a7a'); await this.sleep(0.5); return false; } target = ko[0]; }
    else {
      const opts = Object.values(this.party).filter((p) => !p.ko).map((p) => ({ p, label: slotName(p.who), right: `HP ${p.st.hp}/${p.st.maxHp}  FP ${p.st.fp}/${p.st.maxFp}` }));
      const j = await pick({ title: `Use ${it.name} on…`, items: opts, pos: 'bottom' }); if (j < 0) return false; target = opts[j].p;
    }
    addItem(id, -1); sfx.heal(); const st = target.st;
    if (it.kind === 'hp' || it.kind === 'both') { const before = st.hp; st.hp = Math.min(st.maxHp, st.hp + it.amt); this.pop('+' + (st.hp - before) + ' HP', target.x, 3.2, '#8fe8a4'); }
    if (it.kind === 'fp' || it.kind === 'both') { const before = st.fp; st.fp = Math.min(st.maxFp, st.fp + (it.fp || it.amt)); this.pop('+' + (st.fp - before) + ' FP', target.x, 2.7, '#9ad0ff'); }
    if (it.kind === 'revive') { target.ko = false; st.hp = Math.ceil(st.maxHp / 2); target.spr.body.rotation.z = 0; target.spr.tint(0xffffff); this.pop('Back up!', target.x, 3.2, '#ffd23f'); }
    this.st.burst(target.x, 1.4, 1, { n: 12, kind: 'star', color: 0x9affc0, power: 4 }); hudUpdate(); await this.sleep(0.7); return true;
  }

  async tryFlee(c) {
    const ok = this.auto ? true : Math.random() < 0.65; this.pop('Run!', c.x, 3.1, '#ffd23f'); sfx.flip();
    await this.tween(0.5, (u) => { c.spr.root.position.x = c.x - u * 9; c.spr.body.rotation.z = Math.sin(u * 30) * 0.08; });
    if (ok) { this.result = 'flee'; return true; }
    this.pop('Cornered!', c.x + 2, 3.1, '#ff7a7a'); sfx.deny(); await this.tween(0.45, (u) => { c.spr.root.position.x = c.x - 9 + u * 9; }); return true;
  }

  /* ---------- damage ---------- */
  atkBonus() { return S().atkBonus; }
  async damageFoe(f, raw, { pierce = false, color = '#fff', crit = false } = {}) {
    if (!f.alive) return 0;
    if (f.weak) { raw += 2; f.weak = false; this.pop('WEAK POINT!', f.x, f.def.h + 0.9, '#ff9a3a', 54, 3.4); }
    const dmg = Math.max(1, raw - (pierce ? 0 : f.def.def));
    f.hp -= dmg; this.dmgDealt += dmg; sfx[crit ? 'crit' : 'hit'](); this.freeze(crit ? 0.12 : 0.07); this.st.shake = Math.max(this.st.shake, crit ? 0.9 : 0.45);
    this.st.impact(f.x, f.spr.root.position.y + f.def.h * 0.55, 1, crit ? 0xffd23f : 0xfff6e3);
    this.pop(String(dmg), f.x + rnd(-0.3, 0.3), f.spr.root.position.y + f.def.h + 0.2, crit ? '#ffd23f' : color, 70, 2.2);
    f.spr.setTex('e:' + f.t + ':h', () => f.def.art('hurt'));
    f.spr.body.rotation.z = 0.25; f.spr.body.position.x = 0.15;
    const x0 = f.spr.root.position.x; this.tween(0.25, (u) => { f.spr.body.rotation.z = 0.25 * (1 - u) * Math.cos(u * 18); f.spr.root.position.x = x0 + Math.sin(u * 40) * 0.12 * (1 - u); });
    await this.sleep(0.28); f.spr.setTex('e:' + f.t, () => f.def.art('normal')); f.spr.body.position.x = 0;
    if (f.hp <= 0) await this.defeatFoe(f);
    return dmg;
  }
  async defeatFoe(f) {
    f.alive = false; f.busy = true; sfx.poof(); this.addApplause(10);
    await this.tween(0.55, (u) => { f.spr.root.position.y = f.baseY + ease.out(u) * 1.5 - u * u * 3; f.spr.body.rotation.z = u * 9; const s = 1 - u * 0.8; f.spr.root.scale.set(s, s, s); });
    this.st.poof(f.x, 1.2, 1); this.st.burst(f.x, 1.2, 1, { n: 14, kind: 'star', power: 7 }); this.scene.remove(f.spr.root); this.cheer(4);
    if (f.def.boss) {
      this.pop('The minions flee!', 0, 5.2, '#ffd23f', 56, 3.6);
      for (const o of this.living()) { o.alive = false; o.fled = true; this.tween(0.5, (u) => { o.spr.root.position.y = o.baseY + u * 2; const sc = 1 - u; o.spr.root.scale.set(sc, sc, sc); }); this.st.poof(o.x, 1.2, 1); }
      await this.sleep(0.55); for (const o of this.foes) if (!o.alive) this.scene.remove(o.spr.root);
    }
  }

  /* ---------- hare: jump ---------- */
  async moveJump(c, f, { free = false } = {}) {
    const spr = c.spr, x0 = c.x; let chain = 0, good = true, total = 0;
    const hop = async (fromX, toX, h, dur) => { await this.tween(dur, (u) => { spr.root.position.x = lerp(fromX, toX, u); spr.body.position.y = 4 * h * u * (1 - u); spr.body.rotation.z = (u - 0.5) * -0.3; }); spr.body.rotation.z = 0; };
    sfx.jump(); await hop(x0, f.x - 1.9, 0.9, 0.38);
    while (good && f.alive && chain < 3) {
      // the timed hop onto the enemy's head
      let pressedAt = -1, fired = false; const topY = f.spr.root.position.y + f.def.h * 0.82;
      const e = this.cmdShow('<div class="t">Z!</div>', f.x, topY + 1.2); e.style.visibility = 'hidden';
      const start = chain === 0 ? f.x - 1.9 : f.x;
      sfx.jump();
      await this.tween(0.62, (u) => {
        const hh = 2.6 + chain * 0.3; spr.root.position.x = lerp(start, f.x - 0.2, ease.out(u)); spr.body.position.y = Math.max(0, 4 * hh * u * (1 - u) * (1 - 0.15 * u) + (topY - 0.2) * Math.pow(u, 3));
        spr.body.rotation.z = Math.sin(u * Math.PI * 2) * 0.1;
        if (u > 0.62) e.style.visibility = 'visible';
        if (!fired && (wasHit('act') || (this.auto && u > 0.88))) { fired = true; pressedAt = u; }
      });
      this.cmdHide();
      const perfect = pressedAt >= 0.74; good = perfect;
      const base = 1 + this.atkBonus() + (chain > 0 ? 0 : 0);
      sfx.land(); spr.body.position.y = Math.max(0, topY - 0.2);
      await this.damageFoe(f, base + (perfect ? 1 : 0), { crit: perfect && chain === 2, color: perfect ? '#ffe27a' : '#fff' });
      if (perfect) { this.grade(['NICE!', 'GREAT!', 'EXCELLENT!'][chain], x0, 3.4, '#ffd23f'); this.addApplause(10 + chain * 4); this.cheer(3); } else { this.grade(pressedAt < 0 ? 'MISS' : 'TOO EARLY', x0, 3.4, '#ff9a8a'); sfx.miss(); }
      chain++;
      if (good && f.alive && chain < 3) { sfx.jump(); await this.tween(0.22, (u) => { spr.body.position.y = topY + Math.sin(u * Math.PI) * 0.9; }); }
    }
    // return
    await this.tween(0.32, (u) => { spr.root.position.x = lerp(spr.root.position.x, x0, ease.out(u)); spr.body.position.y = Math.max(0, spr.body.position.y * (1 - u)); }); spr.root.position.x = x0; spr.body.position.y = 0;
  }

  /* ---------- hare: mallet ---------- */
  async moveMallet(c, f) {
    const spr = c.spr, x0 = c.x;
    await this.tween(0.32, (u) => { spr.root.position.x = lerp(x0, f.x - 2.0, ease.out(u)); spr.body.position.y = Math.abs(Math.sin(u * 14)) * 0.15; });
    // charge
    const e = this.cmdShow('<div class="t">HOLD Z…</div><div class="gauge"><div class="zone" style="left:76%;width:16%"></div><div class="zone p" style="left:92%;width:8%"></div><div class="fill" style="width:0%"></div></div>', c.x + 0.5, 3.6);
    const fill = e.querySelector('.fill'); let v = 0, released = false, res = 0, started = false; const T = 1.15;
    sfx.charge();
    await new Promise((resolve) => {
      const k = { tw: true, d: 4, t: 0, fn: () => {}, r: resolve }; this.tasks.push(k);
      k.fn = () => {
        if (!started) { k.t = 0; if (wasHit('act') || this.auto) started = true; }
        v = started ? k.t / T : 0;
        spr.body.rotation.z = -Math.min(v, 1) * 0.9 * c.spr.facing; spr.body.position.y = Math.min(v, 1) * 0.2; fill.style.width = Math.min(100, v * 100) + '%';
        if (started && !released && ((!isDown('act') && !this.auto && k.t > 0.12) || (this.auto && v >= 0.93) || v >= 1.12)) { released = true; res = v; k.t = k.d; }
      };
    });
    this.cmdHide();
    const grade = res >= 0.92 && res <= 1.0 ? 'perfect' : res >= 0.76 && res < 0.92 ? 'great' : res >= 0.45 ? 'ok' : 'weak';
    const dmg = { perfect: 4, great: 3, ok: 2, weak: 1 }[grade] + this.atkBonus();
    await this.tween(0.14, (u) => { spr.body.rotation.z = lerp(-0.9, 0.7, ease.out(u)) * (spr.facing); spr.root.position.x += 0.1; });
    this.st.shake = Math.max(this.st.shake, 0.5);
    await this.damageFoe(f, dmg, { crit: grade === 'perfect', color: '#ffe27a' });
    this.grade({ perfect: 'PERFECT!', great: 'GREAT!', ok: 'OK', weak: 'WEAK' }[grade], x0, 3.4, grade === 'weak' ? '#ff9a8a' : '#ffd23f');
    if (grade === 'perfect' || grade === 'great') { this.addApplause(grade === 'perfect' ? 18 : 12); this.cheer(3); } else if (grade === 'weak') sfx.miss();
    spr.body.rotation.z = 0; await this.tween(0.3, (u) => { spr.root.position.x = lerp(spr.root.position.x, x0, ease.out(u)); spr.body.position.y = 0; }); spr.root.position.x = x0;
  }

  /* ---------- wolf: claw frenzy ---------- */
  async moveClaw(c, f) {
    const spr = c.spr, x0 = c.x;
    await this.tween(0.3, (u) => { spr.root.position.x = lerp(x0, f.x - 1.8, ease.out(u)); spr.body.position.y = Math.abs(Math.sin(u * 12)) * 0.12; });
    const e = this.cmdShow('<div class="t mash">MASH Z!</div><div class="gauge"><div class="fill" style="width:0%"></div></div>', c.x + 0.8, 3.7);
    const fill = e.querySelector('.fill'); let presses = 0; const D = 1.4; let last = 0;
    await this.tween(D, (u) => {
      if (wasHit('act') || (this.auto && Math.floor(u * 14) > last)) { presses++; last = Math.floor(u * 14); sfx.move(); spr.body.rotation.z = (presses % 2 ? 0.25 : -0.25); this.st.impact(f.x - 0.8, 1.2 + Math.random(), 1.2, 0xfff6e3); }
      fill.style.width = Math.min(100, presses / 14 * 100) + '%'; spr.root.position.x = f.x - 1.8 + Math.sin(u * 50) * 0.08;
    });
    this.cmdHide(); spr.body.rotation.z = 0;
    const hits = clamp(Math.floor(presses / 4), 0, 4), grade = hits >= 4 ? 'FRENZY!' : hits >= 3 ? 'GREAT!' : hits >= 1 ? 'OK' : 'WEAK';
    const dmg = 1 + hits + this.atkBonus();
    await this.damageFoe(f, dmg, { crit: hits >= 4, color: '#ffe27a' });
    this.grade(grade, x0 - 0.5, 3.6, hits >= 2 ? '#ffd23f' : '#ff9a8a'); if (hits >= 3) { this.addApplause(hits * 5); this.cheer(3); }
    await this.tween(0.3, (u) => { spr.root.position.x = lerp(spr.root.position.x, x0, ease.out(u)); }); spr.root.position.x = x0; spr.body.position.y = 0;
  }

  /* ---------- wolf: howl (ring timing) ---------- */
  async ringCommand(label, wx, wy, dur = 1.15, idealU = 0.92) {
    const e = this.cmdShow(`<div class="t">${label}</div><div class="ring"><div class="out"></div><div class="in"></div></div>`, wx, wy);
    const inn = e.querySelector('.in'); let hit = -1;
    await this.tween(dur, (u) => {
      const size = lerp(190, 112, u); inn.style.width = inn.style.height = size + 'px';
      if (hit < 0 && (wasHit('act') || (this.auto && u >= idealU))) hit = Math.abs(u - idealU);
    });
    this.cmdHide(); return hit < 0 ? 'miss' : hit <= 0.07 ? 'perfect' : hit <= 0.16 ? 'good' : 'bad';
  }
  async moveHowl(c) {
    const spr = c.spr; sfx.howl();
    await this.tween(0.35, (u) => { spr.body.rotation.z = u * 0.5; spr.body.position.y = u * 0.5; });
    const g = await this.ringCommand('HOWL! Z', c.x, 3.6, 1.2, 0.92);
    const ok = g === 'perfect' || g === 'good';
    this.st.shake = 0.8; this.pop(ok ? 'AWOOOO!' : 'ahem…', c.x, 3.4, ok ? '#ffd23f' : '#ff9a8a', 64, 3.4); this.st.poof(c.x, 2, 1);
    for (let i = 0; i < 3; i++) this.st.burst(c.x + 1 + i, 2.6, 1, { n: 6, kind: 'puff', power: 4, size: 0.9, life: 0.8 });
    if (ok) { this.addApplause(g === 'perfect' ? 18 : 10); this.cheer(3); }
    for (const f of [...this.living()]) { await this.damageFoe(f, (ok ? 2 : 1) + this.atkBonus(), { pierce: true }); if (f.alive && ok) { f.stun = 1; this.pop('Dazed!', f.x, f.def.h + 0.8, '#ffd23f'); if (S().partner === 'fox') { f.weak = true; this.pop('Weak point!', f.x, f.def.h + 1.4, '#9ad0ff'); } } }
    spr.body.rotation.z = 0; spr.body.position.y = 0;
  }
  async moveSlam(c) {
    const spr = c.spr, x0 = c.x;
    if (S().partner === 'lifeguard' && this.party.hare.trapped) { this.party.hare.trapped = 0; this.party.hare.spr.tint(0xffffff); this.pop('Tipped the hat!', this.party.hare.x, 3.6, '#ffd23f', 56, 3.6); }
    sfx.jump(); await this.tween(0.55, (u) => { spr.root.position.x = lerp(x0, 2.8, ease.out(u)); spr.body.position.y = 4 * 3.6 * u * (1 - u) + 1.8 * u; });
    let fired = false, hit = false;
    const e = this.cmdShow('<div class="t">Z!</div>', 2.8, 5.2);
    await this.tween(0.45, (u) => { spr.body.position.y = lerp(3.4, 0, u * u); if (!fired && (wasHit('act') || (this.auto && u > 0.8))) { fired = true; hit = u > 0.5; } });
    this.cmdHide(); sfx.slam(); this.st.shake = 1.2; this.freeze(0.1); this.st.burst(2.8, 0.2, 1, { n: 18, kind: 'puff', power: 5, size: 0.7 });
    if (hit) { this.grade('GREAT!', 2.8, 4.5, '#ffd23f'); this.addApplause(14); this.cheer(3); } else this.grade('OK', 2.8, 4.5, '#ff9a8a');
    for (const f of [...this.living().filter((x) => !x.def.flying)]) await this.damageFoe(f, (hit ? 3 : 2) + this.atkBonus() + (S().partner === 'lifeguard' ? 1 : 0) + (S().partner === 'lifeguard' && f.t === 'cat' ? 2 : 0), { crit: hit });
    await this.tween(0.45, (u) => { spr.root.position.x = lerp(2.8, x0, ease.out(u)); spr.body.position.y = 0; }); spr.root.position.x = x0;
  }
  async moveSpecial() {
    const h = this.party.hare, w = this.party.wolf; this.pop('NU, POGODI!', 0, 5.3, '#ffd23f', 72, 4.4); sfx.win(); flash(); this.st.shake = 0.7;
    let tot = 0;
    for (let i = 0; i < 3; i++) {
      const g = await this.ringCommand(['CHASE! Z', 'FASTER! Z', 'POUNCE! Z'][i], i % 2 ? -4.5 : -3.2, 3.6, 0.95, 0.9);
      const ok = g !== 'miss' && g !== 'bad'; if (ok) tot++;
      const a = i % 2 ? w : h; const x0 = a.x;
      sfx.jump(); await this.tween(0.28, (u) => { a.spr.root.position.x = lerp(x0, 2.2 + i * 1.2, ease.out(u)); a.spr.body.position.y = Math.sin(u * Math.PI) * 1.2; });
      for (const f of [...this.living()]) await this.damageFoe(f, (ok ? 3 : 1) + this.atkBonus(), { pierce: true, crit: ok });
      await this.tween(0.22, (u) => { a.spr.root.position.x = lerp(a.spr.root.position.x, x0, u); a.spr.body.position.y = 0; }); a.spr.root.position.x = x0;
      if (!this.living().length) break;
    }
    this.cheer(10);
  }

  /* ---------- enemy phase ---------- */
  async enemyPhase() {
    for (const f of [...this.foes]) {
      if (!f.alive || this.result) continue;
      if (f.stun > 0) { f.stun--; this.pop('Dizzy…', f.x, f.def.h + 0.8, '#ffd23f'); f.spr.body.rotation.z = 0.2; await this.sleep(0.55); f.spr.body.rotation.z = 0; continue; }
      await this.enemyTurn(f); if (this.checkEnd()) return;
      await this.sleep(0.25);
    }
    for (const c of Object.values(this.party)) c.defending = false;
  }
  pickTarget() { const al = this.partyAlive(); if (al.length === 1) return al[0]; return Math.random() < 0.6 ? this.party.hare : this.party.wolf; }

  async enemyTurn(f) {
    const d = f.def, few = this.living().length <= 2 && this.foes.length < 4;
    if (d.phase2 && !f.p2 && f.hp <= f.maxHp / 2) { f.p2 = true; f.attacks = d.attacks2; sfx.slam(); flash(); this.st.shake = 1.4; f.spr.root.scale.setScalar(1.22); this.pop('PHASE 2: GIANT!', 0, 5.4, '#ff6a3a', 66, 5); await this.sleep(0.9); }
    const opts = (f.attacks || d.attacks).filter((a) => (a.when === 'few' ? few : true));
    const a = pickW(opts); const tgt = this.pickTarget(); f.busy = true;
    const spr = f.spr, x0 = f.x, y0 = f.baseY;
    this.pop(a.name, x0, d.h + 1.0, '#fff6e3', 44, 3.4);
    if (a.kind === 'summon') {
      await this.tween(0.5, (u) => { spr.body.position.y = Math.sin(u * Math.PI) * 0.6; spr.body.rotation.z = Math.sin(u * 20) * 0.1; });
      const used = this.foes.filter((q) => q.alive).map((q) => q.x), slots = [1.1, 3.1, 5.1, 7.1].filter((sx) => !used.some((u) => Math.abs(u - sx) < 1.2));
      if (slots.length) { sfx.alert(); const nf = this.addFoe(a.summon, slots[slots.length - 1], true); this.pop('Reinforcements!', nf.x, 3, '#ff9a8a'); await this.sleep(0.7); }
      f.busy = false; return;
    }
    if (a.kind === 'charge') { sfx.charge(); f.charged = true; spr.tint(0xffc0c0); this.pop('Charging up!', x0, d.h + 0.4, '#ff7a7a'); await this.tween(0.6, (u) => { spr.body.scale.set(1 + Math.sin(u * 30) * 0.04, 1 + Math.sin(u * 30) * 0.04, 1); }); spr.body.scale.set(1, 1, 1); f.busy = false; return; }
    if (a.kind === 'drain') {
      await this.tween(0.5, (u) => { spr.body.rotation.z = Math.sin(u * 14) * 0.1; }); sfx.howl();
      const t2 = this.partyAlive()[0]; const g = this.auto ? 'guard' : await this.guardWindow(0.4, tgt.x, 3.2); const prot = g !== 'none';
      if (!prot) { const dr = Math.min(2, tgt.st.fp); tgt.st.fp -= dr; this.pop('-' + dr + ' FP', tgt.x, 2.8, '#9ad0ff'); sfx.hurt(); } else this.pop('Blocked!', tgt.x, 2.8, '#9ad0ff'); hudUpdate(); f.busy = false; return;
    }
    if (a.kind === 'trap') {
      const L = this.party.hare; await this.tween(0.5, (u) => { spr.body.rotation.z = Math.sin(u * 24) * 0.08; });
      this.pop('!', x0, d.h + 0.7, '#ff4a4a', 90, 1.4); sfx.alert(); const g = await this.guardWindow(0.5, L.x, 3.2);
      if (g === 'none') { L.trapped = 2; L.spr.tint(0x6a5a8a); this.pop('Trapped in the hat!', L.x, 3.6, '#ff9a8a', 54, 4); sfx.hurt(); this.st.poof(L.x, 1, 1); } else { this.pop('Dodged!', L.x, 3.4, '#9ad0ff'); sfx.guard(); }
      f.busy = false; return;
    }
    const hits = a.kind === 'multi' ? (a.hits || 2) : 1;
    for (let h = 0; h < hits && !this.result; h++) {
      const targets = a.kind === 'aoe' ? this.partyAlive() : [this.partyAlive().includes(tgt) ? tgt : this.partyAlive()[0]];
      if (!targets.length) break;
      let pow = a.pow + (a.last && h === hits - 1 ? a.last - a.pow : 0) + (f.charged ? 2 : 0);
      // wind-up / approach
      const mx = targets[0].x + 2.2;
      if (a.kind === 'melee' || a.kind === 'multi') {
        const first = h === 0;
        if (first) await this.tween(0.42, (u) => { spr.root.position.x = lerp(x0, mx, ease.out(u)); spr.body.position.y = Math.abs(Math.sin(u * 9)) * 0.2; });
        this.pop('!', mx, d.h + 0.7, '#ff4a4a', 90, 1.4); sfx.alert();
        await this.tween(0.5, (u) => { spr.body.rotation.z = -u * 0.5 * -1 * 0.8; spr.body.position.y = u * 0.5; });
        const g = await this.impactWindow(0.28, () => this.tween(0.28, (u) => { spr.body.rotation.z = lerp(0.4, -0.7, u); spr.root.position.x = mx - u * 0.8; spr.body.position.y = lerp(0.5, 0, u); }), targets[0].x, 2.9);
        await this.applyHit(f, a, targets, pow, g);
        spr.body.rotation.z = 0; spr.root.position.x = mx;
        if (h === hits - 1) await this.tween(0.35, (u) => { spr.root.position.x = lerp(mx, x0, ease.out(u)); spr.body.position.y = 0; });
      } else if (a.kind === 'dive') {
        await this.tween(0.55, (u) => { spr.root.position.y = lerp(y0, y0 + 2.2, ease.out(u)); spr.root.position.x = lerp(x0, x0 + 1.0, u) + Math.sin(u * 30) * 0.05; });
        this.pop('!', spr.root.position.x, spr.root.position.y + d.h + 0.6, '#ff4a4a', 90, 1.4); sfx.alert();
        const sx = spr.root.position.x, sy = spr.root.position.y;
        const g = await this.impactWindow(0.3, () => this.tween(0.3, (u) => { spr.root.position.x = lerp(sx, targets[0].x + 1.2, u); spr.root.position.y = lerp(sy, 0.6, u * u); spr.body.rotation.z = u * 0.9; }), targets[0].x, 2.9);
        await this.applyHit(f, a, targets, pow, g);
        await this.tween(0.4, (u) => { spr.root.position.x = lerp(spr.root.position.x, x0, ease.out(u)); spr.root.position.y = lerp(spr.root.position.y, y0, ease.out(u)); spr.body.rotation.z = 0; }); spr.root.position.set(x0, y0, 0.5);
      } else { // ranged / aoe
        await this.tween(0.5, (u) => { spr.body.rotation.z = -u * 0.35; spr.body.position.y = u * 0.4; });
        this.pop('!', x0, d.h + 0.7, '#ff4a4a', 90, 1.4); sfx.alert();
        const proj = this.makeProjectile(f, a); proj.position.set(x0 - 1, y0 + d.h * 0.55, 1); this.scene.add(proj);
        const tx = a.kind === 'aoe' ? -4.4 : targets[0].x + 0.6, sx = proj.position.x;
        await this.sleep(0.25);
        const g = await this.impactWindow(0.5, () => this.tween(0.5, (u) => { proj.position.x = lerp(sx, tx, u); proj.position.y = lerp(y0 + d.h * 0.55, 1.4, u) + Math.sin(u * Math.PI) * 0.6; proj.rotation.z = u * 12; }), tx, 2.9, 0.5);
        this.scene.remove(proj); spr.body.rotation.z = 0; spr.body.position.y = 0;
        await this.applyHit(f, a, targets, pow, g);
      }
    }
    f.charged = false; spr.tint(0xffffff); f.busy = false;
  }

  makeProjectile(f, a) {
    const col = { robot: '#ff3a3a', inkblot: '#2a2a40', cat: '#d9363e', crab: '#e8c070', rivetbot: '#ffd23f', robothare: '#ff2a2a', pigeon: '#e8edf5', witch: '#b46aff', mega: '#ff5a2a', mushroom: '#d8f080', bear: '#ffd23f', snowman: '#e8f4ff', snowking: '#bfe3ff' }[f.t] || '#ffd23f';
    const [c, g] = A.mk(96, 96); g.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 22 : 44; g.lineTo(48 + Math.cos(an) * r, 48 + Math.sin(an) * r); } g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = A.INK; g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
  }

  /**
   * Runs `animate()` (which must resolve at the moment of impact) while watching the player's inputs.
   * Press Z in [impact-0.16, impact+0.04] = Guard, X in [impact-0.07, impact+0.03] = Super Guard.
   */
  async impactWindow(dur, animate, wx, wy, lead = null) {
    const t0 = this.t; let gTime = -1, sgTime = -1; const ev = this.tasks;
    const watch = { tw: true, d: 5, t: 0, fn: () => {
      if (gTime < 0 && wasHit('act')) gTime = this.t - t0; if (sgTime < 0 && wasHit('guard')) sgTime = this.t - t0;
      if (this.auto && gTime < 0 && this.t - t0 >= dur - 0.02) { gTime = dur - 0.02; if (Math.random() < 0.5) sgTime = dur - 0.01; }
    }, r: () => {} };
    this.tasks.push(watch); await animate(); const impact = dur; watch.t = watch.d; const idx = this.tasks.indexOf(watch); if (idx >= 0) this.tasks.splice(idx, 1);
    const near = (t, lo, hi) => t >= 0 && t - impact >= lo && t - impact <= hi;
    if (near(sgTime, -0.08, 0.04)) return 'super';
    if (near(gTime, -0.18, 0.04) || near(sgTime, -0.18, 0.04)) return 'guard';
    return 'none';
  }
  async guardWindow(dur, wx, wy) { return await this.impactWindow(dur, () => this.sleep(dur), wx, wy); }

  async applyHit(f, a, targets, pow, g) {
    for (const t of targets) {
      let dmg = pow - (t.defending ? 1 : 0);
      if (g === 'guard') { dmg -= 1; sfx.guard(); this.pop('GUARD!', t.x + 0.4, 3.3, '#9ad0ff', 60, 2.6); this.addApplause(6); this.st.impact(t.x + 0.8, 1.3, 1.2, 0x9ad0ff); this.cheer(2); if (S().partner === 'hedgehog' && f.alive) { f.hp -= 1; this.pop('COUNTER!', f.x, f.def.h + 0.4, '#ffd23f', 54, 2.8); if (f.hp <= 0) await this.defeatFoe(f); } }
      else if (g === 'super') { dmg = 0; sfx.superguard(); this.pop('SUPER GUARD!', t.x + 0.4, 3.4, '#ffd23f', 62, 3.6); this.addApplause(16); this.st.burst(t.x + 0.6, 1.4, 1.2, { n: 14, kind: 'star', power: 7 }); this.cheer(5); this.freeze(0.1); if (f.alive && a.kind === 'melee') { /* counter */ f.hp -= 1; this.pop('1', f.x, f.def.h + 0.4, '#ffd23f', 56, 1.4); if (f.hp <= 0) await this.defeatFoe(f); } }
      dmg = Math.max(0, dmg);
      if (dmg > 0) { await this.hurtParty(t, dmg); }
      else if (g === 'none') this.pop('0', t.x, 3, '#fff');
    }
    hudUpdate();
  }
  async hurtParty(t, dmg) {
    const st = t.st; st.hp = Math.max(0, st.hp - dmg); sfx.hurt(); this.freeze(0.09); this.st.shake = Math.max(this.st.shake, 0.6 + dmg * 0.1);
    this.pop('-' + dmg, t.x, 3.2, '#ff5a5a', 74, 2.4); this.st.impact(t.x + 0.4, 1.3, 1.2, 0xff8a8a);
    t.spr.setTex(slotKey(t.who) + ':h', () => slotArt(t.who, 'hurt'));
    const x0 = t.spr.root.position.x; await this.tween(0.32, (u) => { t.spr.root.position.x = x0 - Math.sin(u * Math.PI) * 0.8; t.spr.body.rotation.z = Math.sin(u * 20) * 0.15 * (1 - u); });
    t.spr.root.position.x = x0; t.spr.setTex(slotKey(t.who), () => slotArt(t.who));
    hudUpdate();
    if (st.hp <= 0) {
      t.ko = true; this.pop(slotName(t.who) + ' is down!', t.x, 3.6, '#ff5a5a', 54, 3.6); sfx.lose();
      await this.tween(0.5, (u) => { t.spr.body.rotation.z = -u * 1.4; t.spr.body.position.y = 0; }); t.spr.tint(0x999999);
    }
  }

  /* ---------- victory ---------- */
  async victory() {
    this.cmdHide(); stopMusic(); playMusic('victory');
    const hare = this.party.hare, wolf = this.party.wolf;
    this.cheer(14); this.st.burst(0, 5, 1, { n: 60, kind: 'confetti', power: 9, life: 2.2, size: 0.3 });
    for (const c of [hare, wolf]) if (!c.ko) c.spr.body.position.y = 0;
    this.tween(1.8, (u) => { for (const c of [hare, wolf]) if (!c.ko) c.spr.body.position.y = Math.abs(Math.sin(u * 14)) * 0.7; });
    await banner('VICTORY!', '', 1500);
    const sp = this.foesDefeatedSP(), coins = this.foesDefeatedCoins();
    S().coins += coins; const ups = addSP(sp);
    // revive KO'd partner
    for (const c of [hare, wolf]) if (c.st.hp <= 0) c.st.hp = 1;
    hudUpdate();
    await say([{ who: 'narrator', text: `Earned *${sp} Star Points* and *${coins} coins*!` }]);
    for (let i = 0; i < ups; i++) {
      sfx.levelup(); await banner('LEVEL UP!', `Level ${S().level - ups + i + 1}`, 1100);
      const c = await pick({ title: 'Level Up! Choose a bonus', items: [{ label: '❤ +5 HP (both friends)', desc: 'Raises max HP for Wolf and his partner, and heals them fully.' }, { label: '🌼 +3 FP (both friends)', desc: 'Raises max FP, and restores it fully.' }, { label: '💪 +1 Attack (both friends)', desc: 'Every attack hits a little harder.' }], cancel: false });
      applyLevelChoice(['hp', 'fp', 'atk'][c]); hudUpdate();
    }
    return sp;
  }
  foesDefeatedSP() { return this.foes.reduce((s, f) => s + (f.alive ? 0 : (f.fled ? 0 : f.def.sp)), 0); }
  foesDefeatedCoins() { return this.foes.reduce((s, f) => s + (f.alive ? 0 : Math.round(rnd(f.def.coins[0], f.def.coins[1]))), 0); }

  dispose() { this.cmdHide(); const m = $('applause'); if (m) m.remove(); this.st.zoom = 1; $('battle-ui').classList.add('hidden'); $('battle-ui').innerHTML = ''; }
}
