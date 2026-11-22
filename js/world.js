import { PaperSprite, THREE, THEMES, addGround, addPlatform, clamp, lerp, damp, ease, textSprite } from './paper.js';
import * as A from './art.js';
import { isDown, wasHit } from './input.js';
import { sfx } from './audio.js';
import { ENEMIES, propArt, PARTNERS } from './data.js';
import { S } from './state.js';

const GRAV = -40, RUN = 6.4, JUMP = 14.6, PW = 0.8, PH = 1.9, BLK = 1.2;

export class World {
  /** ev: { battle(enemy, first), interact(obj), save(), collect(kind), blockItem(block), landed() } */
  constructor(stage, lvl, ev) {
    this.st = stage; this.lvl = lvl; this.ev = ev; this.t = 0;
    this.theme = THEMES[lvl.theme]; this.scene = stage.newScene(lvl.sky ?? 0x9fd6ff);
    stage.addBackdrop(lvl.bg);
    this.solids = []; this.blocks = []; this.coins = []; this.carrots = []; this.enemies = []; this.npcs = []; this.doors = []; this.signs = []; this.pops = [];
    this.ground = lvl.ground.map((g) => [...g]); this.hazards = []; this.fasteners = []; this.hiddenDefs = (lvl.hidden || []).map((h) => ({ ...h, shown: false })); this.rolling = false; this.gliding = false; this.ph = PH;
    for (const [a, b] of this.ground) addGround(this.scene, a, b, this.theme);
    this.platforms = (lvl.platforms || []).map(([x, y, w]) => { addPlatform(this.scene, x, y, w, this.theme); return { x, y, w }; });
    this.build();
    // player + partner
    this.p = { x: lvl.spawn ?? 2, y: 0, vx: 0, vy: 0, ground: true, face: 1, coyote: 0, buf: 0, safeX: lvl.spawn ?? 2, squash: 0 };
    this.hare = this.mk('wolf', () => A.drawWolf(), 2.25); this.wolf = null; this.refreshPartner();
    this.trail = []; this.hammerT = 0; this.slamT = 0; this.slamCd = 0; this.hammerCd = 0; this.invuln = 0; this.locked = false;
    this.camX = this.p.x; this.stunnedUntil = 0;
    for (let i = 0; i < 40; i++) this.trail.push({ x: this.p.x - 0.01 * i, y: 0, f: 1, t: -0.04 * (40 - i) });
    stage.camX = this.camX; stage.camY = 3.4;
  }

  refreshPartner() {
    if (this.wolf) this.scene.remove(this.wolf.root);
    const P = PARTNERS[S().partner]; this.wolf = this.mk('pal:' + S().partner, () => P.art('normal'), P.h);
  }
  reveal(id) { this.revealId(id); }
  revealId(id) {
    for (const h of this.hiddenDefs) {
      if (h.id !== id || h.shown) continue; h.shown = true;
      if (h.type === 'ground') { this.ground.push([h.x0, h.x1]); const f = addGround(this.scene, h.x0, h.x1, this.theme); f.scale.y = 0.01; this.st.updaters.push(((fr) => { let u = 0; const fn = (dt) => { u = Math.min(1, u + dt * 1.6); fr.scale.y = Math.max(0.01, u); fr.position.y = -2 * u; if (u >= 1) { const i = this.st.updaters.indexOf(fn); if (i >= 0) this.st.updaters.splice(i, 1); } }; return fn; })(f)); }
      else { const front = addPlatform(this.scene, h.x, h.y, h.w, this.theme); this.platforms.push({ x: h.x, y: h.y, w: h.w }); this.st.burst(h.x, h.y + 0.3, 0.6, { n: 10, kind: 'star', color: 0x9ad0ff, power: 5 }); }
    }
    sfx.heal(); this.st.shake = 0.5;
  }
  mk(key, make, h, opts) { const s = new PaperSprite(key, make, h, opts); this.scene.add(s.root); return s; }

