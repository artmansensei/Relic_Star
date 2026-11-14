/**
 * 3D Rover Inspection Models for the Interactive Investigation Screen.
 * Provides mission-specific Three.js geometry centered at (0, 0, 0)
 * with individual hoverable/clickable components.
 */

import * as THREE from 'three';

export interface InteractiveMeshPart {
  mesh: THREE.Mesh;
  componentId: string;
  componentName: string;
  originalMaterial: THREE.Material | THREE.Material[];
}

export interface RoverInspectionModel {
  group: THREE.Group;
  interactiveParts: THREE.Mesh[];
  componentMap: Map<string, THREE.Mesh[]>;
  highlightComponent: (componentId: string | null) => void;
  getComponentCenter: (componentId: string) => THREE.Vector3 | null;
  dispose: () => void;
}

// -----------------------------------------------------------------------------
// Material Palette for 3D Rover Inspection
// -----------------------------------------------------------------------------
function createInspectionMaterials() {
  const goldMylar = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d49d3b'),
    metalness: 0.85,
    roughness: 0.35,
  });

  const weatheredMetal = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#788088'),
    metalness: 0.7,
    roughness: 0.45,
  });

  const darkAlloy = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#22262c'),
    metalness: 0.8,
    roughness: 0.4,
  });

  const wheelAluminum = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8b939c'),
    metalness: 0.75,
    roughness: 0.5,
  });

  const solarCellClean = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#10223d'),
    metalness: 0.5,
    roughness: 0.25,
  });

  const solarCellDusty = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5c4638'),
    metalness: 0.3,
    roughness: 0.65,
  });

  const whiteThermal = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dbe0e6'),
    metalness: 0.25,
    roughness: 0.45,
  });

  const rtgGraphite = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1a1c20'),
    metalness: 0.85,
    roughness: 0.35,
  });

  const lensGlass = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#183a54'),
    metalness: 0.9,
    roughness: 0.15,
  });

  const brassDetail = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c59b27'),
    metalness: 0.85,
    roughness: 0.3,
  });

  const magnetDark = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#111317'),
    metalness: 0.9,
    roughness: 0.2,
  });

  return {
    goldMylar,
    weatheredMetal,
    darkAlloy,
    wheelAluminum,
    solarCellClean,
    solarCellDusty,
    whiteThermal,
    rtgGraphite,
    lensGlass,
    brassDetail,
    magnetDark,
  };
}

// -----------------------------------------------------------------------------
// Helper: Register interactive mesh
// -----------------------------------------------------------------------------
function registerPart(
  mesh: THREE.Mesh,
  componentId: string,
  componentName: string,
  interactiveList: THREE.Mesh[],
  componentMap: Map<string, THREE.Mesh[]>
) {
  mesh.userData.componentId = componentId;
  mesh.userData.componentName = componentName;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  interactiveList.push(mesh);

  if (!componentMap.has(componentId)) {
    componentMap.set(componentId, []);
  }
  componentMap.get(componentId)!.push(mesh);
}

