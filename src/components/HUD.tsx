import React, { useState, useEffect, useRef } from 'react';
import { PlayerState } from '../mars/controls';
import { MissionState } from '../data/mission';
import { marsAudio } from '../mars/audio';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Radio,
  Activity,
  Battery,
  Wind,
  Crosshair,
  MapPin,
  CheckCircle,
  Scan,
  AlertTriangle,
  Send,
  Database,
  Sliders,
  Play,
  ArrowRight,
  Compass,
  Map,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { ConsoleTab } from './MissionConsoleModal';
import { IntroPhase } from './IntroCinematic';
import { RechargeState } from '../data/survivalConfig';

interface HUDProps {
  playerState: PlayerState;
  isPointerLocked: boolean;
  isPaused: boolean;
  hasStarted: boolean;
  isAnyModalOpen?: boolean;
  introPhase?: IntroPhase;
  onRequestLock: () => void;
  onResume: () => void;
  onResetPosition: () => void;
  onOpenArtifactModal: () => void;
  onOpenControlsModal: () => void;
  onOpenConsole: (tab?: ConsoleTab) => void;
  onToggleScanner: () => void;
  onUseEnergyCharge?: () => void;
  isWristRaised?: boolean;
  onToggleWrist?: () => void;
  missionState: MissionState;
  activeArtifactDocumented: boolean;
  activeArtifactTransmitted: boolean;
  activeArtifactArchived: boolean;
  onOpenTransmission: () => void;
  onOpenArchive: () => void;
  showVisorOverlay: boolean;
  onOpenOptions?: () => void;
  onExitToMenu?: () => void;
  rechargeState?: RechargeState;
  onSelectChargeRequest?: () => void;
  onPhysicalButtonClick?: () => void;
  onCancelArmRequest?: () => void;
  rewardNotification?: {
    message: string;
    submessage?: string;
    type: 'reward' | 'full';
  } | null;
  investigationHint?: string | null;
  planet?: 'mars' | 'moon';
}