  build() {
    const L = this.lvl;
    for (const pr of L.props || []) {
      const [key, make, h] = propArt(pr.t, pr.v || 0); const sc = pr.s || 1;
      const s = this.mk(key, make, h * sc, { shadow: false }); s.root.position.set(pr.x, pr.y || 0, pr.z ?? -4);
      const dep = clamp((-(pr.z ?? -4)) / 14, 0, 0.6); s.tint(new THREE.Color(1 - dep * 0.22, 1 - dep * 0.18, 1 - dep * 0.08).getHex());
      if (pr.t === 'ferris') this.st.updaters.push((dt) => { s.body.rotation.z = Math.sin(this.t * 0.2) * 0.02; });
    }
    (L.blocks || []).forEach(([x, y, kind, item], i) => {
      const id = `${L.id}:b${i}`, used = S().blocks[id];
      const spr = this.mk('blk:' + (used ? 'used' : kind), () => A.drawBlock(used ? 'used' : kind), BLK, { shadow: false });
      spr.root.position.set(x, y, 0.1);
      this.blocks.push({ x, y, kind: used ? 'used' : kind, item, id, spr, bump: 0 });
    });
    (L.coins || []).forEach(([x, y]) => { const s = this.mk('coin', () => A.drawCoin(), 0.62, { shadow: false }); s.root.position.set(x, y, 0.2); this.coins.push({ x, y, s, got: false, ph: Math.random() * 6 }); });
    (L.carrots || []).forEach(([x, y], i) => {
      const id = `${L.id}:c${i}`; if (S().carrots[id]) return;
      const s = this.mk('carrot', () => A.drawCarrot(), 0.95, { shadow: false }); s.root.position.set(x, y, 0.2); this.carrots.push({ x, y, s, id, got: false, ph: Math.random() * 6 });
    });
    (L.enemies || []).forEach((e, i) => this.addEnemy(e, i));
    (L.npcs || []).forEach((n) => {
      const [key, make, h] = n.art; const s = this.mk(key, make, h, {}); s.root.position.set(n.x, 0, n.z ?? 0.2); s.face(n.face ?? -1); s.flip = s.flipTarget; s.body.rotation.y = s.flip;
      this.npcs.push({ ...n, s, kind: 'npc' });
    });
    (L.doors || []).forEach((d) => { const s = this.mk('door', () => A.drawDoor(), 3.1, { shadow: false }); s.root.position.set(d.x, 0, -0.6); this.doors.push({ ...d, s, kind: 'door', z: 0 }); });
    (L.signs || []).forEach((g) => { const s = this.mk('sign:' + (g.icon || '!'), () => A.drawSign(g.icon || '!'), 1.7, {}); s.root.position.set(g.x, 0, -0.4); this.signs.push({ ...g, s, kind: 'sign' }); });
    (L.fasteners || []).forEach((f) => { const s = this.mk('fastener', () => A.drawFastener(), 1.4, {}); s.root.position.set(f.x, 0, -0.3); this.fasteners.push({ ...f, s, kind: 'fastener', used: false }); });
    (L.hazards || []).forEach((h) => { const g = new THREE.Group(); g.position.set(h.x, h.py, 0.6); const s = new PaperSprite('ball', () => A.drawBall(), h.len, { shadow: false }); s.root.position.y = -h.len; g.add(s.root); this.scene.add(g); this.hazards.push({ ...h, g, ph: h.ph || 0 }); });
    // foreground tufts for depth
    for (let x = -2; x < L.width + 2; x += 7 + (x * 13 % 5)) { const s = this.mk('bush', () => A.drawBush(), 1.1 + (x % 3) * 0.25, { shadow: false }); s.root.position.set(x, -0.15, 3.1); s.tint(0xe8f0e0); }
  }