// -----------------------------------------------------------------------------
// BUILDER: SPIRIT ROVER (MER-A)
// -----------------------------------------------------------------------------
export function buildSpiritInspectionModel(): RoverInspectionModel {
  const group = new THREE.Group();
  const interactiveParts: THREE.Mesh[] = [];
  const componentMap = new Map<string, THREE.Mesh[]>();
  const mats = createInspectionMaterials();

  // 1. Warm Electronics Box (WEB) Chassis
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 1.15), mats.goldMylar);
  bodyMesh.position.set(0, 0, 0);
  registerPart(bodyMesh, 'rover_body', 'Warm Electronics Box (WEB)', interactiveParts, componentMap);
  group.add(bodyMesh);

  // Lower chassis pan
  const panMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 1.0), mats.darkAlloy);
  panMesh.position.set(0, -0.36, 0);
  registerPart(panMesh, 'rover_body', 'Chassis Structural Pan', interactiveParts, componentMap);
  group.add(panMesh);

  // 2. Solar Panels (Dusty GaAs Array)
  const deckGroup = new THREE.Group();
  deckGroup.position.set(0, 0.35, 0);

  const centerSolar = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.04, 1.35), mats.solarCellDusty);
  registerPart(centerSolar, 'solar_panels', 'Main Solar Array Deck', interactiveParts, componentMap);
  deckGroup.add(centerSolar);

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.15), mats.solarCellDusty);
  leftWing.position.set(-1.12, -0.02, 0);
  leftWing.rotation.z = 0.06;
  registerPart(leftWing, 'solar_panels', 'Solar Array Port Wing', interactiveParts, componentMap);
  deckGroup.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.15), mats.solarCellDusty);
  rightWing.position.set(1.12, -0.02, 0);
  rightWing.rotation.z = -0.06;
  registerPart(rightWing, 'solar_panels', 'Solar Array Starboard Wing', interactiveParts, componentMap);
  deckGroup.add(rightWing);

  const aftWing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 0.6), mats.solarCellDusty);
  aftWing.position.set(0, -0.02, 0.88);
  aftWing.rotation.x = -0.06;
  registerPart(aftWing, 'solar_panels', 'Solar Array Aft Wing', interactiveParts, componentMap);
  deckGroup.add(aftWing);

  group.add(deckGroup);

  // 3. Magnet Arrays on Solar Deck
  const magnetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.12), mats.magnetDark);
  magnetMesh.position.set(0.3, 0.38, -0.45);
  registerPart(magnetMesh, 'magnets', 'Capture & Filter Magnet Array', interactiveParts, componentMap);
  group.add(magnetMesh);

  const magnetRings = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 12), mats.brassDetail);
  magnetRings.position.set(0.3, 0.4, -0.45);
  registerPart(magnetRings, 'magnets', 'Capture Magnet Target', interactiveParts, componentMap);
  group.add(magnetRings);

  // 4. Pancam Mast Assembly (PMA)
  const mastGroup = new THREE.Group();
  mastGroup.position.set(-0.45, 0.38, -0.45);

  const mastPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.45, 12), mats.weatheredMetal);
  mastPillar.position.y = 0.72;
  registerPart(mastPillar, 'pancam', 'Pancam Mast Assembly (PMA)', interactiveParts, componentMap);
  mastGroup.add(mastPillar);

  // Periscope window for Mini-TES at bottom of mast
  const miniTesWindow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.1), mats.darkAlloy);
  miniTesWindow.position.set(0, 0.15, 0.04);
  registerPart(miniTesWindow, 'mini_tes', 'Mini-TES Infrared Periscope Inlet', interactiveParts, componentMap);
  mastGroup.add(miniTesWindow);

  // Navcams mounted on crossbar
  const navcamBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), mats.darkAlloy);
  navcamBar.position.set(0, 1.25, -0.04);
  registerPart(navcamBar, 'navcam', 'Stereo Navigation Camera Bar', interactiveParts, componentMap);
  mastGroup.add(navcamBar);

  const navcamL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8), mats.lensGlass);
  navcamL.rotation.x = Math.PI / 2;
  navcamL.position.set(-0.1, 1.25, -0.08);
  registerPart(navcamL, 'navcam', 'Left Navcam Lens', interactiveParts, componentMap);
  mastGroup.add(navcamL);

  const navcamR = navcamL.clone();
  navcamR.position.x = 0.1;
  registerPart(navcamR, 'navcam', 'Right Navcam Lens', interactiveParts, componentMap);
  mastGroup.add(navcamR);

  // Top Pancam Stereo Head
  const pancamHead = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.11, 0.16), mats.darkAlloy);
  pancamHead.position.set(0, 1.45, 0);
  registerPart(pancamHead, 'pancam', 'Pancam Stereo Camera Head', interactiveParts, componentMap);
  mastGroup.add(pancamHead);

  const camL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 10), mats.goldMylar);
  camL.rotation.x = Math.PI / 2;
  camL.position.set(-0.14, 1.45, -0.09);
  registerPart(camL, 'pancam', 'Pancam Left Multispectral Lens', interactiveParts, componentMap);
  mastGroup.add(camL);

  const camR = camL.clone();
  camR.position.x = 0.14;
  registerPart(camR, 'pancam', 'Pancam Right Multispectral Lens', interactiveParts, componentMap);
  mastGroup.add(camR);

  group.add(mastGroup);

  // 5. Hazcams (Front and Rear pairs)
  const frontHazcamL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), mats.darkAlloy);
  frontHazcamL.position.set(-0.25, -0.28, -0.6);
  registerPart(frontHazcamL, 'hazcam', 'Front Left Hazcam', interactiveParts, componentMap);
  group.add(frontHazcamL);

  const frontHazcamR = frontHazcamL.clone();
  frontHazcamR.position.x = 0.25;
  registerPart(frontHazcamR, 'hazcam', 'Front Right Hazcam', interactiveParts, componentMap);
  group.add(frontHazcamR);

  const rearHazcamL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), mats.darkAlloy);
  rearHazcamL.position.set(-0.25, -0.28, 0.6);
  registerPart(rearHazcamL, 'hazcam', 'Rear Left Hazcam', interactiveParts, componentMap);
  group.add(rearHazcamL);

  const rearHazcamR = rearHazcamL.clone();
  rearHazcamR.position.x = 0.25;
  registerPart(rearHazcamR, 'hazcam', 'Rear Right Hazcam', interactiveParts, componentMap);
  group.add(rearHazcamR);

  // 6. High-Gain Antenna (HGA)
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(0.48, 0.38, 0.35);

  const hgaGimbal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), mats.darkAlloy);
  hgaGimbal.position.y = 0.06;
  registerPart(hgaGimbal, 'high_gain_antenna', 'HGA 2-Axis Gimbal Pedestal', interactiveParts, componentMap);
  hgaGroup.add(hgaGimbal);

  const dishMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.04, 0.08, 20, 1, true), mats.goldMylar);
  dishMesh.rotation.x = -Math.PI * 0.35;
  dishMesh.position.set(0, 0.18, 0);
  registerPart(dishMesh, 'high_gain_antenna', 'High-Gain 28cm Parabolic Dish', interactiveParts, componentMap);
  hgaGroup.add(dishMesh);

  group.add(hgaGroup);

  // 7. Low-Gain Antenna (LGA)
  const lgaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.85, 8), mats.weatheredMetal);
  lgaMesh.position.set(-0.55, 0.78, 0.45);
  registerPart(lgaMesh, 'low_gain_antenna', 'Omnidirectional Low-Gain Whip Antenna (LGA)', interactiveParts, componentMap);
  group.add(lgaMesh);

  // 8. 6-Wheel Rocker-Bogie Mobility System
  const wheelOffsets = [
    { x: -0.98, z: -0.65, name: 'Left Front Wheel' },
    { x: 0.98, z: -0.65, name: 'Right Front Wheel (Historically Seized)' },
    { x: -1.08, z: 0.08, name: 'Left Middle Wheel' },
    { x: 1.08, z: 0.08, name: 'Right Middle Wheel' },
    { x: -0.98, z: 0.75, name: 'Left Rear Wheel' },
    { x: 0.98, z: 0.75, name: 'Right Rear Wheel' },
  ];

  wheelOffsets.forEach((pos, idx) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, -0.45, pos.z);

    if (idx === 1) {
      // Historically seized right-front wheel tilted at drag angle
      wheelGroup.rotation.y = 0.22;
      wheelGroup.rotation.z = 0.08;
    }

    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16), mats.wheelAluminum);
    wheel.rotation.z = Math.PI / 2;
    registerPart(wheel, 'mobility', pos.name, interactiveParts, componentMap);
    wheelGroup.add(wheel);

    // Wheel cleat ribs
    for (let c = 0; c < 8; c++) {
      const angle = (c * Math.PI * 2) / 8;
      const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.02, 0.03), mats.darkAlloy);
      cleat.position.set(0, Math.cos(angle) * 0.24, Math.sin(angle) * 0.24);
      wheelGroup.add(cleat);
    }

    // Suspension strut
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 6), mats.darkAlloy);
    strut.position.set(pos.x > 0 ? -0.15 : 0.15, 0.2, 0);
    strut.rotation.z = pos.x > 0 ? 0.3 : -0.3;
    registerPart(strut, 'mobility', 'Rocker-Bogie Titanium Suspension Strut', interactiveParts, componentMap);
    group.add(strut);

    group.add(wheelGroup);
  });

  // 9. Robotic Arm & Turret Instruments
  const armGroup = new THREE.Group();
  armGroup.position.set(0.18, -0.22, -0.62);

  // Upper arm & forearm
  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8), mats.weatheredMetal);
  upperArm.rotation.x = Math.PI * 0.35;
  upperArm.position.set(0, -0.12, -0.18);
  registerPart(upperArm, 'robotic_arm', 'Instrument Deployment Device (Arm Boom)', interactiveParts, componentMap);
  armGroup.add(upperArm);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), mats.weatheredMetal);
  forearm.rotation.x = -Math.PI * 0.15;
  forearm.position.set(0.04, -0.32, -0.36);
  registerPart(forearm, 'robotic_arm', 'Arm Forearm Segment', interactiveParts, componentMap);
  armGroup.add(forearm);

  // Sensor Turret Head
  const turretHead = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 12), mats.darkAlloy);
  turretHead.position.set(0.06, -0.42, -0.52);
  registerPart(turretHead, 'robotic_arm', 'Instrument Turret Assembly', interactiveParts, componentMap);
  armGroup.add(turretHead);

  // RAT (Rock Abrasion Tool)
  const ratMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 10), mats.weatheredMetal);
  ratMesh.position.set(0.06, -0.48, -0.56);
  registerPart(ratMesh, 'rat', 'Rock Abrasion Tool (RAT)', interactiveParts, componentMap);
  armGroup.add(ratMesh);

  // Microscopic Imager (MI)
  const miMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 8), mats.goldMylar);
  miMesh.rotation.x = Math.PI / 2;
  miMesh.position.set(0.12, -0.42, -0.58);
  registerPart(miMesh, 'mi', 'Microscopic Imager (MI)', interactiveParts, componentMap);
  armGroup.add(miMesh);

  // APXS
  const apxsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 10), mats.brassDetail);
  apxsMesh.position.set(0.0, -0.42, -0.58);
  registerPart(apxsMesh, 'apxs', 'Alpha Particle X-Ray Spectrometer (APXS)', interactiveParts, componentMap);
  armGroup.add(apxsMesh);

  // Mössbauer Spectrometer
  const mossbauerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 8), mats.darkAlloy);
  mossbauerMesh.rotation.z = Math.PI / 2;
  mossbauerMesh.position.set(0.06, -0.38, -0.58);
  registerPart(mossbauerMesh, 'mossbauer', 'Mössbauer Spectrometer', interactiveParts, componentMap);
  armGroup.add(mossbauerMesh);

  group.add(armGroup);

  return createInspectionModelWrapper(group, interactiveParts, componentMap);
}

