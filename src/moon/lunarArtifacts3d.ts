import * as THREE from 'three';
import { getLunarTerrainHeight } from './moonTerrain';
import { ALL_LUNAR_ARTIFACTS } from '../data/lunarArtifacts';
import { Artifact3DObject } from '../mars/artifacts3d';

/**
 * High-visibility, scientifically authentic 3D procedural models ("Game Representation") for verified historical NASA Lunar Relics:
 * 1. Apollo 11 LM Descent Stage (Eagle) & EASEP - Mare Tranquillitatis
 * 2. Surveyor 3 Soft Lander - Oceanus Procellarum
 * 3. Apollo 15 Lunar Roving Vehicle (LRV-1) - Hadley Rille
 * 4. Apollo 17 LM Descent Stage (Challenger) & LRV-3 - Taurus-Littrow
 * 5. Surveyor 1 Lander - Flamsteed Ring
 * 6. Apollo 14 Modular Equipment Transporter (MET) & ALSEP - Fra Mauro
 * 7. Laser Ranging Retroreflector Array (LRRR) - Mare Tranquillitatis
 * 8. Apollo 12 ALSEP Scientific Station (SNAP-27 RTG, Central Station, LSM, PSE) - Oceanus Procellarum
 * 9. Apollo 12 LM Descent Stage (Intrepid) w/ Erectable S-Band Umbrella - Oceanus Procellarum
 * 10. Apollo 16 Lunar Roving Vehicle (LRV-2) w/ Portable Magnetometer - Descartes Highlands
 * 11. Surveyor 7 Soft Lander w/ Alpha-Scattering Analyzer & Scoop - Tycho Highlands
 */

export interface LunarArtifactsManager {
  artifacts: Artifact3DObject[];
  getArtifactById: (id: string) => Artifact3DObject | undefined;
  getNearestArtifact: (playerPos: THREE.Vector3) => { artifact: Artifact3DObject; distance: number };
  highlightPartAcrossArtifacts: (artifactId: string | null, partId: string | null) => void;
  update: (time: number) => void;
}

// -----------------------------------------------------------------------------
// Shared Material Palette for Authentic Apollo Lunar Hardware
// High-visibility materials that remain clear and recognizable even in space vacuum shadows
// -----------------------------------------------------------------------------
function getSharedLunarMaterials() {
  const goldKaptonMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#eab308'), // Bright radiant Kapton gold thermal foil
    metalness: 0.85,
    roughness: 0.28,
    emissive: new THREE.Color('#382800'),
    emissiveIntensity: 0.25, // Preserves warm golden visibility in shadow
  });

  const aluminumAlloyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#cbd5e1'), // Anodized aluminum alloy 6061-T6
    metalness: 0.75,
    roughness: 0.35,
    emissive: new THREE.Color('#1e293b'),
    emissiveIntensity: 0.18,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2e3440'), // Titanium/Inconel engine nozzle alloy
    metalness: 0.8,
    roughness: 0.45,
    emissive: new THREE.Color('#0f172a'),
    emissiveIntensity: 0.15,
  });

  const blackPyromarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e2026'), // High-emissivity black Pyromark thermal coating
    roughness: 0.82,
    metalness: 0.2,
    emissive: new THREE.Color('#0a0c10'),
    emissiveIntensity: 0.1,
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e3a8a'), // Deep cobalt silicon photovoltaic cells
    metalness: 0.7,
    roughness: 0.18,
    emissive: new THREE.Color('#082f49'),
    emissiveIntensity: 0.3,
  });

  const whiteThermalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f8fafc'), // White thermal paint & Teflon tape
    metalness: 0.2,
    roughness: 0.5,
    emissive: new THREE.Color('#334155'),
    emissiveIntensity: 0.18,
  });

  // Solid, highly visible metallic woven mesh wheels (NOT invisible wireframe)
  const wheelTreadMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#94a3b8'), // Metallic zinc-coated woven steel mesh
    metalness: 0.85,
    roughness: 0.4,
    emissive: new THREE.Color('#1e293b'),
    emissiveIntensity: 0.2,
  });

  const retroreflectorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#38bdf8'), // Fused-silica corner-cube prisms
    metalness: 0.95,
    roughness: 0.05,
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.65, // Brilliant crystalline reflection
  });

  const orangeSoilMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ea580c'), // Apollo 17 orange volcanic glass beads
    roughness: 0.95,
    metalness: 0.05,
    emissive: new THREE.Color('#7c2d12'),
    emissiveIntensity: 0.25,
  });

  const ductTapeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#64748b'), // Grey utility duct tape (LRV-3 fender repair)
    roughness: 0.8,
    metalness: 0.15,
  });

  const groundCollarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#22252a'), // Compacted regolith anchor collar
    roughness: 0.96,
    metalness: 0.02,
  });

  return {
    goldKaptonMat,
    aluminumAlloyMat,
    darkAlloyMat,
    blackPyromarkMat,
    solarCellMat,
    whiteThermalMat,
    wheelTreadMat,
    retroreflectorMat,
    orangeSoilMat,
    ductTapeMat,
    groundCollarMat,
  };
}

