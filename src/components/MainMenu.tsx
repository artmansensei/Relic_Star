import React, { useState, useEffect } from 'react';
import {
  Compass,
  Play,
  RotateCcw,
  Sliders,
  Radio,
  Globe,
  Database,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  AlertTriangle,
  Info,
  X,
  Award,
  Users,
} from 'lucide-react';
import { CelestialScene } from './CelestialScene';
import { marsAudio } from '../mars/audio';
import { ARTIFACT_LIST } from '../data/artifacts';
import { LUNAR_ARTIFACT_LIST } from '../data/lunarArtifacts';

interface MainMenuProps {
  onNewGame: () => void;
  onResume: () => void;
  onOptions: () => void;
  hasSavedGame: boolean;
  resumePlanet?: 'mars' | 'moon' | null;
  savedGameSummary?: {
    discovered: number;
    archived: number;
    total: number;
    lastActiveDate?: string;
  };
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onNewGame,
  onResume,
  onOptions,
  hasSavedGame,
  resumePlanet,
  savedGameSummary,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(hasSavedGame ? 1 : 0);
  const [noSaveMessage, setNoSaveMessage] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleResumeAction = () => {
    if (hasSavedGame) {
      marsAudio.playMenuClick();
      onResume();
    } else {
      marsAudio.playMenuHover();
      setNoSaveMessage(true);
      setTimeout(() => setNoSaveMessage(false), 4500);
    }
  };

