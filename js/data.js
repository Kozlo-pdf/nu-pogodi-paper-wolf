import * as A from './art.js';

/* ---------------- props ---------------- */
export function propArt(t, v = 0) {
  switch (t) {
    case 'tree': return ['tree' + v, () => A.drawTree(v), 6.2];
    case 'bush': return ['bush', () => A.drawBush(), 1.6];
    case 'house': return ['house' + v, () => A.drawHouse(['#d98a5a', '#8fb8d8', '#d8c068'][v % 3]), 5.2];
    case 'tent': return ['tent' + v, () => (v % 2 ? A.drawTent('#4a7ac2', '#fff6e3') : A.drawTent()), 5.0];
    case 'fence': return ['fence', () => A.drawFence(), 1.3];
    case 'balloon': return ['balloon', () => A.drawBalloonProp(), 2.4];
    case 'well': return ['well', () => A.drawWell(), 2.8];
    case 'mushroom': return ['mush' + v, () => A.drawMushroomProp(['#ee4a52', '#9a6ad8', '#f0a030'][v % 3]), 3.4];
    default: return ['bush', () => A.drawBush(), 1.2];
  }
}

/* ---------------- party ---------------- */
export const PARTNERS = {
  hedgehog: { name: 'Hedgehog', speaker: 'hedgehog', art: (m) => A.drawHedgehog(m), h: 1.5, ability: 'Spike Roll (C): dashes ahead, stuns foes, breaks bricks',
    moves: { claw: ['Spike Roll', 'Roll into a foe and mash *Z* for a spiky frenzy!'], howl: ['Quill Volley', 'Quills fly at ALL enemies. Press *Z* as the ring closes.'], slam: ['Needle Drop', 'Drop onto grounded enemies. Press *Z* on impact.'] }, passive: 'Counters any attacker you Guard.' },
  lifeguard: { name: 'Lifeguard', speaker: 'lifeguard', art: (m) => A.drawLifeguard(m), h: 2.2, ability: 'Belly Flop (C): ground-pounds crates and stuns foes',
    moves: { claw: ['Belly Bump', 'Bump a foe and mash *Z* for extra hits.'], howl: ['Water Spout', 'A fountain hits ALL enemies and stuns them. Time the ring.'], slam: ['Belly Flop', 'Crush all grounded enemies. Huge against hats!'] }, passive: 'Belly Flop does +1 damage.' },
  fox: { name: 'Fox', speaker: 'fox', art: (m) => A.drawFox(m), h: 2.2, ability: 'Tail Sweep (C): reveals invisible ink platforms, stuns foes',
    moves: { claw: ['Tail Whip', 'Whip a foe and mash *Z* for a flurry.'], howl: ['Ink Flash', 'Reveals every foe\'s *weak point* (next hit hits harder). Time the ring.'], slam: ['Pounce', 'Pounce on grounded enemies.'] }, passive: 'Ink Flash exposes weak points.' },
};

/* ---------------- items ---------------- */
export const EXTRA_ITEMS = { kefir: { name: 'Kefir', desc: 'Restores 10 HP and 4 FP. Cold and tangy!', kind: 'both', amt: 10, fp: 4, price: 22, icon: '🥛' } };