  addEnemy(e, i) {
    const d = ENEMIES[e.t]; const s = this.mk('e:' + e.t, () => d.art('normal'), d.h * (e.s || 1), {});
    const en = { def: d, id: `${this.lvl.id}:e${i}`, t: e.t, x: e.x, y: e.y ?? (d.flying ? 2.4 : 0), baseY: e.y ?? (d.flying ? 2.4 : 0), home: e.x, range: e.r ?? 3, dir: 1, speed: e.speed ?? d.speed ?? 1.4, s, state: 'patrol', stun: 0, group: e.group, boss: e.boss, ph: Math.random() * 6, once: e.once, w: d.w ?? 1.3, h: d.h * (e.s || 1), data: e };
    if (this.lvl.defeated && this.lvl.defeated.has(en.id)) { this.scene.remove(s.root); return; }
    s.root.position.set(en.x, en.y, 0.3); this.enemies.push(en);
  }

  /* ------------ per-frame ------------ */
  update(dt, active = true) {
    this.t += dt; const p = this.p;
    this.invuln = Math.max(0, this.invuln - dt); this.hammerCd = Math.max(0, this.hammerCd - dt); this.slamCd = Math.max(0, this.slamCd - dt);
    if (active && !this.locked) this.control(dt); else { p.vx *= 0.8; }
    this.physics(dt);
    this.updateHazards(dt);
    this.updateCollectibles(dt);
    this.updateEnemies(dt, active && !this.locked);
    this.updatePartner(dt);
    this.animate(dt);
    this.updateCamera(dt);
    this.updatePopups(dt);
    if (active && !this.locked) this.checkInteract();
  }

  control(dt) {
    const p = this.p;
    const ix = (isDown('right') ? 1 : 0) - (isDown('left') ? 1 : 0);
    const wantRoll = p.ground && isDown('down');
    const under = this.blocks.some((b) => b.y <= 1.9 && b.y + BLK >= 0.9 && Math.abs(p.x - b.x) < BLK / 2 + PW / 2 + 0.2);
    this.rolling = wantRoll || (p.ground && this.rolling && under); this.ph = this.rolling ? 0.9 : PH;
    this.gliding = !p.ground && p.vy < 0 && isDown('jump');
    const spd = RUN * (this.hammerT > 0 ? 0.35 : 1) * (this.rolling ? 1.2 : 1) * (this.gliding ? 1.25 : 1);
    p.vx += (ix * spd - p.vx) * damp(p.ground ? 16 : 7, dt);
    if (ix) p.face = ix;
    if (wasHit('jump')) p.buf = 0.12;
    p.buf = Math.max(0, p.buf - dt); p.coyote = Math.max(0, p.coyote - dt);
    if (p.buf > 0 && (p.ground || p.coyote > 0)) { p.vy = JUMP; p.ground = false; p.coyote = 0; p.buf = 0; sfx.jump(); this.st.burst(p.x, 0.1, 0.4, { n: 5, kind: 'puff', power: 2, size: 0.3, life: 0.4 }); this.hare.stretch = 0.25; }
    if (!isDown('jump') && p.vy > 6) p.vy *= 1 - dt * 7;
    if (wasHit('hammer') && p.ground && !this.rolling && this.hammerCd <= 0 && this.hammerT <= 0) { this.hammerT = 0.4; this.hammerCd = 0.5; this.hammerHit = false; sfx.hammer(); }
    if (wasHit('partner') && p.ground && this.slamCd <= 0 && this.slamT <= 0 && S().party.wolf.hp > 0) { this.slamT = 0.85; this.slamCd = 1.4; this.slamHit = false; this.slamX = p.x - p.face * 1.2; sfx.howl && 0; }
  }

