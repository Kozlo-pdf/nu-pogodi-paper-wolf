import { Stage, PaperSprite, THREE, THEMES, addGround, lerp, ease } from './paper.js';
import * as A from './art.js';
import { World } from './world.js';
import { Battle } from './battle.js';
import { LEVELS, BOSS_NEXT, SCRIPT, SHOP, ENEMIES, PARTNERS } from './data.js';
import { S, game, newGame, loadGame, hasSave, saveGame, ITEMS, addItem, healAll, flag, setFlag, carrotCount, eraseSave, SP_PER_LEVEL } from './state.js';
import { ui, say, pick, banner, toast, prompt, hudBuild, hudUpdate, hudShow, irisClose, irisOpen, updateModal, flash, uiTick, after, tween } from './ui.js';
import { pollPad, wasHit, endFrame, isDown, anyHit, padConnected } from './input.js';
import { sfx, unlock, playMusic, stopMusic, setVolumes, getVolumes, toggleMute } from './audio.js';

const $ = (id) => document.getElementById(id);
const stage = new Stage($('c'));
let world = null, mode = 'title', flow = false, battle = null, titleScene = null;
const params = new URLSearchParams(location.search);
if (params.has('auto')) window.__PQ_AUTO = true;

/* =====================================================================
   World events
   ===================================================================== */
const ev = {
  battle: (en, first) => onEncounter(en, first),
  interact: (o) => onInteract(o),
  save: () => onSave(),
  blockItem: (b) => onBlockItem(b),
  collect: () => hudUpdate(),
  crackBroken: () => { toast('The wall crumbles!'); },
  fell: () => { hudUpdate(); toast('Whoops! Fell off the page. (-1 HP)'); },
  landed: () => {},
  hint: (k) => toast(SCRIPT[k].replace(/\*/g, ''), 3200),
  hurt: () => { hudUpdate(); toast('Ouch! Wrecking ball! (-1 HP)', 1400); },
};

function onSave() {
  healAll(); hudUpdate(); saveGame(); sfx.save(); stage.burst(world.p.x, 1.5, 1, { n: 20, kind: 'star', color: 0x9ad0ff, power: 7, life: 1 });
  toast('Game saved! HP and FP restored.', 2200);
}
function onBlockItem(b) {
  const it = b.item; let txt;
  if (!it || it === 'coins') { S().coins += 5; txt = '+5 coins'; sfx.coin(); for (let i = 0; i < 5; i++) world.pop('+1', b.x + (i - 2) * 0.3, b.y + 2 + i * 0.25, '#ffd23f'); }
  else { addItem(it); txt = ITEMS[it].name; sfx.carrot(); world.pop(ITEMS[it].icon + ' ' + ITEMS[it].name, b.x, b.y + 2.2, '#fff6e3'); toast(`Got ${ITEMS[it].name}!`, 1600); }
  hudUpdate();
}

/* =====================================================================
   Level flow
   ===================================================================== */
async function enterLevel(id, at = null, { chapterBanner = false } = {}) {
  flow = true; if (world) world.locked = true;
  if (world || mode === 'title') await irisClose(380);
  prompt(null);
  const lvl = LEVELS[id]; world = new World(stage, lvl, ev); mode = 'world';
  if (at != null) world.teleport(at);
  S().where = { screen: id, x: world.p.x }; hudBuild(); hudUpdate(); hudShow(true); $('title').classList.add('hidden');
  playMusic(lvl.music); world.locked = true;
  stage.update(0.016); stage.render();
  await irisOpen(520);
  if (chapterBanner || lvl.title) banner(lvl.title, '', 1300);
  flow = false; world.locked = false;
  if (id === 'street' && !flag('intro') && mode === 'world') await runIntro();
}

