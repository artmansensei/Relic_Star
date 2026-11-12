import * as THREE from 'three';

export interface MoonAtmosphere {
  skyGroup: THREE.Group;
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  earthMesh: THREE.Group;
  update: (time: number, playerPos: THREE.Vector3) => void;
}

/**
 * Creates authentic airless lunar environment lighting, starry vacuum sky,
 * high-contrast harsh shadows, and the iconic Blue Marble Earth in the sky.
 */
export function createMoonAtmosphere(scene: THREE.Scene): MoonAtmosphere {
  const skyGroup = new THREE.Group();

  // 1. Airless Vacuum: Strictly NO atmospheric fog or haze on the Moon!
  scene.fog = null;

  // 2. Unfiltered Direct Solar Radiation
  // Blindingly harsh and unfiltered white sunlight (5800K solar blackbody)
  const sunLight = new THREE.DirectionalLight(0xffffff, 3.8);
  sunLight.position.set(240, 165, 200);
  sunLight.castShadow = true;

  // High-resolution shadow map for razor-sharp lunar shadows
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 480;
  const shadowDist = 82;
  sunLight.shadow.camera.left = -shadowDist;
  sunLight.shadow.camera.right = shadowDist;
  sunLight.shadow.camera.top = shadowDist;
  sunLight.shadow.camera.bottom = -shadowDist;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.045; // Eliminates shadow acne and yields solid ground contact shadows
  skyGroup.add(sunLight);

  // 3. Regolith Secondary Bounce Light & Earthshine
  // Ground regolith reflection (albedo ~12%) lights up shadowed vertical faces without atmospheric fog
  const hemiLight = new THREE.HemisphereLight(0x06090e, 0x242a32, 0.40);
  skyGroup.add(hemiLight);

  // Subtle earthshine ambience
  const ambientLight = new THREE.AmbientLight(0x121720, 0.20);
  skyGroup.add(ambientLight);

  // 4. Black Space Void Sky Dome (Radius 800m)
  const skyGeo = new THREE.SphereGeometry(800, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x000103, // Pure cosmic vacuum void
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyGroup.add(skyDome);

  // 5. Starfield: 4,000 Sharp Un-twinkling Multi-Magnitude Stars
  const starCount = 4000;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 780 + Math.random() * 10;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = Math.abs(radius * Math.cos(phi)) + 12; // In upper celestial hemisphere
    const z = radius * Math.sin(phi) * Math.sin(theta);

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    // Star temperature tints (O/B blue-white, G solar yellow, M red-orange)
    const tint = Math.random();
    if (tint > 0.86) {
      starColors[i * 3] = 0.76;
      starColors[i * 3 + 1] = 0.88;
      starColors[i * 3 + 2] = 1.0; // Blue giant
    } else if (tint > 0.68) {
      starColors[i * 3] = 1.0;
      starColors[i * 3 + 1] = 0.94;
      starColors[i * 3 + 2] = 0.82; // Solar yellow
    } else {
      starColors[i * 3] = 0.92;
      starColors[i * 3 + 1] = 0.94;
      starColors[i * 3 + 2] = 0.96; // Crisp white
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 1.7,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
  });
  const starPoints = new THREE.Points(starGeo, starMat);
  skyGroup.add(starPoints);

  // 6. Photorealistic "Earth in the Lunar Sky" (The Blue Marble)
  // Appears ~2° angular diameter in the south-western lunar sky from Mare Tranquillitatis
  const earthGroup = new THREE.Group();
  earthGroup.name = 'lunar_sky_earth';

  // Position Earth high in the south-western lunar sky (Tranquility Base viewpoint)
  earthGroup.position.set(-360, 420, -480);

  // Earth Globe Core
  const earthGeo = new THREE.SphereGeometry(32, 36, 36);
  const earthCanvas = document.createElement('canvas');
  earthCanvas.width = 1024;
  earthCanvas.height = 512;
  const ctx = earthCanvas.getContext('2d');
  if (ctx) {
    // Deep Pacific/Atlantic oceans
    ctx.fillStyle = '#081d36';
    ctx.fillRect(0, 0, 1024, 512);

    // Continents
    ctx.fillStyle = '#234a2e';
    // Africa / Europe
    ctx.beginPath();
    ctx.ellipse(540, 240, 80, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.ellipse(560, 120, 90, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    // Asia
    ctx.beginPath();
    ctx.ellipse(720, 160, 140, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    // North America
    ctx.beginPath();
    ctx.ellipse(260, 150, 110, 80, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // South America
    ctx.beginPath();
    ctx.ellipse(320, 320, 65, 110, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(820, 350, 50, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arid Desert regions (Sahara, Arabian Peninsula, Outback)
    ctx.fillStyle = '#9c7b46';
    ctx.beginPath();
    ctx.ellipse(540, 180, 70, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.ellipse(820, 350, 35, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swirling Cloud Bands (White cumulus cyclone patterns)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath();
    ctx.ellipse(500, 80, 390, 26, 0.1, 0, Math.PI * 2);
    ctx.ellipse(520, 250, 450, 20, -0.05, 0, Math.PI * 2);
    ctx.ellipse(510, 420, 430, 30, 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Tropical storm vortex
    ctx.beginPath();
    ctx.arc(680, 220, 48, 0, Math.PI * 2);
    ctx.fill();

    // Polar ice caps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 38);
    ctx.fillRect(0, 474, 1024, 38);

    // Gibbous Earth Phase Shadow Mask (Soft lunar day/night terminator across the globe)
    const shadowGrad = ctx.createLinearGradient(0, 0, 1024, 0);
    shadowGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)');
    shadowGrad.addColorStop(0.72, 'rgba(0, 0, 0, 0.0)');
    shadowGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0.65)');
    shadowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, 1024, 512);
  }

  const earthTex = new THREE.CanvasTexture(earthCanvas);
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTex,
    roughness: 0.45,
    metalness: 0.05,
    emissive: new THREE.Color('#022b42'),
    emissiveIntensity: 0.35, // Earthshine glow
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthGroup.add(earthMesh);

  // Atmospheric Blue Halo Limb
  const atmosGeo = new THREE.SphereGeometry(33.8, 36, 36);
  const atmosMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.30,
    side: THREE.BackSide,
  });
  const atmosGlow = new THREE.Mesh(atmosGeo, atmosMat);
  earthGroup.add(atmosGlow);

  skyGroup.add(earthGroup);

  // Texel size for 2048 shadow map over 164m coverage
  const texelSize = (shadowDist * 2) / 2048;

  const update = (time: number, playerPos: THREE.Vector3) => {
    // Snap shadow camera to texel grid to prevent shadow map shimmering during player walking
    const rawX = playerPos.x + 240;
    const rawZ = playerPos.z + 200;
    sunLight.position.x = Math.floor(rawX / texelSize) * texelSize;
    sunLight.position.z = Math.floor(rawZ / texelSize) * texelSize;
    sunLight.target.position.set(
      Math.floor(playerPos.x / texelSize) * texelSize,
      playerPos.y,
      Math.floor(playerPos.z / texelSize) * texelSize
    );
    sunLight.target.updateMatrixWorld();

    // Gentle axial rotation of Earth (one slow revolution over time)
    earthMesh.rotation.y = time * 0.012;
  };

  return {
    skyGroup,
    sunLight,
    ambientLight,
    earthMesh: earthGroup,
    update,
  };
}
