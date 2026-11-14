import * as THREE from 'three';
import { getTerrainHeight } from './terrain';

export interface DescentVehicleManager {
  group: THREE.Group;
  update: (elapsedSec: number, delta: number) => {
    isComplete: boolean;
    cameraPosition: THREE.Vector3;
    cameraTarget: THREE.Vector3;
    phaseProgress: number; // 0 to 1
  };
  skipToTouchdown: () => void;
  reset: () => void;
}

/**
 * Creates the cinematic NASA Mars Crew Descent Vehicle (Ares MDV).
 * Features an authentic biconic aerodynamic capsule, articulated landing legs,
 * retrorocket descent thrusters, ground dust disturbance, and smooth camera choreography.
 */
export function createDescentVehicle(): DescentVehicleManager {
  const group = new THREE.Group();

  // Landing touchdown coordinates: positioned at landing base clearing just behind astronaut spawn (0, 0)
  const TOUCHDOWN_X = 0.0;
  const TOUCHDOWN_Z = -3.2;
  const terrainTouchY = getTerrainHeight(TOUCHDOWN_X, TOUCHDOWN_Z);
  const TOUCHDOWN_Y = terrainTouchY + 0.32;

  // Materials
  const heatshieldMat = new THREE.MeshStandardMaterial({
    color: '#1a1b20',
    roughness: 0.85,
    metalness: 0.25,
  });

  const capsuleTileMat = new THREE.MeshStandardMaterial({
    color: '#e2e6eb',
    roughness: 0.45,
    metalness: 0.2,
  });

  const goldThermalMat = new THREE.MeshStandardMaterial({
    color: '#d49d3b',
    roughness: 0.25,
    metalness: 0.88,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: '#2b2e35',
    roughness: 0.4,
    metalness: 0.8,
  });

  const chromePistonMat = new THREE.MeshStandardMaterial({
    color: '#b0b8c2',
    roughness: 0.2,
    metalness: 0.95,
  });

  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: '#0a2233',
    roughness: 0.1,
    metalness: 0.9,
  });

  // 1. Vehicle Hull Group
  const hullGroup = new THREE.Group();
  group.add(hullGroup);

  // A. Heat Shield Base
  const heatshieldGeo = new THREE.CylinderGeometry(1.65, 1.48, 0.32, 24);
  const heatshield = new THREE.Mesh(heatshieldGeo, heatshieldMat);
  heatshield.position.y = 0.16;
  heatshield.castShadow = true;
  heatshield.receiveShadow = true;
  hullGroup.add(heatshield);

  // B. Lower Conical Section
  const lowerConeGeo = new THREE.CylinderGeometry(1.35, 1.65, 0.9, 24);
  const lowerCone = new THREE.Mesh(lowerConeGeo, capsuleTileMat);
  lowerCone.position.y = 0.77;
  lowerCone.castShadow = true;
  hullGroup.add(lowerCone);

  // C. Gold Kapton Insulation Mid-Ring
  const foilBandGeo = new THREE.CylinderGeometry(1.36, 1.36, 0.16, 24);
  const foilBand = new THREE.Mesh(foilBandGeo, goldThermalMat);
  foilBand.position.y = 1.25;
  foilBand.castShadow = true;
  hullGroup.add(foilBand);

  // D. Upper Crew Cabin Conical Section
  const upperConeGeo = new THREE.CylinderGeometry(0.72, 1.35, 1.25, 24);
  const upperCone = new THREE.Mesh(upperConeGeo, capsuleTileMat);
  upperCone.position.y = 1.95;
  upperCone.castShadow = true;
  hullGroup.add(upperCone);

  // E. Apex Parachute Cannister & Docking Collar
  const apexGeo = new THREE.CylinderGeometry(0.48, 0.72, 0.4, 24);
  const apex = new THREE.Mesh(apexGeo, darkAlloyMat);
  apex.position.y = 2.77;
  apex.castShadow = true;
  hullGroup.add(apex);

  // F. Viewing Windows (Portholes)
  for (let i = 0; i < 3; i++) {
    const angle = (i - 1) * 0.45 + Math.PI * 0.5; // Facing forward/side
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16), windowGlassMat);
    win.rotation.x = Math.PI * 0.5;
    win.position.set(Math.cos(angle) * 1.05, 1.9, Math.sin(angle) * 1.05);
    win.lookAt(win.position.x * 2, 1.9, win.position.z * 2);
    hullGroup.add(win);
  }

  // G. EVA Hatch Frame & Door (Facing positive Z / towards landing base)
  const hatchGeo = new THREE.BoxGeometry(0.55, 0.85, 0.06);
  const hatch = new THREE.Mesh(hatchGeo, darkAlloyMat);
  hatch.position.set(0, 1.35, 1.4);
  hatch.rotation.x = 0.18; // Matching conical slope
  hullGroup.add(hatch);

  // H. RCS Thruster Quads on 4 Corners
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI * 0.25;
    const rcsBlock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.14), darkAlloyMat);
    rcsBlock.position.set(Math.cos(angle) * 1.36, 1.35, Math.sin(angle) * 1.36);
    rcsBlock.rotation.y = -angle;
    hullGroup.add(rcsBlock);
  }

  // 2. Articulated Landing Legs (4 Legs)
  interface LegData {
    pivotGroup: THREE.Group;
    strutMesh: THREE.Mesh;
    footpadMesh: THREE.Mesh;
    pistonMesh: THREE.Mesh;
    baseAngle: number;
  }

  const legs: LegData[] = [];
  const legAngles = [
    Math.PI * 0.25,
    Math.PI * 0.75,
    Math.PI * 1.25,
    Math.PI * 1.75,
  ];

  legAngles.forEach((angle) => {
    const pivotGroup = new THREE.Group();
    // Position pivot on the lower heatshield perimeter
    pivotGroup.position.set(Math.cos(angle) * 1.48, 0.35, Math.sin(angle) * 1.48);
    pivotGroup.rotation.y = -angle;

    // Main landing gear strut (rotates outward on deployment)
    const strutGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.4, 8);
    const strutMesh = new THREE.Mesh(strutGeo, darkAlloyMat);
    strutMesh.position.set(0, -0.65, 0.35);
    strutMesh.rotation.x = -0.55;
    strutMesh.castShadow = true;
    pivotGroup.add(strutMesh);

    // Hydraulic shock piston
    const pistonGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.65, 8);
    const pistonMesh = new THREE.Mesh(pistonGeo, chromePistonMat);
    pistonMesh.position.set(0, -0.4, 0.2);
    pistonMesh.rotation.x = -0.55;
    pivotGroup.add(pistonMesh);

    // Circular articulated footpad
    const footpadGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.06, 12);
    const footpadMesh = new THREE.Mesh(footpadGeo, darkAlloyMat);
    footpadMesh.position.set(0, -1.25, 0.72);
    footpadMesh.receiveShadow = true;
    pivotGroup.add(footpadMesh);

    hullGroup.add(pivotGroup);
    legs.push({ pivotGroup, strutMesh, footpadMesh, pistonMesh, baseAngle: angle });
  });

  // 3. Retrorocket Descent Thruster Nozzles & Exhaust Flame
  const thrustersGroup = new THREE.Group();
  hullGroup.add(thrustersGroup);

  const flameMeshes: THREE.Mesh[] = [];
  const innerFlameMeshes: THREE.Mesh[] = [];

  const thrusterOffsets = [
    { x: 0.6, z: 0.6 },
    { x: -0.6, z: 0.6 },
    { x: 0.6, z: -0.6 },
    { x: -0.6, z: -0.6 },
  ];

  thrusterOffsets.forEach((pos) => {
    // Engine nozzle bell
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.07, 0.24, 12),
      darkAlloyMat
    );
    nozzle.position.set(pos.x, 0.05, pos.z);
    thrustersGroup.add(nozzle);

    // Outer flame cone (Vibrant glowing warm orange with additive blending)
    const flameGeo = new THREE.ConeGeometry(0.22, 1.4, 12);
    flameGeo.rotateX(Math.PI); // Point down
    flameGeo.translate(0, -0.7, 0);

    const flameMat = new THREE.MeshBasicMaterial({
      color: '#ff8822',
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(pos.x, 0.0, pos.z);
    thrustersGroup.add(flameMesh);
    flameMeshes.push(flameMesh);

    // Inner bright core flame
    const innerGeo = new THREE.ConeGeometry(0.11, 0.95, 12);
    innerGeo.rotateX(Math.PI);
    innerGeo.translate(0, -0.47, 0);

    const innerMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.set(pos.x, 0.0, pos.z);
    thrustersGroup.add(innerMesh);
    innerFlameMeshes.push(innerMesh);
  });

  // Descent Engine Light (Illuminates ground beneath vehicle)
  const engineLight = new THREE.PointLight(0xff9944, 4.0, 32, 1.8);
  engineLight.position.set(0, -0.2, 0);
  thrustersGroup.add(engineLight);

  // 4. Ground Dust Disturbance Ring (Positioned at touchdown ground level)
  const dustRingGeo = new THREE.RingGeometry(0.8, 4.2, 24);
  dustRingGeo.rotateX(-Math.PI / 2);
  const dustRingMat = new THREE.MeshBasicMaterial({
    color: '#d46a38',
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const dustRing = new THREE.Mesh(dustRingGeo, dustRingMat);
  dustRing.position.set(TOUCHDOWN_X, terrainTouchY + 0.04, TOUCHDOWN_Z);
  group.add(dustRing);

  // 5. Expandable Dust Particles for Touchdown Plume
  const dustPuffsGroup = new THREE.Group();
  dustPuffsGroup.position.set(TOUCHDOWN_X, terrainTouchY + 0.1, TOUCHDOWN_Z);
  group.add(dustPuffsGroup);

  const puffMeshes: THREE.Mesh[] = [];
  const puffMat = new THREE.MeshBasicMaterial({
    color: '#b8582d',
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });

  for (let i = 0; i < 8; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), puffMat.clone());
    puff.scale.set(1, 0.35, 1);
    dustPuffsGroup.add(puff);
    puffMeshes.push(puff);
  }

  // Animation Timeline Constants
  const TOTAL_DURATION = 9.8; // seconds
  const TOUCHDOWN_TIME = 6.6; // seconds
  const SETTLE_TIME = 8.0; // seconds
  const TRANSITION_END = 9.8; // seconds

  // Camera animation waypoints
  const camStartPos = new THREE.Vector3(TOUCHDOWN_X + 14.0, terrainTouchY + 22.0, TOUCHDOWN_Z + 18.0);
  const camMidPos = new THREE.Vector3(TOUCHDOWN_X + 7.5, terrainTouchY + 5.5, TOUCHDOWN_Z + 8.0);
  const camLandedPos = new THREE.Vector3(TOUCHDOWN_X + 4.2, terrainTouchY + 2.4, TOUCHDOWN_Z + 4.5);
  // Final astronaut first-person camera: exact spawn position at (0, startY + 1.75, 0)
  const astronautY = getTerrainHeight(0, 0) + 1.75;
  const camFinalPos = new THREE.Vector3(0, astronautY, 0);

  // Forward direction corresponding to starting astronaut yaw = Math.PI * 0.76 (~azimuth 48° northeast)
  const spawnYaw = Math.PI * 0.76;
  const forwardLook = new THREE.Vector3(-Math.sin(spawnYaw), 0, -Math.cos(spawnYaw)).multiplyScalar(50);
  const camFinalTarget = new THREE.Vector3(0, astronautY, 0).add(forwardLook);

  let isComplete = false;

  // Set initial craft position at high altitude
  hullGroup.position.set(TOUCHDOWN_X + 1.8, terrainTouchY + 36.0, TOUCHDOWN_Z - 3.2);

  return {
    group,

    skipToTouchdown: () => {
      isComplete = true;
      // Instantly position vehicle safely landed
      hullGroup.position.set(TOUCHDOWN_X, TOUCHDOWN_Y, TOUCHDOWN_Z);
      hullGroup.rotation.set(0, 0, 0);

      // Fully deploy legs
      legs.forEach((leg) => {
        leg.pivotGroup.rotation.z = 0;
      });

      // Extinguish thruster flame & light
      flameMeshes.forEach((f) => f.scale.set(0, 0, 0));
      innerFlameMeshes.forEach((f) => f.scale.set(0, 0, 0));
      engineLight.intensity = 0;
      dustRingMat.opacity = 0;
      puffMeshes.forEach((p) => {
        (p.material as THREE.MeshBasicMaterial).opacity = 0;
      });
    },

    reset: () => {
      isComplete = false;
      hullGroup.position.set(TOUCHDOWN_X + 1.8, terrainTouchY + 36.0, TOUCHDOWN_Z - 3.2);
      hullGroup.rotation.set(0, 0, 0);
      legs.forEach((leg) => {
        leg.pivotGroup.rotation.z = -0.7; // folded
      });
      flameMeshes.forEach((f) => f.scale.set(1, 1, 1));
      innerFlameMeshes.forEach((f) => f.scale.set(1, 1, 1));
      engineLight.intensity = 4.0;
      dustRingMat.opacity = 0;
    },

    update: (elapsedSec: number, delta: number) => {
      const cameraPosition = new THREE.Vector3();
      const cameraTarget = new THREE.Vector3();

      if (isComplete || elapsedSec >= TOTAL_DURATION) {
        isComplete = true;
        cameraPosition.copy(camFinalPos);
        cameraTarget.copy(camFinalTarget);
        return {
          isComplete: true,
          cameraPosition,
          cameraTarget,
          phaseProgress: 1.0,
        };
      }

      // PHASE 1: Controlled Descent from Altitude (0.0s to 6.6s)
      if (elapsedSec < TOUCHDOWN_TIME) {
        const tDesc = elapsedSec / TOUCHDOWN_TIME;
        // Cubic ease-out curve for terminal deceleration: fast in high sky, gentle cushioning on touchdown
        const altitudeEase = 1 - Math.pow(1 - tDesc, 2.4);

        const currentY = THREE.MathUtils.lerp(terrainTouchY + 36.0, TOUCHDOWN_Y, altitudeEase);
        const currentX = THREE.MathUtils.lerp(TOUCHDOWN_X + 1.8, TOUCHDOWN_X, tDesc);
        const currentZ = THREE.MathUtils.lerp(TOUCHDOWN_Z - 3.2, TOUCHDOWN_Z, tDesc);

        // Subtle attitude oscillation (aerodynamic guidance stabilization)
        const tiltRoll = Math.sin(elapsedSec * 2.5) * 0.035 * (1 - tDesc);
        const tiltPitch = Math.cos(elapsedSec * 2.1) * 0.025 * (1 - tDesc);

        hullGroup.position.set(currentX, currentY, currentZ);
        hullGroup.rotation.set(tiltPitch, 0, tiltRoll);

        // Landing Gear Deployment (starts at 3.8s, locks by 5.8s)
        const legDeployStart = 3.6;
        const legDeployEnd = 5.8;
        if (elapsedSec < legDeployStart) {
          // Folded tightly
          legs.forEach((l) => (l.pivotGroup.rotation.z = -0.7));
        } else if (elapsedSec < legDeployEnd) {
          const legProgress = (elapsedSec - legDeployStart) / (legDeployEnd - legDeployStart);
          const easeLegs = Math.sin((legProgress * Math.PI) / 2);
          const currentLegAngle = THREE.MathUtils.lerp(-0.7, 0.0, easeLegs);
          legs.forEach((l) => (l.pivotGroup.rotation.z = currentLegAngle));
        } else {
          legs.forEach((l) => (l.pivotGroup.rotation.z = 0.0));
        }

        // Thruster flame dynamics & dynamic ground flicker
        const flicker = Math.sin(elapsedSec * 45) * 0.12 + 0.88;
        const flameScale = Math.max(0.6, 1.2 - tDesc * 0.4) * flicker;
        flameMeshes.forEach((f) => f.scale.set(flameScale, flameScale, flameScale));
        innerFlameMeshes.forEach((f) => f.scale.set(flameScale, flameScale * 1.1, flameScale));
        engineLight.intensity = (3.5 + Math.sin(elapsedSec * 35) * 0.8) * flicker;

        // Ground dust ring expands as vehicle gets within 14m of surface
        const altFromGround = currentY - TOUCHDOWN_Y;
        if (altFromGround < 14) {
          const prox = 1 - altFromGround / 14;
          dustRingMat.opacity = prox * 0.65;
          const dustScale = 1.0 + prox * 0.8;
          dustRing.scale.set(dustScale, dustScale, dustScale);
        } else {
          dustRingMat.opacity = 0;
        }

        // Cinematic Camera Track during descent:
        if (elapsedSec < 3.8) {
          // High cinematic orbit
          const camT = elapsedSec / 3.8;
          cameraPosition.lerpVectors(camStartPos, camMidPos, Math.sin((camT * Math.PI) / 2));
        } else {
          // Mid-to-ground approach track
          const camT = (elapsedSec - 3.8) / (TOUCHDOWN_TIME - 3.8);
          cameraPosition.lerpVectors(camMidPos, camLandedPos, Math.sin((camT * Math.PI) / 2));
        }

        // Camera always tracks the descent vehicle center
        cameraTarget.set(currentX, currentY + 1.0, currentZ);
      }
      // PHASE 2: Touchdown, Suspension Cushion & Engine Cutoff (6.6s to 8.0s)
      else if (elapsedSec < SETTLE_TIME) {
        const tTouch = (elapsedSec - TOUCHDOWN_TIME) / (SETTLE_TIME - TOUCHDOWN_TIME);

        // Suspension cushion impact & rebound
        const compressionDip = Math.sin(tTouch * Math.PI) * 0.07 * Math.exp(-tTouch * 4);
        hullGroup.position.set(TOUCHDOWN_X, TOUCHDOWN_Y - compressionDip, TOUCHDOWN_Z);
        hullGroup.rotation.set(0, 0, 0);

        // Immediate retrorocket shutdown
        const cutoff = Math.max(0, 1 - tTouch * 4.0);
        flameMeshes.forEach((f) => f.scale.set(cutoff, cutoff, cutoff));
        innerFlameMeshes.forEach((f) => f.scale.set(cutoff, cutoff, cutoff));
        engineLight.intensity = cutoff * 2.0;

        // Ground dust puff expanding outwards and softly dissipating
        dustRingMat.opacity = Math.max(0, dustRingMat.opacity - delta * 0.8);

        puffMeshes.forEach((puff, idx) => {
          const angle = (idx * Math.PI * 2) / puffMeshes.length;
          const expandDist = 1.2 + tTouch * 3.8;
          puff.position.set(Math.cos(angle) * expandDist, 0.15 + tTouch * 0.25, Math.sin(angle) * expandDist);
          const pScale = 0.6 + tTouch * 2.2;
          puff.scale.set(pScale, pScale * 0.35, pScale);
          const pMat = puff.material as THREE.MeshBasicMaterial;
          pMat.opacity = Math.max(0, 0.55 * (1 - tTouch));
        });

        cameraPosition.copy(camLandedPos);
        cameraTarget.set(TOUCHDOWN_X, TOUCHDOWN_Y + 1.2, TOUCHDOWN_Z);
      }
      // PHASE 3: Camera Glide into Astronaut Helmet (8.0s to 9.8s)
      else {
        const tTrans = (elapsedSec - SETTLE_TIME) / (TRANSITION_END - SETTLE_TIME);
        // Smoothstep cubic easing for flawless cinematic dive into helmet
        const smoothTrans = tTrans * tTrans * (3 - 2 * tTrans);

        hullGroup.position.set(TOUCHDOWN_X, TOUCHDOWN_Y, TOUCHDOWN_Z);

        // Fade any remaining dust puffs
        puffMeshes.forEach((p) => {
          (p.material as THREE.MeshBasicMaterial).opacity = 0;
        });

        // Interpolate camera position from landing spot to astronaut eyes
        cameraPosition.lerpVectors(camLandedPos, camFinalPos, smoothTrans);

        // Interpolate look-at target from descent capsule to astronaut forward yaw
        const currentCraftLook = new THREE.Vector3(TOUCHDOWN_X, TOUCHDOWN_Y + 1.2, TOUCHDOWN_Z);
        cameraTarget.lerpVectors(currentCraftLook, camFinalTarget, smoothTrans);
      }

      return {
        isComplete: false,
        cameraPosition,
        cameraTarget,
        phaseProgress: Math.min(1.0, elapsedSec / TOTAL_DURATION),
      };
    },
  };
}
