import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createMoonTerrain, getLunarTerrainHeight } from './moonTerrain';
import { createLunarArtifactsManager, LunarArtifactsManager } from './lunarArtifacts3d';
import { createLunarLandingSite, LunarLandingSite } from './lunarLandingSite';
import { createMoonAtmosphere, MoonAtmosphere } from './moonSky';
import { FirstPersonController, PlayerState } from '../mars/controls';
import { createLunarDescentVehicle, LunarDescentVehicle } from './lunarDescentVehicle';
import { IntroPhase } from '../components/IntroCinematic';
import { AstronautWristDevice } from '../mars/wristDevice';
import { RechargeState } from '../data/survivalConfig';
import { LUNAR_ARTIFACT_LIST } from '../data/lunarArtifacts';

interface MoonCanvasProps {
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

export const MoonCanvas: React.FC<MoonCanvasProps> = ({
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
  const artifactsManagerRef = useRef<LunarArtifactsManager | null>(null);
  const landingRef = useRef<LunarLandingSite | null>(null);
  const descentVehicleRef = useRef<LunarDescentVehicle | null>(null);
  const atmosphereRef = useRef<MoonAtmosphere | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const onStateUpdateRef = useRef(onStateUpdate);
  const introPhaseRef = useRef(introPhase);
  const onLandingCompleteRef = useRef(onLandingComplete);
  const introElapsedSecRef = useRef(0);

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
    renderer.toneMappingExposure = 1.12;

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

    // 2. Add Lunar Environment (Grey regolith, craters, Hadley Rille channel, boulders)
    const terrain = createMoonTerrain();
    scene.add(terrain.terrainMesh);
    scene.add(terrain.rocksMesh);

    // 3. Add 7 Historical NASA Lunar Artifacts
    const artifactsManager = createLunarArtifactsManager(scene);
    artifactsManagerRef.current = artifactsManager;

    // 4. Add Lunar Landing Base & Descent Vehicle
    const landingSite = createLunarLandingSite();
    landingRef.current = landingSite;
    scene.add(landingSite.group);

    const descentVehicle = createLunarDescentVehicle();
    descentVehicleRef.current = descentVehicle;
    scene.add(descentVehicle.group);

    if (introPhaseRef.current !== 'landing') {
      descentVehicle.skipToTouchdown();
    } else {
      descentVehicle.reset();
    }

    // 5. Add Lunar Vacuum Sky (Pitch black space, 4000 stars, Earth in the sky, harsh white sunlight)
    const atmosphere = createMoonAtmosphere(scene);
    atmosphereRef.current = atmosphere;
    scene.add(atmosphere.skyGroup);

    // 6. Initialize First-Person Controller with accurate Lunar Gravity (1.62 m/s²), authentic lunar hops, and Mare Tranquillitatis coords
    const controller = new FirstPersonController(camera, renderer.domElement, {
      planet: 'moon',
      gravity: 1.62, // 1/6th lunar gravity (1.62 m/s²)
      jumpForce: 3.2, // Controlled, majestic lunar hop
      getTerrainHeight: getLunarTerrainHeight,
      artifacts: LUNAR_ARTIFACT_LIST,
      baseLat: 0.6741, // Mare Tranquillitatis
      baseLon: 23.4730,
      missionSolPrefix: 'LUNAR MET',
      initialPlayerState,
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

      // Update atmosphere (Earth rotation and shadow texel alignment)
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
