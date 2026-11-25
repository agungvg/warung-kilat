// Food, drawn from primitives: every ingredient in its raw, chopped and cooked
// states, every finished dish on a plate, and the steam that rises off the wok.
// Nothing here reads a file; all geometry is built in code.
import * as THREE from '../vendor/three.min.js';
import { INGREDIENTS } from './config.js';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...options });
}

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

function ball(r, color, x = 0, y = 0, z = 0, scaleY = 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), material(color));
  mesh.position.set(x, y, z);
  mesh.scale.y = scaleY;
  mesh.castShadow = true;
  return mesh;
}

function cone(r, h, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

function cylinder(rt, rb, h, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

/** A small pile of one ingredient, as the chef carries it or as it sits on a station. */
export function makeIngredientMesh(kind, chopped = false, cooked = false) {
  const group = new THREE.Group();
  switch (kind) {
    case 'rice': {
      group.add(ball(0.16, cooked ? 0xf0d9a0 : 0xf5f0e1, 0, 0.07, 0, 0.55));
      group.add(ball(0.11, cooked ? 0xe8c878 : 0xefe8d2, 0.1, 0.05, 0.05, 0.5));
      group.add(ball(0.09, cooked ? 0xe8c878 : 0xefe8d2, -0.09, 0.05, -0.04, 0.5));
      break;
    }
    case 'noodle': {
      const color = cooked ? 0xd99a26 : 0xf2c94c;
      for (let i = 0; i < 3; i += 1) {
        const strand = new THREE.Mesh(new THREE.TorusGeometry(0.11 - i * 0.02, 0.035, 8, 16), material(color));
        strand.rotation.x = Math.PI / 2;
        strand.position.set(0, 0.05 + i * 0.045, 0);
        strand.castShadow = true;
        group.add(strand);
      }
      break;
    }
    case 'chicken': {
      if (chopped) {
        group.add(box(0.14, 0.09, 0.14, cooked ? 0xa06a30 : 0xe8a080, -0.09, 0.05, 0));
        group.add(box(0.14, 0.09, 0.14, cooked ? 0xa06a30 : 0xe8a080, 0.09, 0.05, 0.03));
      } else {
        group.add(box(0.3, 0.13, 0.2, cooked ? 0xa06a30 : 0xe89a7a, 0, 0.07, 0));
        group.add(box(0.2, 0.06, 0.14, cooked ? 0x8a5a28 : 0xf0b090, 0, 0.15, 0));
      }
      break;
    }
    case 'egg': {
      group.add(ball(0.15, cooked ? 0xf8f2dc : 0xfdf3d0, 0, 0.06, 0, 0.6));
      group.add(ball(0.07, 0xf2b01e, 0.03, 0.12, 0.02, 0.7));
      break;
    }
    case 'veg': {
      if (chopped) {
        group.add(box(0.12, 0.05, 0.12, 0x6fbf4a, -0.08, 0.04, 0));
        group.add(box(0.12, 0.05, 0.12, 0x8fd06a, 0.08, 0.04, 0.04));
        group.add(box(0.1, 0.05, 0.1, 0x4da83a, 0, 0.04, -0.08));
      } else {
        group.add(ball(0.15, 0x6fbf4a, 0, 0.1, 0, 0.8));
        group.add(ball(0.09, 0x8fd06a, 0.1, 0.14, 0.03, 0.8));
      }
      break;
    }
    case 'chili': {
      if (chopped) {
        group.add(box(0.08, 0.05, 0.08, 0xd63a2f, -0.06, 0.04, 0));
        group.add(box(0.08, 0.05, 0.08, 0xe85a4a, 0.06, 0.04, 0.03));
      } else {
        const c1 = cone(0.05, 0.24, 0xd63a2f, -0.06, 0.12, 0);
        c1.rotation.z = 0.5;
        const c2 = cone(0.05, 0.24, 0xc22e24, 0.07, 0.12, 0.02);
        c2.rotation.z = -0.4;
        group.add(c1, c2);
      }
      break;
    }
    case 'satay': {
      const skewer = cylinder(0.015, 0.015, 0.42, 0xd9c9a8, 0, 0.08, 0);
      skewer.rotation.z = Math.PI / 2;
      group.add(skewer);
      for (let i = -1; i <= 1; i += 1) group.add(box(0.09, 0.08, 0.09, 0x8a5a2b, i * 0.11, 0.08, 0));
      break;
    }
    case 'tea': {
      group.add(cylinder(0.09, 0.07, 0.2, 0xb06a2e, 0, 0.1, 0));
      group.add(cylinder(0.075, 0.075, 0.02, 0x7a4a1e, 0, 0.2, 0));
      break;
    }
    case 'ice': {
      const ice = material(0xbfe8f2, { transparent: true, opacity: 0.75 });
      for (const [x, z] of [[-0.06, 0], [0.06, 0.03], [0, -0.06]]) {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), ice);
        cube.position.set(x, 0.06, z);
        cube.rotation.y = x * 5;
        cube.castShadow = true;
        group.add(cube);
      }
      break;
    }
    default:
      break;
  }
  return group;
}

