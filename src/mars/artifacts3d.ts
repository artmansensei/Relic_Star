/**
 * 3D Models for the 5 Real NASA Mars Artifacts:
 * 1. Spirit Rover (MER-A) - 6-wheel rover, Pancam mast, solar deck, stuck wheel, ridge site
 * 2. Opportunity Rover (MER-B) - 6-wheel rover, steered front wheel, dust-cleaned panels, hematite blueberry outcrop
 * 3. Phoenix Lander - Stationary 3-leg lander, 2 decagonal fan solar panels, scoop arm in water-ice trench, TEGA, SSI mast
 * 4. InSight Lander - Stationary 3-leg lander, twin round UltraFlex solar arrays, ground-deployed SEIS dome with umbilical tether, HP3 mole, TWINS booms
 * 5. Curiosity Rover (MSL) - Heavy SUV-scale rover, 6 large chevron wheels with puncture wear, nuclear MMRTG generator aft, tall ChemCam/Mastcam mast, heavy drill turret arm
 */

import * as THREE from 'three';
import { getTerrainHeight } from './terrain';
import { ALL_ARTIFACTS } from '../data/artifacts';

export interface Artifact3DObject {
  id: string;
  name: string;
  position: THREE.Vector3;
  group: THREE.Group;
  beaconLight: THREE.PointLight;
  beaconMesh: THREE.Mesh;
  interactiveParts: THREE.Object3D[];
  extraMeshes: THREE.Object3D[]; // trenches, tracks, outcrops
  highlightPart: (partId: string | null) => void;
  update: (time: number) => void;
}

// -----------------------------------------------------------------------------
// Shared Material Palette
// -----------------------------------------------------------------------------
function getSharedMaterials() {
  const goldMylarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d49d3b'),
    metalness: 0.85,
    roughness: 0.35,
    bumpScale: 0.08,
  });

  const weatheredMetalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#6c7278'),
    metalness: 0.65,
    roughness: 0.55,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2d3238'),
    metalness: 0.75,
    roughness: 0.45,
  });

  const wheelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#585e65'),
    metalness: 0.8,
    roughness: 0.6,
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1a2942'), // Deep blue silicon solar cell
    metalness: 0.4,
    roughness: 0.3,
  });

  const dustySolarCellMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#4a3b32'), // Heavily dust-covered photovoltaic cells
    metalness: 0.25,
    roughness: 0.65,
  });

  const whiteThermalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d0d4d8'), // Off-white composite thermal shell
    metalness: 0.35,
    roughness: 0.5,
  });

  const rtgDarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#222428'), // High-emissivity graphite/alloy cooling fins
    metalness: 0.85,
    roughness: 0.3,
  });

  const waterIceMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#cceeff'), // Exposed cryogenic water ice
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  });

  const blueberryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#22262d'), // Metallic dark gray/blue hematite
    metalness: 0.9,
    roughness: 0.35,
  });

  return {
    goldMylarMat,
    weatheredMetalMat,
    darkAlloyMat,
    wheelMat,
    solarCellMat,
    dustySolarCellMat,
    whiteThermalMat,
    rtgDarkMat,
    waterIceMat,
    blueberryMat,
  };
}

