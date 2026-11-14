import * as THREE from 'three';
import { LUNAR_ARTIFACT_LIST } from '../data/lunarArtifacts';

/**
 * Analytical procedural height formula for the 1000m x 1000m Lunar environment.
 * Recreates Mare Tranquillitatis with rolling basalt swells, Apennine/Taurus-Littrow massifs,
 * Hadley Rille sinuous depression, and 5 historical craters.
 */
export function getLunarTerrainHeight(x: number, z: number): number {
  const distFromOrigin = Math.sqrt(x * x + z * z);

  // 1. Broad rolling lunar mare basalt swells (Wavelengths 180m - 480m)
  let h = Math.sin(x * 0.0042 + 0.5) * Math.cos(z * 0.0038 + 0.3) * 8.5;
  h += Math.sin((x * 0.82 + z * 0.58) * 0.0085) * 4.6;
  h += Math.cos((x * 0.52 - z * 0.76) * 0.0135) * 3.1;

  // 2. Apennine & Taurus-Littrow Massif Hills
  if (x > 175) {
    const eastFactor = Math.min(1.0, (x - 175) / 225);
    h += eastFactor * 16.5 + Math.sin(z * 0.022 + 1.2) * 4.2 + Math.cos(x * 0.015) * 2.1;
  }
  if (x < -155 && z > 95) {
    const swDist = Math.sqrt((x + 155) ** 2 + (z - 95) ** 2);
    const swFactor = Math.min(1.0, swDist / 205);
    h += swFactor * 14.5 + Math.cos(x * 0.018) * 3.6 + Math.sin(z * 0.025) * 2.0;
  }

  // 3. Hadley Rille Sinuous Depression
  const rilleX = -230 + Math.sin(z * 0.012) * 35 + Math.cos(z * 0.028) * 8;
  const distToRille = Math.abs(x - rilleX);
  if (distToRille < 44 && z > -155 && z < 285) {
    const rilleProfile = 1.0 - Math.min(1.0, distToRille / 44);
    const channelStep = Math.cos(rilleProfile * Math.PI) * 0.5 + 0.5;
    h -= channelStep * 12.0;
  }

  // 4. Five Named Historical Craters
  function applyCrater(cx: number, cz: number, r: number, depth: number, rimHeight: number) {
    const d = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
    if (d < r * 1.5) {
      const norm = d / r;
      if (norm < 1.0) {
        const bowl = -depth * (1.0 - norm * norm);
        const rim = norm > 0.75 ? Math.sin((norm - 0.75) * 4 * Math.PI) * rimHeight : 0;
        h += bowl + rim;
      } else if (norm < 1.5) {
        h += Math.max(0, (1.5 - norm) / 0.5) * (rimHeight * 0.8);
      }
    }
  }

  // Crater 1: Apollo 11 West Crater
  applyCrater(-160, -190, 60, 8.5, 3.2);

  // Crater 2: Surveyor Crater
  applyCrater(180, -120, 52, 7.0, 2.8);

  // Crater 3: Shorty Crater (Apollo 17)
  applyCrater(250, 220, 48, 7.5, 3.0);

  // Crater 4: Cone Crater (Apollo 14)
  applyCrater(140, 300, 75, 10.5, 4.2);

  // Crater 5: Flamsteed Crater (Surveyor 1)
  applyCrater(-90, -340, 45, 6.0, 2.2);

  // Scattered micro-craters
  applyCrater(60, -80, 28, 4.2, 1.8);
  applyCrater(-70, 40, 24, 3.6, 1.5);
  applyCrater(-130, -50, 32, 4.8, 2.0);
  applyCrater(90, 110, 22, 3.2, 1.3);
  applyCrater(-240, -40, 36, 5.0, 2.1);
  applyCrater(40, 230, 26, 3.8, 1.6);
  applyCrater(-50, 260, 30, 4.2, 1.7);
  applyCrater(220, -260, 42, 5.6, 2.4);
  applyCrater(-110, 180, 20, 3.0, 1.2);
  applyCrater(160, -210, 25, 3.5, 1.4);
  applyCrater(-190, 120, 30, 4.0, 1.7);

  // 5. Regolith ripples
  h += Math.sin(x * 0.05 + z * 0.03) * 0.4;
  h += Math.cos(x * 0.12 - z * 0.08) * 0.2;

  // 6. Base clearing at (0, 0)
  if (distFromOrigin < 28) {
    const baseFactor = Math.min(1.0, distFromOrigin / 28);
    h = h * baseFactor + 0.8 * (1.0 - baseFactor);
  }

  // 7. Outer rim enclosure beyond 420m
  if (distFromOrigin > 420) {
    const wallFactor = Math.min(1.0, (distFromOrigin - 420) / 120);
    const jaggedPeaks =
      Math.sin(Math.atan2(z, x) * 11) * 7.5 +
      Math.cos(Math.atan2(z, x) * 21) * 4.8;
    h += wallFactor * (28.0 + jaggedPeaks);
  }

  // 8. Smooth local landing pad for Apollo 17 Challenger footpads near Shorty Crater rim (230, 190)
  const distToChallenger = Math.sqrt((x - 230) ** 2 + (z - 190) ** 2);
  if (distToChallenger < 11) {
    const targetElevation = 5.25;
    if (distToChallenger <= 5.5) {
      h = targetElevation;
    } else {
      const u = (distToChallenger - 5.5) / (11 - 5.5);
      const t = u * u * (3 - 2 * u);
      h = targetElevation * (1 - t) + h * t;
    }
  }

  return h;
}