// -----------------------------------------------------------------------------
// 1. APOLLO 11 EAGLE DESCENT STAGE & EASEP
// -----------------------------------------------------------------------------
function createApollo11Eagle3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.apollo11_eagle;
  const group = new THREE.Group();
  group.name = 'apollo11_eagle_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  // Elevate slightly (+0.25m) so struts and footpads never sink into terrain slopes
  group.position.set(worldPos.x, groundY + 0.25, worldPos.z);

  // Subtle regolith footing collar
  const collarGeo = new THREE.CylinderGeometry(4.8, 5.2, 0.3, 16);
  const collar = new THREE.Mesh(collarGeo, mats.groundCollarMat);
  collar.position.y = -0.12;
  collar.receiveShadow = true;
  group.add(collar);

  // Main Octagonal Descent Stage Hull (4.2m width, 1.85m height)
  const hullGeo = new THREE.CylinderGeometry(2.55, 2.85, 1.85, 8);
  const hull = new THREE.Mesh(hullGeo, mats.goldKaptonMat);
  hull.position.y = 1.7;
  hull.castShadow = true;
  group.add(hull);

  // 4 Cylindrical Propellant Fuel & Oxidizer Tank Bays
  [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach((angle) => {
    const tankGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.65, 14);
    const tank = new THREE.Mesh(tankGeo, mats.blackPyromarkMat);
    tank.position.set(Math.cos(angle) * 1.85, 1.7, Math.sin(angle) * 1.85);
    tank.castShadow = true;
    group.add(tank);
  });

  // Gimbaled Descent Engine (DPS) Bell with Columbium Nozzle Extension
  const bellGeo = new THREE.ConeGeometry(0.95, 1.35, 18, 1, true);
  const bell = new THREE.Mesh(bellGeo, mats.darkAlloyMat);
  bell.position.y = 0.75;
  bell.rotation.x = Math.PI;
  bell.castShadow = true;
  group.add(bell);

  // 4 Cantilever Landing Gear Legs with Dish Footpads & Probes
  const legAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  legAngles.forEach((angle) => {
    const leg = new THREE.Group();
    leg.rotation.y = angle;

    // Primary tubular compression strut
    const strutGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8);
    const strut = new THREE.Mesh(strutGeo, mats.aluminumAlloyMat);
    strut.position.set(0, 1.05, 2.5);
    strut.rotation.x = -0.68;
    strut.castShadow = true;
    leg.add(strut);

    // 37-inch diameter dish footpad
    const padGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 14);
    const pad = new THREE.Mesh(padGeo, mats.goldKaptonMat);
    pad.position.set(0, 0.06, 3.65);
    pad.castShadow = true;
    leg.add(pad);

    // Surface contact sensing probe
    const probeGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6);
    const probe = new THREE.Mesh(probeGeo, mats.aluminumAlloyMat);
    probe.position.set(0.18, 0.04, 3.8);
    probe.rotation.z = Math.PI / 2 - 0.15;
    leg.add(probe);

    group.add(leg);
  });

  // Forward Strut (+Z) Astronaut Ladder with Stainless Steel Commemorative Plaque
  const ladderGroup = new THREE.Group();
  ladderGroup.position.set(0, 1.45, 2.9);
  ladderGroup.rotation.x = -0.32;

  const ladderGeo = new THREE.BoxGeometry(0.52, 2.2, 0.06);
  const ladder = new THREE.Mesh(ladderGeo, mats.aluminumAlloyMat);
  ladder.castShadow = true;
  ladderGroup.add(ladder);

  // Stainless Steel Commemorative Plaque
  const plaqueGeo = new THREE.PlaneGeometry(0.42, 0.25);
  const plaqueMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.95,
    roughness: 0.1,
  });
  const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaque.position.set(0, -0.25, 0.04);
  ladderGroup.add(plaque);
  group.add(ladderGroup);

  // MESA Equipment Pallet on left forward quadrant
  const mesaGeo = new THREE.BoxGeometry(0.9, 0.5, 0.7);
  const mesa = new THREE.Mesh(mesaGeo, mats.whiteThermalMat);
  mesa.position.set(-1.6, 1.2, 1.4);
  mesa.rotation.y = 0.4;
  group.add(mesa);

  // EASEP Seismic Package deployed 15 meters to the south (terrain-grounded)
  const easepGroup = new THREE.Group();
  const easepLocalY = getLunarTerrainHeight(worldPos.x + 3.5, worldPos.z + 15) - (groundY + 0.25);
  easepGroup.position.set(3.5, easepLocalY + 0.05, 15);

  const easepBoxGeo = new THREE.BoxGeometry(1.2, 0.45, 0.85);
  const easepBox = new THREE.Mesh(easepBoxGeo, mats.whiteThermalMat);
  easepBox.position.y = 0.25;
  easepBox.castShadow = true;
  easepGroup.add(easepBox);

  // Dual EASEP Silicon Photovoltaic Wings
  const wingGeo = new THREE.BoxGeometry(1.5, 0.05, 0.65);
  const wing1 = new THREE.Mesh(wingGeo, mats.solarCellMat);
  wing1.position.set(1.4, 0.32, 0);
  easepGroup.add(wing1);
  const wing2 = new THREE.Mesh(wingGeo, mats.solarCellMat);
  wing2.position.set(-1.4, 0.32, 0);
  easepGroup.add(wing2);
  group.add(easepGroup);

  // Planted Apollo 11 US Lunar Flag on telescoping staff (8.5 meters east, terrain-grounded)
  const flagGroup = new THREE.Group();
  const flagLocalY = getLunarTerrainHeight(worldPos.x + 8.5, worldPos.z + 4.0) - (groundY + 0.25);
  flagGroup.position.set(8.5, flagLocalY + 0.05, 4.0);

  const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8);
  const pole = new THREE.Mesh(poleGeo, mats.aluminumAlloyMat);
  pole.position.y = 1.3;
  pole.castShadow = true;
  flagGroup.add(pole);

  const horizBarGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.25, 8);
  horizBarGeo.rotateZ(Math.PI / 2);
  const horizBar = new THREE.Mesh(horizBarGeo, mats.aluminumAlloyMat);
  horizBar.position.set(0.62, 2.55, 0);
  flagGroup.add(horizBar);

  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 128;
  flagCanvas.height = 80;
  const fctx = flagCanvas.getContext('2d');
  if (fctx) {
    fctx.fillStyle = '#dc2626';
    fctx.fillRect(0, 0, 128, 80);
    fctx.fillStyle = '#ffffff';
    for (let s = 1; s < 13; s += 2) {
      fctx.fillRect(0, (s * 80) / 13, 128, 80 / 13);
    }
    fctx.fillStyle = '#1e3a8a';
    fctx.fillRect(0, 0, 52, 43);
  }
  const flagTex = new THREE.CanvasTexture(flagCanvas);
  const flagGeo = new THREE.PlaneGeometry(1.2, 0.75);
  const flagMat = new THREE.MeshStandardMaterial({
    map: flagTex,
    side: THREE.DoubleSide,
    roughness: 0.6,
  });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(0.62, 2.15, 0);
  flag.castShadow = true;
  flagGroup.add(flag);
  group.add(flagGroup);

  // High-Visibility Transponder Mast & Cyan Beacon
  const beaconMastGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8);
  const beaconMast = new THREE.Mesh(beaconMastGeo, mats.aluminumAlloyMat);
  beaconMast.position.set(0, 3.4, 0);
  group.add(beaconMast);

  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 4.3, 0);
  group.add(beaconLight);

  const beaconGeo = new THREE.SphereGeometry(0.24, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [hull, ladder, easepBox],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.6 + Math.sin(t * 3.2) * 0.9;
    },
  };
}