/* ---------------- enemies ---------------- */
export const ENEMIES = {
  inkblot: { name: 'Ink Blot', art: (m) => A.drawInkBlot(m), h: 1.9, w: 1.6, hp: 5, atk: 2, def: 0, sp: 9, coins: [2, 4], speed: 1.1, chase: true,
    attacks: [{ name: 'Splat!', pow: 2, kind: 'melee', w: 3 }, { name: 'Ink Spit', pow: 1, kind: 'ranged', w: 2 }] },
  crab: { name: 'Beach Crab', art: (m) => A.drawCrab(m), h: 1.5, w: 1.9, hp: 6, atk: 2, def: 1, sp: 11, coins: [2, 5], spiked: true, speed: 1.3,
    attacks: [{ name: 'Pinch', pow: 2, kind: 'melee', w: 3 }, { name: 'Sand Flick', pow: 1, kind: 'ranged', w: 2 }] },
  pigeon: { name: 'Pesky Pigeon', art: (m) => A.drawPigeon(m), h: 1.5, w: 1.5, hp: 3, atk: 1, def: 0, sp: 6, coins: [1, 3], flying: true, speed: 1.8,
    attacks: [{ name: 'Dive Peck', pow: 1, kind: 'dive', w: 3 }, { name: 'Flap Gust', pow: 1, kind: 'ranged', w: 1 }] },
  rivetbot: { name: 'Rivet Bot', art: (m) => A.drawRobotHare(m), h: 2.3, w: 1.4, hp: 8, atk: 3, def: 1, sp: 15, coins: [3, 7], speed: 1.5, chase: true,
    attacks: [{ name: 'Rivet Shot', pow: 2, kind: 'ranged', w: 3 }, { name: 'Overcharge', pow: 0, kind: 'charge', w: 1 }, { name: 'Hard Hat Bash', pow: 3, kind: 'melee', w: 2 }] },
  hippo: { name: 'Hippo Cop', art: (m) => A.drawHippo(m), h: 2.4, w: 1.7, hp: 7, atk: 2, def: 0, sp: 12, coins: [2, 5], speed: 1.2, chase: true,
    attacks: [{ name: 'Baton Whack', pow: 2, kind: 'melee', w: 3 }, { name: 'Whistle Rush', pow: 1, kind: 'multi', hits: 2, w: 1 }] },
  /* bosses */
  cat: { name: 'Mechanical Cat Magician', art: (m) => A.drawCat(m), h: 3.5, w: 2.6, hp: 26, atk: 3, def: 0, sp: 70, coins: [25, 25], boss: true, static: true, speed: 0,
    attacks: [{ name: 'Card Flurry', pow: 1, kind: 'multi', hits: 3, w: 3 }, { name: 'Wand Blast', pow: 2, kind: 'ranged', w: 2 }, { name: 'Top Hat Trap', pow: 1, kind: 'trap', w: 3 }, { name: 'Rabbit From the Hat', pow: 0, kind: 'summon', summon: 'inkblot', w: 1, when: 'few' }] },
  robothare: { name: 'Robot Hare Mk. Origami', art: (m) => A.drawMegaRobot(m), h: 5.4, w: 3.6, hp: 64, atk: 4, def: 1, sp: 200, coins: [80, 80], boss: true, static: true, speed: 0, phase2: true,
    attacks: [{ name: 'Laser Beam', pow: 2, kind: 'ranged', w: 3 }, { name: 'Burn the Stage', pow: 1, kind: 'aoe', w: 2 }, { name: 'Rocket Punch', pow: 3, kind: 'melee', w: 2 }, { name: 'Deploy Drones', pow: 0, kind: 'summon', summon: 'rivetbot', w: 1, when: 'few' }],
    attacks2: [{ name: 'Giant Crush', pow: 3, kind: 'aoe', w: 3 }, { name: 'Colossal Stomp', pow: 4, kind: 'melee', w: 2 }, { name: 'Laser Beam', pow: 2, kind: 'ranged', w: 2 }, { name: 'Lunge', pow: 3, kind: 'multi', hits: 2, w: 2 }] },
};

/* ---------------- levels ---------------- */
function groundFrom(width, gaps) { const out = []; let x = 0; for (const [a, b] of gaps) { out.push([x, a]); x = b; } out.push([x, width]); return out; }
const crateWall = (x) => [[x, 0, 'crack'], [x, 1.2, 'crack'], [x, 2.4, 'crack']];
const trees = (xs, z = -5) => xs.map((x, i) => ({ t: 'tree', x, z: z - (i % 3) * 1.5, v: i % 2, s: 0.85 + (i % 3) * 0.15 }));
const MOLE = ['mole', () => A.drawMole(), 1.9];
export const LEVELS = {};
const def = (id, o) => { LEVELS[id] = { id, ...o }; };