  // Keyboard navigation support: Up / Down arrow keys and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAboutOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          marsAudio.playMenuClick();
          setIsAboutOpen(false);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        marsAudio.playMenuHover();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 3));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        marsAudio.playMenuHover();
        setFocusedIndex((prev) => (prev < 3 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex === 0) {
          marsAudio.playMenuClick();
          onNewGame();
        } else if (focusedIndex === 1) {
          handleResumeAction();
        } else if (focusedIndex === 2) {
          marsAudio.playMenuClick();
          onOptions();
        } else if (focusedIndex === 3) {
          marsAudio.playMenuClick();
          setIsAboutOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, hasSavedGame, onNewGame, onResume, onOptions, isAboutOpen]);

  return (
    <div className="relative w-full h-full min-h-screen overflow-y-auto overflow-x-hidden bg-[#04060a] text-[#e2e2ea] select-none font-mono-tech flex flex-col justify-between p-4 sm:p-8 lg:p-12 animate-in fade-in duration-300">
      {/* High-Performance Canvas Celestial Background (fixed position) */}
      <CelestialScene className="fixed inset-0 pointer-events-none" focusTarget="system" />

      {/* Subtle Scanline & Radial Vignette Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(7, 10, 18, 0.45) 0%, rgba(3, 4, 8, 0.82) 80%, rgba(2, 2, 4, 0.96) 100%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />



      {/* ============================================================== */}
      {/* CENTERED HERO & PRIMARY NAVIGATION MENU                       */}
      {/* ============================================================== */}
      <main className="relative z-20 w-full max-w-7xl mx-auto my-auto flex flex-col justify-center items-center">
        <div className="w-full max-w-xl flex flex-col items-center text-center">
          {/* Tactical Sub-Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[10px] sm:text-xs font-bold text-[#38bdf8] uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
            <span>DEEP SPACE RECONNAISSANCE INITIATIVE</span>
          </div>

          {/* Official Game Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-widest text-white uppercase drop-shadow-[0_4px_16px_rgba(56,189,248,0.25)] leading-none">
            RELIC STAR
          </h1>

          {/* Subtitle */}
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#94a3b8] font-medium tracking-wide italic max-w-md mx-auto leading-relaxed">
            Explore the forgotten frontiers of our Solar System.
          </p>

          <p className="mt-2 text-xs text-[#64748b] leading-relaxed max-w-md mx-auto">
            Survey dormant human spacecraft, recover historic scientific packages, and document humanity's earliest interplanetary relics across realistic extraterrestrial terrain.
          </p>

          {/* Primary Action Buttons (NEW GAME, RESUME, OPTIONS) */}
          <div className="mt-8 sm:mt-10 flex flex-col gap-3.5 w-full max-w-sm mx-auto">
            {/* 1. NEW GAME BUTTON */}
            <button
              onClick={() => {
                marsAudio.playMenuClick();
                onNewGame();
              }}
              onMouseEnter={() => {
                marsAudio.playMenuHover();
                setFocusedIndex(0);
              }}
              className={`group relative w-full py-4 px-5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between shadow-xl ${
                focusedIndex === 0
                  ? 'bg-[#38bdf8] text-[#07090e] border-[#38bdf8] shadow-[#38bdf8]/20 translate-x-1.5'
                  : 'bg-[#0d121c]/80 hover:bg-[#131b2b] text-white border-white/10 hover:border-[#38bdf8]/50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    focusedIndex === 0
                      ? 'bg-[#07090e] text-[#38bdf8]'
                      : 'bg-white/5 text-[#38bdf8] group-hover:bg-[#38bdf8]/20'
                  }`}
                >
                  <Play size={18} className="fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold tracking-wider uppercase font-display">
                    NEW GAME
                  </span>
                  <span
                    className={`text-[10px] ${
                      focusedIndex === 0 ? 'text-[#07090e]/80 font-medium' : 'text-[#87929a]'
                    }`}
                  >
                    Select destination (Mars / Moon)
                  </span>
                </div>
              </div>

              <ArrowRight
                size={18}
                className={`transition-transform duration-200 ${
                  focusedIndex === 0 ? 'translate-x-1' : 'text-[#87929a] group-hover:translate-x-1'
                }`}
              />
            </button>

            {/* 2. RESUME GAME BUTTON */}
            <button
              type="button"
              onClick={handleResumeAction}
              onMouseEnter={() => {
                marsAudio.playMenuHover();
                setFocusedIndex(1);
              }}
              className={`group relative w-full py-4 px-5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between shadow-lg ${
                focusedIndex === 1
                  ? hasSavedGame
                    ? 'bg-[#10b981] text-[#07090e] border-[#10b981] shadow-[#10b981]/20 translate-x-1.5'
                    : 'bg-white/10 text-white border-white/30 translate-x-1.5'
                  : hasSavedGame
                  ? 'bg-[#0d121c]/80 hover:bg-[#131b2b] text-white border-white/10 hover:border-[#10b981]/50'
                  : 'bg-[#0a0d14]/70 hover:bg-[#131b2b] text-[#94a3b8] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    focusedIndex === 1
                      ? hasSavedGame
                        ? 'bg-[#07090e] text-[#10b981]'
                        : 'bg-white/10 text-[#cbd5e1]'
                      : hasSavedGame
                      ? 'bg-white/5 text-[#10b981] group-hover:bg-[#10b981]/20'
                      : 'bg-white/5 text-[#64748b] group-hover:text-white'
                  }`}
                >
                  <RotateCcw size={18} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold tracking-wider uppercase font-display">
                      RESUME
                    </span>
                    {hasSavedGame ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          focusedIndex === 1
                            ? 'bg-[#07090e] text-[#10b981]'
                            : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                        }`}
                      >
                        {resumePlanet === 'moon' ? 'MOON ACTIVE' : 'MARS ACTIVE'}
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-white/5 text-[#64748b] border border-white/10">
                        NO SAVE
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] ${
                      hasSavedGame
                        ? focusedIndex === 1
                          ? 'text-[#07090e]/80 font-medium'
                          : 'text-[#87929a]'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {hasSavedGame
                      ? resumePlanet === 'moon'
                        ? 'Continue your Moon Exploration mission.'
                        : 'Continue your Mars Exploration mission.'
                      : 'NO SAVED EXPEDITION'}
                  </span>
                  {hasSavedGame && savedGameSummary && (
                    <span
                      className={`text-[9px] mt-0.5 ${
                        focusedIndex === 1 ? 'text-[#07090e]/70' : 'text-[#64748b]'
                      }`}
                    >
                      {resumePlanet === 'moon'
                        ? `Mare Tranquillitatis Sector • ${savedGameSummary.discovered}/${savedGameSummary.total} Relics Localized`
                        : `Jezero Crater Sector • ${savedGameSummary.discovered}/${savedGameSummary.total} Relics Localized`}
                    </span>
                  )}
                </div>
              </div>

              {hasSavedGame && (
                <ArrowRight
                  size={18}
                  className={`transition-transform duration-200 ${
                    focusedIndex === 1
                      ? 'translate-x-1 text-current'
                      : 'text-[#87929a] group-hover:translate-x-1'
                  }`}
                />
              )}
            </button>

            {/* 3. OPTIONS BUTTON */}
            <button
              onClick={() => {
                marsAudio.playMenuClick();
                onOptions();
              }}
              onMouseEnter={() => {
                marsAudio.playMenuHover();
                setFocusedIndex(2);
              }}
              className={`group relative w-full py-3.5 px-5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between shadow-md ${
                focusedIndex === 2
                  ? 'bg-white/15 text-white border-[#38bdf8] translate-x-1.5'
                  : 'bg-[#0d121c]/70 hover:bg-[#131b2b] text-[#bdc8d1] hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-lg bg-white/5 text-[#cbd5e1] group-hover:text-white transition-colors">
                  <Sliders size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider uppercase font-display">
                    OPTIONS
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    Audio, Sensitivity &amp; Graphics
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-[#64748b] font-mono">[ESC / TAB]</span>
            </button>

            {/* 4. ABOUT BUTTON */}
            <button
              onClick={() => {
                marsAudio.playMenuClick();
                setIsAboutOpen(true);
              }}
              onMouseEnter={() => {
                marsAudio.playMenuHover();
                setFocusedIndex(3);
              }}
              className={`group relative w-full py-3.5 px-5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between shadow-md ${
                focusedIndex === 3
                  ? 'bg-white/15 text-white border-[#38bdf8] translate-x-1.5'
                  : 'bg-[#0d121c]/70 hover:bg-[#131b2b] text-[#bdc8d1] hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-lg bg-white/5 text-[#cbd5e1] group-hover:text-white transition-colors">
                  <Info size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider uppercase font-display">
                    ABOUT
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    Team VU_Nova &amp; Mission Story
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-[#64748b] font-mono">[INFO]</span>
            </button>

            {/* No Saved Game Clear Feedback Notice */}
            {noSaveMessage && (
              <div className="bg-amber-950/70 border border-amber-500/50 text-amber-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xl">
                <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                <span className="font-sans leading-tight">
                  <strong className="text-amber-300">NO SAVED EXPEDITION FOUND.</strong> Select <strong>NEW GAME</strong> to initialize a fresh mission.
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* BOTTOM FOOTER: SCIENTIFIC TELEMETRY & SYSTEM DETAILS           */}
      {/* ============================================================== */}
      <footer className="relative z-20 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#64748b] w-full max-w-7xl mx-auto pt-4 border-t border-white/5 text-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <span>TARGET DESTINATIONS: MARS (JEZERO) • MOON (TRANQUILLITATIS)</span>
          <span className="text-white/15">•</span>
          <span>NASA JPL PDS CARTOGRAPHY</span>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* ABOUT MODAL (TEAM VU_NOVA & PROJECT STORY)                     */}
      {/* ============================================================== */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0e17] border border-[#38bdf8]/30 rounded-2xl p-6 sm:p-8 text-left shadow-[0_0_50px_rgba(56,189,248,0.15)] flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider mb-2">
                  <Award size={12} />
                  <span>NASA SPACE APPS CHALLENGE 2026</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase font-display tracking-wide">
                  ABOUT RELIC STAR
                </h2>
                <p className="text-xs text-[#87929a] mt-1">
                  Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars
                </p>
              </div>

              <button
                onClick={() => {
                  marsAudio.playMenuClick();
                  setIsAboutOpen(false);
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors cursor-pointer border border-white/10"
                title="Close (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Section 1: The Game */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#38bdf8] tracking-wider">
                <Globe size={14} />
                <span>The Game &amp; Scientific Vision</span>
              </div>
              <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                <strong className="text-white">Relic Star</strong> is an interactive 3D planetary exploration experience developed for the NASA Space Apps Challenge 2026. Across both Mars and the Moon, players conduct realistic extravehicular activity (EVA) to locate, inspect, and preserve the legacy of humanity’s historic explorer machines.
              </p>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Featuring {ARTIFACT_LIST.length + LUNAR_ARTIFACT_LIST.length} scientifically verified NASA relics—including Spirit, Opportunity, Viking 1 &amp; 2, Phoenix, InSight, Curiosity, Sojourner, Ingenuity, Apollo 11 Eagle, Apollo 12 Intrepid &amp; ALSEP, Apollo 14 MET, Apollo 15 &amp; 16 LRVs, Apollo 17 Challenger, Surveyor 1, 3 &amp; 7, and the Lunar Laser Ranging Retroreflector—the game turns inactive hardware into interactive educational monuments using authentic NASA Planetary Data System (PDS) coordinates, historical telemetry, and real offline NASA photography.
              </p>
            </div>

            {/* Section 2: Team VU_Nova */}
            <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#10b981] tracking-wider">
                <Users size={14} />
                <span>About Team VU_Nova</span>
              </div>
              <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                We are <strong className="text-white">Team VU_Nova</strong> from <strong className="text-white">Varendra University, Bangladesh</strong>. Driven by a passion for space exploration, planetary science, and software craftsmanship, our team created Relic Star to honor the courage of engineers and the enduring legacy of every spacecraft that helped humanity reach beyond Earth.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 text-[11px] text-[#94a3b8]">
                <div className="flex items-center gap-2">
                  <span className="text-[#38bdf8] font-bold">Team:</span>
                  <span>VU_Nova</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#38bdf8] font-bold">Institution:</span>
                  <span>Varendra University, Bangladesh</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#38bdf8] font-bold">Event:</span>
                  <span>NASA Space Apps Challenge 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#38bdf8] font-bold">Category:</span>
                  <span>Interactive Educational Space Simulation</span>
                </div>
              </div>
            </div>

            {/* Section 3: Vision Quote */}
            <div className="text-[11px] text-[#64748b] leading-relaxed border-t border-white/5 pt-2">
              <em>"Their primary missions have concluded, their batteries may be cold, but their science lives on. Abandoned, but never forgotten."</em>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  marsAudio.playMenuClick();
                  setIsAboutOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-[#07090e] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#38bdf8]/20"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
