import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle,
  Radio,
  Send,
  ExternalLink,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  Lock,
  Eye,
} from 'lucide-react';
import { CATALOGED_MARS_ARTIFACTS, ArtifactProgress, MissionState, PersistentMissionData } from '../data/mission';
import { ALL_ARTIFACTS } from '../data/artifacts';
import { marsAudio } from '../mars/audio';

interface MissionArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionState: MissionState;
  missionProgress: PersistentMissionData;
  onOpenArtifactReport: (artifactId: string) => void;
  onOpenTransmission: (artifactId: string) => void;
}

export const MissionArchiveModal: React.FC<MissionArchiveModalProps> = ({
  isOpen,
  onClose,
  missionState,
  missionProgress,
  onOpenArtifactReport,
  onOpenTransmission,
}) => {
  const [filter, setFilter] = useState<'all' | 'archived' | 'pending' | 'locked'>('all');

  if (!isOpen) return null;

  // Merge runtime persistent state for all 5 artifacts
  const artifacts: ArtifactProgress[] = CATALOGED_MARS_ARTIFACTS.map((item) => {
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

  const filteredArtifacts = artifacts.filter((a) => {
    if (filter === 'archived') return a.isArchived;
    if (filter === 'pending') return a.isDiscovered && !a.isArchived;
    if (filter === 'locked') return !a.isDiscovered;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          marsAudio.playTargetLock();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#070a0f]/95 border border-[#38bdf8]/50 rounded-xl shadow-2xl flex flex-col text-[#e2e2ea] font-mono-tech overflow-hidden">
        {/* Tactical Corner Reticle Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8] pointer-events-none" />

        {/* ============================================================== */}
        {/* 1. HEADER                                                      */}
        {/* ============================================================== */}
        <header className="px-5 py-4 border-b border-[#38bdf8]/30 bg-[#0c1018]/95 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#38bdf8] uppercase tracking-widest">
              <Database size={13} className="text-[#38bdf8]" />
              <span>NASA PLANETARY DATA SYSTEM // MARS MISSION ARCHIVE</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold font-display text-white tracking-wide mt-0.5">
              EXPLORATION MISSION ARCHIVE
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-[#87929a] block">CAMPAIGN COMPLETION</span>
              <span className="text-xs font-bold text-[#10b981]">
                {missionState.artifactsArchived} / {missionState.totalArtifacts} ARCHIVED
              </span>
            </div>

            <button
              onClick={() => {
                marsAudio.playTargetLock();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#181d28] hover:bg-[#252c3d] text-[#87929a] hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Close Archive [ESC]"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 2. STATS BAR & FILTERS                                         */}
        {/* ============================================================== */}
        <div className="px-5 py-3 bg-[#0a0e16]/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Progress Counts */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[#87929a]">DISCOVERED:</span>
              <span className="text-[#38bdf8] font-bold">{missionState.artifactsDiscovered} / {missionState.totalArtifacts}</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#87929a]">DOCUMENTED:</span>
              <span className="text-[#f59e0b] font-bold">{missionState.artifactsDocumented} / {missionState.totalArtifacts}</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#87929a]">TRANSMITTED:</span>
              <span className="text-[#a855f7] font-bold">{missionState.artifactsTransmitted} / {missionState.totalArtifacts}</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#87929a]">ARCHIVED:</span>
              <span className="text-[#10b981] font-bold">{missionState.artifactsArchived} / {missionState.totalArtifacts}</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#121622] p-1 rounded-lg border border-white/5">
            {[
              { id: 'all', label: `ALL (${missionState.totalArtifacts})` },
              { id: 'archived', label: `ARCHIVED (${missionState.artifactsArchived})` },
              { id: 'pending', label: `IN PROGRESS (${missionState.artifactsDiscovered - missionState.artifactsArchived})` },
              { id: 'locked', label: `UNDISCOVERED (${missionState.totalArtifacts - missionState.artifactsDiscovered})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  marsAudio.playComponentSelect();
                  setFilter(f.id as any);
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  filter === f.id
                    ? 'bg-[#38bdf8] text-[#07090e]'
                    : 'text-[#87929a] hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. ARTIFACTS LIST                                             */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 text-xs">
          {filteredArtifacts.map((item) => {
            const rawArtifact = ALL_ARTIFACTS[item.id];
            const isHistorical = !!rawArtifact;
            const primaryImage = rawArtifact?.historical?.officialImages?.[0];

            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  item.isArchived
                    ? 'bg-[#0f1924]/90 border-[#10b981]/50 shadow-md shadow-[#10b981]/5'
                    : item.isDocumented
                    ? 'bg-[#151c28]/90 border-[#f59e0b]/50'
                    : item.isDiscovered
                    ? 'bg-[#121822]/80 border-[#38bdf8]/40'
                    : 'bg-[#0d1017]/60 border-white/5 opacity-75'
                }`}
              >
                {/* Official NASA Photo Thumbnail Preview */}
                <div className="relative w-16 h-14 sm:w-20 sm:h-16 rounded bg-black/80 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                  {item.isDiscovered && primaryImage ? (
                    <>
                      <img
                        src={primaryImage.thumbUrl || primaryImage.imageUrl}
                        alt={primaryImage.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 px-1 py-0.5 text-[8px] text-[#38bdf8] font-mono-tech truncate text-center">
                        {primaryImage.nasaId}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#555e6c]">
                      <Lock size={15} />
                      <span className="text-[7px] mt-0.5 uppercase tracking-wider font-bold">LOCKED</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-sm sm:text-base font-bold text-white tracking-wide">
                      {item.name.toUpperCase()}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f2430] border border-white/10 text-[#87929a]">
                      {item.designation}
                    </span>
                    <span className="text-[10px] text-[#87929a]">
                      {item.agency}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-[#bdc8d1] flex-wrap mt-0.5">
                    <div className="flex items-center gap-1">
                      <MapPin size={11} className="text-[#38bdf8]" />
                      <span>{item.site}</span>
                    </div>
                    <div className="text-[#87929a]">
                      COORDS: <strong className="text-white font-mono-tech">{item.planetaryCoords}</strong>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mt-1">
                    {item.isArchived ? (
                      <span className="px-2 py-0.5 rounded bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle size={11} />
                        ✓ ARCHIVED IN NASA PDS
                      </span>
                    ) : item.isTransmitted ? (
                      <span className="px-2 py-0.5 rounded bg-[#a855f7]/20 border border-[#a855f7]/50 text-[#a855f7] font-bold text-[10px] flex items-center gap-1">
                        <Send size={11} />
                        TRANSMITTED • AWAITING ARCHIVE
                      </span>
                    ) : item.isDocumented ? (
                      <span className="px-2 py-0.5 rounded bg-[#f59e0b]/20 border border-[#f59e0b]/50 text-[#f59e0b] font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle size={11} />
                        DOCUMENTED • READY FOR TRANSMISSION
                      </span>
                    ) : item.isDiscovered ? (
                      <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 border border-[#38bdf8]/50 text-[#38bdf8] font-bold text-[10px] flex items-center gap-1">
                        <Radio size={11} />
                        FIELD SIGHTING • APPROACH TO DOCUMENT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#87929a] text-[10px] flex items-center gap-1">
                        <Lock size={11} />
                        LOCKED / UNDISCOVERED IN WORLD
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* If documented and not transmitted: can transmit */}
                  {item.isDocumented && !item.isTransmitted && (
                    <button
                      onClick={() => {
                        marsAudio.playTransmissionStart();
                        onOpenTransmission(item.id);
                      }}
                      className="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#fbbf24] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#f59e0b]/20"
                    >
                      <Send size={13} />
                      <span>TRANSMIT [T]</span>
                    </button>
                  )}

                  {/* View Full Dossier */}
                  {item.isDiscovered && isHistorical && (
                    <button
                      onClick={() => {
                        marsAudio.playComponentSelect();
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

        {/* ============================================================== */}
        {/* 4. FOOTER                                                      */}
        {/* ============================================================== */}
        <footer className="px-5 py-3.5 border-t border-white/10 bg-[#090c12]/95 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-[#87929a]">
            Grounding Source: NASA Planetary Data System (PDS) / JPL Mars Exploration Program Archives.
          </div>

          <button
            onClick={() => {
              marsAudio.playTargetLock();
              onClose();
            }}
            className="px-4 py-2 bg-[#181d28] hover:bg-[#252c3d] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-white/10 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>RETURN TO EXPLORATION [ESC]</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
