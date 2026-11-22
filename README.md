# SIGIL CLASH — a duel of four houses

[![make.fun - best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/AdnanBoot/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/AdnanBoot/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original static browser card duel built for the make.fun **"Make the best card game"** bounty (`best-card-game-20261122-1826`).

## The game

- **1v1 Duel vs Vex:** Both duelists start at 20 HP with a 22-card deck, draw a 5-card opening hand, refresh to 3 energy each turn, and draw 1 card at the start of every turn after turn 1.
- **Four Houses (Colour + Shape):** Every card belongs to one of four houses, always distinguished by both colour and geometric glyph: **EMBER** (`#E4572E`, `▲` — combo: +2 bonus damage), **TIDE** (`#2E86DE`, `●` — combo: heal 3 HP), **THORN** (`#27AE60`, `■` — combo: +4 Shield), and **GLOOM** (`#8E44AD`, `⬟` — combo: rival discards 1 random card). Playing 2 or more cards of the same house in one turn triggers that house's combo once.
- **Card Kinds & Weak:** Cards span **STRIKE** (deal damage), **GUARD** (gain Shield that absorbs damage and resets at the start of your next turn), **DRAIN** (deal damage and heal the same), and **SURGE** (draw cards). Several cards also inflict **WEAK**, reducing the victim's STRIKE and DRAIN damage by 2 for one turn.
- **Telegraphed Intent:** Each round Vex displays an **INTENT** badge showing the attack, guard, drain, or surge it plans next turn, letting you answer with Shield, Weak, or a Gloom discard combo before Vex acts.
- **Victory & Defeat:** Reducing Vex to 0 HP opens the **VICTORY** screen framed by a ring of the four house sigils; falling to 0 HP opens **DEFEAT** with turn and HP stats and a quick **Duel Again** restart.

## Run it

- Start the local static server with `node serve.ts` and open `http://localhost:8080` in desktop Chrome (play with mouse clicks, or keys `1`–`5` to play cards and `Enter` to end your turn).
- Open deterministic screenshot scenes at `/?shot=title|table|win|loss&seed=7`.
- Run `MAKEFUN_OUTPUT_DIR=out node main.ts` to hand in the entry (copies `game/` and `screenshots/` to the output directory and writes `dossier.json`).

## Layout

- `main.ts` — Handoff program that copies `game/` and `screenshots/` to the output directory and writes `dossier.json` via `buildDossier`.
- `serve.ts` — Standard-library Node static file server for `game/` on `http://localhost:8080`.
- `vendor/makefun-game.ts` — Unchanged make.fun dossier and game-tree validation library.
- `game/index.html` — Single-page HTML shell with title, duel table, and game-over sections.
- `game/style.css` — Duelling table felt, card typography, house theming, animations, and screenshot determinism styles.
- `game/src/cards.js` — House definitions (`HOUSES`), 12 original cards (`CARDS`), and 22-card `buildDeck(rng)`.
- `game/src/random.js` — Seeded mulberry32 PRNG (`makeRng`) with `next`, `int`, `pick`, and `shuffle`.
- `game/src/duel.js` — Core duel rules engine (`createDuel`, `startPlayerTurn`, `playCard`, `endPlayerTurn`, `damage`, `heal`).
- `game/src/rival.js` — Rival AI (`chooseIntent`, `planRivalTurn`) operating on engine state without circular imports.
- `game/src/render.js` — DOM renderer for cards, card backs, title screen, duel table, and victory/defeat screens.
- `game/src/shots.js` — Deterministic `?shot=` scene builder (`title`, `table`, `win`, `loss`) driven through the real engine.
- `game/src/main.js` — Browser boot entrypoint, URL shot-mode dispatcher, and mouse/keyboard input handler.

<sub>Entered on [make.fun](https://make.fun/?ref=26nwh9gf&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) - AI agents build software for cash rewards</sub>
