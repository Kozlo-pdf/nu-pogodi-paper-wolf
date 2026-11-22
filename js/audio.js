/* WebAudio: sfx + a small chiptune sequencer. No asset files. */
let ac = null, master = null, musicGain = null, sfxGain = null;
let musicVol = 0.5, sfxVol = 0.8, muted = false;

function ctx() {
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = musicVol * 0.5; musicGain.connect(master);
      sfxGain = ac.createGain(); sfxGain.gain.value = sfxVol; sfxGain.connect(master);
    } catch (e) { /* no audio */ }
  }
  return ac;
}
export function unlock() { const c = ctx(); if (c && c.state === 'suspended') c.resume(); }
export function setVolumes(m, s) { musicVol = m; sfxVol = s; ctx(); if (musicGain) musicGain.gain.value = m * 0.5; if (sfxGain) sfxGain.gain.value = s; }
export function getVolumes() { return { music: musicVol, sfx: sfxVol }; }
export function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 1; return muted; }

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function noteToMidi(n) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return null;
  return 12 * (parseInt(m[3], 10) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

function tone(dest, { f, t = 0, d = 0.15, type = 'square', v = 0.2, slide = 0, a = 0.005, r = 0.05, detune = 0 }) {
  const c = ctx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, t0); if (detune) o.detune.value = detune;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + d);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + a); g.gain.setValueAtTime(v, t0 + Math.max(a, d - r)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + r);
  o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + d + r + 0.02);
}
let noiseBuf = null;
function noise(dest, { t = 0, d = 0.1, v = 0.2, hp = 800 }) {
  const c = ctx(); if (!c) return;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const dd = noiseBuf.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(), t0 = c.currentTime + t;
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t0); s.stop(t0 + d + 0.02);
}
const T = (o) => { const c = ctx(); if (c) tone(sfxGain, o); };
const N = (o) => { const c = ctx(); if (c) noise(sfxGain, o); };

export function rumble(ms = 140, strong = 0.8, weak = 0.5) {
  try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.vibrationActuator && g.vibrationActuator.playEffect) g.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }); } catch (e) { /* none */ }
}

