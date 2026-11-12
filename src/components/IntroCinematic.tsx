import React, { useEffect, useState } from 'react';
import { Compass, Play, FastForward, Radio } from 'lucide-react';
import { marsAudio } from '../mars/audio';

export type IntroPhase = 'landing' | 'welcome' | 'game';

interface IntroCinematicProps {
  introPhase: IntroPhase;
  onSkipLanding: () => void;
  onBeginExpedition: () => void;
  planet?: 'mars' | 'moon';
}

export const IntroCinematic: React.FC<IntroCinematicProps> = ({
  introPhase,
  onSkipLanding,
  onBeginExpedition,
  planet = 'mars',
}) => {
  const [telemetryTime, setTelemetryTime] = useState(0);

  useEffect(() => {
    if (introPhase !== 'landing') return;
    const interval = setInterval(() => {
      setTelemetryTime((t) => t + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [introPhase]);

  if (introPhase === 'game') {
    return null;
  }

  // Simulated descent altitude calculation for authentic NASA HUD telemetry
  const simAltitude = Math.max(0, Math.round(36.0 - Math.pow(Math.min(1, telemetryTime / 6.6), 2.2) * 36.0));

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none font-mono-tech flex flex-col justify-between">
      {/* ============================================================== */}
      {/* 1. CINEMATIC LETTERBOX BARS & DESCENT TELEMETRY (LANDING PHASE)*/}
      {/* ============================================================== */}
      {introPhase === 'landing' && (
        <>
          {/* Top Cinematic Letterbox Bar */}
          <div className="w-full h-12 sm:h-16 bg-black/85 backdrop-blur-xs flex items-center justify-between px-4 sm:px-8 border-b border-white/10 pointer-events-auto">
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-[#38bdf8]">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping shrink-0" />
              <span className="font-bold tracking-widest uppercase">
                {planet === 'moon' ? 'ARTEMIS LUNAR LANDER // LUNAR SURFACE DESCENT' : 'ARES VII // MARS SURFACE DESCENT'}
              </span>
              <span className="text-white/30 hidden sm:inline">•</span>
              <span className="text-white/70 hidden sm:inline text-[10px]">
                {telemetryTime < 6.6
                  ? 'TERMINAL RETROPROPULSION ACTIVE'
                  : telemetryTime < 8.0
                  ? 'TOUCHDOWN CONFIRMED // SHUTDOWN'
                  : 'CREW EVA TRANSITION'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-white font-mono text-xs hidden md:inline">
                ALT: <strong className="text-[#38bdf8]">{simAltitude}M</strong>
              </span>

              {/* Skip Landing Button */}
              <button
                onClick={onSkipLanding}
                className="px-3 py-1 bg-[#182338]/85 hover:bg-[#25324d] text-[#38bdf8] hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider border border-[#38bdf8]/40 transition-all cursor-pointer flex items-center gap-1.5 shadow"
                title="Skip cinematic landing to expedition start"
              >
                <span>SKIP INTRO</span>
                <FastForward size={12} />
              </button>
            </div>
          </div>

          {/* Bottom Cinematic Letterbox Bar */}
          <div className="w-full h-12 sm:h-16 bg-black/85 backdrop-blur-xs flex items-center justify-between px-4 sm:px-8 border-t border-white/10 text-[10px] text-[#87929a]">
            <div className="flex items-center gap-2">
              <Compass size={13} className="text-[#38bdf8]" />
              <span>LANDING TARGET: {planet === 'moon' ? 'MARE TRANQUILLITATIS BASE (0, 0)' : 'JEZERO EXPEDITION CLEARING (0, 0)'}</span>
            </div>
            <div className="flex items-center gap-2 text-[#bdc8d1]">
              <span className="hidden sm:inline">ATMOSPHERE: {planet === 'moon' ? 'VACUUM (0.00 Pa)' : '95.3% CO₂'}</span>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span>SURFACE GRAVITY: {planet === 'moon' ? '0.166G' : '0.38G'}</span>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 2. WELCOME TO MARS SCREEN OVERLAY (WELCOME PHASE)              */}
      {/* ============================================================== */}
      {introPhase === 'welcome' && (
        <div className="absolute inset-0 pointer-events-auto flex items-center justify-center p-4 bg-gradient-to-t from-black/80 via-black/35 to-black/60 backdrop-blur-xs animate-in fade-in duration-500">
          <div className="relative w-full max-w-lg bg-[#070a0f]/90 border border-[#38bdf8]/40 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-5 text-center">
            {/* Tactical Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#38bdf8]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#38bdf8]" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8]" />

            {/* Mission Identifier Header */}
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#38bdf8] uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
              <span>{planet === 'moon' ? 'ARTEMIS EVA // LUNAR RECONNAISSANCE' : 'ARES EVA // MARS RECONNAISSANCE'}</span>
            </div>

            {/* Cinematic Main Titles */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-wider uppercase">
                {planet === 'moon' ? 'WELCOME TO THE MOON' : 'WELCOME TO MARS'}
              </h1>
              <h2 className="text-xs sm:text-sm font-semibold tracking-widest text-[#38bdf8] uppercase font-mono-tech">
                RELIC STAR // {planet === 'moon' ? 'LUNAR EXPEDITION' : 'MARS EXPEDITION'}
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] text-[#bdc8d1] leading-relaxed max-w-md italic">
              &ldquo;Survey the surface. Recover the stories of humanity&apos;s forgotten machines.&rdquo;
            </p>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                marsAudio.init();
                marsAudio.resume();
                marsAudio.playTargetLock();
                onBeginExpedition();
              }}
              className="w-full py-3.5 px-6 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#07090e] font-bold text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-[#38bdf8]/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 group"
            >
              <Play size={16} className="fill-[#07090e] group-hover:scale-110 transition-transform" />
              <span>BEGIN EXPEDITION</span>
            </button>

            {/* Quick Systems & Keybinds Footer */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-[#87929a] pt-3 border-t border-white/10 w-full">
              <span><strong className="text-white">WASD</strong> Move</span>
              <span>•</span>
              <span><strong className="text-white">Mouse</strong> Look</span>
              <span>•</span>
              <span><strong className="text-white">[F]</strong> Scanner</span>
              <span>•</span>
              <span><strong className="text-white">[I]</strong> Investigate</span>
              <span>•</span>
              <span><strong className="text-white">[M]</strong> Map</span>
              <span>•</span>
              <span><strong className="text-white">[X]</strong> Archive</span>
              <span>•</span>
              <span><strong className="text-white">[ESC]</strong> Pause</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
