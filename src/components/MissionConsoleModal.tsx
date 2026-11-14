import React, { useState, useEffect } from 'react';
import {
  X,
  Map,
  Compass,
  Database,
  Sliders,
  HelpCircle,
  Radio,
  CheckCircle,
  Send,
  Eye,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  Activity,
  Shield,
  Crosshair,
  Lock,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { PlayerState } from '../mars/controls';
import { MissionState, PersistentMissionData, CATALOGED_MARS_ARTIFACTS, ArtifactProgress } from '../data/mission';
import { ALL_ARTIFACTS, Artifact } from '../data/artifacts';
import { CATALOGED_LUNAR_ARTIFACTS, LUNAR_ARTIFACT_LIST, ALL_LUNAR_ARTIFACTS } from '../data/lunarArtifacts';
import { marsAudio } from '../mars/audio';
import { MissionMap } from './MissionMap';

export type ConsoleTab = 'map' | 'mission' | 'archive' | 'system' | 'guide';

interface MissionConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ConsoleTab;
  onTabChange?: (tab: ConsoleTab) => void;
  playerState: PlayerState;
  missionState: MissionState;
  missionProgress: PersistentMissionData;
  onOpenArtifactReport: (artifactId: string) => void;
  onOpenTransmission: (artifactId: string) => void;
  onResetPosition: () => void;
  showVisorOverlay: boolean;
  onToggleVisor: () => void;
  planet?: 'mars' | 'moon';
  artifacts?: Artifact[];
}

