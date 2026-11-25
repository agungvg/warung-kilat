// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play, paused
// and game over.
//
// ?seed=N fixes the ticket pattern. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, SHIFT } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_BURN, EVENT_CHOP_DONE, EVENT_COOK_DONE, EVENT_EXPIRE, EVENT_OVER,
  EVENT_PICKUP, EVENT_PLATE_DONE, EVENT_SERVE, EVENT_SERVE_WRONG, EVENT_WIN,
  createWorld,
} from './world.js';
import { ACTION_INTERACT, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { sfx } from './audio.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, createRenderer } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const titleOverlay = document.getElementById('overlay-title');
const pauseOverlay = document.getElementById('overlay-pause');
const overOverlay = document.getElementById('overlay-over');
const overTitle = document.getElementById('over-title');
const overStats = document.getElementById('over-stats');
const bestLine = document.getElementById('best-line');

const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit only.
  }
}

function showOverlay(which) {
  titleOverlay.classList.toggle('hidden', which !== SCREEN_TITLE);
  pauseOverlay.classList.toggle('hidden', which !== SCREEN_PAUSED);
  overOverlay.classList.toggle('hidden', which !== SCREEN_OVER);
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    // Six warm-up paints at a large dt age the steam and settle the fire
    // flicker, so the frame shows the kitchen mid-rush instead of mid-spawn.
    const dt = painted < 6 ? 0.15 : 1 / 60;
    renderer.draw(world.state, scene.screen, dt, performance.now() / 1000, null);
    painted += 1;
    if (painted < 8) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  if (scene.screen === SCREEN_OVER) {
    overTitle.textContent = 'Shift Selesai — Warung Laris!';
    overStats.textContent = `Sajian ${world.state.served} · Koin ${world.state.coins} · Terbaik ${Math.max(world.state.coins, readBest())}`;
    showOverlay(SCREEN_OVER);
  } else if (scene.screen === SCREEN_TITLE) {
    bestLine.textContent = `Terbaik: ${readBest()} koin`;
    showOverlay(SCREEN_TITLE);
  } else {
    showOverlay(SCREEN_PLAY);
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let sizzleOn = false;

  function announce(message) {
    status.textContent = message;
  }

  function showTitle() {
    const staged = stageShot('start', world);
    void staged;
    bestLine.textContent = `Terbaik: ${best} koin`;
    screen = SCREEN_TITLE;
    showOverlay(SCREEN_TITLE);
    announce('Warung Kilat. Tekan Spasi atau klik untuk mulai.');
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    showOverlay(SCREEN_PLAY);
    sfx.unlock();
    announce(`Main! Sajikan ${SHIFT.targetDishes} piring sebelum waktu habis.`);
  }

  function endGame(won) {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    const out = world.state.outcome;
    overTitle.textContent = won
      ? 'Shift Selesai — Warung Laris!'
      : out === 'lost' && world.state.hearts <= 0
        ? 'Dapur Tutup! Terlalu banyak pesanan hangus.'
        : 'Shift Selesai — Belum cukup sajian.';
    overStats.textContent = `Sajian ${world.state.served}/${SHIFT.targetDishes} · Koin ${world.state.coins} · Terbaik ${best}`;
    showOverlay(SCREEN_OVER);
    announce(`Selesai. ${world.state.served} sajian, ${world.state.coins} koin.`);
  }

  function playEvents(events) {
    if (events & EVENT_PICKUP) sfx.pop();
    if (events & EVENT_CHOP_DONE) sfx.chop();
    if (events & EVENT_COOK_DONE) sfx.cookDone();
    if (events & EVENT_PLATE_DONE) sfx.plateDone();
    if (events & EVENT_SERVE) sfx.serve();
    if (events & EVENT_SERVE_WRONG) sfx.wrong();
    if (events & EVENT_EXPIRE) sfx.expire();
    if (events & EVENT_BURN) sfx.burn();
    if (events & EVENT_WIN) sfx.win();
    if (events & EVENT_OVER) sfx.lose();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) {
      startGame();
    } else if (actions & ACTION_INTERACT && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      showOverlay(SCREEN_PAUSED);
      announce('Jeda.');
    } else if (actions & (ACTION_PAUSE | ACTION_INTERACT) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      showOverlay(SCREEN_PLAY);
      announce('Lanjut.');
    }
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      // A press of E lands on the first step of this frame, and only there.
      let interact = Boolean(actions & ACTION_INTERACT);
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        const move = input.move();
        const events = world.step(STEP, {
          moveX: move.x,
          moveZ: move.z,
          interact,
          interactHeld: input.interactHeld(),
        });
        interact = false;
        accumulator -= STEP;
        playEvents(events);
        if (world.state.outcome !== 'playing') {
          endGame(world.state.outcome === 'won');
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    // The sizzle follows the wok: on while something cooks, off otherwise.
    const cooking = screen === SCREEN_PLAY && Boolean(world.state.wok.item);
    if (cooking !== sizzleOn) {
      sizzleOn = cooking;
      sfx.sizzle(sizzleOn);
    }
    renderer.draw(world.state, screen, dt, now / 1000, () => sfx.tick());
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      showOverlay(SCREEN_PAUSED);
      announce('Jeda.');
    }
  });

  showTitle();
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
