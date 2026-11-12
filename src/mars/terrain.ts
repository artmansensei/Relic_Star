import * as THREE from 'three';

/**
 * Analytical procedural height formula for the expanded 1000m x 1000m Mars environment.
 * Evaluates seamlessly anywhere on the planetary surface with multi-scale geological features.
 */
export function getTerrainHeight(x: number, z: number): number {
  const distFromOrigin = Math.sqrt(x * x + z * z);

  // 1. Broad rolling Martian geological swells & regional plateaus (Wavelengths 150m - 400m)
  let h = Math.sin(x * 0.0055 + 0.8) * Math.cos(z * 0.0048 + 0.6) * 11.5;
  h += Math.sin((x * 0.9 + z * 0.7) * 0.011) * 6.2;
  h += Math.cos((x * 0.6 - z * 0.85) * 0.016) * 4.4;

  // 2. Medium-scale ridge systems & natural geological escarpments
  // Ridge 1 (North-East Spur blocking Spirit line-of-sight from base)
  const neRidgeDist = Math.abs(x * 0.6 + z * 0.8 + 90);
  if (neRidgeDist < 45) {
    const ridgeProfile = Math.cos((neRidgeDist / 45) * (Math.PI / 2));
    h += ridgeProfile * 9.5;
  }

  // Ridge 2 (North-West Escarpment blocking Opportunity from base)
  const nwRidgeDist = Math.abs(-x * 0.75 + z * 0.65 + 110);
  if (nwRidgeDist < 50) {
    const ridgeProfile = Math.cos((nwRidgeDist / 50) * (Math.PI / 2));
    h += ridgeProfile * 10.2;
  }

  // Ridge 3 (Southern Swell blocking Phoenix and InSight from base)
  const sRidgeDist = Math.abs(z - 110);
  if (sRidgeDist < 55) {
    const ridgeProfile = Math.cos((sRidgeDist / 55) * (Math.PI / 2));
    h += ridgeProfile * 8.4;
  }

  // 3. Aeolian sand dunes, drift swells & regolith ripples (Wavelengths 6m - 45m)
  h += Math.sin(x * 0.038 + z * 0.022) * 1.6;
  h += Math.cos(x * 0.075 - z * 0.062) * 0.65;
  h += Math.sin(x * 0.18 + z * 0.14) * 0.22;
  h += Math.cos(x * 0.32 - z * 0.28) * 0.08;

  // 4. Primary Craters & Geological Impact Basins across the 1000m domain
  // Crater A: Spirit Ridge Crater (x: 140, z: -180, radius: 55m)
  applyCrater(140, -180, 55, 6.8, 2.8);

  // Crater B: Opportunity Meridiani-Style Crater (x: -200, z: -160, radius: 70m)
  applyCrater(-200, -160, 70, 8.5, 3.8);

  // Crater C: Phoenix Northern Basin (x: -180, z: 220, radius: 58m)
  applyCrater(-180, 220, 58, 6.2, 2.6);

  // Crater D: InSight Eastern Plain Crater (x: 230, z: 170, radius: 52m)
  applyCrater(230, 170, 52, 5.8, 2.4);

  // Crater E: Deep Northern Rise Basin near Curiosity (x: 50, z: -340, radius: 68m)
  applyCrater(50, -340, 68, 9.2, 4.2);

  // Scattered Smaller Impact Craters across the landscape
  applyCrater(-75, -45, 22, 3.4, 1.4);
  applyCrater(85, -65, 24, 3.6, 1.5);
  applyCrater(-110, 95, 26, 3.8, 1.6);
  applyCrater(125, 75, 20, 3.1, 1.3);
  applyCrater(-280, 60, 38, 4.8, 2.0);
  applyCrater(290, -110, 42, 5.2, 2.2);

  function applyCrater(cx: number, cz: number, r: number, maxDepth: number, rimRise: number) {
    const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
    if (dist < r * 1.45) {
      const norm = dist / r;
      if (norm < 1.0) {
        // Flat parabolic bowl depression
        const bowl = -maxDepth * (1.0 - Math.pow(norm, 1.85));
        // Raised ejecta rim wall near edge (norm 0.72 to 1.0)
        const rim = norm > 0.72 ? Math.sin(((norm - 0.72) / 0.28) * Math.PI) * rimRise : 0;
        h += bowl + rim;
      } else if (norm < 1.45) {
        // Outer ejecta slope falloff
        const falloff = (1.45 - norm) / 0.45;
        h += falloff * (rimRise * 0.75);
      }
    }
  }

  // 5. Mount Sharp / Deep Northern Rise beyond 320m (Elevation climbs majestically toward north)
  if (z < -300) {
    const northRiseFactor = Math.min(1.0, (-z - 300) / 220);
    h += northRiseFactor * 22.0 + Math.sin(x * 0.015) * 5.0;
  }

  // 6. Perimeter Mountain Ring (Beyond 440m, creates a natural horizon enclosing the 1000m world)
  if (distFromOrigin > 420) {
    const wallFactor = Math.min(1.0, (distFromOrigin - 420) / 120);
    const mountainPeaks =
      Math.sin(Math.atan2(z, x) * 9) * 6.5 +
      Math.cos(Math.atan2(z, x) * 17) * 4.2 +
      Math.sin(Math.atan2(z, x) * 29) * 2.8;
    h += wallFactor * (26.0 + mountainPeaks);
  }

  // 7. Flatten immediate Expedition Landing Clearing (radius 22m around (0, 0))
  // Gives the astronaut a stable, natural base zone
  if (distFromOrigin < 24) {
    const blend = Math.min(1.0, distFromOrigin / 24);
    // Cubic smoothstep
    const t = blend * blend * (3 - 2 * blend);
    h = h * t;
  }

  return h;
}