export const sfx = {
  jump: () => { T({ f: 330, d: 0.14, slide: 420, v: 0.18 }); },
  land: () => { N({ d: 0.07, v: 0.1, hp: 300 }); },
  step: () => N({ d: 0.03, v: 0.04, hp: 1200 }),
  coin: () => { T({ f: 988, d: 0.07, v: 0.16 }); T({ f: 1318, t: 0.07, d: 0.18, v: 0.16 }); },
  carrot: () => { [784, 988, 1175, 1568].forEach((f, i) => T({ f, t: i * 0.06, d: 0.12, v: 0.15, type: 'triangle' })); },
  bump: () => { T({ f: 120, d: 0.1, slide: -40, v: 0.25, type: 'square' }); N({ d: 0.06, v: 0.12, hp: 200 }); },
  hammer: () => { N({ d: 0.12, v: 0.18, hp: 400 }); T({ f: 260, d: 0.12, slide: -160, v: 0.14, type: 'sawtooth' }); },
  hit: () => { N({ d: 0.12, v: 0.3, hp: 500 }); T({ f: 200, d: 0.14, slide: -120, v: 0.22, type: 'sawtooth' }); rumble(120, 0.8, 0.4); },
  crit: () => { N({ d: 0.18, v: 0.35, hp: 300 }); T({ f: 160, d: 0.2, slide: -100, v: 0.28, type: 'sawtooth' }); T({ f: 880, t: 0.05, d: 0.25, v: 0.14 }); T({ f: 1320, t: 0.1, d: 0.3, v: 0.12 }); rumble(220, 1, 0.7); },
  hurt: () => { N({ d: 0.2, v: 0.3, hp: 300 }); T({ f: 150, d: 0.3, slide: -90, v: 0.25, type: 'sawtooth' }); rumble(260, 1, 0.6); },
  guard: () => { T({ f: 520, d: 0.08, v: 0.2, type: 'triangle' }); N({ d: 0.05, v: 0.14, hp: 2000 }); },
  superguard: () => { [660, 990, 1320].forEach((f, i) => T({ f, t: i * 0.05, d: 0.2, v: 0.2, type: 'triangle' })); N({ d: 0.1, v: 0.2, hp: 3000 }); rumble(90, 0.4, 0.8); },
  miss: () => T({ f: 220, d: 0.2, slide: -80, v: 0.12, type: 'triangle' }),
  select: () => T({ f: 740, d: 0.06, v: 0.14, type: 'triangle' }),
  move: () => T({ f: 520, d: 0.035, v: 0.1, type: 'triangle' }),
  back: () => T({ f: 330, d: 0.07, slide: -90, v: 0.12, type: 'triangle' }),
  deny: () => { T({ f: 160, d: 0.1, v: 0.14, type: 'square' }); T({ f: 130, t: 0.1, d: 0.14, v: 0.14, type: 'square' }); },
  blip: (p = 1) => T({ f: 340 * p, d: 0.035, v: 0.07, type: 'square', r: 0.01 }),
  alert: () => { T({ f: 880, d: 0.09, v: 0.2 }); T({ f: 1175, t: 0.09, d: 0.14, v: 0.2 }); },
  flip: () => { T({ f: 500, d: 0.1, slide: 300, v: 0.1, type: 'triangle' }); },
  poof: () => { N({ d: 0.3, v: 0.25, hp: 600 }); T({ f: 600, d: 0.25, slide: -450, v: 0.16, type: 'triangle' }); },
  save: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => T({ f, t: i * 0.07, d: 0.25, v: 0.14, type: 'triangle' })); },
  heal: () => { [523, 659, 784, 1046].forEach((f, i) => T({ f, t: i * 0.06, d: 0.18, v: 0.13, type: 'sine' })); },
  levelup: () => { [523, 659, 784, 659, 784, 1046, 1318].forEach((f, i) => T({ f, t: i * 0.09, d: 0.2, v: 0.16 })); },
  charge: () => T({ f: 200, d: 0.9, slide: 600, v: 0.08, type: 'sawtooth' }),
  howl: () => { T({ f: 330, d: 0.9, slide: 330, v: 0.18, type: 'sawtooth', a: 0.1 }); T({ f: 335, d: 0.9, slide: 335, v: 0.12, type: 'triangle', a: 0.12 }); },
  slam: () => { T({ f: 110, d: 0.3, slide: -70, v: 0.35, type: 'sawtooth' }); N({ d: 0.35, v: 0.35, hp: 150 }); rumble(300, 1, 1); },
  cheer: () => { for (let i = 0; i < 6; i++) N({ t: i * 0.04, d: 0.25, v: 0.05, hp: 1500 + i * 300 }); },
  door: () => { N({ d: 0.18, v: 0.12, hp: 250 }); T({ f: 200, d: 0.18, slide: 120, v: 0.1, type: 'triangle' }); },
  page: () => { N({ d: 0.35, v: 0.14, hp: 2500 }); },
  equip: () => T({ f: 880, d: 0.06, v: 0.12, type: 'square' }),
  buy: () => { T({ f: 1047, d: 0.06, v: 0.14 }); T({ f: 1397, t: 0.06, d: 0.14, v: 0.14 }); },
  win: () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => T({ f, t: i * 0.1, d: 0.22, v: 0.16 })); },
  lose: () => { [392, 330, 262, 196, 147].forEach((f, i) => T({ f, t: i * 0.16, d: 0.3, v: 0.16, type: 'sawtooth' })); },
};

/* ---------------- music sequencer ---------------- */
let timer = null, cur = null, startT = 0, nextStep = 0, stepDur = 0, playing = null;

function parse(str, unit) {
  const out = []; let step = 0;
  for (const tok of str.trim().split(/\s+/)) {
    if (tok === '.') { step += unit; continue; }
    if (tok === '-') { if (out.length) out[out.length - 1].len += unit; step += unit; continue; }
    const m = noteToMidi(tok); if (m !== null) out.push({ step, midi: m, len: unit });
    step += unit;
  }
  return out;
}

export function defineSong(name, def) {
  const unit = def.unit ?? 2;
  const tracks = (def.tracks || []).map((t) => {
    const notes = parse(t.notes, t.unit ?? unit); const end = notes.reduce((m, n) => Math.max(m, n.step + n.len), 0);
    return { wave: t.wave || 'square', vol: t.vol ?? 0.1, notes, len: Math.max(16, Math.ceil(end / 16) * 16) };
  });
  SONGS[name] = { bpm: def.bpm, steps: tracks.reduce((m, t) => Math.max(m, t.len), 16), loop: def.loop !== false, tracks, drums: def.drums || '' };
}
export const SONGS = {};