async function onInteract(o) {
  if (flow) return; flow = true; world.locked = true; prompt(null); sfx.select();
  try {
    if (o.kind === 'door') { sfx.door(); await enterLevel(o.to, o.at); }
    else if (o.kind === 'fastener') { if (!o.used) { o.used = true; sfx.slam(); o.s.body.rotation.z = 0.8; world.reveal(o.reveals); toast('The dock unfolds!', 2200); } }
    else if (o.kind === 'npc') {
      if (o.id === 'mole') await shop();
      else if (o.join) await joinPartner(o);
      else if (o.id === 'pigs') await pigsGame(o);
    } else if (o.kind === 'sign') { const t = SCRIPT.signs[o.id] || '...'; await say([{ who: 'narrator', text: t }]); }
  } finally { flow = false; if (world) world.locked = false; }
}

async function joinPartner(o) {
  const id = o.join; if (S().partners.includes(id)) return;
  await say(SCRIPT[id]); S().partners.push(id); S().partner = id; hudBuild(); hudUpdate(); world.refreshPartner(); sfx.win();
  world.npcs.splice(world.npcs.indexOf(o), 1); world.scene.remove(o.s.root);
}

/* ---------- rhythm mini-game (the pigs' picnic) ---------- */
async function rhythm() {
  const el = document.createElement('div'); el.className = 'cmd'; el.style.left = '50%'; el.style.top = '42%';
  el.innerHTML = '<div class="t">Z!</div><div class="ring"><div class="out"></div><div class="in"></div></div><div class="gauge"><div class="fill" style="width:0%"></div></div>'; document.body.appendChild(el);
  const inn = el.querySelector('.in'), fill = el.querySelector('.fill'), N = 8; let hits = 0;
  for (let i = 0; i < N; i++) {
    let hit = -1; const dur = 0.95 - i * 0.03;
    await tween(dur, (u) => { const size = 190 - u * 78; inn.style.width = inn.style.height = size + 'px'; if (hit < 0 && (wasHit('act') || (window.__PQ_AUTO && u >= 0.88))) hit = Math.abs(u - 0.88); });
    if (hit >= 0 && hit <= 0.13) { hits++; sfx.carrot(); } else sfx.miss();
    fill.style.width = ((i + 1) / N * 100) + '%'; await after(160);
  }
  el.remove(); return hits;
}
async function pigsGame(o) {
  if (o.done) { await say([{ who: 'narrator', text: 'The pigs are happily picnicking. Nothing more to see here.' }]); return; }
  await say(SCRIPT.pigsIntro); const hits = await rhythm();
  if (hits >= 5) { addItem('kefir'); await say(SCRIPT.pigsDone); toast('Got Kefir!'); } else { S().coins += 3; await say(SCRIPT.pigsFail); }
  o.done = true; hudUpdate();
}

/* ---------- shop ---------- */
async function shop() {
  await say(SCRIPT.moleShop.map((t) => ({ who: 'mole', text: t })));
  for (;;) {
    const items = SHOP.map((id) => ({ id, label: `${ITEMS[id].icon} ${ITEMS[id].name}`, right: `${ITEMS[id].price}🪙`, desc: `${ITEMS[id].desc}  (You have ${S().items[id] || 0}.)`, disabled: S().coins < ITEMS[id].price }));
    items.push({ id: null, label: 'Leave', desc: 'Come back anytime!' });
    const i = await pick({ title: `Merchant Mole   🪙 ${S().coins}`, items, pos: 'side' });
    if (i < 0 || items[i].id === null) break;
    const it = ITEMS[items[i].id]; S().coins -= it.price; addItem(items[i].id); sfx.buy(); hudUpdate(); toast(`Bought ${it.name}!`, 1000);
  }
  await say([{ who: 'mole', text: 'Pleasure doing business! Mind the Wolf: he *always* tries to haggle.' }]);
}

/* =====================================================================
   Encounters & battles
   ===================================================================== */
