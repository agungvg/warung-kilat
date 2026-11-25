# SIMULATION — best-cooking-game-20261125-0137

## What the judge rewards (from RULES.txt, judge criteria in order)
1. **A complete cooking game, shown in screenshots**: kitchen + order board, ingredients on the
   counter, one dish mid-assembly, a timer, a plate ready to serve. The cover screenshot must show
   ALL of these at a glance when shrunk — the contact sheet is most of the judge's 1,536 tokens.
2. **Fun and depth**: orders that push route-planning through the kitchen, recipes that combine in
   different ways, pressure that grows without adding chores.
3. **Feel and polish**: chopping/plating answer at once, a timer you can feel, a service rush that
   reads in a glance.
4. **Look and originality**: food that looks worth serving, counters readable at a glance, a kitchen
   with a look of its own. Never copy a commercial game's names/characters/art/music/levels.
5. **Structure**: source split into files with one clear job each, named for what they do.

Judge is pairwise, AI, screenshots + a short source outline. Screenshots decide most of it.

## Concept — "Warung Kilat" (Lightning Warung)
An original Indonesian street-food stall in 3D. One chef, one small kitchen, a lunch rush.
No Overcooked names, characters, art or levels — only the genre mechanic (cook-to-order vs timer).

- **Setting**: a warm warung kitchen — tiled floor, wooden counters, a wok stove with real fire,
  a charcoal grill, ingredient crates, a plating counter, a serving window, an order board.
- **Dishes (recipes combine)**: Nasi Goreng (rice + egg + chili, wok), Mie Goreng (noodle + veg +
  chicken, wok), Sate Ayam (chicken, grill, 2 skewers), Es Teh (tea + ice, no cooking — fast
  filler order). Each dish = 2–4 steps, so orders combine differently every run.
- **Core loop**: read ticket on the order board → fetch ingredients from crates → chop on the
  board (hold-to-chop with progress) → cook in wok/grill (timed, burns if left) → plate →
  serve at the window before the ticket's patience runs out. Correct serve = coins + tip scaled
  to time left; wrong dish = binned, no pay; expired ticket = lose one of 3 hearts.
- **Win/lose**: a 150-second shift. Win = serve the shift target (8 dishes) OR beat the coin
  target; lose = all 3 hearts gone (3 expired/wrong orders). Score = coins + combo bonus.
- **Difficulty ramp**: tickets arrive faster (every ~14s → ~8s), patience shortens, 3- and
  4-ingredient recipes appear later. No new chores — same four stations, tighter clock.
- **Controls**: WASD / arrows to move, E or Space or mouse click to interact (pick up, put down,
  chop, cook, plate, serve), P pause, R restart. Mouse click also works on the station the chef
  stands next to. Desktop Chrome, keyboard + mouse.
- **Feel**: chop = 3 quick chops with sound + veggie pieces visibly splitting; wok = sizzle loop +
  steam + fire flicker; serve = ding + coins flying to the till; timer bar on each ticket drains
  from green to red; last 10 seconds of the shift = rush mode (music tempo up, tickets glow).
- **Sounds**: procedural WebAudio only — chop thock, sizzle noise, serve ding, expire buzz,
  pickup pop. No copied audio.

## Scope vs the ~4h20m left (deadline 20:37 WIB, now ~16:20 WIB)
- In scope: one 3D kitchen, 1 chef, 4 stations + crates + window, 4 recipes, ticket system,
  150s shift, hearts/coins/combo, 4 staged screenshots, Node logic tests, headless play-test.
- Cut on purpose: no multiplayer, no second chef, no day progression, no unlocks, no sink/washing,
  no customer characters walking in (tickets only — keeps the loop tight and the screenshots clean).
- Tech: vendored Three.js 0.187.0 (minified to game/vendor/three.min.js with local terser),
  vanilla JS modules, DOM HUD for the order board/timer (readable when shrunk), CanvasTexture
  only where the 3D scene needs a label. No build step, no network.

## Gap vs the starter 2D game (Block Dodger)
- Starter is a 2D dodge game, NOT a cooking game: no kitchen, no orders, no recipes, no timer
  pressure, no food. It scores ~0 on judge criterion 1 for this bounty.
- This build is a real cooking game: every criterion-1 element is on screen in the cover shot,
  and the loop (fetch → chop → cook → plate → serve) is a complete game with win/lose.
- Starter art is flat rectangles on dark blue; this build is a lit 3D kitchen with modeled food,
  fire, steam and a readable order board — criteria 3 and 4 addressed directly.

## Screenshot plan (1280x720 JPEG, ≤256 KiB each)
1. `1-play.jpg` (cover): mid-rush — chef at the wok with a dish cooking, 3 tickets on the board,
   ingredients on the counter, a half-assembled plate on the plating counter, timer running,
   a finished plate at the serving window.