// -----------------------------------------------------------------------------
// 1. SPIRIT ROVER (MER-A)
// -----------------------------------------------------------------------------
export function createSpiritRover3D(): Artifact3DObject {
  const artifactData = ALL_ARTIFACTS.mer_a_spirit;
  const x = artifactData.worldPosition.x;
  const z = artifactData.worldPosition.z;
  const y = getTerrainHeight(x, z);
  const position = new THREE.Vector3(x, y, z);

  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = Math.PI * 0.28;
  group.rotation.z = -0.04;
  group.rotation.x = 0.05;

  const mats = getSharedMaterials();
  const interactiveParts: THREE.Object3D[] = [];
  const extraMeshes: THREE.Object3D[] = [];

  // Chassis (WEB)
  const bodyGeo = new THREE.BoxGeometry(1.6, 0.7, 1.2);
  const bodyMesh = new THREE.Mesh(bodyGeo, mats.goldMylarMat);
  bodyMesh.position.y = 0.85;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyMesh.userData = { componentId: 'rover_body', componentName: 'Warm Electronics Box (WEB)' };
  interactiveParts.push(bodyMesh);
  group.add(bodyMesh);

  // Chassis Pan
  const panGeo = new THREE.BoxGeometry(1.4, 0.25, 1.0);
  const panMesh = new THREE.Mesh(panGeo, mats.darkAlloyMat);
  panMesh.position.y = 0.48;
  group.add(panMesh);

  // Solar Array Deck
  const deckGroup = new THREE.Group();
  deckGroup.position.set(0, 1.22, 0);
  const centerPanel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.4), mats.solarCellMat);
  centerPanel.castShadow = true;
  centerPanel.userData = { componentId: 'solar_panels', componentName: 'Triple-Junction GaAs Solar Array' };
  interactiveParts.push(centerPanel);
  deckGroup.add(centerPanel);

  // Wings
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.2), mats.solarCellMat);
  leftWing.position.set(-1.1, -0.03, 0);
  leftWing.rotation.z = 0.08;
  leftWing.userData = { componentId: 'solar_panels', componentName: 'Solar Array Port Wing' };
  interactiveParts.push(leftWing);
  deckGroup.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.2), mats.solarCellMat);
  rightWing.position.set(1.1, -0.03, 0);
  rightWing.rotation.z = -0.08;
  rightWing.userData = { componentId: 'solar_panels', componentName: 'Solar Array Starboard Wing' };
  interactiveParts.push(rightWing);
  deckGroup.add(rightWing);

  const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.6), mats.solarCellMat);
  rearWing.position.set(0, -0.02, 0.9);
  rearWing.rotation.x = -0.08;
  rearWing.userData = { componentId: 'solar_panels', componentName: 'Solar Array Aft Wing' };
  interactiveParts.push(rearWing);
  deckGroup.add(rearWing);

  group.add(deckGroup);

  // Pancam Mast
  const mastGroup = new THREE.Group();
  mastGroup.position.set(-0.45, 1.25, -0.45);
  const mastPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.45, 10), mats.weatheredMetalMat);
  mastPillar.position.y = 0.72;
  mastPillar.castShadow = true;
  mastPillar.userData = { componentId: 'pancam', componentName: 'Pancam Mast Assembly' };
  interactiveParts.push(mastPillar);
  mastGroup.add(mastPillar);

  const headBar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.14), mats.darkAlloyMat);
  headBar.position.set(0, 1.45, 0);
  headBar.userData = { componentId: 'pancam', componentName: 'Stereo Pancam Head' };
  interactiveParts.push(headBar);
  mastGroup.add(headBar);

  const camL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 8), mats.goldMylarMat);
  camL.rotation.x = Math.PI / 2;
  camL.position.set(-0.14, 1.45, -0.08);
  camL.userData = { componentId: 'pancam', componentName: 'Pancam Left Lens' };
  interactiveParts.push(camL);
  mastGroup.add(camL);

  const camR = camL.clone();
  camR.position.x = 0.14;
  camR.userData = { componentId: 'pancam', componentName: 'Pancam Right Lens' };
  interactiveParts.push(camR);
  mastGroup.add(camR);

  // Beacon Light on Mast
  const beaconGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#f59e0b') });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0, 1.54, 0);
  mastGroup.add(beaconMesh);

  const beaconLight = new THREE.PointLight('#f59e0b', 0.8, 18, 2);
  beaconLight.position.set(0, 1.55, 0);
  mastGroup.add(beaconLight);

  group.add(mastGroup);

  // High Gain Antenna (HGA)
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(0.45, 1.25, 0.35);
  const dishMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.04, 0.08, 18, 1, true), mats.goldMylarMat);
  dishMesh.rotation.x = -Math.PI * 0.35;
  dishMesh.castShadow = true;
  dishMesh.userData = { componentId: 'high_gain_antenna', componentName: 'High-Gain Parabolic Antenna (HGA)' };
  interactiveParts.push(dishMesh);
  hgaGroup.add(dishMesh);
  group.add(hgaGroup);

  // Low Gain Antenna (LGA)
  const lgaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.85, 6), mats.weatheredMetalMat);
  lgaMesh.position.set(-0.55, 1.65, 0.45);
  lgaMesh.rotation.z = -0.06;
  lgaMesh.userData = { componentId: 'low_gain_antenna', componentName: 'Omnidirectional Low-Gain Antenna (LGA)' };
  interactiveParts.push(lgaMesh);
  group.add(lgaMesh);

  // Wheels & Rocker-Bogie
  const wheelOffsets = [
    { x: -1.05, z: -0.7, name: 'Left Front Wheel' },
    { x: 1.05, z: -0.7, name: 'Right Front Wheel (Stalled)' },
    { x: -1.15, z: 0.1, name: 'Left Middle Wheel' },
    { x: 1.15, z: 0.1, name: 'Right Middle Wheel' },
    { x: -1.05, z: 0.85, name: 'Left Rear Wheel' },
    { x: 1.05, z: 0.85, name: 'Right Rear Wheel' },
  ];

  wheelOffsets.forEach((pos, idx) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, 0.28, pos.z);
    if (idx === 1) {
      // Stalled right-front wheel tilted
      wheelGroup.rotation.y = 0.25;
      wheelGroup.rotation.z = 0.1;
    }
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.22, 16), mats.wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    wheel.userData = { componentId: 'wheels', componentName: pos.name };
    interactiveParts.push(wheel);
    wheelGroup.add(wheel);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 12), mats.darkAlloyMat);
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);

    group.add(wheelGroup);
  });

  // Robotic Arm (IDD)
  const armGroup = new THREE.Group();
  armGroup.position.set(0.2, 0.5, -0.65);
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), mats.weatheredMetalMat);
  arm1.position.set(0, -0.15, -0.2);
  arm1.rotation.x = Math.PI * 0.35;
  arm1.userData = { componentId: 'robotic_arm', componentName: 'Instrument Deployment Device (IDD)' };
  interactiveParts.push(arm1);
  armGroup.add(arm1);

  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 12), mats.goldMylarMat);
  turret.position.set(0.08, -0.38, -0.45);
  turret.userData = { componentId: 'robotic_arm', componentName: 'Sensor Turret (APXS / RAT / Mössbauer)' };
  interactiveParts.push(turret);
  armGroup.add(turret);
  group.add(armGroup);

  // Target Science Specimen Rock
  const rockGeo = new THREE.DodecahedronGeometry(0.42, 1);
  const targetRockMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#4d2316'),
    roughness: 0.88,
    metalness: 0.15,
  });
  const targetRock = new THREE.Mesh(rockGeo, targetRockMat);
  targetRock.position.set(position.x + 0.35, position.y + 0.15, position.z - 1.6);
  targetRock.scale.set(1.4, 0.85, 1.2);
  targetRock.castShadow = true;
  extraMeshes.push(targetRock);

  // Sand Tracks & Seized Right-Wheel Silica Drag Trench
  const trackGeo = new THREE.PlaneGeometry(1.9, 12, 1, 16);
  trackGeo.rotateX(-Math.PI / 2);
  const trackMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#783419'),
    roughness: 0.99,
    transparent: true,
    opacity: 0.65,
  });
  const tracksMesh = new THREE.Mesh(trackGeo, trackMat);
  tracksMesh.position.set(position.x - 0.2, position.y + 0.02, position.z + 6.2);
  tracksMesh.rotation.y = group.rotation.y;
  extraMeshes.push(tracksMesh);

  // Authentic right-wheel dragging furrow revealing bright ~90% silica soil
  const silicaGeo = new THREE.PlaneGeometry(0.35, 11, 1, 16);
  silicaGeo.rotateX(-Math.PI / 2);
  const silicaMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ded7c5'), // Pale cream-white silica rich regolith
    roughness: 0.92,
    transparent: true,
    opacity: 0.88,
  });
  const silicaMesh = new THREE.Mesh(silicaGeo, silicaMat);
  silicaMesh.position.set(position.x + 0.82, position.y + 0.03, position.z + 5.8);
  silicaMesh.rotation.y = group.rotation.y;
  extraMeshes.push(silicaMesh);

  // Turn off unnatural glowing beacons on dormant historical spacecraft
  beaconLight.intensity = 0;
  beaconLight.visible = false;
  beaconMesh.visible = false;

  const highlightPart = () => {};

  return {
    id: artifactData.id,
    name: artifactData.name,
    position,
    group,
    beaconLight,
    beaconMesh,
    interactiveParts,
    extraMeshes,
    highlightPart,
    update: () => {
      // Dormant historical artifact - no artificial arcade glow
    },
  };
}