// -----------------------------------------------------------------------------
// BUILDER: OPPORTUNITY ROVER (MER-B)
// -----------------------------------------------------------------------------
export function buildOpportunityInspectionModel(): RoverInspectionModel {
  const group = new THREE.Group();
  const interactiveParts: THREE.Mesh[] = [];
  const componentMap = new Map<string, THREE.Mesh[]>();
  const mats = createInspectionMaterials();

  // 1. Warm Electronics Box (WEB) Chassis
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 1.15), mats.goldMylar);
  bodyMesh.position.set(0, 0, 0);
  registerPart(bodyMesh, 'rover_body', 'Warm Electronics Box (WEB)', interactiveParts, componentMap);
  group.add(bodyMesh);

  const panMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 1.0), mats.darkAlloy);
  panMesh.position.set(0, -0.36, 0);
  registerPart(panMesh, 'rover_body', 'Chassis Structural Pan', interactiveParts, componentMap);
  group.add(panMesh);

  // 2. Solar Panels (Cleaned GaAs Array with Wind-Streaks)
  const deckGroup = new THREE.Group();
  deckGroup.position.set(0, 0.35, 0);

  const centerSolar = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.04, 1.35), mats.solarCellClean);
  registerPart(centerSolar, 'solar_panels', 'Wind-Cleaned Solar Array Deck', interactiveParts, componentMap);
  deckGroup.add(centerSolar);

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.15), mats.solarCellClean);
  leftWing.position.set(-1.12, -0.02, 0);
  leftWing.rotation.z = 0.06;
  registerPart(leftWing, 'solar_panels', 'Solar Array Port Wing', interactiveParts, componentMap);
  deckGroup.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.15), mats.solarCellClean);
  rightWing.position.set(1.12, -0.02, 0);
  rightWing.rotation.z = -0.06;
  registerPart(rightWing, 'solar_panels', 'Solar Array Starboard Wing', interactiveParts, componentMap);
  deckGroup.add(rightWing);

  const aftWing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 0.6), mats.solarCellClean);
  aftWing.position.set(0, -0.02, 0.88);
  aftWing.rotation.x = -0.06;
  registerPart(aftWing, 'solar_panels', 'Solar Array Aft Wing', interactiveParts, componentMap);
  deckGroup.add(aftWing);

  group.add(deckGroup);

  // 3. Magnet Arrays on Solar Deck
  const magnetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.12), mats.magnetDark);
  magnetMesh.position.set(0.3, 0.38, -0.45);
  registerPart(magnetMesh, 'magnets', 'Capture & Sweep Magnet Array', interactiveParts, componentMap);
  group.add(magnetMesh);

  // 4. Pancam Mast Assembly (PMA)
  const mastGroup = new THREE.Group();
  mastGroup.position.set(-0.45, 0.38, -0.45);

  const mastPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.45, 12), mats.weatheredMetal);
  mastPillar.position.y = 0.72;
  registerPart(mastPillar, 'pancam', 'Pancam Mast Assembly (PMA)', interactiveParts, componentMap);
  mastGroup.add(mastPillar);

  // Mini-TES window
  const miniTesWindow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.1), mats.darkAlloy);
  miniTesWindow.position.set(0, 0.15, 0.04);
  registerPart(miniTesWindow, 'mini_tes', 'Mini-TES Infrared Periscope', interactiveParts, componentMap);
  mastGroup.add(miniTesWindow);

  // Navcam crossbar
  const navcamBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), mats.darkAlloy);
  navcamBar.position.set(0, 1.25, -0.04);
  registerPart(navcamBar, 'navcam', 'Stereo Navcam Bar', interactiveParts, componentMap);
  mastGroup.add(navcamBar);

  const navcamL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8), mats.lensGlass);
  navcamL.rotation.x = Math.PI / 2;
  navcamL.position.set(-0.1, 1.25, -0.08);
  registerPart(navcamL, 'navcam', 'Left Navcam Lens', interactiveParts, componentMap);
  mastGroup.add(navcamL);

  const navcamR = navcamL.clone();
  navcamR.position.x = 0.1;
  registerPart(navcamR, 'navcam', 'Right Navcam Lens', interactiveParts, componentMap);
  mastGroup.add(navcamR);

  // Pancam Stereo Head
  const pancamHead = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.11, 0.16), mats.darkAlloy);
  pancamHead.position.set(0, 1.45, 0);
  registerPart(pancamHead, 'pancam', 'Pancam Head Optics', interactiveParts, componentMap);
  mastGroup.add(pancamHead);

  const camL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 10), mats.goldMylar);
  camL.rotation.x = Math.PI / 2;
  camL.position.set(-0.14, 1.45, -0.09);
  registerPart(camL, 'pancam', 'Left Pancam Filter Lens', interactiveParts, componentMap);
  mastGroup.add(camL);

  const camR = camL.clone();
  camR.position.x = 0.14;
  registerPart(camR, 'pancam', 'Right Pancam Filter Lens', interactiveParts, componentMap);
  mastGroup.add(camR);

  group.add(mastGroup);

  // 5. Hazcams
  const frontHazL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), mats.darkAlloy);
  frontHazL.position.set(-0.25, -0.28, -0.6);
  registerPart(frontHazL, 'hazcam', 'Front Left Hazcam', interactiveParts, componentMap);
  group.add(frontHazL);

  const frontHazR = frontHazL.clone();
  frontHazR.position.x = 0.25;
  registerPart(frontHazR, 'hazcam', 'Front Right Hazcam', interactiveParts, componentMap);
  group.add(frontHazR);

  const rearHazL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), mats.darkAlloy);
  rearHazL.position.set(-0.25, -0.28, 0.6);
  registerPart(rearHazL, 'hazcam', 'Rear Left Hazcam', interactiveParts, componentMap);
  group.add(rearHazL);

  const rearHazR = rearHazL.clone();
  rearHazR.position.x = 0.25;
  registerPart(rearHazR, 'hazcam', 'Rear Right Hazcam', interactiveParts, componentMap);
  group.add(rearHazR);

  // 6. High-Gain Antenna (HGA)
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(0.48, 0.38, 0.35);

  const hgaGimbal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), mats.darkAlloy);
  hgaGimbal.position.y = 0.06;
  registerPart(hgaGimbal, 'high_gain_antenna', 'HGA Articulated Gimbal', interactiveParts, componentMap);
  hgaGroup.add(hgaGimbal);

  const dishMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.04, 0.08, 20, 1, true), mats.goldMylar);
  dishMesh.rotation.x = -Math.PI * 0.35;
  dishMesh.position.set(0, 0.18, 0);
  registerPart(dishMesh, 'high_gain_antenna', 'High-Gain Parabolic Dish (HGA)', interactiveParts, componentMap);
  hgaGroup.add(dishMesh);

  group.add(hgaGroup);

  // 7. Low-Gain Antenna (LGA)
  const lgaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.85, 8), mats.weatheredMetal);
  lgaMesh.position.set(-0.55, 0.78, 0.45);
  registerPart(lgaMesh, 'low_gain_antenna', 'Omnidirectional Low-Gain Antenna Mast', interactiveParts, componentMap);
  group.add(lgaMesh);

  // 8. 6-Wheel Rocker-Bogie Mobility System (Opportunity steered configuration)
  const wheelOffsets = [
    { x: -0.98, z: -0.65, name: 'Left Front Steered Wheel' },
    { x: 0.98, z: -0.65, name: 'Right Front Steered Wheel' },
    { x: -1.08, z: 0.08, name: 'Left Middle Drive Wheel' },
    { x: 1.08, z: 0.08, name: 'Right Middle Drive Wheel' },
    { x: -0.98, z: 0.75, name: 'Left Rear Steered Wheel' },
    { x: 0.98, z: 0.75, name: 'Right Rear Steered Wheel' },
  ];

  wheelOffsets.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, -0.45, pos.z);

    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16), mats.wheelAluminum);
    wheel.rotation.z = Math.PI / 2;
    registerPart(wheel, 'mobility', pos.name, interactiveParts, componentMap);
    wheelGroup.add(wheel);

    for (let c = 0; c < 8; c++) {
      const angle = (c * Math.PI * 2) / 8;
      const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.02, 0.03), mats.darkAlloy);
      cleat.position.set(0, Math.cos(angle) * 0.24, Math.sin(angle) * 0.24);
      wheelGroup.add(cleat);
    }

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 6), mats.darkAlloy);
    strut.position.set(pos.x > 0 ? -0.15 : 0.15, 0.2, 0);
    strut.rotation.z = pos.x > 0 ? 0.3 : -0.3;
    registerPart(strut, 'mobility', 'Rocker-Bogie Titanium Suspension Strut', interactiveParts, componentMap);
    group.add(strut);

    group.add(wheelGroup);
  });

  // 9. Robotic Arm & Turret Instruments
  const armGroup = new THREE.Group();
  armGroup.position.set(0.18, -0.22, -0.62);

  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8), mats.weatheredMetal);
  upperArm.rotation.x = Math.PI * 0.35;
  upperArm.position.set(0, -0.12, -0.18);
  registerPart(upperArm, 'robotic_arm', 'Instrument Deployment Device (IDD)', interactiveParts, componentMap);
  armGroup.add(upperArm);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), mats.weatheredMetal);
  forearm.rotation.x = -Math.PI * 0.15;
  forearm.position.set(0.04, -0.32, -0.36);
  registerPart(forearm, 'robotic_arm', 'Arm Forearm Segment', interactiveParts, componentMap);
  armGroup.add(forearm);

  const turretHead = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 12), mats.darkAlloy);
  turretHead.position.set(0.06, -0.42, -0.52);
  registerPart(turretHead, 'robotic_arm', 'Instrument Turret Assembly', interactiveParts, componentMap);
  armGroup.add(turretHead);

  const ratMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 10), mats.weatheredMetal);
  ratMesh.position.set(0.06, -0.48, -0.56);
  registerPart(ratMesh, 'rat', 'Rock Abrasion Tool (RAT)', interactiveParts, componentMap);
  armGroup.add(ratMesh);

  const miMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 8), mats.goldMylar);
  miMesh.rotation.x = Math.PI / 2;
  miMesh.position.set(0.12, -0.42, -0.58);
  registerPart(miMesh, 'mi', 'Microscopic Imager (MI)', interactiveParts, componentMap);
  armGroup.add(miMesh);

  const apxsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 10), mats.brassDetail);
  apxsMesh.position.set(0.0, -0.42, -0.58);
  registerPart(apxsMesh, 'apxs', 'Alpha Particle X-Ray Spectrometer (APXS)', interactiveParts, componentMap);
  armGroup.add(apxsMesh);

  const mossbauerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 8), mats.darkAlloy);
  mossbauerMesh.rotation.z = Math.PI / 2;
  mossbauerMesh.position.set(0.06, -0.38, -0.58);
  registerPart(mossbauerMesh, 'mossbauer', 'Mössbauer Spectrometer (Jarosite Discoverer)', interactiveParts, componentMap);
  armGroup.add(mossbauerMesh);

  group.add(armGroup);

  return createInspectionModelWrapper(group, interactiveParts, componentMap);
}