// -----------------------------------------------------------------------------
// 2. SURVEYOR 3 SOFT LANDER
// -----------------------------------------------------------------------------
function createSurveyor3_3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.surveyor3_lander;
  const group = new THREE.Group();
  group.name = 'surveyor3_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.22, worldPos.z);

  // Triangular space frame (Aluminum alloy 7075-T6)
  const frameGeo = new THREE.CylinderGeometry(0.7, 1.4, 1.35, 3);
  const frame = new THREE.Mesh(frameGeo, mats.whiteThermalMat);
  frame.position.y = 1.25;
  frame.castShadow = true;
  group.add(frame);

  // 3 Tripod landing legs with crushable footpads
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const leg = new THREE.Group();
    leg.rotation.y = angle;

    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8);
    const strut = new THREE.Mesh(strutGeo, mats.aluminumAlloyMat);
    strut.position.set(0, 0.72, 1.7);
    strut.rotation.x = -0.56;
    strut.castShadow = true;
    leg.add(strut);

    const footpadGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12);
    const footpad = new THREE.Mesh(footpadGeo, mats.aluminumAlloyMat);
    footpad.position.set(0, 0.05, 2.5);
    footpad.castShadow = true;
    leg.add(footpad);

    group.add(leg);
  }

  // Central mast with Planar Solar Panel
  const mastGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.1, 8);
  const mast = new THREE.Mesh(mastGeo, mats.aluminumAlloyMat);
  mast.position.y = 2.4;
  mast.castShadow = true;
  group.add(mast);

  const solarPanelGeo = new THREE.BoxGeometry(1.05, 0.05, 1.35);
  const solarPanel = new THREE.Mesh(solarPanelGeo, mats.solarCellMat);
  solarPanel.position.set(0, 3.35, 0);
  solarPanel.rotation.x = -0.42;
  solarPanel.castShadow = true;
  group.add(solarPanel);

  // High-Gain Planar Array Antenna
  const hgaGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.06, 16);
  const hga = new THREE.Mesh(hgaGeo, mats.whiteThermalMat);
  hga.position.set(0.5, 3.0, 0);
  hga.rotation.z = 0.5;
  group.add(hga);

  // Surveyor Television Camera & Mirror Turret Assembly
  const cameraTurretGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.42, 12);
  const cameraTurret = new THREE.Mesh(cameraTurretGeo, mats.whiteThermalMat);
  cameraTurret.position.set(-0.52, 1.65, 0.38);
  group.add(cameraTurret);

  // Articulated robotic surface sampler scoop arm extending into soil trench
  const scoopArm = new THREE.Group();
  scoopArm.position.set(0.7, 0.9, 0.8);

  const armTubeGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.5, 8);
  const armTube = new THREE.Mesh(armTubeGeo, mats.aluminumAlloyMat);
  armTube.position.set(0, -0.35, 0.6);
  armTube.rotation.x = 0.82;
  armTube.castShadow = true;
  scoopArm.add(armTube);

  const scoopBucketGeo = new THREE.BoxGeometry(0.2, 0.15, 0.26);
  const scoopBucket = new THREE.Mesh(scoopBucketGeo, mats.darkAlloyMat);
  scoopBucket.position.set(0, -0.82, 1.15);
  scoopBucket.castShadow = true;
  scoopArm.add(scoopBucket);
  group.add(scoopArm);

  // Soil trench beneath scoop bucket
  const trenchGeo = new THREE.PlaneGeometry(0.4, 0.9);
  trenchGeo.rotateX(-Math.PI / 2);
  const trenchMat = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    roughness: 0.98,
  });
  const trench = new THREE.Mesh(trenchGeo, trenchMat);
  trench.position.set(0.7, 0.02, 1.95);
  trench.receiveShadow = true;
  group.add(trench);

  // Transponder Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 3.8, 0);
  group.add(beaconLight);

  const beaconGeo = new THREE.SphereGeometry(0.22, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [frame, solarPanel, scoopBucket, cameraTurret],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 3.2) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// 3. APOLLO 15 LUNAR ROVING VEHICLE (LRV-1)