// -----------------------------------------------------------------------------
// 2. OPPORTUNITY ROVER (MER-B)
// -----------------------------------------------------------------------------
export function createOpportunityRover3D(): Artifact3DObject {
  const artifactData = ALL_ARTIFACTS.mer_b_opportunity;
  const x = artifactData.worldPosition.x;
  const z = artifactData.worldPosition.z;
  const y = getTerrainHeight(x, z);
  const position = new THREE.Vector3(x, y, z);

  const group = new THREE.Group();
  group.position.copy(position);
  // Visually distinct: rotated facing northwest towards crater rim slope, slightly pitched
  group.rotation.y = -Math.PI * 0.55;
  group.rotation.x = -0.06;
  group.rotation.z = 0.07;

  const mats = getSharedMaterials();
  const interactiveParts: THREE.Object3D[] = [];
  const extraMeshes: THREE.Object3D[] = [];

  // Weathered Chassis (MER-B) - slightly darker with dust accumulation
  const bodyGeo = new THREE.BoxGeometry(1.6, 0.7, 1.2);
  const bodyMesh = new THREE.Mesh(bodyGeo, mats.goldMylarMat);
  bodyMesh.position.y = 0.85;
  bodyMesh.castShadow = true;
  bodyMesh.userData = { componentId: 'rover_body', componentName: 'MER-B Electronics Chassis' };
  interactiveParts.push(bodyMesh);
  group.add(bodyMesh);

  // Tilted Solar Deck with wind-cleaning streaks
  const deckGroup = new THREE.Group();
  deckGroup.position.set(0, 1.22, 0);
  const centerPanel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.4), mats.solarCellMat);
  centerPanel.userData = { componentId: 'solar_panels', componentName: 'Tilted Solar Array & Dust Cleaning Tracks' };
  interactiveParts.push(centerPanel);
  deckGroup.add(centerPanel);

  // Wings tilted differently
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.2), mats.solarCellMat);
  leftWing.position.set(-1.1, -0.05, 0);
  leftWing.rotation.z = 0.12;
  leftWing.userData = { componentId: 'solar_panels', componentName: 'Port Solar Wing' };
  interactiveParts.push(leftWing);
  deckGroup.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.2), mats.solarCellMat);
  rightWing.position.set(1.1, -0.05, 0);
  rightWing.rotation.z = -0.12;
  rightWing.userData = { componentId: 'solar_panels', componentName: 'Starboard Solar Wing' };
  interactiveParts.push(rightWing);
  deckGroup.add(rightWing);
  group.add(deckGroup);

  // Pancam Mast (aiming toward Endeavour Crater)
  const mastGroup = new THREE.Group();
  mastGroup.position.set(-0.45, 1.25, -0.45);
  mastGroup.rotation.y = 0.45; // Different camera azimuth
  const mastPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.45, 10), mats.weatheredMetalMat);
  mastPillar.position.y = 0.72;
  mastPillar.userData = { componentId: 'pancam', componentName: 'Pancam Mast & Optics' };
  interactiveParts.push(mastPillar);
  mastGroup.add(mastPillar);

  const headBar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.14), mats.darkAlloyMat);
  headBar.position.set(0, 1.45, 0);
  headBar.userData = { componentId: 'pancam', componentName: 'Pancam Stereo Head' };
  interactiveParts.push(headBar);
  mastGroup.add(headBar);

  // Beacon Light on Mast (Cyan pulse for Opportunity)
  const beaconGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#38bdf8') });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0, 1.54, 0);
  mastGroup.add(beaconMesh);

  const beaconLight = new THREE.PointLight('#38bdf8', 0.8, 18, 2);
  beaconLight.position.set(0, 1.55, 0);
  mastGroup.add(beaconLight);
  group.add(mastGroup);

  // High Gain Antenna (different orientation)
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(0.45, 1.25, 0.35);
  const dishMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.04, 0.08, 18, 1, true), mats.goldMylarMat);
  dishMesh.rotation.x = -Math.PI * 0.45;
  dishMesh.rotation.y = 0.3;
  dishMesh.userData = { componentId: 'high_gain_antenna', componentName: 'Articulated High-Gain Parabolic Dish' };
  interactiveParts.push(dishMesh);
  hgaGroup.add(dishMesh);
  group.add(hgaGroup);

  // Low Gain Antenna
  const lgaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.85, 6), mats.weatheredMetalMat);
  lgaMesh.position.set(-0.55, 1.65, 0.45);
  lgaMesh.userData = { componentId: 'low_gain_antenna', componentName: 'Low-Gain Omnidirectional Mast' };
  interactiveParts.push(lgaMesh);
  group.add(lgaMesh);

  // Wheels: front wheel steered at sharp angle
  const wheelOffsets = [
    { x: -1.05, z: -0.7, name: 'Steered Left Front Wheel', steer: 0.32 },
    { x: 1.05, z: -0.7, name: 'Steered Right Front Wheel', steer: 0.28 },
    { x: -1.15, z: 0.1, name: 'Left Middle Wheel', steer: 0 },
    { x: 1.15, z: 0.1, name: 'Right Middle Wheel', steer: 0 },
    { x: -1.05, z: 0.85, name: 'Left Rear Wheel', steer: -0.15 },
    { x: 1.05, z: 0.85, name: 'Right Rear Wheel', steer: -0.15 },
  ];

  wheelOffsets.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, 0.28, pos.z);
    wheelGroup.rotation.y = pos.steer;
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.22, 16), mats.wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.userData = { componentId: 'wheels', componentName: pos.name };
    interactiveParts.push(wheel);
    wheelGroup.add(wheel);
    group.add(wheelGroup);
  });

  // Robotic Arm extended touching sulfate rock
  const armGroup = new THREE.Group();
  armGroup.position.set(0.2, 0.5, -0.65);
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), mats.weatheredMetalMat);
  arm1.position.set(0, -0.18, -0.22);
  arm1.rotation.x = Math.PI * 0.4;
  arm1.userData = { componentId: 'robotic_arm', componentName: 'Instrument Deployment Device (IDD)' };
  interactiveParts.push(arm1);
  armGroup.add(arm1);
  group.add(armGroup);

  // Hematite Blueberries Rock Outcrop (Unique to Opportunity!)
  const outcropGeo = new THREE.BoxGeometry(3.5, 0.25, 2.8);
  const outcropMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5c3826'),
    roughness: 0.95,
  });
  const outcropMesh = new THREE.Mesh(outcropGeo, outcropMat);
  outcropMesh.position.set(position.x - 0.5, position.y + 0.08, position.z - 2.2);
  outcropMesh.userData = { componentId: 'hematite_field', componentName: 'Hematite Spherule ("Blueberry") Outcrop' };
  interactiveParts.push(outcropMesh);
  extraMeshes.push(outcropMesh);

  // Scatter small spherical hematite blueberries on the outcrop
  for (let i = 0; i < 28; i++) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), mats.blueberryMat);
    const ox = (Math.random() - 0.5) * 2.8;
    const oz = (Math.random() - 0.5) * 2.2;
    sphere.position.set(position.x - 0.5 + ox, position.y + 0.22, position.z - 2.2 + oz);
    sphere.userData = { componentId: 'hematite_field', componentName: 'Hematite Blueberry Spherule' };
    interactiveParts.push(sphere);
    extraMeshes.push(sphere);
  }

  // Turn off unnatural glowing beacons on dormant historical spacecraft
  beaconLight.intensity = 0;
  beaconLight.visible = false;
  beaconMesh.visible = false;

  const highlightPart = () => {};

  return {
    id: artifactData.id,
    name: artifactData.name,
    position,
    group,
    beaconLight,
    beaconMesh,
    interactiveParts,
    extraMeshes,
    highlightPart,
    update: () => {
      // Dormant historical artifact - natural weathering and lighting
    },
  };
}