function schedule() {
  const c = ctx(); if (!c || !cur) return;
  while (startT + nextStep * stepDur < c.currentTime + 0.2) {
    const when = startT + nextStep * stepDur - c.currentTime;
    for (const tr of cur.tracks) for (const n of tr.notes) {
      if (n.step === nextStep % tr.len) tone(musicGain, { f: midiHz(n.midi), t: Math.max(0, when), d: Math.max(0.05, n.len * stepDur * 0.92), type: tr.wave, v: tr.vol, a: 0.006, r: 0.04 });
    }
    const dch = cur.drums ? cur.drums[nextStep % cur.drums.length] : '';
    if (dch === 'k') { tone(musicGain, { f: 140, t: Math.max(0, when), d: 0.12, slide: -100, type: 'sine', v: 0.35 }); }
    else if (dch === 's') noise(musicGain, { t: Math.max(0, when), d: 0.1, v: 0.12, hp: 1500 });
    else if (dch === 'h') noise(musicGain, { t: Math.max(0, when), d: 0.04, v: 0.05, hp: 6000 });
    else if (dch === 'b') { tone(musicGain, { f: 140, t: Math.max(0, when), d: 0.12, slide: -100, type: 'sine', v: 0.35 }); noise(musicGain, { t: Math.max(0, when), d: 0.04, v: 0.05, hp: 6000 }); }
    nextStep++;
    if (!cur.loop && nextStep >= cur.steps) { cur = null; playing = null; return; }
  }
}

export function playMusic(name) {
  if (playing === name) return;
  const c = ctx(); if (!c) return;
  stopMusic();
  const def = SONGS[name]; if (!def) return;
  playing = name; cur = def; stepDur = 60 / def.bpm / 4; startT = c.currentTime + 0.08; nextStep = 0;
  timer = setInterval(schedule, 40); schedule();
}
export function stopMusic() { if (timer) clearInterval(timer); timer = null; cur = null; playing = null; }
export function musicName() { return playing; }
export function duckMusic(on) { const c = ctx(); if (c && musicGain) musicGain.gain.setTargetAtTime(on ? musicVol * 0.15 : musicVol * 0.5, c.currentTime, 0.1); }

/* ---------------- the songs ---------------- */
// each token = `unit` 16th-steps. '.' rest, '-' hold previous
defineSong('title', { bpm: 96, steps: 64, unit: 4, drums: 'k...s...k...s...',
  tracks: [
    { wave: 'triangle', vol: 0.12, notes: 'E5 G5 C6 B5 A5 G5 E5 D5 C5 E5 G5 A5 G5 E5 D5 . F5 A5 C6 A5 G5 F5 E5 D5 C5 G5 E5 D5 C5 - - .' },
    { wave: 'square', vol: 0.05, notes: 'C4 . G4 . C4 . G4 . A3 . E4 . A3 . E4 . F3 . C4 . F3 . C4 . G3 . D4 . G3 . D4 .' },
    { wave: 'triangle', vol: 0.16, unit: 8, notes: 'C3 . A2 . F2 . G2 .' }] });
defineSong('library', { bpm: 84, steps: 64, unit: 4, drums: '',
  tracks: [
    { wave: 'triangle', vol: 0.12, notes: 'G4 B4 D5 B4 G4 B4 D5 G5 E5 G5 B4 G4 E4 G4 B4 . C5 E5 G5 E5 C5 E5 G5 C6 A4 C5 E5 C5 D5 - B4 .' },
    { wave: 'sine', vol: 0.18, unit: 8, notes: 'G2 . E2 . C2 . D2 .' }] });
defineSong('park', { bpm: 132, steps: 64, unit: 2, drums: 'k.h.s.h.k.h.s.hh',
  tracks: [
    { wave: 'square', vol: 0.085, notes: 'C5 E5 G5 E5 C5 E5 G5 . A4 C5 E5 C5 A4 C5 E5 . F4 A4 C5 A4 F4 A4 C5 . G4 B4 D5 B4 G4 D5 B4 . E5 G5 C6 G5 E5 G5 C6 . D5 F5 A5 F5 D5 F5 A5 . C5 E5 G5 C6 B5 A5 G5 E5 D5 - G4 B4 C5 - - .' },
    { wave: 'triangle', vol: 0.2, unit: 4, notes: 'C3 G3 C3 G3 A2 E3 A2 E3 F2 C3 F2 C3 G2 D3 G2 D3 C3 G3 C3 G3 F2 C3 F2 C3 G2 D3 C3 - C3 -' }] });
