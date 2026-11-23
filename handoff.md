# Handoff: Paper Wolf: The Thousand-Year Chase

Fan-made paper-craft RPG (Paper Mario / TTYD style) where you play the **Wolf**. Sequel to `nu-pogodi-paper-quest`; built by adapting that engine. Plain ES modules + three.js r160 (vendored in `vendor/`), no build step. Fourth game in the family (`nu-pogodi-grand-chase`, `nu-pogodi-2-world-tour`, `nu-pogodi-paper-quest`, this one).

- Repo: https://github.com/Kozlo-pdf/nu-pogodi-paper-wolf
- Live: https://kozlo-pdf.github.io/nu-pogodi-paper-wolf/ (game: `/play.html`)
- Deploy: push to `main` -> `.github/workflows/pages.yml`. Occasionally fails with "Found 0 artifact(s)": transient, re-run (`gh run rerun <id>` or `gh workflow run pages.yml`).
- itch.io: packaged, **not uploaded** (needs the owner's login). Files live outside the repo in `C:\Users\qubek\itch-paper-wolf\` (see "itch.io").

## Story / scope
The Censor's Eraser wipes the color out of Moscow and folds the Hare into a paper airplane bound for the Soyuzmultfilm Studio Tower. Wolf, with partners, chases it. About **1 hour**: Prologue (street), Ch1 Cardboard Beach, Ch2 Origami Construction Site, Finale Animator's Desk. Ending: Eraser shatters, color returns, Hare hands Wolf a paper-flower bouquet and runs, Wolf yells "Ну, погоди!" over credits, then back to title.

## Status
Complete: title, 4 parts (8 levels incl. 2 bosses), 3 partners, shop, saving, level-ups, ending, keyboard / gamepad / touch controls. Verified only with headless bots (see Testing). **Nobody has hand-played it**: boss difficulty was tuned with a perfect-timing bot, so real timing may feel harder.

## Run / debug
```sh
python -m http.server 8000     # or double-click PLAY.bat; file:// does NOT work (the page says so)
```
URLs on `play.html`: `?goto=<levelId>&x=<n>` jump to a level, `&cheat=1` (all partners, items, coins), `&auto=1` (every battle action command succeeds), `&touch=1` force on-screen touch controls.

## Architecture (js/)
| File | Role |
|---|---|
| `art.js` | all art via Canvas2D (moods `normal/hurt/happy`), `paperEdge()` cream cut-paper outline. Paper Wolf additions at the end: `drawHedgehog/Fox/Lifeguard/InkBlot/Crab/Cat/Eraser/Pig/Fastener/Ball/Crate/Beam`, `drawBackdrop2(kind)` for `street/beach/site/desk` |
| `paper.js` | `Stage` (renderer, camera, parallax, particles, shake, snapshot/restore), `PaperSprite`, `addGround/addPlatform`, `THEMES` |
| `world.js` | overworld physics: one-way platforms, blocks (`q`, `brick`, `crack`, `beam`, `save`), enemies with first-strike rules, guitar smash, **glide**, **roll-up**, wrecking-ball `hazards`, `fasteners`, `hiddenDefs`/`reveal()` for hidden ground/ink platforms, partner ability in `doSlam()` |
| `battle.js` | `Battle`: async flow on frame-driven `sleep/tween`; action commands, `impactWindow` (Guard act in [-0.18,+0.04]s, Super Guard in [-0.08,+0.04]s), applause meter, items, partner moves via `PARTNERS[...].moves`, Top Hat Trap, boss phase 2, Fox weak points, Hedgehog counter |
| `data.js` | `PARTNERS`, `EXTRA_ITEMS`, `ENEMIES`, `LEVELS`, `BOSS_NEXT`, `SHOP`, all dialogue (`SCRIPT`) |
| `main.js` | title, level transitions, encounters, `onInteract` (doors, fasteners, NPCs, signs), `joinPartner`, pigs rhythm game (`rhythm()`), boss flow, ending, pause menu (Partner switch), `tick(dt)` + `window.__pq` test hooks |
| `ui.js` | dialogue, `pick()` menus, HUD, banners; **all timers are frame-driven** (`after`, `uiTick`, `tween`) |
| `audio.js` | sfx + chiptune songs as note strings |
| `state.js`, `input.js` | save data/items; keyboard + gamepad + touch abstract actions |
| `touch.js` | on-screen D-pad, A/B/C, MENU. Shown when `pointer: coarse`, `ontouchstart`, or `?touch=1`; feeds `touch.set()` in `input.js` |

**Slot keys quirk:** to avoid a refactor, state/battle still use slot `'hare'` = the **Wolf lead** and slot `'wolf'` = the **active partner** (`S().partner` = `hedgehog | lifeguard | fox`). `slotKey/slotArt/slotName` in `battle.js` and `spk()` in `ui.js` map slots to real art/names. Don't "fix" the names without touching all of those.

Conventions: world units ~metres, ground top y=0, characters ~2 tall; level `blocks` are `[x, yBottom, kind, item]` (1.2 square); `platforms` are `[xCentre, yTop, width]`.

## Levels (`?goto=`)
| Part | Levels | Notes |
|---|---|---|
| Prologue | `street` | intro cutscene, Hedgehog joins, 2 Ink Blots, first-fight tutorial |
| 1 Cardboard Beach | `beach1`, `beachboss` | glide over a 7-wide gap (a plain jump can't cross; tested), fastener reveals hidden `dock` ground, Lifeguard NPC joins, crate wall needs the Lifeguard's Belly Flop (C). Boss: Mechanical Cat Magician. **Top Hat Trap** skips Wolf's turns for 2 unless Guarded; Lifeguard's slam frees him and hits the cat +3 |
| 2 Construction Site | `site1`, `site2` | roll under low `beam` blocks, wrecking balls (1 HP + invuln), pigs' picnic rhythm game (8 notes, >=5 hits = Kefir), Fox joins; hidden `ink*` platforms revealed by Fox's Tail Sweep (C) |
| 3 Animator's Desk | `desk1`, `deskboss` | gap + `ink2` platforms. Boss: Robot Hare Mk. Origami; at <=50% HP **PHASE 2: GIANT** swaps `attacks` -> `attacks2`, scale x1.22. Defeating it runs `ending()` and returns to the title |
Boss results route through `BOSS_NEXT` in `data.js` (`cat -> site1`, `robothare -> null` = ending).

## Controls
Keyboard: arrows/AD move, Z/Space jump+confirm+action, X guitar smash/back/Super Guard, C partner ability, Up talk/enter/pull, hold Z in air = glide, hold Down = roll, Enter menu, M mute. Gamepad (standard mapping): stick/D-pad, ✕ = Z, ○ = X, □ = C, △ menu. Touch: see `touch.js`.

## Testing (headless Chrome)
`tests/driver.html?s=<script>` loads `tests/scripts/<script>.js` with manual frame ticking (headless Chrome never fires rAF; `?manual` mode). Read the result from `<pre id="result">`:
```sh
chrome --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --virtual-time-budget=300000 --dump-dom "http://localhost:8000/tests/driver.html?s=mech"
```
Scripts: `title`, `world` (`lv`,`x`,`n`; also used for screenshots), `battle`, `fullbattle`, `boss` (`b=cat|robothare&auto=1`), `mech` (glide, fastener, roll), `touch` (needs `&touch=1`), `shotbattle` (battle screenshot), `bossdbg`, `dbgm`. `tests/cover.html` renders the 630x500 itch cover.
Gotchas learned:
- Any `?s=` other than `title` skips the boot title screen; otherwise its menu modal blocks input.
- Keep test start positions away from signs/NPCs/enemies: a nearby one opens a dialogue that locks input (and the first-fight tutorial dialogue covers screenshots).
- Use `inject.press` for taps and `inject.hold(action, bool)` for held buttons; bots should press both `act` and `confirm`.
- **A call to a nonexistent `sfx.xxx` throws inside an async battle turn and silently stalls it** (this froze the Robot Hare at phase 2 until `sfx.boom` was removed). Check new sfx names exist in `audio.js`.
- Unhandled promise rejections are shown in the fatal overlay; in headless tests read `#fatal-msg`.
Bot results at last run: Cat Magician and Robot Hare both beaten (`auto=1`), mechanics and touch scripts pass.

## itch.io
Not uploaded (needs the owner's login or a butler API key). Prepared in `C:\Users\qubek\itch-paper-wolf\`: `paper-wolf-html5.zip` (copy of `js css vendor favicon.svg LICENSE` + `play.html` as `index.html`; rebuild after code changes), `cover.png` (630x500 illustration), `shot1-4.png`, `ITCH_PAGE.md` (all page fields + description). Set Kind = HTML, 960x540, fullscreen button, Mobile friendly + landscape.

## Known issues / not done
- No human playtest (balance, feel, touch layout on real phones unverified).
- Wolf has no walk cycle and doesn't visibly hold a guitar; partner art has `normal`/`hurt` moods only.
- The pitch's "cigarette-smoke meter" is represented by the existing Applause meter; there is no separate smoke resource.
- Wolf and Hare share some art with Paper Quest; Hare appears only as an NPC/ending character.
- Fonts come from Google Fonts (system fallbacks offline). Audio starts on first input.

## Repo / identity
Commits use the `Kozlo-pdf` no-reply identity (`249961158+Kozlo-pdf@users.noreply.github.com`); `gh` is installed per user (winget) and logged in as `Kozlo-pdf`. Legal: unofficial, non-commercial fan tribute; all art, music and sfx are original and generated in code; code is MIT.