// -----------------------------------------------------------------------------
// 3. PHOENIX LANDER (STATIONARY LANDER — ABSOLUTELY NO WHEELS)
// -----------------------------------------------------------------------------
export function createPhoenixLander3D(): Artifact3DObject {
  const artifactData = ALL_ARTIFACTS.phoenix_lander;
  const x = artifactData.worldPosition.x;
  const z = artifactData.worldPosition.z;
  const y = getTerrainHeight(x, z);
  const position = new THREE.Vector3(x, y, z);

  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = Math.PI * 0.15;

  const mats = getSharedMaterials();
  const interactiveParts: THREE.Object3D[] = [];
  const extraMeshes: THREE.Object3D[] = [];

  // Central Octagonal Lander Body Platform (Deck)
  const deckMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.45, 8), mats.goldMylarMat);
  deckMesh.position.y = 0.85;
  deckMesh.castShadow = true;
  deckMesh.userData = { componentId: 'lander_body', componentName: 'Hexagonal Lander Deck & Thermal Blankets' };
  interactiveParts.push(deckMesh);
  group.add(deckMesh);

  // Under-deck descent thruster pods
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + 0.5;
    const thruster = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 8), mats.darkAlloyMat);
    thruster.rotation.x = Math.PI;
    thruster.position.set(Math.cos(angle) * 0.7, 0.55, Math.sin(angle) * 0.7);
    group.add(thruster);
  }

  // 3 Articulated Inverted-Tripod Landing Struts with Circular Footpads (NO WHEELS)
  for (let i = 0; i < 3; i++) {
    const legAngle = (i * Math.PI * 2) / 3;
    const legGroup = new THREE.Group();
    legGroup.rotation.y = legAngle;

    // Main angled strut
    const mainStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.1, 8), mats.weatheredMetalMat);
    mainStrut.position.set(0.65, 0.45, 0);
    mainStrut.rotation.z = -Math.PI * 0.28;
    mainStrut.userData = { componentId: 'landing_legs', componentName: `Landing Leg Strut ${i + 1}` };
    interactiveParts.push(mainStrut);
    legGroup.add(mainStrut);

    // Diagonal stabilizer brace
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6), mats.darkAlloyMat);
    brace.position.set(0.45, 0.35, 0);
    brace.rotation.z = Math.PI * 0.25;
    legGroup.add(brace);

    // Wide circular footpad firmly planted on ground
    const footpad = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16), mats.goldMylarMat);
    footpad.position.set(1.15, 0.04, 0);
    footpad.userData = { componentId: 'landing_legs', componentName: `Landing Footpad ${i + 1}` };
    interactiveParts.push(footpad);
    legGroup.add(footpad);

    group.add(legGroup);
  }

  // Twin Decagonal Fan-Like Solar Arrays (port & starboard)
  const solarL = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.03, 10), mats.dustySolarCellMat);
  solarL.rotation.z = Math.PI / 2;
  solarL.rotation.y = Math.PI * 0.05;
  solarL.position.set(-1.85, 0.95, 0);
  solarL.scale.set(1.0, 0.05, 0.8);
  solarL.userData = { componentId: 'solar_arrays', componentName: 'Decagonal Port Solar Array Wing' };
  interactiveParts.push(solarL);
  group.add(solarL);

  const solarR = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.03, 10), mats.dustySolarCellMat);
  solarR.rotation.z = Math.PI / 2;
  solarR.rotation.y = -Math.PI * 0.05;
  solarR.position.set(1.85, 0.95, 0);
  solarR.scale.set(1.0, 0.05, 0.8);
  solarR.userData = { componentId: 'solar_arrays', componentName: 'Decagonal Starboard Solar Array Wing' };
  interactiveParts.push(solarR);
  group.add(solarR);

  // Surface Stereo Imager (SSI) Mast
  const ssiMast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.1, 8), mats.weatheredMetalMat);
  ssiMast.position.set(-0.25, 1.55, -0.3);
  ssiMast.userData = { componentId: 'ssi_mast', componentName: 'Surface Stereo Imager (SSI) Mast' };
  interactiveParts.push(ssiMast);
  group.add(ssiMast);

  const ssiHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.15), mats.darkAlloyMat);
  ssiHead.position.set(-0.25, 2.1, -0.3);
  ssiHead.userData = { componentId: 'ssi_mast', componentName: 'SSI Stereo Imaging Head' };
  interactiveParts.push(ssiHead);
  group.add(ssiHead);

  // Beacon Light on SSI Mast (Emerald green beacon for Phoenix)
  const beaconGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#10b981') });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(-0.25, 2.2, -0.3);
  group.add(beaconMesh);

  const beaconLight = new THREE.PointLight('#10b981', 0.8, 18, 2);
  beaconLight.position.set(-0.25, 2.2, -0.3);
  group.add(beaconLight);

  // TEGA Ovens on the Deck
  const tegaBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.35), mats.darkAlloyMat);
  tegaBox.position.set(0.3, 1.15, -0.2);
  tegaBox.userData = { componentId: 'tega_ovens', componentName: 'TEGA Thermal Analyzer Ovens & Doors' };
  interactiveParts.push(tegaBox);
  group.add(tegaBox);

  // 2.35m Robotic Arm with Scoop reaching down into the trench
  const armGroup = new THREE.Group();
  armGroup.position.set(0, 0.95, 0.85);

  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8), mats.weatheredMetalMat);
  shoulder.rotation.x = Math.PI * 0.35;
  shoulder.position.set(0, -0.15, 0.25);
  shoulder.userData = { componentId: 'robotic_arm', componentName: '2.35m Robotic Arm Upper Segment' };
  interactiveParts.push(shoulder);
  armGroup.add(shoulder);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8), mats.weatheredMetalMat);
  forearm.rotation.x = Math.PI * 0.65;
  forearm.position.set(0, -0.45, 0.7);
  forearm.userData = { componentId: 'robotic_arm', componentName: 'Robotic Arm Forearm & Rasp Scoop' };
  interactiveParts.push(forearm);
  armGroup.add(forearm);

  const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.16), mats.goldMylarMat);
  scoop.position.set(0, -0.75, 1.05);
  scoop.userData = { componentId: 'robotic_arm', componentName: 'Cryogenic Rasp & Soil Scoop' };
  interactiveParts.push(scoop);
  armGroup.add(scoop);
  group.add(armGroup);

  // Excavation Trench with EXPOSED PURE WATER ICE! ("Snow White" trench)
  const trenchGroup = new THREE.Group();
  trenchGroup.position.set(position.x, position.y + 0.02, position.z + 2.0);

  // Depressed trench bowl
  const trenchSoil = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.15, 0.8),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#542617'), roughness: 0.95 })
  );
  trenchSoil.userData = { componentId: 'excavation_trench', componentName: 'Subsurface Water-Ice Trench ("Snow White")' };
  interactiveParts.push(trenchSoil);
  trenchGroup.add(trenchSoil);

  // Exposed glistening subsurface water-ice shelf!
  const iceShelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.45), mats.waterIceMat);
  iceShelf.position.y = 0.04;
  iceShelf.userData = { componentId: 'excavation_trench', componentName: 'Exposed Subsurface Water Ice Shelf' };
  interactiveParts.push(iceShelf);
  trenchGroup.add(iceShelf);

  extraMeshes.push(trenchGroup);

  // High-latitude polygonal patterned ground cracks (permafrost thermal contraction polygons)
  const polygonMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#431e13'),
    roughness: 0.98,
    transparent: true,
    opacity: 0.75,
  });
  for (let i = 0; i < 6; i++) {
    const crackAngle = (i * Math.PI) / 3;
    const crackGeo = new THREE.PlaneGeometry(0.12, 5.5);
    crackGeo.rotateX(-Math.PI / 2);
    const crackMesh = new THREE.Mesh(crackGeo, polygonMat);
    crackMesh.position.set(position.x + Math.cos(crackAngle) * 3.2, position.y + 0.015, position.z + Math.sin(crackAngle) * 3.2);
    crackMesh.rotation.y = crackAngle + 0.2;
    extraMeshes.push(crackMesh);
  }

  // Turn off unnatural glowing beacons on dormant historical spacecraft
  beaconLight.intensity = 0;
  beaconLight.visible = false;
  beaconMesh.visible = false;

  const highlightPart = () => {};

  return {
    id: artifactData.id,
    name: artifactData.name,
    position,
    group,
    beaconLight,
    beaconMesh,
    interactiveParts,
    extraMeshes,
    highlightPart,
    update: () => {
      // Dormant historical artifact - natural weathering and lighting
    },
  };
}