// -----------------------------------------------------------------------------
function createApollo15LRV_3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.apollo15_lrv;
  const group = new THREE.Group();
  group.name = 'apollo15_lrv_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.22, worldPos.z);

  // Open Aluminum Tubular Chassis (3.1m length, 1.8m width)
  const chassisGeo = new THREE.BoxGeometry(1.7, 0.18, 3.0);
  const chassis = new THREE.Mesh(chassisGeo, mats.whiteThermalMat);
  chassis.position.y = 0.62;
  chassis.castShadow = true;
  group.add(chassis);

  // 4 Solid, Visible Woven Wire-Mesh Wheels with Titanium Chevron Cleats & Fiberglass Fenders
  const wheelOffsets = [
    { x: -0.95, z: 0.98 },
    { x: 0.95, z: 0.98 },
    { x: -0.95, z: -0.98 },
    { x: 0.95, z: -0.98 },
  ];

  wheelOffsets.forEach((wo) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wo.x, 0.44, wo.z);

    // Visible solid cylindrical metallic wheel drum
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.26, 18);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheel = new THREE.Mesh(wheelGeo, mats.wheelTreadMat);
    wheel.castShadow = true;
    wheelGroup.add(wheel);

    // Inner aluminum wheel hub
    const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 14);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, mats.aluminumAlloyMat);
    wheelGroup.add(hub);

    // Fiberglass Fender Mudguard
    const fenderGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.28, 12, 1, false, 0, Math.PI);
    fenderGeo.rotateZ(Math.PI / 2);
    const fender = new THREE.Mesh(fenderGeo, mats.whiteThermalMat);
    fender.position.y = 0.05;
    wheelGroup.add(fender);

    group.add(wheelGroup);
  });

  // Twin Astronaut Folded Mesh Seats
  const seatGeo = new THREE.BoxGeometry(0.58, 0.52, 0.55);
  const seat1 = new THREE.Mesh(seatGeo, mats.whiteThermalMat);
  seat1.position.set(-0.38, 0.92, 0.15);
  seat1.castShadow = true;
  group.add(seat1);

  const seat2 = new THREE.Mesh(seatGeo, mats.whiteThermalMat);
  seat2.position.set(0.38, 0.92, 0.15);
  seat2.castShadow = true;
  group.add(seat2);

  // Center T-Bar Control Joystick
  const joystickGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
  const joystick = new THREE.Mesh(joystickGeo, mats.darkAlloyMat);
  joystick.position.set(0, 1.0, 0.5);
  joystick.rotation.x = -0.32;
  group.add(joystick);

  // 1.8-Meter High-Gain Parabolic Umbrella Antenna Dish (Aimed at Earth in the sky!)
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(0.5, 1.3, 1.2);

  const hgaMastGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.3, 8);
  const hgaMast = new THREE.Mesh(hgaMastGeo, mats.aluminumAlloyMat);
  hgaMast.position.y = 0.65;
  hgaGroup.add(hgaMast);

  const dishGeo = new THREE.CylinderGeometry(0.7, 0.08, 0.24, 18, 1, true);
  const dish = new THREE.Mesh(dishGeo, mats.aluminumAlloyMat);
  dish.position.set(0, 1.25, 0);
  dish.rotation.set(-0.65, -0.45, 0);
  dish.castShadow = true;
  hgaGroup.add(dish);
  group.add(hgaGroup);

  // RCA Ground-Controlled Color TV Camera on forward chassis
  const tvCamGeo = new THREE.BoxGeometry(0.26, 0.3, 0.4);
  const tvCam = new THREE.Mesh(tvCamGeo, mats.whiteThermalMat);
  tvCam.position.set(-0.55, 1.1, 1.25);
  tvCam.castShadow = true;
  group.add(tvCam);

  // Aft Scientific Tool Carrier Rack
  const rackGeo = new THREE.BoxGeometry(1.45, 0.48, 0.7);
  const rack = new THREE.Mesh(rackGeo, mats.aluminumAlloyMat);
  rack.position.set(0, 0.92, -1.2);
  rack.castShadow = true;
  group.add(rack);

  // Transponder Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 2.9, 0);
  group.add(beaconLight);

  const beaconGeo = new THREE.SphereGeometry(0.22, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [chassis, seat1, dish, tvCam, rack],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 3.1) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// 4. APOLLO 17 CHALLENGER DESCENT STAGE & LRV-3
// -----------------------------------------------------------------------------
function createApollo17Challenger3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.apollo17_challenger;
  const group = new THREE.Group();
  group.name = 'apollo17_challenger_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.25, worldPos.z);

  // Footing collar
  const collarGeo = new THREE.CylinderGeometry(4.8, 5.2, 0.3, 16);
  const collar = new THREE.Mesh(collarGeo, mats.groundCollarMat);
  collar.position.y = -0.12;
  collar.receiveShadow = true;
  group.add(collar);

  // Challenger LM-12 Descent Stage Hull
  const hullGeo = new THREE.CylinderGeometry(2.55, 2.85, 1.85, 8);
  const hull = new THREE.Mesh(hullGeo, mats.goldKaptonMat);
  hull.position.y = 1.7;
  hull.castShadow = true;
  group.add(hull);

  // Engine Bell
  const bellGeo = new THREE.ConeGeometry(0.95, 1.35, 18, 1, true);
  const bell = new THREE.Mesh(bellGeo, mats.darkAlloyMat);
  bell.position.y = 0.75;
  bell.rotation.x = Math.PI;
  group.add(bell);

  // 4 Outrigger Legs
  [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach((angle) => {
    const leg = new THREE.Group();
    leg.rotation.y = angle;

    const strutGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8);
    const strut = new THREE.Mesh(strutGeo, mats.aluminumAlloyMat);
    strut.position.set(0, 1.05, 2.5);
    strut.rotation.x = -0.68;
    strut.castShadow = true;
    leg.add(strut);

    const padGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 14);
    const pad = new THREE.Mesh(padGeo, mats.goldKaptonMat);
    pad.position.set(0, 0.06, 3.65);
    pad.castShadow = true;
    leg.add(pad);

    group.add(leg);
  });

  // Shorty Crater Orange Soil Deposit (Discovered by Harrison Schmitt, terrain-grounded)
  const soilPatchGeo = new THREE.CircleGeometry(4.4, 18);
  soilPatchGeo.rotateX(-Math.PI / 2);
  const soilPatch = new THREE.Mesh(soilPatchGeo, mats.orangeSoilMat);
  const soilLocalY = getLunarTerrainHeight(worldPos.x + 9.0, worldPos.z + 6.0) - (groundY + 0.25);
  soilPatch.position.set(9.0, soilLocalY + 0.04, 6.0);
  soilPatch.receiveShadow = true;
  group.add(soilPatch);

  // Core sample tubes driven into orange pyroclastic soil
  for (let c = 0; c < 3; c++) {
    const tubeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const tube = new THREE.Mesh(tubeGeo, mats.aluminumAlloyMat);
    const tx = 8.2 + c * 0.65;
    const tz = 5.8 + (c % 2) * 0.4;
    const tubeLocalY = getLunarTerrainHeight(worldPos.x + tx, worldPos.z + tz) - (groundY + 0.25);
    tube.position.set(tx, tubeLocalY + 0.4, tz);
    tube.castShadow = true;
    group.add(tube);
  }

  // LRV-3 Rover parked nearby with iconic duct-tape fender map repair (terrain-grounded)
  const lrv3Group = new THREE.Group();
  const lrv3LocalY = getLunarTerrainHeight(worldPos.x - 8.5, worldPos.z + 7.5) - (groundY + 0.25);
  lrv3Group.position.set(-8.5, lrv3LocalY + 0.05, 7.5);
  lrv3Group.rotation.y = 0.75;

  const lrvChassisGeo = new THREE.BoxGeometry(1.65, 0.18, 2.9);
  const lrvChassis = new THREE.Mesh(lrvChassisGeo, mats.whiteThermalMat);
  lrvChassis.position.y = 0.58;
  lrvChassis.castShadow = true;
  lrv3Group.add(lrvChassis);

  // Right-rear fender with grey duct-tape & laminated map extension!
  const repairedFenderGeo = new THREE.BoxGeometry(0.35, 0.1, 0.52);
  const repairedFender = new THREE.Mesh(repairedFenderGeo, mats.ductTapeMat);
  repairedFender.position.set(0.95, 0.62, -0.98);
  repairedFender.castShadow = true;
  lrv3Group.add(repairedFender);

  group.add(lrv3Group);

  // Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 4.3, 0);
  group.add(beaconLight);

  const beaconGeo = new THREE.SphereGeometry(0.24, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [hull, soilPatch, lrvChassis, repairedFender],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 3.1) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// 5. SURVEYOR 1 SOFT LANDER
