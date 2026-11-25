// The kitchen itself: floor, walls, counters, crates, stove, grill, window and
// decor, all built from primitives. Returns the anchors the renderer uses to place
// items, progress bars and the fire light. No files are read here.
import * as THREE from '../vendor/three.min.js';
import { FLOOR, PALETTE, STATIONS } from './config.js';
import { makeIngredientMesh } from './food.js';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...options });
}

function box(w, h, d, mat, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function checkerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const size = 32;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(col * size, row * size, size, size);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 2.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function textTexture(lines, width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildKitchen(scene) {
  const anchors = {};
  const group = new THREE.Group();
  scene.add(group);

  // Floor.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(FLOOR.width, FLOOR.height),
    new THREE.MeshStandardMaterial({ map: checkerTexture(), roughness: 0.85 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // North wall with a serving-window opening at x 3.5..6.5, y 1.1..2.1.
  const wallMat = material(new THREE.Color(PALETTE.wall).getHex());
  const trimMat = material(new THREE.Color(PALETTE.wallTrim).getHex());
  const northZ = -FLOOR.height / 2;
  group.add(box(10.5, FLOOR.wallHeight, 0.3, wallMat, -1.75, FLOOR.wallHeight / 2, northZ));
  group.add(box(0.5, FLOOR.wallHeight, 0.3, wallMat, 6.75, FLOOR.wallHeight / 2, northZ));
  group.add(box(3.0, 1.1, 0.3, wallMat, 5.0, 0.55, northZ));
  group.add(box(3.0, 1.1, 0.3, wallMat, 5.0, 2.65, northZ));
  group.add(box(14, 0.18, 0.34, trimMat, 0, 0.09, northZ));
  // Low side walls so the crates read against something.
  group.add(box(0.3, 1.1, FLOOR.height, wallMat, -FLOOR.width / 2, 0.55, 0));
  group.add(box(0.3, 1.1, FLOOR.height, wallMat, FLOOR.width / 2, 0.55, 0));

  // Counters: wooden bodies, pale tops.
  const wood = material(new THREE.Color(PALETTE.counterWood).getHex());
  const top = material(new THREE.Color(PALETTE.counterTop).getHex());
  function counter(cx, cz, w, d) {
    group.add(box(w, 0.86, d, wood, cx, 0.43, cz));
    group.add(box(w + 0.08, 0.07, d + 0.08, top, cx, 0.9, cz));
  }
  counter(0, -4.3, 14, 1.2);          // north row
  counter(-6.4, 0.25, 1.2, 6.7);      // west crate row
  counter(6.4, 0.9, 1.2, 5.0);        // east row
  counter(-2.0, 0, 2.4, 1.4);         // chopping island
  counter(1.6, 0, 2.4, 1.4);          // wok island

  // Menu poster on the north wall.
  const posterTex = textTexture(null, 512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b8573f';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#b8573f';
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WARUNG KILAT', w / 2, 78);
    ctx.fillStyle = '#33302a';
    ctx.font = '34px system-ui, sans-serif';
    ctx.fillText('NASI GORENG', w / 2, 140);
    ctx.fillText('MIE GORENG', w / 2, 188);
    ctx.fillText('SATE AYAM', w / 2, 236);
    ctx.fillText('ES TEH', w / 2, 284);
  });
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.4),
    new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.9 }),
  );
  poster.position.set(-0.5, 1.9, northZ + 0.17);
  group.add(poster);

  // 3D order board: dark board with white ticket stubs on the north wall.
  const board = box(2.6, 1.5, 0.08, material(0x2e4a3a), -5.2, 2.0, northZ + 0.2);
  group.add(board);
  for (let i = 0; i < 3; i += 1) {
    const ticket = box(0.62, 0.8, 0.02, material(0xfffbe8), -6.05 + i * 0.75, 2.0, northZ + 0.26);
    ticket.rotation.z = (i - 1) * 0.05;
    group.add(ticket);
  }
  const boardSignTex = textTexture(null, 512, 96, (ctx, w, h) => {
    ctx.fillStyle = '#2e4a3a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f7f0dd';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PESANAN', w / 2, 66);
  });
  const boardSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.34),
    new THREE.MeshStandardMaterial({ map: boardSignTex, roughness: 0.9 }),
  );
  boardSign.position.set(-5.2, 2.95, northZ + 0.2);
  group.add(boardSign);

  // Wall clock.
  const clock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24),
    material(0xffffff),
  );
  clock.rotation.x = Math.PI / 2;
  clock.position.set(2.2, 2.5, northZ + 0.18);
  group.add(clock);
  const hand = box(0.03, 0.22, 0.02, material(0x222222), 2.2, 2.56, northZ + 0.22);
  hand.rotation.z = -0.8;
  group.add(hand);

  // Ingredient crates on the west row, each holding a pile of its ingredient.
  for (const station of STATIONS.filter((s) => s.kind === 'crate')) {
    const crate = box(1.0, 0.32, 0.9, material(0x9a6a35), station.x, 1.1, station.z);
    group.add(crate);
    const pile = makeIngredientMesh(station.ingredient);
    pile.scale.setScalar(1.6);
    pile.position.set(station.x, 1.26, station.z);
    group.add(pile);
    anchors[station.id] = { x: station.x, y: 1.3, z: station.z };
  }

  // Tea dispenser and ice box on the east row.
  const dispenser = box(0.7, 1.1, 0.7, material(0x7a4a1e), 6.4, 1.5, -1.0);
  group.add(dispenser);
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), material(0x3a3f46));
  tap.rotation.z = Math.PI / 2;
  tap.position.set(6.0, 1.35, -1.0);
  group.add(tap);
  anchors['dispenser-tea'] = { x: 6.4, y: 2.1, z: -1.0 };
  const icebox = box(0.9, 0.8, 0.9, material(0xeef4f6), 6.4, 1.34, 0.2);
  group.add(icebox);
  anchors.icebox = { x: 6.4, y: 1.8, z: 0.2 };

  // Chopping island: board and knife.
  const boardTop = box(1.1, 0.08, 0.8, material(new THREE.Color(PALETTE.boardWood).getHex()), -2.0, 0.98, 0);
  group.add(boardTop);
  const knife = box(0.34, 0.02, 0.07, material(0xd8dde3, { metalness: 0.7, roughness: 0.3 }), -1.75, 1.04, 0.22);
  knife.rotation.y = 0.5;
  group.add(knife);
  anchors.chop = { x: -2.0, y: 1.05, z: 0 };

  // Wok island: stove body, wok bowl, flames licking out of the stove front
  // where the camera can see them (a fire hidden under the bowl reads as nothing).
  const stove = box(1.7, 0.5, 1.0, material(0x4a4f57, { metalness: 0.4, roughness: 0.5 }), 1.6, 1.18, 0);
  group.add(stove);
  const wokBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    material(new THREE.Color(PALETTE.wokMetal).getHex(), { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }),
  );
  wokBowl.position.set(1.6, 1.44, 0);
  wokBowl.castShadow = true;
  group.add(wokBowl);
  const fire = new THREE.Group();
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.fire).getHex(), transparent: true, opacity: 0.95 });
  const flameMat2 = new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0.95 });
  const flame1 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.75, 12), flameMat);
  flame1.position.set(0, 0.38, 0);
  const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 10), flameMat2);
  flame2.position.set(-0.38, 0.24, 0.03);
  fire.add(flame1, flame2);
  fire.position.set(1.6, 0.95, 0.55);
  group.add(fire);
  anchors.wok = { x: 1.6, y: 1.45, z: 0 };

  // Grill on the east row: dark box, metal bars, two skewer rests.
  const grillBody = box(1.0, 0.5, 1.2, material(0x3a3f46, { metalness: 0.5, roughness: 0.45 }), 6.4, 1.18, 2.8);
  group.add(grillBody);
  for (let i = 0; i < 5; i += 1) {
    const bar = box(0.06, 0.03, 1.1, material(0x777d85, { metalness: 0.7, roughness: 0.35 }), 6.05 + i * 0.18, 1.45, 2.8);
    group.add(bar);
  }
  const ember = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.08, 1.0),
    new THREE.MeshBasicMaterial({ color: 0xff5a1a }),
  );
  ember.position.set(6.4, 1.32, 2.8);
  group.add(ember);
  anchors.grill = [
    { x: 6.4, y: 1.42, z: 2.55 },
    { x: 6.4, y: 1.42, z: 3.05 },
  ];

  // Plate on the plating counter, and a bell at the serving window.
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.34, 0.05, 20),
    material(0xffffff),
  );
  plate.position.set(-3.5, 0.96, -4.3);
  plate.castShadow = true;
  group.add(plate);
  anchors.plate = { x: -3.5, y: 1.0, z: -4.3 };
  const bell = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.18, 14),
    material(0xf2c94c, { metalness: 0.8, roughness: 0.25 }),
  );
  bell.position.set(5.0, 1.05, -4.3);
  bell.castShadow = true;
  group.add(bell);
  anchors.window = { x: 5.0, y: 1.05, z: -4.3 };

  // Trash bin beside the north counter.
  const bin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.24, 0.6, 14),
    material(0x5a6b7a, { metalness: 0.3, roughness: 0.6 }),
  );
  bin.position.set(0.5, 1.24, -4.3);
  bin.castShadow = true;
  group.add(bin);
  anchors.trash = { x: 0.5, y: 1.55, z: -4.3 };

  // Floor props fill the open middle-bottom: a woven mat to walk over, a rice
  // sack and a basket of veg in the south corners (both solid — see OBSTACLES).
  const mat = box(4.6, 0.04, 2.2, material(0xc9a86a), 0, 0.02, 3.3);
  group.add(mat);
  const matInner = box(4.3, 0.012, 1.9, material(0xa87f45), 0, 0.046, 3.3);
  group.add(matInner);
  const sack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.85, 14),
    material(0xd9c9a8),
  );
  sack.position.set(-6.5, 0.43, 4.4);
  sack.castShadow = true;
  group.add(sack);
  const sackTop = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.35, 12),
    material(0xc9b78f),
  );
  sackTop.position.set(-6.5, 1.0, 4.4);
  sackTop.castShadow = true;
  group.add(sackTop);
  const basket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.34, 0.35, 14),
    material(0x9a6a35),
  );
  basket.position.set(6.5, 0.18, 4.55);
  basket.castShadow = true;
  group.add(basket);
  for (const [dx, dz, color, r] of [[-0.12, 0, 0x6fbf4a, 0.14], [0.13, 0.08, 0xe08a4c, 0.13], [0.02, -0.13, 0xd63a2f, 0.12]]) {
    const veg = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), material(color));
    veg.position.set(6.5 + dx, 0.42, 4.55 + dz);
    veg.castShadow = true;
    group.add(veg);
  }

  // Pendant lamps over the islands (emissive bulbs, no extra lights).
  for (const x of [-2.0, 1.6]) {
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 1.0, 6),
      material(0x222222),
    );
    cord.position.set(x, 2.7, 0);
    group.add(cord);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.25, 14, 1, true),
      material(0xb8573f, { side: THREE.DoubleSide }),
    );
    shade.position.set(x, 2.15, 0);
    group.add(shade);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
    );
    bulb.position.set(x, 2.05, 0);
    group.add(bulb);
  }

  // Fire light over the wok flames (flickers in the renderer).
  const fireLight = new THREE.PointLight(0xff8a2a, 12, 6, 1.8);
  fireLight.position.set(1.6, 1.9, 0.9);
  scene.add(fireLight);

  return { anchors, fire, fireLight, group };
}