// -----------------------------------------------------------------------------
// 4. INSIGHT LANDER (STATIONARY LANDER — ABSOLUTELY NO WHEELS)
// -----------------------------------------------------------------------------
export function createInSightLander3D(): Artifact3DObject {
  const artifactData = ALL_ARTIFACTS.insight_lander;
  const x = artifactData.worldPosition.x;
  const z = artifactData.worldPosition.z;
  const y = getTerrainHeight(x, z);
  const position = new THREE.Vector3(x, y, z);

  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = -Math.PI * 0.25;

  const mats = getSharedMaterials();
  const interactiveParts: THREE.Object3D[] = [];
  const extraMeshes: THREE.Object3D[] = [];

  // Hexagonal Lander Body Bus
  const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.5, 6), mats.whiteThermalMat);
  bodyMesh.position.y = 0.85;
  bodyMesh.castShadow = true;
  bodyMesh.userData = { componentId: 'lander_body', componentName: 'InSight Lander Bus & White Thermal Shell' };
  interactiveParts.push(bodyMesh);
  group.add(bodyMesh);

  // 3 Lander Legs (tripod with wide footpads)
  for (let i = 0; i < 3; i++) {
    const legAngle = (i * Math.PI * 2) / 3 + 0.5;
    const legGroup = new THREE.Group();
    legGroup.rotation.y = legAngle;

    const mainStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.15, 8), mats.weatheredMetalMat);
    mainStrut.position.set(0.7, 0.45, 0);
    mainStrut.rotation.z = -Math.PI * 0.28;
    legGroup.add(mainStrut);

    const footpad = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16), mats.goldMylarMat);
    footpad.position.set(1.2, 0.05, 0);
    legGroup.add(footpad);

    group.add(legGroup);
  }

  // Twin 2.15m Round UltraFlex Solar Arrays (Iconic circular fan shape)
  const ultraFlexGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.03, 24);
  const solarL = new THREE.Mesh(ultraFlexGeo, mats.dustySolarCellMat);
  solarL.position.set(-2.0, 0.9, 0);
  solarL.rotation.z = Math.PI / 2;
  solarL.scale.set(1.0, 0.04, 1.0);
  solarL.userData = { componentId: 'ultraflex_solar', componentName: 'Twin 2.15m Round UltraFlex Solar Arrays' };
  interactiveParts.push(solarL);
  group.add(solarL);

  const solarR = new THREE.Mesh(ultraFlexGeo, mats.dustySolarCellMat);
  solarR.position.set(2.0, 0.9, 0);
  solarR.rotation.z = Math.PI / 2;
  solarR.scale.set(1.0, 0.04, 1.0);
  solarR.userData = { componentId: 'ultraflex_solar', componentName: 'Starboard UltraFlex Solar Array' };
  interactiveParts.push(solarR);
  group.add(solarR);

  // Beacon Light on Antenna Mast (Purple/violet pulse for InSight)
  const beaconMast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.9, 8), mats.weatheredMetalMat);
  beaconMast.position.set(0, 1.55, -0.4);
  group.add(beaconMast);

  const beaconGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#a855f7') });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0, 2.02, -0.4);
  group.add(beaconMesh);

  const beaconLight = new THREE.PointLight('#a855f7', 0.8, 18, 2);
  beaconLight.position.set(0, 2.02, -0.4);
  group.add(beaconLight);

  // TWINS Weather Booms
  const boom1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), mats.weatheredMetalMat);
  boom1.position.set(-0.65, 1.15, 0.4);
  boom1.rotation.z = Math.PI * 0.35;
  boom1.userData = { componentId: 'twins_booms', componentName: 'TWINS Atmospheric Wind & Temperature Booms' };
  interactiveParts.push(boom1);
  group.add(boom1);

  const boom2 = boom1.clone();
  boom2.position.set(0.65, 1.15, 0.4);
  boom2.rotation.z = -Math.PI * 0.35;
  interactiveParts.push(boom2);
  group.add(boom2);

  // Instrument Deployment Arm (IDA) with Grapple Claw
  const armGroup = new THREE.Group();
  armGroup.position.set(0, 0.95, 0.6);
  const idaArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), mats.weatheredMetalMat);
  idaArm.rotation.x = Math.PI * 0.45;
  idaArm.position.set(0, -0.2, 0.35);
  idaArm.userData = { componentId: 'robotic_arm', componentName: 'Instrument Deployment Arm (IDA) & Grapple Claw' };
  interactiveParts.push(idaArm);
  armGroup.add(idaArm);
  group.add(armGroup);

  // GROUND HARDWARE: SEIS Seismometer Dome & Wind/Thermal Shield (WTS) on the soil!
  const seisGroup = new THREE.Group();
  seisGroup.position.set(position.x + 0.3, position.y + 0.02, position.z + 2.2);

  // Aerodynamic dome on the ground
  const seisDome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mats.goldMylarMat);
  seisDome.scale.set(1.0, 0.65, 1.0);
  seisDome.userData = { componentId: 'seis_dome', componentName: 'SEIS Seismometer & Wind / Thermal Shield (WTS)' };
  interactiveParts.push(seisDome);
  seisGroup.add(seisDome);

  // SEIS Flexible Ribbon Tether connecting dome back to lander
  const tetherCurve = new THREE.LineCurve3(
    new THREE.Vector3(0, 0.02, 0),
    new THREE.Vector3(-0.3, 0.25, -1.6)
  );
  const tetherGeo = new THREE.TubeGeometry(tetherCurve, 12, 0.025, 6, false);
  const tetherMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#d97706'), roughness: 0.5 });
  const tetherMesh = new THREE.Mesh(tetherGeo, tetherMat);
  tetherMesh.userData = { componentId: 'seis_tether', componentName: 'SEIS Flexible Ribbon Tether' };
  interactiveParts.push(tetherMesh);
  seisGroup.add(tetherMesh);
  extraMeshes.push(seisGroup);

  // HP3 Heat Flow "Mole" Housing on Ground
  const hp3Group = new THREE.Group();
  hp3Group.position.set(position.x - 1.2, position.y + 0.02, position.z + 1.8);
  const hp3Box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.25), mats.darkAlloyMat);
  hp3Box.position.y = 0.14;
  hp3Box.userData = { componentId: 'hp3_housing', componentName: 'HP3 "Mole" Heat-Flow Support Structure' };
  interactiveParts.push(hp3Box);
  hp3Group.add(hp3Box);
  extraMeshes.push(hp3Group);

  // Turn off unnatural glowing beacons on dormant historical spacecraft
  beaconLight.intensity = 0;
  beaconLight.visible = false;
  beaconMesh.visible = false;

  const highlightPart = () => {};

  return {
    id: artifactData.id,
    name: artifactData.name,
    position,
    group,
    beaconLight,
    beaconMesh,
    interactiveParts,
    extraMeshes,
    highlightPart,
    update: () => {
      // Dormant historical artifact - natural weathering and lighting
    },
  };
}