// -----------------------------------------------------------------------------
function createSurveyor1_3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.surveyor1_lander;
  const group = new THREE.Group();
  group.name = 'surveyor1_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.22, worldPos.z);

  // Triangular space frame (America's first robotic soft landing on the Moon, June 1966)
  const frameGeo = new THREE.CylinderGeometry(0.7, 1.4, 1.35, 3);
  const frame = new THREE.Mesh(frameGeo, mats.whiteThermalMat);
  frame.position.y = 1.25;
  frame.castShadow = true;
  group.add(frame);

  // 3 Tripod Landing Legs
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const leg = new THREE.Group();
    leg.rotation.y = angle;

    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8);
    const strut = new THREE.Mesh(strutGeo, mats.aluminumAlloyMat);
    strut.position.set(0, 0.72, 1.7);
    strut.rotation.x = -0.56;
    strut.castShadow = true;
    leg.add(strut);

    const footpadGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12);
    const footpad = new THREE.Mesh(footpadGeo, mats.aluminumAlloyMat);
    footpad.position.set(0, 0.05, 2.5);
    footpad.castShadow = true;
    leg.add(footpad);

    group.add(leg);
  }

  // Central solar panel & omni mast
  const mastGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.1, 8);
  const mast = new THREE.Mesh(mastGeo, mats.aluminumAlloyMat);
  mast.position.y = 2.4;
  mast.castShadow = true;
  group.add(mast);

  const solarPanelGeo = new THREE.BoxGeometry(1.05, 0.05, 1.35);
  const solarPanel = new THREE.Mesh(solarPanelGeo, mats.solarCellMat);
  solarPanel.position.set(0, 3.35, 0);
  solarPanel.rotation.x = -0.38;
  solarPanel.castShadow = true;
  group.add(solarPanel);

  // Nitrogen attitude control gas spheres
  [-0.48, 0.48].forEach((gx) => {
    const sphereGeo = new THREE.SphereGeometry(0.2, 14, 14);
    const sphereMesh = new THREE.Mesh(sphereGeo, mats.whiteThermalMat);
    sphereMesh.position.set(gx, 0.88, -0.42);
    group.add(sphereMesh);
  });

  // Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 3.8, 0);
  group.add(beaconLight);

  const beaconGeo = new THREE.SphereGeometry(0.22, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [frame, solarPanel],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 3.3) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// 6. APOLLO 14 MODULAR EQUIPMENT TRANSPORTER (MET) & ALSEP
// -----------------------------------------------------------------------------
function createApollo14MET_3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.apollo14_met;
  const group = new THREE.Group();
  group.name = 'apollo14_met_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.2, worldPos.z);

  // Modular Equipment Transporter ("Lunar Rickshaw")
  const metGroup = new THREE.Group();

  // Tubular aluminum frame bed (1.0m length x 0.9m width)
  const bedGeo = new THREE.BoxGeometry(0.9, 0.14, 1.05);
  const bed = new THREE.Mesh(bedGeo, mats.aluminumAlloyMat);
  bed.position.y = 0.48;
  bed.castShadow = true;
  metGroup.add(bed);

  // Two Visible Rubber Tires (Goodyear Michelin Lunar tires)
  [-0.52, 0.52].forEach((wx) => {
    const tireGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.14, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.92,
      metalness: 0.05,
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.position.set(wx, 0.26, 0);
    tire.castShadow = true;
    metGroup.add(tire);
  });

  // Pull Handle Bar
  const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
  const handle = new THREE.Mesh(handleGeo, mats.aluminumAlloyMat);
  handle.position.set(0, 0.72, 0.8);
  handle.rotation.x = 0.75;
  metGroup.add(handle);

  // Sample collection bags & geology tongs
  const bagGeo = new THREE.BoxGeometry(0.38, 0.28, 0.48);
  const bag = new THREE.Mesh(bagGeo, mats.whiteThermalMat);
  bag.position.set(-0.16, 0.65, -0.16);
  metGroup.add(bag);

  group.add(metGroup);

  // ALSEP Station deployed nearby: Central Station + SNAP-27 Nuclear RTG Cask (terrain-grounded)
  const alsepGroup = new THREE.Group();
  const alsepLocalY = getLunarTerrainHeight(worldPos.x + 3.6, worldPos.z + 2.8) - (groundY + 0.2);
  alsepGroup.position.set(3.6, alsepLocalY + 0.03, 2.8);

  const alsepBoxGeo = new THREE.BoxGeometry(0.85, 0.5, 0.75);
  const alsepBox = new THREE.Mesh(alsepBoxGeo, mats.whiteThermalMat);
  alsepBox.position.y = 0.28;
  alsepBox.castShadow = true;
  alsepGroup.add(alsepBox);

  // SNAP-27 Radioisotope Thermoelectric Generator (RTG) Cask with Cooling Fins
  const rtgGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
  const rtg = new THREE.Mesh(rtgGeo, mats.darkAlloyMat);
  rtg.position.set(1.5, 0.32, 0);
  rtg.castShadow = true;
  alsepGroup.add(rtg);

  // Suprathermal Ion Detector Experiment (SIDE)
  const sideGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
  const side = new THREE.Mesh(sideGeo, mats.aluminumAlloyMat);
  side.position.set(-1.3, 0.2, 0);
  alsepGroup.add(side);

  group.add(alsepGroup);

  // Transponder Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 2.6, 0);
  group.add(beaconLight);

  const beaconGeo = new THREE.SphereGeometry(0.22, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [bed, bag, alsepBox, rtg],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 3.4) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// 7. LASER RANGING RETROREFLECTOR ARRAY (LRRR)