// -----------------------------------------------------------------------------
// BUILDER: CURIOSITY ROVER (MARS SCIENCE LABORATORY - HEAVY SUV SCALE)
// -----------------------------------------------------------------------------
export function buildCuriosityInspectionModel(): RoverInspectionModel {
  const group = new THREE.Group();
  const interactiveParts: THREE.Mesh[] = [];
  const componentMap = new Map<string, THREE.Mesh[]>();
  const mats = createInspectionMaterials();

  // Curiosity scale: Normalized to fit nicely in inspection viewport (~1.25x base)
  const SCALE = 1.15;
  const scaledGroup = new THREE.Group();
  scaledGroup.scale.set(SCALE, SCALE, SCALE);
  group.add(scaledGroup);

  // 1. Heavy Chassis & White Thermal Composite Shell
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 1.45), mats.whiteThermal);
  bodyMesh.position.set(0, 0, 0);
  registerPart(bodyMesh, 'rover_body', 'Heavy MSL Chassis & White Thermal Shell', interactiveParts, componentMap);
  scaledGroup.add(bodyMesh);

  // Lower chassis belly pan
  const bellyPan = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.25, 1.25), mats.darkAlloy);
  bellyPan.position.set(0, -0.45, 0);
  registerPart(bellyPan, 'rover_body', 'Structural Titanium Chassis Pan', interactiveParts, componentMap);
  scaledGroup.add(bellyPan);

  // 2. Sample Inlets on Deck (Funnels for SAM and CheMin)
  const samFunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.04, 0.12, 14), mats.weatheredMetal);
  samFunnel.position.set(0.2, 0.48, -0.15);
  registerPart(samFunnel, 'sample_inlets', 'SAM (Sample Analysis at Mars) Inlet Funnel', interactiveParts, componentMap);
  scaledGroup.add(samFunnel);

  const cheminFunnel = samFunnel.clone();
  cheminFunnel.position.set(0.45, 0.48, -0.15);
  registerPart(cheminFunnel, 'sample_inlets', 'CheMin (Chemistry and Mineralogy) Inlet Funnel', interactiveParts, componentMap);
  scaledGroup.add(cheminFunnel);

  // 3. MMRTG (Nuclear Radioisotope Thermoelectric Generator at AFT — NO SOLAR PANELS!)
  const rtgGroup = new THREE.Group();
  rtgGroup.position.set(0, 0.25, 1.12);

  const rtgCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 18), mats.rtgGraphite);
  rtgCylinder.rotation.x = Math.PI / 2;
  registerPart(rtgCylinder, 'mmrtg', 'Multi-Mission Radioisotope Thermoelectric Generator (MMRTG)', interactiveParts, componentMap);
  rtgGroup.add(rtgCylinder);

  // 8 Radial Cooling Fins
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.68), mats.rtgGraphite);
    fin.rotation.z = angle;
    registerPart(fin, 'mmrtg', 'MMRTG Graphite Radiative Cooling Fin', interactiveParts, componentMap);
    rtgGroup.add(fin);
  }
  scaledGroup.add(rtgGroup);

  // 4. Remote Sensing Mast (RSM) with ChemCam & Mastcam
  const mastGroup = new THREE.Group();
  mastGroup.position.set(-0.55, 0.42, -0.55);

  const mastPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 1.65, 12), mats.weatheredMetal);
  mastPillar.position.y = 0.82;
  registerPart(mastPillar, 'chemcam', 'Remote Sensing Mast (RSM)', interactiveParts, componentMap);
  mastGroup.add(mastPillar);

  // REMS (Rover Environmental Monitoring Station) Booms on Mast
  const remsBoom1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), mats.weatheredMetal);
  remsBoom1.rotation.z = Math.PI / 2;
  remsBoom1.position.set(0.14, 0.95, 0);
  registerPart(remsBoom1, 'rems', 'REMS Wind & Humidity Boom 1', interactiveParts, componentMap);
  mastGroup.add(remsBoom1);

  const remsBoom2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), mats.weatheredMetal);
  remsBoom2.rotation.x = Math.PI / 2;
  remsBoom2.position.set(0, 0.75, 0.14);
  registerPart(remsBoom2, 'rems', 'REMS Thermal & Pressure Boom 2', interactiveParts, componentMap);
  mastGroup.add(remsBoom2);

  // Navcam crossbar
  const navcamCrossbar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.08), mats.darkAlloy);
  navcamCrossbar.position.set(0, 1.35, -0.06);
  registerPart(navcamCrossbar, 'navcam', 'Stereo Navcam Engineering Bar', interactiveParts, componentMap);
  mastGroup.add(navcamCrossbar);

  const navcamL = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.07, 8), mats.lensGlass);
  navcamL.rotation.x = Math.PI / 2;
  navcamL.position.set(-0.12, 1.35, -0.1);
  registerPart(navcamL, 'navcam', 'Left Navigation Camera Lens', interactiveParts, componentMap);
  mastGroup.add(navcamL);

  const navcamR = navcamL.clone();
  navcamR.position.x = 0.12;
  registerPart(navcamR, 'navcam', 'Right Navigation Camera Lens', interactiveParts, componentMap);
  mastGroup.add(navcamR);

  // ChemCam & Mastcam Head Box
  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.28, 0.35), mats.whiteThermal);
  headBox.position.set(0, 1.7, 0);
  registerPart(headBox, 'chemcam', 'ChemCam & Mastcam Optical Sensor Head', interactiveParts, componentMap);
  mastGroup.add(headBox);

  // ChemCam Circular Laser Eye
  const laserLens = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16), mats.darkAlloy);
  laserLens.rotation.x = Math.PI / 2;
  laserLens.position.set(-0.12, 1.7, -0.18);
  registerPart(laserLens, 'chemcam', 'ChemCam Pulsed Infrared Laser Aperture', interactiveParts, componentMap);
  mastGroup.add(laserLens);

  // Mastcam twin color cameras
  const mastcamL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 12), mats.darkAlloy);
  mastcamL.rotation.x = Math.PI / 2;
  mastcamL.position.set(0.12, 1.74, -0.18);
  registerPart(mastcamL, 'mastcam', 'Mastcam Left Camera (34mm Medium Angle)', interactiveParts, componentMap);
  mastGroup.add(mastcamL);

  const mastcamR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.11, 12), mats.darkAlloy);
  mastcamR.rotation.x = Math.PI / 2;
  mastcamR.position.set(0.12, 1.64, -0.19);
  registerPart(mastcamR, 'mastcam', 'Mastcam Right Camera (100mm Telephoto Lens)', interactiveParts, componentMap);
  mastGroup.add(mastcamR);

  scaledGroup.add(mastGroup);

  // 5. Hazcams (Front and Rear pairs)
  const frontHazL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.07), mats.darkAlloy);
  frontHazL.position.set(-0.35, -0.32, -0.75);
  registerPart(frontHazL, 'hazcam', 'Front Left Hazcam Stereo Pair', interactiveParts, componentMap);
  scaledGroup.add(frontHazL);

  const frontHazR = frontHazL.clone();
  frontHazR.position.x = 0.35;
  registerPart(frontHazR, 'hazcam', 'Front Right Hazcam Stereo Pair', interactiveParts, componentMap);
  scaledGroup.add(frontHazR);

  const rearHazL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.07), mats.darkAlloy);
  rearHazL.position.set(-0.35, -0.32, 0.75);
  registerPart(rearHazL, 'hazcam', 'Rear Left Hazcam Stereo Pair', interactiveParts, componentMap);
  scaledGroup.add(rearHazL);

  const rearHazR = rearHazL.clone();
  rearHazR.position.x = 0.35;
  registerPart(rearHazR, 'hazcam', 'Rear Right Hazcam Stereo Pair', interactiveParts, componentMap);
  scaledGroup.add(rearHazR);

  // 6. MARDI (Mars Descent Imager under front-left chassis)
  const mardiMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 8), mats.darkAlloy);
  mardiMesh.position.set(-0.65, -0.46, -0.5);
  registerPart(mardiMesh, 'mardi', 'MARDI (Mars Descent Imager) Downward Camera', interactiveParts, componentMap);
  scaledGroup.add(mardiMesh);

  // 7. RAD (Radiation Assessment Detector on Deck)
  const radMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 12), mats.weatheredMetal);
  radMesh.position.set(-0.4, 0.5, 0.15);
  registerPart(radMesh, 'rad', 'RAD (Radiation Assessment Detector)', interactiveParts, componentMap);
  scaledGroup.add(radMesh);

  // 8. DAN (Dynamic Albedo of Neutrons on Aft Right)
  const danMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.12), mats.darkAlloy);
  danMesh.position.set(0.65, 0.15, 0.65);
  registerPart(danMesh, 'dan', 'DAN (Dynamic Albedo of Neutrons) Subsurface Water Detector', interactiveParts, componentMap);
  scaledGroup.add(danMesh);

  // 9. Antennas (HGA, LGA, UHF)
  const hgaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 6), mats.whiteThermal);
  hgaMesh.position.set(0.55, 0.52, 0.35);
  hgaMesh.rotation.x = -Math.PI * 0.3;
  registerPart(hgaMesh, 'high_gain_antenna', 'Hexagonal High-Gain Antenna (HGA)', interactiveParts, componentMap);
  scaledGroup.add(hgaMesh);

  const lgaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), mats.weatheredMetal);
  lgaMesh.position.set(0.35, 0.55, 0.55);
  registerPart(lgaMesh, 'low_gain_antenna', 'Low-Gain Antenna (LGA)', interactiveParts, componentMap);
  scaledGroup.add(lgaMesh);

  const uhfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 10), mats.darkAlloy);
  uhfMesh.position.set(-0.65, 0.68, 0.45);
  registerPart(uhfMesh, 'uhf_antenna', 'UHF Orbiter Relay Helical Antenna', interactiveParts, componentMap);
  scaledGroup.add(uhfMesh);

  // 10. Heavy 50-cm Machined Aluminum Wheels & Rocker-Bogie
  const wheelOffsets = [
    { x: -1.22, z: -0.82, name: 'Curiosity Left Front Wheel' },
    { x: 1.22, z: -0.82, name: 'Curiosity Right Front Wheel' },
    { x: -1.32, z: 0.12, name: 'Curiosity Left Middle Wheel' },
    { x: 1.32, z: 0.12, name: 'Curiosity Right Middle Wheel' },
    { x: -1.22, z: 0.98, name: 'Curiosity Left Rear Wheel' },
    { x: 1.22, z: 0.98, name: 'Curiosity Right Rear Wheel' },
  ];

  wheelOffsets.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, -0.48, pos.z);

    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.28, 18), mats.wheelAluminum);
    wheel.rotation.z = Math.PI / 2;
    registerPart(wheel, 'mobility', pos.name, interactiveParts, componentMap);
    wheelGroup.add(wheel);

    // Chevron grousers
    for (let c = 0; c < 12; c++) {
      const angle = (c * Math.PI * 2) / 12;
      const grouser = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.035), mats.darkAlloy);
      grouser.position.set(0, Math.cos(angle) * 0.32, Math.sin(angle) * 0.32);
      grouser.rotation.x = angle;
      wheelGroup.add(grouser);
    }

    // Heavy titanium rocker-bogie arms
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), mats.darkAlloy);
    strut.position.set(pos.x > 0 ? -0.2 : 0.2, 0.25, 0);
    strut.rotation.z = pos.x > 0 ? 0.35 : -0.35;
    registerPart(strut, 'mobility', 'Curiosity Heavy Titanium Rocker-Bogie Linkage', interactiveParts, componentMap);
    scaledGroup.add(strut);

    scaledGroup.add(wheelGroup);
  });

  // 11. Heavy 2.1-Meter Robotic Arm & Turret Tools
  const armGroup = new THREE.Group();
  armGroup.position.set(0.35, -0.15, -0.75);

  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), mats.darkAlloy);
  shoulder.rotation.z = Math.PI / 2;
  registerPart(shoulder, 'robotic_arm', 'Robotic Arm Shoulder Azimuth Actuator', interactiveParts, componentMap);
  armGroup.add(shoulder);

  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.72, 8), mats.weatheredMetal);
  upperArm.rotation.x = Math.PI * 0.42;
  upperArm.position.set(0, -0.22, -0.28);
  registerPart(upperArm, 'robotic_arm', '2.1m Heavy Robotic Arm Upper Boom', interactiveParts, componentMap);
  armGroup.add(upperArm);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.65, 8), mats.weatheredMetal);
  forearm.rotation.x = -Math.PI * 0.18;
  forearm.position.set(0.05, -0.52, -0.55);
  registerPart(forearm, 'robotic_arm', 'Robotic Arm Forearm Segment', interactiveParts, componentMap);
  armGroup.add(forearm);

  // 30-kg Turret Assembly
  const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.32, 14), mats.darkAlloy);
  turretBase.position.set(0.08, -0.65, -0.78);
  turretBase.rotation.z = Math.PI / 2;
  registerPart(turretBase, 'robotic_arm', '30-kg Sensor Turret Base', interactiveParts, componentMap);
  armGroup.add(turretBase);

  // Drill
  const drillBody = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.35, 12), mats.weatheredMetal);
  drillBody.position.set(0.08, -0.82, -0.85);
  drillBody.rotation.x = Math.PI / 2;
  registerPart(drillBody, 'drill', 'Percussion Powder Acquisition Drill', interactiveParts, componentMap);
  armGroup.add(drillBody);

  const drillBit = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), mats.darkAlloy);
  drillBit.position.set(0.08, -0.82, -1.05);
  drillBit.rotation.x = Math.PI / 2;
  registerPart(drillBit, 'drill', 'Tungsten Carbide Percussion Drill Bit', interactiveParts, componentMap);
  armGroup.add(drillBit);

  // MAHLI (Mars Hand Lens Imager)
  const mahliMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.14), mats.goldMylar);
  mahliMesh.position.set(0.24, -0.65, -0.82);
  registerPart(mahliMesh, 'mahli', 'MAHLI (Mars Hand Lens Imager) Microscopic Color Camera', interactiveParts, componentMap);
  armGroup.add(mahliMesh);

  // APXS on Turret
  const apxsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 12), mats.brassDetail);
  apxsMesh.position.set(-0.08, -0.65, -0.82);
  registerPart(apxsMesh, 'apxs', 'Alpha Particle X-Ray Spectrometer (APXS)', interactiveParts, componentMap);
  armGroup.add(apxsMesh);

  // Brush (Dust Removal Tool - DRT)
  const brushMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 10), mats.weatheredMetal);
  brushMesh.position.set(0.08, -0.5, -0.82);
  registerPart(brushMesh, 'brush', 'Dust Removal Tool (DRT) Wire Brush', interactiveParts, componentMap);
  armGroup.add(brushMesh);

  // Scoop (CHIMRA)
  const scoopMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.14), mats.darkAlloy);
  scoopMesh.position.set(0.08, -0.65, -0.62);
  registerPart(scoopMesh, 'scoop', 'CHIMRA Sample Scoop & Sieve Device', interactiveParts, componentMap);
  armGroup.add(scoopMesh);

  scaledGroup.add(armGroup);

  return createInspectionModelWrapper(group, interactiveParts, componentMap);
}

