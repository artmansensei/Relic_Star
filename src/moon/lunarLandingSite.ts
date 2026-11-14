import * as THREE from 'three';
import { getLunarTerrainHeight } from './moonTerrain';

export interface LunarLandingSite {
  group: THREE.Group;
  safeZoneRadius: number;
  beaconLight: THREE.PointLight;
  update: (time: number) => void;
}

/**
 * Creates the Tranquility Base / Artemis Expedition Lunar Landing Site.
 * Features surface solar experiment arrays, telemetry beacon mast, and inductive recharge pad.
 */
export function createLunarLandingSite(): LunarLandingSite {
  const group = new THREE.Group();
  group.name = 'lunar_landing_site';

  const groundY = getLunarTerrainHeight(0, 0);
  group.position.set(0, groundY, 0);

  // 1. Inductive Landing & Recharge Pad (Hexagonal Titanium-Grid Foundation)
  const padGeo = new THREE.CylinderGeometry(14, 15, 0.4, 6);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x22262e,
    roughness: 0.65,
    metalness: 0.7,
  });
  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.position.y = 0.2;
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // Glowing Cyan Boundary Markings (Guidance rim lights)
  const ringGeo = new THREE.RingGeometry(13.5, 14.2, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.42;
  group.add(ringMesh);

  // 2. High-Gain Communications Mast & Lunar Transponder Tower
  const mastGroup = new THREE.Group();
  mastGroup.position.set(10.5, 0, 7.5);

  const mastPoleGeo = new THREE.CylinderGeometry(0.18, 0.25, 9.5, 12);
  const mastMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.85,
    roughness: 0.25,
  });
  const mastPole = new THREE.Mesh(mastPoleGeo, mastMat);
  mastPole.position.y = 4.75;
  mastPole.castShadow = true;
  mastGroup.add(mastPole);

  // Parabolic S-band Dish (Aimed at Earth)
  const dishGeo = new THREE.SphereGeometry(1.6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.6,
    side: THREE.DoubleSide,
  });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(0, 8.8, 0);
  dish.rotation.set(-0.6, -0.8, 0);
  mastGroup.add(dish);

  // Flashing Beacon Light at Mast Tip
  const beaconLight = new THREE.PointLight(0x38bdf8, 1.8, 45);
  beaconLight.position.set(0, 9.6, 0);
  mastGroup.add(beaconLight);

  const beaconBulbGeo = new THREE.SphereGeometry(0.2, 12, 12);
  const beaconBulbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beaconBulb = new THREE.Mesh(beaconBulbGeo, beaconBulbMat);
  beaconBulb.position.copy(beaconLight.position);
  mastGroup.add(beaconBulb);

  group.add(mastGroup);

  // 3. Solar Experiment Power Array
  const solarGroup = new THREE.Group();
  solarGroup.position.set(-10, 0, -8);

  const panelGeo = new THREE.BoxGeometry(4.2, 0.1, 2.4);
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.8,
    roughness: 0.2,
  });
  const panelMesh = new THREE.Mesh(panelGeo, panelMat);
  panelMesh.position.set(0, 1.8, 0);
  panelMesh.rotation.set(-0.35, 0.4, 0);
  panelMesh.castShadow = true;
  solarGroup.add(panelMesh);

  const panelStandGeo = new THREE.CylinderGeometry(0.12, 0.15, 2.0, 8);
  const standMesh = new THREE.Mesh(panelStandGeo, mastMat);
  standMesh.position.y = 1.0;
  solarGroup.add(standMesh);

  group.add(solarGroup);

  // 4. Perimeter Navigational Strobe Beacons (4 corner markers)
  const beaconPositions = [
    [-15, 0, -15],
    [15, 0, -15],
    [15, 0, 15],
    [-15, 0, 15],
  ];

  const markerStrobes: THREE.PointLight[] = [];
  beaconPositions.forEach(([bx, by, bz]) => {
    const marker = new THREE.Group();
    marker.position.set(bx, by, bz);

    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 8);
    const post = new THREE.Mesh(postGeo, mastMat);
    post.position.y = 0.6;
    marker.add(post);

    const light = new THREE.PointLight(0x00e5ff, 0.8, 12);
    light.position.y = 1.3;
    marker.add(light);
    markerStrobes.push(light);

    const capGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const cap = new THREE.Mesh(capGeo, ringMat);
    cap.position.y = 1.3;
    marker.add(cap);

    group.add(marker);
  });

  const update = (time: number) => {
    // Pulse beacon light every 1.5 seconds
    const pulse = (Math.sin(time * 3.5) + 1.0) * 0.5;
    beaconLight.intensity = 1.0 + pulse * 1.5;
    markerStrobes.forEach((str, i) => {
      str.intensity = 0.4 + Math.sin(time * 4 + i) * 0.4;
    });
  };

  return {
    group,
    safeZoneRadius: 22,
    beaconLight,
    update,
  };
}
