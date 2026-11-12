import * as THREE from 'three';
import { getTerrainHeight } from './terrain';
import { ALL_ARTIFACTS, ARTIFACT_LIST, Artifact } from '../data/artifacts';
import { marsAudio } from './audio';
import { SURVIVAL_CONFIG, getEnergySpeedStage } from '../data/survivalConfig';

export type ScannerDetectionStage =
  | 'no_signal'
  | 'weak_anomaly'
  | 'human_signal'
  | 'identified'
  | 'locked';

export interface ScannerTelemetry {
  target: string;
  signatureType: string;
  distance: number;
  bearingDeg: number;
  relativeDirectionStr: string;
  confidence: number;
  isIdentified: boolean;
  stage: ScannerDetectionStage;
}

export interface ControllerPlanetConfig {
  planet?: 'mars' | 'moon';
  gravity?: number;
  jumpForce?: number;
  walkSpeed?: number;
  sprintSpeed?: number;
  artifacts?: Artifact[];
  getTerrainHeight?: (x: number, z: number) => number;
  baseLat?: number;
  baseLon?: number;
  missionSolPrefix?: string;
  initialPlayerState?: {
    position?: { x: number; y: number; z: number };
    yaw?: number;
    pitch?: number;
    oxygen?: number;
    energy?: number;
    life?: number;
    energyCharges?: number;
    elapsedTimeSec?: number;
  } | null;
}

export interface RoverSimCoords {
  latStr: string;
  lonStr: string;
  altitudeM: number;
  x: number;
  y: number;
  z: number;
}

export interface ActiveArtifactTelemetry {
  id: string;
  name: string;
  designation: string;
  site: string;
  type: 'rover' | 'stationary_lander' | 'helicopter';
  distance: number;
  bearingDeg: number;
  relativeDirectionStr: string;
  confidence: number;
  isIdentified: boolean;
  isVisualContact: boolean;
  isClose: boolean;
  isLocked: boolean;
  stage: ScannerDetectionStage;
  worldPosition: { x: number; y: number; z: number };
}

export interface PlayerState {
  position: THREE.Vector3;
  headingDeg: number;
  pitchDeg: number;
  isMoving: boolean;
  isSprinting: boolean;
  isGrounded: boolean;
  speed: number;
  distanceFromStart: number;
  baseBearingDeg: number;
  isAtLandingBase: boolean;

  // Active nearest artifact tracking
  activeArtifact: ActiveArtifactTelemetry;

  // Legacy compatibility fields (mirrors active artifact)
  distanceToRover: number;
  bearingToRoverDeg: number;
  isTargetLocked: boolean;
  isCloseToRover: boolean;

  latStr: string;
  lonStr: string;
  altitudeM: number;

  // Real-time gameplay systems
  oxygen: number;
  isOxygenLow: boolean;
  isOxygenCritical: boolean;
  energy: number;
  isEnergyLow: boolean;
  isEnergyDepleted: boolean;
  life: number;
  signal: number;
  scannerActive: boolean;
  scannerTelemetry: ScannerTelemetry;

  // EVA Survival & Energy Inventory
  energyCharges: number;
  maxEnergyCharges: number;
  energySpeedMultiplier: number;
  energySpeedStageLabel: string;
  emergencyCountdown: number | null;
  emergencyGracePeriodSec: number;

  // Mission timeline and resource metrics
  elapsedTimeSec: number;
  missionSolStr: string;
  scannerEnergyConsumed: number;
  roverSimCoords: RoverSimCoords;
}

export class FirstPersonController {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  // Position & physics
  public position: THREE.Vector3;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private verticalVelocity: number = 0;
  private isGrounded: boolean = true;
  private headBobTimer: number = 0;
  private landingCushion: number = 0;

  // View angles (radians)
  private yaw: number = 0;
  private pitch: number = 0;

  // Pointer lock state
  public isLocked: boolean = false;
  private onLockChangeCallback?: (locked: boolean) => void;
  private mouseSensitivityMultiplier: number = 1.0;

  public setMouseSensitivity(multiplier: number) {
    this.mouseSensitivityMultiplier = Math.max(0.2, Math.min(3.0, multiplier));
  }