async function onEncounter(en, first) {
  if (flow) return; flow = true; world.locked = true; prompt(null);
  const lvl = world.lvl;
  try {
    if (en.boss) await say(SCRIPT.bossIntro[en.t]);
    else if (!flag('firstfight')) { setFlag('firstfight'); await say(SCRIPT.firstFight); }
    else { sfx.alert(); world.pop('!', en.x, en.def.h + 0.8, '#ff4a4a'); }
    const p = stage.project(en.x, 1.2, 0.3); await irisClose(420, p.x / innerWidth * 100, p.y / innerHeight * 100);
    const snap = stage.snapshot(); stopMusic(); mode = 'battle';
    battle = new Battle(stage, { enemies: [en.t, ...(en.group || [])], first, boss: !!en.boss, bg: lvl.bg });
    hudShow(true); hudUpdate();
    stage.update(0.016); stage.render(); await irisOpen(450);
    const res = await battle.run();
    let reward = null;
    if (res === 'win') { await battle.victory(); reward = 'win'; }
    else if (res === 'lose') { stopMusic(); playMusic('gameover'); sfx.lose(); await banner('GAME OVER', '', 1500); }
    await irisClose(450);
    battle.dispose(); battle = null; stage.restore(snap); mode = 'world';
    stage.update(0.016);
    if (res === 'lose') { await gameOver(); return; }
    // back to the world
    playMusic(lvl.music);
    if (res === 'win') {
      world.removeEnemy(en, true); healSmall();
      hudUpdate();
      if (en.boss) { await irisOpen(450); await bossWon(en); return; }
    } else if (res === 'flee') { en.state = 'stunned'; en.stun = 3; world.invuln = 2.2; world.p.x -= 1.5; }
    hudUpdate(); await irisOpen(450);
  } finally { if (mode === 'world') { flow = false; if (world) world.locked = false; } }
}
function healSmall() { for (const c of Object.values(S().party)) if (c.hp > 0) c.hp = Math.min(c.maxHp, c.hp + 0); }

async function bossWon(en) {
  await say(SCRIPT.bossWin[en.t] || []);
  stopMusic(); playMusic('victory'); sfx.win(); flash(); healAll(); hudUpdate(); saveGame();
  const next = BOSS_NEXT[en.t];
  if (!next) { flow = true; await ending(); return; }
  await banner('PART COMPLETE!', '', 1800);
  flow = true; await enterLevel(next, 3);
}

async function gameOver() {
  const i = await pick({ title: 'Oh no! Try again?', cancel: false, items: [
    { label: 'Retry from the start of this page', desc: 'Return to the beginning of the level with some health.' },
    { label: 'Load last save', desc: 'Return to your last saved game.', disabled: !hasSave() },
    { label: 'Back to the title', desc: 'Quit to the title screen.' }] });
  if (i === 0) { for (const c of Object.values(S().party)) { c.hp = Math.max(c.hp, Math.ceil(c.maxHp / 2)); c.fp = Math.max(c.fp, 2); } const id = world.lvl.id; world.lvl.defeated = new Set([...(world.lvl.defeated || [])]); flow = false; await enterLevel(id, null); }
  else if (i === 1) { loadGame(); const w = S().where; flow = false; hudBuild(); await enterLevel(w.screen, w.x); }
  else { flow = false; await toTitle(); }
}

/* =====================================================================
   Story
   ===================================================================== */
async function runIntro() {
  flow = true; world.locked = true; setFlag('intro');
  const L = SCRIPT.intro;
  await say(L.slice(0, 3));
  sfx.page(); flash(); stage.shake = 1.4; stage.burst(world.p.x, 3, 1, { n: 40, kind: 'confetti', power: 9, life: 1.8, color: 0xfff6e3 });
  await say(L.slice(3));
  flow = false; world.locked = false; toast('Tip: hold Jump in mid-air to glide!', 3500);
}

async function ending() {
  flow = true; world.locked = true; stopMusic(); playMusic('ending');
  await say(SCRIPT.ending);
  stage.burst(world.p.x, 4, 1, { n: 80, kind: 'confetti', power: 9, life: 2.6, size: 0.3 }); sfx.win(); saveGame();
  await banner('THE END', 'Нý, погоди!', 2800);
  await say(SCRIPT.credits.map((t) => ({ who: 'narrator', text: t })));
  flow = false; await toTitle();
}

