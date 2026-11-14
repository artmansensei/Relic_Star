import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Radio,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  Shield,
  Layers,
  Thermometer,
  Wind,
  Orbit,
} from 'lucide-react';
import { CelestialScene } from './CelestialScene';
import { marsAudio } from '../mars/audio';
import { ARTIFACT_LIST } from '../data/artifacts';
import { LUNAR_ARTIFACT_LIST } from '../data/lunarArtifacts';

interface DestinationSelectProps {
  onSelectMars: () => void;
  onSelectMoon: () => void;
  onBack: () => void;
}

export const DestinationSelect: React.FC<DestinationSelectProps> = ({
  onSelectMars,
  onSelectMoon,
  onBack,
}) => {
  const [hoveredDestination, setHoveredDestination] = useState<'mars' | 'moon' | null>('mars');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        marsAudio.playMenuClick();
        onBack();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        marsAudio.playMenuHover();
        setHoveredDestination('mars');
        document.getElementById('card-mars')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();
        marsAudio.playMenuHover();
        setHoveredDestination((prev) => (prev === 'mars' ? 'moon' : 'mars'));
        const nextId = hoveredDestination === 'mars' ? 'card-moon' : 'card-mars';
        document.getElementById(nextId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        marsAudio.playMenuClick();
        if (hoveredDestination === 'moon') {
          onSelectMoon();
        } else {
          onSelectMars();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hoveredDestination, onBack, onSelectMars, onSelectMoon]);

  return (
    <div className="relative w-full h-full min-h-screen overflow-y-auto overflow-x-hidden bg-[#04060a] text-[#e2e2ea] select-none font-mono-tech flex flex-col justify-between p-4 sm:p-8 lg:p-12 animate-in fade-in duration-300">
      {/* Background space canvas (fixed position so it remains locked while content scrolls) */}
      <CelestialScene className="fixed inset-0 pointer-events-none" focusTarget={hoveredDestination || 'system'} />

      {/* Subtle Scanline & Radial Vignette Overlay (fixed position) */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(7, 10, 18, 0.4) 0%, rgba(3, 4, 8, 0.82) 80%, rgba(2, 2, 4, 0.96) 100%)',
        }}
      />

      {/* ============================================================== */}
      {/* HEADER: TITLE & BACK BUTTON                                    */}
      {/* ============================================================== */}
      <header className="relative z-20 flex items-center justify-between text-xs w-full max-w-7xl mx-auto">
        <button
          onClick={() => {
            marsAudio.playMenuClick();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0d121c]/80 hover:bg-[#182338] text-[#87929a] hover:text-white border border-white/10 hover:border-[#38bdf8]/40 transition-all cursor-pointer group active:scale-95"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold tracking-wider uppercase text-[11px]">BACK TO MAIN MENU</span>
          <kbd className="px-1 py-0.2 bg-white/5 rounded text-[9px] text-[#64748b] border border-white/10 font-mono">
            ESC
          </kbd>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-bold text-[#38bdf8] uppercase tracking-widest">
          <Orbit size={14} />
          <span>RELIC STAR // EXPEDITION DESTINATION SELECTION</span>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN BODY: TWO LARGE EQUAL DESTINATION CARDS                   */}
      {/* ============================================================== */}
      <main className="relative z-20 w-full max-w-7xl mx-auto my-auto flex flex-col items-center">
        <div className="text-center mb-6 sm:mb-8 max-w-xl">
          <span className="text-[10px] sm:text-xs font-bold text-[#38bdf8] tracking-widest uppercase">
            SOLAR SYSTEM SURVEY PROTOCOL
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display uppercase tracking-widest text-white mt-1">
            CHOOSE EXPEDITION TARGET
          </h2>
          <p className="text-xs sm:text-sm text-[#87929a] mt-1.5">
            Select a celestial destination to investigate humanity's dormant planetary hardware.
          </p>
        </div>

        {/* The Two Primary Planet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-5xl">
          {/* ============================================================ */}
          {/* CARD 1: MARS EXPEDITION                                      */}
          {/* ============================================================ */}
          <div
            id="card-mars"
            onClick={() => {
              marsAudio.playMenuClick();
              onSelectMars();
            }}
            onMouseEnter={() => {
              marsAudio.playMenuHover();
              setHoveredDestination('mars');
            }}
            className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer ${
              hoveredDestination === 'mars'
                ? 'bg-[#0f1422]/90 border-[#f97316] shadow-2xl shadow-[#f97316]/20 scale-[1.015]'
                : 'bg-[#0a0d15]/80 border-white/10 hover:border-[#f97316]/50'
            }`}
          >
            {/* Top Atmospheric Ambient Glow Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#f97316] via-[#ea580c] to-[#c2410c]" />

            {/* Planet Visual Surface Preview Header */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[#180a06] flex items-center justify-center">
              {/* Procedural Mars Surface Horizon */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 120%, #c2410c 0%, #7c2d12 40%, #2e0d06 75%, #0d0604 100%)',
                }}
              />

              {/* Distant Dunes & Crater Ridge Silhouettes */}
              <svg
                className="absolute inset-0 w-full h-full text-[#ea580c] opacity-40 pointer-events-none"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                {/* Back ridges */}
                <path
                  d="M 0 140 Q 60 110 130 135 T 260 120 T 400 130 L 400 200 L 0 200 Z"
                  fill="#7c2d12"
                  opacity="0.8"
                />
                {/* Foreground rolling red dunes */}
                <path
                  d="M 0 160 Q 90 135 180 155 T 320 145 T 400 155 L 400 200 L 0 200 Z"
                  fill="#431407"
                />
                {/* Crater bowl depression */}
                <ellipse cx="270" cy="170" rx="60" ry="14" fill="#260b04" stroke="#c2410c" strokeWidth="0.8" opacity="0.6" />
              </svg>

              {/* Atmospheric Limb & Sun Glow */}
              <div
                className="absolute top-0 inset-x-0 h-16 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(249, 115, 22, 0.25), transparent)',
                }}
              />

              {/* Rover Wireframe Silhouette */}
              <div className="relative z-10 flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-[#f97316]/20 border border-[#f97316]/60 flex items-center justify-center text-[#f97316] mb-2 shadow-lg shadow-[#f97316]/30">
                  <Compass size={28} />
                </div>
                <div className="text-[10px] font-bold text-[#f97316] tracking-widest uppercase">
                  ACTIVE EXPEDITION PROTOCOL
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 left-3 bg-[#07090e]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#f97316]/40 text-[9px] font-bold text-[#f97316] flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-ping" />
                <span>EXPEDITION READY // REAL-TIME 3D</span>
              </div>
            </div>

            {/* Card Content Area */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-[10px] text-[#87929a] font-bold uppercase tracking-wider mb-1">
                  <span>TARGET // MARS IV</span>
                  <span className="text-[#f97316]">SURFACE OPS</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold font-display tracking-wide uppercase text-white">
                  MARS EXPEDITION
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Explore ancient terrain and investigate abandoned human missions.
                </p>

                <p className="mt-1 text-xs text-[#87929a] leading-relaxed">
                  Traverse the 1100m Jezero crater basin, track anomalous radio beacons with your LIDAR scanner, and survey {ARTIFACT_LIST.length} historical NASA spacecraft.
                </p>

                {/* Technical Metric Pills */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono-tech">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                    <span className="text-[#87929a]">GRAVITY:</span>
                    <span className="font-bold text-white">0.38g (Martian)</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                    <span className="text-[#87929a]">PRESSURE:</span>
                    <span className="font-bold text-white">610 Pa (CO₂)</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                    <span className="text-[#87929a]">QUADRANT:</span>
                    <span className="font-bold text-white">Jezero 1100m²</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                    <span className="text-[#87929a]">HARDWARE:</span>
                    <span className="font-bold text-[#f97316]">{ARTIFACT_LIST.length} NASA Relics</span>
                  </div>
                </div>
              </div>

              {/* EXPLORE MARS CTA Button */}
              <button
                onClick={() => {
                  marsAudio.playMenuClick();
                  onSelectMars();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#f97316] hover:bg-[#fb923c] text-[#07090e] font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#f97316]/20 active:scale-98 font-display"
              >
                <span>EXPLORE MARS</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CARD 2: LUNAR EXPEDITION                                     */}
          {/* ============================================================ */}
          <div
            id="card-moon"
            onClick={() => {
              marsAudio.playMenuClick();
              onSelectMoon();
            }}
            onMouseEnter={() => {
              marsAudio.playMenuHover();
              setHoveredDestination('moon');
            }}
            className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer ${
              hoveredDestination === 'moon'
                ? 'bg-[#0f1422]/90 border-[#38bdf8] shadow-2xl shadow-[#38bdf8]/20 scale-[1.015]'
                : 'bg-[#0a0d15]/80 border-white/10 hover:border-[#38bdf8]/50'
            }`}
          >
            {/* Top Atmospheric Ambient Glow Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#94a3b8] via-[#e2e8f0] to-[#38bdf8]" />

            {/* Planet Visual Surface Preview Header */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[#06080e] flex items-center justify-center">
              {/* Procedural Moon Surface Horizon */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 120%, #475569 0%, #1e293b 40%, #0f172a 75%, #030712 100%)',
                }}
              />

              {/* Lunar Cratered Landscape Silhouettes */}
              <svg
                className="absolute inset-0 w-full h-full text-[#94a3b8] opacity-35 pointer-events-none"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                {/* Harsh crater rim with deep shadows */}
                <path
                  d="M 0 145 Q 80 125 150 140 T 280 120 T 400 135 L 400 200 L 0 200 Z"
                  fill="#1e293b"
                />
                <path
                  d="M 0 165 Q 110 140 200 160 T 340 150 T 400 160 L 400 200 L 0 200 Z"
                  fill="#0f172a"
                />
                <ellipse cx="120" cy="175" rx="45" ry="10" fill="#020617" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
              </svg>

              {/* Earthrise on Lunar Horizon */}
              <div className="absolute top-4 right-8 w-12 h-12 rounded-full bg-gradient-to-tr from-[#0284c7] via-[#38bdf8] to-[#ffffff] shadow-[0_0_18px_rgba(56,189,248,0.5)] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/40 -translate-x-2 -translate-y-1" />
              </div>

              {/* Moon Wireframe Icon */}
              <div className="relative z-10 flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white mb-2 shadow-lg shadow-white/10">
                  <Orbit size={28} />
                </div>
                <div className="text-[10px] font-bold text-[#e2e8f0] tracking-widest uppercase">
                  TRANQUILLITY SECTOR
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 left-3 bg-[#07090e]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[9px] font-bold text-[#cbd5e1] flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                <span>ORBITAL RECON // EXPEDITION BRIEFING</span>
              </div>
            </div>

            {/* Card Content Area */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-[10px] text-[#87929a] font-bold uppercase tracking-wider mb-1">
                  <span>TARGET // EARTH'S MOON</span>
                  <span className="text-[#38bdf8]">LUNAR SURFACE</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold font-display tracking-wide uppercase text-white">
                  LUNAR EXPEDITION
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Step onto the Moon as an astronaut! Explore the dusty ground, hop in low gravity, and find real Apollo landers and rovers left behind in space.
                </p>

                <p className="mt-1 text-xs text-[#87929a] leading-relaxed">
                  Look up at planet Earth in the black starry sky, track down famous moon buggies and robot pioneers, and learn why their missions changed human history.
                </p>

                {/* Technical Metric Pills */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono-tech">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                    <span className="text-[#87929a]">GRAVITY:</span>
                    <span className="font-bold text-white">0.166g (1/6th G)</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                    <span className="text-[#87929a]">PRESSURE:</span>
                    <span className="font-bold text-white">0.00 Pa (Vacuum)</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                    <span className="text-[#87929a]">SITE:</span>
                    <span className="font-bold text-white">Mare Tranquillitatis</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                    <span className="text-[#87929a]">STATUS:</span>
                    <span className="font-bold text-[#38bdf8]">Mission Operational ({LUNAR_ARTIFACT_LIST.length} Relics)</span>
                  </div>
                </div>
              </div>

              {/* EXPLORE THE MOON CTA Button */}
              <button
                onClick={() => {
                  marsAudio.playMenuClick();
                  onSelectMoon();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#0284c7]/20 active:scale-98 font-display border border-[#38bdf8]/50"
              >
                <span>EXPLORE THE MOON</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 flex items-center justify-between text-[11px] text-[#64748b] w-full max-w-7xl mx-auto pt-4 border-t border-white/5">
        <span>PRESS ENTER TO CONFIRM • USE ARROW KEYS TO SWITCH DESTINATIONS</span>
        <span>RELIC STAR EXPEDITION DIRECTIVE</span>
      </footer>
    </div>
  );
};