def('street', { title: 'Moscow Street Corner', theme: 'street', bg: 'street', music: 'park', width: 56, spawn: 3, sky: 0x9fd6ff,
  ground: [[0, 56]], platforms: [[16, 2.5, 5]],
  blocks: [[8, 2.5, 'q', 'coins'], [10.2, 2.5, 'brick'], [12.4, 2.5, 'q', 'soup'], [34, 2.5, 'save']],
  coins: [[16, 3.4], [18, 3.4], [26, 0.6], [28, 0.6], [44, 0.6], [46, 0.6]], carrots: [[16, 3.6], [50, 0.8]],
  enemies: [{ t: 'inkblot', x: 24, r: 3, once: true }, { t: 'inkblot', x: 42, r: 3, once: true }],
  npcs: [{ id: 'mole', x: 6, art: MOLE, face: 1 }],
  props: [{ t: 'house', x: 10, z: -7, v: 0 }, { t: 'house', x: 30, z: -8, v: 1 }, { t: 'house', x: 50, z: -7, v: 2 }, { t: 'fence', x: 20, z: -1 }, ...trees([2, 22, 38, 54])],
  signs: [{ x: 7.5, icon: '!', id: 'street_sign' }],
  doors: [{ x: 54, to: 'beach1', at: 2.5, label: 'To the Cardboard Beach' }] });

def('beach1', { title: 'The Cardboard Beach', theme: 'beach', bg: 'beach', music: 'beach', width: 96, spawn: 3, sky: 0x8fd8ff,
  ground: groundFrom(96, [[30, 37], [48, 60]]),
  hidden: [{ id: 'dock', type: 'ground', x0: 48, x1: 60 }],
  platforms: [[14, 2.5, 5], [20, 4.8, 4], [70, 2.6, 5]],
  blocks: [[9, 2.5, 'q', 'coins'], [11.2, 2.5, 'brick'], [16, 2.5, 'q', 'soup'], [26, 2.5, 'save'], [72, 2.7, 'q', 'tea'], ...crateWall(76)],
  coins: [[14, 3.4], [20, 5.7], [33.5, 3.6], [43, 0.6], [45, 0.6], [53, 0.8], [56, 0.8], [66, 0.6], [70, 3.5], [88, 0.6]],
  carrots: [[20, 5.8], [34, 4.5], [90, 0.8]],
  fasteners: [{ x: 46.5, id: 'fastener1', reveals: 'dock', label: 'Pull the paper fastener' }],
  enemies: [{ t: 'crab', x: 20, r: 3 }, { t: 'inkblot', x: 42, r: 2.5 }, { t: 'crab', x: 66, r: 3, group: ['inkblot'] }, { t: 'inkblot', x: 84, r: 3 }],
  npcs: [{ id: 'lifeguard', x: 64, art: ['lifeguard', () => A.drawLifeguard(), 2.5], face: -1, join: 'lifeguard' }],
  props: [{ t: 'tent', x: 10, z: -7, v: 1 }, { t: 'tent', x: 40, z: -8, v: 0 }, { t: 'tent', x: 74, z: -7, v: 1 }, { t: 'balloon', x: 24, z: -2.6 }, { t: 'balloon', x: 68, z: -2.8 }, { t: 'fence', x: 18, z: -1 }],
  signs: [{ x: 28, icon: '✈', id: 'glide_sign' }, { x: 45, icon: '!', id: 'fastener_sign' }, { x: 74, icon: '⚠', id: 'crate_sign' }],
  doors: [{ x: 1, to: 'street', at: 54, label: 'Back' }, { x: 94, to: 'beachboss', at: 2, label: 'The Circus Tent' }] });

def('beachboss', { title: 'The Magician\'s Tent', theme: 'beach', bg: 'beach', music: 'beach', width: 28, spawn: 3, sky: 0xffcba0,
  ground: [[0, 28]], blocks: [], coins: [], carrots: [[3, 0.8]],
  enemies: [{ t: 'cat', x: 19, r: 0, boss: true, once: true }],
  props: [{ t: 'tent', x: 12, z: -8, v: 0 }, { t: 'balloon', x: 7, z: -3 }, { t: 'balloon', x: 24, z: -3 }], doors: [{ x: 1, to: 'beach1', at: 92, label: 'Back' }] });