  physics(dt) {
    const p = this.p, L = this.lvl;
    if (this.hammerT > 0) {
      const prev = this.hammerT; this.hammerT -= dt;
      if (!this.hammerHit && this.hammerT < 0.24) { this.hammerHit = true; this.doHammer(); }
    }
    if (this.slamT > 0) { this.slamT -= dt; if (!this.slamHit && this.slamT < 0.3) { this.slamHit = true; this.doSlam(); } }
    p.vy += GRAV * dt; if (this.gliding) p.vy = Math.max(p.vy, -2.8);
    // horizontal
    p.x += p.vx * dt; p.x = clamp(p.x, 0.5, L.width - 0.5);
    for (const b of this.blocks) {
      if (p.y < b.y + BLK - 0.04 && p.y + this.ph > b.y + 0.04 && Math.abs(p.x - b.x) < BLK / 2 + PW / 2) { p.x = p.x < b.x ? b.x - BLK / 2 - PW / 2 : b.x + BLK / 2 + PW / 2; p.vx = 0; }
    }
    // vertical
    const prevBottom = p.y, prevHead = p.y + this.ph; p.y += p.vy * dt;
    const wasGround = p.ground; p.ground = false;
    if (p.vy <= 0) {
      const land = (top) => { if (prevBottom >= top - 0.06 && p.y <= top) { p.y = top; p.vy = 0; p.ground = true; return true; } return false; };
      for (const [a, b] of this.ground) if (p.x > a - 0.2 && p.x < b + 0.2) land(0);
      for (const pl of this.platforms) if (Math.abs(p.x - pl.x) < pl.w / 2 + 0.2) land(pl.y);
      for (const b of this.blocks) if (Math.abs(p.x - b.x) < BLK / 2 + PW / 2 - 0.05) land(b.y + BLK);
    } else {
      for (const b of this.blocks) {
        if (Math.abs(p.x - b.x) < BLK / 2 + PW / 2 - 0.08 && prevHead <= b.y + 0.05 && p.y + this.ph >= b.y) { p.y = b.y - this.ph; p.vy = -2; this.hitBlock(b); }
      }
    }
    if (p.ground) { p.coyote = 0.1; p.safeX = p.x; if (!wasGround) { sfx.land(); this.hare.squash = 0.3; this.ev.landed && this.ev.landed(); } }
    if (p.y < -6) this.fall();
  }

  fall() {
    const p = this.p; sfx.hurt(); const h = S().party.hare; h.hp = Math.max(1, h.hp - 1);
    p.x = clamp(p.safeX - p.face * 0.5, 0.5, this.lvl.width - 0.5); p.y = 2; p.vy = 0; p.vx = 0; this.invuln = 1.4; this.ev.fell && this.ev.fell();
  }

  hitBlock(b) {
    b.bump = 0.25;
    if (b.kind === 'q') { sfx.bump(); this.useBlock(b); }
    else if (b.kind === 'brick') { sfx.bump(); }
    else if (b.kind === 'save') { sfx.bump(); this.ev.save && this.ev.save(b); }
    else sfx.bump();
  }
  useBlock(b) {
    if (b.kind !== 'q') return;
    b.kind = 'used'; S().blocks[b.id] = true; b.spr.setTex('blk:used', () => A.drawBlock('used'));
    this.st.impact(b.x, b.y + BLK + 0.2, 0.4);
    this.ev.blockItem && this.ev.blockItem(b);
  }

