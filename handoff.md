# Handoff: Paper Wolf: The Thousand-Year Chase

Fan-made paper-craft RPG (Paper Mario-style) starring the Hare and the Wolf. Plain ES modules + three.js r160 (vendored in `vendor/`), no build step. Third game in the family (see also `nu-pogodi-grand-chase`, `nu-pogodi-2-world-tour`).

- Repo: https://github.com/Kozlo-pdf/nu-pogodi-paper-wolf
- Live: https://kozlo-pdf.github.io/nu-pogodi-paper-wolf/ (game: `/play.html`)
- Deploy: push to `main` -> `.github/workflows/pages.yml`. The deploy sometimes fails with "Found 0 artifact(s)": transient, re-run with `gh run rerun <id>`.

## Status
Complete vertical build: title, library hub, 5 chapters (2 levels + boss each), shop, saving, level-ups, 37 Golden Carrots, ending. Verified with headless-Chrome bots (see Testing). **Nobody has hand-played it**: difficulty, timing windows and feel are unverified by a human; a real playtest is the top next step. Estimated ~1 hour (estimate, not measured).

## Run / debug
```sh
python -m http.server 8000     # or PLAY.bat; file:// does not work (page explains)
```
URLs: `play.html?goto=<levelId>&x=<n>` jump to a level, `&cheat=1` unlock all chapters + items + coins, `&auto=1` make every action command succeed automatically.

## Architecture (js/)
| File | Role |
|---|---|
| `art.js` | all art, painted with Canvas2D (characters/enemies in `normal`/`hurt`/`happy` moods, props, tiles, backdrops). `paperEdge()` adds the cream cut-paper outline. |
| `paper.js` | `Stage` (renderer, camera rig, parallax backdrop, particles, shake, scene snapshot/restore), `PaperSprite` (root > body > mesh, paper-flip turning, shadow), `addGround/addPlatform`, `textSprite`, easing |
| `world.js` | overworld: 2D physics inside the 3D stage, one-way platforms, blocks (`q`, `brick`, `crack`, `save`), coins/carrots, patrolling enemies with first-strike rules, mallet, Wolf slam, trailing partner |
| `battle.js` | `Battle`: async/await flow driven by frame-based `sleep`/`tween`; action commands (jump timing, mallet gauge, claw mash, ring timing), `impactWindow` (Guard = act in [-0.18,+0.04] s of impact, Super Guard = guard key in [-0.08,+0.04]), applause meter + combo, items, flee, summons, victory/level-up |
| `data.js` | `ENEMIES`, `LEVELS` (16), `CHAPTERS`, `SHOP`, all script text (`SCRIPT`) |
| `main.js` | title, library hub, level transitions, encounters, boss/page flow, ending, pause menu, options, game over; `tick(dt)` + `window.__pq` test hooks |
| `ui.js` | dialogue (typewriter + voice blips), `pick()` menus, HUD, banners, iris wipe; **all timers are frame-driven** (`after`, `uiTick`) |
| `audio.js` | sfx + chiptune sequencer (songs defined as note strings: `title library park forest circus dacha battle boss victory gameover ending`) |
| `state.js`, `input.js` | save data/items/levels; keyboard + gamepad abstract actions |

Conventions: world units ~metres, ground top at y=0, characters ~2 units tall; level `blocks` are `[x, yBottom, kind, item]` (1.2 square); `platforms` are `[xCentre, yTop, width]`; `crack` blocks stack 3 high to gate progress until the Wolf slams. Enemy defs: `flying` (cannot be mallet-hit), `spiked` (cannot be stomped), `boss`, `attacks[{kind: melee|ranged|dive|aoe|multi|charge|summon|drain}]`.

## Parts / levels (`?goto=`)
Leader = **Wolf** (state slot `hare`), partner slot = `wolf` (`S().partner`: `hedgehog | lifeguard | fox`). Slot keys were kept from the previous game to avoid a refactor; `slotKey/slotArt/slotName` in `battle.js` and `spk()` in `ui.js` map slots to the right art and names.
| Part | Levels | Notes |
|---|---|---|
| Prologue | `street` | intro cutscene (Eraser abducts Hare), Hedgehog joins, 2 Ink Blots, first-fight tutorial |
| 1 Cardboard Beach | `beach1`, `beachboss` | glide over a 7-wide gap (a plain jump cannot cross, tested), fastener reveals the `dock` hidden ground, Lifeguard NPC joins, crate wall needs the Lifeguard's Belly Flop (C). Boss: Mechanical Cat Magician (Top Hat Trap skips Wolf's turns for 2 unless Guarded; the Lifeguard's Belly Flop frees him and does +3 to the cat) |
| 2 Construction Site | `site1`, `site2` | roll under low `beam` blocks (y=1.0), wrecking-ball `hazards`, pigs' picnic rhythm mini-game (8 notes, >=5 hits = Kefir), Fox joins; `ink*` hidden platforms revealed by Fox's Tail Sweep |
| 3 Animator's Desk | `desk1`, `deskboss` | gap plus `ink2` platforms again. Boss: Robot Hare Mk. Origami; at 50% HP "PHASE 2: GIANT" swaps `attacks` for `attacks2` and scales the sprite. Defeating it plays the ending (Hare, flowers, "Ну, погоди!") and returns to the title |
Boss results route through `BOSS_NEXT` in `data.js` (cat -> `site1`, robothare -> ending).

## Testing (headless Chrome)
Same harness as Paper Quest: `tests/driver.html?s=<script>` runs `tests/scripts/<script>.js` with manual frame ticking (headless never fires rAF). Scripts: `title`, `world` (`lv`, `x`, `n`), `battle`, `fullbattle`, `boss` (`b=cat|robothare&auto=1`), `mech` (verifies glide, fastener, roll), `dbgm`. Gotchas learned: any `?s=` other than `title` skips the boot title screen; keep test positions away from signs and NPCs (a nearby sign opens a dialogue that locks input); `inject.hold(action)` holds a virtual button.

## Known issues / unverified
- No human playtest; boss HP and damage were tuned only by a perfect-timing bot that heals. Phase 2 and the Top Hat Trap are untested by hand.
- Wolf is front-facing with no walk cycle and does not visibly hold a guitar (reuses the Wolf art); partner art has `normal` and `hurt` moods only.
- The "cigarette-smoke meter" from the design pitch is represented by the existing Applause meter; there is no separate smoke resource.
- No touch controls. Fonts come from Google Fonts (system fallbacks offline).

## Repo / identity notes
- Commits use the `Kozlo-pdf` no-reply identity; `gh` is installed per user (winget) and logged in as `Kozlo-pdf`. Pages deploys occasionally fail with "Found 0 artifact(s)" (transient): re-run or `gh workflow run pages.yml`.
- Legal: unofficial, non-commercial fan tribute; all art, music and sfx are original and generated in code; code is MIT.