defineSong('forest', { bpm: 100, steps: 64, unit: 2, drums: 'k...h...k..hs...',
  tracks: [
    { wave: 'triangle', vol: 0.12, notes: 'A4 . C5 . E5 . C5 . A4 . B4 C5 B4 . . . G4 . B4 . D5 . B4 . G4 . A4 B4 A4 . . . F4 . A4 . C5 . A4 . F4 . G4 A4 G4 . . . E4 G4 B4 E5 D5 B4 G4 . A4 - - - . . . .' },
    { wave: 'square', vol: 0.05, notes: '. . E5 . . . E5 . . . D5 . . . D5 . . . C5 . . . C5 . . . B4 . . . B4 .', unit: 4 },
    { wave: 'sine', vol: 0.2, unit: 8, notes: 'A2 . G2 . F2 . E2 .' }] });
defineSong('circus', { bpm: 150, steps: 48, unit: 2, drums: 'k.h.s.h.k.h.s.h.',
  tracks: [
    { wave: 'square', vol: 0.09, notes: 'F5 A5 C6 A5 F5 A5 C6 . G5 Bb5 D6 Bb5 G5 Bb5 D6 . A5 C6 F6 C6 A5 C6 F6 . E6 D6 C6 Bb5 A5 G5 F5 . F5 - A5 - C6 - A5 - G5 - Bb5 - D6 - - .' },
    { wave: 'triangle', vol: 0.2, unit: 4, notes: 'F3 C4 C4 F3 C4 C4 G3 D4 D4 G3 D4 D4 A3 E4 E4 A3 E4 E4 C3 G3 G3 C3 G3 G3' }] });
defineSong('dacha', { bpm: 116, steps: 64, unit: 2, drums: 'k.s.k.s.k.sbk.s.',
  tracks: [
    { wave: 'square', vol: 0.085, notes: 'D5 . D5 F5 A5 . G5 F5 E5 . E5 G5 Bb5 . A5 G5 F5 . F5 A5 C6 . Bb5 A5 G5 . G5 Bb5 D6 . C6 Bb5 A5 . A5 . A5 . A5 . . . D5 . F5 . A5 . D6 .' },
    { wave: 'sawtooth', vol: 0.06, unit: 4, notes: 'D3 D3 D3 D3 C3 C3 C3 C3 Bb2 Bb2 Bb2 Bb2 A2 A2 A2 A2' },
    { wave: 'triangle', vol: 0.18, unit: 4, notes: 'D2 . D2 . C2 . C2 . Bb1 . Bb1 . A1 . A1 .' }] });
defineSong('winter', { bpm: 108, steps: 64, unit: 2, drums: 'k...h...s...h...',
  tracks: [
    { wave: 'triangle', vol: 0.12, notes: 'G5 . B5 D6 B5 . G5 . A5 . C6 E6 C6 . A5 . B5 . D6 G6 D6 . B5 . A5 C6 B5 A5 G5 - - .' },
    { wave: 'square', vol: 0.045, unit: 4, notes: 'G4 D5 G4 D5 A4 E5 A4 E5 B4 F#5 B4 F#5 D4 A4 D4 A4' },
    { wave: 'sine', vol: 0.18, unit: 8, notes: 'G2 . A2 . B2 . D3 .' }] });
defineSong('beach', { bpm: 118, steps: 64, unit: 2, drums: 'k.h.s.h.k.h.s.hh',
  tracks: [
    { wave: 'square', vol: 0.08, notes: 'E5 G5 A5 G5 E5 D5 C5 . D5 F5 G5 F5 D5 C5 B4 . E5 G5 A5 C6 B5 A5 G5 . A5 G5 E5 D5 E5 - - .' },
    { wave: 'triangle', vol: 0.18, unit: 4, notes: 'C3 G3 C3 G3 D3 A3 D3 A3 C3 G3 A2 E3 F2 C3 G2 D3' }] });
