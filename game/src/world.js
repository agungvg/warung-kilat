// The game's rules and state, with no drawing and no browser in it: the chef, the
// stations, the tickets, the coins and the clock. step() advances one fixed step and
// returns what happened as bit flags, so the caller can react (sound, HUD, particles)
// without the world knowing about screens or sound. Pure logic: Node can run it.
import {
  CHEF, CHOP_SECONDS, WOK_SECONDS, GRILL_SECONDS, BURN_GRACE_SECONDS,
  GRILL_BURN_GRACE_SECONDS, INGREDIENTS, OBSTACLES, ORDERS, RECIPES, SHIFT, STATIONS,
} from './config.js';
import {
  createOrder, recipeForComponents, resetOrderIds, servePayout, spawnInterval,
} from './orders.js';

export const EVENT_PICKUP = 1;
export const EVENT_CHOP_DONE = 2;
export const EVENT_COOK_DONE = 4;
export const EVENT_PLATE_DONE = 8;
export const EVENT_SERVE = 16;
export const EVENT_SERVE_WRONG = 32;
export const EVENT_EXPIRE = 64;
export const EVENT_BURN = 128;
export const EVENT_WIN = 256;
export const EVENT_OVER = 512;
export const EVENT_RUSH = 1024;

// An item the chef carries or a station holds:
// { kind, chopped, cooked } — kind is an ingredient id, or 'satay' once grilled,
// or 'dish' with a recipe id once a plate is complete.
export function rawItem(kind) {
  return { kind, chopped: false, cooked: false, recipe: null };
}

function itemIsReady(item) {
  if (item.kind === 'dish') return true;
  const spec = INGREDIENTS[item.kind];
  if (!spec) return false;
  if (spec.chop && !item.chopped) return false;
  if (spec.cook && !item.cooked) return false;
  return true;
}

function itemCanCook(item, method) {
  if (item.kind === 'dish') return false;
  const spec = INGREDIENTS[item.kind];
  if (!spec || spec.cook !== method) return false;
  if (spec.chop && !item.chopped) return false;
  return !item.cooked;
}

function overlapsCircleRect(x, z, r, o) {
  const cx = Math.max(o.x1, Math.min(x, o.x2));
  const cz = Math.max(o.z1, Math.min(z, o.z2));
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < r * r;
}

export function nearestStation(state) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of STATIONS) {
    const dx = state.chef.x - station.ax;
    const dz = state.chef.z - station.az;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < CHEF.interactRange && distance < bestDistance) {
      best = station;
      bestDistance = distance;
    }
  }
  return best;
}

/** One line of hint text for the HUD: what E does right here, right now. */
export function describeAction(state) {
  const station = nearestStation(state);
  if (!station) return '';
  const carrying = state.chef.carrying;
  switch (station.kind) {
    case 'crate':
    case 'dispenser':
      return carrying ? '' : `Ambil ${INGREDIENTS[station.ingredient].name}`;
    case 'chop':
      if (state.board.item) return 'Tahan E — potong';
      if (carrying && INGREDIENTS[carrying.kind]?.chop && !carrying.chopped) return 'Taruh di talenan';
      return '';
    case 'wok':
      if (state.wok.item) {
        if (state.wok.burnt) return 'Angkat — gosong!';
        if (state.wok.done) return carrying ? '' : 'Ambil masakan';
        return 'Memasak…';
      }
      if (carrying && itemCanCook(carrying, 'wok')) return 'Masukkan ke wajan';
      return '';
    case 'grill': {
      const free = state.grill.slots.find((slot) => !slot.item);
      const done = state.grill.slots.find((slot) => slot.item && slot.done);
      if (done) return carrying ? '' : 'Ambil sate';
      if (free && carrying && carrying.kind === 'chicken' && carrying.chopped) return 'Taruh di panggangan';
      return state.grill.slots.some((slot) => slot.item) ? 'Memanggang…' : '';
    }
    case 'plate':
      if (state.plate.dish) return carrying ? '' : `Ambil ${state.plate.dishName}`;
      if (carrying && itemIsReady(carrying)) return 'Taruh di piring';
      if (state.plate.components.length > 0) return 'E — buang isi piring';
      return '';
    case 'window':
      return carrying && carrying.kind === 'dish' ? 'Sajikan!' : '';
    case 'trash':
      return carrying ? 'Buang' : '';
    default:
      return '';
  }
}