  // Key states
  private keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
  };

  // Systems State
  public oxygen: number = 100;
  public energy: number = 100;
  public life: number = 100;
  public scannerActive: boolean = false;
  public scannerEnergyConsumed: number = 0;
  public elapsedTimeSec: number = 0;
  private inputEnabled: boolean = true;

  // Authoritative Energy Charge Inventory & Survival Grace Period
  public energyCharges: number = SURVIVAL_CONFIG.STARTING_ENERGY_CHARGES;
  public emergencyCountdown: number | null = null;

  /**
   * Consumes exactly 1 energy charge to restore suit battery to 100% capacity
   * Immediately clears zero-energy emergency grace countdown
   */
  public useEnergyCharge(): boolean {
    if (this.energyCharges <= 0) {
      return false;
    }
    this.energyCharges = Math.max(0, this.energyCharges - 1);
    this.energy = 100;
    this.emergencyCountdown = null;
    marsAudio.playEnergyRecharge();
    return true;
  }

  /**
   * Step 2 of Recharge Flow: Arms 1 energy charge without immediately restoring energy.
   * Returns true if charge was successfully deducted, false if insufficient charges.
   */
  public armEnergyCharge(): boolean {
    if (this.energyCharges <= 0) {
      return false;
    }
    this.energyCharges = Math.max(0, this.energyCharges - 1);
    return true;
  }

  /**
   * Safe cancellation of armed charge: restores 1 charge back to inventory.
   */
  public disarmEnergyCharge(): void {
    this.energyCharges = Math.min(
      SURVIVAL_CONFIG.MAX_ENERGY_CHARGES,
      this.energyCharges + 1
    );
  }

  /**
   * Immediately cancels zero-energy emergency grace countdown when recharge begins.
   */
  public cancelEmergencyCountdown(): void {
    this.emergencyCountdown = null;
  }

  /**
   * Sets current energy value directly (used during smooth charging animation)
   */
  public setEnergy(value: number): void {
    this.energy = Math.max(0, Math.min(100, value));
    if (this.energy > 0) {
      this.emergencyCountdown = null;
    }
  }

  private onRequestRechargeCallback?: () => void;
  private energyDrainMultiplier: number = 1.0;

  public setOnRequestRecharge(cb: () => void) {
    this.onRequestRechargeCallback = cb;
  }

  public setEnergyDrainMultiplier(multiplier: number) {
    this.energyDrainMultiplier = Math.max(0.2, Math.min(3.0, multiplier));
  }

  public getEnergyDrainMultiplier(): number {
    return this.energyDrainMultiplier;
  }

  public resetChargesToDefault() {
    this.energyCharges = SURVIVAL_CONFIG.STARTING_ENERGY_CHARGES;
  }

  /**
   * Safely adds energy charges up to MAX_ENERGY_CHARGES (clamped [0, 6]).
   * Strictly enforces the maximum cap and returns outcome details.
   */
  public addEnergyCharge(amount: number = 1): {
    awarded: boolean;
    chargesAdded: number;
    newCount: number;
    isFull: boolean;
    previousCount: number;
  } {
    const prev = this.energyCharges;
    if (prev >= SURVIVAL_CONFIG.MAX_ENERGY_CHARGES) {
      return {
        awarded: false,
        chargesAdded: 0,
        newCount: prev,
        isFull: true,
        previousCount: prev,
      };
    }
    const next = Math.min(SURVIVAL_CONFIG.MAX_ENERGY_CHARGES, prev + amount);
    const added = next - prev;
    this.energyCharges = next;
    return {
      awarded: added > 0,
      chargesAdded: added,
      newCount: next,
      isFull: next >= SURVIVAL_CONFIG.MAX_ENERGY_CHARGES,
      previousCount: prev,
    };
  }

  // Edge-triggered audio state machine for artifact proximity stages
  private proximityAudioState: {
    artifactId: string | null;
    stage: 'outside' | 'visual_contact' | 'target_locked';
  } = {
    artifactId: null,
    stage: 'outside',
  };

  // Astronaut Spacesuit Physics Constants
  private readonly EYE_HEIGHT = 1.75;
  private readonly WALK_SPEED = 4.0; // m/s (~14.4 km/h brisk EVA stride)
  private readonly SPRINT_SPEED = 7.2; // m/s (~26 km/h EVA propulsion sprint)
  private readonly ACCELERATION = 16.0; // Responsive, intentional spacesuit stride
  private readonly FRICTION = 16.0; // Firm regolith grip without slippery sliding

  // Configurable Planet Constants (Defaults calibrated to Mars)
  public planet: 'mars' | 'moon' = 'mars';
  private gravityVal: number = 5.8; // 0.38g gives sustained, buoyant arcs
  private jumpForceVal: number = 4.4; // Controlled, lofty low-gravity hop
  private terrainHeightFn: (x: number, z: number) => number = getTerrainHeight;
  private artifactsList: Artifact[] = ARTIFACT_LIST;
  private baseLatVal: number = 18.4412;
  private baseLonVal: number = 77.4589;
  private missionSolPrefix: string = 'SOL 01';

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    config?: ControllerPlanetConfig
  ) {
    this.camera = camera;
    this.domElement = domElement;

    if (config?.planet) this.planet = config.planet;
    if (config?.gravity !== undefined) {
      this.gravityVal = config.gravity;
    } else if (this.planet === 'moon') {
      this.gravityVal = 1.62; // Accurate lunar gravity: 1.62 m/s² (1/6th g)
    }
    if (config?.jumpForce !== undefined) {
      this.jumpForceVal = config.jumpForce;
    } else if (this.planet === 'moon') {
      this.jumpForceVal = 3.2; // Majestic, controllable lunar hop
    }
    if (config?.getTerrainHeight) {
      this.terrainHeightFn = config.getTerrainHeight;
    }
    if (config?.artifacts) {
      this.artifactsList = config.artifacts;
    }
    if (config?.baseLat !== undefined) {
      this.baseLatVal = config.baseLat;
    } else if (this.planet === 'moon') {
      this.baseLatVal = 0.6741; // Mare Tranquillitatis
    }
    if (config?.baseLon !== undefined) {
      this.baseLonVal = config.baseLon;
    } else if (this.planet === 'moon') {
      this.baseLonVal = 23.4730;
    }
    if (config?.missionSolPrefix) {
      this.missionSolPrefix = config.missionSolPrefix;
    } else if (this.planet === 'moon') {
      this.missionSolPrefix = 'LUNAR DAY 01';
    }

    // Start player at saved position or default landing base (0, 0)
    const saved = config?.initialPlayerState;
    if (saved?.position) {
      this.position = new THREE.Vector3(saved.position.x, saved.position.y, saved.position.z);
      this.camera.position.copy(this.position);
      if (saved.yaw !== undefined) this.yaw = saved.yaw;
      if (saved.pitch !== undefined) this.pitch = saved.pitch;
      if (saved.oxygen !== undefined) this.oxygen = saved.oxygen;
      if (saved.energy !== undefined) this.energy = saved.energy;
      if (saved.life !== undefined) this.life = saved.life;
      if (saved.energyCharges !== undefined) this.energyCharges = saved.energyCharges;
      if (saved.elapsedTimeSec !== undefined) this.elapsedTimeSec = saved.elapsedTimeSec;
    } else {
      const startY = this.terrainHeightFn(0, 0);
      this.position = new THREE.Vector3(0, startY + this.EYE_HEIGHT, 0);
      this.camera.position.copy(this.position);
      this.yaw = Math.PI * 0.76;
    }
    this.updateCameraRotation();

    this.bindEvents();
  }

  public get isPointerLocked(): boolean {
    return this.isLocked;
  }

  public setInputEnabled(enabled: boolean) {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
      this.keys.sprint = false;
      this.keys.jump = false;
      this.velocity.set(0, 0, 0);
    }
  }

  public getInputEnabled(): boolean {
    return this.inputEnabled;
  }

  public setOnLockChange(callback: (locked: boolean) => void) {
    this.onLockChangeCallback = callback;
  }

  public requestLock() {
    this.domElement.requestPointerLock();
    marsAudio.init();
    marsAudio.resume();
  }

  public unlock() {
    document.exitPointerLock();
  }

  public toggleScanner(): boolean {
    if (this.energy <= 2 && !this.scannerActive) {
      return false;
    }
    this.scannerActive = !this.scannerActive;
    marsAudio.playScannerToggle(this.scannerActive);
    return this.scannerActive;
  }

  public teleportToLanding() {
    const startY = this.terrainHeightFn(0, 0);
    this.position.set(0, startY + this.EYE_HEIGHT, 0);
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.yaw = Math.PI * 0.76;
    this.pitch = 0;
    this.oxygen = 100; // Replenish at base
    this.energy = 100;
    this.emergencyCountdown = null;
    this.proximityAudioState = {
      artifactId: null,
      stage: 'outside',
    };
    this.updateCameraRotation();
    marsAudio.playFootstep();
  }

  public restartMission() {
    this.teleportToLanding();
    this.oxygen = 100;
    this.energy = 100;
    this.life = 100;
    // Guaranteed starting charges on restart
    this.energyCharges = Math.max(this.energyCharges, SURVIVAL_CONFIG.STARTING_ENERGY_CHARGES);
    this.emergencyCountdown = null;
  }

  public resetPosition() {
    this.teleportToLanding();
  }

  public restorePlayerState(saved: {
    position?: { x: number; y: number; z: number };
    yaw?: number;
    pitch?: number;
    oxygen?: number;
    energy?: number;
    life?: number;
    energyCharges?: number;
    elapsedTimeSec?: number;
  }) {
    if (saved.position) {
      this.position.set(saved.position.x, saved.position.y, saved.position.z);
      this.camera.position.copy(this.position);
    }
    if (saved.yaw !== undefined) this.yaw = saved.yaw;
    if (saved.pitch !== undefined) this.pitch = saved.pitch;
    if (saved.oxygen !== undefined) this.oxygen = saved.oxygen;
    if (saved.energy !== undefined) this.energy = saved.energy;
    if (saved.life !== undefined) this.life = saved.life;
    if (saved.energyCharges !== undefined) this.energyCharges = saved.energyCharges;
    if (saved.elapsedTimeSec !== undefined) this.elapsedTimeSec = saved.elapsedTimeSec;
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.updateCameraRotation();
  }

  public getPlayerStateSnapshot() {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      yaw: this.yaw,
      pitch: this.pitch,
      oxygen: this.oxygen,
      energy: this.energy,
      life: this.life,
      energyCharges: this.energyCharges,
      elapsedTimeSec: this.elapsedTimeSec,
      savedAt: Date.now(),
    };
  }

  private boundPointerLockChange = () => {
    const locked = document.pointerLockElement === this.domElement;
    this.isLocked = locked;
    if (this.onLockChangeCallback) {
      this.onLockChangeCallback(locked);
    }
  };

  private boundMouseMove = (e: MouseEvent) => {
    if (!this.isLocked || !this.inputEnabled) return;

    const sensitivity = 0.0022 * this.mouseSensitivityMultiplier;
    this.yaw -= e.movementX * sensitivity;
    this.pitch -= e.movementY * sensitivity;

    // Restrict pitch (-85° to +85°)
    const maxPitch = (Math.PI / 2) * 0.94;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.updateCameraRotation();
  };

  private boundDomClick = () => {
    if (this.inputEnabled && !this.isLocked) {
      this.requestLock();
    }
  };

  private boundKeyDown = (e: KeyboardEvent) => {
    this.onKey(e.code, true);
  };

  private boundKeyUp = (e: KeyboardEvent) => {
    this.onKey(e.code, false);
  };

  private bindEvents() {
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    document.addEventListener('mousemove', this.boundMouseMove);
    this.domElement.addEventListener('click', this.boundDomClick);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  public dispose() {
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    document.removeEventListener('mousemove', this.boundMouseMove);
    this.domElement.removeEventListener('click', this.boundDomClick);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }

  private onKey(code: string, pressed: boolean) {
    if (!this.inputEnabled) return;
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = pressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = pressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = pressed;
        break;
      case 'Space':
        this.keys.jump = pressed;
        break;
      case 'KeyF':
        if (pressed) this.toggleScanner();
        break;
      case 'KeyC':
        if (pressed) {
          if (this.onRequestRechargeCallback) {
            this.onRequestRechargeCallback();
          } else {
            this.useEnergyCharge();
          }
        }
        break;
    }
  }

  private updateCameraRotation() {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);
  }

  public update(dt: number): PlayerState {
    const delta = Math.min(dt, 0.1);

    // If input is disabled (paused or modal open), prevent movement input
    if (!this.inputEnabled) {
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
      this.keys.sprint = false;
      this.keys.jump = false;
    }

    // 1. Calculate Input Directions Relative to View Yaw
    const moveVector = new THREE.Vector3();
    if (this.keys.forward) moveVector.z -= 1;
    if (this.keys.backward) moveVector.z += 1;
    if (this.keys.left) moveVector.x -= 1;
    if (this.keys.right) moveVector.x += 1;

    const isMovingInput = moveVector.lengthSq() > 0.001;
    if (isMovingInput) moveVector.normalize();

    // Rotate input by yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const desiredDirection = new THREE.Vector3()
      .addScaledVector(forward, -moveVector.z)
      .addScaledVector(right, moveVector.x);

    // 2. Sprinting & Energy Rules with 4-Stage Progressive Speed Degradation
    const wantsToSprint = this.keys.sprint && isMovingInput && this.energy > 3;
    const isActivelySprinting = wantsToSprint && this.isGrounded;

    const { multiplier: speedMultiplier, label: speedStageLabel } = getEnergySpeedStage(this.energy);
    const targetSpeed = (isActivelySprinting ? this.SPRINT_SPEED : this.WALK_SPEED) * speedMultiplier;

    const targetVelocity = desiredDirection.multiplyScalar(targetSpeed);

    // Smooth inertia acceleration and deceleration for heavy astronaut spacesuit
    const accelRate = isMovingInput ? this.ACCELERATION : this.FRICTION;
    this.velocity.lerp(targetVelocity, Math.min(1.0, accelRate * delta));

    // Jump Physics (Configured gravity & planetary leap)
    if (this.keys.jump && this.isGrounded && this.energy > SURVIVAL_CONFIG.ENERGY_DRAIN_JUMP) {
      this.verticalVelocity = this.jumpForceVal;
      this.isGrounded = false;
      this.energy = Math.max(0, this.energy - SURVIVAL_CONFIG.ENERGY_DRAIN_JUMP);
      marsAudio.playJump();
    }

    // Apply Planetary Gravity
    this.verticalVelocity -= this.gravityVal * delta;

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;
    this.position.y += this.verticalVelocity * delta;

    // Clamp to expanded 1000m planetary domain (-480m to +480m)
    const MAX_BOUND = 480;
    this.position.x = Math.max(-MAX_BOUND, Math.min(MAX_BOUND, this.position.x));
    this.position.z = Math.max(-MAX_BOUND, Math.min(MAX_BOUND, this.position.z));

    // Ground Collision Detection
    const groundY = this.terrainHeightFn(this.position.x, this.position.z);
    const targetGroundEyeLevel = groundY + this.EYE_HEIGHT;

    if (this.position.y <= targetGroundEyeLevel) {
      if (!this.isGrounded) {
        if (this.verticalVelocity < -1.6) {
          marsAudio.playLand();
          // Absorptive knee-bend cushion in heavy spacesuit under Mars gravity
          this.landingCushion = Math.min(0.08, Math.abs(this.verticalVelocity) * 0.016);
        }
      }
      this.position.y = targetGroundEyeLevel;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    // Recover landing cushion smoothly
    if (this.landingCushion > 0.001) {
      this.landingCushion = THREE.MathUtils.lerp(this.landingCushion, 0, Math.min(1.0, delta * 12));
    } else {
      this.landingCushion = 0;
    }

    // Camera Head Bobbing while walking
    const horizontalSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (this.isGrounded && horizontalSpeed > 0.3) {
      const bobFreq = isActivelySprinting ? 11.5 : 7.2;
      this.headBobTimer += delta * bobFreq;
      const bobAmount = isActivelySprinting ? 0.038 : 0.020;
      this.camera.position.y = this.position.y + Math.sin(this.headBobTimer) * bobAmount - this.landingCushion;

      // Natural footstep timing (paced for spacesuit locomotion)
      if (Math.sin(this.headBobTimer) < -0.94) {
        marsAudio.playFootstep(isActivelySprinting);
      }
    } else {
      this.headBobTimer = 0;
      this.camera.position.y = this.position.y - this.landingCushion;
    }

    this.camera.position.x = this.position.x;
    this.camera.position.z = this.position.z;

    // Check Safe Zone (Landing Site at (0, 0), radius 16m)
    const distanceFromStart = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    const isAtLandingBase = distanceFromStart < 16;

    // 4. Oxygen System Logic: strictly independent life-support
    if (isAtLandingBase) {
      // Safe base refills O₂ supply quickly
      this.oxygen = Math.min(100, this.oxygen + SURVIVAL_CONFIG.BASE_OXYGEN_RECHARGE_RATE * delta);
    } else {
      const o2Drain = isActivelySprinting
        ? SURVIVAL_CONFIG.OXYGEN_DRAIN_SPRINT
        : SURVIVAL_CONFIG.OXYGEN_DRAIN_WALK;
      this.oxygen = Math.max(0, this.oxygen - o2Drain * delta);
    }

    const isOxygenLow = this.oxygen < 25;
    const isOxygenCritical = this.oxygen < 10;

    // 5. Authoritative Energy System Logic
    this.elapsedTimeSec += delta;

    if (isAtLandingBase) {
      this.energy = Math.min(100, this.energy + SURVIVAL_CONFIG.BASE_ENERGY_RECHARGE_RATE * delta);
      this.emergencyCountdown = null;
      // Replenish emergency charges at base if depleted
      if (this.energyCharges < SURVIVAL_CONFIG.STARTING_ENERGY_CHARGES) {
        this.energyCharges = SURVIVAL_CONFIG.STARTING_ENERGY_CHARGES;
      }
    } else {
      // Active exploration battery consumption:
      // Passive suit life support + walking/sprinting + scanner
      let drain = SURVIVAL_CONFIG.ENERGY_DRAIN_PASSIVE * delta;
      if (isMovingInput) {
        drain += (isActivelySprinting ? SURVIVAL_CONFIG.ENERGY_DRAIN_SPRINT : SURVIVAL_CONFIG.ENERGY_DRAIN_WALK) * delta;
      }
      if (this.scannerActive) {
        const scannerDrain = SURVIVAL_CONFIG.ENERGY_DRAIN_SCANNER * delta;
        drain += scannerDrain;
        this.scannerEnergyConsumed += scannerDrain;
      }
      drain *= this.energyDrainMultiplier;
      this.energy = Math.max(0, this.energy - drain);

      // Automatic scanner shutdown on zero energy
      if (this.energy <= 0) {
        if (this.scannerActive) {
          this.scannerActive = false;
          marsAudio.playScannerToggle(false);
        }

        // Zero-Energy Survival Grace Period
        if (this.emergencyCountdown === null) {
          this.emergencyCountdown = SURVIVAL_CONFIG.EMERGENCY_GRACE_PERIOD_SEC;
          marsAudio.playEmergencyAlarm();
        } else {
          this.emergencyCountdown = Math.max(0, this.emergencyCountdown - delta);
          if (this.emergencyCountdown <= 6.0 && this.emergencyCountdown > 0) {
            marsAudio.playEmergencyAlarm();
          }
          if (this.emergencyCountdown <= 0) {
            // Grace period expired without battery recharge -> emergency life-support shutdown
            this.life = 0;
          }
        }
      } else {
        // Battery active -> clear emergency countdown
        this.emergencyCountdown = null;
      }
    }

    const isEnergyLow = this.energy < 30;
    const isEnergyDepleted = this.energy <= 0;

    // 6. Player Life Logic
    if (this.oxygen <= 0) {
      this.life = Math.max(0, this.life - SURVIVAL_CONFIG.OXYGEN_DEPLETION_HEALTH_DRAIN * delta);
    } else if (isAtLandingBase && this.life < 100) {
      this.life = Math.min(100, this.life + 8.0 * delta);
    }

    // 7. Distance & Communication Signal Calculations across 1000m
    // Signal ranges from 100% at base to ~22% at 450m perimeter
    const rawSignal = 100 - (distanceFromStart / 480) * 78;
    const signal = Math.max(15, Math.min(100, Math.round(rawSignal)));

    // 8. Find Closest Planet Artifact
    let activeArtifactData: Artifact = this.artifactsList[0] || ARTIFACT_LIST[0];
    let minArtifactDist = Infinity;

    this.artifactsList.forEach((art) => {
      const dist = Math.sqrt(
        (art.worldPosition.x - this.position.x) ** 2 +
        (art.worldPosition.z - this.position.z) ** 2
      );
      if (dist < minArtifactDist) {
        minArtifactDist = dist;
        activeArtifactData = art;
      }
    });

    const activeArtPos = activeArtifactData.worldPosition;
    const activeArtVec = new THREE.Vector3(activeArtPos.x, activeArtPos.y, activeArtPos.z);
    const distanceToActive = this.position.distanceTo(activeArtVec);

    // Bearing & Relative Vector
    // In Three.js, default view is North (-Z) at yaw = 0.
    // Moving mouse right decreases yaw (e.g. -PI/2 faces +X East = 90° compass bearing).
    // Correct compass heading in [0, 360) is (-yaw) in degrees.
    const currentHeadingDeg = (((-this.yaw * 180) / Math.PI) % 360 + 360) % 360;
    const currentPitchDeg = (this.pitch * 180) / Math.PI;

    const dx = activeArtPos.x - this.position.x;
    const dz = activeArtPos.z - this.position.z;
    const artAngleRad = Math.atan2(dx, -dz);
    const artBearingDeg = ((artAngleRad * 180) / Math.PI + 360) % 360;

    // Bearing back to Expedition Landing Base at (0, 0)
    const baseDx = -this.position.x;
    const baseDz = -this.position.z;
    const baseAngleRad = Math.atan2(baseDx, -baseDz);
    const baseBearingDeg = ((baseAngleRad * 180) / Math.PI + 360) % 360;

    const relativeAngle = ((artBearingDeg - currentHeadingDeg + 180) % 360) - 180;

    let relativeDirectionStr = 'AHEAD';
    if (Math.abs(relativeAngle) < 18) {
      relativeDirectionStr = 'AHEAD';
    } else if (relativeAngle >= 18 && relativeAngle < 75) {
      relativeDirectionStr = `${Math.round(relativeAngle)}° RIGHT`;
    } else if (relativeAngle >= 75 && relativeAngle < 135) {
      relativeDirectionStr = 'RIGHT FLANK';
    } else if (relativeAngle <= -18 && relativeAngle > -75) {
      relativeDirectionStr = `${Math.round(Math.abs(relativeAngle))}° LEFT`;
    } else if (relativeAngle <= -75 && relativeAngle > -135) {
      relativeDirectionStr = 'LEFT FLANK';
    } else {
      relativeDirectionStr = 'BEHIND';
    }

    // 9. PROGRESSIVE DETECTION STAGES (Strict spatial progression based on distance)
    // - Far (> 260m): NO SIGNIFICANT ANOMALY DETECTED (Confidence 0%)
    // - Medium (130m - 260m): WEAK ANOMALOUS SIGNATURE (Confidence 15–30%, bearing & approximate range)
    // - Close (85m - 130m): UNKNOWN ARTIFICIAL SIGNATURE (Confidence 35–60%)
    // - Close (48m - 85m): LIKELY HUMAN-MADE HARDWARE (Confidence 60–80%)
    // - Visual Contact (12m - 48m): ARTIFACT CLASSIFICATION (Confidence 80–90%, structural description)
    // - Proximity (< 12m): TARGET LOCKED with Mission Designation & Name
    let stage: ScannerDetectionStage = 'no_signal';
    let targetLabel = 'NO SIGNIFICANT ANOMALY DETECTED';
    let signatureType = 'AMBIENT MARTIAN BACKGROUND NOISE';
    let confidence = 0;
    let isIdentified = false;

    if (distanceToActive < 12) {
      stage = 'locked';
      targetLabel = `IDENTIFIED: ${activeArtifactData.designation} (${activeArtifactData.name.toUpperCase()})`;
      signatureType = `AUTHENTIC ${activeArtifactData.historical.agency.toUpperCase()} HARDWARE`;
      confidence = 99.8;
      isIdentified = true;
    } else if (distanceToActive <= 48) {
      stage = 'identified';
      targetLabel =
        activeArtifactData.type === 'stationary_lander'
          ? 'STATIONARY LANDER STRUCTURE'
          : activeArtifactData.type === 'helicopter'
          ? 'COMPACT AERIAL ROTORCRAFT AIRFRAME'
          : 'ROVER-LIKE MECHANICAL STRUCTURE';
      signatureType =
        activeArtifactData.type === 'stationary_lander'
          ? 'TRIPOD LANDING STRUTS & SOLAR BUS'
          : activeArtifactData.type === 'helicopter'
          ? 'COAXIAL ROTOR SYSTEM & AVIONICS CUBE'
          : 'GROUND MOBILITY ROCKER-BOGIE CHASSIS';
      confidence = Math.round(80 + (1.0 - (distanceToActive - 12) / 36) * 10);
      isIdentified = false; // Only structural classification, not yet identified as specific mission!
    } else if (distanceToActive <= 85) {
      stage = 'human_signal';
      targetLabel = 'LIKELY HUMAN-MADE HARDWARE';
      signatureType = 'ACTIVE / PASSIVE AVIONICS HARNESS';
      confidence = Math.round(60 + (1.0 - (distanceToActive - 48) / 37) * 20);
      isIdentified = false;
    } else if (distanceToActive <= 130) {
      stage = 'human_signal';
      targetLabel = 'UNKNOWN ARTIFICIAL SIGNATURE';
      signatureType = 'METALLIC COMPONENT / RF EMISSION';
      confidence = Math.round(35 + (1.0 - (distanceToActive - 85) / 45) * 25);
      isIdentified = false;
    } else if (distanceToActive <= 260) {
      stage = 'weak_anomaly';
      targetLabel = 'WEAK ANOMALOUS SIGNATURE';
      signatureType = 'FAINT RF / THERMAL DISCONTINUITY';
      confidence = Math.round(15 + (1.0 - (distanceToActive - 130) / 130) * 15);
      isIdentified = false;
    } else {
      stage = 'no_signal';
      targetLabel = 'NO SIGNIFICANT ANOMALY DETECTED';
      signatureType = 'AMBIENT MARTIAN BACKGROUND NOISE';
      confidence = 0;
      isIdentified = false;
    }

    const isCloseToActive = distanceToActive < 12;
    const isTargetLocked = distanceToActive < 12;
    const isVisualContact = distanceToActive >= 12 && distanceToActive <= 48;

    // Edge-triggered proximity detection audio
    let currentProximityStage: 'outside' | 'visual_contact' | 'target_locked' = 'outside';
    if (isTargetLocked) {
      currentProximityStage = 'target_locked';
    } else if (isVisualContact) {
      currentProximityStage = 'visual_contact';
    } else {
      currentProximityStage = 'outside';
    }

    const prevStage = this.proximityAudioState.stage;
    const prevArtifactId = this.proximityAudioState.artifactId;
    const isSameArtifact = prevArtifactId === activeArtifactData.id;

    if (!isSameArtifact) {
      this.proximityAudioState.artifactId = activeArtifactData.id;
      this.proximityAudioState.stage = currentProximityStage;
      if (currentProximityStage === 'visual_contact') {
        marsAudio.playVisualContact();
      } else if (currentProximityStage === 'target_locked') {
        marsAudio.playTargetLock();
      }
    } else if (prevStage !== currentProximityStage) {
      if (currentProximityStage === 'visual_contact' && prevStage === 'outside') {
        marsAudio.playVisualContact();
      } else if (currentProximityStage === 'target_locked' && prevStage !== 'target_locked') {
        marsAudio.playTargetLock();
      }
      this.proximityAudioState.stage = currentProximityStage;
    }

    // Dynamic coordinates in local planetary frame
    const currentLat = this.baseLatVal + this.position.z * -0.0001;
    const currentLon = this.baseLonVal + this.position.x * 0.0001;
    const altitudeM = groundY;

    const artLat = this.baseLatVal + activeArtPos.z * -0.0001;
    const artLon = this.baseLonVal + activeArtPos.x * 0.0001;

    // Format mission exploration time
    const totalSec = Math.floor(this.elapsedTimeSec);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const timeFormatted = `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const missionSolStr = `${this.missionSolPrefix} — ${timeFormatted} MET`;

    const activeArtifact: ActiveArtifactTelemetry = {
      id: activeArtifactData.id,
      name: activeArtifactData.name,
      designation: activeArtifactData.designation,
      site: activeArtifactData.site,
      type: activeArtifactData.type,
      distance: distanceToActive,
      bearingDeg: artBearingDeg,
      relativeDirectionStr,
      confidence,
      isIdentified,
      isVisualContact,
      isClose: isCloseToActive,
      isLocked: isTargetLocked,
      stage,
      worldPosition: activeArtPos,
    };

    return {
      position: this.position.clone(),
      headingDeg: currentHeadingDeg,
      pitchDeg: currentPitchDeg,
      isMoving: horizontalSpeed > 0.3,
      isSprinting: isActivelySprinting,
      isGrounded: this.isGrounded,
      speed: horizontalSpeed,
      distanceFromStart,
      baseBearingDeg,
      isAtLandingBase,

      activeArtifact,

      // Legacy compatibility
      distanceToRover: distanceToActive,
      bearingToRoverDeg: artBearingDeg,
      isTargetLocked,
      isCloseToRover: isCloseToActive,

      latStr: `${currentLat.toFixed(4)}° N`,
      lonStr: `${currentLon.toFixed(4)}° E`,
      altitudeM,

      // Live gameplay metrics
      oxygen: this.oxygen,
      isOxygenLow,
      isOxygenCritical,
      energy: this.energy,
      isEnergyLow,
      isEnergyDepleted,
      life: this.life,
      signal,
      scannerActive: this.scannerActive,
      scannerTelemetry: {
        target: targetLabel,
        signatureType,
        distance: distanceToActive,
        bearingDeg: artBearingDeg,
        relativeDirectionStr,
        confidence,
        isIdentified,
        stage,
      },

      // EVA Survival & Energy Inventory
      energyCharges: this.energyCharges,
      maxEnergyCharges: SURVIVAL_CONFIG.MAX_ENERGY_CHARGES,
      energySpeedMultiplier: speedMultiplier,
      energySpeedStageLabel: speedStageLabel,
      emergencyCountdown: this.emergencyCountdown,
      emergencyGracePeriodSec: SURVIVAL_CONFIG.EMERGENCY_GRACE_PERIOD_SEC,

      // Mission timeline and resource metrics
      elapsedTimeSec: this.elapsedTimeSec,
      missionSolStr,
      scannerEnergyConsumed: this.scannerEnergyConsumed,
      roverSimCoords: {
        latStr: `${artLat.toFixed(4)}° N`,
        lonStr: `${artLon.toFixed(4)}° E`,
        altitudeM: activeArtPos.y,
        x: activeArtPos.x,
        y: activeArtPos.y,
        z: activeArtPos.z,
      },
    };
  }
}