/**
 * Creates high-detail procedural canvas textures for Mars regolith.
 */
function createMarsTextures() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Fill base reddish-ochre ferric soil gradient
  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#a34825');
  baseGrad.addColorStop(0.35, '#b9562e');
  baseGrad.addColorStop(0.7, '#8f3b1b');
  baseGrad.addColorStop(1.0, '#ba582d');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Layer fine dust ripples & dark basalt deposits
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  function hash(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Fine high-frequency grain
      const grain = (hash(x * 0.3, y * 0.3) - 0.5) * 36;
      // Aeolian wind streaks (subtle angled bands)
      const windAngle = (x * 0.7 + y * 0.4) * 0.05;
      const ripple = Math.sin(windAngle) * 14;

      // Occasional dark iron oxide basalt mineral speck
      const isBasalt = hash(x * 0.85, y * 0.85) > 0.94;
      const basaltDarkness = isBasalt ? -35 : 0;

      data[idx] = Math.min(255, Math.max(0, data[idx] + grain + ripple + basaltDarkness));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain * 0.6 + ripple * 0.5 + basaltDarkness * 0.8));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain * 0.3 + ripple * 0.2 + basaltDarkness * 0.6));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const diffuseMap = new THREE.CanvasTexture(canvas);
  diffuseMap.wrapS = THREE.RepeatWrapping;
  diffuseMap.wrapT = THREE.RepeatWrapping;
  // Scaled for the 1000m domain so texture repeats naturally without tiling artifacts
  diffuseMap.repeat.set(96, 96);

  // Bump / Normal depth texture
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext('2d')!;
  const bImg = bCtx.createImageData(512, 512);
  const bData = bImg.data;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const bIdx = (y * 512 + x) * 4;
      const n1 = hash(x * 0.15, y * 0.15) * 180;
      const n2 = Math.sin((x + y) * 0.06) * 45;
      const val = Math.min(255, Math.max(0, n1 + n2));
      bData[bIdx] = val;
      bData[bIdx + 1] = val;
      bData[bIdx + 2] = val;
      bData[bIdx + 3] = 255;
    }
  }
  bCtx.putImageData(bImg, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(96, 96);

  return { diffuseMap, bumpMap };
}

export interface TerrainComponents {
  terrainMesh: THREE.Mesh;
  rocksMesh: THREE.InstancedMesh;
  smallPebblesMesh: THREE.InstancedMesh;
}

/**
 * Builds the complete explorable 1000m x 1000m Mars terrain with scattered boulders and rock fields.
 */