def('site1', { title: 'The Origami Construction Site', theme: 'site', bg: 'site', music: 'dacha', width: 92, spawn: 3, sky: 0x4a7ac8,
  ground: groundFrom(92, [[40, 44.4]]),
  platforms: [[12, 2.5, 5], [18, 4.8, 4], [62, 2.6, 6]],
  blocks: [[8, 2.5, 'q', 'coins'], [14, 2.5, 'q', 'stew'], [28, 2.5, 'save'], [64, 2.7, 'q', 'tea'],
    [24, 1.0, 'beam'], [25.2, 1.0, 'beam'], [26.4, 1.0, 'beam'], [27.6, 1.0, 'beam'], [74, 1.0, 'beam'], [75.2, 1.0, 'beam'], [76.4, 1.0, 'beam']],
  coins: [[12, 3.4], [18, 5.7], [25.5, 0.5], [30, 0.6], [42.2, 2.4], [50, 0.6], [62, 3.5], [75.5, 0.5], [84, 0.6]],
  carrots: [[18, 5.8], [75.5, 0.4], [88, 0.8]],
  hazards: [{ x: 34, py: 7.5, len: 6.2, amp: 0.8, speed: 1.7 }, { x: 52, py: 7.5, len: 6.2, amp: 0.8, speed: 1.9, ph: 1.5 }, { x: 68, py: 7.5, len: 6.2, amp: 0.85, speed: 2.1, ph: 3 }],
  enemies: [{ t: 'rivetbot', x: 20, r: 3 }, { t: 'inkblot', x: 36, r: 3 }, { t: 'rivetbot', x: 56, r: 3, group: ['inkblot'] }, { t: 'pigeon', x: 70, r: 4 }, { t: 'rivetbot', x: 82, r: 3 }],
  npcs: [{ id: 'mole', x: 5, art: MOLE, face: 1 }, { id: 'pigs', x: 47, art: ['pig', () => A.drawPig(), 1.8], face: -1 }],
  props: [{ t: 'house', x: 10, z: -8, v: 1 }, { t: 'house', x: 46, z: -8, v: 0 }, { t: 'fence', x: 22, z: -1 }, { t: 'fence', x: 58, z: -1 }, ...trees([2, 30, 66, 88])],
  signs: [{ x: 7, icon: '!', id: 'site_sign' }, { x: 21.5, icon: '⬇', id: 'roll_sign' }],
  doors: [{ x: 1, to: 'beach1', at: 92, label: 'Back' }, { x: 90, to: 'site2', at: 2.5, label: 'Up the scaffolding' }] });

def('site2', { title: 'Blueprint Scaffolding', theme: 'site', bg: 'site', music: 'dacha', width: 86, spawn: 3, sky: 0x3a68b0,
  ground: groundFrom(86, [[34, 52]]),
  hidden: [{ id: 'ink1', type: 'platform', x: 38, y: 2.2, w: 3.4 }, { id: 'ink1', type: 'platform', x: 43, y: 2.2, w: 3.4 }, { id: 'ink1', type: 'platform', x: 48, y: 2.2, w: 3.4 }],
  platforms: [[12, 2.5, 5], [18, 4.8, 4], [64, 2.6, 6]],
  blocks: [[8, 2.5, 'q', 'coins'], [14, 2.5, 'q', 'honey'], [28, 2.5, 'save'], [66, 2.7, 'q', 'bomb'], [72, 1.0, 'beam'], [73.2, 1.0, 'beam'], [74.4, 1.0, 'beam']],
  coins: [[12, 3.4], [18, 5.7], [38, 3.1], [43, 3.1], [48, 3.1], [58, 0.6], [64, 3.5], [73.2, 0.5], [80, 0.6]],
  carrots: [[18, 5.8], [43, 3.5], [82, 0.8]],
  hazards: [{ x: 22, py: 7.5, len: 6.2, amp: 0.8, speed: 1.8 }, { x: 58, py: 7.5, len: 6.2, amp: 0.85, speed: 2.0, ph: 2 }],
  enemies: [{ t: 'rivetbot', x: 16, r: 3 }, { t: 'inkblot', x: 28, r: 3, group: ['rivetbot'] }, { t: 'pigeon', x: 56, r: 5 }, { t: 'rivetbot', x: 62, r: 3, group: ['inkblot'] }, { t: 'inkblot', x: 78, r: 3 }],
  npcs: [{ id: 'fox', x: 7, art: ['fox', () => A.drawFox(), 2.5], face: 1, join: 'fox' }],
  props: [{ t: 'house', x: 14, z: -8, v: 2 }, { t: 'fence', x: 30, z: -1 }, { t: 'fence', x: 60, z: -1 }, ...trees([2, 24, 56, 82])],
  signs: [{ x: 33, icon: '✎', id: 'ink_sign' }],
  doors: [{ x: 1, to: 'site1', at: 88, label: 'Back' }, { x: 84, to: 'desk1', at: 2.5, label: 'Up to the Animator\'s Desk' }] });