export const HUD: React.FC<HUDProps> = ({
  playerState,
  isPointerLocked,
  isPaused,
  hasStarted,
  isAnyModalOpen = false,
  introPhase = 'game',
  onRequestLock,
  onResume,
  onResetPosition,
  onOpenArtifactModal,
  onOpenControlsModal,
  onOpenConsole,
  onToggleScanner,
  onUseEnergyCharge,
  isWristRaised = false,
  onToggleWrist,
  missionState,
  activeArtifactDocumented,
  activeArtifactTransmitted,
  activeArtifactArchived,
  onOpenTransmission,
  onOpenArchive,
  showVisorOverlay,
  onOpenOptions,
  onExitToMenu,
  rechargeState = 'IDLE',
  onSelectChargeRequest,
  onPhysicalButtonClick,
  onCancelArmRequest,
  rewardNotification,
  investigationHint,
  planet = 'mars',
}) => {
  const [isMuted, setIsMuted] = useState(marsAudio.getMuted());
  const [showAutoHint, setShowAutoHint] = useState(true);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevLockedRef = useRef(isPointerLocked);

  // Auto-hiding control hint: shows for 4.5 seconds on expedition start or resume, then fades out
  useEffect(() => {
    if (isPointerLocked && !prevLockedRef.current) {
      setShowAutoHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowAutoHint(false);
      }, 4500);
    }
    prevLockedRef.current = isPointerLocked;
  }, [isPointerLocked]);

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  const handleToggleSound = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const muted = marsAudio.toggleMute();
    setIsMuted(muted);
  };

  const activeArt = playerState.activeArtifact;

  // Generate degree ticks for the compact 360° compass tape
  const renderCompassTape = () => {
    const heading = Math.round(playerState.headingDeg);
    const range = 45; // +/- 45 degrees visible
    const ticks: { deg: number; label: string; isMajor: boolean }[] = [];

    for (let d = heading - range; d <= heading + range; d += 15) {
      const normDeg = (d + 360) % 360;
      let label = `${normDeg}°`;
      if (normDeg === 0) label = 'N';
      else if (normDeg === 45) label = 'NE';
      else if (normDeg === 90) label = 'E';
      else if (normDeg === 135) label = 'SE';
      else if (normDeg === 180) label = 'S';
      else if (normDeg === 225) label = 'SW';
      else if (normDeg === 270) label = 'W';
      else if (normDeg === 315) label = 'NW';

      ticks.push({
        deg: d,
        label,
        isMajor: normDeg % 45 === 0,
      });
    }

    return (
      <div className="relative w-48 h-5 overflow-hidden flex items-center justify-center select-none font-mono-tech">
        {ticks.map((t, idx) => {
          const offsetPx = (t.deg - heading) * 2.8;
          if (Math.abs(offsetPx) > 90) return null;

          return (
            <div
              key={idx}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center transition-transform duration-75"
              style={{ transform: `translateX(${offsetPx}px)` }}
            >
              <div
                className={`w-0.5 ${
                  t.isMajor ? 'h-2.5 bg-[#38bdf8]' : 'h-1.5 bg-[#87929a]/50'
                }`}
              />
              <span
                className={`text-[8px] mt-0.5 ${
                  t.isMajor ? 'text-[#38bdf8] font-bold' : 'text-[#87929a]/70'
                }`}
              >
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (introPhase !== 'game') {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none font-mono-tech text-[#e2e2ea]">
      {/* ============================================================== */}
      {/* 0. CINEMATIC VISOR CURVATURE (OPTIONAL TOGGLE)                 */}
      {/* ============================================================== */}
      {showVisorOverlay && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="absolute inset-0 opacity-25 mix-blend-screen"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 72%, rgba(200, 110, 60, 0.08) 90%, rgba(220, 100, 50, 0.2) 100%)',
            }}
          />
          <div className="absolute top-3 left-3 w-8 h-8 border-t border-l border-[#38bdf8]/30" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-[#38bdf8]/30" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l border-[#38bdf8]/30" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b border-r border-[#38bdf8]/30" />
        </div>
      )}

      {/* Critical Health Danger Red Vignette Overlay */}
      {playerState.life < 100 && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 45%, rgba(246, 65, 55, 0.4) 90%, rgba(246, 65, 55, 0.8) 100%)',
            opacity: Math.max(0.3, (100 - playerState.life) / 100),
          }}
        />
      )}

      {/* ============================================================== */}
      {/* 1. MINIMAL UPPER HUD: OBJECTIVE, COMPASS & COMPACT LIFE SUPPORT*/}
      {/* ============================================================== */}
      <header className="relative z-20 flex items-start justify-between gap-3 w-full">
        {/* Upper-Left: Compact Objective Pill */}
        <div className="flex flex-col gap-1 max-w-md sm:max-w-lg">
          <div className="bg-[#070a0f]/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse shrink-0" />
            <span className="text-[10px] text-[#38bdf8] font-bold uppercase tracking-wider hidden sm:inline">
              {planet === 'moon' ? 'ARTEMIS EVA' : 'ARES EVA'}
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="text-white font-medium truncate text-[11px] sm:text-xs">
              {activeArt.isClose
                ? `Investigate ${activeArt.designation} [I]`
                : activeArt.isVisualContact
                ? 'Object in visual range — approach to investigate'
                : activeArt.stage === 'human_signal'
                ? 'Artificial RF detected — track with scanner [F]'
                : activeArt.stage === 'weak_anomaly'
                ? 'Faint anomalous signal — follow scanner [F]'
                : 'Survey terrain for dormant NASA hardware'}
            </span>
          </div>

          {/* Expedition Landing Base Safe Zone Notice */}
          {playerState.isAtLandingBase && (
            <div className="bg-[#10b981]/20 border border-[#10b981]/40 px-3 py-1 rounded-full text-[10px] text-[#10b981] font-bold flex items-center gap-1.5 w-fit animate-in fade-in duration-200">
              <CheckCircle size={11} />
              <span>LANDING BASE SAFE ZONE // LIFE SUPPORT DOCKED</span>
            </div>
          )}

          {/* Low Oxygen Warning Pill */}
          {playerState.isOxygenLow && (
            <div
              className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit shadow-md ${
                playerState.isOxygenCritical
                  ? 'bg-red-600/90 text-white animate-pulse'
                  : 'bg-amber-500/85 text-black'
              }`}
            >
              <AlertTriangle size={12} />
              <span>
                {playerState.isOxygenCritical
                  ? 'CRITICAL O₂ SUPPLY (< 10%) // RETURN TO BASE'
                  : 'O₂ RESERVE LOW (< 25%) // STOP SPRINTING'}
              </span>
            </div>
          )}
        </div>

        {/* Upper-Center: Compact Heading & Base Tape (Only on desktop) */}
        <div className="hidden md:flex flex-col items-center bg-[#070a0f]/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 shadow-lg">
          <div className="flex items-center gap-2 text-[10px] text-[#87929a] mb-0.5">
            <span className="text-[#38bdf8] flex items-center gap-1">
              <MapPin size={10} />
              <span>BASE: {playerState.distanceFromStart.toFixed(0)}M</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="text-white font-bold font-mono-tech">
              HDG: {Math.round(playerState.headingDeg).toString().padStart(3, '0')}°
            </span>
          </div>
          <div className="relative w-full flex items-center justify-center">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-20 flex flex-col items-center pointer-events-none">
              <div className="w-0.5 h-full bg-[#38bdf8]/80 shadow-[0_0_4px_#38bdf8]" />
            </div>
            {renderCompassTape()}
          </div>
        </div>

        {/* Upper-Right: Tactical Quick Navigation Buttons + Spacesuit Life-Support Modules */}
        <div className="flex items-center gap-2">
          {/* Quick HUD Navigation Action Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Small MAP Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenConsole('map');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#070a0f]/85 hover:bg-[#182338] text-[#38bdf8] hover:text-white border border-[#38bdf8]/40 hover:border-[#38bdf8] rounded-xl shadow-lg transition-all cursor-pointer font-mono-tech text-[11px] font-bold tracking-wider active:scale-95"
              title="Open Mars Exploration Map [M]"
            >
              <Map size={13} className="text-[#38bdf8]" />
              <span>MAP</span>
              <kbd className="px-1 py-0.2 text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] rounded border border-[#38bdf8]/30 font-mono">
                M
              </kbd>
            </button>

            {/* Small ARCHIVE Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenArchive();
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#070a0f]/85 hover:bg-[#182338] text-[#10b981] hover:text-white border border-[#10b981]/30 hover:border-[#10b981] rounded-xl shadow-lg transition-all cursor-pointer font-mono-tech text-[11px] font-bold tracking-wider active:scale-95"
              title="Open Mission Archive [X]"
            >
              <Database size={13} className="text-[#10b981]" />
              <span>ARCHIVE</span>
              <kbd className="px-1 py-0.2 text-[9px] bg-[#10b981]/20 text-[#10b981] rounded border border-[#10b981]/30 font-mono">
                X
              </kbd>
            </button>
          </div>

          {/* Spacesuit Life-Support & Telemetry Status Modules */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#070a0f]/70 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/10 shadow-lg font-mono-tech">
          {/* Module 1: O₂ */}
          <div
            className={`flex flex-col justify-between px-2.5 py-1 rounded-lg border transition-colors min-w-[76px] sm:min-w-[84px] ${
              playerState.isOxygenCritical
                ? 'bg-red-950/60 border-red-500/60 text-red-400'
                : playerState.isOxygenLow
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                : 'bg-white/[0.03] border-white/10 text-white'
            }`}
            title={`Oxygen Reserve: ${playerState.oxygen.toFixed(0)}%`}
          >
            <div className="flex items-center justify-between gap-1.5 leading-none">
              <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase">
                <Wind
                  size={12}
                  className={`shrink-0 ${
                    playerState.isOxygenCritical
                      ? 'text-red-400 animate-spin'
                      : playerState.isOxygenLow
                      ? 'text-amber-400'
                      : 'text-[#38bdf8]'
                  }`}
                />
                <span
                  className={
                    playerState.isOxygenCritical
                      ? 'text-red-300 font-bold'
                      : playerState.isOxygenLow
                      ? 'text-amber-300'
                      : 'text-[#87929a]'
                  }
                >
                  O₂
                </span>
              </span>
              <span
                className={`text-xs sm:text-[13px] font-bold font-mono tabular-nums leading-none ${
                  playerState.isOxygenCritical
                    ? 'text-red-400 font-extrabold'
                    : playerState.isOxygenLow
                    ? 'text-amber-300'
                    : 'text-white'
                }`}
              >
                {Math.round(playerState.oxygen)}%
              </span>
            </div>
            {/* Subtle mini progress bar */}
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  playerState.isOxygenCritical
                    ? 'bg-red-500'
                    : playerState.isOxygenLow
                    ? 'bg-amber-400'
                    : 'bg-[#38bdf8]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, playerState.oxygen))}%` }}
              />
            </div>
          </div>

          {/* Module 2: ENERGY & RECHARGE INVENTORY */}
          <div
            className={`flex flex-col justify-between px-2.5 py-1 rounded-lg border transition-colors min-w-[96px] sm:min-w-[110px] ${
              playerState.emergencyCountdown !== null
                ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
                : playerState.isEnergyDepleted
                ? 'bg-red-950/60 border-red-500/60 text-red-400'
                : playerState.isEnergyLow
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                : 'bg-white/[0.03] border-white/10 text-white'
            }`}
            title={`Suit Power: ${playerState.energy.toFixed(0)}% | Speed: ${playerState.energySpeedStageLabel} | Charges: ${playerState.energyCharges}/${playerState.maxEnergyCharges}`}
          >
            <div className="flex items-center justify-between gap-1.5 leading-none">
              <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase">
                <Battery
                  size={12}
                  className={`shrink-0 ${
                    playerState.emergencyCountdown !== null || playerState.isEnergyDepleted
                      ? 'text-red-400'
                      : playerState.isEnergyLow
                      ? 'text-amber-400'
                      : 'text-[#38bdf8]'
                  }`}
                />
                <span
                  className={
                    playerState.isEnergyDepleted
                      ? 'text-red-300 font-bold'
                      : playerState.isEnergyLow
                      ? 'text-amber-300'
                      : 'text-[#87929a]'
                  }
                >
                  ENERGY
                </span>
              </span>
              <span
                className={`text-xs sm:text-[13px] font-bold font-mono tabular-nums leading-none ${
                  playerState.emergencyCountdown !== null || playerState.isEnergyDepleted
                    ? 'text-red-400 font-extrabold'
                    : playerState.isEnergyLow
                    ? 'text-amber-300'
                    : 'text-white'
                }`}
              >
                {Math.round(playerState.energy)}%
              </span>
            </div>

            {/* Subtle mini progress bar */}
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  playerState.emergencyCountdown !== null || playerState.isEnergyDepleted
                    ? 'bg-red-500'
                    : playerState.isEnergyLow
                    ? 'bg-amber-400'
                    : 'bg-[#38bdf8]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, playerState.energy))}%` }}
              />
            </div>

            {/* Charges Inventory & Speed Multiplier row */}
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10 text-[9px] font-mono leading-none gap-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (rechargeState === 'RECHARGE_READY') {
                      onPhysicalButtonClick?.();
                    } else if (onSelectChargeRequest) {
                      onSelectChargeRequest();
                    } else {
                      onUseEnergyCharge?.();
                    }
                  }}
                  disabled={playerState.energyCharges <= 0 && rechargeState !== 'RECHARGE_READY'}
                  className={`flex items-center gap-0.5 tracking-tight font-bold transition-all ${
                    rechargeState === 'RECHARGE_READY'
                      ? 'text-amber-400 animate-pulse cursor-pointer'
                      : playerState.energyCharges > 0
                      ? 'text-[#38bdf8] hover:text-white cursor-pointer active:scale-95'
                      : 'text-[#87929a] opacity-50 cursor-not-allowed'
                  }`}
                  title={
                    rechargeState === 'RECHARGE_READY'
                      ? 'Power cell armed! Click to inject'
                      : 'Click or press [C] to open Energy Recharge confirmation'
                  }
                >
                  <Zap size={9} className={rechargeState === 'RECHARGE_READY' ? 'text-amber-400' : 'text-[#38bdf8]'} />
                  <span>
                    {rechargeState === 'RECHARGE_READY'
                      ? 'ARMED'
                      : `${playerState.energyCharges}/${playerState.maxEnergyCharges}`}
                  </span>
                  <span className="text-[8px] bg-white/10 px-1 py-0.2 rounded ml-0.5 text-[#38bdf8]">
                    [C]
                  </span>
                </button>

                {onToggleWrist && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWrist();
                    }}
                    className={`px-1 py-0.2 rounded text-[8px] font-bold tracking-tight transition-all cursor-pointer ${
                      isWristRaised
                        ? 'bg-[#38bdf8] text-[#07090e]'
                        : 'bg-white/10 hover:bg-white/20 text-[#38bdf8]'
                    }`}
                    title="Click or press [E] to toggle 3D Wrist Energy Interface"
                  >
                    [E] WRIST
                  </button>
                )}
              </div>

              <span
                className={`text-[8px] font-bold uppercase tracking-wider ${
                  playerState.energySpeedMultiplier === 1.0
                    ? 'text-[#87929a]'
                    : playerState.energySpeedMultiplier >= 0.75
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
                title={`EVA Stride Velocity: ${Math.round(playerState.energySpeedMultiplier * 100)}%`}
              >
                {Math.round(playerState.energySpeedMultiplier * 100)}% SPD
              </span>
            </div>
          </div>

          {/* Module 3: SIGNAL */}
          <div
            className={`flex flex-col justify-between px-2.5 py-1 rounded-lg border transition-colors min-w-[80px] sm:min-w-[88px] ${
              playerState.signal < 25
                ? 'bg-red-950/40 border-red-500/40 text-red-400 opacity-80'
                : playerState.signal < 50
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-300 opacity-90'
                : 'bg-white/[0.03] border-white/10 text-white'
            }`}
            title={`DSN Signal Link: ${playerState.signal}%`}
          >
            <div className="flex items-center justify-between gap-1.5 leading-none">
              <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase">
                <Radio
                  size={12}
                  className={`shrink-0 ${
                    playerState.signal < 25
                      ? 'text-red-400/80'
                      : playerState.signal < 50
                      ? 'text-amber-400/80'
                      : 'text-[#38bdf8]'
                  }`}
                />
                <span
                  className={
                    playerState.signal < 25
                      ? 'text-red-400/70'
                      : playerState.signal < 50
                      ? 'text-amber-400/70'
                      : 'text-[#87929a]'
                  }
                >
                  SIGNAL
                </span>
              </span>
              <span
                className={`text-xs sm:text-[13px] font-bold font-mono tabular-nums leading-none ${
                  playerState.signal < 25
                    ? 'text-red-400'
                    : playerState.signal < 50
                    ? 'text-amber-200'
                    : 'text-white'
                }`}
              >
                {Math.round(playerState.signal)}%
              </span>
            </div>
            {/* Subtle mini progress bar */}
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  playerState.signal < 25
                    ? 'bg-red-500/80'
                    : playerState.signal < 50
                    ? 'bg-amber-400/80'
                    : 'bg-[#38bdf8]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, playerState.signal))}%` }}
              />
            </div>
          </div>

          {/* Emergency Health Module (Only visible when health drops below 100%) */}
          {playerState.life < 100 && (
            <div
              className="flex flex-col justify-between px-2.5 py-1 rounded-lg border border-red-500/50 bg-red-950/50 text-red-400 min-w-[76px] sm:min-w-[84px] animate-pulse"
              title={`Suit Integrity / Vitals: ${playerState.life.toFixed(0)}%`}
            >
              <div className="flex items-center justify-between gap-1.5 leading-none">
                <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase">
                  <Activity size={12} className="shrink-0 text-red-400" />
                  <span className="text-red-300">LIFE</span>
                </span>
                <span className="text-xs sm:text-[13px] font-bold font-mono text-red-300 tabular-nums leading-none">
                  {Math.round(playerState.life)}%
                </span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, playerState.life))}%` }}
                />
              </div>
            </div>
          )}
        </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 1.4. EVA RELIC DOCUMENTATION REWARD NOTIFICATION               */}
      {/* ============================================================== */}
      {rewardNotification && !isAnyModalOpen && (
        <div className="relative z-50 pointer-events-none w-full flex justify-center -mt-1 mb-2 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`backdrop-blur-md border-2 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3.5 max-w-lg w-full ${
              rewardNotification.type === 'reward'
                ? 'bg-[#041a2e]/95 border-[#38bdf8] text-[#e0f2fe] shadow-sky-950/90'
                : 'bg-[#1e1305]/95 border-amber-400 text-amber-100 shadow-amber-950/90'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                rewardNotification.type === 'reward'
                  ? 'bg-sky-950 border-[#38bdf8] text-[#38bdf8] shadow-md shadow-sky-500/30'
                  : 'bg-amber-950 border-amber-400 text-amber-400 shadow-md shadow-amber-500/30'
              }`}
            >
              <Zap size={22} className="fill-current animate-pulse" />
            </div>
            <div className="flex-1">
              <div
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
                  rewardNotification.type === 'reward' ? 'text-[#38bdf8]' : 'text-amber-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    rewardNotification.type === 'reward' ? 'bg-[#38bdf8]' : 'bg-amber-400'
                  } animate-ping`}
                />
                <span>ARES EVA // POWER LOGISTICS SYSTEM</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white uppercase font-display tracking-wide mt-0.5">
                {rewardNotification.message}
              </div>
              {rewardNotification.submessage && (
                <div className="text-[10px] text-slate-300 mt-0.5">
                  {rewardNotification.submessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1.5. EVA ENERGY RECHARGE STATE NOTIFICATIONS & STEP 2/3 CUES   */}
      {/* ============================================================== */}
      {rechargeState === 'RECHARGE_READY' && !isAnyModalOpen && (
        <div className="relative z-40 pointer-events-auto w-full flex justify-center -mt-1 mb-2 animate-in slide-in-from-top-3 duration-200">
          <div className="bg-[#080d17]/95 backdrop-blur-md border-2 border-[#38bdf8] rounded-2xl px-5 py-3 shadow-2xl shadow-sky-950/90 flex flex-col sm:flex-row items-center gap-4 max-w-xl w-full">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-400 flex items-center justify-center text-[#38bdf8] shrink-0 animate-pulse shadow-md shadow-sky-500/30">
              <Zap size={22} className="fill-current" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                <span>STEP 2 & 3 // POWER INJECTOR ARMED</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white uppercase font-display tracking-wide mt-0.5">
                PRESS WRIST PHYSICAL RECHARGE BUTTON
              </div>
              <div className="text-[10px] text-slate-300">
                1 energy cell chambered. Tap the physical button on your wrist display to restore battery to 100%.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  onPhysicalButtonClick?.();
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#0284c7] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0284c7] text-[#040810] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-sky-600/40 cursor-pointer active:scale-95 flex items-center gap-1.5"
                title="Activate energy injection immediately"
              >
                <Zap size={13} className="fill-current" />
                <span>INJECT [STEP 3]</span>
              </button>
              <button
                onClick={() => {
                  onCancelArmRequest?.();
                }}
                className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                title="Cancel arming and refund the charge to storage"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {rechargeState === 'CHARGING' && !isAnyModalOpen && (
        <div className="relative z-40 pointer-events-none w-full flex justify-center -mt-1 mb-2 animate-in fade-in duration-150">
          <div className="bg-[#042f2e]/95 backdrop-blur-md border-2 border-[#2dd4bf] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf] animate-ping" />
            <span className="text-xs font-bold font-mono tracking-wider text-[#2dd4bf] uppercase">
              ⚡ INJECTING PLASMA CORE // RESTORING BATTERY TO 100%...
            </span>
          </div>
        </div>
      )}

      {rechargeState === 'COMPLETE' && !isAnyModalOpen && (
        <div className="relative z-40 pointer-events-none w-full flex justify-center -mt-1 mb-2 animate-in zoom-in-95 duration-200">
          <div className="bg-[#064e3b]/95 backdrop-blur-md border-2 border-[#34d399] px-5 py-2 rounded-full shadow-2xl flex items-center gap-2.5">
            <CheckCircle size={15} className="text-[#34d399]" />
            <span className="text-xs font-bold font-mono tracking-wider text-[#34d399] uppercase">
              ENERGY RESTORED — 100% NOMINAL
            </span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CENTER VIEWPORT: CONTEXTUAL OVERLAYS ONLY                   */}
      {/* ============================================================== */}
      <div className="relative flex-1 w-full flex items-center justify-center pointer-events-none">
        {/* Subtle Minimal Center Crosshair */}
        <div className="relative w-8 h-8 flex items-center justify-center opacity-60">
          <div className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full" />
          <div className="absolute w-3 h-px bg-[#38bdf8]/60 -left-3" />
          <div className="absolute w-3 h-px bg-[#38bdf8]/60 -right-3" />
          <div className="absolute h-3 w-px bg-[#38bdf8]/60 -top-3" />
          <div className="absolute h-3 w-px bg-[#38bdf8]/60 -bottom-3" />
        </div>

        {/* TEMPORARY CONTEXTUAL SCANNER (Only visible when playerState.scannerActive) */}
        {playerState.scannerActive && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex items-center justify-center">
            {/* Minimal Lidar Radar Rings */}
            <svg
              className="absolute inset-0 w-full h-full text-[#38bdf8] opacity-20 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50%" cy="50%" r="140" fill="none" stroke="currentColor" strokeDasharray="4 8" strokeWidth="1" />
              <circle cx="50%" cy="50%" r="240" fill="none" stroke="currentColor" strokeDasharray="3 12" strokeWidth="1" />
              <circle cx="50%" cy="50%" r="360" fill="none" stroke="currentColor" strokeDasharray="2 16" strokeWidth="1" />
            </svg>

            {/* Compact Scanner Telemetry Card */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 sm:w-80 bg-[#070a0f]/85 backdrop-blur-md rounded-xl border border-[#38bdf8]/50 p-2.5 shadow-2xl flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between text-[10px] text-[#38bdf8]">
                <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider">
                  <Scan size={12} className="animate-spin text-[#38bdf8]" />
                  LIDAR // {playerState.scannerTelemetry.stage.toUpperCase().replace('_', ' ')}
                </span>
                <span className="font-bold text-white bg-[#38bdf8]/20 px-1.5 py-0.2 rounded">
                  {playerState.scannerTelemetry.confidence.toFixed(1)}% CONF
                </span>
              </div>

              <div className="text-[11px] font-bold text-white truncate">
                {playerState.scannerTelemetry.target}
              </div>

              {playerState.scannerTelemetry.stage !== 'no_signal' ? (
                <div className="grid grid-cols-3 gap-1.5 text-center bg-[#0d121c]/70 p-1.5 rounded text-[10px]">
                  <div>
                    <span className="text-[#87929a] block">BEARING</span>
                    <span className="text-[#38bdf8] font-bold font-mono-tech">
                      {Math.round(activeArt.bearingDeg).toString().padStart(3, '0')}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[#87929a] block">EST. RANGE</span>
                    <span className="text-white font-bold font-mono-tech">
                      {playerState.scannerTelemetry.stage === 'weak_anomaly'
                        ? `~${Math.round(playerState.scannerTelemetry.distance)}M`
                        : `${playerState.scannerTelemetry.distance.toFixed(1)}M`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#87929a] block">VECTOR</span>
                    <span className="text-[#38bdf8] font-bold">
                      {playerState.scannerTelemetry.relativeDirectionStr}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[9px] text-[#87929a] italic">
                  No anomaly in immediate range (&gt;260m). Traverse beyond ridges to acquire signal.
                </div>
              )}

              {/* Confidence progress bar */}
              <div className="w-full bg-[#1e2330] h-1 rounded-full overflow-hidden mt-0.5">
                <div
                  className="bg-[#38bdf8] h-full transition-all duration-300"
                  style={{ width: `${playerState.scannerTelemetry.confidence}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ZERO-ENERGY SURVIVAL EMERGENCY COUNTDOWN BANNER */}
        {playerState.emergencyCountdown !== null && playerState.emergencyCountdown >= 0 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-1.5 animate-in zoom-in-95 fade-in duration-150">
            <div className="bg-[#090b10]/95 backdrop-blur-md border-2 border-red-500/90 px-4 py-2.5 rounded-xl shadow-2xl shadow-red-950/80 flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400 shrink-0 animate-ping">
                <AlertTriangle size={18} />
              </div>

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span>EMERGENCY // ZERO SUIT POWER</span>
                  <span className="text-white/30">•</span>
                  <span>SHUTDOWN IN</span>
                  <span className="text-white font-mono text-xs font-extrabold bg-red-900/60 px-1.5 py-0.5 rounded border border-red-500/40">
                    {playerState.emergencyCountdown.toFixed(1)}s
                  </span>
                </div>
                <div className="text-[11px] text-amber-300 font-medium mt-0.5 flex items-center gap-2">
                  <span>
                    PRESS <kbd className="px-1.5 py-0.5 bg-black/60 border border-amber-400/50 rounded font-mono font-bold text-amber-200">[C]</kbd> TO CONSUME CHARGE
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white font-mono text-[10px]">
                    ({playerState.energyCharges} / {playerState.maxEnergyCharges} AVAILABLE)
                  </span>
                </div>
              </div>

              {onUseEnergyCharge && playerState.energyCharges > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUseEnergyCharge();
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md shadow-red-900/40 cursor-pointer transition-transform active:scale-95 flex items-center gap-1"
                >
                  <Zap size={13} />
                  <span>RECHARGE [C]</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subtle Visual Contact Notification (12m - 48m) */}
        {activeArt.isVisualContact && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1 animate-in fade-in duration-300">
            <div className="bg-[#070a0f]/80 backdrop-blur-md border border-[#38bdf8]/40 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
              <span className="text-[10px] font-bold text-[#38bdf8] tracking-widest uppercase">
                VISUAL CONTACT
              </span>
              <span className="text-white/30">•</span>
              <span className="text-[11px] text-white">
                {activeArt.type === 'rover' ? 'ROVER STRUCTURE' : activeArt.type === 'helicopter' ? 'AERIAL ROTORCRAFT AIRFRAME' : 'STATIONARY LANDER'}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-[11px] text-[#38bdf8] font-bold font-mono-tech">
                {Math.round(activeArt.distance)}M
              </span>
            </div>
          </div>
        )}

        {/* CONTEXTUAL INVESTIGATION PROMPT (< 12m) — Minimal, non-intrusive */}
        {activeArt.isClose && (
          <div className="absolute bottom-24 z-40 pointer-events-auto flex flex-col items-center gap-1.5 animate-in zoom-in-95 duration-150">
            <div className="bg-[#070a0f]/90 backdrop-blur-md border border-[#38bdf8]/50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3">
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#38bdf8] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
                  <span>TARGET LOCATED // {activeArt.designation}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white uppercase font-display tracking-wide">
                  {activeArt.name}
                </div>
              </div>

              <div className="h-6 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    marsAudio.playDiscoveryChime();
                    onOpenArtifactModal();
                  }}
                  className="px-3.5 py-1.5 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded-lg shadow-md shadow-[#38bdf8]/20 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                >
                  <Crosshair size={13} />
                  <span>{activeArtifactDocumented ? 'DOSSIER [I]' : 'INVESTIGATE [I]'}</span>
                </button>

                {activeArtifactDocumented && !activeArtifactTransmitted && (
                  <button
                    onClick={() => {
                      marsAudio.playTransmissionStart();
                      onOpenTransmission();
                    }}
                    className="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#fbbf24] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded-lg shadow flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                  >
                    <Send size={12} />
                    <span>TRANSMIT [T]</span>
                  </button>
                )}

                {activeArtifactArchived && (
                  <button
                    onClick={() => {
                      marsAudio.playComponentSelect();
                      onOpenArchive();
                    }}
                    className="px-2.5 py-1.5 bg-[#182338] hover:bg-[#25324d] text-[#38bdf8] font-bold text-[10px] uppercase tracking-wider rounded-lg border border-[#38bdf8]/30 flex items-center gap-1 cursor-pointer"
                  >
                    <Database size={11} />
                    <span>ARCHIVE [X]</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INVESTIGATION HINT TOAST */}
        {investigationHint && !isAnyModalOpen && !isPaused && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-[#0b111e]/95 border border-[#38bdf8]/50 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono-tech text-[#cbd5e1]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
              <span className="text-white font-bold">{investigationHint}</span>
            </div>
          </div>
        )}


        {/* AUTO-HIDING CONTROL HINT TOAST */}
        {showAutoHint && isPointerLocked && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-opacity duration-500">
            <div className="bg-[#070a0f]/75 backdrop-blur-sm border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[10px] text-[#bdc8d1] shadow-lg">
              <span><strong className="text-white">WASD</strong> Move</span>
              <span className="text-white/20">•</span>
              <span><strong className="text-white">Mouse</strong> Look</span>
              <span className="text-white/20">•</span>
              <span><strong className="text-[#38bdf8]">[E]</strong> Wrist Energy</span>
              <span className="text-white/20">•</span>
              <span><strong className="text-[#38bdf8]">[I]</strong> Investigate</span>
              <span className="text-white/20">•</span>
              <span><strong className="text-[#38bdf8]">[C]</strong> Recharge</span>
              <span className="text-white/20">•</span>
              <span><strong className="text-white">[F]</strong> Scanner</span>
              <span className="text-white/20">•</span>
              <span><strong className="text-white">[M]</strong> Map</span>
              <span className="text-white/20">•</span>
              <span><strong className="text-white">[X]</strong> Archive</span>
              <span className="text-white/20">•</span>
              <span><strong className="text-[#38bdf8]">[ESC]</strong> Menu</span>
            </div>
          </div>
        )}

        {/* PAUSE SCREEN OVERLAY (Only visible when game is explicitly paused and no modal is open) */}
        {isPaused && !isAnyModalOpen && !activeArt.isClose && (
          <div className="absolute inset-0 z-40 pointer-events-auto flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-[#070a0f]/90 border border-[#38bdf8]/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
              {/* Tactical Corner Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#38bdf8]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#38bdf8]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8]" />

              <div>
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#38bdf8] uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
                  <span>
                    {!hasStarted
                      ? (planet === 'moon' ? 'ARTEMIS EXPEDITION // LUNAR SURFACE ARRIVAL' : 'ARES EXPEDITION // MARS SURFACE ARRIVAL')
                      : 'EXPEDITION PAUSED'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-wide uppercase mt-1">
                  {!hasStarted ? (planet === 'moon' ? 'MARE TRANQUILLITATIS EXPEDITION' : 'JEZERO CRATER EXPEDITION') : 'SURFACE OPERATIONS PAUSED'}
                </h2>
                <p className="text-xs text-[#87929a] mt-1 leading-relaxed max-w-sm">
                  {!hasStarted
                    ? `Touchdown confirmed. Survey the 1100m quadrant for ${missionState.totalArtifacts} dormant NASA missions and recover their historical scientific data.`
                    : 'Click Resume or press ESC to recapture astronaut spacesuit controls and continue surface exploration.'}
                </p>
              </div>

              {/* Main Action: Resume EVA */}
              <button
                onClick={onResume}
                className="w-full py-3 px-5 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#38bdf8]/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Play size={15} />
                <span>
                  {!hasStarted
                    ? 'INITIALIZE SURFACE EVA — CLICK TO ENTER'
                    : 'RESUME SURFACE EVA'}
                </span>
              </button>

              {/* Secondary Navigation Actions */}
              <div className="grid grid-cols-2 gap-2 w-full text-xs">
                <button
                  onClick={() => onOpenConsole('map')}
                  className="py-2.5 px-3 bg-[#111622]/90 hover:bg-[#1b2336] text-white border border-[#38bdf8]/40 hover:border-[#38bdf8] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Map size={13} className="text-[#38bdf8]" />
                  <span>MISSION MAP [M]</span>
                </button>

                <button
                  onClick={() => onOpenConsole('archive')}
                  className="py-2.5 px-3 bg-[#111622]/90 hover:bg-[#1b2336] text-white border border-white/10 hover:border-[#38bdf8]/40 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Database size={13} className="text-[#10b981]" />
                  <span>ARCHIVE ({missionState.artifactsArchived}/{missionState.totalArtifacts}) [X]</span>
                </button>

                <button
                  onClick={() => onOpenConsole('guide')}
                  className="py-2.5 px-3 bg-[#111622]/90 hover:bg-[#1b2336] text-white border border-white/10 hover:border-[#38bdf8]/40 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <HelpCircle size={13} className="text-[#f59e0b]" />
                  <span>SYSTEM GUIDE</span>
                </button>

                <button
                  onClick={handleToggleSound}
                  className="py-2.5 px-3 bg-[#111622]/90 hover:bg-[#1b2336] text-white border border-white/10 hover:border-[#38bdf8]/40 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isMuted ? (
                    <>
                      <VolumeX size={13} className="text-[#87929a]" />
                      <span>AUDIO: MUTED</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={13} className="text-[#38bdf8]" />
                      <span>AUDIO: ON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Settings & Reset Actions */}
              <div className="grid grid-cols-2 gap-2 w-full text-xs">
                {onOpenOptions && (
                  <button
                    onClick={() => {
                      marsAudio.playMenuClick();
                      onOpenOptions();
                    }}
                    className="py-2 px-3 bg-[#111622]/90 hover:bg-[#1b2336] text-[#bdc8d1] hover:text-white border border-white/10 hover:border-[#38bdf8]/40 rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Settings size={12} className="text-[#38bdf8]" />
                    <span>SETTINGS</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    marsAudio.playTargetLock();
                    onResetPosition();
                  }}
                  className="py-2 px-3 bg-[#111622]/90 hover:bg-[#1b2336] text-[#bdc8d1] hover:text-white border border-white/10 hover:border-[#38bdf8]/40 rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>RESET TO BASE</span>
                </button>
              </div>

              {/* Exit to Main Menu */}
              {onExitToMenu && (
                <button
                  onClick={() => {
                    marsAudio.playMenuClick();
                    onExitToMenu();
                  }}
                  className="w-full py-2 px-3 bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-red-500/30"
                >
                  <LogOut size={12} />
                  <span>EXIT TO MAIN MENU</span>
                </button>
              )}

              {/* Controls Footer Legend */}
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] text-[#87929a] pt-2 border-t border-white/5 w-full">
                <span>WASD: Move</span>
                <span>•</span>
                <span>[F]: Scanner</span>
                <span>•</span>
                <span>[C]: Recharge</span>
                <span>•</span>
                <span>[M]: Map</span>
                <span>•</span>
                <span>[I]: Investigate</span>
                <span>•</span>
                <span>[X]: Archive</span>
                <span>•</span>
                <span>[ESC]: Pause</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. MINIMAL BOTTOM-LEFT HUD: SURFACE COORDINATES ONLY           */}
      {/* ============================================================== */}
      <footer className="relative z-20 w-full flex items-end justify-between gap-3 text-xs pointer-events-none">
        {/* Bottom-Left: Surface Inertial Nav — Minimalist & Transparent */}
        <div className="bg-[#070a0f]/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/5 shadow-lg text-[11px] flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-[9px] text-[#38bdf8] uppercase tracking-wider font-bold">
            <span>SURFACE NAV</span>
            <span className="text-white/20">•</span>
            <span className="text-[#87929a] font-normal">{planet === 'moon' ? 'MARE TRANQUILLITATIS' : 'JEZERO BASIN'}</span>
          </div>
          <div className="flex items-center gap-3 text-white font-mono-tech">
            <span className="font-bold">{playerState.latStr}, {playerState.lonStr}</span>
            <span className="text-white/20">•</span>
            <span className="text-[#38bdf8] font-bold">
              {playerState.altitudeM >= 0 ? `+${playerState.altitudeM.toFixed(1)}m` : `${playerState.altitudeM.toFixed(1)}m`} AGL
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[#bdc8d1]">BASE: <strong className="text-white">{playerState.distanceFromStart.toFixed(0)}M</strong></span>
          </div>
        </div>

        {/* Bottom-Right: Contextual Scanner Badge if active */}
        <div className="flex items-center gap-2">
          {playerState.scannerActive && (
            <div className="bg-[#070a0f]/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#38bdf8]/40 shadow-lg text-[10px] text-[#38bdf8] font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
              <Scan size={12} className="animate-spin text-[#38bdf8]" />
              <span>SCANNER ACTIVE [F TO STOW]</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