export function createWorld(random) {
  const state = {
    chef: { x: 0, z: 3.5, dirX: 0, dirZ: -1, carrying: null },
    board: { item: null, progress: 0 },
    wok: { item: null, progress: 0, done: false, burnt: false },
    grill: { slots: [{ item: null, progress: 0, done: false, burnt: false }, { item: null, progress: 0, done: false, burnt: false }] },
    plate: { components: [], dish: null, dishName: '' },
    // A finished dish set down at the serving window. Live play serves
    // instantly, so this is null in real games; staged shots set it so the
    // cover shows a plate ready to serve alongside the mid-assembly plate.
    windowDish: null,
    orders: [],
    coins: 0,
    hearts: SHIFT.hearts,
    combo: 0,
    served: 0,
    wrongServes: 0,
    elapsed: 0,
    timeLeft: SHIFT.seconds,
    spawnTimer: ORDERS.firstAtSeconds,
    outcome: 'playing',
    rushed: false,
  };

  function reset() {
    state.chef.x = 0;
    state.chef.z = 3.5;
    state.chef.dirX = 0;
    state.chef.dirZ = -1;
    state.chef.carrying = null;
    state.board.item = null;
    state.board.progress = 0;
    state.wok.item = null;
    state.wok.progress = 0;
    state.wok.done = false;
    state.wok.burnt = false;
    for (const slot of state.grill.slots) {
      slot.item = null;
      slot.progress = 0;
      slot.done = false;
      slot.burnt = false;
    }
    state.plate.components = [];
    state.plate.dish = null;
    state.plate.dishName = '';
    state.windowDish = null;
    state.orders = [];
    state.coins = 0;
    state.hearts = SHIFT.hearts;
    state.combo = 0;
    state.served = 0;
    state.wrongServes = 0;
    state.elapsed = 0;
    state.timeLeft = SHIFT.seconds;
    state.spawnTimer = ORDERS.firstAtSeconds;
    state.outcome = 'playing';
    state.rushed = false;
    resetOrderIds();
  }

  function moveChef(dt, moveX, moveZ) {
    const length = Math.hypot(moveX, moveZ);
    if (length === 0) return;
    const nx = moveX / length;
    const nz = moveZ / length;
    state.chef.dirX = nx;
    state.chef.dirZ = nz;
    const speed = CHEF.speed * dt;
    let x = state.chef.x + nx * speed;
    let z = state.chef.z + nz * speed;
    x = Math.max(-6.6, Math.min(6.6, x));
    z = Math.max(-3.3, Math.min(4.6, z));
    if (!OBSTACLES.some((o) => overlapsCircleRect(x, state.chef.z, CHEF.radius, o))) state.chef.x = x;
    if (!OBSTACLES.some((o) => overlapsCircleRect(state.chef.x, z, CHEF.radius, o))) state.chef.z = z;
  }

  function interact(station) {
    const chef = state.chef;
    let events = 0;
    switch (station.kind) {
      case 'crate':
      case 'dispenser': {
        if (!chef.carrying) {
          chef.carrying = rawItem(station.ingredient);
          events |= EVENT_PICKUP;
        }
        break;
      }
      case 'chop': {
        if (state.board.item) {
          if (!chef.carrying) {
            chef.carrying = state.board.item;
            state.board.item = null;
            state.board.progress = 0;
          }
        } else if (chef.carrying && INGREDIENTS[chef.carrying.kind]?.chop && !chef.carrying.chopped) {
          state.board.item = chef.carrying;
          state.board.progress = 0;
          chef.carrying = null;
        }
        break;
      }
      case 'wok': {
        if (state.wok.item) {
          if (state.wok.burnt) {
            state.wok.item = null;
            state.wok.progress = 0;
            state.wok.done = false;
            state.wok.burnt = false;
            events |= EVENT_BURN;
          } else if (state.wok.done && !chef.carrying) {
            chef.carrying = state.wok.item;
            state.wok.item = null;
            state.wok.progress = 0;
            state.wok.done = false;
            events |= EVENT_PICKUP;
          }
        } else if (chef.carrying && itemCanCook(chef.carrying, 'wok')) {
          state.wok.item = chef.carrying;
          state.wok.progress = 0;
          chef.carrying = null;
        }
        break;
      }
      case 'grill': {
        const doneSlot = state.grill.slots.find((slot) => slot.item && slot.done);
        if (doneSlot) {
          if (!chef.carrying) {
            chef.carrying = rawItem('satay');
            chef.carrying.chopped = true;
            chef.carrying.cooked = true;
            doneSlot.item = null;
            doneSlot.progress = 0;
            doneSlot.done = false;
            doneSlot.burnt = false;
            events |= EVENT_PICKUP;
          }
        } else {
          const free = state.grill.slots.find((slot) => !slot.item);
          if (free && chef.carrying && chef.carrying.kind === 'chicken' && chef.carrying.chopped) {
            free.item = chef.carrying;
            free.progress = 0;
            chef.carrying = null;
          }
        }
        break;
      }
      case 'plate': {
        if (state.plate.dish) {
          if (!chef.carrying) {
            chef.carrying = { kind: 'dish', chopped: true, cooked: true, recipe: state.plate.dish };
            state.plate.dish = null;
            state.plate.dishName = '';
            state.plate.components = [];
            events |= EVENT_PICKUP;
          }
        } else if (chef.carrying && itemIsReady(chef.carrying)) {
          state.plate.components.push(chef.carrying.kind);
          chef.carrying = null;
          const recipe = recipeForComponents(state.plate.components);
          if (recipe) {
            state.plate.dish = recipe;
            state.plate.dishName = RECIPES[recipe].name;
            events |= EVENT_PLATE_DONE;
          }
        } else if (!chef.carrying && state.plate.components.length > 0) {
          state.plate.components = [];
        }
        break;
      }
      case 'window': {
        if (chef.carrying && chef.carrying.kind === 'dish') {
          const recipeId = chef.carrying.recipe;
          const orderIndex = state.orders.findIndex((order) => order.recipe === recipeId);
          chef.carrying = null;
          if (orderIndex >= 0) {
            const order = state.orders[orderIndex];
            state.coins += servePayout(recipeId, order.patience, order.maxPatience, state.combo);
            state.combo += 1;
            state.served += 1;
            state.orders.splice(orderIndex, 1);
            events |= EVENT_SERVE;
          } else {
            state.wrongServes += 1;
            events |= EVENT_SERVE_WRONG;
          }
        }
        break;
      }
      case 'trash': {
        if (chef.carrying) chef.carrying = null;
        break;
      }
      default:
        break;
    }
    return events;
  }

  function advanceCooking(dt) {
    let events = 0;
    if (state.wok.item && !state.wok.done) {
      state.wok.progress += dt;
      if (state.wok.progress >= WOK_SECONDS) {
        state.wok.item.cooked = true;
        state.wok.done = true;
        events |= EVENT_COOK_DONE;
      }
    } else if (state.wok.item && state.wok.done && !state.wok.burnt) {
      state.wok.progress += dt;
      if (state.wok.progress >= WOK_SECONDS + BURN_GRACE_SECONDS) state.wok.burnt = true;
    }
    for (const slot of state.grill.slots) {
      if (slot.item && !slot.done) {
        slot.progress += dt;
        if (slot.progress >= GRILL_SECONDS) {
          slot.done = true;
          events |= EVENT_COOK_DONE;
        }
      } else if (slot.item && slot.done && !slot.burnt) {
        slot.progress += dt;
        if (slot.progress >= GRILL_SECONDS + GRILL_BURN_GRACE_SECONDS) slot.burnt = true;
      }
    }
    return events;
  }

  function advanceOrders(dt) {
    let events = 0;
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < ORDERS.maxOpen) {
      state.orders.push(createOrder(random, state.elapsed));
      state.spawnTimer += spawnInterval(state.elapsed);
    }
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.hearts -= 1;
        state.combo = 0;
        events |= EVENT_EXPIRE;
        if (state.hearts <= 0) {
          state.outcome = 'lost';
          events |= EVENT_OVER;
        }
      }
    }
    return events;
  }

  /** One fixed step. input: { moveX, moveZ, interact, interactHeld }. */
  function step(dt, input) {
    if (state.outcome !== 'playing') return 0;
    let events = 0;
    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.timeLeft <= 10 && !state.rushed) {
      state.rushed = true;
      events |= EVENT_RUSH;
    }
    moveChef(dt, input.moveX || 0, input.moveZ || 0);
    if (input.interact) {
      const station = nearestStation(state);
      if (station) events |= interact(station);
    }
    // Holding E at the board chops what is on it.
    const station = nearestStation(state);
    if (input.interactHeld && station && station.kind === 'chop' && state.board.item) {
      state.board.progress += dt;
      if (state.board.progress >= CHOP_SECONDS) {
        state.board.item.chopped = true;
        state.chef.carrying = state.board.item;
        state.board.item = null;
        state.board.progress = 0;
        events |= EVENT_CHOP_DONE;
      }
    }
    events |= advanceCooking(dt);
    events |= advanceOrders(dt);
    if (state.outcome === 'playing' && state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.outcome = state.served >= SHIFT.targetDishes ? 'won' : 'lost';
      events |= state.outcome === 'won' ? EVENT_WIN : EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