def('desk1', { title: 'The Animator\'s Desk', theme: 'desk', bg: 'desk', music: 'forest', width: 90, spawn: 3, sky: 0xe8e2d2,
  ground: groundFrom(90, [[32, 39], [58, 70]]),
  hidden: [{ id: 'ink2', type: 'platform', x: 60.5, y: 2.2, w: 3.2 }, { id: 'ink2', type: 'platform', x: 64.5, y: 2.2, w: 3.2 }, { id: 'ink2', type: 'platform', x: 68.2, y: 2.2, w: 3.2 }],
  platforms: [[14, 2.5, 5], [20, 4.8, 4], [48, 2.6, 6]],
  blocks: [[8, 2.5, 'q', 'coins'], [16, 2.5, 'q', 'stew'], [28, 2.5, 'save'], [50, 2.7, 'q', 'kefir'], [78, 1.0, 'beam'], [79.2, 1.0, 'beam'], [80.4, 1.0, 'beam']],
  coins: [[14, 3.4], [20, 5.7], [35.5, 3.6], [48, 3.5], [60.5, 3.1], [64.5, 3.1], [68.2, 3.1], [79.2, 0.5], [85, 0.6]],
  carrots: [[20, 5.8], [35.5, 4.4], [86, 0.8]],
  hazards: [{ x: 26, py: 7.5, len: 6.2, amp: 0.8, speed: 1.9 }, { x: 74, py: 7.5, len: 6.2, amp: 0.85, speed: 2.1, ph: 1 }],
  enemies: [{ t: 'inkblot', x: 18, r: 3 }, { t: 'rivetbot', x: 28, r: 3, group: ['inkblot'] }, { t: 'rivetbot', x: 46, r: 3, group: ['rivetbot'] }, { t: 'pigeon', x: 52, r: 5 }, { t: 'rivetbot', x: 82, r: 3, group: ['inkblot', 'inkblot'] }],
  npcs: [{ id: 'mole', x: 5, art: MOLE, face: 1 }],
  props: [{ t: 'fence', x: 12, z: -1 }, { t: 'fence', x: 46, z: -1 }, { t: 'bush', x: 30, z: -2 }],
  signs: [{ x: 7, icon: '✎', id: 'desk_sign' }],
  doors: [{ x: 1, to: 'site2', at: 82, label: 'Back' }, { x: 88, to: 'deskboss', at: 2, label: 'The Final Sketch' }] });

def('deskboss', { title: 'The Final Sketch', theme: 'desk', bg: 'desk', music: 'boss', width: 32, spawn: 3, sky: 0xd8d0bc,
  ground: [[0, 32]], blocks: [], coins: [], carrots: [[3, 0.8]],
  enemies: [{ t: 'robothare', x: 22, r: 0, boss: true, once: true }], props: [{ t: 'bush', x: 10, z: -2 }], doors: [{ x: 1, to: 'desk1', at: 86, label: 'Back' }] });