// -----------------------------------------------------------------------------
function createLRRR_3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.lunar_laser_reflector;
  const group = new THREE.Group();
  group.name = 'lunar_laser_reflector_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  // Elevate slightly so pallet and prisms stand proud of the regolith
  group.position.set(worldPos.x, groundY + 0.2, worldPos.z);

  // Elevated regolith footing collar
  const collarGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.2, 16);
  const collar = new THREE.Mesh(collarGeo, mats.groundCollarMat);
  collar.position.y = -0.08;
  collar.receiveShadow = true;
  group.add(collar);

  // Beryllium-Copper Alloy Support Pallet (0.85m x 0.85m)
  const basePalletGeo = new THREE.BoxGeometry(0.9, 0.16, 0.9);
  const basePallet = new THREE.Mesh(basePalletGeo, mats.whiteThermalMat);
  basePallet.position.y = 0.12;
  basePallet.castShadow = true;
  group.add(basePallet);

  // Hinged Angle Elevation Assembly (Tilted 38° to align normal with Earth in the sky)
  const reflectorPanel = new THREE.Group();
  reflectorPanel.position.set(0, 0.24, 0);
  reflectorPanel.rotation.set(-0.58, -0.42, 0);

  // Reflector Panel Chassis Housing
  const panelHousingGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
  const panelHousing = new THREE.Mesh(panelHousingGeo, mats.aluminumAlloyMat);
  panelHousing.castShadow = true;
  reflectorPanel.add(panelHousing);

  // 10x10 Array of Fused Silica Corner-Cube Prisms (100 individual retroreflector prisms)
  const prismGeo = new THREE.BoxGeometry(0.055, 0.045, 0.055);
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const prism = new THREE.Mesh(prismGeo, mats.retroreflectorMat);
      const px = -0.32 + c * 0.07;
      const pz = -0.32 + r * 0.07;
      prism.position.set(px, 0.055, pz);
      reflectorPanel.add(prism);
    }
  }

  // Sun-Compass Alignment Shadow-Pin Mast
  const shadowPinGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.45, 8);
  const shadowPin = new THREE.Mesh(shadowPinGeo, mats.aluminumAlloyMat);
  shadowPin.position.set(0.34, 0.24, 0.34);
  reflectorPanel.add(shadowPin);

  group.add(reflectorPanel);

  // Transponder Beacon
  const beaconMastGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8);
  const beaconMast = new THREE.Mesh(beaconMastGeo, mats.aluminumAlloyMat);
  beaconMast.position.set(0, 1.2, 0);
  group.add(beaconMast);

  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 2.0, 0);
  group.add(beaconLight);

  const beaconGeo = new THREE.SphereGeometry(0.22, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [basePallet, panelHousing],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 3.5) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// 8. APOLLO 12 ALSEP SCIENTIFIC STATION (OCEANUS PROCELLARUM)
