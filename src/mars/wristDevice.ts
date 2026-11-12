import * as THREE from 'three';
import { PlayerState } from './controls';
import { SURVIVAL_CONFIG, RechargeState } from '../data/survivalConfig';
import { marsAudio } from './audio';

export interface WristDeviceState {
  isRaised: boolean;
  rechargeButtonHovered: boolean;
  lastRechargeAnimTime: number;
}

export class AstronautWristDevice {
  public group: THREE.Group;
  private screenMesh!: THREE.Mesh;
  private screenCanvas!: HTMLCanvasElement;
  private screenCtx!: CanvasRenderingContext2D;
  private screenTexture!: THREE.CanvasTexture;
  private screenLight!: THREE.PointLight;

  // Animation and interpolation
  private isRaised: boolean = false;
  private currentProgress: number = 0; // 0 = lowered, 1 = raised
  private targetProgress: number = 0;

  // Explicit EVA Energy Recharge State Machine
  private rechargeState: RechargeState = 'IDLE';
  private chargingEnergy: number = 100;
  private chargingProgress: number = 0;
  private onSelectChargeCallback?: () => void;
  private onPhysicalButtonCallback?: () => void;
  private onCancelArmCallback?: () => void;
  private activePhysicalBtnBounds = { yMin: 610, yMax: 760 };
  private activeCancelBtnBounds = { yMin: 761, yMax: 840 };

  private lastDrawnState: {
    energy: number;
    oxygen: number;
    charges: number;
    emergencyCountdown: number | null;
    isRaised: boolean;
    rechargePulse: number;
    hovered: boolean;
    rechargeState: RechargeState;
    chargingEnergy: number;
  } = {
    energy: -1,
    oxygen: -1,
    charges: -1,
    emergencyCountdown: -999,
    isRaised: false,
    rechargePulse: 0,
    hovered: false,
    rechargeState: 'IDLE',
    chargingEnergy: -1,
  };
  private lastRedrawTimestamp: number = 0;
  private pulseTimer: number = 0;
  private swayTimer: number = 0;

  // Transform configurations (relative to camera eye in meters)
  private readonly LOWERED_POS = new THREE.Vector3(-0.32, -0.58, -0.38);
  private readonly LOWERED_ROT = new THREE.Euler(0.38, -0.24, 0.16, 'YXZ');

  // Ergonomic raised viewing position: natural human wristwatch perspective in lower-left quadrant
  // Tilts upward toward visor eyes (~-19°), turned inward toward center (~-26°), with subtle forearm roll (~-7°)
  private readonly RAISED_POS = new THREE.Vector3(-0.205, -0.145, -0.375);
  private readonly RAISED_ROT = new THREE.Euler(-0.33, -0.46, -0.12, 'YXZ');

  // Raycasting for screen interactions
  private raycaster = new THREE.Raycaster();
  private mouseCoords = new THREE.Vector2();
  private onRechargeCallback?: () => void;
  private isButtonHovered: boolean = false;

  constructor(onRecharge?: () => void) {
    this.onRechargeCallback = onRecharge;
    this.group = new THREE.Group();
    this.group.name = 'astronaut_left_arm_wrist_device';

    // Set initial transform (lowered out of view)
    this.group.position.copy(this.LOWERED_POS);
    this.group.rotation.copy(this.LOWERED_ROT);

    this.createScreenCanvas();
    this.buildArmAndWristMesh();
  }

  public get raised(): boolean {
    return this.isRaised;
  }

  public toggleRaised(): boolean {
    this.isRaised = !this.isRaised;
    this.targetProgress = this.isRaised ? 1 : 0;
    marsAudio.playComponentSelect();
    return this.isRaised;
  }

  public setRaised(raised: boolean) {
    if (this.isRaised !== raised) {
      this.isRaised = raised;
      this.targetProgress = raised ? 1 : 0;
      marsAudio.playComponentSelect();
    }
  }

  public setOnRecharge(cb: () => void) {
    this.onRechargeCallback = cb;
  }

  public setRechargeState(
    state: RechargeState,
    animatedEnergy?: number,
    progress?: number
  ) {
    this.rechargeState = state;
    if (animatedEnergy !== undefined) {
      this.chargingEnergy = animatedEnergy;
    }
    if (progress !== undefined) {
      this.chargingProgress = Math.max(0, Math.min(1, progress));
    }
  }

  public setOnSelectCharge(cb: () => void) {
    this.onSelectChargeCallback = cb;
  }

  public setOnPhysicalButtonClick(cb: () => void) {
    this.onPhysicalButtonCallback = cb;
  }

  public setOnCancelArm(cb: () => void) {
    this.onCancelArmCallback = cb;
  }

