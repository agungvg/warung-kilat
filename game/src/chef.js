// The chef: a small 3D cook with a white hat, blue shirt and apron, who bobs while
// walking and holds whatever he carries above his head. Pure presentation: the
// world owns where he is, this file owns how he looks.
import * as THREE from '../vendor/three.min.js';
import { PALETTE } from './config.js';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02, ...options });
}

export function createChef() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.62, 14), material(new THREE.Color(PALETTE.chefShirt).getHex()));
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.06), material(0xf7f0dd));
  apron.position.set(0, 0.52, 0.28);
  group.add(apron);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), material(new THREE.Color(PALETTE.chefSkin).getHex()));
  head.position.y = 1.08;
  head.castShadow = true;
  group.add(head);
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.12, 14), material(0xffffff));
  hatBand.position.y = 1.28;
  group.add(hatBand);
  const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), material(0xffffff));
  hatTop.scale.y = 0.75;
  hatTop.position.y = 1.38;
  hatTop.castShadow = true;
  group.add(hatTop);
  const armLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8), material(new THREE.Color(PALETTE.chefShirt).getHex()));
  armLeft.position.set(-0.32, 0.62, 0);
  armLeft.castShadow = true;
  group.add(armLeft);
  const armRight = armLeft.clone();
  armRight.position.x = 0.32;
  group.add(armRight);
  const carryAnchor = new THREE.Group();
  carryAnchor.position.set(0, 1.62, 0.1);
  group.add(carryAnchor);

  let walkPhase = 0;
  let carried = null;

  return {
    group,
    /** Show this mesh above the chef's head (null to clear). */
    setCarrying(mesh) {
      if (carried) {
        carryAnchor.remove(carried);
        carried = null;
      }
      if (mesh) {
        carried = mesh;
        carryAnchor.add(mesh);
      }
    },
    /** Place the chef and animate the walk. dirX/dirZ face him where he walks. */
    update(dt, x, z, dirX, dirZ, moving) {
      group.position.set(x, 0, z);
      if (moving) {
        walkPhase += dt * 11;
        group.position.y = Math.abs(Math.sin(walkPhase)) * 0.05;
        armLeft.rotation.x = Math.sin(walkPhase) * 0.7;
        armRight.rotation.x = -Math.sin(walkPhase) * 0.7;
      } else {
        group.position.y = 0;
        armLeft.rotation.x = 0;
        armRight.rotation.x = 0;
      }
      if (dirX !== 0 || dirZ !== 0) {
        group.rotation.y = Math.atan2(dirX, dirZ);
      }
    },
  };
}