// -----------------------------------------------------------------------------
function createApollo12ALSEP_3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.apollo12_alsep;
  const group = new THREE.Group();
  group.name = 'apollo12_alsep_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.18, worldPos.z);

  // ALSEP Central Station Box + Helical S-Band Mast
  const centralBox = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.85), mats.whiteThermalMat);
  centralBox.position.y = 0.28;
  centralBox.castShadow = true;
  group.add(centralBox);

  const helicalMast = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.4, 10), mats.aluminumAlloyMat);
  helicalMast.position.set(0, 1.15, 0);
  helicalMast.castShadow = true;
  group.add(helicalMast);

  // SNAP-27 Pu-238 RTG with Radial Beryllium Cooling Fins (terrain-grounded)
  const rtgLocalY = getLunarTerrainHeight(worldPos.x + 2.3, worldPos.z - 0.4) - (groundY + 0.18);
  const rtgGroup = new THREE.Group();
  rtgGroup.position.set(2.3, rtgLocalY, -0.4);
  const rtgCore = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.72, 16), mats.darkAlloyMat);
  rtgCore.position.y = 0.36;
  rtgCore.castShadow = true;
  rtgGroup.add(rtgCore);
  for (let f = 0; f < 8; f++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.65, 0.14), mats.aluminumAlloyMat);
    fin.position.set(Math.cos((f * Math.PI) / 4) * 0.25, 0.36, Math.sin((f * Math.PI) / 4) * 0.25);
    fin.rotation.y = -(f * Math.PI) / 4;
    rtgGroup.add(fin);
  }
  group.add(rtgGroup);

  // Passive Seismic Experiment (PSE) beneath Circular Thermal Mylar Skirt (terrain-grounded)
  const pseLocalY = getLunarTerrainHeight(worldPos.x - 2.4, worldPos.z + 1.3) - (groundY + 0.18);
  const pseSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.95, 0.12, 16), mats.goldKaptonMat);
  pseSkirt.position.set(-2.4, pseLocalY + 0.06, 1.3);
  pseSkirt.castShadow = true;
  group.add(pseSkirt);

  const pseCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.42, 14), mats.whiteThermalMat);
  pseCylinder.position.set(-2.4, pseLocalY + 0.26, 1.3);
  group.add(pseCylinder);

  // Lunar Surface Magnetometer (LSM) — 3 Orthogonal Folding Sensor Arms (terrain-grounded)
  const lsmLocalY = getLunarTerrainHeight(worldPos.x - 2.2, worldPos.z - 2.5) - (groundY + 0.18);
  const lsmGroup = new THREE.Group();
  lsmGroup.position.set(-2.2, lsmLocalY + 0.05, -2.5);
  const lsmHub = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.36, 0.4), mats.whiteThermalMat);
  lsmHub.position.y = 0.22;
  lsmGroup.add(lsmHub);

  [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].forEach((angle) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 8), mats.aluminumAlloyMat);
    arm.position.set(Math.cos(angle) * 0.55, 0.58, Math.sin(angle) * 0.55);
    arm.rotation.z = -Math.cos(angle) * 0.95;
    arm.rotation.x = Math.sin(angle) * 0.95;
    lsmGroup.add(arm);
  });
  group.add(lsmGroup);

  // Solar Wind Spectrometer (SWS) & SIDE Ion Gauge (terrain-grounded)
  const swsLocalY = getLunarTerrainHeight(worldPos.x + 1.9, worldPos.z + 2.2) - (groundY + 0.18);
  const swsDome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mats.aluminumAlloyMat);
  swsDome.position.set(1.9, swsLocalY + 0.16, 2.2);
  group.add(swsDome);

  // Ribbon Cables connecting experiments to Central Station (following terrain slope)
  [
    [2.3, rtgLocalY + 0.04, -0.4],
    [-2.4, pseLocalY + 0.04, 1.3],
    [-2.2, lsmLocalY + 0.04, -2.5],
    [1.9, swsLocalY + 0.04, 2.2],
  ].forEach(([tx, ty, tz]) => {
    const midY = getLunarTerrainHeight(worldPos.x + tx / 2, worldPos.z + tz / 2) - (groundY + 0.18) + 0.03;
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.03, 0),
      new THREE.Vector3(tx / 2, midY, tz / 2),
      new THREE.Vector3(tx, ty, tz),
    ]);
    const cableGeo = new THREE.TubeGeometry(cableCurve, 10, 0.028, 6, false);
    const cable = new THREE.Mesh(cableGeo, mats.goldKaptonMat);
    group.add(cable);
  });

  // Transponder Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 2.5, 0);
  group.add(beaconLight);

  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [centralBox, rtgCore, pseSkirt, lsmHub],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 3.1) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// 9. APOLLO 12 LM DESCENT STAGE (INTREPID) & ERECTABLE S-BAND DISH
// -----------------------------------------------------------------------------
function createApollo12Intrepid3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.apollo12_intrepid;
  const group = new THREE.Group();
  group.name = 'apollo12_intrepid_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.25, worldPos.z);
  group.rotation.y = 0.45;

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.2, 0.3, 16), mats.groundCollarMat);
  collar.position.y = -0.12;
  collar.receiveShadow = true;
  group.add(collar);

  // LM-6 Octagonal Descent Stage Hull
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.85, 1.85, 8), mats.goldKaptonMat);
  hull.position.y = 1.7;
  hull.castShadow = true;
  group.add(hull);

  // Engine Bell
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.35, 18, 1, true), mats.darkAlloyMat);
  bell.position.y = 0.75;
  bell.rotation.x = Math.PI;
  group.add(bell);

  // 4 Landing Legs & Footpads
  [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach((angle) => {
    const leg = new THREE.Group();
    leg.rotation.y = angle;

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8), mats.aluminumAlloyMat);
    strut.position.set(0, 1.05, 2.5);
    strut.rotation.x = -0.68;
    strut.castShadow = true;
    leg.add(strut);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 14), mats.goldKaptonMat);
    pad.position.set(0, 0.06, 3.65);
    pad.castShadow = true;
    leg.add(pad);

    group.add(leg);
  });

  // Deployed MESA Equipment Bay + Forward Ladder
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.2, 0.06), mats.aluminumAlloyMat);
  ladder.position.set(0, 1.45, 2.9);
  ladder.rotation.x = -0.32;
  group.add(ladder);

  const mesaBay = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.8), mats.whiteThermalMat);
  mesaBay.position.set(-1.7, 1.18, 1.45);
  mesaBay.rotation.y = 0.4;
  group.add(mesaBay);

  // Iconic Erectable S-Band Umbrella Antenna Tripod deployed beside Intrepid (terrain-grounded)
  const sbandGroup = new THREE.Group();
  const sbLx = 5.4;
  const sbLz = 3.6;
  const rotY = group.rotation.y;
  const sbWorldX = worldPos.x + sbLx * Math.cos(rotY) + sbLz * Math.sin(rotY);
  const sbWorldZ = worldPos.z - sbLx * Math.sin(rotY) + sbLz * Math.cos(rotY);
  const sbLocalY = getLunarTerrainHeight(sbWorldX, sbWorldZ) - (groundY + 0.25);
  sbandGroup.position.set(sbLx, sbLocalY + 0.05, sbLz);
  const tripodMast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 8), mats.aluminumAlloyMat);
  tripodMast.position.y = 1.1;
  sbandGroup.add(tripodMast);
  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.45, 16, 1, true), mats.goldKaptonMat);
  umbrella.position.y = 2.15;
  umbrella.rotation.x = Math.PI * 0.72;
  umbrella.castShadow = true;
  sbandGroup.add(umbrella);
  group.add(sbandGroup);

  // Transponder Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 4.3, 0);
  group.add(beaconLight);

  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [hull, mesaBay, umbrella],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.6 + Math.sin(t * 3.0) * 0.9;
    },
  };
}

