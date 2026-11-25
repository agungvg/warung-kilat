// Order tickets: what spawns, how patient a ticket is, and what a serve pays.
// Pure functions over the shift clock, so the rules can be tested without a browser.
import { ORDERS, RECIPES, SCORING, SHIFT } from './config.js';

let nextOrderId = 1;

/** Recipes the kitchen may be asked for at this point in the shift. */
export function unlockedRecipes(elapsed) {
  return Object.entries(RECIPES)
    .filter(([, recipe]) => elapsed >= recipe.unlockAt)
    .map(([id]) => id);
}

/** Seconds between ticket spawns: 14 at the open, 8 by the end of the shift. */
export function spawnInterval(elapsed) {
  const t = Math.min(1, elapsed / SHIFT.seconds);
  return ORDERS.intervalStart + (ORDERS.intervalEnd - ORDERS.intervalStart) * t;
}

/** How long a ticket waits before the customer walks out: 45s down to 32s. */
export function ticketPatience(elapsed) {
  const t = Math.min(1, elapsed / SHIFT.seconds);
  return ORDERS.patienceStart + (ORDERS.patienceEnd - ORDERS.patienceStart) * t;
}

const RECIPE_WEIGHTS = { nasi: 3, mie: 2, sate: 2, teh: 1 };

/** One new ticket. Weighted so the wok dishes lead and Es Teh stays a filler. */
export function createOrder(random, elapsed) {
  const unlocked = unlockedRecipes(elapsed);
  let total = 0;
  for (const id of unlocked) total += RECIPE_WEIGHTS[id];
  let roll = random() * total;
  let recipeId = unlocked[0];
  for (const id of unlocked) {
    roll -= RECIPE_WEIGHTS[id];
    if (roll <= 0) {
      recipeId = id;
      break;
    }
  }
  const patience = ticketPatience(elapsed);
  return {
    id: nextOrderId,
    recipe: recipeId,
    patience,
    maxPatience: patience,
  };
}

export function resetOrderIds() {
  nextOrderId = 1;
}

/** Coins for serving a dish with this much patience left, at this combo. */
export function servePayout(recipeId, patienceLeft, maxPatience, combo) {
  const recipe = RECIPES[recipeId];
  const tip = Math.round(SCORING.tipMax * Math.max(0, patienceLeft / maxPatience));
  const comboBonus = Math.min(SCORING.comboCap, combo * SCORING.comboPerServe);
  return recipe.coins + tip + comboBonus;
}

/** Do these plated components make this recipe? Order does not matter. */
export function componentsMatchRecipe(components, recipeId) {
  const wanted = [...RECIPES[recipeId].components].sort();
  const have = [...components].sort();
  if (wanted.length !== have.length) return false;
  return wanted.every((item, index) => item === have[index]);
}

/** Which recipe, if any, do these components complete? */
export function recipeForComponents(components) {
  for (const id of Object.keys(RECIPES)) {
    if (componentsMatchRecipe(components, id)) return id;
  }
  return null;
}
