import * as THREE from 'three';
import { getLunarTerrainHeight } from './moonTerrain';

export interface LunarDescentVehicle {
  group: THREE.Group;
  update: (elapsedSec: number, delta: number) => {
    cameraPosition: THREE.Vector3;
    cameraTarget: THREE.Vector3;
    isComplete: boolean;
  };
  reset: () => void;
  skipToTouchdown: () => void;
}

/**
 * Procedural Lunar Lander (Artemis / Apollo Human Landing System).
 * Features octagonal golden Kapton thermal hull, four articulated landing legs with footpads,
 * throttleable descent engine bell, and landing descent thruster animations.
 */
export function createLunarDescentVehicle(): LunarDescentVehicle {
  const group = new THREE.Group();
  group.name = 'lunar_descent_craft';

  const groundY = getLunarTerrainHeight(0, 0);

  // Materials
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Bright Kapton gold insulation
    metalness: 0.85,
    roughness: 0.3,
  });

  const blackPyromarkMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.2,
  });

  const aluminumStrutMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.75,
    roughness: 0.35,
  });

  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.4,
  });

  // 1. Octagonal Main Descent Stage Hull
  const hullGeo = new THREE.CylinderGeometry(3.2, 3.5, 2.4, 8);
  const hull = new THREE.Mesh(hullGeo, goldFoilMat);
  hull.position.y = 2.4;
  hull.castShadow = true;
  group.add(hull);

  // Upper Ascent Stage Habitation Module
  const habGeo = new THREE.CylinderGeometry(2.2, 2.6, 2.0, 8);
  const hab = new THREE.Mesh(habGeo, blackPyromarkMat);
  hab.position.y = 4.4;
  hab.castShadow = true;
  group.add(hab);

  // Forward EVA Hatch & Porch
  const hatchGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
  const hatch = new THREE.Mesh(hatchGeo, aluminumStrutMat);
  hatch.position.set(0, 4.3, 2.3);
  group.add(hatch);

  // 2. Descent Propulsion Engine Bell
  const bellGeo = new THREE.ConeGeometry(1.2, 1.8, 16, 1, true);
  const bell = new THREE.Mesh(bellGeo, engineMat);
  bell.position.y = 0.9;
  bell.rotation.x = Math.PI;
  group.add(bell);

  // Descent Rocket Thruster Exhaust Plume (Cyan-white vacuum expansion cone)
  const plumeGeo = new THREE.ConeGeometry(1.6, 5.0, 16, 1, true);
  const plumeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.position.y = -1.6;
  group.add(plume);

  const thrusterLight = new THREE.PointLight(0x38bdf8, 3.5, 30);
  thrusterLight.position.y = 0.2;
  group.add(thrusterLight);

  // 3. Four Outrigger Landing Legs with Circular Dish Footpads
  const legAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  legAngles.forEach((angle) => {
    const legGroup = new THREE.Group();
    legGroup.rotation.y = angle;

    // Primary diagonal strut
    const strutGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.2, 8);
    const strut = new THREE.Mesh(strutGeo, aluminumStrutMat);
    strut.position.set(0, 1.5, 3.0);
    strut.rotation.x = -0.65;
    strut.castShadow = true;
    legGroup.add(strut);

    // Circular dish footpad
    const padGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.1, 16);
    const pad = new THREE.Mesh(padGeo, goldFoilMat);
    pad.position.set(0, 0.05, 4.6);
    legGroup.add(pad);

    group.add(legGroup);
  });

  // Forward Ladder
  const ladderGeo = new THREE.BoxGeometry(0.6, 2.8, 0.08);
  const ladder = new THREE.Mesh(ladderGeo, aluminumStrutMat);
  ladder.position.set(0, 2.0, 3.6);
  ladder.rotation.x = -0.3;
  group.add(ladder);

  // Descent parameters
  const START_ALTITUDE = 160;
  const LANDING_DURATION = 12.0; // seconds

  let currentAltitude = START_ALTITUDE;
  group.position.set(0, groundY + START_ALTITUDE, 0);

  const reset = () => {
    currentAltitude = START_ALTITUDE;
    group.position.set(0, groundY + START_ALTITUDE, 0);
    plume.visible = true;
    thrusterLight.visible = true;
  };

  const skipToTouchdown = () => {
    currentAltitude = 0;
    group.position.set(0, groundY, 0);
    plume.visible = false;
    thrusterLight.visible = false;
  };

  const update = (elapsedSec: number, delta: number) => {
    const progress = Math.min(1.0, elapsedSec / LANDING_DURATION);

    // Ease-in-out landing trajectory
    const ease =
      progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    currentAltitude = THREE.MathUtils.lerp(START_ALTITUDE, 0, ease);

    group.position.y = groundY + currentAltitude;

    // Thruster throttle down as touchdown nears
    if (progress > 0.95) {
      plume.visible = false;
      thrusterLight.visible = false;
    } else {
      plume.visible = true;
      thrusterLight.visible = true;
      plume.scale.set(
        1.0 + Math.sin(elapsedSec * 25) * 0.15,
        1.0 + Math.cos(elapsedSec * 20) * 0.2,
        1.0 + Math.sin(elapsedSec * 25) * 0.15
      );
    }

    // Dynamic camera tracking landing descent
    const camAngle = elapsedSec * 0.35;
    const camRadius = THREE.MathUtils.lerp(85, 32, ease);
    const camHeight = THREE.MathUtils.lerp(groundY + 80, groundY + 12, ease);

    const cameraPosition = new THREE.Vector3(
      Math.sin(camAngle) * camRadius,
      camHeight,
      Math.cos(camAngle) * camRadius
    );
    const cameraTarget = new THREE.Vector3(0, group.position.y + 2.5, 0);

    return {
      cameraPosition,
      cameraTarget,
      isComplete: progress >= 1.0,
    };
  };

  return {
    group,
    update,
    reset,
    skipToTouchdown,
  };
}
