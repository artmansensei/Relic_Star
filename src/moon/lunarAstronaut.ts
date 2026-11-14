import * as THREE from 'three';
import { PlayerState } from '../mars/controls';

export interface LunarAstronaut {
  group: THREE.Group;
  update: (delta: number, playerState: PlayerState) => void;
  dispose: () => void;
}

/**
 * Creates an authentic Apollo / Artemis A7L lunar spacesuit astronaut body for first-person exploration.
 * Casts sharp lunar shadows on the regolith, provides suited knees/boots when looking down,
 * and maintains continuous, anatomical limbs firmly planted on the ground without floating.
 */
export function createLunarAstronaut(terrainHeightFn: (x: number, z: number) => number): LunarAstronaut {
  const group = new THREE.Group();
  group.name = 'lunar_astronaut_body';

  // 1. Shared Spacesuit PBR Materials
  const suitFabricMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#cbd5e1'), // Beta cloth / orthofabric off-white
    roughness: 0.72,
    metalness: 0.12,
  });

  const jointBellowsMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e293b'), // Pressurized neoprene-coated bellows joints
    roughness: 0.85,
    metalness: 0.08,
  });

  const goldVisorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f59e0b'), // Gold-plated thermal sun visor
    metalness: 0.95,
    roughness: 0.06,
  });

  const helmetShellMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f1f5f9'),
    roughness: 0.35,
    metalness: 0.25,
  });

  const plssBackpackMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'), // White thermal blanket PLSS life-support pack
    roughness: 0.65,
    metalness: 0.15,
  });

  const bootSoleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1f2937'), // Lunar silicone chevron tread overboots
    roughness: 0.94,
    metalness: 0.05,
  });

  const blueRingMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0284c7'), // Water cooling connection ring
    metalness: 0.85,
    roughness: 0.25,
  });

  const redRingMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dc2626'), // Primary oxygen connection ring
    metalness: 0.85,
    roughness: 0.25,
  });

  // ---------------------------------------------------------------------------
  // 2. Head & Helmet (Positioned at eye height, slightly offset backward)
  // ---------------------------------------------------------------------------
  const headGroup = new THREE.Group();
  headGroup.name = 'astronaut_helmet';
  headGroup.position.set(0, 1.62, -0.06);

  // Outer pressurized lunar extravehicular visor assembly (LEVA)
  const helmetGeo = new THREE.SphereGeometry(0.18, 20, 18);
  const helmet = new THREE.Mesh(helmetGeo, helmetShellMat);
  helmet.castShadow = true;
  headGroup.add(helmet);

  // Reflective Gold Sun Visor (Front-facing)
  const visorGeo = new THREE.SphereGeometry(0.165, 18, 14, -Math.PI / 2, Math.PI, 0, Math.PI * 0.7);
  const visor = new THREE.Mesh(visorGeo, goldVisorMat);
  visor.position.set(0, 0, 0.03);
  visor.rotation.x = 0.2;
  visor.castShadow = true;
  headGroup.add(visor);

  group.add(headGroup);

  // ---------------------------------------------------------------------------
  // 3. Suited Torso & Chest Remote Control Unit (RCU)
  // ---------------------------------------------------------------------------
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'astronaut_torso';
  torsoGroup.position.set(0, 1.25, -0.05);

  // Main pressurized torso body
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.52, 16);
  const torso = new THREE.Mesh(torsoGeo, suitFabricMat);
  torso.castShadow = true;
  torsoGroup.add(torso);

  // Chest Remote Control Unit (RCU) - Displays suit telemetry and houses purge valve
  const rcuGeo = new THREE.BoxGeometry(0.16, 0.18, 0.09);
  const rcu = new THREE.Mesh(rcuGeo, plssBackpackMat);
  rcu.position.set(0, 0.08, 0.20);
  rcu.castShadow = true;
  torsoGroup.add(rcu);

  // Blue and Red Suit Umbilical Rings
  const ringGeo = new THREE.TorusGeometry(0.022, 0.007, 8, 16);
  const blueRing = new THREE.Mesh(ringGeo, blueRingMat);
  blueRing.position.set(-0.06, 0.10, 0.23);
  torsoGroup.add(blueRing);

  const redRing = new THREE.Mesh(ringGeo, redRingMat);
  redRing.position.set(0.06, 0.10, 0.23);
  torsoGroup.add(redRing);

  // ---------------------------------------------------------------------------
  // 4. Portable Life Support System (PLSS) Backpack
  // ---------------------------------------------------------------------------
  const backpackGroup = new THREE.Group();
  backpackGroup.name = 'plss_backpack';
  backpackGroup.position.set(0, 1.34, -0.25);

  // Main PLSS housing
  const plssGeo = new THREE.BoxGeometry(0.38, 0.65, 0.24);
  const plss = new THREE.Mesh(plssGeo, plssBackpackMat);
  plss.castShadow = true;
  backpackGroup.add(plss);

  // Oxygen Purge System (OPS) auxiliary emergency bottle on top of backpack
  const opsGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.36, 12);
  opsGeo.rotateZ(Math.PI / 2);
  const ops = new THREE.Mesh(opsGeo, plssBackpackMat);
  ops.position.set(0, 0.38, 0);
  ops.castShadow = true;
  backpackGroup.add(ops);

  // VHF Communications Antenna Whip
  const antennaGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.60, 6);
  const antenna = new THREE.Mesh(antennaGeo, jointBellowsMat);
  antenna.position.set(0.14, 0.65, 0.02);
  antenna.rotation.z = -0.05;
  antenna.castShadow = true;
  backpackGroup.add(antenna);

  group.add(backpackGroup);
  group.add(torsoGroup);

  // ---------------------------------------------------------------------------
  // 5. Suited Legs & Lunar Overboots (Firmly touching regolith at ground level)
  // ---------------------------------------------------------------------------
  const createLeg = (isLeft: boolean) => {
    const legRoot = new THREE.Group();
    const sideX = isLeft ? -0.13 : 0.13;
    legRoot.position.set(sideX, 0.98, -0.05);

    // Thigh (Upper leg)
    const thighGeo = new THREE.CylinderGeometry(0.105, 0.095, 0.44, 14);
    const thigh = new THREE.Mesh(thighGeo, suitFabricMat);
    thigh.position.set(0, -0.22, 0);
    thigh.castShadow = true;
    legRoot.add(thigh);

    // Knee Accordion Bellows
    const kneeGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.10, 14);
    const knee = new THREE.Mesh(kneeGeo, jointBellowsMat);
    knee.position.set(0, -0.45, 0);
    knee.castShadow = true;
    legRoot.add(knee);

    // Shin (Lower leg)
    const shinGeo = new THREE.CylinderGeometry(0.095, 0.105, 0.42, 14);
    const shin = new THREE.Mesh(shinGeo, suitFabricMat);
    shin.position.set(0, -0.68, 0);
    shin.castShadow = true;
    legRoot.add(shin);

    // Apollo / Artemis Lunar Overboot (Ribbed sole firmly planted on regolith)
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0, -0.92, 0.05);

    const bootGeo = new THREE.BoxGeometry(0.15, 0.14, 0.32);
    const boot = new THREE.Mesh(bootGeo, suitFabricMat);
    boot.position.y = 0.07;
    boot.castShadow = true;
    bootGroup.add(boot);

    const soleGeo = new THREE.BoxGeometry(0.16, 0.04, 0.34);
    const sole = new THREE.Mesh(soleGeo, bootSoleMat);
    sole.position.y = 0.02;
    sole.castShadow = true;
    bootGroup.add(sole);

    legRoot.add(bootGroup);

    return { legRoot, thigh, shin, bootGroup };
  };

  const leftLeg = createLeg(true);
  const rightLeg = createLeg(false);
  group.add(leftLeg.legRoot);
  group.add(rightLeg.legRoot);

  let strideTimer = 0;

  const update = (delta: number, playerState: PlayerState) => {
    // 1. Position astronaut root at player coordinates
    const posX = playerState.position.x;
    const posZ = playerState.position.z;
    const groundY = terrainHeightFn(posX, posZ);

    // The astronaut's feet sit precisely at groundY
    group.position.set(posX, groundY, posZ);

    // 2. Rotate body to match player yaw heading
    const yawRad = (playerState.headingDeg * Math.PI) / 180;
    group.rotation.y = -yawRad + Math.PI;

    // 3. Leg Stride Animation & Terrain Contact
    const isMoving = playerState.isMoving;
    const isGrounded = playerState.isGrounded;

    if (isGrounded && isMoving) {
      const strideSpeed = playerState.isSprinting ? 12.0 : 7.5;
      strideTimer += delta * strideSpeed;

      const strideAngle = Math.sin(strideTimer) * 0.42;

      // Natural counter-swinging leg articulation
      leftLeg.legRoot.rotation.x = strideAngle;
      rightLeg.legRoot.rotation.x = -strideAngle;

      // Slight knee flex during leg recovery
      leftLeg.shin.rotation.x = strideAngle > 0 ? strideAngle * 0.7 : 0;
      rightLeg.shin.rotation.x = strideAngle < 0 ? -strideAngle * 0.7 : 0;
    } else if (!isGrounded) {
      // Airborne low-gravity hop: tuck knees gently up
      leftLeg.legRoot.rotation.x = 0.28;
      rightLeg.legRoot.rotation.x = 0.32;
      leftLeg.shin.rotation.x = -0.40;
      rightLeg.shin.rotation.x = -0.45;
    } else {
      // Idle standing firmly planted on the ground
      leftLeg.legRoot.rotation.x = 0;
      rightLeg.legRoot.rotation.x = 0;
      leftLeg.shin.rotation.x = 0;
      rightLeg.shin.rotation.x = 0;
    }
  };

  const dispose = () => {
    suitFabricMat.dispose();
    jointBellowsMat.dispose();
    goldVisorMat.dispose();
    helmetShellMat.dispose();
    plssBackpackMat.dispose();
    bootSoleMat.dispose();
    blueRingMat.dispose();
    redRingMat.dispose();
  };

  return {
    group,
    update,
    dispose,
  };
}
