import * as THREE from 'three';

export interface MarsAtmosphere {
  skyGroup: THREE.Group;
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  dustParticles: THREE.Points;
  update: (time: number, playerPos: THREE.Vector3) => void;
}

/**
 * Creates realistic Martian atmosphere, lighting, sky dome, and atmospheric depth.
 * Calibrated for the expanded 1000m x 1000m explorable domain.
 */
export function createMarsAtmosphere(scene: THREE.Scene): MarsAtmosphere {
  const skyGroup = new THREE.Group();

  // 1. Martian Atmospheric Fog (Warm salmon-ochre dust haze)
  // Distance-based linear fog gives crisp foreground detail (0-50m) and gradual atmospheric haze (80-500m)
  const fogColor = new THREE.Color('#b8542c');
  scene.fog = new THREE.Fog(fogColor, 45, 520);

  // 2. Realistic Low-Angle Martian Sunlight
  // Mars receives ~43% of Earth's solar irradiance; sun appears smaller with warm forward scattering
  const sunLight = new THREE.DirectionalLight(0xffe0ce, 2.2);
  sunLight.position.set(220, 140, 180);
  sunLight.castShadow = true;

  // Shadow camera tuned to follow player with high crispness
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 450;
  const shadowDist = 75;
  sunLight.shadow.camera.left = -shadowDist;
  sunLight.shadow.camera.right = shadowDist;
  sunLight.shadow.camera.top = shadowDist;
  sunLight.shadow.camera.bottom = -shadowDist;
  sunLight.shadow.bias = -0.0005;
  skyGroup.add(sunLight);

  // 3. Ambient & Hemisphere Bounce Light
  // Sky light: dusty salmon-ochre; Ground bounce: dark ferric basalt soil
  const hemiLight = new THREE.HemisphereLight(0xd9754b, 0x3d170a, 0.78);
  skyGroup.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0x6e2c14, 0.38);
  skyGroup.add(ambientLight);

  // 4. Large Martian Sky Dome (Radius 750m seamlessly encloses the 1000m world)
  const skyGeo = new THREE.SphereGeometry(750, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color('#281108') }, // Thin atmosphere bronze-dark near zenith
      horizonColor: { value: new THREE.Color('#b8542c') }, // Warm dusty salmon at horizon
      sunColor: { value: new THREE.Color('#fff0d8') },
      sunDirection: { value: sunLight.position.clone().normalize() },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;
      varying vec3 vWorldPosition;

      void main() {
        vec3 dir = normalize(vWorldPosition);
        float h = max(0.0, dir.y);
        
        // Atmosphere gradient: deep bronze zenith fading into dusty salmon horizon
        vec3 sky = mix(horizonColor, topColor, pow(h, 0.62));
        
        // Sun disc & forward atmospheric scattering halo
        float sunDot = max(0.0, dot(dir, sunDirection));
        // Small sharp sun disk (Mars sun appears ~2/3 size of Earth sun)
        float sunDisc = smoothstep(0.9984, 0.9993, sunDot);
        // Soft atmospheric glow around sun
        float sunGlow = pow(sunDot, 14.0) * 0.52;
        
        vec3 finalColor = sky + (sunColor * sunDisc * 2.8) + (sunColor * sunGlow);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyGroup.add(skyDome);

  // 5. Drifting Martian Dust Particles (Aeolian saltation particles around player)
  const particleCount = 550;
  const pGeometry = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 55;
    pPositions[i * 3 + 1] = Math.random() * 12;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 55;
  }

  pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMaterial = new THREE.PointsMaterial({
    color: new THREE.Color('#d47b53'),
    size: 0.08,
    transparent: true,
    opacity: 0.45,
    blending: THREE.NormalBlending,
  });

  const dustParticles = new THREE.Points(pGeometry, pMaterial);
  skyGroup.add(dustParticles);

  const sunTarget = new THREE.Object3D();
  scene.add(sunTarget);
  sunLight.target = sunTarget;

  return {
    skyGroup,
    sunLight,
    ambientLight,
    dustParticles,
    update: (time: number, playerPos: THREE.Vector3) => {
      // 1. Move dust particles with wind and keep them centered around the astronaut
      const positions = dustParticles.geometry.attributes.position.array as Float32Array;
      const windSpeedX = Math.cos(time * 0.15) * 0.4 + 0.6;
      const windSpeedZ = Math.sin(time * 0.18) * 0.3 + 0.5;

      for (let i = 0; i < particleCount; i++) {
        // Drift with prevailing northeast Martian wind
        positions[i * 3] += windSpeedX * 0.04;
        positions[i * 3 + 1] -= 0.012 + Math.sin(time + i) * 0.008;
        positions[i * 3 + 2] += windSpeedZ * 0.04;

        // Wrap around player's current position within a 55m bubble
        const dx = positions[i * 3] - playerPos.x;
        const dy = positions[i * 3 + 1] - playerPos.y;
        const dz = positions[i * 3 + 2] - playerPos.z;

        if (dx > 28) positions[i * 3] = playerPos.x - 27;
        if (dx < -28) positions[i * 3] = playerPos.x + 27;
        if (dy < 0) positions[i * 3 + 1] = playerPos.y + 11;
        if (dy > 12) positions[i * 3 + 1] = playerPos.y + 0.5;
        if (dz > 28) positions[i * 3 + 2] = playerPos.z - 27;
        if (dz < -28) positions[i * 3 + 2] = playerPos.z + 27;
      }
      dustParticles.geometry.attributes.position.needsUpdate = true;

      // 2. Keep sun light shadow camera focused on the player
      sunTarget.position.set(playerPos.x, playerPos.y, playerPos.z);
      sunLight.position.set(playerPos.x + 160, playerPos.y + 120, playerPos.z + 140);

      // 3. Keep sky dome centered on the player for an infinite horizon illusion
      skyDome.position.set(playerPos.x, playerPos.y * 0.5, playerPos.z);
    },
  };
}
