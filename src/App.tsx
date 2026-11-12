/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MarsCanvas } from './mars/MarsCanvas';
import { FirstPersonController, PlayerState } from './mars/controls';
import { HUD } from './components/HUD';
import { ArtifactModal } from './components/ArtifactModal';
import { TransmissionModal } from './components/TransmissionModal';
import { MissionArchiveModal } from './components/MissionArchiveModal';
import { ControlsModal } from './components/ControlsModal';
import { MissionConsoleModal, ConsoleTab } from './components/MissionConsoleModal';
import { MissionFailureModal, FailureReason } from './components/MissionFailureModal';
import { RechargeConfirmModal } from './components/RechargeConfirmModal';
import {
  RechargeState,
  RECHARGE_INTERACTION_CONFIG,
  SURVIVAL_CONFIG,
  ENERGY_DRAIN_PRESETS,
} from './data/survivalConfig';
import { IntroCinematic, IntroPhase } from './components/IntroCinematic';
import { marsAudio } from './mars/audio';
import { ALL_ARTIFACTS, ARTIFACT_LIST, Artifact } from './data/artifacts';
import { ALL_LUNAR_ARTIFACTS, LUNAR_ARTIFACT_LIST } from './data/lunarArtifacts';
import { MoonCanvas } from './moon/MoonCanvas';
import { MainMenu } from './components/MainMenu';
import { DestinationSelect } from './components/DestinationSelect';
import { LunarPreviewModal } from './components/LunarPreviewModal';
import { OptionsMenu } from './components/OptionsMenu';
import { loadGameSettings, saveGameSettings, GameSettings } from './data/settings';
import {
  getLastPlayedPlanet,
  setLastPlayedPlanet,
  getResolvableResumePlanet,
  savePlayerSessionState,
  loadPlayerSessionState,
  clearPlayerSessionState,
  SavedPlayerSessionState,
  hasSavedMission,
  loadPersistentMission,
  savePersistentMission,
  resetPersistentMission,
  getSavedMissionSummary,
  hasSavedLunarMission,
  loadPersistentLunarMission,
  savePersistentLunarMission,
  resetPersistentLunarMission,
  getSavedLunarMissionSummary,
} from './data/saveSystem';
import { MissionState, PersistentMissionData } from './data/mission';