// -----------------------------------------------------------------------------
// 10. APOLLO 16 LUNAR ROVING VEHICLE (LRV-2) — DESCARTES HIGHLANDS
// -----------------------------------------------------------------------------
function createApollo16LRV_3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.apollo16_lrv;
  const group = new THREE.Group();
  group.name = 'apollo16_lrv_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.22, worldPos.z);
  group.rotation.y = -0.55;

  // Open Aluminum Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 3.0), mats.whiteThermalMat);
  chassis.position.y = 0.62;
  chassis.castShadow = true;
  group.add(chassis);

  // 4 Solid Woven Wire-Mesh Wheels (rear-right missing front-half fender extension like historic EVA 2!)
  const wheelOffsets = [
    { x: -0.95, z: 0.98, damagedFender: false },
    { x: 0.95, z: 0.98, damagedFender: false },
    { x: -0.95, z: -0.98, damagedFender: false },
    { x: 0.95, z: -0.98, damagedFender: true },
  ];

  wheelOffsets.forEach((wo) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wo.x, 0.44, wo.z);

    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.26, 18), mats.wheelTreadMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    wheelGroup.add(wheel);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.28, 14), mats.aluminumAlloyMat);
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);

    const fenderArc = wo.damagedFender ? Math.PI * 0.55 : Math.PI;
    const fenderGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.28, 12, 1, false, 0, fenderArc);
    fenderGeo.rotateZ(Math.PI / 2);
    const fender = new THREE.Mesh(fenderGeo, mats.whiteThermalMat);
    fender.position.y = 0.05;
    wheelGroup.add(fender);

    group.add(wheelGroup);
  });

  // Dual Astronaut Seats + T-Controller
  [-0.38, 0.38].forEach((sx) => {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.55), mats.whiteThermalMat);
    seat.position.set(sx, 0.92, 0.15);
    seat.castShadow = true;
    group.add(seat);
  });

  const joystick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), mats.darkAlloyMat);
  joystick.position.set(0, 1.0, 0.5);
  joystick.rotation.x = -0.32;
  group.add(joystick);

  // LCRU Gold-Mesh Parabolic Umbrella Dish & RCA TV Camera
  const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 8), mats.aluminumAlloyMat);
  dishMast.position.set(0.5, 1.35, 1.2);
  group.add(dishMast);

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.08, 0.24, 18, 1, true), mats.goldKaptonMat);
  dish.position.set(0.5, 1.98, 1.2);
  dish.rotation.set(-0.6, -0.4, 0);
  group.add(dish);

  // Aft Lunar Portable Magnetometer (LPM) & Tool Pallet
  const lpmBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.55), mats.goldKaptonMat);
  lpmBox.position.set(0, 0.95, -1.18);
  lpmBox.castShadow = true;
  group.add(lpmBox);

  // Transponder Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 2.9, 0);
  group.add(beaconLight);

  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [chassis, dish, lpmBox],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 2.9) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// 11. SURVEYOR 7 SOFT LANDER (TYCHO HIGHLANDS)
// -----------------------------------------------------------------------------
function createSurveyor7_3D(): Artifact3DObject {
  const data = ALL_LUNAR_ARTIFACTS.surveyor7_lander;
  const group = new THREE.Group();
  group.name = 'surveyor7_3d';

  const mats = getSharedLunarMaterials();
  const worldPos = data.worldPosition;
  const groundY = getLunarTerrainHeight(worldPos.x, worldPos.z);
  group.position.set(worldPos.x, groundY + 0.22, worldPos.z);
  group.rotation.y = 0.65;

  // Triangular Aluminum Space Frame
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.4, 1.35, 3), mats.whiteThermalMat);
  frame.position.y = 1.25;
  frame.castShadow = true;
  group.add(frame);

  // 3 Tripod Landing Legs & Footpads
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Group();
    leg.rotation.y = (i * 2 * Math.PI) / 3;

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), mats.aluminumAlloyMat);
    strut.position.set(0, 0.72, 1.7);
    strut.rotation.x = -0.56;
    strut.castShadow = true;
    leg.add(strut);

    const footpad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12), mats.aluminumAlloyMat);
    footpad.position.set(0, 0.05, 2.5);
    footpad.castShadow = true;
    leg.add(footpad);

    group.add(leg);
  }

  // Central Solar Mast & Planar Array
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.1, 8), mats.aluminumAlloyMat);
  mast.position.y = 2.4;
  group.add(mast);

  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 1.35), mats.solarCellMat);
  solarPanel.position.set(0, 3.35, 0);
  solarPanel.rotation.x = -0.4;
  solarPanel.castShadow = true;
  group.add(solarPanel);

  // Deployed Gold-Coated Alpha-Scattering Surface Analyzer Box on Highland Regolith
  const assaBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.34, 0.45), mats.goldKaptonMat);
  assaBox.position.set(0.95, 0.18, 1.55);
  assaBox.castShadow = true;
  group.add(assaBox);

  // Articulated Surface Sampler Scoop Arm positioned near the ASSA sensor
  const armTube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.55, 8), mats.aluminumAlloyMat);
  armTube.position.set(0.78, 0.55, 1.25);
  armTube.rotation.x = 0.8;
  armTube.castShadow = true;
  group.add(armTube);

  // Transponder Beacon
  const beaconLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
  beaconLight.position.set(0, 3.8, 0);
  group.add(beaconLight);

  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  beaconMesh.position.copy(beaconLight.position);
  group.add(beaconMesh);

  return {
    id: data.id,
    name: data.name,
    position: new THREE.Vector3(worldPos.x, groundY, worldPos.z),
    group,
    beaconLight,
    beaconMesh,
    interactiveParts: [frame, solarPanel, assaBox, armTube],
    extraMeshes: [],
    highlightPart: () => {},
    update: (t) => {
      beaconLight.intensity = 1.5 + Math.sin(t * 3.4) * 0.8;
    },
  };
}

// -----------------------------------------------------------------------------
// MANAGER FACTORY
// -----------------------------------------------------------------------------
export function createLunarArtifactsManager(scene: THREE.Scene): LunarArtifactsManager {
  const artifacts: Artifact3DObject[] = [
    createApollo11Eagle3D(),
    createSurveyor3_3D(),
    createApollo15LRV_3D(),
    createApollo17Challenger3D(),
    createSurveyor1_3D(),
    createApollo14MET_3D(),
    createLRRR_3D(),
    createApollo12ALSEP_3D(),
    createApollo12Intrepid3D(),
    createApollo16LRV_3D(),
    createSurveyor7_3D(),
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