/**
 * Creates the restored 1000m x 1000m 3D lunar terrain mesh and boulders.
 * Clean, authentic lunar regolith with vertex-colored mare and ejecta rays.
 */
export function createMoonTerrain(): {
  terrainMesh: THREE.Mesh;
  rocksMesh: THREE.InstancedMesh;
} {
  const size = 1000;
  const segments = 180;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const darkBasalt = new THREE.Color('#2d3035'); // Dark titanium-rich mare regolith
  const lightAnorthosite = new THREE.Color('#717782'); // Highland feldspar ejecta ray
  const craterFloor = new THREE.Color('#24262b');

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const vy = getLunarTerrainHeight(vx, vz);
    posAttr.setY(i, vy);

    const heightFactor = Math.max(0, Math.min(1, (vy + 8) / 28));
    const noise = Math.sin(vx * 0.035) * Math.cos(vz * 0.035) * 0.15;
    const vertexColor = darkBasalt.clone().lerp(lightAnorthosite, Math.max(0, Math.min(1, heightFactor + noise)));

    if (vy < -2.0) {
      vertexColor.lerp(craterFloor, 0.4);
    }

    colors[i * 3] = vertexColor.r;
    colors[i * 3 + 1] = vertexColor.g;
    colors[i * 3 + 2] = vertexColor.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.04,
    flatShading: false,
  });

  const terrainMesh = new THREE.Mesh(geo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.name = 'lunar_regolith_terrain';

  // Procedural Lunar Boulder Field
  const rockCount = 650;
  const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#444850'),
    roughness: 0.88,
    metalness: 0.1,
    flatShading: true,
  });

  const rocksMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rocksMesh.castShadow = true;
  rocksMesh.receiveShadow = true;
  rocksMesh.name = 'lunar_boulder_field';

  const artifactClearanceZones = LUNAR_ARTIFACT_LIST.map((a) => ({
    x: a.worldPosition.x,
    z: a.worldPosition.z,
  }));

  const isNearArtifact = (px: number, pz: number, clearanceRadius: number) =>
    artifactClearanceZones.some(
      (az) => (px - az.x) * (px - az.x) + (pz - az.z) * (pz - az.z) < clearanceRadius * clearanceRadius
    );

  const dummy = new THREE.Object3D();
  let placed = 0;
  let attempts = 0;

  while (placed < rockCount && attempts < 12000) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const r = 25 + Math.pow(Math.random(), 0.75) * 430;
    const rx = Math.cos(angle) * r;
    const rz = Math.sin(angle) * r;

    // Keep all 11 lunar artifact sites clear of obstructing boulders
    if (isNearArtifact(rx, rz, 12)) continue;

    const ry = getLunarTerrainHeight(rx, rz);

    const scale = 0.3 + Math.pow(Math.random(), 2.5) * 2.2;
    const embedY = ry + scale * 0.35;

    dummy.position.set(rx, embedY, rz);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.scale.set(
      scale * (0.85 + Math.random() * 0.3),
      scale * (0.7 + Math.random() * 0.3),
      scale * (0.85 + Math.random() * 0.3)
    );
    dummy.updateMatrix();
    rocksMesh.setMatrixAt(placed++, dummy.matrix);
  }

  rocksMesh.count = placed;
  rocksMesh.instanceMatrix.needsUpdate = true;

  return { terrainMesh, rocksMesh };
}
