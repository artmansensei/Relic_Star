import * as THREE from 'three';
import { getTerrainHeight } from './terrain';

export const LANDING_POSITION = new THREE.Vector3(0, 0, 0);
LANDING_POSITION.y = getTerrainHeight(0, 0);

export interface LandingSiteObject {
  group: THREE.Group;
  safeZoneRadius: number;
  update: (time: number) => void;
}

/**
 * Creates the expedition landing site safe zone at (0, 0).
 * Features SIMULATED MISSION EQUIPMENT providing safe-zone life support replenishment.
 */
export function createLandingSite(): LandingSiteObject {
  const group = new THREE.Group();
  group.position.copy(LANDING_POSITION);

  // Materials
  const landerPlateMat = new THREE.MeshStandardMaterial({
    color: '#87929a',
    metalness: 0.8,
    roughness: 0.4,
  });

  const goldThermalMat = new THREE.MeshStandardMaterial({
    color: '#d49d3b',
    metalness: 0.9,
    roughness: 0.3,
  });

  const whiteModuleMat = new THREE.MeshStandardMaterial({
    color: '#dbe0e6',
    metalness: 0.4,
    roughness: 0.5,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: '#2a2d34',
    metalness: 0.8,
    roughness: 0.4,
  });

  const parachuteFabricMat = new THREE.MeshStandardMaterial({
    color: '#e2e2ea',
    roughness: 0.95,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const disturbedSoilMat = new THREE.MeshStandardMaterial({
    color: '#38160a',
    roughness: 0.98,
    transparent: true,
    opacity: 0.75,
  });

  // 1. Landing Touchdown Base Platform
  const platformGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.28, 8);
  const platform = new THREE.Mesh(platformGeo, landerPlateMat);
  platform.position.y = 0.14;
  platform.receiveShadow = true;
  platform.castShadow = true;
  group.add(platform);

  // Central Avionics Hub Module
  const avionicsGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.65, 6);
  const avionics = new THREE.Mesh(avionicsGeo, goldThermalMat);
  avionics.position.y = 0.58;
  avionics.castShadow = true;
  group.add(avionics);

  // 2. High-Gain Communications Relay Mast & Pulsing Base Beacon
  const mastGeo = new THREE.CylinderGeometry(0.045, 0.055, 3.2, 8);
  const mast = new THREE.Mesh(mastGeo, landerPlateMat);
  mast.position.set(0.9, 1.8, 0.9);
  mast.castShadow = true;
  group.add(mast);

  // Small parabolic dish on mast
  const dishGeo = new THREE.CylinderGeometry(0.35, 0.08, 0.1, 16, 1, true);
  const dish = new THREE.Mesh(dishGeo, goldThermalMat);
  dish.rotation.x = -Math.PI * 0.35;
  dish.position.set(0.9, 3.1, 0.75);
  group.add(dish);

  // Base Beacon light (Pulsing Cyan)
  const beaconGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0.9, 3.45, 0.9);
  group.add(beaconMesh);

  const beaconLight = new THREE.PointLight(0x38bdf8, 1.8, 22, 2);
  beaconLight.position.set(0.9, 3.5, 0.9);
  group.add(beaconLight);

  // 3. SIMULATED MISSION EQUIPMENT: Equipment Zone
  // Field Power Station / RTG Generator Module
  const rtgGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.7, 12);
  const rtgMesh = new THREE.Mesh(rtgGeo, darkAlloyMat);
  rtgMesh.position.set(-2.2, 0.35, 1.2);
  rtgMesh.castShadow = true;
  group.add(rtgMesh);

  // RTG Cooling fins
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.55, 0.28), darkAlloyMat);
    fin.position.set(-2.2 + Math.cos(angle) * 0.22, 0.35, 1.2 + Math.sin(angle) * 0.22);
    fin.rotation.y = angle;
    group.add(fin);
  }

  // Science Supply Cargo Containers (Simulated mission equipment)
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.8), whiteModuleMat);
  crate1.position.set(-2.0, 0.25, -1.5);
  crate1.rotation.y = 0.25;
  crate1.castShadow = true;
  group.add(crate1);

  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.6), whiteModuleMat);
  crate2.position.set(-2.6, 0.22, -1.2);
  crate2.rotation.y = -0.4;
  crate2.castShadow = true;
  group.add(crate2);

  // Weather / Environmental Monitoring Tripod Sensor
  const tripodGroup = new THREE.Group();
  tripodGroup.position.set(2.4, 0, -1.8);
  for (let i = 0; i < 3; i++) {
    const legAngle = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), landerPlateMat);
    leg.position.set(Math.cos(legAngle) * 0.3, 0.4, Math.sin(legAngle) * 0.3);
    leg.rotation.z = 0.25;
    leg.rotation.y = legAngle;
    tripodGroup.add(leg);
  }
  const sensorHead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), darkAlloyMat);
  sensorHead.position.y = 0.85;
  tripodGroup.add(sensorHead);
  group.add(tripodGroup);

  // 4. Parachute Fabric Fragment partially buried in sand
  const chuteGeo = new THREE.PlaneGeometry(4.2, 2.8, 8, 8);
  chuteGeo.rotateX(-Math.PI / 2.3);
  const cPos = chuteGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const px = cPos.getX(i);
    const pz = cPos.getZ(i);
    cPos.setY(i, Math.sin(px * 1.8) * 0.18 + Math.cos(pz * 1.5) * 0.14);
  }
  chuteGeo.computeVertexNormals();

  const chuteMesh = new THREE.Mesh(chuteGeo, parachuteFabricMat);
  chuteMesh.position.set(-3.5, 0.08, 3.2);
  chuteMesh.rotation.y = 0.45;
  chuteMesh.receiveShadow = true;
  group.add(chuteMesh);

  // 5. Scorch Mark & Disturbed Soil Ring around Landing Touchdown
  const scorchGeo = new THREE.RingGeometry(2.0, 5.2, 24);
  scorchGeo.rotateX(-Math.PI / 2);
  const scorchMesh = new THREE.Mesh(scorchGeo, disturbedSoilMat);
  scorchMesh.position.y = 0.02;
  scorchMesh.receiveShadow = true;
  group.add(scorchMesh);

  // 6. Subtle Astronaut Bootprint Trails radiating outward from lander platform
  const bootGeo = new THREE.PlaneGeometry(0.14, 0.28);
  bootGeo.rotateX(-Math.PI / 2);
  const bootMat = new THREE.MeshStandardMaterial({
    color: '#2e1208',
    transparent: true,
    opacity: 0.6,
  });

  // Outward stride trail towards the northeast (facing toward exploration path)
  for (let step = 0; step < 16; step++) {
    const dist = 2.8 + step * 0.62;
    const sideOffset = step % 2 === 0 ? 0.15 : -0.15;
    const angle = 0.85; // Northeast heading
    const bx = Math.sin(angle) * dist + Math.cos(angle) * sideOffset;
    const bz = -Math.cos(angle) * dist + Math.sin(angle) * sideOffset;

    const bootMesh = new THREE.Mesh(bootGeo, bootMat);
    bootMesh.position.set(bx, 0.03, bz);
    bootMesh.rotation.y = -angle;
    bootMesh.receiveShadow = true;
    group.add(bootMesh);
  }

  return {
    group,
    safeZoneRadius: 15.0, // Within 15m astronaut is in safe expedition base zone
    update: (time: number) => {
      const pulse = Math.sin(time * 3.5) * 0.5 + 0.5;
      const intensity = 0.5 + pulse * 1.6;
      beaconLight.intensity = intensity;
      (beaconMesh.material as THREE.MeshBasicMaterial).color.setRGB(
        0.22 * intensity,
        0.74 * intensity,
        0.97 * intensity
      );
    },
  };
}