// -----------------------------------------------------------------------------
// Model Wrapper: highlight management and coordinate queries
// -----------------------------------------------------------------------------
function createInspectionModelWrapper(
  group: THREE.Group,
  interactiveParts: THREE.Mesh[],
  componentMap: Map<string, THREE.Mesh[]>
): RoverInspectionModel {
  // Store original materials
  const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  interactiveParts.forEach((mesh) => {
    originalMaterials.set(mesh, mesh.material);
  });

  let activeHighlightId: string | null = null;

  const highlightComponent = (componentId: string | null) => {
    if (activeHighlightId === componentId) return;
    activeHighlightId = componentId;

    interactiveParts.forEach((mesh) => {
      const orig = originalMaterials.get(mesh);
      if (!orig) return;

      const meshCompId = mesh.userData.componentId;
      const isTarget = componentId !== null && meshCompId === componentId;

      if (isTarget) {
        if (!Array.isArray(mesh.material)) {
          const stdMat = mesh.material as THREE.MeshStandardMaterial;
          stdMat.emissive = new THREE.Color('#38bdf8');
          stdMat.emissiveIntensity = 0.55;
        }
      } else {
        if (!Array.isArray(mesh.material)) {
          const stdMat = mesh.material as THREE.MeshStandardMaterial;
          stdMat.emissive = new THREE.Color(0, 0, 0);
          stdMat.emissiveIntensity = 0;
        }
      }
    });
  };

  const getComponentCenter = (componentId: string): THREE.Vector3 | null => {
    const meshes = componentMap.get(componentId);
    if (!meshes || meshes.length === 0) return null;

    const box = new THREE.Box3();
    meshes.forEach((m) => {
      box.expandByObject(m);
    });

    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  };

  const dispose = () => {
    interactiveParts.forEach((mesh) => {
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material?.dispose();
      }
    });
  };

  return {
    group,
    interactiveParts,
    componentMap,
    highlightComponent,
    getComponentCenter,
    dispose,
  };
}

