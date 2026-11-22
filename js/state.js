/* Game state + save/load + party stats. */
const KEY = 'nupogodi.paperquest.v1';

import { EXTRA_ITEMS } from './data.js';
export const ITEMS = {
  soup: { name: 'Carrot Soup', desc: 'Restores 5 HP to one friend.', kind: 'hp', amt: 5, price: 6, icon: '🥣' },
  stew: { name: 'Big Stew', desc: 'Restores 12 HP to one friend.', kind: 'hp', amt: 12, price: 14, icon: '🍲' },
  tea: { name: 'Hot Tea', desc: 'Restores 4 FP to one friend.', kind: 'fp', amt: 4, price: 8, icon: '🍵' },
  honey: { name: 'Honey Jar', desc: 'Restores 8 HP and 3 FP.', kind: 'both', amt: 8, fp: 3, price: 20, icon: '🍯' },
  smoke: { name: 'Smoke Bomb', desc: 'Escape from any normal battle.', kind: 'flee', price: 10, icon: '💨' },
  bomb: { name: 'Pepper Bomb', desc: 'Deals 4 damage to all enemies.', kind: 'dmg', amt: 4, price: 12, icon: '💥' },
  revive: { name: 'Golden Cake', desc: 'Revives a fainted friend.', kind: 'revive', price: 25, icon: '🎂' },
};

Object.assign(ITEMS, EXTRA_ITEMS);

export function freshState() {
  return {
    chapter: 0, unlocked: 1, coins: 10, sp: 0, level: 1, atkBonus: 0,
    party: { hare: { hp: 12, maxHp: 12, fp: 6, maxFp: 6 }, wolf: { hp: 9, maxHp: 9, fp: 4, maxFp: 4 } }, partner: 'hedgehog', partners: ['hedgehog'],
    items: { soup: 2, tea: 1 },
    flags: {}, carrots: {}, blocks: {}, pages: [],
    where: { screen: 'street', x: 0 }, playtime: 0,
  };
}

export const game = { s: freshState(), started: false };

export function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
export function saveGame() { try { game.s.saved = Date.now(); localStorage.setItem(KEY, JSON.stringify(game.s)); return true; } catch (e) { return false; } }
export function loadGame() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) { game.s = { ...freshState(), ...d, party: { ...freshState().party, ...d.party } }; return true; } } catch (e) { /* ignore */ } return false; }
export function newGame() { game.s = freshState(); game.started = true; }
export function eraseSave() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

export const S = () => game.s;
export const flag = (k) => !!game.s.flags[k];
export const setFlag = (k, v = true) => { game.s.flags[k] = v; };
export const carrotCount = () => Object.keys(game.s.carrots).length;
export function addItem(id, n = 1) { game.s.items[id] = (game.s.items[id] || 0) + n; if (game.s.items[id] <= 0) delete game.s.items[id]; }
export function healAll() { for (const c of Object.values(game.s.party)) { c.hp = c.maxHp; c.fp = c.maxFp; } }

export const SP_PER_LEVEL = 60;
export function addSP(n) {
  game.s.sp += n; let ups = 0;
  while (game.s.sp >= SP_PER_LEVEL) { game.s.sp -= SP_PER_LEVEL; game.s.level++; ups++; }
  return ups;
}
export function applyLevelChoice(choice) {
  const P = game.s.party;
  if (choice === 'hp') for (const c of Object.values(P)) { c.maxHp += 5; c.hp = c.maxHp; }
  if (choice === 'fp') for (const c of Object.values(P)) { c.maxFp += 3; c.fp = c.maxFp; }
  if (choice === 'atk') { game.s.atkBonus += 1; }
}