2. `2-start.jpg`: title screen over the kitchen, order board visible, "press Space" prompt.
3. `3-serve.jpg`: finished Nasi Goreng on the plate at the window, ding moment, coins.
4. `4-end.jpg`: shift-complete panel with dishes served, coins earned, best score.

## Verification plan
- Node logic tests: pure world/orders modules run headless — scripted playthrough (fetch, chop,
  cook, plate, serve) asserts score; expiry asserts heart loss; burn asserts ruined dish.
- Headless Chromium (playwright cache build on this VM): load each ?shot= scene, capture console
  errors (must be zero), screenshot, view the PNGs by eye, fix anything broken.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` from build/ — check out/ has game/, screenshots/,
  dossier.json, and a second run writes identical bytes.
- Offline check: serve with serve.ts, confirm no request leaves localhost (no external URLs in
  any source; grep for http/https in game/).

## Review fixes — 2026-11-25 ~16:30 WIB (independent review, REVIEW-2026-11-25.md)
Cover was losing on criterion 1 (no finished plate at the window, food too small,
no visible fire/steam, floating grill bars, dead floor). Fixed, all re-verified:
- `windowDish` state (world.js, staged shots only) + renderer draws a finished
  Nasi Goreng at the window anchor in stagePlay, beside the mid-assembly plate.
- Camera tightened (y 10.6→9.0, z 8.6→7.0); plate/dish meshes 1.5x, wok food 1.6x.
- Fire moved to the stove front as a 2-cone group (was hidden inside the stove
  box); steam bigger (r 0.18, grey-blue, opacity 0.6, faster spawn) + runShot
  warms up 6 paints at dt=0.15 so steam is mid-rise in the frame.
- Grill: satay skewer mesh on the bars (was bare chicken cubes), bars lowered
  2.1→1.85, anchors y 1.42.
- Floor: woven mat centre-south + rice sack (SW corner) + veg basket (SE corner),
  both solid obstacles in config.js; logic tests still all pass.
- Final screenshots: 1-play.jpg (cover) / 2-start.jpg / 3-serve.jpg / 4-end.jpg,
  1280x720, 86–122 KiB, console clean. main.ts twice byte-identical.

## Progress-bar readability tweak (2026-11-25, post-bugfix)
- Issue: in the cover the two active bars (wok ~63%, grill slot-0 ~52%) were
  partly hidden behind the steam cloud — only green segments peeked out.
  Cause: steam spawns at the station centres (wok z=0, grill z=2.8) and rises
  straight up through the bars, which were centred over the stations.
- Fix (option A — move the bar anchors, steam untouched): in game/src/render.js
  wok bar (1.6, 2.0, 0) → (1.6, 2.35, 0.65), above the wok island's front edge
  and in front of the steam column; grill slot-0 (6.4, 1.85, 2.55) → (6.4, 2.5, 2.0),
  above the grill's back edge and north of the steam column; slot-1 raised to
  the same height (6.4, 2.5, 3.05), same z. First try put slot-0 south
  (z=3.4) — perspective pushed it half out of the frame, reverted to north.
  Boolean(...) visibility fix untouched.
- Re-verified by eye: cover shows wok bar + grill slot-0 bar fully readable,
  skewer visible, no bar for empty slot 1, steam still reads as steam;
  serve/start/end show zero 3D station bars. Screenshots retaken 1280x720
  (1-play 123,323 B / 2-start 105,343 B / 3-serve 120,102 B / 4-end 87,508 B),
  console clean; logic tests ALL PASSED (38 checks: full serve loop, expiry,
  burn, win at 8); main.ts twice byte-identical.
- Bug: 3D progress bars rendered full-green over EMPTY stations (serve/start/end
  all four bars; cover grill slot 1). Cause: `group.visible` was assigned a
  possibly-null expression (`slot.item && !slot.done`, `boardActive`,
  `wokActive`); Three.js only skips rendering on strict `false`, so `null`
  still rendered. Fix in game/src/render.js draw(): wrapped all three in
  `Boolean(...)` (lines ~302/305/312). No other nullable `.visible` assignments
  in game/src (rest are literal true/false). Nothing else touched.
- Re-verified by eye: serve/start/end show zero 3D station bars; cover shows
  only the wok bar + grill slot-0 bar, nothing for empty slot 1. (Honest note:
  in the cover both bars are partly steam-occluded — only a green segment peeks
  out; pre-existing visual, not changed by this fix.)
- Screenshots retaken 1280x720 (1-play 121,698 B / 2-start 103,500 B /
  3-serve 119,111 B / 4-end 85,906 B), console clean; logic tests ALL PASSED;
  main.ts twice byte-identical.
