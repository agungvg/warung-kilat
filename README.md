# Warung Kilat — 3D Cooking Game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/agungvg/warung-kilat/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/agungvg/warung-kilat/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete 3D cooking game that plays offline in a desktop browser:
run a busy Indonesian street-food stall, cook dishes to order before
the timer runs out, and serve them for coins. Kitchen and order board,
ingredients on the counter, dishes mid-assembly, a timer, and a plate
ready to serve — all in the screenshots.

## Playing it

- `node serve.ts`, then open http://localhost:8080 in desktop Chrome.
- Keyboard + mouse. Take orders from the board, chop and cook the
  ingredients at the wok and grill, assemble the plate, serve it
  before the customer loses patience.

## Running it

- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` copies the
  game and screenshots into `out/` and writes `out/dossier.json`.
  Run it twice and the outputs are byte-identical: Node 22 standard
  library only, no network, no clock, no randomness in the output.

## What is in the game

- A 3D kitchen (Three.js, vendored under `game/vendor/`): wok station
  with flame and steam, grill with skewers, prep counter, serving window.
- Orders with a live timer: Nasi Goreng and other stall dishes, each
  with its own ingredients and steps.
- Cooking states that matter: ingredients can burn, orders expire and
  cost a heart, serving on time pays a tip.
- Original art, sounds, and names — no assets copied from any
  commercial game.
