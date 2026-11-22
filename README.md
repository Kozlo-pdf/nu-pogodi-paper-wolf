# Paper Wolf: The Thousand-Year Chase

A free, fan-made **paper-craft RPG** (Paper Mario-style) and the sequel to *Nu, Pogodi! Paper Quest*. This time you play the **Wolf**: a giant Censor Eraser has folded the Hare into a paper airplane, and Wolf must team up with old rivals to get him back.
Plain ES modules + three.js, no build step. **Time to beat:** about 1 hour.

## Features
- **Four parts:** Moscow street (prologue), the Cardboard Beach, the Origami Construction Site, the Animator's Desk finale.
- **Paper moves:** hold Jump in mid-air to **glide**, hold Down to **roll up** under low beams, pull giant paper fasteners to unfold docks.
- **Three partners:** Hedgehog (Spike Roll; counters Guarded attackers), Lifeguard Hippo (Belly Flop smashes crates), Fox (Tail Sweep reveals invisible-ink platforms; Ink Flash exposes weak points). Swap in the pause menu.
- **Turn-based battles on a stage** with an audience, timed action commands (jump, guitar smash gauge, mash, ring timing), Guard / Super Guard, an applause meter and a team combo.
- **Bosses:** the Mechanical Cat Magician (traps Wolf in a hat; the Lifeguard's weight tips it) and the Robot Hare Mk. Origami (two phases; goes GIANT at half health).
- **Extras:** a pigs' picnic guitar rhythm mini-game for Kefir, shop, items, level-ups, saving, wrecking-ball hazards, keyboard, touch or PS4/Xbox controller, chiptune music.

## Controls
| | Keyboard | Controller |
|---|---|---|
| Move | ← → / A D | stick / D-pad |
| Jump, confirm, action command | Z / Space | ✕ |
| Glide | hold Z in mid-air | hold ✕ |
| Roll up | hold ↓ | hold stick down |
| Guitar smash, back, Super Guard | X | ○ |
| Partner ability | C | □ |
| Talk, enter, pull fastener | ↑ | ↑ |
| Menu / pause | Enter / Esc | △ / Options |

**Mobile / touch:** on-screen D-pad, A (jump/confirm), B (smash/back), C (partner) and MENU buttons appear automatically on touch devices (add `?touch=1` to force them).

## Run locally
On Windows double-click `PLAY.bat` (or `python -m http.server 8000`, then open `/play.html`). Debug URLs: `play.html?goto=beach1&x=26` (jump to a level), `&cheat=1` (all partners, items, coins), `&auto=1` (battle action commands succeed automatically).

## Layout
`js/art.js` procedural paper art · `js/paper.js` stage/sprites · `js/world.js` overworld (glide, roll, hazards, fasteners, hidden platforms, partner abilities) · `js/battle.js` battle engine · `js/data.js` enemies, partners, levels, script · `js/main.js` flow, partner menu, rhythm game · `js/ui.js`, `js/audio.js`, `js/state.js`, `js/input.js` · `tests/` headless-Chrome drivers.

## Legal
Unofficial, non-commercial fan tribute; "Nu, pogodi!" and its characters belong to their rights holders. All art and sound are original (generated in code). Code is MIT, see `LICENSE`.
