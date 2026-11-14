import React from 'react';
import { AlertOctagon, RotateCcw, LogOut, ShieldAlert, Database, MapPin, Clock } from 'lucide-react';
import { PlayerState } from '../mars/controls';
import { MissionState } from '../data/mission';
import { marsAudio } from '../mars/audio';

export type FailureReason = 'energy_depleted' | 'oxygen_depleted' | 'vitals_failure';

interface MissionFailureModalProps {
  isOpen: boolean;
  reason: FailureReason;
  playerState: PlayerState;
  missionState: MissionState;
  onRestartMission: () => void;
  onExitToMenu: () => void;
}

export const MissionFailureModal: React.FC<MissionFailureModalProps> = ({
  isOpen,
  reason,
  playerState,
  missionState,
  onRestartMission,
  onExitToMenu,
}) => {
  if (!isOpen) return null;

  const isEnergyFailure = reason === 'energy_depleted';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 font-mono-tech select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="failure-title"
    >
      <div className="relative w-full max-w-xl bg-[#090b10] border-2 border-red-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-red-950/80 text-[#e2e2ea] flex flex-col gap-6 overflow-hidden">
        {/* Tactical Hazard Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500" />

        {/* Hazard Header Banner */}
        <div className="flex items-center gap-3.5 border-b border-red-500/30 pb-4">
          <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400 shrink-0 shadow-lg shadow-red-950/50 animate-pulse">
            <AlertOctagon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-red-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>ARES EVA // LIFE-SUPPORT TERMINATION</span>
            </div>
            <h2 id="failure-title" className="text-xl sm:text-2xl font-bold font-display text-white tracking-wide uppercase mt-0.5">
              {isEnergyFailure ? 'SUIT POWER SYSTEM SHUTDOWN' : 'PRIMARY O₂ RESERVES EXHAUSTED'}
            </h2>
          </div>
        </div>

        {/* Failure Breakdown */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs sm:text-sm text-red-200/90 leading-relaxed">
            {isEnergyFailure ? (
              <p>
                Astronaut spacesuit battery depleted to <strong>0%</strong>. The auxiliary emergency grace period expired before power cells were replenished via battery charge or landing base connection.
              </p>
            ) : (
              <p>
                Life-support oxygen reserves were completely exhausted during exploration, triggering systemic hypoxia and astronaut vital failure.
              </p>
            )}
          </div>

          {/* Telemetry Black-Box Snapshot */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-[#111622] border border-white/10 flex flex-col gap-1">
              <span className="text-[10px] text-[#87929a] uppercase tracking-wider flex items-center gap-1 font-bold">
                <Clock size={11} className="text-[#38bdf8]" />
                MET TIMELINE
              </span>
              <span className="font-bold text-white font-mono">{playerState.missionSolStr}</span>
            </div>

            <div className="p-3 rounded-lg bg-[#111622] border border-white/10 flex flex-col gap-1">
              <span className="text-[10px] text-[#87929a] uppercase tracking-wider flex items-center gap-1 font-bold">
                <MapPin size={11} className="text-[#f59e0b]" />
                INCIDENT LOCATION
              </span>
              <span className="font-bold text-white font-mono truncate">
                {playerState.latStr}, {playerState.lonStr}
              </span>
            </div>
          </div>

          {/* Archival Preservation Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0e1626] border border-[#38bdf8]/30 text-xs text-[#bdc8d1]">
            <Database size={16} className="text-[#38bdf8] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="text-[#38bdf8] font-bold block mb-0.5">
                SCIENTIFIC DATA SECURELY PRESERVED ({missionState.artifactsArchived} / {missionState.totalArtifacts} MISSIONS)
              </span>
              All discovered NASA relics, photographic dossiers, and DSN transmissions remain safe in NASA flight computer archives.
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              marsAudio.playMenuClick();
              onRestartMission();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#07090e] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#38bdf8]/20 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw size={15} />
            <span>RESTART MISSION (REDEPLOY TO BASE)</span>
          </button>

          <button
            onClick={() => {
              marsAudio.playMenuClick();
              onExitToMenu();
            }}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#171b24] hover:bg-[#252c3a] text-[#bdc8d1] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