  doHammer() {
    const p = this.p, fx = p.x + p.face * 1.1;
    this.st.impact(fx + p.face * 0.5, 0.9, 0.5, 0xfff6e3); this.st.shake = Math.max(this.st.shake, 0.25);
    for (const b of this.blocks) {
      if (b.kind === 'brick' && Math.abs(b.x - fx) < 1.3 && b.y < 2.5 && b.y + BLK > 0) { this.breakBlock(b); }
      if (b.kind === 'q' && Math.abs(b.x - fx) < 1.3 && b.y < 1.5) { this.hitBlock(b); }
      if (b.kind === 'save' && Math.abs(b.x - fx) < 1.3 && b.y < 1.5) { this.hitBlock(b); }
    }
    for (const e of this.enemies) {
      if (e.state === 'dead') continue;
      if (!e.def.flying && Math.abs(e.x - fx) < 1.2 + e.w / 2 && e.y < 1.2) { sfx.hit(); this.st.impact(e.x, 1.2, 0.6); this.ev.battle(e, 'player'); return; }
    }
  }
  breakBlock(b) {
    sfx.poof(); this.st.burst(b.x, b.y + 0.6, 0.4, { n: 10, kind: 'confetti', color: 0xd98a5a, power: 5 }); this.scene.remove(b.spr.root);
    this.blocks.splice(this.blocks.indexOf(b), 1); S().coins += 1; this.pop('+1', b.x, b.y + 1.6, '#ffd23f');
  }
  breakCrack(b) { sfx.poof(); this.st.burst(b.x, b.y + 0.6, 0.4, { n: 12, kind: 'confetti', color: 0xd9a066, power: 6 }); this.scene.remove(b.spr.root); this.blocks.splice(this.blocks.indexOf(b), 1); this.ev.crackBroken && this.ev.crackBroken(b); }
  doSlam() {
    const sx = this.slamX, who = S().partner; sfx.slam(); this.st.shake = who === 'lifeguard' ? 1.0 : 0.5; this.st.burst(sx, 0.2, 0.6, { n: 14, kind: 'puff', power: 4, size: 0.5 });
    if (who === 'fox') { let n = 0; for (const h of this.hiddenDefs) { const hx = h.x ?? (h.x0 + h.x1) / 2; if (!h.shown && h.id.startsWith('ink') && Math.abs(hx - sx) < 16) { this.revealId(h.id); n++; } } if (n) this.pop('Revealed!', sx, 3.4, '#9ad0ff'); }
    let blocked = false;
    for (const b of [...this.blocks]) {
      if (b.kind === 'crack' && Math.abs(b.x - sx) < 3.4 && b.y < 3) { if (who === 'lifeguard') this.breakCrack(b); else blocked = true; }
      if (b.kind === 'brick' && who === 'hedgehog' && Math.abs(b.x - (sx + this.p.face * 2)) < 3.4 && b.y < 3) this.breakBlock(b);
    }
    if (blocked) this.ev.hint && this.ev.hint('needHippo');
    for (const e of this.enemies) if (e.state === 'patrol' && Math.abs(e.x - sx) < 3.6 && e.y < 3.2) { e.state = 'stunned'; e.stun = 4; this.pop('Dizzy!', e.x, e.y + e.h + 0.3, '#ffd23f'); }
  }

  updateHazards(dt) {
    const p = this.p;
    for (const h of this.hazards) {
      const a = h.amp * Math.sin(this.t * h.speed + h.ph); h.g.rotation.z = a;
      const bx = h.x + Math.sin(a) * h.len * 0.72, by = h.py - Math.cos(a) * h.len * 0.72;
      if (this.invuln <= 0 && !this.locked && Math.hypot(p.x - bx, (p.y + this.ph / 2) - by) < 1.35) {
        const st = S().party.hare; st.hp = Math.max(1, st.hp - 1); this.invuln = 1.6; p.vy = 7; p.vx = (p.x < bx ? -1 : 1) * 7; sfx.hurt(); this.st.impact(p.x, p.y + 1, 1); this.st.shake = 0.7; this.ev.hurt && this.ev.hurt();
      }
    }
  }

  updateCollectibles(dt) {
    const p = this.p, cx = p.x, cy = p.y + this.ph / 2;
    for (const c of this.coins) { if (c.got) continue; c.s.body.rotation.y = this.t * 4 + c.ph; c.s.body.position.y = Math.sin(this.t * 3 + c.ph) * 0.1; if (Math.abs(c.x - cx) < 0.75 && Math.abs(c.y + 0.3 - cy) < 1.2) { c.got = true; this.scene.remove(c.s.root); S().coins++; sfx.coin(); this.pop('+1', c.x, c.y + 0.9, '#ffd23f'); this.st.impact(c.x, c.y + 0.3, 0.5); this.ev.collect && this.ev.collect('coin'); } }
    for (const c of this.carrots) { if (c.got) continue; c.s.body.rotation.z = Math.sin(this.t * 3 + c.ph) * 0.2; c.s.body.position.y = Math.sin(this.t * 3 + c.ph) * 0.1; if (Math.abs(c.x - cx) < 0.8 && Math.abs(c.y + 0.4 - cy) < 1.3) { c.got = true; this.scene.remove(c.s.root); S().carrots[c.id] = 1; sfx.carrot(); this.pop('Golden Carrot!', c.x, c.y + 1.2, '#ff9446'); this.st.burst(c.x, c.y + 0.4, 0.5, { n: 18, kind: 'star', power: 7, life: 0.8 }); this.ev.collect && this.ev.collect('carrot'); } }
  }