// -----------------------------------------------------------------------------
// 5. CURIOSITY ROVER (MSL — MASSIVE NUCLEAR-POWERED EXPLORATION ROVER)
// -----------------------------------------------------------------------------
export function createCuriosityRover3D(): Artifact3DObject {
  const artifactData = ALL_ARTIFACTS.msl_curiosity;
  const x = artifactData.worldPosition.x;
  const z = artifactData.worldPosition.z;
  const y = getTerrainHeight(x, z);
  const position = new THREE.Vector3(x, y, z);

  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = -Math.PI * 0.7;

  const mats = getSharedMaterials();
  const interactiveParts: THREE.Object3D[] = [];
  const extraMeshes: THREE.Object3D[] = [];

  // MSL Scale Factor: Curiosity is ~1.75x larger than MER!
  const SCALE = 1.65;
  const scaledGroup = new THREE.Group();
  scaledGroup.scale.set(SCALE, SCALE, SCALE);
  group.add(scaledGroup);

  // Large SUV-Sized Rover Body & Thermal Composite Shell
  const bodyGeo = new THREE.BoxGeometry(1.9, 0.9, 1.4);
  const bodyMesh = new THREE.Mesh(bodyGeo, mats.whiteThermalMat);
  bodyMesh.position.y = 0.95;
  bodyMesh.castShadow = true;
  bodyMesh.userData = { componentId: 'rover_body', componentName: 'Heavy MSL Chassis & White Thermal Shell' };
  interactiveParts.push(bodyMesh);
  scaledGroup.add(bodyMesh);

  // Sample Inlet Funnels on Top Deck (SAM & CheMin)
  const funnel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.04, 0.12, 12), mats.weatheredMetalMat);
  funnel1.position.set(0.2, 1.45, -0.1);
  funnel1.userData = { componentId: 'sample_inlets', componentName: 'SAM Analytical Sample Inlet Funnel' };
  interactiveParts.push(funnel1);
  scaledGroup.add(funnel1);

  const funnel2 = funnel1.clone();
  funnel2.position.set(0.45, 1.45, -0.1);
  funnel2.userData = { componentId: 'sample_inlets', componentName: 'CheMin Mineralogy Sample Inlet Funnel' };
  interactiveParts.push(funnel2);
  scaledGroup.add(funnel2);

  // Nuclear MMRTG Generator at the Aft (NO SOLAR PANELS!)
  const rtgGroup = new THREE.Group();
  rtgGroup.position.set(0, 1.15, 1.1);
  const rtgCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.65, 16), mats.rtgDarkMat);
  rtgCylinder.rotation.x = Math.PI / 2;
  rtgCylinder.userData = { componentId: 'rtg_power', componentName: 'Multi-Mission Radioisotope Thermoelectric Generator (MMRTG)' };
  interactiveParts.push(rtgCylinder);
  rtgGroup.add(rtgCylinder);

  // Radiative Cooling Fins
  for (let i = 0; i < 8; i++) {
    const finAngle = (i * Math.PI) / 4;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.65), mats.rtgDarkMat);
    fin.rotation.z = finAngle;
    rtgGroup.add(fin);
  }
  scaledGroup.add(rtgGroup);

  // Tall Remote Sensing Mast (RSM) with ChemCam & Mastcam
  const mastGroup = new THREE.Group();
  mastGroup.position.set(-0.55, 1.4, -0.55);
  const mastPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.65, 10), mats.weatheredMetalMat);
  mastPillar.position.y = 0.82;
  mastPillar.userData = { componentId: 'chemcam_mast', componentName: '2.1m Remote Sensing Mast (RSM)' };
  interactiveParts.push(mastPillar);
  mastGroup.add(mastPillar);

  // ChemCam Cyclops Laser Box Head
  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.32), mats.whiteThermalMat);
  headBox.position.set(0, 1.7, 0);
  headBox.userData = { componentId: 'chemcam_mast', componentName: 'ChemCam Pulsed Laser & Mastcam Head' };
  interactiveParts.push(headBox);
  mastGroup.add(headBox);

  // ChemCam Cyclops Laser Lens (round circular aperture)
  const laserAperture = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16), mats.darkAlloyMat);
  laserAperture.rotation.x = Math.PI / 2;
  laserAperture.position.set(-0.12, 1.7, -0.16);
  laserAperture.userData = { componentId: 'chemcam_mast', componentName: 'ChemCam Laser Aperture Lens' };
  interactiveParts.push(laserAperture);
  mastGroup.add(laserAperture);

  // Mastcam stereo cameras
  const cam1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), mats.darkAlloyMat);
  cam1.rotation.x = Math.PI / 2;
  cam1.position.set(0.12, 1.74, -0.16);
  mastGroup.add(cam1);

  // Beacon Light on Mast (Red/amber tactical pulse for Curiosity)
  const beaconGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ef4444') });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0, 1.88, 0);
  mastGroup.add(beaconMesh);

  const beaconLight = new THREE.PointLight('#ef4444', 0.8, 18, 2);
  beaconLight.position.set(0, 1.88, 0);
  mastGroup.add(beaconLight);
  scaledGroup.add(mastGroup);

  // Hexagonal High Gain Antenna
  const hgaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 6), mats.whiteThermalMat);
  hgaMesh.position.set(0.55, 1.48, 0.35);
  hgaMesh.rotation.x = -Math.PI * 0.3;
  hgaMesh.userData = { componentId: 'high_gain_antenna', componentName: 'Hexagonal High-Gain Antenna (HGA)' };
  interactiveParts.push(hgaMesh);
  scaledGroup.add(hgaMesh);

  // 6 Large Wheels with Chevron Treads (MSL size: 50cm diameter)
  const wheelOffsets = [
    { x: -1.25, z: -0.85, name: 'Curiosity Left Front Wheel' },
    { x: 1.25, z: -0.85, name: 'Curiosity Right Front Wheel' },
    { x: -1.35, z: 0.15, name: 'Curiosity Left Middle Wheel' },
    { x: 1.35, z: 0.15, name: 'Curiosity Right Middle Wheel' },
    { x: -1.25, z: 1.05, name: 'Curiosity Left Rear Wheel' },
    { x: 1.25, z: 1.05, name: 'Curiosity Right Rear Wheel' },
  ];

  wheelOffsets.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, 0.38, pos.z);
    // Large wheel cylinder
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.32, 18), mats.wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.userData = { componentId: 'wheels', componentName: pos.name };
    interactiveParts.push(wheel);
    wheelGroup.add(wheel);

    // Chevron pattern grousers on wheel rim
    for (let c = 0; c < 12; c++) {
      const angle = (c * Math.PI * 2) / 12;
      const chevron = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.04), mats.darkAlloyMat);
      chevron.position.set(0, Math.cos(angle) * 0.35, Math.sin(angle) * 0.35);
      chevron.rotation.x = angle;
      wheelGroup.add(chevron);
    }

    scaledGroup.add(wheelGroup);
  });

  // Heavy Robotic Arm with Drill & Sensor Turret
  const armGroup = new THREE.Group();
  armGroup.position.set(0.35, 0.65, -0.85);

  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), mats.weatheredMetalMat);
  upperArm.rotation.x = Math.PI * 0.45;
  upperArm.position.set(0, -0.25, -0.35);
  upperArm.userData = { componentId: 'robotic_arm', componentName: '2.1m Heavy Robotic Arm' };
  interactiveParts.push(upperArm);
  armGroup.add(upperArm);

  // Heavy cylindrical drill turret
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.32, 14), mats.darkAlloyMat);
  turret.position.set(0.1, -0.55, -0.75);
  turret.rotation.z = Math.PI / 2;
  turret.userData = { componentId: 'robotic_arm', componentName: '30kg Percussion Drill & Science Sensor Turret' };
  interactiveParts.push(turret);
  armGroup.add(turret);

  scaledGroup.add(armGroup);

  // Deep Chevron Tracks in the regolith behind Curiosity
  const trackGeo = new THREE.PlaneGeometry(3.2, 16, 1, 16);
  trackGeo.rotateX(-Math.PI / 2);
  const trackMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#662812'),
    roughness: 0.99,
    transparent: true,
    opacity: 0.7,
  });
  const tracksMesh = new THREE.Mesh(trackGeo, trackMat);
  tracksMesh.position.set(position.x, position.y + 0.02, position.z + 8.5);
  tracksMesh.rotation.y = group.rotation.y;
  extraMeshes.push(tracksMesh);

  // Drill Rock Specimen & Pulverized Rock Powder Ring (Authentic MSL scientific workspace!)
  const drillRockGeo = new THREE.BoxGeometry(1.4, 0.22, 1.2);
  const drillRockMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4a443e'), roughness: 0.88 });
  const drillRock = new THREE.Mesh(drillRockGeo, drillRockMat);
  drillRock.position.set(position.x + 0.6, position.y + 0.1, position.z - 2.2);
  drillRock.userData = { componentId: 'robotic_arm', componentName: 'Drill Science Target Bedrock' };
  interactiveParts.push(drillRock);
  extraMeshes.push(drillRock);

  const powderGeo = new THREE.RingGeometry(0.04, 0.22, 16);
  powderGeo.rotateX(-Math.PI / 2);
  const powderMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9aa0a6'), // Pale grayish basalt powder
    roughness: 0.95,
  });
  const powderMesh = new THREE.Mesh(powderGeo, powderMat);
  powderMesh.position.set(position.x + 0.6, position.y + 0.22, position.z - 2.2);
  powderMesh.userData = { componentId: 'robotic_arm', componentName: 'Pulverized Rock Drill Tailings' };
  interactiveParts.push(powderMesh);
  extraMeshes.push(powderMesh);

  // Highlight handler
  // Turn off unnatural glowing beacons on physical historical rover
  beaconLight.intensity = 0;
  beaconLight.visible = false;
  beaconMesh.visible = false;

  const highlightPart = () => {};

  return {
    id: artifactData.id,
    name: artifactData.name,
    position,
    group,
    beaconLight,
    beaconMesh,
    interactiveParts,
    extraMeshes,
    highlightPart,
    update: () => {
      // Physical realistic rover silhouette in natural Martian sunlight
    },
  };
}