// -----------------------------------------------------------------------------
// 4. BUILDER: SOJOURNER ROVER (PATHFINDER)
// -----------------------------------------------------------------------------
export function buildSojournerInspectionModel(): RoverInspectionModel {
  const group = new THREE.Group();
  const interactiveParts: THREE.Mesh[] = [];
  const componentMap = new Map<string, THREE.Mesh[]>();
  const mats = createInspectionMaterials();

  // Scale group slightly for comfortable inspection inspection viewport
  group.scale.set(1.6, 1.6, 1.6);

  // 1. Warm Electronics Box (WEB) & Solar Deck
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.34), mats.goldMylar);
  bodyMesh.position.set(0, 0, 0);
  registerPart(bodyMesh, 'solar_panel_deck', 'Warm Electronics Box (WEB)', interactiveParts, componentMap);
  group.add(bodyMesh);

  const solarDeck = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.02, 0.38), mats.solarCellClean);
  solarDeck.position.set(0, 0.10, 0);
  registerPart(solarDeck, 'solar_panel_deck', '0.22 m² GaAs Solar Deck', interactiveParts, componentMap);
  group.add(solarDeck);

  // 2. Rocker-Bogie 6-Wheel Mobility System
  const wheelRadius = 0.07;
  const wheelWidth = 0.055;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const wheels = [
    { x: -0.28, z: -0.20, name: 'Left Front Cleated Wheel' },
    { x: 0.28, z: -0.20, name: 'Right Front Cleated Wheel' },
    { x: -0.30, z: 0.02, name: 'Left Middle Cleated Wheel' },
    { x: 0.30, z: 0.02, name: 'Right Middle Cleated Wheel' },
    { x: -0.28, z: 0.22, name: 'Left Rear Cleated Wheel' },
    { x: 0.28, z: 0.22, name: 'Right Rear Cleated Wheel' },
  ];

  wheels.forEach((w) => {
    const wheelMesh = new THREE.Mesh(wheelGeo, mats.wheelAluminum);
    wheelMesh.position.set(w.x, -0.12, w.z);
    registerPart(wheelMesh, 'rocker_bogie_chassis', w.name, interactiveParts, componentMap);
    group.add(wheelMesh);
  });

  [-1, 1].forEach((side) => {
    const rockerLink = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.38), mats.weatheredMetal);
    rockerLink.position.set(side * 0.25, -0.06, 0.01);
    registerPart(rockerLink, 'rocker_bogie_chassis', 'Rocker Titanium Linkage', interactiveParts, componentMap);
    group.add(rockerLink);

    const bogieLink = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.22), mats.weatheredMetal);
    bogieLink.position.set(side * 0.27, -0.09, 0.11);
    registerPart(bogieLink, 'rocker_bogie_chassis', 'Bogie Articulated Linkage', interactiveParts, componentMap);
    group.add(bogieLink);
  });

  // 3. APXS Spectrometer Sensor Head & Deployment Arm
  const apxsArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.20, 8), mats.weatheredMetal);
  apxsArm.position.set(0.08, -0.05, 0.24);
  apxsArm.rotation.x = Math.PI * 0.32;
  registerPart(apxsArm, 'apxs_spectrometer', 'APXS Articulated Deployment Arm', interactiveParts, componentMap);
  group.add(apxsArm);

  const apxsSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 12), mats.goldMylar);
  apxsSensor.position.set(0.08, -0.12, 0.34);
  apxsSensor.rotation.x = Math.PI * 0.25;
  registerPart(apxsSensor, 'apxs_spectrometer', 'APXS Curium-244 Contact Sensor Head', interactiveParts, componentMap);
  group.add(apxsSensor);

  // 4. UHF Radio Modem & Whip Antenna
  const whipMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, 0.40, 8), mats.brassDetail);
  whipMesh.position.set(0.20, 0.31, 0.12);
  registerPart(whipMesh, 'modem_antenna', 'UHF Monopole Whip Antenna (9600 bps)', interactiveParts, componentMap);
  group.add(whipMesh);

  return createInspectionModelWrapper(group, interactiveParts, componentMap);
}