  updateEnemies(dt, active) {
    const p = this.p;
    for (const e of this.enemies) {
      if (e.state === 'dead') continue;
      e.ph += dt;
      if (e.state === 'stunned') { e.stun -= dt; e.s.body.rotation.z = Math.sin(this.t * 20) * 0.1; if (e.stun <= 0) { e.state = 'patrol'; e.s.body.rotation.z = 0; } }
      else {
        e.x += e.dir * e.speed * dt; if (Math.abs(e.x - e.home) > e.range) { e.dir *= -1; e.x = e.home + Math.sign(e.x - e.home) * e.range; }
        if (e.def.flying) e.y = e.baseY + Math.sin(e.ph * 2.4) * 0.35; else e.s.body.position.y = Math.abs(Math.sin(e.ph * 5)) * 0.1;
        e.s.face(e.dir);
        // chase when the player is close
        const dx = p.x - e.x; if (!e.def.static && Math.abs(dx) < 4.5 && Math.abs(p.y - e.y) < 3 && e.def.chase) { e.x += Math.sign(dx) * e.speed * 0.7 * dt; e.s.face(Math.sign(dx) || 1); }
      }
      e.s.root.position.set(e.x, e.def.flying ? e.y : 0, 0.3); e.s.update(dt);
      if (e.def.flying) e.s.root.position.y = e.y;
      if (!active || this.invuln > 0) continue;
      const hx = Math.abs(p.x - e.x) < PW / 2 + e.w / 2 - 0.1, top = (e.def.flying ? e.y : 0) + e.h * 0.9;
      if (hx && p.y < top && p.y + this.ph > (e.def.flying ? e.y : 0) + 0.1) {
        const stomp = p.vy < -1 && p.y > top - 0.9 && !e.def.spiked;
        if (stomp) { p.vy = 9; sfx.hit(); this.st.impact(e.x, top, 0.7); this.ev.battle(e, 'player'); }
        else if (e.state === 'stunned') this.ev.battle(e, 'player');
        else this.ev.battle(e, 'enemy');
        return;
      }
    }
  }

  updatePartner(dt) {
    const p = this.p; this.trail.push({ x: p.x, y: p.y, f: p.face, t: this.t }); if (this.trail.length > 200) this.trail.shift();
    const want = this.t - 0.5; let a = this.trail[0];
    for (const s of this.trail) { if (s.t <= want) a = s; else break; }
    const w = this.wolf; const wx = a.x - a.f * 0.9;
    if (this.slamT > 0) {
      const u = 1 - this.slamT / 0.85, up = Math.sin(clamp(u / 0.65, 0, 1) * Math.PI) * 2.6;
      w.root.position.set(lerp(wx, this.slamX, ease.out(clamp(u / 0.6, 0, 1))), up * (u < 0.65 ? 1 : 0), 0.5); w.body.rotation.z = u < 0.65 ? -0.3 * a.f : 0; w.body.scale.set(1, u > 0.65 ? 1 - Math.sin((u - 0.65) / 0.35 * Math.PI) * 0.35 : 1 + Math.sin(u * 4) * 0.1, 1);
    } else { w.root.position.set(wx, a.y, 0.2); w.body.rotation.z = 0; w.body.scale.set(1, 1, 1); }
    const moving = Math.abs(p.vx) > 1; w.face(a.f);
    w.body.position.y = (this.slamT > 0 ? 0 : (a.y <= 0.05 && moving ? Math.abs(Math.sin(this.t * 12 + 1)) * 0.12 : 0));
    w.update(dt);
    w.root.visible = S().party.wolf.hp > 0 || true;
  }