/* chain: boss id -> next level */
export const BOSS_NEXT = { cat: 'site1', robothare: null };
export const SHOP = ['soup', 'stew', 'tea', 'honey', 'smoke', 'bomb', 'revive', 'kefir'];

/* ---------------- script ---------------- */
export const SCRIPT = {
  intro: [
    { who: 'narrator', text: 'A sunny Moscow street corner, painted on cardstock. Somewhere between a lamppost and a bakery, a chase is happening.' },
    { who: 'wolf', text: 'ZAYATS! Stand still for *one* second! I just want to... talk! (Eat. I want to eat you.)' },
    { who: 'hare', text: 'Not today, Wolf!', mood: 'happy' },
    { who: 'narrator', text: '*RRRIIIP!* The sky tears open like wet paper. A colossal *pink shape* descends from above: the Censor\'s Eraser!', sfx: 'page' },
    { who: 'eraser', text: 'THIS SHOW IS *TOO LOUD*. TOO COLORFUL. TOO *CHASEY*. IT WILL BE... *REWRITTEN*.' },
    { who: 'hare', text: 'Wolf?! WOLF!', mood: 'hurt' },
    { who: 'narrator', text: 'The Eraser snatches the Hare, folds him into a little paper airplane, and flies away toward the *Soyuzmultfilm Studio Tower*.' },
    { who: 'wolf', text: '...Hey! He is *my* rival! Nobody rewrites my rival but me!' },
    { who: 'hedgehog', text: '*Pff pff!* Sir? Excuse me? I saw the whole thing. I am Hedgehog. May I... help?' },
    { who: 'wolf', text: 'A hedgehog. Spiky. Round. Honestly? That will do. Let\'s go get him back.' },
    { who: 'narrator', text: '*Hedgehog joins your party!* Hold *Jump* in mid-air to glide like a paper plane, and hold *Down* to roll up.' },
  ],
  firstFight: [{ who: 'hedgehog', text: 'Ink Blots! They erase color! Hit them first, then press *Z* right as your attacks land!' }],
  signs: {
    street_sign: 'Tutorial! *Z* to jump, *X* to smash with your guitar, *C* to use your partner\'s ability, *↑* to talk. Hit blocks from below!',
    glide_sign: 'The bridge is *missing*! Jump, then *hold Z* in the air to glide like a paper plane. Easy!',
    fastener_sign: 'Another gap! Pull the giant *paper fastener* (press ↑) to unfold the dock.',
    crate_sign: 'Heavy cardboard crates! Only someone *very* heavy could smash them. (Press *C* with the right partner.)',
    site_sign: 'Hard hats required. Wrecking balls swing here! *Hold Down* to roll up into a tube and squeeze under low beams.',
    roll_sign: 'Low steel beams ahead: *hold ↓* to roll up and slip under!',
    ink_sign: 'Invisible ink platforms! A certain stage actress could reveal them with her tail (press *C*).',
    desk_sign: 'You are on the Animator\'s Desk. Colors fade to pencil sketches here. Keep going!',
  },
  pigsIntro: [{ who: 'narrator', text: 'Wolf accidentally trips into a picnic blanket. A family of *vacationing pigs* gasps.' }, { who: 'wolf', text: 'Nobody move! This is... a very good picnic you have here.' }, { who: 'narrator', text: 'The pigs demand an apology. In the form of a *guitar solo*. Press *Z* to the beat!' }],
  pigsDone: [{ who: 'narrator', text: 'The pigs applaud wildly and hand Wolf a frosty bottle of *Kefir*!' }],
  pigsFail: [{ who: 'narrator', text: 'The pigs wince politely. *\"Perhaps... a different instrument?\"* They give Wolf a consolation kopeck.' }],
  lifeguard: [{ who: 'lifeguard', text: 'You again, hooligan? Last time you *flattened* the sandcastle contest.' }, { who: 'wolf', text: 'This time I am *saving* someone.' }, { who: 'lifeguard', text: '...Fine. But I am coming along to make sure the beach stays *safe*. And I can pound those cardboard crates flat. *Pound pound!*' }, { who: 'narrator', text: '*Lifeguard joins your party!* Open the pause menu to switch partners.' }],
  fox: [{ who: 'fox', text: 'Darling! You look *terrible*. Are you rescuing someone? How very theatrical!' }, { who: 'wolf', text: 'The Hare. The Eraser took him.' }, { who: 'fox', text: 'Oh, *that* beast has been erasing our best scenes for weeks. Count me in. My tail reveals invisible ink!' }, { who: 'narrator', text: '*Fox joins your party!* Switch partners from the pause menu.' }],
  needHippo: 'These crates are too heavy for this partner! Switch to the *Lifeguard* in the pause menu, then press *C*.',
  needFox: 'The platforms here are written in invisible ink. Switch to *Fox* in the pause menu and press *C* to sweep them into view.',
  moleShop: ['Welcome! Merchant Mole, still open even though the entire street is being erased.', 'Buy something! The Eraser cannot rub out *receipts*.'],
  bossIntro: {
    cat: [{ who: 'narrator', text: 'Under a big striped tent, a mechanical cat in a top hat spins a magic wand. Gears whir behind his smile.' }, { who: 'cat', text: 'Welcome, welcome! The Eraser says: *no more chases*. Allow me to make you... *disappear!*' }, { who: 'lifeguard', text: 'He is going to trap you in that hat! Tip it over, I have the weight!' }, { who: 'wolf', text: 'Ha. A cat with a hat. I have *eaten* worse.' }],
    robothare: [{ who: 'narrator', text: 'The Animator\'s Desk: half color, half pencil sketch. In the center, the Eraser hovers, and beneath it, the Hare is dangling from a paper clip.' }, { who: 'hare', text: 'Wolf! Behind you!', mood: 'hurt' }, { who: 'eraser', text: 'THE ROBOT HARE WILL *FINISH THE EPISODE*. FOLD, UNIT. *FOLD.*' }, { who: 'narrator', text: 'The Robot Hare from Episode 14 folds itself into an armored origami mech, eyes glowing red.' }, { who: 'fox', text: 'Reveal its weak points, then strike when it lunges!' }, { who: 'hedgehog', text: 'I will counter whatever it throws at us. Ready, sir!' }, { who: 'wolf', text: 'Nobody erases my rival. *Nobody.*' }],
  },
  bossWin: {
    cat: [{ who: 'cat', text: 'Ooh. Wrong... rabbit. *Poof.*', mood: 'hurt' }, { who: 'narrator', text: 'The mechanical cat deflates, leaving only a tiny, very confused top hat. Onward to the construction site!' }],
    robothare: [{ who: 'narrator', text: 'The origami mech crumples. The Eraser *cracks*, pink dust drifting everywhere... and then shatters into a thousand pieces. *Color floods back across the Desk!*' }],
  },
  ending: [
    { who: 'narrator', text: 'Color pours into the world. The Hare drops down from the paper clip, brushing pink dust from his ears.' },
    { who: 'hare', text: 'Wolf! You came for me!', mood: 'happy' },
    { who: 'wolf', text: '...Obviously. Nobody else is allowed to chase you.' },
    { who: 'narrator', text: 'The Hare pulls out a bouquet of *paper flowers* and presses it into Wolf\'s paws.' },
    { who: 'wolf', text: '...Flowers? For *me*?', mood: 'happy' },
    { who: 'hare', text: 'Thanks, Wolf. Truly. And... *bye!*' },
    { who: 'narrator', text: 'The Hare tosses a paper airplane, hops on, and zooms off the desk at full speed.' },
    { who: 'wolf', text: 'He... HE... *Nu, zayats...*', mood: 'hurt' },
    { who: 'wolf', text: '*НУ, ПОГОДИ!!*', mood: 'hurt' },
  ],
  credits: [
    'In the end, the Eraser is gone, the colors are back, and the chase goes on forever.',
    '*Part 1:* Moscow Street Corner · *Part 2:* The Cardboard Beach · *Part 3:* The Origami Construction Site · *Part 4:* The Animator\'s Desk',
    'THE END',
  ],
};