// -----------------------------------------------------------------------------
// 6. SOJOURNER ROVER (MARS PATHFINDER)
// -----------------------------------------------------------------------------
export function createSojournerRover3D(): Artifact3DObject {
  const artifactData = ALL_ARTIFACTS.pathfinder_sojourner;
  const x = artifactData.worldPosition.x;
  const z = artifactData.worldPosition.z;
  const y = getTerrainHeight(x, z);
  const position = new THREE.Vector3(x, y, z);

  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = Math.PI * 0.42;

  const mats = getSharedMaterials();
  const interactiveParts: THREE.Object3D[] = [];
  const extraMeshes: THREE.Object3D[] = [];

  // Chassis: Warm Electronics Box (WEB)
  const bodyGeo = new THREE.BoxGeometry(0.48, 0.18, 0.32);
  const bodyMesh = new THREE.Mesh(bodyGeo, mats.goldMylarMat);
  bodyMesh.position.y = 0.22;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyMesh.userData = { componentId: 'solar_panel_deck', componentName: 'Warm Electronics Box (WEB)' };
  interactiveParts.push(bodyMesh);
  group.add(bodyMesh);

  // Gallium Arsenide Solar Deck
  const solarGeo = new THREE.BoxGeometry(0.55, 0.02, 0.36);
  const solarMesh = new THREE.Mesh(solarGeo, mats.solarCellMat);
  solarMesh.position.set(0, 0.32, 0);
  solarMesh.castShadow = true;
  solarMesh.userData = { componentId: 'solar_panel_deck', componentName: '0.22 m² GaAs Solar Deck' };
  interactiveParts.push(solarMesh);
  group.add(solarMesh);

  // Rocker-Bogie 6-Wheel Mobility System
  const wheelRadius = 0.065;
  const wheelWidth = 0.05;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 14);
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    { x: -0.27, z: -0.20, name: 'Left Front Wheel' },
    { x: 0.27, z: -0.20, name: 'Right Front Wheel' },
    { x: -0.29, z: 0.02, name: 'Left Middle Wheel' },
    { x: 0.29, z: 0.02, name: 'Right Middle Wheel' },
    { x: -0.27, z: 0.22, name: 'Left Rear Wheel' },
    { x: 0.27, z: 0.22, name: 'Right Rear Wheel' },
  ];

  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeo, mats.wheelMat);
    wheel.position.set(pos.x, wheelRadius, pos.z);
    wheel.castShadow = true;
    wheel.userData = { componentId: 'rocker_bogie_chassis', componentName: pos.name };
    interactiveParts.push(wheel);
    group.add(wheel);

    // Cleat tread detail ring
    const cleatRing = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius, 0.006, 6, 12), mats.darkAlloyMat);
    cleatRing.position.set(pos.x + (pos.x > 0 ? 0.02 : -0.02), wheelRadius, pos.z);
    cleatRing.rotation.y = Math.PI / 2;
    group.add(cleatRing);
  });

  // Articulated Rocker-Bogie Titanium Side Struts
  [-1, 1].forEach((side) => {
    const rockerBar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.38), mats.weatheredMetalMat);
    rockerBar.position.set(side * 0.24, 0.14, 0.01);
    rockerBar.userData = { componentId: 'rocker_bogie_chassis', componentName: 'Rocker Linkage' };
    interactiveParts.push(rockerBar);
    group.add(rockerBar);

    const bogieBar = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.22), mats.weatheredMetalMat);
    bogieBar.position.set(side * 0.26, 0.10, 0.11);
    bogieBar.userData = { componentId: 'rocker_bogie_chassis', componentName: 'Bogie Linkage' };
    interactiveParts.push(bogieBar);
    group.add(bogieBar);
  });

  // Forward Hazard Cameras (Stereo Hazcams)
  [-0.08, 0.08].forEach((xOff) => {
    const hazcam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), mats.darkAlloyMat);
    hazcam.position.set(xOff, 0.22, -0.17);
    hazcam.rotation.x = Math.PI / 2;
    group.add(hazcam);
  });

  // Rear APXS (Alpha Proton X-Ray Spectrometer) Sensor Head & Arm
  const apxsArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), mats.weatheredMetalMat);
  apxsArm.position.set(0.08, 0.12, 0.24);
  apxsArm.rotation.x = Math.PI * 0.3;
  apxsArm.userData = { componentId: 'apxs_spectrometer', componentName: 'APXS Deployment Arm' };
  interactiveParts.push(apxsArm);
  group.add(apxsArm);

  const apxsSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.06, 12), mats.goldMylarMat);
  apxsSensor.position.set(0.08, 0.06, 0.32);
  apxsSensor.rotation.x = Math.PI * 0.25;
  apxsSensor.castShadow = true;
  apxsSensor.userData = { componentId: 'apxs_spectrometer', componentName: 'APXS Curium-244 Sensor Head' };
  interactiveParts.push(apxsSensor);
  group.add(apxsSensor);

  // Top UHF Whip Antenna
  const whipGeo = new THREE.CylinderGeometry(0.004, 0.006, 0.36, 6);
  const whipMesh = new THREE.Mesh(whipGeo, mats.weatheredMetalMat);
  whipMesh.position.set(0.18, 0.50, 0.12);
  whipMesh.userData = { componentId: 'modem_antenna', componentName: 'UHF Radio Modem Whip Antenna' };
  interactiveParts.push(whipMesh);
  group.add(whipMesh);

  // Beacon placeholder (dormant historical hardware)
  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: '#f59e0b' }));
  beaconMesh.visible = false;
  group.add(beaconMesh);
  const beaconLight = new THREE.PointLight('#f59e0b', 0, 10);
  beaconLight.visible = false;
  group.add(beaconLight);

  // Historical Ares Vallis Environment: "Yogi" Boulder and "Barnacle Bill" Rock
  const yogiGeo = new THREE.DodecahedronGeometry(0.65, 1);
  const yogiMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#5a3224'), roughness: 0.9 });
  const yogiRock = new THREE.Mesh(yogiGeo, yogiMat);
  yogiRock.position.set(position.x + 0.95, position.y + 0.25, position.z - 0.75);
  yogiRock.scale.set(1.3, 0.9, 1.1);
  yogiRock.castShadow = true;
  extraMeshes.push(yogiRock);

  const billGeo = new THREE.DodecahedronGeometry(0.42, 1);
  const billMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4c281b'), roughness: 0.95 });
  const billRock = new THREE.Mesh(billGeo, billMat);
  billRock.position.set(position.x - 0.75, position.y + 0.15, position.z + 0.65);
  billRock.scale.set(1.0, 0.7, 0.9);
  billRock.castShadow = true;
  extraMeshes.push(billRock);

  // Subtle rover wheel track impressions in regolith
  const trackGeo = new THREE.PlaneGeometry(0.65, 4.5, 1, 8);
  trackGeo.rotateX(-Math.PI / 2);
  const trackMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#783419'),
    roughness: 0.99,
    transparent: true,
    opacity: 0.55,
  });
  const tracksMesh = new THREE.Mesh(trackGeo, trackMat);
  tracksMesh.position.set(position.x - 0.2, position.y + 0.02, position.z - 2.4);
  tracksMesh.rotation.y = group.rotation.y;
  extraMeshes.push(tracksMesh);

  const highlightPart = () => {};

  return {
    id: artifactData.id,
    name: artifactData.name,
    position,
    group,
    beaconLight,
    beaconMesh,
    interactiveParts,
    extraMeshes,
    highlightPart,
    update: () => {},
  };
}