  /**
   * Initializes the high-resolution 1024x1024 dynamic canvas texture
   */
  private createScreenCanvas() {
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 1024;
    this.screenCanvas.height = 1024;
    const ctx = this.screenCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create 2D canvas context for wrist display');
    }
    this.screenCtx = ctx;

    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.generateMipmaps = true;
    this.screenTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;
  }

  /**
   * Constructs the 3D procedural astronaut spacesuit forearm, glove, and wrist computer
   * Arranged in authentic human left-arm watch viewing posture:
   * - Forearm enters from the lower-left edge
   * - Watch device mounted squarely on the dorsal wrist, angled toward eyes
   * - Hand and glove positioned to the right of the watch with fingers naturally curled
   */
  private buildArmAndWristMesh() {
    // 1. Common Spacesuit PBR Materials
    const suitFabricMaterial = new THREE.MeshStandardMaterial({
      color: 0xb0b8c4, // Ares off-white / titanium woven spacesuit composite
      roughness: 0.68,
      metalness: 0.15,
    });

    const suitJointMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2530, // Pressurized accordion elbow / wrist flex joints
      roughness: 0.82,
      metalness: 0.10,
    });

    const titaniumMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x718096, // Hard anodized suit quick-disconnect locking collars & bezel
      roughness: 0.28,
      metalness: 0.85,
    });

    const carbonCompositeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Rugged carbon device chassis
      roughness: 0.38,
      metalness: 0.55,
    });

    const siliconeGripMaterial = new THREE.MeshStandardMaterial({
      color: 0x18202c, // High-friction EVA palm & fingertip grip pads
      roughness: 0.90,
      metalness: 0.05,
    });

    // 2. Wrist Computer Unit (Centered at local origin (0, 0, 0))
    const wristDeviceGroup = new THREE.Group();
    wristDeviceGroup.name = 'wrist_computer_unit';

    // Main rugged chassis base
    const chassisBaseGeo = new THREE.BoxGeometry(0.116, 0.116, 0.026);
    const chassisMesh = new THREE.Mesh(chassisBaseGeo, carbonCompositeMaterial);
    chassisMesh.castShadow = true;
    wristDeviceGroup.add(chassisMesh);

    // Outer titanium chamfered bezel
    const bezelGeo = new THREE.BoxGeometry(0.110, 0.110, 0.008);
    const bezelMesh = new THREE.Mesh(bezelGeo, titaniumMetalMaterial);
    bezelMesh.position.set(0, 0, 0.012);
    wristDeviceGroup.add(bezelMesh);

    // 4 Corner Hex Screws
    const screwGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.004, 6);
    screwGeo.rotateX(Math.PI / 2);
    [-0.046, 0.046].forEach((sx) => {
      [-0.046, 0.046].forEach((sy) => {
        const screwMesh = new THREE.Mesh(screwGeo, titaniumMetalMaterial);
        screwMesh.position.set(sx, sy, 0.016);
        wristDeviceGroup.add(screwMesh);
      });
    });

    // Hardware Side Buttons (Tactile sealed switches on top rim)
    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
    });
    const sideBtnGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.010, 12);
    sideBtnGeo.rotateX(Math.PI / 2);

    const btn1 = new THREE.Mesh(sideBtnGeo, buttonMat);
    btn1.position.set(-0.024, 0.059, 0.002);
    wristDeviceGroup.add(btn1);

    const btn2 = new THREE.Mesh(sideBtnGeo, buttonMat);
    btn2.position.set(0.024, 0.059, 0.002);
    wristDeviceGroup.add(btn2);

    // Status LED Diodes (Top-left of bezel)
    const ledGreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledCyanMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const ledGeo = new THREE.SphereGeometry(0.0028, 8, 8);

    const ledGreen = new THREE.Mesh(ledGeo, ledGreenMat);
    ledGreen.position.set(-0.042, 0.045, 0.016);
    wristDeviceGroup.add(ledGreen);

    const ledCyan = new THREE.Mesh(ledGeo, ledCyanMat);
    ledCyan.position.set(-0.030, 0.045, 0.016);
    wristDeviceGroup.add(ledCyan);

    // AMOLED Screen Display Plane (Facing directly along +Z with normal pointing to eyes)
    const screenGeo = new THREE.PlaneGeometry(0.098, 0.098);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false,
    });

    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.screenMesh.position.set(0, 0, 0.017);
    this.screenMesh.name = 'wrist_screen_display';
    wristDeviceGroup.add(this.screenMesh);

    // Subtle Cyan Ambience Light directly over screen
    this.screenLight = new THREE.PointLight(0x00e5ff, 0.35, 0.65);
    this.screenLight.position.set(0, 0, 0.06);
    wristDeviceGroup.add(this.screenLight);

    // Gauntlet wrist cuff bracket wrapping beneath device
    const cuffGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.118, 24);
    cuffGeo.rotateZ(Math.PI / 2);
    cuffGeo.translate(0, -0.012, -0.022);
    const cuffMesh = new THREE.Mesh(cuffGeo, suitJointMaterial);
    wristDeviceGroup.add(cuffMesh);

    // 3. Continuous Extended Forearm & Upper Arm Sleeve (Extending to the left, X < 0, through screen edge into torso)
    const forearmGroup = new THREE.Group();
    forearmGroup.name = 'astronaut_forearm_sleeve';
    forearmGroup.position.set(-0.058, -0.012, -0.018);
    // Angle sleeve downward, leftward, and backward into the astronaut's shoulder/torso
    forearmGroup.rotation.set(0.12, 0.14, 0.30, 'YXZ');

    // Quick-disconnect titanium locking collar at wrist
    const forearmCollarGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.024, 28);
    forearmCollarGeo.rotateZ(Math.PI / 2);
    forearmCollarGeo.translate(-0.012, 0, 0);
    const forearmCollarMesh = new THREE.Mesh(forearmCollarGeo, titaniumMetalMaterial);
    forearmCollarMesh.castShadow = true;
    forearmGroup.add(forearmCollarMesh);

    // Main pressurized forearm composite sleeve (Wrist to Elbow, length 0.44m)
    const forearmGeo = new THREE.CylinderGeometry(0.055, 0.072, 0.44, 28);
    forearmGeo.rotateZ(Math.PI / 2);
    forearmGeo.translate(-0.23, 0, 0);
    const forearmMesh = new THREE.Mesh(forearmGeo, suitFabricMaterial);
    forearmMesh.castShadow = true;
    forearmMesh.receiveShadow = true;
    forearmGroup.add(forearmMesh);

    // Pressurized accordion elbow joint (Elbow flex zone, length 0.16m)
    const elbowJointGeo = new THREE.CylinderGeometry(0.072, 0.078, 0.16, 28);
    elbowJointGeo.rotateZ(Math.PI / 2);
    elbowJointGeo.translate(-0.53, 0, 0);
    const elbowJointMesh = new THREE.Mesh(elbowJointGeo, suitJointMaterial);
    elbowJointMesh.castShadow = true;
    elbowJointMesh.receiveShadow = true;
    forearmGroup.add(elbowJointMesh);

    // Extended upper arm sleeve (Penetrates well past screen edge in full screen, length 0.55m)
    const upperArmGeo = new THREE.CylinderGeometry(0.078, 0.096, 0.55, 28);
    upperArmGeo.rotateZ(Math.PI / 2);
    upperArmGeo.translate(-0.88, 0, 0);
    const upperArmMesh = new THREE.Mesh(upperArmGeo, suitFabricMaterial);
    upperArmMesh.castShadow = true;
    upperArmMesh.receiveShadow = true;
    forearmGroup.add(upperArmMesh);

    // Anatomical shoulder joint end-cap (guarantees no hollow open cylinder edge is ever visible)
    const capGeo = new THREE.SphereGeometry(0.096, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    capGeo.rotateZ(Math.PI / 2);
    capGeo.translate(-1.15, 0, 0);
    const capMesh = new THREE.Mesh(capGeo, suitFabricMaterial);
    forearmGroup.add(capMesh);

    // Pressure seam reinforcement ribs along forearm, elbow, and upper arm
    [-0.07, -0.15, -0.25, -0.35, -0.48, -0.54, -0.60, -0.73, -0.89, -1.04].forEach((xPos, idx) => {
      const ringRadius = 0.058 + Math.min(0.038, idx * 0.0042);
      const ringGeo = new THREE.TorusGeometry(ringRadius, 0.005, 12, 28);
      ringGeo.rotateY(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, suitJointMaterial);
      ringMesh.position.set(xPos, 0, 0);
      forearmGroup.add(ringMesh);
    });

    // Ares Mission Arm Patch on upper sleeve
    const patchGeo = new THREE.BoxGeometry(0.052, 0.020, 0.070);
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.5,
    });
    const patchMesh = new THREE.Mesh(patchGeo, patchMat);
    patchMesh.position.set(-0.22, 0.058, 0.006);
    patchMesh.rotation.z = -0.15;
    forearmGroup.add(patchMesh);

    // 4. Spacesuit Glove and Articulated Hand (Positioned to the right of watch, X > 0)
    const handGroup = new THREE.Group();
    handGroup.name = 'astronaut_left_glove';
    handGroup.position.set(0.058, -0.010, -0.016);

    // Titanium wrist quick-disconnect locking collar
    const handCollarGeo = new THREE.CylinderGeometry(0.056, 0.056, 0.022, 28);
    handCollarGeo.rotateZ(Math.PI / 2);
    handCollarGeo.translate(0.011, 0, 0);
    const handCollarMesh = new THREE.Mesh(handCollarGeo, titaniumMetalMaterial);
    handCollarMesh.castShadow = true;
    handGroup.add(handCollarMesh);

    // Main palm body
    const palmGeo = new THREE.BoxGeometry(0.062, 0.042, 0.078);
    const palmMesh = new THREE.Mesh(palmGeo, suitFabricMaterial);
    palmMesh.position.set(0.042, -0.002, 0);
    handGroup.add(palmMesh);

    // Silicone palm grip pad
    const palmGripGeo = new THREE.BoxGeometry(0.050, 0.006, 0.066);
    const palmGripMesh = new THREE.Mesh(palmGripGeo, siliconeGripMaterial);
    palmGripMesh.position.set(0.042, -0.022, 0);
    handGroup.add(palmGripMesh);

    // Carbon fiber knuckle guard
    const knuckleGeo = new THREE.BoxGeometry(0.018, 0.015, 0.074);
    const knuckleMesh = new THREE.Mesh(knuckleGeo, carbonCompositeMaterial);
    knuckleMesh.position.set(0.072, 0.014, 0);
    handGroup.add(knuckleMesh);

    // 4 Articulated Spacesuit Fingers (Index, Middle, Ring, Pinky curled naturally)
    const fingerDefs = [
      { z: 0.027, len: 0.052, radius: 0.010, curlY: -0.22, curlZ: -0.10 }, // Index
      { z: 0.009, len: 0.056, radius: 0.011, curlY: -0.26, curlZ: -0.05 }, // Middle
      { z: -0.009, len: 0.053, radius: 0.010, curlY: -0.28, curlZ: 0.02 }, // Ring
      { z: -0.027, len: 0.045, radius: 0.009, curlY: -0.30, curlZ: 0.08 }, // Pinky
    ];

    fingerDefs.forEach((fd) => {
      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(0.072, 0, fd.z);
      fingerGroup.rotation.y = fd.curlY;
      fingerGroup.rotation.z = fd.curlZ;

      // Proximal phalanx (extending in +X)
      const proxGeo = new THREE.CapsuleGeometry(fd.radius, fd.len * 0.52, 8, 12);
      proxGeo.rotateZ(Math.PI / 2);
      const proxMesh = new THREE.Mesh(proxGeo, suitFabricMaterial);
      proxMesh.position.set(fd.len * 0.26, 0, 0);
      fingerGroup.add(proxMesh);

      // Distal phalanx (curled gently inward)
      const distGroup = new THREE.Group();
      distGroup.position.set(fd.len * 0.52, 0, 0);
      distGroup.rotation.y = fd.curlY * 1.2;
      distGroup.rotation.z = -0.20;

      const distGeo = new THREE.CapsuleGeometry(fd.radius * 0.90, fd.len * 0.44, 8, 12);
      distGeo.rotateZ(Math.PI / 2);
      const distMesh = new THREE.Mesh(distGeo, suitFabricMaterial);
      distMesh.position.set(fd.len * 0.22, 0, 0);
      distGroup.add(distMesh);

      // Silicone fingertip pad
      const tipGeo = new THREE.SphereGeometry(fd.radius * 0.92, 8, 8);
      const tipMesh = new THREE.Mesh(tipGeo, siliconeGripMaterial);
      tipMesh.position.set(fd.len * 0.40, -fd.radius * 0.25, 0);
      distGroup.add(tipMesh);

      fingerGroup.add(distGroup);
      handGroup.add(fingerGroup);
    });

    // Spacesuit Thumb (Opposed on near side, pointing inward/downward)
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(0.030, -0.018, 0.034);
    thumbGroup.rotation.set(-0.25, 0.35, -0.28);

    const thumbGeo = new THREE.CapsuleGeometry(0.011, 0.044, 8, 12);
    thumbGeo.rotateZ(Math.PI / 2);
    const thumbMesh = new THREE.Mesh(thumbGeo, suitFabricMaterial);
    thumbMesh.position.set(0.022, 0, 0);
    thumbGroup.add(thumbMesh);

    const thumbTipGeo = new THREE.SphereGeometry(0.010, 8, 8);
    const thumbTipMesh = new THREE.Mesh(thumbTipGeo, siliconeGripMaterial);
    thumbTipMesh.position.set(0.042, -0.003, 0);
    thumbGroup.add(thumbTipMesh);

    handGroup.add(thumbGroup);

    // Assemble all components into root arm group
    this.group.add(forearmGroup);
    this.group.add(handGroup);
    this.group.add(wristDeviceGroup);
  }

  /**
   * Updates the wrist arm position, animations, and renders canvas display
   */
  public update(delta: number, playerState: PlayerState) {
    this.pulseTimer += delta * 4;

    // Smooth exponential damping toward raised/lowered target
    const target = this.isRaised ? 1 : 0;
    this.currentProgress = THREE.MathUtils.damp(
      this.currentProgress,
      target,
      12.0, // Snappy yet weighty spacesuit arm transition
      delta
    );

    // Interpolate position and rotation
    this.group.position.lerpVectors(this.LOWERED_POS, this.RAISED_POS, this.currentProgress);

    const targetEuler = new THREE.Euler(
      THREE.MathUtils.lerp(this.LOWERED_ROT.x, this.RAISED_ROT.x, this.currentProgress),
      THREE.MathUtils.lerp(this.LOWERED_ROT.y, this.RAISED_ROT.y, this.currentProgress),
      THREE.MathUtils.lerp(this.LOWERED_ROT.z, this.RAISED_ROT.z, this.currentProgress),
      'YXZ'
    );
    this.group.rotation.copy(targetEuler);

    // Subtle breathing / walking inertia sway when raised
    if (this.currentProgress > 0.05) {
      this.swayTimer += delta * (playerState.isMoving ? 7 : 2);
      const swayAmplitude = playerState.isMoving ? 0.0035 : 0.0012;
      this.group.position.y += Math.sin(this.swayTimer) * swayAmplitude;
      this.group.position.x += Math.cos(this.swayTimer * 0.5) * (swayAmplitude * 0.7);
    }

    // Dynamic light intensity and tint
    if (this.screenLight) {
      if (this.rechargeState === 'CHARGING') {
        const chargePulse = 0.5 + Math.sin(this.pulseTimer * 8) * 0.25;
        this.screenLight.intensity = chargePulse * this.currentProgress;
        this.screenLight.color.setHex(0x00e5ff);
      } else if (this.rechargeState === 'RECHARGE_READY') {
        const armedPulse = 0.4 + Math.sin(this.pulseTimer * 6) * 0.2;
        this.screenLight.intensity = armedPulse * this.currentProgress;
        this.screenLight.color.setHex(0x38bdf8);
      } else if (this.rechargeState === 'COMPLETE') {
        this.screenLight.intensity = 0.6 * this.currentProgress;
        this.screenLight.color.setHex(0x34d399);
      } else if (playerState.emergencyCountdown !== null) {
        const emergencyFlash = Math.sin(this.pulseTimer * 3) > 0 ? 0.7 : 0.15;
        this.screenLight.intensity = emergencyFlash * this.currentProgress;
        this.screenLight.color.setHex(0xef4444);
      } else {
        this.screenLight.intensity = 0.35 * this.currentProgress;
        this.screenLight.color.setHex(0x00e5ff);
      }
    }

    // Determine if screen redraw is needed
    const now = performance.now();
    const needsRedraw =
      Math.abs(playerState.energy - this.lastDrawnState.energy) > 0.4 ||
      Math.abs(playerState.oxygen - this.lastDrawnState.oxygen) > 0.5 ||
      playerState.energyCharges !== this.lastDrawnState.charges ||
      playerState.emergencyCountdown !== this.lastDrawnState.emergencyCountdown ||
      this.isRaised !== this.lastDrawnState.isRaised ||
      this.isButtonHovered !== this.lastDrawnState.hovered ||
      this.rechargeState !== this.lastDrawnState.rechargeState ||
      (this.rechargeState === 'CHARGING' && Math.abs(this.chargingEnergy - this.lastDrawnState.chargingEnergy) > 0.2) ||
      (this.rechargeState === 'RECHARGE_READY' && now - this.lastRedrawTimestamp > 50) ||
      (playerState.emergencyCountdown !== null && now - this.lastRedrawTimestamp > 80) ||
      (this.isRaised && now - this.lastRedrawTimestamp > 100);

    if (needsRedraw) {
      this.renderScreenTexture(playerState);
      this.screenTexture.needsUpdate = true;
      this.lastRedrawTimestamp = now;

      this.lastDrawnState = {
        energy: playerState.energy,
        oxygen: playerState.oxygen,
        charges: playerState.energyCharges,
        emergencyCountdown: playerState.emergencyCountdown,
        isRaised: this.isRaised,
        rechargePulse: Math.sin(this.pulseTimer),
        hovered: this.isButtonHovered,
        rechargeState: this.rechargeState,
        chargingEnergy: this.chargingEnergy,
      };
    }
  }

  /**
   * Renders the high-tech Ares EVA Smartwatch display onto the 2D canvas
   */
  private renderScreenTexture(playerState: PlayerState) {
    const ctx = this.screenCtx;
    const w = 1024;
    const h = 1024;

    // 1. Dark AMOLED Hi-Tech Background
    ctx.fillStyle = '#060a10';
    ctx.fillRect(0, 0, w, h);

    // Subtle Hex Grid / Scanline Background
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.06)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer HUD Screen Frame
    ctx.strokeStyle = playerState.emergencyCountdown !== null ? '#ef4444' : '#0284c7';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Corner Tactical Brackets
    const bracketSize = 48;
    ctx.fillStyle = playerState.emergencyCountdown !== null ? '#ef4444' : '#38bdf8';
    // Top-left
    ctx.fillRect(24, 24, bracketSize, 6);
    ctx.fillRect(24, 24, 6, bracketSize);
    // Top-right
    ctx.fillRect(w - 24 - bracketSize, 24, bracketSize, 6);
    ctx.fillRect(w - 30, 24, 6, bracketSize);
    // Bottom-left
    ctx.fillRect(24, h - 30, bracketSize, 6);
    ctx.fillRect(24, h - 24 - bracketSize, 6, bracketSize);
    // Bottom-right
    ctx.fillRect(w - 24 - bracketSize, h - 30, bracketSize, 6);
    ctx.fillRect(w - 30, h - 24 - bracketSize, 6, bracketSize);

    // 2. HEADER BAR
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 40, w - 80, 75);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, w - 80, 75);

    // Header Title
    ctx.font = 'bold 26px "Space Mono", monospace, monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('ARES EVA // WRIST ENERGY MATRIX', 64, 86);

    // Stored Charges status tag
    const isArmed = this.rechargeState === 'RECHARGE_READY';
    ctx.font = 'bold 22px "Space Mono", monospace, monospace';
    ctx.fillStyle = isArmed ? '#fbbf24' : playerState.energyCharges > 0 ? '#38bdf8' : '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText(
      isArmed
        ? `[ ⚡ 1 ARMED IN VALVE  •  ${playerState.energyCharges} STORED ]`
        : `[ ${playerState.energyCharges} / ${SURVIVAL_CONFIG.MAX_ENERGY_CHARGES} ACTIVE CELLS ]`,
      w - 64,
      86
    );

    // 3. EXACTLY SIX VISIBLE CHARGE SLOTS (Main & only information on wrist energy screen)
    const maxCharges = SURVIVAL_CONFIG.MAX_ENERGY_CHARGES; // exactly 6
    const startY = 145;
    const cellHeight = 380;
    const cellSpacing = 16;
    const startX = 49;
    const cellWidth = 141;

    for (let i = 0; i < maxCharges; i++) {
      const cx = startX + i * (cellWidth + cellSpacing);
      const isFilled = i < playerState.energyCharges;
      const isArmedSlot = isArmed && i === playerState.energyCharges;

      if (isArmedSlot) {
        // ARMED CELL (Chambered in recharge valve)
        const grad = ctx.createLinearGradient(cx, startY, cx, startY + cellHeight);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(0.5, '#b45309');
        grad.addColorStop(1, '#78350f');

        ctx.fillStyle = grad;
        this.fillRoundRect(ctx, cx, startY, cellWidth, cellHeight, 16);

        // Pulsing amber border
        const pulse = Math.sin(this.pulseTimer * 6) > 0 ? 4 : 2.5;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = pulse;
        this.strokeRoundRect(ctx, cx, startY, cellWidth, cellHeight, 16);

        // Lightning glyph
        ctx.fillStyle = '#ffffff';
        this.drawLightningBolt(ctx, cx + cellWidth / 2, startY + 120, 38);

        ctx.font = 'bold 22px "Space Mono", monospace, monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`CELL 0${i + 1}`, cx + cellWidth / 2, startY + cellHeight - 55);

        ctx.font = 'bold 16px "Space Mono", monospace, monospace';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('ARMED', cx + cellWidth / 2, startY + cellHeight - 25);
      } else if (isFilled) {
        // FILLED SLOT: Glowing subtly in cyan with professional sci-fi energy-cell styling
        // Metallic cyan gradient
        const grad = ctx.createLinearGradient(cx, startY, cx, startY + cellHeight);
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(0.3, '#0369a1');
        grad.addColorStop(0.7, '#075985');
        grad.addColorStop(1, '#082f49');

        // Subtle cyan outer glow
        ctx.shadowColor = 'rgba(0, 229, 255, 0.45)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = grad;
        this.fillRoundRect(ctx, cx, startY, cellWidth, cellHeight, 16);
        ctx.shadowBlur = 0; // Reset shadow

        // Neon cyan border
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        this.strokeRoundRect(ctx, cx, startY, cellWidth, cellHeight, 16);

        // Top and bottom metallic contact terminals
        ctx.fillStyle = '#bae6fd';
        this.fillRoundRect(ctx, cx + 36, startY + 8, cellWidth - 72, 8, 4);
        this.fillRoundRect(ctx, cx + 36, startY + cellHeight - 16, cellWidth - 72, 8, 4);

        // Inner glowing plasma core capsule
        const coreX = cx + 20;
        const coreY = startY + 45;
        const coreW = cellWidth - 40;
        const coreH = cellHeight - 140;

        const coreGrad = ctx.createLinearGradient(coreX, coreY, coreX, coreY + coreH);
        coreGrad.addColorStop(0, '#38bdf8');
        coreGrad.addColorStop(0.5, '#00e5ff');
        coreGrad.addColorStop(1, '#0284c7');

        ctx.fillStyle = coreGrad;
        this.fillRoundRect(ctx, coreX, coreY, coreW, coreH, 12);

        // Subtle cyan energy capacitor pulse
        const innerGlow = 0.85 + Math.sin(this.pulseTimer * 3 + i) * 0.15;
        ctx.strokeStyle = `rgba(255, 255, 255, ${innerGlow * 0.8})`;
        ctx.lineWidth = 2;
        this.strokeRoundRect(ctx, coreX, coreY, coreW, coreH, 12);

        // Glowing high-voltage lightning glyph
        ctx.fillStyle = '#ffffff';
        this.drawLightningBolt(ctx, cx + cellWidth / 2, coreY + coreH / 2, 40);

        // Cell number
        ctx.font = 'bold 22px "Space Mono", monospace, monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`CELL 0${i + 1}`, cx + cellWidth / 2, startY + cellHeight - 55);

        // Status
        ctx.font = 'bold 16px "Space Mono", monospace, monospace';
        ctx.fillStyle = '#7dd3fc';
        ctx.fillText('FILLED', cx + cellWidth / 2, startY + cellHeight - 25);
      } else {
        // EMPTY SLOT: Dark and visibly unfilled recessed socket
        ctx.fillStyle = '#070a11';
        this.fillRoundRect(ctx, cx, startY, cellWidth, cellHeight, 16);

        // Dark dashed border
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        this.strokeRoundRect(ctx, cx, startY, cellWidth, cellHeight, 16);
        ctx.setLineDash([]);

        // Empty recessed chamber
        const coreX = cx + 20;
        const coreY = startY + 45;
        const coreW = cellWidth - 40;
        const coreH = cellHeight - 140;

        ctx.fillStyle = '#0c1017';
        this.fillRoundRect(ctx, coreX, coreY, coreW, coreH, 10);
        ctx.strokeStyle = '#161e2e';
        ctx.lineWidth = 1.5;
        this.strokeRoundRect(ctx, coreX, coreY, coreW, coreH, 10);

        // Empty socket contacts
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx + cellWidth / 2 - 12, coreY + coreH / 2 - 2, 24, 4);

        // Slot number
        ctx.font = 'bold 20px "Space Mono", monospace, monospace';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText(`SLOT 0${i + 1}`, cx + cellWidth / 2, startY + cellHeight - 55);

        // Status
        ctx.font = 'bold 15px "Space Mono", monospace, monospace';
        ctx.fillStyle = '#334155';
        ctx.fillText('EMPTY', cx + cellWidth / 2, startY + cellHeight - 25);
      }
    }

    // 4. PHYSICAL-LOOKING TACTILE RECHARGE BUTTON (Preserved Recharge Functionality)
    const buttonY = 575;
    const btnWidth = w - 98;
    const btnHeight = 150;
    const btnX = 49;

    if (this.rechargeState === 'RECHARGE_READY') {
      // STEP 2 & 3: ARMED RECHARGE READY STATE
      this.activePhysicalBtnBounds = { yMin: buttonY, yMax: buttonY + 115 };
      this.activeCancelBtnBounds = { yMin: buttonY + 128, yMax: buttonY + 185 };

      const pulseSin = Math.sin(this.pulseTimer * 6);
      const isHovered = this.isButtonHovered;
      const btnGrad = ctx.createLinearGradient(btnX, buttonY, btnX, buttonY + 110);
      btnGrad.addColorStop(0, isHovered ? '#38bdf8' : '#0284c7');
      btnGrad.addColorStop(1, isHovered ? '#0284c7' : '#0369a1');

      ctx.fillStyle = btnGrad;
      this.fillRoundRect(ctx, btnX, buttonY, btnWidth, 110, 18);

      // Glowing pulsing highlight
      ctx.strokeStyle = pulseSin > 0 ? '#38bdf8' : '#67e8f9';
      ctx.lineWidth = 4 + (pulseSin > 0 ? 2 : 0);
      this.strokeRoundRect(ctx, btnX, buttonY, btnWidth, 110, 18);

      // Icon & Instructions
      ctx.fillStyle = '#ffffff';
      this.drawLightningBolt(ctx, btnX + 55, buttonY + 55, 36);

      ctx.font = 'bold 28px "Space Mono", monospace, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText('⚡ PRESS WRIST RECHARGE BUTTON', btnX + 105, buttonY + 48);

      ctx.font = 'bold 17px "Space Mono", monospace, monospace';
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('CLICK PHYSICAL BUTTON (STEP 3) — RESTORE 100% SUIT BATTERY', btnX + 105, buttonY + 84);

      // Cancel button below
      const cancelY = buttonY + 128;
      ctx.fillStyle = '#1e1b24';
      this.fillRoundRect(ctx, btnX, cancelY, btnWidth, 48, 12);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      this.strokeRoundRect(ctx, btnX, cancelY, btnWidth, 48, 12);

      ctx.font = 'bold 18px "Space Mono", monospace, monospace';
      ctx.fillStyle = '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText('✕ CANCEL RECHARGE (RESTORE ARMED CHARGE)', w / 2, cancelY + 31);
    } else if (this.rechargeState === 'CHARGING') {
      // STEP 4: CHARGING ANIMATION
      const btnGrad = ctx.createLinearGradient(btnX, buttonY, btnX, buttonY + btnHeight);
      btnGrad.addColorStop(0, '#042f2e');
      btnGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = btnGrad;
      this.fillRoundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 20);

      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 4;
      this.strokeRoundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 20);

      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 30px "Space Mono", monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ INJECTING PLASMA CORE... [ ${Math.round(this.chargingEnergy)}% ]`, w / 2, buttonY + 54);

      // Animated progress fill inside button
      const cBarW = btnWidth - 80;
      const cBarH = 26;
      const cBarX = (w - cBarW) / 2;
      const cBarY = buttonY + 85;

      ctx.fillStyle = '#080d15';
      ctx.fillRect(cBarX, cBarY, cBarW, cBarH);

      const fillW = Math.max(0, Math.min(cBarW, cBarW * this.chargingProgress));
      const fillGrad = ctx.createLinearGradient(cBarX, cBarY, cBarX + fillW, cBarY);
      fillGrad.addColorStop(0, '#0284c7');
      fillGrad.addColorStop(1, '#00e5ff');
      ctx.fillStyle = fillGrad;
      ctx.fillRect(cBarX, cBarY, fillW, cBarH);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(cBarX, cBarY, cBarW, cBarH);
    } else if (this.rechargeState === 'COMPLETE') {
      // STEP 4 COMPLETION STATE
      const btnGrad = ctx.createLinearGradient(btnX, buttonY, btnX, buttonY + btnHeight);
      btnGrad.addColorStop(0, '#064e3b');
      btnGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = btnGrad;
      this.fillRoundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 20);

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      this.strokeRoundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 20);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 32px "Space Mono", monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✔ ENERGY RESTORED — 100%', w / 2, buttonY + 65);

      ctx.font = 'bold 18px "Space Mono", monospace, monospace';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('ALL EVA SUIT SYSTEMS OPERATING AT PEAK EFFICIENCY', w / 2, buttonY + 105);
    } else if (playerState.energyCharges > 0) {
      // IDLE STATE WITH CHARGES AVAILABLE
      this.activePhysicalBtnBounds = { yMin: buttonY, yMax: buttonY + btnHeight };

      const btnGrad = ctx.createLinearGradient(btnX, buttonY, btnX, buttonY + btnHeight);
      btnGrad.addColorStop(0, this.isButtonHovered ? '#38bdf8' : '#0284c7');
      btnGrad.addColorStop(1, this.isButtonHovered ? '#0284c7' : '#0369a1');

      ctx.fillStyle = btnGrad;
      this.fillRoundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 20);

      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 4;
      this.strokeRoundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 20);

      ctx.fillStyle = '#ffffff';
      this.drawLightningBolt(ctx, btnX + 70, buttonY + 75, 42);

      ctx.font = 'bold 32px "Space Mono", monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('RECHARGE SUIT BATTERY (100%)', btnX + 120, buttonY + 68);

      ctx.font = 'bold 20px "Space Mono", monospace, monospace';
      ctx.fillStyle = '#bae6fd';
      ctx.fillText(
        `CONSUMES 1 OF ${playerState.energyCharges} CHARGES  •  [CLICK BUTTON OR PRESS C]`,
        btnX + 120,
        buttonY + 105
      );
    } else {
      // Disabled / depleted state
      this.activePhysicalBtnBounds = { yMin: buttonY, yMax: buttonY + btnHeight };

      ctx.fillStyle = '#1e1b2e';
      this.fillRoundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 20);

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      this.strokeRoundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 20);

      ctx.font = 'bold 30px "Space Mono", monospace, monospace';
      ctx.fillStyle = '#f87171';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ POWER CHARGES DEPLETED (0/6)', w / 2, buttonY + 66);

      ctx.font = 'bold 18px "Space Mono", monospace, monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('SAMPLE ANOMALIES & SOLAR RELICS TO RESTOCK CHARGES', w / 2, buttonY + 104);
    }

    // 5. MINIMAL NAVIGATION FOOTER
    const footerY = h - 90;
    ctx.fillStyle = '#080e18';
    ctx.fillRect(49, footerY, w - 98, 48);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.strokeRect(49, footerY, w - 98, 48);

    ctx.font = 'bold 16px "Space Mono", monospace, monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('[CLICK FILLED SLOT OR BUTTON TO RECHARGE]', 68, footerY + 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('[E] OR [ESC] TO LOWER WRIST', w - 68, footerY + 30);
  }

  private fillRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  private strokeRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
  }

  private drawLightningBolt(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number
  ) {
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.1, cy - size * 0.6);
    ctx.lineTo(cx - size * 0.45, cy);
    ctx.lineTo(cx - size * 0.05, cy);
    ctx.lineTo(cx - size * 0.25, cy + size * 0.6);
    ctx.lineTo(cx + size * 0.45, cy - size * 0.05);
    ctx.lineTo(cx + size * 0.05, cy - size * 0.05);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Raycast check against the wrist device screen plane
   */
  public handlePointerClick(camera: THREE.Camera, clientX: number, clientY: number): boolean {
    if (!this.isRaised || this.currentProgress < 0.75) {
      return false;
    }

    this.mouseCoords.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouseCoords.y = -(clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseCoords, camera);
    const intersects = this.raycaster.intersectObject(this.screenMesh, false);

    if (intersects.length > 0) {
      const uv = intersects[0].uv;
      if (uv) {
        // uv.y is flipped in Canvas coordinates (uv.y=1 is top, uv.y=0 is bottom)
        const canvasY = (1 - uv.y) * 1024;

        // 1. In RECHARGE_READY: Check physical button (Step 3) or cancel button
        if (this.rechargeState === 'RECHARGE_READY') {
          // Physical button area (Step 3)
          if (canvasY >= this.activePhysicalBtnBounds.yMin && canvasY <= this.activePhysicalBtnBounds.yMax) {
            if (this.onPhysicalButtonCallback) {
              this.onPhysicalButtonCallback();
            }
            return true;
          }
          // Cancel armed charge button
          if (canvasY >= this.activeCancelBtnBounds.yMin && canvasY <= this.activeCancelBtnBounds.yMax) {
            if (this.onCancelArmCallback) {
              this.onCancelArmCallback();
            }
            return true;
          }
          return true; // absorb click on screen
        }

        // 2. In CHARGING or COMPLETE: absorb click
        if (this.rechargeState === 'CHARGING' || this.rechargeState === 'COMPLETE') {
          return true;
        }

        // 3. In IDLE:
        // Check 6 slots area (canvasY 145 to 525)
        if (canvasY >= 145 && canvasY <= 525) {
          const canvasX = uv.x * 1024;
          const slotIdx = Math.floor((canvasX - 49) / (141 + 16));
          const currentCharges = this.lastDrawnState.charges;
          // If clicked a filled charge slot, initiate confirmation flow
          if (slotIdx >= 0 && slotIdx < 6 && slotIdx < currentCharges) {
            if (this.onSelectChargeCallback) {
              this.onSelectChargeCallback();
            } else if (this.onRechargeCallback) {
              this.onRechargeCallback();
            }
            return true;
          } else if (slotIdx >= 0 && slotIdx < 6) {
            // Clicked an empty slot
            marsAudio.playComponentSelect();
            return true;
          } else if (currentCharges > 0) {
            if (this.onSelectChargeCallback) {
              this.onSelectChargeCallback();
            }
            return true;
          }
          return true;
        }

        // Check RECHARGE button area (canvasY 575 to 730)
        if (canvasY >= 575 && canvasY <= 730) {
          if (this.lastDrawnState.charges > 0) {
            if (this.onSelectChargeCallback) {
              this.onSelectChargeCallback();
            } else if (this.onRechargeCallback) {
              this.onRechargeCallback();
            }
          } else {
            marsAudio.playComponentSelect();
          }
          return true;
        }
        return true; // absorb click anywhere on active wrist screen
      }
    }

    return false;
  }

  /**
   * Raycast check for hover state when pointer is unlocked
   */
  public handlePointerMove(camera: THREE.Camera, clientX: number, clientY: number): boolean {
    if (!this.isRaised || this.currentProgress < 0.75) {
      if (this.isButtonHovered) {
        this.isButtonHovered = false;
      }
      return false;
    }

    this.mouseCoords.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouseCoords.y = -(clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseCoords, camera);
    const intersects = this.raycaster.intersectObject(this.screenMesh, false);

    if (intersects.length > 0) {
      const uv = intersects[0].uv;
      if (uv) {
        const canvasY = (1 - uv.y) * 1024;
        let hovered = false;
        if (this.rechargeState === 'RECHARGE_READY') {
          hovered =
            (canvasY >= this.activePhysicalBtnBounds.yMin && canvasY <= this.activePhysicalBtnBounds.yMax) ||
            (canvasY >= this.activeCancelBtnBounds.yMin && canvasY <= this.activeCancelBtnBounds.yMax);
        } else if (this.rechargeState === 'IDLE') {
          const inSlots = canvasY >= 145 && canvasY <= 525;
          const inButton = canvasY >= 575 && canvasY <= 730;
          hovered = inSlots || inButton;
        }
        if (this.isButtonHovered !== hovered) {
          this.isButtonHovered = hovered;
        }
        return true;
      }
    }

    if (this.isButtonHovered) {
      this.isButtonHovered = false;
    }
    return false;
  }

  public dispose() {
    this.screenTexture.dispose();
  }
}