/* =====================================================================
   Pause menu
   ===================================================================== */
async function openPause() {
  if (flow) return; flow = true; world.locked = true; sfx.select(); prompt(null);
  try {
    for (;;) {
      const s = S(), P = PARTNERS[s.partner];
      const i = await pick({ title: 'Paused', pos: 'side', items: [
        { label: '🎒 Items', desc: 'Use items from your bag.' }, { label: '🤝 Partner', right: P.name, desc: P.ability },
        { label: '⭐ Status', desc: 'Check your party.' }, { label: '💾 Save', desc: 'Save your game right now.' }, { label: '🔊 Options', desc: 'Volume settings.' }, { label: '❓ How to play', desc: 'Controls reminder.' }, { label: '🏠 Title screen', desc: 'Return to the title.' }] });
      if (i < 0) break;
      if (i === 0) await itemsMenu();
      else if (i === 1) {
        const items = s.partners.map((id) => ({ label: PARTNERS[id].name, right: id === s.partner ? '(active)' : '', desc: `${PARTNERS[id].ability}  Passive: ${PARTNERS[id].passive}` }));
        const j = await pick({ title: 'Choose your partner', pos: 'side', items });
        if (j >= 0 && s.partners[j] !== s.partner) { s.partner = s.partners[j]; hudBuild(); hudUpdate(); world.refreshPartner(); sfx.equip(); toast(`${PARTNERS[s.partner].name} is now your partner!`, 1800); }
      }
      else if (i === 2) await say([{ who: 'narrator', text: `*Wolf*  HP ${s.party.hare.hp}/${s.party.hare.maxHp}  FP ${s.party.hare.fp}/${s.party.hare.maxFp}\n*${P.name}*  HP ${s.party.wolf.hp}/${s.party.wolf.maxHp}  FP ${s.party.wolf.fp}/${s.party.wolf.maxFp}\n*Level ${s.level}*  (${s.sp}/${SP_PER_LEVEL} SP)   Attack +${s.atkBonus}\n🪙 ${s.coins}   🥕 ${carrotCount()}   Partners ${s.partners.length}/3` }]);
      else if (i === 3) { saveGame(); sfx.save(); toast('Game saved!'); }
      else if (i === 4) await optionsMenu();
      else if (i === 5) await howTo();
      else if (i === 6) { const c = await pick({ title: 'Return to the title? (Unsaved progress is lost)', items: [{ label: 'Yes, quit' }, { label: 'No, keep playing' }] }); if (c === 0) { flow = false; await toTitle(); return; } }
    }
  } finally { if (mode === 'world') { flow = false; if (world) world.locked = false; } }
}
async function itemsMenu() {
  for (;;) {
    const ids = Object.keys(S().items).filter((id) => ['hp', 'fp', 'both'].includes(ITEMS[id].kind));
    if (!ids.length) { await say([{ who: 'narrator', text: 'No usable items right now.' }]); return; }
    const i = await pick({ title: 'Items', pos: 'side', items: ids.map((id) => ({ label: `${ITEMS[id].icon} ${ITEMS[id].name}`, right: '×' + S().items[id], desc: ITEMS[id].desc })) });
    if (i < 0) return; const it = ITEMS[ids[i]];
    const j = await pick({ title: `Use ${it.name} on…`, pos: 'side', items: ['hare', 'wolf'].map((w) => ({ label: w === 'hare' ? 'Wolf' : PARTNERS[S().partner].name, right: `HP ${S().party[w].hp}/${S().party[w].maxHp}  FP ${S().party[w].fp}/${S().party[w].maxFp}` })) });
    if (j < 0) continue; const c = S().party[['hare', 'wolf'][j]];
    if (c.hp <= 0) { sfx.deny(); continue; }
    if (it.kind === 'hp' || it.kind === 'both') c.hp = Math.min(c.maxHp, c.hp + it.amt); if (it.kind === 'fp' || it.kind === 'both') c.fp = Math.min(c.maxFp, c.fp + (it.fp || it.amt));
    addItem(ids[i], -1); sfx.heal(); hudUpdate();
  }
}
async function optionsMenu() {
  for (;;) {
    const v = getVolumes();
    const i = await pick({ title: 'Options', pos: 'side', items: [{ label: `Music volume: ${Math.round(v.music * 100)}%`, desc: 'Press confirm to change.' }, { label: `Effects volume: ${Math.round(v.sfx * 100)}%`, desc: 'Press confirm to change.' }, { label: 'Back' }] });
    if (i < 0 || i === 2) return;
    const nv = (x) => (x >= 1 ? 0 : Math.round((x + 0.25) * 100) / 100);
    if (i === 0) setVolumes(nv(v.music), v.sfx); else { setVolumes(v.music, nv(v.sfx)); sfx.coin(); }
    try { localStorage.setItem('pq.vol', JSON.stringify(getVolumes())); } catch (e) { /* ignore */ }
  }
}
async function howTo() {
  await say([{ who: 'narrator', text: '*Moving:* ← → (or A D)   *Jump:* Z / Space (*hold in mid-air to glide!*)\n*Guitar smash:* X   *Roll up:* hold ↓ (squeeze under low beams)\n*Partner ability:* C   *Talk / enter / pull:* ↑   *Menu:* Enter' },
    { who: 'narrator', text: '*Partners:* Hedgehog (spike roll), Lifeguard (smashes crates), Fox (reveals invisible ink). Switch in the pause menu!' },
    { who: 'narrator', text: '*In battle:* pick a move and time your button press. *Z* just as a hit lands to *Guard*, *X* at the last instant to *Super Guard*. Hit enemies first to strike first!' }]);
}

