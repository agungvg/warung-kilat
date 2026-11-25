// Keyboard and pointer input. Held keys give a move direction; one-shot presses
// (interact, pause, restart) are queued as bit flags and taken once by the loop, so
// a press between two frames is never lost and never counted twice.
export const ACTION_INTERACT = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const INTERACT = new Set(['KeyE', 'Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);

export function createInput(target) {
  const held = { up: false, down: false, left: false, right: false, interact: false };
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (INTERACT.has(event.code)) {
      held.interact = true;
      if (!event.repeat) actions |= ACTION_INTERACT;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
    else if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
    else if (INTERACT.has(event.code)) held.interact = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    held.up = false;
    held.down = false;
    held.left = false;
    held.right = false;
    held.interact = false;
  });
  // Clicking the canvas is the same as pressing E: interact with the nearest station.
  target.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    held.interact = true;
    actions |= ACTION_INTERACT;
  });
  target.addEventListener('pointerup', () => {
    held.interact = false;
  });

  return {
    /** Normalised move direction: { x, z } with z forward on screen. */
    move() {
      const x = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      const z = (held.down ? 1 : 0) - (held.up ? 1 : 0);
      const length = Math.hypot(x, z);
      if (length === 0) return { x: 0, z: 0 };
      return { x: x / length, z: z / length };
    },
    interactHeld() {
      return held.interact;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