// -----------------------------------------------------------------------------
// 5. BUILDER: INGENUITY MARS HELICOPTER (MARS 2020)
// -----------------------------------------------------------------------------
export function buildIngenuityInspectionModel(): RoverInspectionModel {
  const group = new THREE.Group();
  const interactiveParts: THREE.Mesh[] = [];
  const componentMap = new Map<string, THREE.Mesh[]>();
  const mats = createInspectionMaterials();

  // Scale group slightly for comfortable inspection viewport
  group.scale.set(1.5, 1.5, 1.5);

  // 1. Fuselage Electronics Cube & Downward NAV Camera
  const fuselageMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), mats.goldMylar);
  fuselageMesh.position.set(0, -0.05, 0);
  registerPart(fuselageMesh, 'avionics_cube', 'Fuselage Core Electronics Cube', interactiveParts, componentMap);
  group.add(fuselageMesh);

  const navCamera = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.024, 10), mats.darkAlloy);
  navCamera.position.set(0, -0.15, 0);
  registerPart(navCamera, 'avionics_cube', 'Downward Visual Odometry Camera & Laser Altimeter', interactiveParts, componentMap);
  group.add(navCamera);

  // 2. Central Mast & Coaxial Rotors
  const mastMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.58, 12), mats.darkAlloy);
  mastMesh.position.set(0, 0.16, 0);
  registerPart(mastMesh, 'coaxial_rotors', 'Central Rotor Drive Mast', interactiveParts, componentMap);
  group.add(mastMesh);

  // Lower rotor hub and 1.2m counter-rotating blades
  const lowerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 14), mats.weatheredMetal);
  lowerHub.position.set(0, 0.14, 0);
  registerPart(lowerHub, 'coaxial_rotors', 'Lower Swashplate Rotor Hub', interactiveParts, componentMap);
  group.add(lowerHub);

  const bladeGeo = new THREE.BoxGeometry(1.20, 0.009, 0.07);
  const lowerBlades = new THREE.Mesh(bladeGeo, mats.darkAlloy);
  lowerBlades.position.set(0, 0.14, 0);
  registerPart(lowerBlades, 'coaxial_rotors', 'Lower 1.2m Carbon-Fiber Composite Blades', interactiveParts, componentMap);
  group.add(lowerBlades);

  // Upper rotor hub and 1.2m counter-rotating blades (offset 85°)
  const upperHub = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.04, 14), mats.weatheredMetal);
  upperHub.position.set(0, 0.26, 0);
  registerPart(upperHub, 'coaxial_rotors', 'Upper Swashplate Rotor Hub', interactiveParts, componentMap);
  group.add(upperHub);

  const upperBlades = new THREE.Mesh(bladeGeo.clone(), mats.darkAlloy);
  upperBlades.position.set(0, 0.26, 0);
  upperBlades.rotation.y = Math.PI * 0.48;
  registerPart(upperBlades, 'coaxial_rotors', 'Upper 1.2m Counter-Rotating Blades', interactiveParts, componentMap);
  group.add(upperBlades);

  // 3. Top Solar Array & UHF Monopole Antenna
  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.014, 0.15), mats.solarCellClean);
  solarPanel.position.set(0, 0.38, 0);
  registerPart(solarPanel, 'solar_panel_top', 'Zenith Photovoltaic Array (350W Peak)', interactiveParts, componentMap);
  group.add(solarPanel);

  const uhfWhip = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.24, 8), mats.brassDetail);
  uhfWhip.position.set(0.07, 0.50, 0);
  registerPart(uhfWhip, 'solar_panel_top', '914 MHz UHF Relay Antenna', interactiveParts, componentMap);
  group.add(uhfWhip);

  // 4. Four Carbon-Composite Articulated Landing Legs
  const legCorners = [
    { x: -0.08, z: -0.08, angle: Math.PI * 1.25, name: 'Forward-Port' },
    { x: 0.08, z: -0.08, angle: Math.PI * 1.75, name: 'Forward-Starboard' },
    { x: -0.08, z: 0.08, angle: Math.PI * 0.75, name: 'Aft-Port' },
    { x: 0.08, z: 0.08, angle: Math.PI * 0.25, name: 'Aft-Starboard' },
  ];

  legCorners.forEach((corner) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(corner.x, -0.12, corner.z);
    legGroup.rotation.y = corner.angle;

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 8), mats.darkAlloy);
    strut.position.set(0, -0.11, 0.12);
    strut.rotation.x = Math.PI * 0.24;
    registerPart(strut, 'carbon_landing_legs', `${corner.name} Carbon Landing Strut`, interactiveParts, componentMap);
    legGroup.add(strut);

    const footpad = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.01, 10), mats.weatheredMetal);
    footpad.position.set(0, -0.23, 0.22);
    registerPart(footpad, 'carbon_landing_legs', `${corner.name} Footpad`, interactiveParts, componentMap);
    legGroup.add(footpad);

    group.add(legGroup);
  });

  return createInspectionModelWrapper(group, interactiveParts, componentMap);
}

// -----------------------------------------------------------------------------
// FACTORY
// -----------------------------------------------------------------------------
export function createRoverInspection3D(artifactId: string): RoverInspectionModel {
  switch (artifactId) {
    case 'mer_a_spirit':
      return buildSpiritInspectionModel();
    case 'mer_b_opportunity':
      return buildOpportunityInspectionModel();
    case 'msl_curiosity':
      return buildCuriosityInspectionModel();
    case 'pathfinder_sojourner':
      return buildSojournerInspectionModel();
    case 'ingenuity_helicopter':
      return buildIngenuityInspectionModel();
    default:
      // Fallback: Spirit MER model
      return buildSpiritInspectionModel();
  }
}