export const MissionConsoleModal: React.FC<MissionConsoleModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'map',
  onTabChange,
  playerState,
  missionState,
  missionProgress,
  onOpenArtifactReport,
  onOpenTransmission,
  onResetPosition,
  showVisorOverlay,
  onToggleVisor,
  planet = 'mars',
  artifacts,
}) => {
  const [activeTab, setActiveTab] = useState<ConsoleTab>(initialTab);
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'archived' | 'pending' | 'locked'>('all');
  const [isMuted, setIsMuted] = useState(marsAudio.getMuted());

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsMuted(marsAudio.getMuted());
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleTabChange = (tab: ConsoleTab) => {
    marsAudio.playComponentSelect();
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleToggleSound = () => {
    const muted = marsAudio.toggleMute();
    setIsMuted(muted);
  };

  // Merge runtime persistent state for all planetary artifacts
  const baseCatalog = planet === 'moon' ? CATALOGED_LUNAR_ARTIFACTS : CATALOGED_MARS_ARTIFACTS;
  const catalogArtifacts: ArtifactProgress[] = baseCatalog.map((item) => {
    const prog = missionProgress[item.id];
    if (prog) {
      return {
        ...item,
        isDiscovered: prog.isDiscovered,
        isDocumented: prog.isDocumented,
        isTransmitted: prog.isTransmitted,
        isArchived: prog.isArchived,
        discoveredAt: prog.discoveredAt,
        documentedAt: prog.documentedAt,
        transmittedAt: prog.transmittedAt,
        archivedAt: prog.archivedAt,
      };
    }
    return item;
  });

  const filteredArtifacts = catalogArtifacts.filter((a) => {
    if (archiveFilter === 'archived') return a.isArchived;
    if (archiveFilter === 'pending') return a.isDiscovered && !a.isArchived;
    if (archiveFilter === 'locked') return !a.isDiscovered;
    return true;
  });

  const activeArt = playerState.activeArtifact;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none font-mono-tech"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          marsAudio.playTargetLock();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[780px] bg-[#07090e]/95 border border-[#38bdf8]/40 rounded-xl shadow-2xl flex flex-col text-[#e2e2ea] overflow-hidden">
        {/* Tactical HUD Corner Reticle Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8] pointer-events-none" />

        {/* ============================================================== */}
        {/* 1. CONSOLE HEADER                                              */}
        {/* ============================================================== */}
        <header className="px-5 py-3.5 border-b border-[#38bdf8]/20 bg-[#0c1018]/95 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
              <Terminal size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] text-[#38bdf8] uppercase tracking-widest font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                <span>{planet === 'moon' ? 'NASA // ARTEMIS EXPEDITION MISSION CONSOLE' : 'NASA // ARES EXPEDITION MISSION CONSOLE'}</span>
                <span className="text-[#87929a]">|</span>
                <span className="text-white">{playerState.missionSolStr}</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-wide uppercase mt-0.5">
                {activeTab === 'map'
                  ? (planet === 'moon' ? 'LUNAR EXPLORATION MAP // 1100M SURFACE QUADRANT' : 'MARS EXPLORATION MAP // 1100M SURFACE QUADRANT')
                  : 'SURFACE RECONNAISSANCE & TELEMETRY TERMINAL'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block text-xs">
              <span className="text-[10px] text-[#87929a] block">CAMPAIGN PROGRESS</span>
              <span className="font-bold text-[#10b981]">
                {missionState.artifactsArchived} / {missionState.totalArtifacts} ARCHIVED
              </span>
            </div>

            <button
              onClick={() => {
                marsAudio.playTargetLock();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#181d28] hover:bg-[#252c3d] text-[#87929a] hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Close Console [ESC]"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 2. CONSOLE NAVIGATION TABS                                     */}
        {/* ============================================================== */}
        <nav className="px-5 py-2.5 bg-[#090d14]/90 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { id: 'map', label: 'MAP [M]', icon: Map },
              { id: 'archive', label: `ARCHIVE (${missionState.artifactsArchived}/${missionState.totalArtifacts}) [X]`, icon: Database },
              { id: 'mission', label: 'MISSION', icon: Compass },
              { id: 'guide', label: 'GUIDE', icon: HelpCircle },
              { id: 'system', label: 'SYSTEM', icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as ConsoleTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#38bdf8] text-[#07090e] shadow-md shadow-[#38bdf8]/20'
                      : 'text-[#87929a] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-[#87929a]">
            <span>COORDS:</span>
            <span className="text-white font-bold">{playerState.latStr}, {playerState.lonStr}</span>
          </div>
        </nav>

        {/* ============================================================== */}
        {/* 3. TAB CONTENT BODY                                            */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
          {/* TAB 0: CONTEXTUAL MISSION MAP */}
          {activeTab === 'map' && (
            <MissionMap
              playerState={playerState}
              missionProgress={missionProgress}
              planet={planet}
              artifacts={artifacts}
              onSwitchToArchiveTab={() => {
                handleTabChange('archive');
              }}
            />
          )}

          {/* TAB 1: MISSION */}
          {activeTab === 'mission' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              {/* Active Expedition Objective */}
              <div className="bg-[#0e131d]/90 p-4 rounded-xl border border-[#38bdf8]/40 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] uppercase font-bold text-[#38bdf8]">
                  <span className="flex items-center gap-1.5">
                    <Crosshair size={13} className="text-[#f59e0b]" />
                    ACTIVE EXPEDITION OBJECTIVE
                  </span>
                  <span className="text-[#87929a] font-normal">
                    {planet === 'moon' ? 'LUNAR MET 01 // MARE TRANQUILLITATIS' : 'SOL 01 // JEZERO QUADRANT'}
                  </span>
                </div>
                <div className="mt-2.5 text-sm sm:text-base font-bold text-white leading-snug">
                  {activeArt.isClose
                    ? (planet === 'moon'
                        ? `Target Located: Press [I] to inspect ${activeArt.name}`
                        : `Proximity Lock Established: Investigate & Document ${activeArt.designation} (${activeArt.name})`)
                    : activeArt.isVisualContact
                    ? (planet === 'moon'
                        ? `Spotted Ahead: Walk closer to examine the ${activeArt.type === 'rover' ? 'lunar rover' : 'lunar lander'}`
                        : `Visual Contact Confirmed: Approach detected ${activeArt.type === 'rover' ? 'rover structure' : 'stationary lander structure'}`)
                    : activeArt.stage === 'human_signal'
                    ? (planet === 'moon'
                        ? 'Radio signal found! Press [F] to open your scanner and follow the arrows'
                        : 'Anomalous artificial RF signature detected: Deploy scanner with [F] and follow bearing vector')
                    : activeArt.stage === 'weak_anomaly'
                    ? (planet === 'moon'
                        ? 'Faint signal nearby! Follow the direction on your compass or scanner'
                        : 'Weak anomalous signature detected on long-range telemetry: Track signal bearing')
                    : (planet === 'moon'
                        ? 'Explore the Moon and look for real Apollo landers, rovers, and experiment stations!'
                        : 'Survey the Martian terrain for dormant historical NASA hardware across dunes and crater basins')}
                </div>
                <p className="mt-1 text-xs text-[#87929a] leading-relaxed">
                  {planet === 'moon'
                    ? `Walk or hop across the gray lunar ground. Press [F] to turn on your scanner, track down ${missionState.totalArtifacts} historic NASA landing sites, and learn what astronauts and scientists discovered here.`
                    : 'Historical NASA spacecraft remain intact across the 1100m exploration zone. Use the directional LIDAR scanner [F] to track anomalous RF emissions and uncover their scientific legacy.'}
                </p>
              </div>

              {/* Campaign Progress Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase font-bold">1. Discovered</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-bold font-display text-[#38bdf8]">
                      {missionState.artifactsDiscovered} <span className="text-xs text-[#87929a]">/ {missionState.totalArtifacts}</span>
                    </span>
                    <span className="text-[10px] text-[#38bdf8] font-bold">
                      {Math.round((missionState.artifactsDiscovered / missionState.totalArtifacts) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1e2330] h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-[#38bdf8] h-full transition-all duration-300"
                      style={{ width: `${(missionState.artifactsDiscovered / missionState.totalArtifacts) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase font-bold">2. Documented</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-bold font-display text-[#f59e0b]">
                      {missionState.artifactsDocumented} <span className="text-xs text-[#87929a]">/ {missionState.totalArtifacts}</span>
                    </span>
                    <span className="text-[10px] text-[#f59e0b] font-bold">
                      {Math.round((missionState.artifactsDocumented / missionState.totalArtifacts) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1e2330] h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-[#f59e0b] h-full transition-all duration-300"
                      style={{ width: `${(missionState.artifactsDocumented / missionState.totalArtifacts) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase font-bold">3. Transmitted</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-bold font-display text-[#a855f7]">
                      {missionState.artifactsTransmitted} <span className="text-xs text-[#87929a]">/ {missionState.totalArtifacts}</span>
                    </span>
                    <span className="text-[10px] text-[#a855f7] font-bold">
                      {Math.round((missionState.artifactsTransmitted / missionState.totalArtifacts) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1e2330] h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-[#a855f7] h-full transition-all duration-300"
                      style={{ width: `${(missionState.artifactsTransmitted / missionState.totalArtifacts) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase font-bold">4. Archived</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-bold font-display text-[#10b981]">
                      {missionState.artifactsArchived} <span className="text-xs text-[#87929a]">/ {missionState.totalArtifacts}</span>
                    </span>
                    <span className="text-[10px] text-[#10b981] font-bold">
                      {Math.round((missionState.artifactsArchived / missionState.totalArtifacts) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1e2330] h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-[#10b981] h-full transition-all duration-300"
                      style={{ width: `${(missionState.artifactsArchived / missionState.totalArtifacts) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Surface Telemetry Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0e121a]/80 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#38bdf8]" />
                      SURFACE INERTIAL NAVIGATION
                    </span>
                    <span className="text-[10px] text-[#87929a]">LOCAL DATUM</span>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Planetary Coordinates:</span>
                      <span className="text-white font-bold">{playerState.latStr}, {playerState.lonStr}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Elevation (AGL):</span>
                      <span className="text-[#38bdf8] font-bold">
                        {playerState.altitudeM >= 0 ? `+${playerState.altitudeM.toFixed(1)}m` : `${playerState.altitudeM.toFixed(1)}m`}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Distance from Expedition Base:</span>
                      <span className="text-white font-bold">{playerState.distanceFromStart.toFixed(1)} M</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Bearing to Base:</span>
                      <span className="text-[#38bdf8] font-bold">
                        {Math.round(playerState.baseBearingDeg ?? 180).toString().padStart(3, '0')}°
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#87929a]">Current Heading:</span>
                      <span className="text-white font-bold">
                        {Math.round(playerState.headingDeg).toString().padStart(3, '0')}°
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0e121a]/80 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Radio size={14} className="text-[#38bdf8]" />
                      NEAREST RF ANOMALY TELEMETRY
                    </span>
                    <span className="text-[10px] text-[#87929a]">SENSOR BUS</span>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Nearest Target:</span>
                      <span className="text-[#f59e0b] font-bold">
                        {activeArt.isIdentified ? activeArt.designation : 'ANOMALOUS HARDWARE'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Estimated Distance:</span>
                      <span className="text-white font-bold">{activeArt.distance.toFixed(1)} M</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Relative Vector:</span>
                      <span className="text-[#38bdf8] font-bold">{activeArt.relativeDirectionStr}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Scanner Confidence:</span>
                      <span className="text-white font-bold">{activeArt.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#87929a]">Scanner Status:</span>
                      <span className={`font-bold ${playerState.scannerActive ? 'text-[#38bdf8]' : 'text-[#87929a]'}`}>
                        {playerState.scannerActive ? 'ACTIVE [F TO STOW]' : 'STOWED [F TO DEPLOY]'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHIVE */}
          {activeTab === 'archive' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    NASA Planetary Data System (PDS) Catalog
                  </h3>
                  <p className="text-[11px] text-[#87929a]">
                    Verified archives of all {missionState.totalArtifacts} {planet === 'moon' ? 'lunar' : 'Mars'} exploration missions in this quad.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-[#121622] p-1 rounded-lg border border-white/5">
                  {[
                    { id: 'all', label: `ALL (${missionState.totalArtifacts})` },
                    { id: 'archived', label: `ARCHIVED (${missionState.artifactsArchived})` },
                    { id: 'pending', label: `IN PROGRESS (${missionState.artifactsDiscovered - missionState.artifactsArchived})` },
                    { id: 'locked', label: `LOCKED (${missionState.totalArtifacts - missionState.artifactsDiscovered})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        marsAudio.playComponentSelect();
                        setArchiveFilter(f.id as any);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        archiveFilter === f.id
                          ? 'bg-[#38bdf8] text-[#07090e]'
                          : 'text-[#87929a] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Artifacts List */}
              <div className="flex flex-col gap-2.5">
                {filteredArtifacts.map((item) => {
                  const rawArtifact = planet === 'moon' ? ALL_LUNAR_ARTIFACTS[item.id] : ALL_ARTIFACTS[item.id];
                  const isHistorical = !!rawArtifact;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        item.isArchived
                          ? 'bg-[#0f1924]/90 border-[#10b981]/50 shadow-md shadow-[#10b981]/5'
                          : item.isDocumented
                          ? 'bg-[#151c28]/90 border-[#f59e0b]/50'
                          : item.isDiscovered
                          ? 'bg-[#121822]/80 border-[#38bdf8]/40'
                          : 'bg-[#0d1017]/60 border-white/5 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-sm font-bold text-white tracking-wide">
                            {item.name.toUpperCase()}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f2430] border border-white/10 text-[#87929a]">
                            {item.designation}
                          </span>
                          <span className="text-[10px] text-[#87929a]">
                            {item.agency}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#bdc8d1] flex-wrap">
                          <div className="flex items-center gap-1">
                            <MapPin size={11} className="text-[#38bdf8]" />
                            <span>{item.site}</span>
                          </div>
                          <div className="text-[#87929a]">
                            NASA COORDS: <strong className="text-white font-mono-tech">{item.planetaryCoords}</strong>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.isArchived ? (
                            <span className="px-2 py-0.5 rounded bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle size={11} />
                              ✓ ARCHIVED IN NASA PDS
                            </span>
                          ) : item.isTransmitted ? (
                            <span className="px-2 py-0.5 rounded bg-[#a855f7]/20 border border-[#a855f7]/50 text-[#a855f7] font-bold text-[10px] flex items-center gap-1">
                              <Send size={11} />
                              TRANSMITTED • PENDING ARCHIVE
                            </span>
                          ) : item.isDocumented ? (
                            <span className="px-2 py-0.5 rounded bg-[#f59e0b]/20 border border-[#f59e0b]/50 text-[#f59e0b] font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle size={11} />
                              DOCUMENTED • READY TO TRANSMIT
                            </span>
                          ) : item.isDiscovered ? (
                            <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 border border-[#38bdf8]/50 text-[#38bdf8] font-bold text-[10px] flex items-center gap-1">
                              <Radio size={11} />
                              LOCATED IN FIELD • APPROACH TO DOCUMENT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#87929a] text-[10px] flex items-center gap-1">
                              <Lock size={11} />
                              UNDISCOVERED IN WORLD
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {item.isDocumented && !item.isTransmitted && (
                          <button
                            onClick={() => {
                              marsAudio.playTransmissionStart();
                              onClose();
                              onOpenTransmission(item.id);
                            }}
                            className="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#fbbf24] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#f59e0b]/20"
                          >
                            <Send size={13} />
                            <span>TRANSMIT [T]</span>
                          </button>
                        )}

                        {item.isDiscovered && isHistorical && (
                          <button
                            onClick={() => {
                              marsAudio.playComponentSelect();
                              onClose();
                              onOpenArtifactReport(item.id);
                            }}
                            className="px-3 py-1.5 bg-[#182338] hover:bg-[#25324d] text-[#38bdf8] border border-[#38bdf8]/40 hover:border-[#38bdf8] font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>INSPECT DOSSIER</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM */}
          {activeTab === 'system' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Audio System Control */}
                <div className="bg-[#0e121a]/80 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-[#38bdf8] uppercase tracking-wider font-bold block mb-1">
                      AUDIO ENVIRONMENT
                    </span>
                    <h4 className="text-sm font-bold text-white">Atmospheric &amp; Spacesuit Synthesizer</h4>
                    <p className="text-xs text-[#87929a] mt-1 leading-relaxed">
                      Procedural audio synthesized live via Web Audio API: thin Martian wind gusts, rhythmic suit breathing, and regolith footsteps.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-[#bdc8d1]">Status: <strong className={isMuted ? 'text-[#87929a]' : 'text-[#10b981]'}>{isMuted ? 'MUTED' : 'ACTIVE'}</strong></span>
                    <button
                      onClick={handleToggleSound}
                      className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isMuted
                          ? 'bg-[#1e2330] text-[#87929a] border border-white/10 hover:text-white'
                          : 'bg-[#38bdf8] text-[#07090e] shadow-md shadow-[#38bdf8]/20'
                      }`}
                    >
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
                    </button>
                  </div>
                </div>

                {/* Helmet Visor Overlay Control */}
                <div className="bg-[#0e121a]/80 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-[#38bdf8] uppercase tracking-wider font-bold block mb-1">
                      OPTICAL VISOR HUD
                    </span>
                    <h4 className="text-sm font-bold text-white">Helmet Graticule &amp; Vignette</h4>
                    <p className="text-xs text-[#87929a] mt-1 leading-relaxed">
                      Simulates physical helmet visor curvature with corner reticles and subtle ambient Martian dust reflections.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-[#bdc8d1]">Graticule: <strong className={showVisorOverlay ? 'text-[#38bdf8]' : 'text-[#87929a]'}>{showVisorOverlay ? 'ENABLED' : 'DISABLED'}</strong></span>
                    <button
                      onClick={onToggleVisor}
                      className="px-3 py-1.5 bg-[#182338] hover:bg-[#25324d] text-[#38bdf8] border border-[#38bdf8]/40 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye size={14} />
                      <span>TOGGLE VISOR</span>
                    </button>
                  </div>
                </div>

                {/* Base Emergency Return */}
                <div className="bg-[#0e121a]/80 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-[#f59e0b] uppercase tracking-wider font-bold block mb-1">
                      EVA SAFETY // RETURN TO BASE
                    </span>
                    <h4 className="text-sm font-bold text-white">{planet === 'moon' ? 'Tranquility Base Landing Clearing' : 'Jezero Expedition Landing Clearing'}</h4>
                    <p className="text-xs text-[#87929a] mt-1 leading-relaxed">
                      If oxygen or battery reserves drop dangerously low, return to the landing base clearing at (0, 0) to instantly refill life-support supplies.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-[#bdc8d1]">Safe Zone: <strong>(0, 0)</strong></span>
                    <button
                      onClick={() => {
                        marsAudio.playTargetLock();
                        onResetPosition();
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#fbbf24] text-[#07090e] rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-[#f59e0b]/20"
                    >
                      <RotateCcw size={14} />
                      <span>RETURN TO BASE</span>
                    </button>
                  </div>
                </div>

                {/* Engine & Graphics Specifications */}
                <div className="bg-[#0e121a]/80 p-4 rounded-xl border border-white/5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="text-[10px] text-[#38bdf8] uppercase tracking-wider font-bold">
                      GRAPHICS &amp; ENGINE SPECS
                    </span>
                    <span className="text-[10px] text-[#10b981] font-bold">60 FPS TARGET</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#bdc8d1]">
                    <div>Domain Size: <strong className="text-white">1100m × 1100m</strong></div>
                    <div>Gravity: <strong className="text-[#38bdf8]">{planet === 'moon' ? '0.166g Moon' : '0.38g Mars'}</strong></div>
                    <div>Terrain Vertices: <strong className="text-white">67,600</strong></div>
                    <div>Instanced Rocks: <strong className="text-white">1,170</strong></div>
                    <div>Color Tone Mapping: <strong className="text-white">ACES Filmic</strong></div>
                    <div>Renderer: <strong className="text-white">Three.js WebGL</strong></div>
                  </div>
                </div>
              </div>

              {/* Resume Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    marsAudio.playTargetLock();
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-[#38bdf8]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Crosshair size={15} />
                  <span>RESUME EXPEDITION</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GUIDE */}
          {activeTab === 'guide' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              {/* Controls Keybind Grid */}
              <div>
                <h3 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Terminal size={14} />
                  EXPEDITION CONTROLS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">WASD / ARROWS</span>
                    <span className="text-white">Walk &amp; Explore Martian Surface</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">MOUSE LOOK</span>
                    <span className="text-white">Click viewport to lock; 360° view</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">SHIFT</span>
                    <span className="text-white">Sprint (drains more O₂ &amp; Power)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">SPACE</span>
                    <span className="text-white">Low-Gravity Martian Leap</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">F</span>
                    <span className="text-white">Toggle Scientific LIDAR Scanner</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">E</span>
                    <span className="text-white">Wrist Energy Interface (6-Slot Matrix)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">I</span>
                    <span className="text-white">Investigate Discovered Relic / Dossier</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">C</span>
                    <span className="text-white">Use Energy Charge (100% Battery Refill)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">T</span>
                    <span className="text-white">Transmit Documented Data (DSN)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">M</span>
                    <span className="text-white">Open Contextual Mission Map</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#38bdf8] font-bold rounded">X</span>
                    <span className="text-white">Open Mission Archive Catalog</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e121a]/80 border border-white/5 md:col-span-2">
                    <span className="px-2 py-0.5 bg-[#1f2430] text-[#f59e0b] font-bold rounded">ESC</span>
                    <span className="text-white">Pause Expedition &amp; Open Mission Console</span>
                  </div>
                </div>
              </div>

              {/* Life Support & Sensor Systems Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#0e121a]/80 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[#38bdf8] font-bold uppercase text-[10px]">O₂ SUPPLY</span>
                  <p className="text-[#87929a] leading-relaxed">
                    Depletes slowly while walking (~41 min per full tank). Sprinting consumes more. Automatically refills at the expedition landing base.
                  </p>
                </div>
                <div className="p-3 bg-[#0e121a]/80 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[#38bdf8] font-bold uppercase text-[10px]">ENERGY SYSTEM</span>
                  <p className="text-[#87929a] leading-relaxed">
                    Powers suit sprinting and the active LIDAR scanner. Rapidly recharges when resting or walking at standard EVA pace.
                  </p>
                </div>
                <div className="p-3 bg-[#0e121a]/80 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[#38bdf8] font-bold uppercase text-[10px]">LIDAR SCANNER [F]</span>
                  <p className="text-[#87929a] leading-relaxed">
                    Emits directional RF pulses to detect artificial metallic signatures. Reveals bearing and distance as you close in.
                  </p>
                </div>
                <div className="p-3 bg-[#0e121a]/80 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[#38bdf8] font-bold uppercase text-[10px]">DSN TRANSMISSION</span>
                  <p className="text-[#87929a] leading-relaxed">
                    Downlinks documented science dossiers through NASA Goldstone 70m antenna directly into the Planetary Data System.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. CONSOLE FOOTER                                              */}
        {/* ============================================================== */}
        <footer className="px-5 py-3 border-t border-white/10 bg-[#090c12]/95 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-[#87929a] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span>EXPEDITION STATUS: ACTIVE // {missionState.totalArtifacts} HISTORICAL TARGETS</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                marsAudio.playTargetLock();
                onClose();
              }}
              className="px-4 py-1.5 bg-[#181d28] hover:bg-[#252c3d] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-white/10 cursor-pointer"
            >
              <span>RESUME EVA [ESC]</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