/** A finished dish on its plate, as it sits on the plating counter or the window. */
export function makeDishMesh(recipeId) {
  const group = new THREE.Group();
  const plate = cylinder(0.3, 0.22, 0.05, 0xffffff, 0, 0.025, 0);
  group.add(plate);
  if (recipeId === 'nasi') {
    group.add(ball(0.2, 0xf0d9a0, 0, 0.1, 0, 0.5));
    group.add(ball(0.08, 0xf2b01e, 0.1, 0.17, 0.04, 0.7));
    group.add(cone(0.04, 0.14, 0xd63a2f, -0.14, 0.16, 0.06));
  } else if (recipeId === 'mie') {
    for (let i = 0; i < 3; i += 1) {
      const strand = new THREE.Mesh(new THREE.TorusGeometry(0.13 - i * 0.03, 0.035, 8, 16), material(0xd99a26));
      strand.rotation.x = Math.PI / 2;
      strand.position.set(0, 0.08 + i * 0.04, 0);
      group.add(strand);
    }
    group.add(box(0.1, 0.07, 0.1, 0xa06a30, 0.14, 0.12, 0));
    group.add(box(0.09, 0.05, 0.09, 0x6fbf4a, -0.13, 0.11, 0.05));
  } else if (recipeId === 'sate') {
    for (const z of [-0.09, 0.09]) {
      const skewer = cylinder(0.015, 0.015, 0.44, 0xd9c9a8, 0, 0.1, z);
      skewer.rotation.z = Math.PI / 2;
      group.add(skewer);
      for (let i = -1; i <= 1; i += 1) group.add(box(0.09, 0.08, 0.08, 0x8a5a2b, i * 0.12, 0.1, z));
    }
  } else if (recipeId === 'teh') {
    group.add(cylinder(0.11, 0.09, 0.24, 0xb06a2e, 0, 0.15, 0));
    const ice = material(0xbfe8f2, { transparent: true, opacity: 0.75 });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), ice);
    cube.position.set(0.03, 0.28, 0);
    group.add(cube);
  }
  return group;
}

/** The colour a ticket chip shows for one ingredient, for the DOM order board. */
export function ingredientCssColor(kind) {
  const hex = INGREDIENTS[kind]?.color ?? 0x888888;
  return `#${hex.toString(16).padStart(6, '0')}`;
}

/** Steam: a pool of soft white puffs recycled above the wok and grill. */
export function createSteam(scene, count = 26) {
  const puffs = [];
  const geometry = new THREE.SphereGeometry(0.18, 8, 6);
  const materialInstance = new THREE.MeshBasicMaterial({
    color: 0xdfe9ef, transparent: true, opacity: 0.6, depthWrite: false,
  });
  for (let i = 0; i < count; i += 1) {
    const puff = new THREE.Mesh(geometry, materialInstance.clone());
    puff.visible = false;
    scene.add(puff);
    puffs.push({ mesh: puff, age: 0, life: 0, x: 0, z: 0, y: 0 });
  }
  let next = 0;
  return {
    spawn(x, y, z) {
      const puff = puffs[next];
      next = (next + 1) % puffs.length;
      puff.mesh.visible = true;
      puff.mesh.position.set(x, y, z);
      puff.age = 0;
      puff.life = 1.4 + Math.random() * 0.8;
      puff.x = x;
      puff.z = z;
      puff.y = y;
    },
    update(dt) {
      for (const puff of puffs) {
        if (!puff.mesh.visible) continue;
        puff.age += dt;
        if (puff.age >= puff.life) {
          puff.mesh.visible = false;
          continue;
        }
        const t = puff.age / puff.life;
        puff.mesh.position.set(
          puff.x + Math.sin(puff.age * 3 + puff.life) * 0.08,
          puff.y + puff.age * 1.1,
          puff.z,
        );
        const scale = 1.2 + t * 2.4;
        puff.mesh.scale.set(scale, scale, scale);
        puff.mesh.material.opacity = 0.6 * (1 - t * 0.7);
      }
    },
  };
}