/* =====================================================================
   Title screen
   ===================================================================== */
async function toTitle() {
  mode = 'title'; flow = true; stopMusic(); hudShow(false); prompt(null);
  await irisClose(300);
  const sc = stage.newScene(0xbfe3ff); stage.addBackdrop('park', { factor: 0.1 }); const th = THEMES.park; addGround(sc, -30, 30, th);
  const mk = (k, f, h, x, z = 0) => { const s = new PaperSprite(k, f, h); s.root.position.set(x, 0, z); sc.add(s.root); return s; };
  for (const [x, v, z, hh] of [[-9, 0, -5, 6], [9, 1, -6, 5.5], [-14, 2, -7, 5]]) mk('tree' + v, () => A.drawTree(v), hh, x, z).shadow.visible = false;
  const tent = mk('tent0', () => A.drawTent(), 5.4, 6.5, -8); tent.shadow.visible = false;
  const hare = mk('wolf', () => A.drawWolf(), 3.2, -4.4, 1.2), wolf = mk('hare', () => A.drawHare(), 3.0, 4.4, 1.2); wolf.face(-1);
  stage.camX = 0; stage.camY = 3.0; stage.zoom = 1.0;
  stage.updaters.push((dt) => { const t = stage.time; hare.body.position.y = Math.abs(Math.sin(t * 2.2)) * 0.15; wolf.body.position.y = Math.abs(Math.sin(t * 2.2 + 1)) * 0.12; hare.body.rotation.z = Math.sin(t * 2.2) * 0.06; wolf.body.rotation.z = Math.sin(t * 2.2 + 1) * 0.05; hare.update(dt); wolf.update(dt); if (Math.random() < dt * 1.2) stage.burst(Math.random() * 16 - 8, 7 + Math.random() * 2, 0, { n: 1, kind: 'confetti', power: 0.4, life: 5, size: 0.28 }); });
  world = null;
  const t = $('title'); t.classList.remove('hidden'); t.innerHTML = '<div class="logo"><h1>PAPER WOLF</h1><h2>THE THOUSAND-YEAR CHASE</h2></div><div class="opts card"></div><div class="hint">Z / Space / ✕ to choose · arrows or D-pad to move · F11 for fullscreen</div>';
  playMusic('title'); await irisOpen(500); flow = false;
  for (;;) {
    const items = []; if (hasSave()) items.push({ k: 'continue', label: 'Continue' });
    items.push({ k: 'new', label: 'New Game' }, { k: 'how', label: 'How to Play' }, { k: 'opt', label: 'Options' });
    const i = await pick({ items, cancel: false, into: t.querySelector('.opts') });
    const k = items[i].k;
    if (k === 'how') { await howTo(); continue; }
    if (k === 'opt') { await optionsMenu(); continue; }
    if (k === 'new' && hasSave()) { const c = await pick({ title: 'Start over? Your save will be replaced.', items: [{ label: 'Yes, new game' }, { label: 'Cancel' }], into: t.querySelector('.opts') }); if (c !== 0) continue; }
    stage.zoom = 1; t.classList.add('hidden'); flow = true; $('title').innerHTML = '';
    if (k === 'continue') { loadGame(); game.started = true; hudBuild(); const w = S().where; await enterLevel(LEVELS[w.screen] ? w.screen : 'street', w.x); }
    else { newGame(); hudBuild(); await enterLevel('street', 3); }
    return;
  }
}

