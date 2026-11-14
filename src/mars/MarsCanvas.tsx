import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createMarsTerrain } from './terrain';
import { createMarsArtifactsManager, MarsArtifactsManager } from './artifacts3d';
import { createLandingSite, LandingSiteObject } from './landingSite';
import { createMarsAtmosphere, MarsAtmosphere } from './sky';
import { FirstPersonController, PlayerState } from './controls';
import { createDescentVehicle, DescentVehicleManager } from './descentVehicle';
import { IntroPhase } from '../components/IntroCinematic';
import { AstronautWristDevice } from './wristDevice';
import { RechargeState } from '../data/survivalConfig';

interface MarsCanvasProps {
  onStateUpdate: (state: PlayerState) => void;
  onLockChange: (locked: boolean) => void;
  controllerRef: React.MutableRefObject<FirstPersonController | null>;
  introPhase: IntroPhase;
  onLandingComplete: () => void;
  skipIntroTrigger?: number;
  mouseSensitivity?: number;
  graphicsQuality?: 'low' | 'medium' | 'high';
  isWristRaised?: boolean;
  onToggleWrist?: () => void;
  onUseEnergyCharge?: () => void;
  wristDeviceRef?: React.MutableRefObject<AstronautWristDevice | null>;
  rechargeState?: RechargeState;
  chargingEnergy?: number;
  chargingProgress?: number;
  onSelectChargeRequest?: () => void;
  onPhysicalButtonClick?: () => void;
  onCancelArmRequest?: () => void;
  archivedArtifactIds?: string[];
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

export const MarsCanvas: React.FC<MarsCanvasProps> = ({
  onStateUpdate,
  onLockChange,
  controllerRef,
  introPhase,
  onLandingComplete,
  skipIntroTrigger = 0,
  mouseSensitivity = 1.0,
  graphicsQuality = 'high',
  isWristRaised = false,
  onToggleWrist,
  onUseEnergyCharge,
  wristDeviceRef,
  rechargeState = 'IDLE',
  chargingEnergy,
  chargingProgress,
  onSelectChargeRequest,
  onPhysicalButtonClick,
  onCancelArmRequest,
  archivedArtifactIds = [],
  initialPlayerState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const internalWristDeviceRef = useRef<AstronautWristDevice | null>(null);
  const onUseEnergyChargeRef = useRef(onUseEnergyCharge);
  const onSelectChargeRequestRef = useRef(onSelectChargeRequest);
  const onPhysicalButtonClickRef = useRef(onPhysicalButtonClick);
  const onCancelArmRequestRef = useRef(onCancelArmRequest);
  const artifactsManagerRef = useRef<MarsArtifactsManager | null>(null);
  const landingRef = useRef<LandingSiteObject | null>(null);
  const descentVehicleRef = useRef<DescentVehicleManager | null>(null);
  const atmosphereRef = useRef<MarsAtmosphere | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const onStateUpdateRef = useRef(onStateUpdate);
  const introPhaseRef = useRef(introPhase);
  const onLandingCompleteRef = useRef(onLandingComplete);
  const introElapsedSecRef = useRef(0);
  const archivedArtifactIdsRef = useRef<string[]>(archivedArtifactIds);

  useEffect(() => {
    onUseEnergyChargeRef.current = onUseEnergyCharge;
  }, [onUseEnergyCharge]);

  useEffect(() => {
    onSelectChargeRequestRef.current = onSelectChargeRequest;
  }, [onSelectChargeRequest]);

  useEffect(() => {
    onPhysicalButtonClickRef.current = onPhysicalButtonClick;
  }, [onPhysicalButtonClick]);

  useEffect(() => {
    onCancelArmRequestRef.current = onCancelArmRequest;
  }, [onCancelArmRequest]);

  useEffect(() => {
    onStateUpdateRef.current = onStateUpdate;
  }, [onStateUpdate]);

  useEffect(() => {
    introPhaseRef.current = introPhase;
    if (introPhase === 'landing') {
      introElapsedSecRef.current = 0;
      if (descentVehicleRef.current) {
        descentVehicleRef.current.reset();
      }
      if (controllerRef.current) {
        controllerRef.current.setInputEnabled(false);
      }
    } else if (introPhase === 'welcome') {
      if (descentVehicleRef.current) {
        descentVehicleRef.current.skipToTouchdown();
      }
      if (controllerRef.current) {
        controllerRef.current.resetPosition();
        controllerRef.current.setInputEnabled(false);
      }
    } else if (introPhase === 'game') {
      if (descentVehicleRef.current) {
        descentVehicleRef.current.skipToTouchdown();
      }
      if (controllerRef.current) {
        controllerRef.current.setInputEnabled(true);
      }
    }
  }, [introPhase, controllerRef]);

  useEffect(() => {
    onLandingCompleteRef.current = onLandingComplete;
  }, [onLandingComplete]);

  // Handle instant skip trigger to land craft immediately
  useEffect(() => {
    if (skipIntroTrigger > 0 && descentVehicleRef.current) {
      descentVehicleRef.current.skipToTouchdown();
      if (controllerRef.current) {
        controllerRef.current.resetPosition();
      }
      onLandingCompleteRef.current();
    }
  }, [skipIntroTrigger]);

  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setMouseSensitivity(mouseSensitivity);
    }
  }, [mouseSensitivity, controllerRef]);

  useEffect(() => {
    archivedArtifactIdsRef.current = archivedArtifactIds;
    if (controllerRef.current) {
      controllerRef.current.setArchivedArtifactIds(archivedArtifactIds);
    }
  }, [archivedArtifactIds, controllerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Renderer Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const initialWidth = container.clientWidth || window.innerWidth || 1920;
    const initialHeight = container.clientHeight || window.innerHeight || 1080;

    const camera = new THREE.PerspectiveCamera(
      70, // Authentic 70° EVA Helmet FOV
      initialWidth / initialHeight,
      0.1,
      600
    );
    cameraRef.current = camera;
    scene.add(camera);

    // Create 3D First-Person Astronaut Wrist Device
    const wristDevice = new AstronautWristDevice(() => {
      if (onSelectChargeRequestRef.current) {
        onSelectChargeRequestRef.current();
      } else if (onUseEnergyChargeRef.current) {
        onUseEnergyChargeRef.current();
      } else if (controllerRef.current) {
        controllerRef.current.useEnergyCharge();
      }
    });
    wristDevice.setOnSelectCharge(() => {
      if (onSelectChargeRequestRef.current) {
        onSelectChargeRequestRef.current();
      }
    });
    wristDevice.setOnPhysicalButtonClick(() => {
      if (onPhysicalButtonClickRef.current) {
        onPhysicalButtonClickRef.current();
      }
    });
    wristDevice.setOnCancelArm(() => {
      if (onCancelArmRequestRef.current) {
        onCancelArmRequestRef.current();
      }
    });
    internalWristDeviceRef.current = wristDevice;
    if (wristDeviceRef) {
      wristDeviceRef.current = wristDevice;
    }
    camera.add(wristDevice.group);
    wristDevice.setRaised(Boolean(isWristRaised));

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    rendererRef.current = renderer;

    const pixelCap = graphicsQuality === 'low' ? 1.0 : graphicsQuality === 'medium' ? 1.5 : 2.0;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelCap));
    renderer.shadowMap.enabled = graphicsQuality !== 'low';
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    // Strict full-viewport presentation: guarantee canvas fills container
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.outline = 'none';

    renderer.setSize(initialWidth, initialHeight, false);
    container.appendChild(renderer.domElement);

    const updateDimensions = () => {
      if (!container || !rendererRef.current) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      rendererRef.current.setSize(width, height, false);
      const cap = graphicsQuality === 'low' ? 1.0 : graphicsQuality === 'medium' ? 1.5 : 2.0;
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, cap));
    };

    updateDimensions();
    const rafMeasureId = requestAnimationFrame(updateDimensions);
    const timeoutMeasureId = setTimeout(updateDimensions, 60);

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    // 2. Add Mars Environment
    const terrain = createMarsTerrain();
    scene.add(terrain.terrainMesh);
    scene.add(terrain.rocksMesh);
    scene.add(terrain.smallPebblesMesh);

    // 3. Add All 9 Real NASA Mars Artifacts
    const artifactsManager = createMarsArtifactsManager(scene);
    artifactsManagerRef.current = artifactsManager;

    // 4. Add Starting Landing Site & NASA Ares Descent Vehicle
    const landingSite = createLandingSite();
    landingRef.current = landingSite;
    scene.add(landingSite.group);

    const descentVehicle = createDescentVehicle();
    descentVehicleRef.current = descentVehicle;
    scene.add(descentVehicle.group);

    // If already in welcome or game phase (e.g. fast reload), park the craft
    if (introPhaseRef.current !== 'landing') {
      descentVehicle.skipToTouchdown();
    } else {
      descentVehicle.reset();
    }

    // 5. Add Sky, Sunlight, Fog & Atmospheric Dust
    const atmosphere = createMarsAtmosphere(scene);
    atmosphereRef.current = atmosphere;
    scene.add(atmosphere.skyGroup);

    // 6. Initialize First-Person Controller
    const controller = new FirstPersonController(camera, renderer.domElement, {
      initialPlayerState,
      archivedArtifactIds: archivedArtifactIdsRef.current,
    });
    controllerRef.current = controller;
    controller.setOnLockChange(onLockChange);
    controller.setOnRequestRecharge(() => {
      if (onSelectChargeRequestRef.current) {
        onSelectChargeRequestRef.current();
      } else if (onUseEnergyChargeRef.current) {
        onUseEnergyChargeRef.current();
      }
    });

    // Keep controls disabled until expedition officially begins
    if (introPhaseRef.current !== 'game') {
      controller.setInputEnabled(false);
    }

    // 7. Render & Animation Loop
    const timer = new THREE.Timer();
    timer.connect(document);

    const animate = (timestamp?: number) => {
      animationFrameId.current = requestAnimationFrame(animate);

      timer.update(timestamp);
      const delta = Math.min(timer.getDelta(), 0.1);
      const elapsedTime = timer.getElapsed();
      const currentPhase = introPhaseRef.current;

      let activeCamPos = camera.position;

      // CINEMATIC INTRO PHASE EXECUTION
      if (currentPhase === 'landing') {
        wristDevice.group.visible = false;
        introElapsedSecRef.current += delta;
        const anim = descentVehicle.update(introElapsedSecRef.current, delta);

        camera.position.copy(anim.cameraPosition);
        camera.lookAt(anim.cameraTarget);

        activeCamPos = anim.cameraPosition;

        if (anim.isComplete) {
          onLandingCompleteRef.current();
        }
      } else if (currentPhase === 'welcome') {
        wristDevice.group.visible = false;
        descentVehicle.skipToTouchdown();
        // Keep camera grounded at starting astronaut viewpoint
        controller.resetPosition();
        activeCamPos = controller.position;
      } else {
        // Active gameplay physics & state telemetry calculation
        wristDevice.group.visible = true;
        const state = controller.update(delta);
        onStateUpdateRef.current(state);
        activeCamPos = state.position;
        wristDevice.update(delta, state);
      }

      // Update artifacts and landing beacons
      artifactsManager.update(elapsedTime);
      landingSite.update(elapsedTime);

      // Update atmosphere & dust particles around active camera position
      atmosphere.update(elapsedTime, activeCamPos);

      renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', updateDimensions);

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(rafMeasureId);
      clearTimeout(timeoutMeasureId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      wristDevice.dispose();
      controller.dispose();
      camera.remove(wristDevice.group);
      timer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [graphicsQuality]);

  useEffect(() => {
    if (internalWristDeviceRef.current) {
      internalWristDeviceRef.current.setRaised(Boolean(isWristRaised));
    }
  }, [isWristRaised]);

  useEffect(() => {
    if (internalWristDeviceRef.current) {
      internalWristDeviceRef.current.setRechargeState(
        rechargeState,
        chargingEnergy,
        chargingProgress
      );
    }
  }, [rechargeState, chargingEnergy, chargingProgress]);

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        if (internalWristDeviceRef.current && isWristRaised && cameraRef.current) {
          internalWristDeviceRef.current.handlePointerMove(
            cameraRef.current,
            e.clientX,
            e.clientY
          );
        }
      }}
      onClick={(e) => {
        if (internalWristDeviceRef.current && isWristRaised && cameraRef.current) {
          const handled = internalWristDeviceRef.current.handlePointerClick(
            cameraRef.current,
            e.clientX,
            e.clientY
          );
          if (handled) return;
        }

        // Only lock pointer if not in interactive recharge arming or charging states
        if (
          introPhaseRef.current === 'game' &&
          controllerRef.current &&
          !controllerRef.current.isPointerLocked &&
          rechargeState !== 'RECHARGE_READY' &&
          rechargeState !== 'CONFIRMATION' &&
          rechargeState !== 'CHARGING'
        ) {
          controllerRef.current.requestLock();
        }
      }}
      className="absolute inset-0 w-full h-full cursor-crosshair"
    />
  );
};
