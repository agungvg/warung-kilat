// The screenshot scenes behind ?shot=start|play|serve|end. Each one builds a real,
// valid world state through the world's own objects (orders, items, stations), so
// the frame is what a game really looks like and the same seed always gives the
// same frame. No pixels are faked: the renderer draws the staged world as usual.
import { rawItem } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function fixedOrder(id, recipe, patience, maxPatience) {
  return { id, recipe, patience, maxPatience };
}

function stageStart(world) {
  world.reset();
  world.state.orders = [
    fixedOrder(1, 'nasi', 45, 45),
    fixedOrder(2, 'teh', 45, 45),
  ];
  world.state.timeLeft = 150;
  return { screen: SCREEN_TITLE };
}

function stagePlay(world) {
  world.reset();
  const s = world.state;
  // Three tickets on the board, mid-patience.
  s.orders = [
    fixedOrder(1, 'nasi', 28, 45),
    fixedOrder(2, 'mie', 20, 40),
    fixedOrder(3, 'teh', 33, 45),
  ];
  // Wok: rice cooking, two thirds done. Board: chopped veg waiting.
  s.wok.item = rawItem('rice');
  s.wok.progress = 1.9;
  s.board.item = rawItem('veg');
  s.board.item.chopped = true;
  // Grill: one chicken skewer halfway. Plate: nasi goreng two thirds built.
  // Window: a finished nasi goreng waits at the serving window.
  s.grill.slots[0].item = rawItem('chicken');
  s.grill.slots[0].item.chopped = true;
  s.grill.slots[0].progress = 2.1;
  s.plate.components = ['rice', 'egg'];
  s.windowDish = 'nasi';
  // Chef at the wok, carrying chopped chili to finish the nasi goreng.
  s.chef.x = 1.6;
  s.chef.z = 1.7;
  s.chef.dirX = 0;
  s.chef.dirZ = -1;
  s.chef.carrying = rawItem('chili');
  s.chef.carrying.chopped = true;
  s.coins = 26;
  s.served = 3;
  s.combo = 2;
  s.timeLeft = 98;
  s.elapsed = 52;
  return { screen: SCREEN_PLAY };
}

function stageServe(world) {
  world.reset();
  const s = world.state;
  s.orders = [
    fixedOrder(1, 'nasi', 18, 45),
    fixedOrder(2, 'sate', 30, 40),
  ];
  // A finished nasi goreng waits on the plating counter; the chef carries it
  // to the window. One more ticket keeps the board alive.
  s.plate.dish = 'nasi';
  s.plate.dishName = 'Nasi Goreng';
  s.chef.x = 4.2;
  s.chef.z = -2.6;
  s.chef.dirX = 0.5;
  s.chef.dirZ = -1;
  s.chef.carrying = { kind: 'dish', chopped: true, cooked: true, recipe: 'nasi' };
  s.coins = 40;
  s.served = 5;
  s.combo = 3;
  s.timeLeft = 75;
  s.elapsed = 75;
  return { screen: SCREEN_PLAY };
}

function stageEnd(world) {
  world.reset();
  const s = world.state;
  s.orders = [];
  s.coins = 132;
  s.served = 9;
  s.combo = 4;
  s.timeLeft = 0;
  s.elapsed = 150;
  s.outcome = 'won';
  return { screen: SCREEN_OVER };
}

/**
 * Set `world` to the named scene (start, play, serve or end; any other name is
 * start) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  switch (name) {
    case 'play':
      return stagePlay(world);
    case 'serve':
      return stageServe(world);
    case 'end':
      return stageEnd(world);
    default:
      return stageStart(world);
  }
}
