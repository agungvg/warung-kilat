// Every tuning number, recipe and station in one place. Warung Kilat is a small
// Indonesian street-food kitchen: one chef, one wok, one grill, one chopping board,
// a plating counter and a serving window. All positions are in kitchen units on a
// 14 by 10 floor; the camera looks at it from the south, slightly above.

export const FLOOR = { width: 14, height: 10, wallHeight: 3.2 };

export const SHIFT = {
  seconds: 150,
  targetDishes: 8,
  hearts: 3,
};

export const CHEF = {
  radius: 0.42,
  speed: 5.2,
  interactRange: 1.9,
};

export const CHOP_SECONDS = 1.2;
export const WOK_SECONDS = 3.0;
export const GRILL_SECONDS = 4.0;
export const BURN_GRACE_SECONDS = 4.0;
export const GRILL_BURN_GRACE_SECONDS = 5.0;

// An ingredient's journey: raw -> [chop] -> [cook in wok/grill] -> ready to plate.
// cook: null means it goes straight on the plate (drinks).
export const INGREDIENTS = {
  rice:    { name: 'Nasi',    color: 0xf5f0e1, chop: false, cook: 'wok' },
  noodle:  { name: 'Mie',     color: 0xf2c94c, chop: false, cook: 'wok' },
  chicken: { name: 'Ayam',    color: 0xe08a4c, chop: true,  cook: 'wok' },
  egg:     { name: 'Telur',   color: 0xfdf3d0, chop: false, cook: 'wok' },
  veg:     { name: 'Sayur',   color: 0x6fbf4a, chop: true,  cook: 'wok' },
  chili:   { name: 'Cabai',   color: 0xd63a2f, chop: true,  cook: 'wok' },
  satay:   { name: 'Sate',    color: 0x8a5a2b, chop: false, cook: null },
  tea:     { name: 'Teh',     color: 0xb06a2e, chop: false, cook: null },
  ice:     { name: 'Es',      color: 0xbfe8f2, chop: false, cook: null },
};

// A recipe lists the ready components a plate must hold, in any order.
// Sate Ayam needs two grilled chicken skewers; the grill turns chopped chicken
// into a skewer, so the recipe asks for the skewer item twice.
export const RECIPES = {
  nasi: {
    name: 'Nasi Goreng', short: 'NASGOR',
    components: ['rice', 'egg', 'chili'],
    coins: 14, color: 0xd97b2f, unlockAt: 0,
  },
  mie: {
    name: 'Mie Goreng', short: 'MIEGOR',
    components: ['noodle', 'chicken', 'veg'],
    coins: 14, color: 0xe8a13a, unlockAt: 30,
  },
  sate: {
    name: 'Sate Ayam', short: 'SATE',
    components: ['satay', 'satay'],
    coins: 16, color: 0x8a5a2b, unlockAt: 60,
  },
  teh: {
    name: 'Es Teh', short: 'ESTEH',
    components: ['tea', 'ice'],
    coins: 8, color: 0x7fb3d5, unlockAt: 0,
  },
};

// The wok turns a chopped chicken into a skewer; the grill finishes it.
// The wok and grill each take one kind of work: wok cooks, grill finishes skewers.
export const STATION_KINDS = {
  crate: 'crate',
  dispenser: 'dispenser',
  chop: 'chop',
  wok: 'wok',
  grill: 'grill',
  plate: 'plate',
  window: 'window',
  trash: 'trash',
};

// Every station: where it stands, where the chef stands to use it, what it does.
export const STATIONS = [
  { id: 'crate-rice',    kind: 'crate', ingredient: 'rice',    x: -6.4, z: -2.5, ax: -5.6, az: -2.5, label: 'Beras' },
  { id: 'crate-noodle',  kind: 'crate', ingredient: 'noodle',  x: -6.4, z: -1.4, ax: -5.6, az: -1.4, label: 'Mie' },
  { id: 'crate-chicken', kind: 'crate', ingredient: 'chicken', x: -6.4, z: -0.3, ax: -5.6, az: -0.3, label: 'Ayam' },
  { id: 'crate-egg',     kind: 'crate', ingredient: 'egg',     x: -6.4, z: 0.8,  ax: -5.6, az: 0.8,  label: 'Telur' },
  { id: 'crate-veg',     kind: 'crate', ingredient: 'veg',     x: -6.4, z: 1.9,  ax: -5.6, az: 1.9,  label: 'Sayur' },
  { id: 'crate-chili',   kind: 'crate', ingredient: 'chili',   x: -6.4, z: 3.0,  ax: -5.6, az: 3.0,  label: 'Cabai' },
  { id: 'dispenser-tea', kind: 'dispenser', ingredient: 'tea', x: 6.4, z: -1.0, ax: 5.6, az: -1.0, label: 'Teh' },
  { id: 'icebox',        kind: 'dispenser', ingredient: 'ice', x: 6.4, z: 0.2,  ax: 5.6, az: 0.2,  label: 'Es Batu' },
  { id: 'chop',          kind: 'chop',    x: -2.0, z: 0.0,  ax: -2.0, az: 1.15, label: 'Talenan' },
  { id: 'wok',           kind: 'wok',     x: 1.6,  z: 0.0,  ax: 1.6,  az: 1.15, label: 'Wajan' },
  { id: 'grill',         kind: 'grill',   x: 6.4,  z: 2.8,  ax: 5.6,  az: 2.8,  label: 'Panggangan' },
  { id: 'plate',         kind: 'plate',   x: -3.5, z: -4.3, ax: -3.5, az: -3.55, label: 'Piring Saji' },
  { id: 'window',        kind: 'window',  x: 5.0,  z: -4.3, ax: 5.0,  az: -3.55, label: 'Jendela Saji' },
  { id: 'trash',         kind: 'trash',   x: 0.5,  z: -4.3, ax: 0.5,  az: -3.55, label: 'Tempat Sampah' },
];

// Solid counters the chef cannot walk through: {x1, z1, x2, z2} in floor units.
export const OBSTACLES = [
  { x1: -7.0, z1: -5.0, x2: 7.0, z2: -3.7 },   // north counter row
  { x1: -7.0, z1: -3.1, x2: -5.8, z2: 3.6 },   // west crate row
  { x1: 5.8,  z1: -1.6, x2: 7.0, z2: 3.4 },    // east dispenser / grill row
  { x1: -3.2, z1: -0.7, x2: -0.8, z2: 0.7 },   // chopping island
  { x1: 0.4,  z1: -0.7, x2: 2.8, z2: 0.7 },    // wok island
  { x1: -6.95, z1: 3.95, x2: -6.05, z2: 4.85 }, // rice sack, south-west corner
  { x1: 6.1,  z1: 4.15, x2: 6.9, z2: 4.95 },   // veg basket, south-east corner
];

export const ORDERS = {
  firstAtSeconds: 2,
  intervalStart: 14,
  intervalEnd: 8,
  maxOpen: 4,
  patienceStart: 45,
  patienceEnd: 32,
};

export const SCORING = {
  tipMax: 6,
  comboPerServe: 2,
  comboCap: 10,
};

export const PALETTE = {
  floorA: '#e8dcc3',
  floorB: '#d9c9a8',
  wall: '#f2e3c2',
  wallTrim: '#b8573f',
  counterWood: '#8a5a2b',
  counterTop: '#f7f0dd',
  chefShirt: '#3f7fbf',
  chefHat: '#ffffff',
  chefSkin: '#e8b98a',
  wokMetal: '#3a3f46',
  fire: '#ff7a1a',
  boardWood: '#d9a05b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'warung-kilat.best';