/* =====================================================================
   Loop
   ===================================================================== */
const clock = new THREE.Clock();
function updatePrompt() {
  if (mode !== 'world' || !world || flow || ui.modal) { prompt(null); return; }
  const o = world.near; if (!o) { prompt(null); return; }
  const lab = o.kind === 'door' ? (o.label || 'Enter') : o.kind === 'npc' ? 'Talk' : 'Read';
  const p = stage.project(o.x, o.kind === 'door' ? 3.7 : 3.4, 0); prompt('▲ ' + lab, p.x, p.y);
}
function tick(dt) {
  pollPad(); if (anyHit()) unlock();
  uiTick(dt);
  if (ui.modal) updateModal(dt);
  else if (mode === 'world' && world && !flow) { if (wasHit('menu') || wasHit('pause')) openPause(); }
  if (mode === 'world' && world) { world.update(dt, !ui.modal && !flow); S().playtime += dt; }
  stage.update(dt); updatePrompt(); stage.render(); endFrame();
}
function frame() { requestAnimationFrame(frame); tick(Math.min(0.05, clock.getDelta())); }

addEventListener('gamepadconnected', (e) => toast('🎮 Controller connected: ' + e.gamepad.id.split('(')[0].trim(), 3000));
addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat) { const m = toggleMute(); toast(m ? 'Sound off' : 'Sound on', 900); } });
try { const v = JSON.parse(localStorage.getItem('pq.vol')); if (v) setVolumes(v.music, v.sfx); } catch (e) { /* defaults */ }

/* ---------- boot ---------- */
window.__pq = { ui, tick, step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) tick(dt); }, stage, S, game, get world() { return world; }, get battle() { return battle; }, get mode() { return mode; }, get flow() { return flow; }, enterLevel, onEncounter, LEVELS, ENEMIES, say, pick,
  async start(id = 'street', x = null) { ui.modal = null; $('title').classList.add('hidden'); newGame(); hudBuild(); flow = false; await enterLevel(id, x); }, healAll, addItem };
async function run(n, dt = 1 / 60) { for (let i = 0; i < n; i++) { tick(dt); for (let k = 0; k < 6; k++) await Promise.resolve(); } }
window.__pq.run = run;
if (params.has('manual')) { /* tests drive tick() themselves */ } else frame();
(async () => {
  if (params.has('cheat')) { newGame(); S().partners = ['hedgehog', 'lifeguard', 'fox']; S().coins = 200; for (const k of Object.keys(ITEMS)) S().items[k] = 5; setFlag('intro'); }
  if (params.has('goto')) { if (!params.has('cheat')) { newGame(); setFlag('intro'); } hudBuild(); await enterLevel(params.get('goto'), params.has('x') ? +params.get('x') : null); }
  else if (!(params.has('manual') && (params.get('s') || '') !== 'title')) await toTitle();
})();
