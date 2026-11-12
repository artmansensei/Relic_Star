import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Layers,
  Sparkles,
  Compass,
  Cpu,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Flame,
  Award,
  ChevronRight,
  ExternalLink,
  Send,
  Database,
  Camera,
  Search,
  Image as ImageIcon,
  AlertTriangle,
  Globe,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Artifact, ComponentInfo, KeyInstrument } from '../data/artifacts';
import { NasaOfficialImage, searchLiveNasaImages } from '../utils/nasaImagesApi';
import { PlayerState } from '../mars/controls';
import { marsAudio } from '../mars/audio';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: Artifact;
  playerState: PlayerState;
  isDocumented: boolean;
  isTransmitted: boolean;
  isArchived: boolean;
  onDocumentDiscovery: (artifactId: string) => void;
  onOpenTransmission: (artifactId: string) => void;
  onOpenArchive: () => void;
}

type TabType = 'overview' | 'science' | 'components' | 'instruments' | 'gallery' | 'discovery';

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  isOpen,
  onClose,
  artifact,
  playerState,
  isDocumented,
  isTransmitted,
  isArchived,
  onDocumentDiscovery,
  onOpenTransmission,
  onOpenArchive,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeComponentId, setActiveComponentId] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<NasaOfficialImage | null>(null);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [liveSearchResults, setLiveSearchResults] = useState<NasaOfficialImage[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const missionData = artifact.historical;

  // Reset image selection and failed URLs on artifact change
  useEffect(() => {
    setSelectedImage(null);
    setSearchQuery('');
    setLiveSearchResults([]);
    setSearchError(null);
  }, [artifact.id]);

  // Set initial component when opening or changing artifact
  useEffect(() => {
    if (missionData.components.length > 0) {
      setActiveComponentId(missionData.components[0].id);
    }
  }, [artifact.id]);

  if (!isOpen) return null;

  const isMoon =
    artifact.id.startsWith('apollo') ||
    artifact.id.startsWith('surveyor') ||
    artifact.id === 'lunar_laser_reflector';
  const celestialBodyName = isMoon ? 'the Moon' : 'Mars';
  const planetaryCoordinatesLabel = isMoon ? 'Real Lunar Coordinates' : 'Real Mars Coordinates';
  const sectorLabel = isMoon
    ? 'Moon Sandbox Exploration Sector (Local Grid)'
    : 'Mars Sandbox Exploration Sector (Local Grid)';

  const currentComponent: ComponentInfo =
    missionData.components.find((c) => c.id === activeComponentId) ||
    missionData.components[0] || {
      id: 'default',
      name: 'Hardware Module',
      function: 'Standard mission hardware.',
      scientificPurpose: 'Scientific instrument suite.',
      simulatedFieldCondition: `Surface exposed to ${isMoon ? 'lunar vacuum and thermal extremes' : 'Martian environment'}.`,
      missionRelevance: 'Primary exploration hardware.',
    };

  const handleTabChange = (tab: TabType) => {
    marsAudio.playComponentSelect();
    setActiveTab(tab);
  };

  const handleComponentClick = (id: string) => {
    marsAudio.playComponentSelect();
    setActiveComponentId(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          marsAudio.playTargetLock();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[820px] bg-[#090c12]/90 border border-[#38bdf8]/40 rounded-xl shadow-2xl flex flex-col text-[#e2e2ea] font-mono-tech overflow-hidden backdrop-filter">
        {/* Tactical HUD Corner Reticle Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8] pointer-events-none" />

        {/* ============================================================== */}
        {/* 1. MODAL HEADER: REAL MISSION IDENTITY                         */}
        {/* ============================================================== */}
        <header className="px-5 py-4 border-b border-[#38bdf8]/20 bg-[#0c1018]/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] tracking-widest text-[#38bdf8] uppercase">
              <span className="px-1.5 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/40 font-bold">
                ARTIFACT IDENTIFIED
              </span>
              <span className="text-[#87929a]">MISSION:</span>
              <span className="text-white font-bold">{missionData.missionName}</span>
              <span className="text-[#87929a]">•</span>
              <span className="text-[#87929a]">AGENCY:</span>
              <span className="text-[#38bdf8] font-bold">{missionData.agency}</span>
            </div>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold font-display text-white tracking-wide flex items-center gap-2">
                <span>{artifact.name.toUpperCase()}</span>
                <span className="text-xs sm:text-sm font-mono-tech font-normal text-[#87929a] bg-[#1d222e] px-2 py-0.5 rounded border border-white/10">
                  {missionData.designation}
                </span>
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  missionData.operationalStatus.includes('OPERATIONAL')
                    ? 'bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981]'
                    : 'bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                {missionData.operationalStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Quick Status Badge */}
            <div className="text-right hidden md:block">
              <span className="text-[10px] text-[#87929a] block">DISCOVERY STATUS</span>
              <span className="text-xs font-bold text-[#38bdf8]">
                {isArchived ? '✓ ARCHIVED' : isTransmitted ? '✓ TRANSMITTED' : isDocumented ? '✓ DOCUMENTED' : 'FIELD EVA LOCATED'}
              </span>
            </div>

            <button
              onClick={() => {
                marsAudio.playTargetLock();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#181d28] hover:bg-[#252c3d] text-[#87929a] hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Close [ESC]"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 2. NAVIGATION TABS                                            */}
        {/* ============================================================== */}
        <div className="flex items-center px-4 bg-[#0a0e16]/80 border-b border-white/10 overflow-x-auto scrollbar-none shrink-0 gap-1 text-xs">
          {[
            { id: 'overview', label: '1. OVERVIEW & METRICS', icon: Compass },
            { id: 'science', label: '2. SCIENTIFIC DOSSIER', icon: Sparkles },
            { id: 'components', label: `3. HARDWARE SUITE (${missionData.components.length})`, icon: Cpu },
            { id: 'instruments', label: `4. INSTRUMENTS (${missionData.keyInstruments.length})`, icon: Layers },
            { id: 'gallery', label: `5. NASA IMAGERY (${missionData.officialImages?.length || 0})`, icon: Camera },
            { id: 'discovery', label: '6. FIELD DISCOVERY DATA', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`py-2.5 px-3.5 flex items-center gap-2 border-b-2 font-bold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10'
                    : 'border-transparent text-[#87929a] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* 3. TAB CONTENT PANELS                                         */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-150">
              {/* Mission Summary Banner */}
              <div className="bg-[#10141e]/90 p-4 rounded-lg border border-[#38bdf8]/30 flex flex-col gap-2">
                <span className="text-[10px] text-[#38bdf8] font-bold tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  NASA / JPL PLANETARY DATA SYSTEM ARCHIVE
                </span>
                <p className="text-white text-xs sm:text-sm leading-relaxed">
                  {missionData.majorScientificPurpose}
                </p>
              </div>

              {/* Factual Mission Telemetry Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase">Real Landing Site</span>
                  <span className="text-white font-bold text-xs sm:text-sm">{missionData.landingSite}</span>
                </div>

                {missionData.finalLocation && (
                  <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] text-[#87929a] uppercase">Final Historical Location / Status</span>
                    <span className="text-white font-bold text-xs sm:text-sm">{missionData.finalLocation}</span>
                  </div>
                )}

                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase">{planetaryCoordinatesLabel}</span>
                  <span className="text-[#38bdf8] font-bold text-xs sm:text-sm font-mono-tech">
                    {missionData.realCoordinates}
                  </span>
                </div>

                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase">Landing Date</span>
                  <span className="text-white font-bold text-xs sm:text-sm">{missionData.landingDate}</span>
                </div>

                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase">Planned vs Actual Duration</span>
                  <span className="text-[#f59e0b] font-bold text-xs sm:text-sm">
                    {missionData.plannedDuration} / {missionData.actualDuration}
                  </span>
                </div>

                {missionData.distanceTraveled && (
                  <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] text-[#87929a] uppercase">Distance Traveled</span>
                    <span className="text-white font-bold text-xs sm:text-sm">{missionData.distanceTraveled}</span>
                  </div>
                )}

                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase">Last Communication Link</span>
                  <span className="text-white font-bold text-xs sm:text-sm">{missionData.lastCommunication}</span>
                </div>

                <div className="bg-[#121622]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#87929a] uppercase">Mission Concluded</span>
                  <span className="text-white font-bold text-xs sm:text-sm">{missionData.missionConcluded}</span>
                </div>
              </div>

              {/* Geographic Clarification: Planetary Coordinates vs Simulation Sector */}
              <div className="bg-[#0e1422]/90 p-4 rounded-lg border border-[#38bdf8]/40 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] text-[#38bdf8] font-bold tracking-widest uppercase flex items-center gap-1.5">
                    <Globe size={14} className="text-[#38bdf8]" />
                    PLANETARY GEOGRAPHY VS. SIMULATED LOCAL QUADRANT
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] font-bold uppercase">
                    GEOGRAPHIC FIDELITY
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#080c14] p-3 rounded border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] text-[#87929a] uppercase font-bold">Authentic {isMoon ? 'Lunar' : 'Mars'} Landing Coordinates</span>
                    <span className="text-[#38bdf8] font-bold font-mono-tech text-sm">{missionData.realCoordinates}</span>
                    <span className="text-[#87929a] text-[11px]">{missionData.landingSite}</span>
                  </div>
                  <div className="bg-[#080c14] p-3 rounded border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] text-[#87929a] uppercase font-bold">Simulated EVA Exploration Sector</span>
                    <span className="text-white font-bold font-mono-tech text-sm">
                      X: {artifact.worldPosition.x}m • Y: {artifact.worldPosition.y}m • Z: {artifact.worldPosition.z}m
                    </span>
                    <span className="text-[#87929a] text-[11px]">{sectorLabel}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#9ca3af] leading-relaxed border-t border-white/5 pt-2">
                  <strong className="text-white">Note on Planetary Scale:</strong>{' '}
                  {isMoon
                    ? 'In reality, Apollo and Surveyor landing sites are distributed thousands of kilometers apart across distinct maria and highland basins of the Moon (e.g., Mare Tranquillitatis, Oceanus Procellarum, Hadley-Apennine, Taurus-Littrow, and Fra Mauro). In this simulation, authentic relic designs are placed within a navigable local sector to facilitate real-time comparative exploration while preserving genuine historical telemetry.'
                    : 'In reality, historical NASA landing sites are distributed thousands of kilometers apart across distinct geological provinces of Mars (e.g., Gusev Crater, Meridiani Planum, Vastitas Borealis, Elysium Planitia, Gale Crater, Ares Vallis, and Jezero Crater). In this simulation, authentic relic designs are placed within a navigable local sector to facilitate real-time comparative exploration while preserving genuine historical telemetry.'}
                </p>
              </div>

              {/* Authoritative NASA Archive Citations */}
              <div className="bg-[#121622]/80 p-4 rounded-lg border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Database size={13} className="text-[#38bdf8]" />
                    NASA &amp; JPL Authoritative Mission Archives
                  </span>
                  <span className="text-[11px] text-[#87929a]">
                    Cross-referenced with NASA Planetary Data System (PDS) science repositories.
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {missionData.verifiedSourceUrl && (
                    <a
                      href={missionData.verifiedSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded bg-[#182338] hover:bg-[#25324d] text-[#38bdf8] border border-[#38bdf8]/40 hover:border-[#38bdf8] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span>NASA Mission Portal</span>
                    </a>
                  )}
                  {missionData.pdsArchiveUrl && (
                    <a
                      href={missionData.pdsArchiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded bg-[#1f2430] hover:bg-[#2b3242] text-white border border-white/15 hover:border-white/30 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <Database size={12} />
                      <span>PDS Geosciences</span>
                    </a>
                  )}
                </div>
              </div>

              {/* TIER 1: Verified Historical Facts List */}
              {missionData.verifiedFacts && missionData.verifiedFacts.length > 0 && (
                <div className="bg-[#10141e]/90 p-4 rounded-lg border border-[#38bdf8]/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#38bdf8] font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <CheckCircle size={13} className="text-[#38bdf8]" />
                      TIER 1 — VERIFIED HISTORICAL NASA FACTS (PDS ARCHIVES)
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] font-bold uppercase">
                      HISTORICAL RECORD
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {missionData.verifiedFacts.map((fact, idx) => (
                      <div key={idx} className="bg-[#0b0e14] p-3 rounded border border-white/5 flex items-start gap-2">
                        <span className="text-[#38bdf8] font-bold shrink-0">•</span>
                        <span className="text-[#d1d5db] leading-relaxed">{fact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Known Historical Status */}
              <div className="bg-[#0e121a]/80 p-4 rounded-lg border-l-2 border-[#f59e0b] flex flex-col gap-1.5">
                <span className="text-[10px] text-[#f59e0b] font-bold uppercase tracking-wider">
                  HISTORICAL MISSION CONCLUSION STATUS:
                </span>
                <p className="text-xs text-[#bdc8d1] leading-relaxed">
                  {missionData.lastKnownStatus}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SCIENTIFIC DOSSIER */}
          {activeTab === 'science' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              <div className="bg-[#10141e]/90 p-4 rounded-lg border border-[#38bdf8]/30">
                <h3 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider mb-1.5">
                  SCIENTIFIC REVOLUTION &amp; IMPORTANCE
                </h3>
                <p className="text-white text-xs sm:text-sm leading-relaxed">
                  {missionData.scientificImportance}
                </p>
              </div>

              {/* Verified Key Discoveries */}
              <div>
                <h3 className="text-xs font-bold text-[#87929a] uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-[#38bdf8]" />
                    <span>VERIFIED SCIENTIFIC DISCOVERIES &amp; MEASUREMENTS</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] font-bold uppercase">
                    MEASURED OBSERVATIONS
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {missionData.keyDiscoveries.map((discovery, idx) => {
                    const [title, ...descParts] = discovery.split(':');
                    const desc = descParts.join(':');
                    return (
                      <div
                        key={idx}
                        className="bg-[#111520]/80 p-3.5 rounded-lg border border-white/5 flex flex-col gap-1"
                      >
                        <span className="text-xs font-bold text-[#38bdf8] flex items-center gap-1.5">
                          <CheckCircle size={13} className="text-[#38bdf8] shrink-0" />
                          <span>{title}</span>
                        </span>
                        {desc && (
                          <p className="text-[11px] text-[#bdc8d1] leading-relaxed mt-0.5">
                            {desc.trim()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TIER 2: Scientific Interpretations & Working Hypotheses */}
              {missionData.scientificInterpretations && missionData.scientificInterpretations.length > 0 && (
                <div className="bg-[#10141e]/90 p-4 rounded-lg border border-[#f59e0b]/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#f59e0b] font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#f59e0b]" />
                      TIER 2 — SCIENTIFIC INTERPRETATIONS &amp; WORKING HYPOTHESES
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#f59e0b] font-bold uppercase">
                      SCIENTIFIC MODELS (NOT DOGMATIC FACTS)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#87929a] italic">
                    Geochemical, geophysical, and astrobiological models developed by planetary scientists to explain observed surface data.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {missionData.scientificInterpretations.map((interp, idx) => {
                      const [title, ...descParts] = interp.split(':');
                      const desc = descParts.join(':');
                      return (
                        <div key={idx} className="bg-[#0b0e14] p-3 rounded border border-white/5 flex flex-col gap-1">
                          <span className="text-xs font-bold text-[#f59e0b] flex items-center gap-1.5">
                            <Sparkles size={12} className="text-[#f59e0b] shrink-0" />
                            <span>{title}</span>
                          </span>
                          {desc && <p className="text-xs text-[#bdc8d1] leading-relaxed">{desc.trim()}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 3D COMPONENTS */}
          {activeTab === 'components' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-150">
              {/* Components List Column */}
              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] text-[#87929a] uppercase pb-1 border-b border-white/10">
                  <span>SUBSYSTEM HARDWARE MODULES</span>
                  <span className="text-[#38bdf8]">JPL DESIGN</span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {missionData.components.map((c) => {
                    const isSelected = c.id === currentComponent.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleComponentClick(c.id)}
                        className={`text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#38bdf8]/15 border-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                            : 'bg-[#121622]/60 border-white/5 hover:bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-white">{c.name}</div>
                          <div className="text-[10px] text-[#87929a] truncate max-w-[240px] mt-0.5">
                            {c.function}
                          </div>
                        </div>
                        <ChevronRight
                          size={15}
                          className={`shrink-0 transition-transform ${
                            isSelected ? 'text-[#38bdf8] translate-x-1' : 'text-[#87929a]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Component Detail Column */}
              <div className="lg:col-span-7 bg-[#10141e]/90 p-5 rounded-lg border border-[#38bdf8]/30 flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] text-[#38bdf8] font-bold tracking-widest uppercase block mb-1">
                      HARDWARE COMPONENT DOSSIER
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white font-display">
                      {currentComponent.name}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-[10px] text-[#87929a] uppercase font-bold">Engineering Function</span>
                    <p className="text-white leading-relaxed">{currentComponent.function}</p>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-[10px] text-[#87929a] uppercase font-bold">Scientific Purpose</span>
                    <p className="text-[#bdc8d1] leading-relaxed">{currentComponent.scientificPurpose}</p>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-[10px] text-[#87929a] uppercase font-bold">Simulated Field Condition</span>
                    <div className="p-2.5 rounded bg-[#0a0d14] border border-white/5 text-[#f59e0b]">
                      {currentComponent.simulatedFieldCondition}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-[10px] text-[#87929a] uppercase font-bold">Mission Relevance</span>
                    <p className="text-xs text-[#87929a] leading-relaxed">{currentComponent.missionRelevance}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#87929a]">
                  <span>Component Status: Cataloged Hardware</span>
                  <span className="text-[#38bdf8] font-bold">NASA JPL SPECIFICATION</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSTRUMENTS */}
          {activeTab === 'instruments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-in fade-in duration-150">
              {missionData.keyInstruments.map((inst, idx) => (
                <div
                  key={idx}
                  className="bg-[#10141e]/90 p-4 rounded-lg border border-white/5 hover:border-[#38bdf8]/40 transition-colors flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-display">{inst.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold border border-[#38bdf8]/30">
                      {inst.acronym}
                    </span>
                  </div>
                  <p className="text-xs text-[#bdc8d1] leading-relaxed mt-1">
                    {inst.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: OFFICIAL NASA IMAGERY & ARCHIVES */}
          {activeTab === 'gallery' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              {/* Header Banner */}
              <div className="bg-[#10141e]/90 p-4 rounded-lg border border-[#38bdf8]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#38bdf8] font-bold tracking-widest uppercase flex items-center gap-1.5">
                    <Camera size={13} className="text-[#38bdf8]" />
                    OFFICIAL NASA / JPL PHOTO ARCHIVE (BUNDLED OFFLINE)
                  </span>
                  <p className="text-white text-xs sm:text-sm">
                    Authentic mission photography captured in-situ on {celestialBodyName} by {artifact.name} and supporting NASA spacecraft. Bundled locally for full offline exploration.
                  </p>
                </div>
                <div className="text-[10px] px-2.5 py-1 rounded bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] font-bold uppercase shrink-0">
                  BUNDLED OFFLINE ASSETS • ZERO CDN DEPENDENCY
                </div>
              </div>

              {/* Verified Primary Mission Photographs Grid */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-[#10b981]" />
                    <span>CURATED NASA MISSION PHOTOGRAPHS ({missionData.officialImages?.length || 0})</span>
                  </h3>
                  <span className="text-[10px] text-[#87929a]">
                    Stored locally in public/images/nasa • Click to inspect
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(missionData.officialImages || []).map((img) => {
                    const hasFailed = failedImageUrls.has(img.imageUrl);
                    return (
                      <div
                        key={img.nasaId}
                        onClick={() => {
                          marsAudio.playComponentSelect();
                          setSelectedImage(img);
                        }}
                        className="group bg-[#0e121a] rounded-lg border border-white/10 hover:border-[#38bdf8]/60 transition-all overflow-hidden flex flex-col cursor-pointer hover:shadow-lg hover:shadow-[#38bdf8]/5"
                      >
                        <div className="relative aspect-video w-full bg-[#07090e] overflow-hidden flex items-center justify-center">
                          {hasFailed ? (
                            <div className="p-4 flex flex-col items-center justify-center text-center gap-1.5">
                              <AlertTriangle size={24} className="text-[#f59e0b]" />
                              <span className="text-xs text-white font-bold">{img.title}</span>
                              <span className="text-[10px] text-[#87929a]">
                                Image asset offline or missing. Click to view catalog details.
                              </span>
                              <span className="text-[9px] text-[#38bdf8] font-mono-tech mt-1">
                                {img.nasaId} // {img.credit}
                              </span>
                            </div>
                          ) : (
                            <>
                              <img
                                src={img.imageUrl}
                                alt={img.title}
                                onError={() => {
                                  setFailedImageUrls((prev) => new Set(prev).add(img.imageUrl));
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                                <span className="text-[11px] text-[#38bdf8] font-bold flex items-center gap-1">
                                  <Eye size={12} /> Inspect NASA Catalog Record
                                </span>
                              </div>
                            </>
                          )}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/10 text-[9px] text-[#38bdf8] font-mono-tech">
                              {img.nasaId}
                            </span>
                            {img.isLocal && (
                              <span className="px-1.5 py-0.5 rounded bg-[#10b981]/25 border border-[#10b981]/50 text-[8px] text-[#10b981] font-bold uppercase tracking-wider">
                                OFFLINE READY
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-3.5 flex flex-col gap-1.5 flex-1 justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                              {img.title}
                            </h4>
                            <p className="text-[11px] text-[#9ca3af] line-clamp-2 mt-1 leading-relaxed">
                              {img.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#87929a] pt-2 border-t border-white/5">
                            <span>{img.dateCreated}</span>
                            <span className="text-[#38bdf8] truncate max-w-[180px]">{img.credit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Public NASA Image Search Section */}
              <div className="bg-[#0f141e]/90 p-4 rounded-lg border border-white/10 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Search size={14} className="text-[#38bdf8]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      SEARCH OFFICIAL NASA IMAGE LIBRARY (LIVE PUBLIC API)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#87929a]">
                    Connects directly to images-api.nasa.gov • No private key required
                  </span>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!searchQuery.trim()) return;
                    setIsSearching(true);
                    setSearchError(null);
                    try {
                      const res = await searchLiveNasaImages(searchQuery);
                      setLiveSearchResults(res);
                      if (res.length === 0) {
                        setSearchError('No matching NASA photographs found for this query.');
                      }
                    } catch (err: any) {
                      setSearchError('Unable to query NASA live API (offline or network blocked). Displaying verified offline assets.');
                    } finally {
                      setIsSearching(false);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`e.g. "${artifact.historical.artifactName}" or "${artifact.historical.missionName}"`}
                    className="flex-1 bg-[#090c12] border border-white/15 focus:border-[#38bdf8] rounded px-3 py-1.5 text-xs text-white placeholder-[#555e6c] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-1.5 bg-[#182338] hover:bg-[#25324d] text-[#38bdf8] border border-[#38bdf8]/40 hover:border-[#38bdf8] rounded font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSearching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                    <span>{isSearching ? 'SEARCHING...' : 'SEARCH NASA'}</span>
                  </button>
                  {liveSearchResults.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLiveSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#87929a] hover:text-white rounded text-xs transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </form>

                {searchError && (
                  <div className="p-2.5 rounded bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-[11px] flex items-center gap-2">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                {/* Live Search Results */}
                {liveSearchResults.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[11px] text-[#38bdf8] font-bold uppercase tracking-wider">
                      LIVE NASA RESULTS ({liveSearchResults.length} IMAGES RETURNED)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {liveSearchResults.map((img) => (
                        <div
                          key={img.nasaId}
                          onClick={() => {
                            marsAudio.playComponentSelect();
                            setSelectedImage(img);
                          }}
                          className="group bg-[#090c12] rounded border border-white/10 hover:border-[#38bdf8]/50 p-2 flex flex-col gap-1.5 cursor-pointer"
                        >
                          <div className="aspect-video w-full bg-black rounded overflow-hidden">
                            <img
                              src={img.thumbUrl || img.imageUrl}
                              alt={img.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-[11px] font-bold text-white group-hover:text-[#38bdf8] line-clamp-1">
                            {img.title}
                          </span>
                          <span className="text-[9px] text-[#87929a] font-mono-tech">{img.nasaId} • {img.dateCreated}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: DISCOVERY DATA (SIMULATED FIELD VS REAL HISTORICAL DATA) */}
          {activeTab === 'discovery' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Column 1: Simulated Field Discovery Data */}
                <div className="bg-[#10141e]/90 p-4 rounded-lg border border-[#38bdf8]/40 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                      <Radio size={14} className="text-[#38bdf8]" />
                      SIMULATED FIELD EVA DATA (LIVE)
                    </span>
                    <span className="text-[10px] bg-[#38bdf8]/15 px-1.5 py-0.5 rounded text-[#38bdf8] font-bold">
                      ACTIVE RUNTIME
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Player Coordinates:</span>
                      <span className="text-white font-bold">{playerState.latStr}, {playerState.lonStr}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Artifact Range:</span>
                      <span className="text-[#38bdf8] font-bold">{playerState.activeArtifact.distance.toFixed(1)} M</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Scanner Confidence:</span>
                      <span className="text-[#f59e0b] font-bold">{playerState.scannerTelemetry.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Mission Elapsed Time:</span>
                      <span className="text-white font-bold">{playerState.missionSolStr}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Scanner Energy Consumed:</span>
                      <span className="text-white font-bold">{playerState.scannerEnergyConsumed.toFixed(1)} kJ</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#87929a]">Discovery State:</span>
                      <span className={`font-bold ${isDocumented ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                        {isDocumented ? '✓ DOCUMENTED' : 'PENDING DOCUMENTATION'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Authentic Real Historical NASA Mission Data */}
                <div className="bg-[#121622]/90 p-4 rounded-lg border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#f59e0b]" />
                      REAL HISTORICAL NASA MISSION DATA
                    </span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">
                      NASA / JPL ARCHIVE
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">{planetaryCoordinatesLabel}:</span>
                      <span className="text-[#38bdf8] font-bold">{missionData.realCoordinates}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Real Landing Site:</span>
                      <span className="text-white font-bold">{missionData.landingSite}</span>
                    </div>
                    {missionData.distanceTraveled && (
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#87929a]">Total Distance Traveled:</span>
                        <span className="text-white font-bold">{missionData.distanceTraveled}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Historical Operational Sols:</span>
                      <span className="text-white font-bold">{missionData.actualDuration}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">Last Transmission Date:</span>
                      <span className="text-[#f59e0b] font-bold">{missionData.lastCommunication}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#87929a]">NASA Status:</span>
                      <span className="text-[#f59e0b] font-bold uppercase">{missionData.operationalStatus}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#87929a]">Formal Mission Conclusion:</span>
                      <span className="text-white font-bold">{missionData.missionConcluded}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explicit Distinguishing Clarification Box */}
              <div className="bg-[#10141e]/90 p-4 rounded-lg border-l-2 border-[#38bdf8] text-xs text-[#87929a] leading-relaxed">
                <strong className="text-white block mb-0.5">Scientific Grounding Note:</strong>
                Field Discovery Data is generated dynamically from your active EVA exploration simulation in this Martian sandbox. The historical NASA mission coordinates ({missionData.realCoordinates} at {missionData.landingSite}) represent authentic scientific archives compiled by NASA and the Jet Propulsion Laboratory.
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. MODAL FOOTER                                               */}
        {/* ============================================================== */}
        <footer className="px-5 py-3.5 border-t border-white/10 bg-[#090c12]/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {!isDocumented ? (
              <span className="text-[#f59e0b] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
                <span>DISCOVERY PENDING DOCUMENTATION</span>
                <span className="text-white/30">•</span>
                <span className="text-[#38bdf8] flex items-center gap-1">
                  <Zap size={12} className="fill-current" />
                  REWARD: +1 CHARGE
                </span>
              </span>
            ) : !isTransmitted ? (
              <span className="text-[#38bdf8] font-bold flex items-center gap-1.5">
                <CheckCircle size={15} className="text-[#38bdf8]" />
                <span>DOCUMENTED</span>
                <span className="text-white/30">•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Zap size={12} className="fill-current" />
                  ENERGY REWARD PROCESSED
                </span>
                <span className="text-white/30">•</span>
                <span>READY FOR TRANSMISSION</span>
              </span>
            ) : isArchived ? (
              <span className="text-[#10b981] font-bold flex items-center gap-1.5">
                <CheckCircle size={15} className="text-[#10b981]" />
                TRANSMITTED &amp; ARCHIVED IN NASA PDS
              </span>
            ) : (
              <span className="text-[#f59e0b] font-bold flex items-center gap-1.5">
                <Send size={14} className="text-[#f59e0b]" />
                DATA TRANSMITTED • PENDING ARCHIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Action 1: Document Discovery */}
            {!isDocumented && (
              <button
                onClick={() => {
                  marsAudio.playDiscoveryChime();
                  onDocumentDiscovery(artifact.id);
                }}
                className="px-5 py-2 bg-[#f59e0b] hover:bg-[#fbbf24] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#f59e0b]/20 flex items-center gap-2 cursor-pointer active:scale-95"
                title="Document scientific findings to receive +1 energy charge"
              >
                <Award size={15} />
                <span>
                  DOCUMENT DISCOVERY{' '}
                  {playerState.energyCharges >= 6 ? '(STORAGE FULL)' : '(+1 CHARGE)'}
                </span>
              </button>
            )}

            {/* Action 2: Transmit to Earth */}
            {isDocumented && !isTransmitted && (
              <button
                onClick={() => {
                  marsAudio.playTransmissionStart();
                  onOpenTransmission(artifact.id);
                }}
                className="px-5 py-2 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#38bdf8]/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Send size={15} />
                <span>TRANSMIT TO EARTH</span>
              </button>
            )}

            {/* Action 3: View Mission Archive */}
            {(isTransmitted || isArchived) && (
              <button
                onClick={() => {
                  marsAudio.playComponentSelect();
                  onOpenArchive();
                }}
                className="px-4 py-2 bg-[#182338] hover:bg-[#25324d] text-[#38bdf8] font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-[#38bdf8]/40 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Database size={15} />
                <span>VIEW MISSION ARCHIVE</span>
              </button>
            )}

            {/* Action 4: Close / Return */}
            <button
              onClick={() => {
                marsAudio.playTargetLock();
                onClose();
              }}
              className="px-4 py-2 bg-[#181d28] hover:bg-[#252c3d] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-white/10 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>RETURN TO EXPLORATION [ESC]</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Full Image / NASA Metadata Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] bg-[#0c1018] border border-[#38bdf8]/50 rounded-xl overflow-hidden flex flex-col shadow-2xl text-white font-mono-tech"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#080c14]">
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-[#38bdf8]" />
                <span className="text-xs font-bold text-[#38bdf8] font-mono-tech">
                  {selectedImage.nasaId} // {selectedImage.catalogSource}
                </span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded bg-white/5 hover:bg-white/15 text-[#87929a] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex flex-col gap-4">
              <div className="w-full max-h-[50vh] bg-black rounded-lg overflow-hidden flex items-center justify-center border border-white/10 p-2">
                {failedImageUrls.has(selectedImage.imageUrl) ? (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-2">
                    <AlertTriangle size={32} className="text-[#f59e0b]" />
                    <span className="text-sm text-white font-bold">{selectedImage.title}</span>
                    <span className="text-xs text-[#87929a] max-w-md">
                      Image file could not be loaded from local path. Procedural 3D model remains functional in simulation.
                    </span>
                    <span className="text-[10px] text-[#38bdf8] font-mono-tech">{selectedImage.nasaId} // {selectedImage.credit}</span>
                  </div>
                ) : (
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    onError={() => {
                      setFailedImageUrls((prev) => new Set(prev).add(selectedImage.imageUrl));
                    }}
                    className="max-h-[50vh] w-auto object-contain"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <h3 className="text-base font-bold text-white font-display">
                  {selectedImage.title}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#121622] p-2.5 rounded border border-white/5">
                  <div>
                    <span className="text-[#87929a] block">Date Created:</span>
                    <strong className="text-white">{selectedImage.dateCreated}</strong>
                  </div>
                  <div>
                    <span className="text-[#87929a] block">NASA Center:</span>
                    <strong className="text-white">{selectedImage.center}</strong>
                  </div>
                  <div>
                    <span className="text-[#87929a] block">Attribution / Credit:</span>
                    <strong className="text-[#38bdf8]">{selectedImage.credit}</strong>
                  </div>
                  <div>
                    <span className="text-[#87929a] block">Offline Storage:</span>
                    <strong className={selectedImage.isLocal ? "text-[#10b981]" : "text-[#f59e0b]"}>
                      {selectedImage.isLocal ? "✓ Bundled Local" : "Live Stream"}
                    </strong>
                  </div>
                </div>

                <div className="bg-[#0e121a] p-3 rounded border border-white/5 text-[#d1d5db] leading-relaxed text-xs">
                  <span className="text-[10px] text-[#87929a] uppercase font-bold block mb-1">Official NASA Description:</span>
                  {selectedImage.description}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2 text-xs">
                <span className="text-[11px] text-[#87929a]">
                  Interactive 3D simulation model remains active in exploration background.
                </span>
                <a
                  href={selectedImage.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#07090e] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>View on NASA Image Library</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