export type AppScreen = 'menu' | 'destinations' | 'lunar_preview' | 'options' | 'mars_game' | 'lunar_game';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('menu');
  const [activePlanet, setActivePlanet] = useState<'mars' | 'moon'>(() => {
    const resolvable = getResolvableResumePlanet();
    if (resolvable) return resolvable;
    const last = getLastPlayedPlanet();
    return last || 'mars';
  });
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('menu');
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());
  const [initialPlayerState, setInitialPlayerState] = useState<SavedPlayerSessionState | null>(null);

  const controllerRef = useRef<FirstPersonController | null>(null);

  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // 3D Astronaut First-Person Wrist EVA Interface
  const [isWristRaised, setIsWristRaised] = useState(false);

  // EVA Energy Multi-Step Recharge State Machine ('IDLE' | 'CONFIRMATION' | 'RECHARGE_READY' | 'CHARGING' | 'COMPLETE')
  const [rechargeState, setRechargeState] = useState<RechargeState>('IDLE');
  const [chargingEnergy, setChargingEnergy] = useState<number>(100);
  const [chargingProgress, setChargingProgress] = useState<number>(0);
  const chargingAnimFrameRef = useRef<number | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cinematic Intro Sequence State Machine: 'landing' -> 'welcome' -> 'game'
  const [introPhase, setIntroPhase] = useState<IntroPhase>('landing');
  const [skipIntroTrigger, setSkipIntroTrigger] = useState(0);

  // EVA Relic Documentation Reward Notification Toast State
  const [rewardNotification, setRewardNotification] = useState<{
    message: string;
    submessage?: string;
    type: 'reward' | 'full';
  } | null>(null);
  const rewardNotificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Contextual Investigation Hint Toast State (when I is pressed away from relics)
  const [investigationHint, setInvestigationHint] = useState<string | null>(null);
  const investigationHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync settings with audio subsystem and controller energy drain rate
  useEffect(() => {
    marsAudio.setMasterVolume(settings.masterVolume);
    marsAudio.setMuted(settings.isMuted);
  }, [settings.masterVolume, settings.isMuted]);

  useEffect(() => {
    if (controllerRef.current) {
      const rate = settings.energyDrainRate || 'standard';
      const preset = ENERGY_DRAIN_PRESETS[rate] || ENERGY_DRAIN_PRESETS.standard;
      controllerRef.current.setEnergyDrainMultiplier(preset.multiplier);
    }
  }, [settings.energyDrainRate]);

  useEffect(() => {
    return () => {
      if (rewardNotificationTimeoutRef.current) {
        clearTimeout(rewardNotificationTimeoutRef.current);
      }
      if (investigationHintTimeoutRef.current) {
        clearTimeout(investigationHintTimeoutRef.current);
      }
    };
  }, []);

  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveGameSettings(newSettings);
    marsAudio.setMasterVolume(newSettings.masterVolume);
    marsAudio.setMuted(newSettings.isMuted);
    if (controllerRef.current) {
      const rate = newSettings.energyDrainRate || 'standard';
      const preset = ENERGY_DRAIN_PRESETS[rate] || ENERGY_DRAIN_PRESETS.standard;
      controllerRef.current.setEnergyDrainMultiplier(preset.multiplier);
    }
  };

  // Track if game was paused prior to opening a modal so closing the modal restores exact prior state
  const wasPausedBeforeModalRef = useRef(false);
  const isOpeningModalRef = useRef(false);

  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [isTransmissionModalOpen, setIsTransmissionModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [failureReason, setFailureReason] = useState<FailureReason>('energy_depleted');
  const [consoleInitialTab, setConsoleInitialTab] = useState<ConsoleTab>('map');
  const [showVisorOverlay, setShowVisorOverlay] = useState(true);

  const isAnyModalOpen =
    isConsoleOpen ||
    isArchiveModalOpen ||
    isArtifactModalOpen ||
    isTransmissionModalOpen ||
    isControlsModalOpen ||
    isFailureModalOpen ||
    rechargeState === 'CONFIRMATION';

  const isAnyModalOpenRef = useRef(false);
  const isPausedRef = useRef(false);
  const hasStartedRef = useRef(false);
  const introPhaseRef = useRef(introPhase);
  const activePlanetRef = useRef(activePlanet);

  useEffect(() => {
    activePlanetRef.current = activePlanet;
  }, [activePlanet]);

  useEffect(() => {
    isAnyModalOpenRef.current = isAnyModalOpen;
  }, [isAnyModalOpen]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    introPhaseRef.current = introPhase;
  }, [introPhase]);

  // Synchronize controller inputEnabled with active gameplay state
  useEffect(() => {
    if (controllerRef.current) {
      const isGameplayActive = !isPaused && !isAnyModalOpen && introPhase === 'game';
      controllerRef.current.setInputEnabled(isGameplayActive);
    }
  }, [isPaused, isAnyModalOpen, introPhase]);

  // Persistent Mission Progress for all 5 real NASA Mars artifacts
  const [missionProgress, setMissionProgress] = useState<PersistentMissionData>(() => {
    return loadPersistentMission();
  });

  // Persistent Mission Progress for all 7 real NASA Lunar artifacts
  const [lunarMissionProgress, setLunarMissionProgress] = useState<PersistentMissionData>(() => {
    return loadPersistentLunarMission();
  });

  // Synchronous ref tracking already-discovered artifacts to guarantee discovery audio & state triggers exactly once per artifact
  const discoveredArtifactsRef = useRef<Set<string>>(
    new Set(
      Object.keys(loadPersistentMission()).filter((key) => {
        const item = loadPersistentMission()[key];
        return item?.isDiscovered;
      })
    )
  );

  const lunarDiscoveredArtifactsRef = useRef<Set<string>>(
    new Set(
      Object.keys(loadPersistentLunarMission()).filter((key) => {
        const item = loadPersistentLunarMission()[key];
        return item?.isDiscovered;
      })
    )
  );

  // Sync ref whenever missionProgress changes
  useEffect(() => {
    Object.keys(missionProgress).forEach((key) => {
      if (missionProgress[key]?.isDiscovered) {
        discoveredArtifactsRef.current.add(key);
      }
    });
  }, [missionProgress]);

  useEffect(() => {
    Object.keys(lunarMissionProgress).forEach((key) => {
      if (lunarMissionProgress[key]?.isDiscovered) {
        lunarDiscoveredArtifactsRef.current.add(key);
      }
    });
  }, [lunarMissionProgress]);

  // Target artifact for modal inspection and transmission
  const [modalArtifactId, setModalArtifactId] = useState<string>('mer_a_spirit');

  // Active artifacts map and list based on activePlanet
  const activeArtifactsMap = activePlanet === 'moon' ? ALL_LUNAR_ARTIFACTS : ALL_ARTIFACTS;
  const activeArtifactsList = activePlanet === 'moon' ? LUNAR_ARTIFACT_LIST : ARTIFACT_LIST;
  const activeMissionProgress = activePlanet === 'moon' ? lunarMissionProgress : missionProgress;

  // Calculate campaign progression metrics across planetary artifacts
  const missionState: MissionState = useMemo(() => {
    const keys = Object.keys(activeArtifactsMap);
    let discovered = 0;
    let documented = 0;
    let transmitted = 0;
    let archived = 0;

    keys.forEach((key) => {
      const p = activeMissionProgress[key];
      if (p?.isDiscovered) discovered++;
      if (p?.isDocumented) documented++;
      if (p?.isTransmitted) transmitted++;
      if (p?.isArchived) archived++;
    });

    return {
      artifactsDiscovered: discovered,
      artifactsDocumented: documented,
      artifactsTransmitted: transmitted,
      artifactsArchived: archived,
      totalArtifacts: keys.length,
    };
  }, [activeArtifactsMap, activeMissionProgress]);

  // Initial player state
  const [playerState, setPlayerState] = useState<PlayerState>({
    position: { x: 0, y: 1.75, z: 0 } as any,
    headingDeg: 140,
    pitchDeg: 0,
    isMoving: false,
    isSprinting: false,
    isGrounded: true,
    speed: 0,
    distanceFromStart: 0,
    baseBearingDeg: 180,
    isAtLandingBase: true,
    activeArtifact: {
      id: 'mer_a_spirit',
      name: 'Spirit Rover',
      designation: 'NASA MER-A',
      site: 'Gusev Crater',
      type: 'rover',
      distance: 284,
      bearingDeg: 48,
      relativeDirectionStr: 'AHEAD',
      confidence: 0,
      isIdentified: false,
      isVisualContact: false,
      isClose: false,
      isLocked: false,
      stage: 'no_signal',
      worldPosition: ALL_ARTIFACTS.mer_a_spirit.worldPosition,
    },
    distanceToRover: 284,
    bearingToRoverDeg: 48,
    isTargetLocked: false,
    isCloseToRover: false,
    latStr: '18.4412° N',
    lonStr: '77.4589° E',
    altitudeM: 0,
    oxygen: 100,
    isOxygenLow: false,
    isOxygenCritical: false,
    energy: 100,
    isEnergyLow: false,
    isEnergyDepleted: false,
    life: 100,
    signal: 100,
    scannerActive: false,
    scannerTelemetry: {
      target: 'NO ANOMALY IN SCANNER RANGE (>260M)',
      signatureType: 'BACKGROUND AMBIENT NOISE',
      distance: 284,
      bearingDeg: 48,
      relativeDirectionStr: 'AHEAD',
      confidence: 0,
      isIdentified: false,
      stage: 'no_signal',
    },
    energyCharges: 3,
    maxEnergyCharges: 6,
    energySpeedMultiplier: 1.0,
    energySpeedStageLabel: 'NOMINAL (100%)',
    emergencyCountdown: null,
    emergencyGracePeriodSec: 25.0,
    elapsedTimeSec: 0,
    missionSolStr: 'SOL 01 — 00:00:00 MET',
    scannerEnergyConsumed: 0,
    roverSimCoords: {
      latStr: '18.4632° N',
      lonStr: '77.4769° E',
      altitudeM: 3.2,
      x: 180,
      y: 3.2,
      z: -220,
    },
  });

  // Ref tracking last time player session telemetry was saved to localStorage
  const lastStateSaveTimeRef = useRef<number>(0);

  // Auto-save player session state on browser refresh or close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (controllerRef.current && introPhaseRef.current === 'game') {
        savePlayerSessionState(activePlanetRef.current, controllerRef.current.getPlayerStateSnapshot());
      }
      setLastPlayedPlanet(activePlanetRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track discovery milestone when player gets close to any artifact for the first time
  // Track discovery milestone and monitor survival telemetry
  const handleStateUpdate = useCallback((state: PlayerState) => {
    setPlayerState(state);

    // Periodically save player session position & survival telemetry during active exploration
    const now = Date.now();
    if (
      introPhaseRef.current === 'game' &&
      !isAnyModalOpenRef.current &&
      now - lastStateSaveTimeRef.current > 1500
    ) {
      lastStateSaveTimeRef.current = now;
      if (controllerRef.current) {
        savePlayerSessionState(activePlanetRef.current, controllerRef.current.getPlayerStateSnapshot());
      }
      setLastPlayedPlanet(activePlanetRef.current);
    }

    // Monitor emergency power & life-support failure
    if (introPhaseRef.current === 'game' && !isAnyModalOpenRef.current) {
      if (state.emergencyCountdown !== null && state.emergencyCountdown <= 0) {
        setFailureReason('energy_depleted');
        setIsFailureModalOpen(true);
        marsAudio.playMissionFailure();
        if (controllerRef.current) controllerRef.current.unlock();
      } else if (state.life <= 0) {
        setFailureReason(state.oxygen <= 0 ? 'oxygen_depleted' : 'energy_depleted');
        setIsFailureModalOpen(true);
        marsAudio.playMissionFailure();
        if (controllerRef.current) controllerRef.current.unlock();
      } else if (state.oxygen <= 0) {
        setFailureReason('oxygen_depleted');
        setIsFailureModalOpen(true);
        marsAudio.playMissionFailure();
        if (controllerRef.current) controllerRef.current.unlock();
      }
    }

    const activeId = state.activeArtifact.id;

    const currentPlanet = activePlanetRef.current;
    const discoveredSet =
      currentPlanet === 'moon' ? lunarDiscoveredArtifactsRef.current : discoveredArtifactsRef.current;

    if (state.activeArtifact.isClose && !discoveredSet.has(activeId)) {
      discoveredSet.add(activeId);
      const today = new Date().toISOString().split('T')[0];

      if (currentPlanet === 'moon') {
        setLunarMissionProgress((prev) => {
          const next = {
            ...prev,
            [activeId]: {
              ...(prev[activeId] || {
                isDiscovered: false,
                isDocumented: false,
                isTransmitted: false,
                isArchived: false,
              }),
              isDiscovered: true,
              discoveredAt: today,
            },
          };
          savePersistentLunarMission(next);
          return next;
        });
      } else {
        setMissionProgress((prev) => {
          const next = {
            ...prev,
            [activeId]: {
              ...(prev[activeId] || {
                isDiscovered: false,
                isDocumented: false,
                isTransmitted: false,
                isArchived: false,
              }),
              isDiscovered: true,
              discoveredAt: today,
            },
          };
          savePersistentMission(next);
          return next;
        });
      }
      marsAudio.playDiscoveryChime();
    }
  }, []);

  const handleLockChange = useCallback((locked: boolean) => {
    setIsPointerLocked(locked);
    if (locked) {
      setHasStarted(true);
      setIsPaused(false);
    } else {
      // If a modal is opening or currently open, pointer lock was released for modal UI; DO NOT PAUSE!
      if (isOpeningModalRef.current || isAnyModalOpenRef.current) {
        return;
      }
      // If game has not started yet, do not trigger pause
      if (!hasStartedRef.current) {
        return;
      }
      // Released while in normal exploration with no modal open -> intentional pause (e.g. ESC)
      setIsPaused(true);
    }
  }, []);

  // Modal open helper: saves current pause state and releases pointer lock without triggering pause
  const openModal = useCallback((openFn: () => void) => {
    wasPausedBeforeModalRef.current = isPausedRef.current;
    isOpeningModalRef.current = true;
    openFn();
    if (controllerRef.current) {
      controllerRef.current.unlock();
    }
    setTimeout(() => {
      isOpeningModalRef.current = false;
    }, 150);
  }, []);

  // Modal close helper: closes modals and restores exact prior gameplay pause state
  const handleCloseAllModals = useCallback(() => {
    setIsConsoleOpen(false);
    setIsArchiveModalOpen(false);
    setIsArtifactModalOpen(false);
    setIsTransmissionModalOpen(false);
    setIsControlsModalOpen(false);
    setIsFailureModalOpen(false);

    setRechargeState((prev) => (prev === 'CONFIRMATION' ? 'IDLE' : prev));

    if (wasPausedBeforeModalRef.current) {
      // Was already paused prior to opening this modal -> stay paused
      setIsPaused(true);
    } else {
      // Was playing prior to opening this modal -> resume exploration immediately!
      setIsPaused(false);
      if (controllerRef.current) {
        controllerRef.current.requestLock();
      }
    }
  }, []);

  const handleRestartMission = useCallback(() => {
    if (chargingAnimFrameRef.current) {
      cancelAnimationFrame(chargingAnimFrameRef.current);
      chargingAnimFrameRef.current = null;
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
    setRechargeState('IDLE');
    setRewardNotification(null);
    setIsFailureModalOpen(false);
    setIsWristRaised(false);
    setIsPaused(false);
    clearPlayerSessionState(activePlanetRef.current);
    if (controllerRef.current) {
      controllerRef.current.restartMission();
      controllerRef.current.requestLock();
    }
  }, []);

  // =========================================================================
  // AUTHORITATIVE EVA ENERGY MULTI-STEP RECHARGE FLOW (Step 1 -> 4)
  // =========================================================================

  // Step 1: Open Confirmation Prompt
  const handleSelectChargeRequest = useCallback(() => {
    if (isAnyModalOpenRef.current || introPhaseRef.current !== 'game') return;
    if (rechargeState === 'CHARGING' || rechargeState === 'COMPLETE') return;

    if (rechargeState === 'RECHARGE_READY') {
      // Already armed: ensure wrist is raised for physical button activation
      setIsWristRaised(true);
      return;
    }

    if (!controllerRef.current || controllerRef.current.energyCharges <= 0) {
      marsAudio.playComponentSelect();
      return;
    }

    // Step 1: Open confirmation prompt & release pointer lock safely
    openModal(() => {
      marsAudio.playComponentSelect();
      setRechargeState('CONFIRMATION');
    });
  }, [openModal, rechargeState]);

  // Step 1 -> Cancel: Consume nothing, leave energy unchanged, return to IDLE
  const handleCancelConfirmation = useCallback(() => {
    setRechargeState('IDLE');
    handleCloseAllModals();
  }, [handleCloseAllModals]);

  // Step 1 -> Confirm -> Step 2: Arm the recharge device
  const handleConfirmArm = useCallback(() => {
    if (rechargeState !== 'CONFIRMATION') return;
    if (!controllerRef.current) return;

    const success = controllerRef.current.armEnergyCharge();
    if (!success) {
      setRechargeState('IDLE');
      handleCloseAllModals();
      return;
    }

    // Enter RECHARGE_READY state without refilling energy immediately
    setRechargeState('RECHARGE_READY');
    setIsWristRaised(true); // Automatically raise wrist interface so the physical button is visible
    marsAudio.playComponentSelect();

    // Close confirmation modal without locking pointer so user can easily click wrist button
    setIsConsoleOpen(false);
    setIsArchiveModalOpen(false);
    setIsArtifactModalOpen(false);
    setIsTransmissionModalOpen(false);
    setIsControlsModalOpen(false);
    setIsFailureModalOpen(false);
  }, [rechargeState, handleCloseAllModals]);

  // Step 2 Cancellation: Restore consumed charge safely and return to IDLE
  const handleCancelArm = useCallback(() => {
    if (rechargeState !== 'RECHARGE_READY') return;
    if (controllerRef.current) {
      controllerRef.current.disarmEnergyCharge();
    }
    setRechargeState('IDLE');
    marsAudio.playComponentSelect();
    if (!isPausedRef.current && controllerRef.current) {
      controllerRef.current.requestLock();
    }
  }, [rechargeState]);

  // Step 3 & 4: Activate physical button and run charging animation
  const handleActivatePhysicalButton = useCallback(() => {
    if (rechargeState !== 'RECHARGE_READY') return;
    if (!controllerRef.current) return;

    // Transition to CHARGING state
    setRechargeState('CHARGING');

    // Immediately cancel emergency countdown when energy begins recovering safely
    controllerRef.current.cancelEmergencyCountdown();

    const startEnergy = controllerRef.current.energy;
    const targetEnergy = 100;
    const durationMs = RECHARGE_INTERACTION_CONFIG.ANIMATION_DURATION_SEC * 1000;
    const startTime = performance.now();

    marsAudio.playEnergyRecharge();

    const animateCharge = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Smooth easeInOutCubic
      const ease =
        progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const currentEnergyVal = startEnergy + (targetEnergy - startEnergy) * ease;

      setChargingEnergy(currentEnergyVal);
      setChargingProgress(progress);

      if (controllerRef.current) {
        controllerRef.current.setEnergy(currentEnergyVal);
      }

      if (progress < 1.0) {
        chargingAnimFrameRef.current = requestAnimationFrame(animateCharge);
      } else {
        // Charging complete: snap to 100%
        if (controllerRef.current) {
          controllerRef.current.setEnergy(100);
        }
        setChargingEnergy(100);
        setChargingProgress(1.0);
        setRechargeState('COMPLETE');

        // Show "ENERGY RESTORED — 100%" confirmation banner for configured duration
        if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = setTimeout(() => {
          setRechargeState('IDLE');
          if (!isPausedRef.current && controllerRef.current && !isAnyModalOpenRef.current) {
            controllerRef.current.requestLock();
          }
        }, RECHARGE_INTERACTION_CONFIG.COMPLETION_DISPLAY_SEC * 1000);
      }
    };

    chargingAnimFrameRef.current = requestAnimationFrame(animateCharge);
  }, [rechargeState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chargingAnimFrameRef.current) cancelAnimationFrame(chargingAnimFrameRef.current);
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
    };
  }, []);

  const handleUseEnergyCharge = useCallback(() => {
    if (rechargeState === 'RECHARGE_READY') {
      handleActivatePhysicalButton();
    } else {
      handleSelectChargeRequest();
    }
  }, [rechargeState, handleActivatePhysicalButton, handleSelectChargeRequest]);

  const handleToggleWrist = useCallback(() => {
    if (!isAnyModalOpenRef.current && introPhaseRef.current === 'game') {
      setIsWristRaised((prev) => {
        const next = !prev;
        if (!next && rechargeState === 'RECHARGE_READY') {
          handleCancelArm();
        }
        return next;
      });
    }
  }, [rechargeState, handleCancelArm]);

  const handleResume = useCallback(() => {
    marsAudio.init();
    marsAudio.resume();
    setIsPaused(false);
    setHasStarted(true);
    if (controllerRef.current) {
      controllerRef.current.requestLock();
    }
  }, []);

  const handleLandingComplete = useCallback(() => {
    setIntroPhase('welcome');
  }, []);

  const handleSkipLanding = useCallback(() => {
    setSkipIntroTrigger((prev) => prev + 1);
    setIntroPhase('welcome');
  }, []);

  const handleBeginExpedition = useCallback(() => {
    setIntroPhase('game');
    setHasStarted(true);
    setIsPaused(false);
    marsAudio.init();
    marsAudio.resume();
    if (controllerRef.current) {
      controllerRef.current.setInputEnabled(true);
      controllerRef.current.requestLock();
    }
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (controllerRef.current) {
      controllerRef.current.unlock();
    }
  }, []);

  const handleRequestLock = useCallback(() => {
    handleResume();
  }, [handleResume]);

  const handleResetPosition = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.teleportToLanding();
    }
  }, []);

  const handleToggleScanner = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.toggleScanner();
    }
  }, []);

  // Open Artifact Modal
  const handleOpenArtifact = useCallback(
    (artId?: string) => {
      openModal(() => {
        marsAudio.playTargetLock();
        const targetArtId = artId || playerState.activeArtifact.id;
        setModalArtifactId(targetArtId);
        setIsArtifactModalOpen(true);
      });
    },
    [openModal, playerState.activeArtifact.id]
  );

  // Open Transmission Modal
  const handleOpenTransmission = useCallback(
    (artId?: string) => {
      openModal(() => {
        const targetArtId = artId || modalArtifactId || playerState.activeArtifact.id;
        setModalArtifactId(targetArtId);
        setIsArtifactModalOpen(false);
        setIsArchiveModalOpen(false);
        setIsTransmissionModalOpen(true);
      });
    },
    [openModal, modalArtifactId, playerState.activeArtifact.id]
  );

  // Open Mission Archive Modal
  const handleOpenArchive = useCallback(() => {
    openModal(() => {
      setIsArtifactModalOpen(false);
      setIsTransmissionModalOpen(false);
      setIsArchiveModalOpen(true);
    });
  }, [openModal]);

  // Open Unified Mission Console
  const handleOpenConsole = useCallback(
    (tab: ConsoleTab = 'map') => {
      openModal(() => {
        marsAudio.playComponentSelect();
        setConsoleInitialTab(tab);
        setIsArtifactModalOpen(false);
        setIsTransmissionModalOpen(false);
        setIsArchiveModalOpen(false);
        setIsControlsModalOpen(false);
        setIsConsoleOpen(true);
      });
    },
    [openModal]
  );

  // Document discovery for an artifact permanently and award +1 energy charge
  const handleDocumentDiscovery = useCallback(
    (artId: string) => {
      const currentPlanet = activePlanetRef.current;
      const progressStore = currentPlanet === 'moon' ? lunarMissionProgress : missionProgress;

      // 1. Exploit prevention: A relic may award its documentation reward only once per mission
      const existingRecord = progressStore[artId];
      if (existingRecord?.isDocumented || existingRecord?.rewardAwarded) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const nextProgress: PersistentMissionData = {
        ...progressStore,
        [artId]: {
          ...(existingRecord || {
            isDiscovered: true,
            isDocumented: false,
            isTransmitted: false,
            isArchived: false,
          }),
          isDiscovered: true,
          isDocumented: true,
          documentedAt: today,
          rewardAwarded: true,
        },
      };

      if (currentPlanet === 'moon') {
        setLunarMissionProgress(nextProgress);
        savePersistentLunarMission(nextProgress);
      } else {
        setMissionProgress(nextProgress);
        savePersistentMission(nextProgress);
      }

      // 2. Authoritative energy charge reward processing
      if (controllerRef.current) {
        const rewardResult = controllerRef.current.addEnergyCharge(
          SURVIVAL_CONFIG.DOCUMENTATION_REWARD_CHARGES
        );

        marsAudio.playDiscoveryChime();

        if (rewardResult.awarded) {
          // Successfully awarded exactly 1 energy charge
          setRewardNotification({
            message: 'DOCUMENTATION COMPLETE — +1 ENERGY CHARGE',
            submessage: `STORED ENERGY: ${rewardResult.newCount} OF ${SURVIVAL_CONFIG.MAX_ENERGY_CHARGES} CHARGES AVAILABLE`,
            type: 'reward',
          });
        } else {
          // Already at maximum 6 charges: do not exceed cap
          setRewardNotification({
            message: 'DOCUMENTATION COMPLETE — ENERGY STORAGE FULL',
            submessage: `SUIT POWER MATRIX AT MAXIMUM CAPACITY (${SURVIVAL_CONFIG.MAX_ENERGY_CHARGES}/${SURVIVAL_CONFIG.MAX_ENERGY_CHARGES} CHARGES)`,
            type: 'full',
          });
        }

        if (rewardNotificationTimeoutRef.current) {
          clearTimeout(rewardNotificationTimeoutRef.current);
        }
        rewardNotificationTimeoutRef.current = setTimeout(() => {
          setRewardNotification(null);
        }, 4500);
      }
    },
    [missionProgress, lunarMissionProgress]
  );

  // Transmission completed & archived for an artifact
  const handleTransmissionComplete = useCallback((artId: string) => {
    const currentPlanet = activePlanetRef.current;
    const today = new Date().toISOString().split('T')[0];

    if (currentPlanet === 'moon') {
      setLunarMissionProgress((prev) => {
        const next = {
          ...prev,
          [artId]: {
            ...(prev[artId] || {
              isDiscovered: true,
              isDocumented: true,
              isTransmitted: false,
              isArchived: false,
            }),
            isDiscovered: true,
            isDocumented: true,
            isTransmitted: true,
            isArchived: true,
            transmittedAt: today,
            archivedAt: today,
          },
        };
        savePersistentLunarMission(next);
        return next;
      });
    } else {
      setMissionProgress((prev) => {
        const next = {
          ...prev,
          [artId]: {
            ...(prev[artId] || {
              isDiscovered: true,
              isDocumented: true,
              isTransmitted: false,
              isArchived: false,
            }),
            isDiscovered: true,
            isDocumented: true,
            isTransmitted: true,
            isArchived: true,
            transmittedAt: today,
            archivedAt: today,
          },
        };
        savePersistentMission(next);
        return next;
      });
    }
  }, []);

  // Active artifact data and status
  const currentActiveArtifact: Artifact = useMemo(() => {
    return activeArtifactsMap[playerState.activeArtifact.id] || activeArtifactsList[0];
  }, [activeArtifactsMap, activeArtifactsList, playerState.activeArtifact.id]);

  const modalArtifact: Artifact = useMemo(() => {
    return activeArtifactsMap[modalArtifactId] || activeArtifactsList[0];
  }, [activeArtifactsMap, activeArtifactsList, modalArtifactId]);

  const activeProgress = activeMissionProgress[playerState.activeArtifact.id] || {
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  };

  const modalProgress = activeMissionProgress[modalArtifactId] || {
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  };

  // Check if any documented artifact is ready to transmit
  const anyDocumentedReadyToTransmit = useMemo(() => {
    return Object.values(activeMissionProgress).some((p) => p.isDocumented && !p.isTransmitted);
  }, [activeMissionProgress]);

  // Screen navigation handlers
  const handleResumeGame = useCallback(() => {
    const targetPlanet = getResolvableResumePlanet();
    if (!targetPlanet) {
      return;
    }

    setLastPlayedPlanet(targetPlanet);
    setActivePlanet(targetPlanet);

    const savedPlayer = loadPlayerSessionState(targetPlanet);
    setInitialPlayerState(savedPlayer);

    if (targetPlanet === 'moon') {
      const existing = loadPersistentLunarMission();
      setLunarMissionProgress(existing);
      lunarDiscoveredArtifactsRef.current = new Set(
        Object.keys(existing).filter((k) => existing[k]?.isDiscovered)
      );
      setModalArtifactId('apollo11_eagle');
      setIntroPhase('game');
      setHasStarted(true);
      setIsPaused(false);
      marsAudio.startAtmosphereAudio();
      setCurrentScreen('lunar_game');
    } else {
      const existing = loadPersistentMission();
      setMissionProgress(existing);
      discoveredArtifactsRef.current = new Set(
        Object.keys(existing).filter((k) => existing[k]?.isDiscovered)
      );
      setModalArtifactId('mer_a_spirit');
      setIntroPhase('game');
      setHasStarted(true);
      setIsPaused(false);
      marsAudio.startAtmosphereAudio();
      setCurrentScreen('mars_game');
    }
  }, []);

  const handleStartMars = useCallback(() => {
    setActivePlanet('mars');
    setLastPlayedPlanet('mars');
    setModalArtifactId('mer_a_spirit');
    setInitialPlayerState(null);
    clearPlayerSessionState('mars');

    // 1. Reset previous expedition's persistent progress completely to create a fresh mission
    resetPersistentMission();
    const freshMission = loadPersistentMission();
    setMissionProgress(freshMission);
    discoveredArtifactsRef.current.clear();

    // 2. Reset astronaut location and charges to initial Sol 01 baseline (3 charges)
    if (controllerRef.current) {
      controllerRef.current.resetPosition();
      controllerRef.current.resetChargesToDefault();
    }
    setRewardNotification(null);

    // 3. Play the intro cinematic from the beginning
    setSkipIntroTrigger(0);
    setIntroPhase('landing');
    setHasStarted(false);
    setIsPaused(false);

    marsAudio.startAtmosphereAudio();
    setCurrentScreen('mars_game');
  }, []);

  const handleStartMoon = useCallback(() => {
    setActivePlanet('moon');
    setLastPlayedPlanet('moon');
    setModalArtifactId('apollo11_eagle');
    setInitialPlayerState(null);
    clearPlayerSessionState('moon');

    // 1. Reset lunar persistent progress completely to create a fresh mission
    resetPersistentLunarMission();
    const freshMission = loadPersistentLunarMission();
    setLunarMissionProgress(freshMission);
    lunarDiscoveredArtifactsRef.current.clear();

    // 2. Reset astronaut location and charges to initial baseline (3 charges)
    if (controllerRef.current) {
      controllerRef.current.resetPosition();
      controllerRef.current.resetChargesToDefault();
    }
    setRewardNotification(null);

    // 3. Play the intro cinematic from the beginning for the Moon
    setSkipIntroTrigger(0);
    setIntroPhase('landing');
    setHasStarted(false);
    setIsPaused(false);

    marsAudio.startAtmosphereAudio();
    setCurrentScreen('lunar_game');
  }, []);

  const handleOpenOptions = useCallback((fromScreen: AppScreen = currentScreen) => {
    setPreviousScreen(fromScreen);
    setCurrentScreen('options');
  }, [currentScreen]);

  const handleOptionsBack = useCallback(() => {
    setCurrentScreen(previousScreen);
  }, [previousScreen]);

  const handleExitToMenu = useCallback(() => {
    if (chargingAnimFrameRef.current) {
      cancelAnimationFrame(chargingAnimFrameRef.current);
      chargingAnimFrameRef.current = null;
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
    if (rechargeState === 'RECHARGE_READY' && controllerRef.current) {
      controllerRef.current.disarmEnergyCharge();
    }
    setRechargeState('IDLE');
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
    if (controllerRef.current && introPhaseRef.current === 'game') {
      savePlayerSessionState(activePlanetRef.current, controllerRef.current.getPlayerStateSnapshot());
    }
    setLastPlayedPlanet(activePlanetRef.current);
    marsAudio.stopAtmosphereAudio();
    setIsPaused(true);
    setCurrentScreen('menu');
  }, [rechargeState]);

  const handleResetExpedition = useCallback(() => {
    if (activePlanet === 'moon') {
      clearPlayerSessionState('moon');
      resetPersistentLunarMission();
      const freshMission = loadPersistentLunarMission();
      setLunarMissionProgress(freshMission);
      lunarDiscoveredArtifactsRef.current.clear();
    } else {
      clearPlayerSessionState('mars');
      resetPersistentMission();
      const freshMission = loadPersistentMission();
      setMissionProgress(freshMission);
      discoveredArtifactsRef.current.clear();
    }
    handleResetPosition();
  }, [activePlanet, handleResetPosition]);

  // Global hotkeys for exploration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Exploration hotkeys are strictly active during planetary expeditions
      if (currentScreen !== 'mars_game' && currentScreen !== 'lunar_game') {
        return;
      }

      // Never trigger exploration hotkeys when typing into an input/textarea
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      // Intro sequence keyboard handling
      if (introPhase !== 'game') {
        if (e.key === ' ' || e.key === 'Escape') {
          if (introPhase === 'landing') {
            e.preventDefault();
            handleSkipLanding();
          }
        } else if (e.key === 'Enter') {
          if (introPhase === 'welcome') {
            e.preventDefault();
            handleBeginExpedition();
          }
        }
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        // E key — strictly Wrist Energy Interface (never opens relic dossiers)
        if (!isAnyModalOpen) {
          handleToggleWrist();
        }
      } else if (e.key === 'i' || e.key === 'I') {
        // I key — strictly Investigate / Open Dossier (when near relic)
        if (!isAnyModalOpen) {
          if (playerState.activeArtifact.isClose) {
            handleOpenArtifact(playerState.activeArtifact.id);
          } else {
            // Subtle contextual hint when away from relics
            marsAudio.playComponentSelect();
            setInvestigationHint('NO RELIC IN RANGE // APPROACH TARGET TO INVESTIGATE');
            if (investigationHintTimeoutRef.current) {
              clearTimeout(investigationHintTimeoutRef.current);
            }
            investigationHintTimeoutRef.current = setTimeout(() => {
              setInvestigationHint(null);
            }, 2500);
          }
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (!isAnyModalOpen) {
          handleUseEnergyCharge();
        }
      } else if (e.key === 't' || e.key === 'T') {
        if (anyDocumentedReadyToTransmit && !isTransmissionModalOpen) {
          // If active artifact is documented, transmit it, otherwise find the first documented artifact
          const readyId =
            activeProgress.isDocumented && !activeProgress.isTransmitted
              ? playerState.activeArtifact.id
              : Object.keys(missionProgress).find(
                  (k) => missionProgress[k].isDocumented && !missionProgress[k].isTransmitted
                ) || playerState.activeArtifact.id;
          handleOpenTransmission(readyId);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (!isArtifactModalOpen && !isTransmissionModalOpen) {
          if (isConsoleOpen && consoleInitialTab === 'map') {
            handleCloseAllModals();
          } else {
            handleOpenConsole('map');
          }
        }
      } else if (e.key === 'x' || e.key === 'X') {
        if (!isArtifactModalOpen && !isTransmissionModalOpen) {
          if (isConsoleOpen && consoleInitialTab === 'archive') {
            handleCloseAllModals();
          } else {
            handleOpenConsole('archive');
          }
        }
      } else if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        if (!isConsoleOpen) {
          handleOpenConsole('guide');
        } else {
          handleCloseAllModals();
        }
      } else if (e.key === 'Escape') {
        if (rechargeState === 'CONFIRMATION') {
          handleCancelConfirmation();
        } else if (rechargeState === 'RECHARGE_READY') {
          handleCancelArm();
        } else if (isWristRaised) {
          // Close wrist device smoothly without interrupting active exploration or pausing
          setIsWristRaised(false);
        } else if (isAnyModalOpen) {
          handleCloseAllModals();
        } else if (!isPaused) {
          handlePause();
        } else {
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    introPhase,
    handleSkipLanding,
    handleBeginExpedition,
    playerState.activeArtifact.isClose,
    playerState.activeArtifact.id,
    activeProgress.isDocumented,
    activeProgress.isTransmitted,
    isArtifactModalOpen,
    isTransmissionModalOpen,
    isArchiveModalOpen,
    isControlsModalOpen,
    isConsoleOpen,
    isFailureModalOpen,
    consoleInitialTab,
    isAnyModalOpen,
    isWristRaised,
    isPaused,
    anyDocumentedReadyToTransmit,
    missionProgress,
    handleOpenArtifact,
    handleOpenTransmission,
    handleOpenArchive,
    handleOpenConsole,
    handleCloseAllModals,
    handlePause,
    handleResume,
    handleUseEnergyCharge,
    rechargeState,
    handleCancelConfirmation,
    handleCancelArm,
    currentScreen,
  ]);

  const resumePlanet = useMemo(() => {
    return getResolvableResumePlanet();
  }, [currentScreen]);

  const resumeSummary = useMemo(() => {
    if (resumePlanet === 'moon') {
      return getSavedLunarMissionSummary() || undefined;
    }
    if (resumePlanet === 'mars') {
      return getSavedMissionSummary() || undefined;
    }
    return undefined;
  }, [resumePlanet, currentScreen]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] select-none">
      {/* ============================================================== */}
      {/* 1. CINEMATIC MAIN MENU SCREEN                                  */}
      {/* ============================================================== */}
      {currentScreen === 'menu' && (
        <MainMenu
          onNewGame={() => setCurrentScreen('destinations')}
          onResume={handleResumeGame}
          onOptions={() => handleOpenOptions('menu')}
          hasSavedGame={Boolean(resumePlanet)}
          resumePlanet={resumePlanet}
          savedGameSummary={resumeSummary}
        />
      )}

      {/* ============================================================== */}
      {/* 2. PLANET DESTINATION SELECTION SCREEN (MARS VS MOON)          */}
      {/* ============================================================== */}
      {currentScreen === 'destinations' && (
        <DestinationSelect
          onSelectMars={handleStartMars}
          onSelectMoon={handleStartMoon}
          onBack={() => setCurrentScreen('menu')}
        />
      )}

      {/* ============================================================== */}
      {/* 3. LUNAR EXPEDITION DOSSIER & LAUNCH MODAL                     */}
      {/* ============================================================== */}
      {currentScreen === 'lunar_preview' && (
        <LunarPreviewModal
          onBack={() => setCurrentScreen('destinations')}
          onLaunchMoon={handleStartMoon}
        />
      )}

      {/* ============================================================== */}
      {/* 4. EXPEDITION & SYSTEMS CONFIGURATION / OPTIONS SCREEN         */}
      {/* ============================================================== */}
      {currentScreen === 'options' && (
        <OptionsMenu
          settings={settings}
          onUpdateSettings={handleSettingsChange}
          onExpeditionReset={handleResetExpedition}
          onBack={handleOptionsBack}
          activePlanet={activePlanet}
        />
      )}

      {/* ============================================================== */}
      {/* 5. ACTIVE PLANETARY EXPEDITION SIMULATION & SURFACE OVERLAYS   */}
      {/* ============================================================== */}
      {(currentScreen === 'mars_game' || currentScreen === 'lunar_game') && (
        <>
          {/* 3D Exploration Canvas Viewport (Mars or Moon) */}
          {currentScreen === 'mars_game' ? (
            <MarsCanvas
              onStateUpdate={handleStateUpdate}
              onLockChange={handleLockChange}
              controllerRef={controllerRef}
              introPhase={introPhase}
              onLandingComplete={handleLandingComplete}
              skipIntroTrigger={skipIntroTrigger}
              mouseSensitivity={settings.mouseSensitivity}
              graphicsQuality={settings.graphicsQuality}
              isWristRaised={isWristRaised}
              onToggleWrist={handleToggleWrist}
              onUseEnergyCharge={handleUseEnergyCharge}
              rechargeState={rechargeState}
              chargingEnergy={chargingEnergy}
              chargingProgress={chargingProgress}
              onSelectChargeRequest={handleSelectChargeRequest}
              onPhysicalButtonClick={handleActivatePhysicalButton}
              onCancelArmRequest={handleCancelArm}
              initialPlayerState={initialPlayerState}
            />
          ) : (
            <MoonCanvas
              onStateUpdate={handleStateUpdate}
              onLockChange={handleLockChange}
              controllerRef={controllerRef}
              introPhase={introPhase}
              onLandingComplete={handleLandingComplete}
              skipIntroTrigger={skipIntroTrigger}
              mouseSensitivity={settings.mouseSensitivity}
              graphicsQuality={settings.graphicsQuality}
              isWristRaised={isWristRaised}
              onToggleWrist={handleToggleWrist}
              onUseEnergyCharge={handleUseEnergyCharge}
              rechargeState={rechargeState}
              chargingEnergy={chargingEnergy}
              chargingProgress={chargingProgress}
              onSelectChargeRequest={handleSelectChargeRequest}
              onPhysicalButtonClick={handleActivatePhysicalButton}
              onCancelArmRequest={handleCancelArm}
              initialPlayerState={initialPlayerState}
            />
          )}

          {/* Cinematic Landing Sequence & Welcome Overlay */}
          <IntroCinematic
            introPhase={introPhase}
            planet={activePlanet}
            onSkipLanding={handleSkipLanding}
            onBeginExpedition={handleBeginExpedition}
          />

          {/* Ares / Artemis EVA Heads-Up Display Overlay */}
          <HUD
            planet={activePlanet}
            playerState={playerState}
            isPointerLocked={isPointerLocked}
            isPaused={isPaused}
            hasStarted={hasStarted}
            isAnyModalOpen={isAnyModalOpen}
            introPhase={introPhase}
            onRequestLock={handleResume}
            onResume={handleResume}
            onResetPosition={handleResetPosition}
            onToggleScanner={handleToggleScanner}
            onUseEnergyCharge={handleUseEnergyCharge}
            isWristRaised={isWristRaised}
            onToggleWrist={handleToggleWrist}
            onOpenArtifactModal={() => handleOpenArtifact(playerState.activeArtifact.id)}
            onOpenControlsModal={() => handleOpenConsole('guide')}
            onOpenConsole={(tab) => handleOpenConsole(tab)}
            missionState={missionState}
            activeArtifactDocumented={activeProgress.isDocumented}
            activeArtifactTransmitted={activeProgress.isTransmitted}
            activeArtifactArchived={activeProgress.isArchived}
            onOpenTransmission={() => handleOpenTransmission(playerState.activeArtifact.id)}
            onOpenArchive={() => handleOpenConsole('archive')}
            showVisorOverlay={showVisorOverlay}
            onOpenOptions={() => handleOpenOptions(currentScreen)}
            onExitToMenu={handleExitToMenu}
            rechargeState={rechargeState}
            onSelectChargeRequest={handleSelectChargeRequest}
            onPhysicalButtonClick={handleActivatePhysicalButton}
            onCancelArmRequest={handleCancelArm}
            rewardNotification={rewardNotification}
            investigationHint={investigationHint}
          />

          {/* EVA Energy Multi-Step Recharge Confirmation Modal (Step 1) */}
          <RechargeConfirmModal
            isOpen={rechargeState === 'CONFIRMATION'}
            currentEnergy={playerState.energy}
            currentCharges={playerState.energyCharges}
            maxCharges={playerState.maxEnergyCharges}
            onConfirm={handleConfirmArm}
            onCancel={handleCancelConfirmation}
          />

          {/* Unified NASA Mission Console Modal */}
          <MissionConsoleModal
            isOpen={isConsoleOpen}
            onClose={handleCloseAllModals}
            initialTab={consoleInitialTab}
            onTabChange={(tab) => setConsoleInitialTab(tab)}
            playerState={playerState}
            missionState={missionState}
            missionProgress={activeMissionProgress}
            artifacts={activeArtifactsList}
            planet={activePlanet}
            onOpenArtifactReport={(artId) => handleOpenArtifact(artId)}
            onOpenTransmission={(artId) => handleOpenTransmission(artId)}
            onResetPosition={handleResetPosition}
            showVisorOverlay={showVisorOverlay}
            onToggleVisor={() => setShowVisorOverlay((v) => !v)}
          />

          {/* Artifact Investigation & Dossier Modal */}
          <ArtifactModal
            isOpen={isArtifactModalOpen}
            onClose={handleCloseAllModals}
            artifact={modalArtifact}
            playerState={playerState}
            isDocumented={modalProgress.isDocumented}
            isTransmitted={modalProgress.isTransmitted}
            isArchived={modalProgress.isArchived}
            onDocumentDiscovery={handleDocumentDiscovery}
            onOpenTransmission={(artId) => handleOpenTransmission(artId)}
            onOpenArchive={() => handleOpenConsole('archive')}
          />

          {/* Planetary Earth Data Transmission Interface Modal */}
          <TransmissionModal
            isOpen={isTransmissionModalOpen}
            onClose={handleCloseAllModals}
            artifact={modalArtifact}
            planet={activePlanet}
            playerState={playerState}
            onTransmissionComplete={handleTransmissionComplete}
            onOpenArchive={() => handleOpenConsole('archive')}
          />

          {/* NASA PDS Exploration Mission Archive Modal (Preserved for compatibility) */}
          <MissionArchiveModal
            isOpen={isArchiveModalOpen}
            onClose={handleCloseAllModals}
            missionState={missionState}
            missionProgress={activeMissionProgress}
            onOpenArtifactReport={(artId) => handleOpenArtifact(artId)}
            onOpenTransmission={(artId) => handleOpenTransmission(artId)}
          />

          {/* Controls & Systems Guide Modal (Preserved for compatibility) */}
          <ControlsModal
            isOpen={isControlsModalOpen}
            onClose={handleCloseAllModals}
          />

          {/* Mission Failure Screen (Power Depletion / Vitals Failure) */}
          <MissionFailureModal
            isOpen={isFailureModalOpen}
            reason={failureReason}
            playerState={playerState}
            missionState={missionState}
            onRestartMission={handleRestartMission}
            onExitToMenu={handleExitToMenu}
          />
        </>
      )}
    </div>
  );
}