// -----------------------------------------------------------------------------
// 7. INGENUITY MARS HELICOPTER (MARS 2020)
// -----------------------------------------------------------------------------
export function createIngenuityHelicopter3D(): Artifact3DObject {
  const artifactData = ALL_ARTIFACTS.ingenuity_helicopter;
  const x = artifactData.worldPosition.x;
  const z = artifactData.worldPosition.z;
  const y = getTerrainHeight(x, z);
  const position = new THREE.Vector3(x, y, z);

  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = Math.PI * 0.15;

  const mats = getSharedMaterials();
  const interactiveParts: THREE.Object3D[] = [];
  const extraMeshes: THREE.Object3D[] = [];

  // Fuselage: Central Avionics Core
  const fuselageGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const fuselageMesh = new THREE.Mesh(fuselageGeo, mats.goldMylarMat);
  fuselageMesh.position.set(0, 0.24, 0);
  fuselageMesh.castShadow = true;
  fuselageMesh.receiveShadow = true;
  fuselageMesh.userData = { componentId: 'avionics_cube', componentName: 'Fuselage Electronics Cube' };
  interactiveParts.push(fuselageMesh);
  group.add(fuselageMesh);

  // Downward Visual Odometry Camera and Altimeter
  const navCamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 8), mats.darkAlloyMat);
  navCamMesh.position.set(0, 0.15, 0);
  group.add(navCamMesh);

  // Central Vertical Rotor Mast
  const mastGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.52, 10);
  const mastMesh = new THREE.Mesh(mastGeo, mats.darkAlloyMat);
  mastMesh.position.set(0, 0.38, 0);
  mastMesh.castShadow = true;
  group.add(mastMesh);

  // Lower Rotor Hub and Blades (Counter-Clockwise)
  const lowerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.035, 12), mats.weatheredMetalMat);
  lowerHub.position.set(0, 0.38, 0);
  lowerHub.userData = { componentId: 'coaxial_rotors', componentName: 'Lower Rotor Hub' };
  interactiveParts.push(lowerHub);
  group.add(lowerHub);

  const bladeGeo = new THREE.BoxGeometry(1.15, 0.008, 0.065);
  const lowerBlades = new THREE.Mesh(bladeGeo, mats.darkAlloyMat);
  lowerBlades.position.set(0, 0.38, 0);
  lowerBlades.castShadow = true;
  lowerBlades.userData = { componentId: 'coaxial_rotors', componentName: 'Lower 1.2m Carbon-Fiber Blades' };
  interactiveParts.push(lowerBlades);
  group.add(lowerBlades);

  // Upper Rotor Hub and Blades (Clockwise, 85° offset)
  const upperHub = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.035, 12), mats.weatheredMetalMat);
  upperHub.position.set(0, 0.48, 0);
  upperHub.userData = { componentId: 'coaxial_rotors', componentName: 'Upper Rotor Hub' };
  interactiveParts.push(upperHub);
  group.add(upperHub);

  const upperBlades = new THREE.Mesh(bladeGeo.clone(), mats.darkAlloyMat);
  upperBlades.position.set(0, 0.48, 0);
  upperBlades.rotation.y = Math.PI * 0.48;
  upperBlades.castShadow = true;
  upperBlades.userData = { componentId: 'coaxial_rotors', componentName: 'Upper 1.2m Counter-Rotating Blades' };
  interactiveParts.push(upperBlades);
  group.add(upperBlades);

  // Historic Flight 72 outer blade tip fracture mark detail
  const tipFracture = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.068), mats.weatheredMetalMat);
  tipFracture.position.set(0.56, 0.48, 0);
  tipFracture.rotation.y = upperBlades.rotation.y;
  group.add(tipFracture);

  // Top Solar Array & UHF Monopole Antenna
  const solarGeo = new THREE.BoxGeometry(0.24, 0.012, 0.14);
  const solarMesh = new THREE.Mesh(solarGeo, mats.solarCellMat);
  solarMesh.position.set(0, 0.58, 0);
  solarMesh.castShadow = true;
  solarMesh.userData = { componentId: 'solar_panel_top', componentName: 'Zenith Solar Array' };
  interactiveParts.push(solarMesh);
  group.add(solarMesh);

  // UHF Monopole Antenna
  const antennaGeo = new THREE.CylinderGeometry(0.003, 0.004, 0.22, 6);
  const antennaMesh = new THREE.Mesh(antennaGeo, mats.weatheredMetalMat);
  antennaMesh.position.set(0.06, 0.69, 0);
  antennaMesh.userData = { componentId: 'solar_panel_top', componentName: '914 MHz UHF Monopole Antenna' };
  interactiveParts.push(antennaMesh);
  group.add(antennaMesh);

  // Four Articulated Carbon-Composite Landing Legs
  const legCorners = [
    { x: -0.07, z: -0.07, angle: Math.PI * 1.25 },
    { x: 0.07, z: -0.07, angle: Math.PI * 1.75 },
    { x: -0.07, z: 0.07, angle: Math.PI * 0.75 },
    { x: 0.07, z: 0.07, angle: Math.PI * 0.25 },
  ];

  legCorners.forEach((corner, idx) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(corner.x, 0.18, corner.z);
    legGroup.rotation.y = corner.angle;

    // Strut angled downward ~40°
    const strutGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.32, 6);
    const strutMesh = new THREE.Mesh(strutGeo, mats.darkAlloyMat);
    strutMesh.position.set(0, -0.10, 0.10);
    strutMesh.rotation.x = Math.PI * 0.22;
    strutMesh.castShadow = true;
    strutMesh.userData = { componentId: 'carbon_landing_legs', componentName: `Landing Leg #${idx + 1}` };
    interactiveParts.push(strutMesh);
    legGroup.add(strutMesh);

    // Footpad resting on surface
    const padGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.008, 8);
    const padMesh = new THREE.Mesh(padGeo, mats.weatheredMetalMat);
    padMesh.position.set(0, -0.21, 0.19);
    padMesh.userData = { componentId: 'carbon_landing_legs', componentName: `Footpad #${idx + 1}` };
    interactiveParts.push(padMesh);
    legGroup.add(padMesh);

    group.add(legGroup);
  });

  // Beacon placeholder (dormant historical hardware)
  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: '#f59e0b' }));
  beaconMesh.visible = false;
  group.add(beaconMesh);
  const beaconLight = new THREE.PointLight('#f59e0b', 0, 10);
  beaconLight.visible = false;
  group.add(beaconLight);

  // Airfield Chi / Valinor Hills environment: subtle sand ripples
  const rippleGeo = new THREE.PlaneGeometry(3.5, 3.5, 1, 6);
  rippleGeo.rotateX(-Math.PI / 2);
  const rippleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#944222'),
    roughness: 0.98,
    transparent: true,
    opacity: 0.45,
  });
  const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
  rippleMesh.position.set(position.x, position.y + 0.01, position.z);
  extraMeshes.push(rippleMesh);

  const highlightPart = () => {};

  return {
    id: artifactData.id,
    name: artifactData.name,
    position,
    group,
    beaconLight,
    beaconMesh,
    interactiveParts,
    extraMeshes,
    highlightPart,
    update: () => {},
  };
}

// -----------------------------------------------------------------------------
// Unified Artifacts Manager
// -----------------------------------------------------------------------------
export interface MarsArtifactsManager {
  artifacts: Artifact3DObject[];
  getArtifactById: (id: string) => Artifact3DObject | undefined;
  getNearestArtifact: (playerPos: THREE.Vector3) => { artifact: Artifact3DObject; distance: number };
  highlightPartAcrossArtifacts: (artifactId: string | null, partId: string | null) => void;
  update: (time: number) => void;
}

export function createMarsArtifactsManager(scene: THREE.Scene): MarsArtifactsManager {
  const artifacts: Artifact3DObject[] = [
    createSpiritRover3D(),
    createOpportunityRover3D(),
    createPhoenixLander3D(),
    createInSightLander3D(),
    createCuriosityRover3D(),
    createSojournerRover3D(),
    createIngenuityHelicopter3D(),
  ];

  artifacts.forEach((art) => {
    scene.add(art.group);
    art.extraMeshes.forEach((mesh) => scene.add(mesh));
  });

  const getArtifactById = (id: string) => artifacts.find((a) => a.id === id);

  const getNearestArtifact = (playerPos: THREE.Vector3) => {
    let nearest = artifacts[0];
    let minDistance = playerPos.distanceTo(nearest.position);
    for (let i = 1; i < artifacts.length; i++) {
      const dist = playerPos.distanceTo(artifacts[i].position);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = artifacts[i];
      }
    }
    return { artifact: nearest, distance: minDistance };
  };

  const highlightPartAcrossArtifacts = (artifactId: string | null, partId: string | null) => {
    artifacts.forEach((art) => {
      if (artifactId && art.id === artifactId) {
        art.highlightPart(partId);
      } else if (!artifactId && partId) {
        // Highlight on any artifact matching the component
        art.highlightPart(partId);
      } else {
        art.highlightPart(null);
      }
    });
  };

  const update = (time: number) => {
    artifacts.forEach((art) => art.update(time));
  };

  return {
    artifacts,
    getArtifactById,
    getNearestArtifact,
    highlightPartAcrossArtifacts,
    update,
  };
}