export function createMarsTerrain(): TerrainComponents {
  // 1100m x 1100m total planetary terrain mesh
  const size = 1100;
  // 260x260 segments (67,600 vertices) provides dense, smooth elevation curvature with zero frame drops
  const segments = 260;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const posAttr = geometry.attributes.position;
  const count = posAttr.count;

  // Apply analytical height formula to all vertices
  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getTerrainHeight(x, z);
    posAttr.setY(i, y);
  }

  geometry.computeVertexNormals();

  const { diffuseMap, bumpMap } = createMarsTextures();

  const terrainMaterial = new THREE.MeshStandardMaterial({
    map: diffuseMap,
    bumpMap: bumpMap,
    bumpScale: 0.24,
    roughness: 0.94,
    metalness: 0.05,
    color: new THREE.Color('#c3582d'),
  });

  const terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = false;

  // --- Scattered Boulders (InstancedMesh for peak 60fps performance across 1000m) ---
  const boulderCount = 520;
  const boulderGeo = new THREE.DodecahedronGeometry(1.2, 1);
  const bPos = boulderGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    const vx = bPos.getX(i);
    const vy = bPos.getY(i);
    const vz = bPos.getZ(i);
    const noise = Math.sin(vx * 3.1) * Math.cos(vy * 2.7) * Math.sin(vz * 3.4) * 0.24;
    bPos.setXYZ(i, vx + noise, vy + noise, vz + noise);
  }
  boulderGeo.computeVertexNormals();

  const boulderMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#78311a'),
    roughness: 0.9,
    metalness: 0.12,
    bumpMap: bumpMap,
    bumpScale: 0.15,
  });

  const rocksMesh = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderCount);
  rocksMesh.castShadow = true;
  rocksMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let rockIdx = 0;

  let seed = 42;
  function random(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  while (rockIdx < boulderCount) {
    // Distribute across the 1000m world with clustering near crater rims & ridges
    const rx = (random() - 0.5) * 960;
    const rz = (random() - 0.5) * 960;
    const distToCenter = Math.sqrt(rx * rx + rz * rz);

    // Keep immediate landing site clearing free of massive boulders
    if (distToCenter < 14) continue;

    const ry = getTerrainHeight(rx, rz);
    dummy.position.set(rx, ry + 0.35, rz);

    // Natural varied boulder sizes (0.6m to 3.2m)
    const scale = 0.5 + random() * 2.2;
    const scaleY = scale * (0.65 + random() * 0.5);
    dummy.scale.set(scale, scaleY, scale * (0.8 + random() * 0.4));

    dummy.rotation.x = random() * Math.PI;
    dummy.rotation.y = random() * Math.PI * 2;
    dummy.rotation.z = random() * Math.PI;

    dummy.updateMatrix();
    rocksMesh.setMatrixAt(rockIdx, dummy.matrix);
    rockIdx++;
  }
  rocksMesh.instanceMatrix.needsUpdate = true;

  // --- Small Scattered Scree & Pebbles ---
  const pebbleCount = 650;
  const pebbleGeo = new THREE.DodecahedronGeometry(0.35, 0);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5a2414'),
    roughness: 0.95,
    metalness: 0.1,
  });

  const smallPebblesMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
  smallPebblesMesh.receiveShadow = true;

  let pebbleIdx = 0;
  while (pebbleIdx < pebbleCount) {
    const px = (random() - 0.5) * 980;
    const pz = (random() - 0.5) * 980;
    const py = getTerrainHeight(px, pz);

    dummy.position.set(px, py + 0.1, pz);
    const pScale = 0.4 + random() * 1.1;
    dummy.scale.set(pScale, pScale * 0.6, pScale);
    dummy.rotation.set(random() * Math.PI, random() * Math.PI * 2, random() * Math.PI);
    dummy.updateMatrix();
    smallPebblesMesh.setMatrixAt(pebbleIdx, dummy.matrix);
    pebbleIdx++;
  }
  smallPebblesMesh.instanceMatrix.needsUpdate = true;

  return {
    terrainMesh,
    rocksMesh,
    smallPebblesMesh,
  };
}