  animate(dt) {
    const p = this.p, h = this.hare, moving = Math.abs(p.vx) > 0.8 && p.ground;
    h.root.position.set(p.x, p.y, 0.4); h.face(p.face);
    h.squash = Math.max(0, (h.squash || 0) - dt * 2.2); h.stretch = Math.max(0, (h.stretch || 0) - dt * 2.2);
    const sq = h.squash || 0, st = h.stretch || 0;
    h.body.scale.set(1 + sq * 0.5 - st * 0.3, 1 - sq * 0.45 + st * 0.5, 1);
    h.body.position.y = moving ? Math.abs(Math.sin(this.t * 13)) * 0.14 : 0;
    h.body.rotation.z = moving ? Math.sin(this.t * 13) * 0.07 : (!p.ground ? clamp(-p.vx * 0.02, -0.15, 0.15) : 0);
    if (this.hammerT > 0) { const u = 1 - this.hammerT / 0.4; h.body.rotation.z = (u < 0.35 ? -u * 1.1 : (u - 0.35) * 2.4 - 0.39) * -p.face; }
    if (this.invuln > 0) h.root.visible = Math.floor(this.t * 16) % 2 === 0; else h.root.visible = true;
    if (this.rolling) { h.body.scale.set(1.15, 0.5, 1); h.body.rotation.z = -this.t * 16 * p.face; h.body.position.y = 0.55; }
    else if (this.gliding) { h.body.rotation.z = -0.35 * p.face; h.body.scale.set(1.15, 0.9, 1); }
    h.update(dt);
    for (const b of this.blocks) { if (b.bump > 0) { b.bump -= dt; b.spr.root.position.y = b.y + Math.sin((1 - b.bump / 0.25) * Math.PI) * 0.35; } }
    for (const n of this.npcs) { n.s.body.position.y = Math.abs(Math.sin(this.t * 2 + n.x)) * 0.05; n.s.update(dt); }
    for (const sg of this.signs) sg.s.update(dt);
  }

  updateCamera(dt) {
    const st = this.st, half = st.visibleHalfWidth(), L = this.lvl;
    const target = clamp(this.p.x + this.p.face * 1.4, half, Math.max(half, L.width - half));
    this.camX = lerp(this.camX, target, damp(5, dt)); st.camX = this.camX;
    st.camY = lerp(st.camY, 3.5 + Math.max(0, this.p.y - 3.5) * 0.5, damp(4, dt));
  }

  /* ------------ interaction ------------ */
  nearby() {
    const p = this.p; let best = null, bd = 1.9;
    for (const o of [...this.npcs, ...this.doors, ...this.signs, ...this.fasteners.filter((f) => !f.used)]) { const d = Math.abs(o.x - p.x); if (d < bd && p.y < 1.5) { bd = d; best = o; } }
    return best;
  }
  checkInteract() {
    const o = this.nearby(); this.near = o;
    if (o && wasHit('talk') && this.p.ground) { this.ev.interact(o); }
  }
  /* ------------ popups ------------ */
  pop(text, x, y, color = '#fff') {
    const sp = textSprite(text, { color, size: 58, w: Math.max(1.8, text.length * 0.34) }); sp.position.set(x, y, 1.2); this.scene.add(sp); this.pops.push({ sp, t: 0, y });
  }
  updatePopups(dt) {
    for (let i = this.pops.length - 1; i >= 0; i--) { const q = this.pops[i]; q.t += dt; q.sp.position.y = q.y + q.t * 1.6; q.sp.material.opacity = clamp(1.6 - q.t, 0, 1); if (q.t > 1.6) { this.scene.remove(q.sp); q.sp.material.map.dispose(); q.sp.material.dispose(); this.pops.splice(i, 1); } }
  }

  removeEnemy(e, remember = true) {
    e.state = 'dead'; this.scene.remove(e.s.root);
    if (remember && (e.once || e.boss)) { this.lvl.defeated = this.lvl.defeated || new Set(); this.lvl.defeated.add(e.id); }
  }
  teleport(x) { this.p.x = x; this.p.y = 0; this.p.vx = this.p.vy = 0; this.camX = x; for (const s of this.trail) { s.x = x; s.y = 0; } }
  addCoins() { /* convenience for tests */ }
}