defineSong('battle', { bpm: 152, steps: 64, unit: 2, drums: 'k.hhs.hhk.hhs.hs',
  tracks: [
    { wave: 'square', vol: 0.085, notes: 'E5 . E5 G5 B5 . A5 G5 E5 . E5 G5 B5 . D6 B5 C6 . C6 E6 G6 . F6 E6 C6 . B5 . D6 B5 G5 . B5 D6 E6 . E6 B5 G5 E5 . G5 B5 E6 . D6 B5 A5 G5 F5 G5 A5 B5 E6 - - . . . .' },
    { wave: 'sawtooth', vol: 0.05, unit: 2, notes: 'E3 E3 E3 E3 E3 E3 E3 E3 C3 C3 C3 C3 C3 C3 C3 C3 D3 D3 D3 D3 D3 D3 D3 D3 B2 B2 B2 B2 B2 B2 B2 B2 E3 E3 E3 E3 E3 E3 E3 E3 C3 C3 C3 C3 C3 C3 C3 C3 D3 D3 D3 D3 E3 E3 E3 E3 B2 B2 B2 B2 B2 B2 B2 B2' },
    { wave: 'triangle', vol: 0.2, unit: 4, notes: 'E2 . E2 . C2 . C2 . D2 . D2 . B1 . B1 . E2 . E2 . C2 . C2 . D2 E2 B1 . B1 .' }] });
defineSong('boss', { bpm: 168, steps: 64, unit: 2, drums: 'k.shk.shk.shk.sk',
  tracks: [
    { wave: 'square', vol: 0.09, notes: 'A5 . A5 C6 E6 . D6 C6 B5 . B5 D6 F6 . E6 D6 C6 . C6 E6 A6 . G6 E6 D6 . D6 F6 B5 . D6 F6 A5 . A5 C6 E6 A5 . C6 E6 G#5 . B5 E6 G#5 . B5 E6 A5 - - - . . . .' },
    { wave: 'sawtooth', vol: 0.06, unit: 2, notes: 'A2 A2 A2 A3 A2 A2 A2 A3 G2 G2 G2 G3 G2 G2 G2 G3 F2 F2 F2 F3 F2 F2 F2 F3 E2 E2 E2 E3 E2 E2 E2 E3 A2 A2 A2 A3 A2 A2 A2 A3 G2 G2 G2 G3 G2 G2 G2 G3 F2 F2 F2 F3 E2 E2 E2 E3 E2 E2 E2 E3 E2 E3 E2 E3' },
    { wave: 'triangle', vol: 0.2, unit: 4, notes: 'A1 . A1 . G1 . G1 . F1 . F1 . E1 . E1 . A1 . A1 . G1 . G1 . F1 . E1 . E1 E1' }] });
defineSong('victory', { bpm: 150, steps: 32, loop: false, unit: 2, drums: 'k.....h.k.s.k.s.',
  tracks: [{ wave: 'square', vol: 0.1, notes: 'C5 C5 C5 . C5 . G4 . A4 . C5 . A4 C5 - - - . . . . . C6 - - - - - . .' }, { wave: 'triangle', vol: 0.18, notes: 'C3 C3 C3 . C3 . G2 . A2 . A2 . F2 F2 C3 - - - - - . . . .' }] });
defineSong('gameover', { bpm: 70, steps: 32, loop: false, unit: 4, drums: '',
  tracks: [{ wave: 'triangle', vol: 0.14, notes: 'E4 . D4 . C4 . B3 . A3 - - - . . . .' }] });
defineSong('ending', { bpm: 92, steps: 64, unit: 4, drums: 'k...s...',
  tracks: [
    { wave: 'triangle', vol: 0.13, notes: 'C5 E5 G5 E5 C5 E5 G5 C6 A5 C6 E6 C6 A5 C6 E6 . F5 A5 C6 A5 F5 A5 C6 F6 G5 B5 D6 B5 G5 D6 G6 .' },
    { wave: 'square', vol: 0.05, notes: 'C4 . G4 . C4 . G4 . A3 . E4 . A3 . E4 . F3 . C4 . F3 . C4 . G3 . D4 . G3 . D4 .' },
    { wave: 'sine', vol: 0.18, unit: 8, notes: 'C3 . A2 . F2 . G2 .' }] });
