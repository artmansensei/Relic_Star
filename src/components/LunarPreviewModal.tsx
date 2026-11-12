import React from 'react';
import { ArrowLeft, Orbit, Sparkles, Compass, Radio, Globe2, Crosshair } from 'lucide-react';
import { marsAudio } from '../mars/audio';

interface LunarPreviewModalProps {
  isOpen?: boolean;
  onBack: () => void;
  onLaunchMoon?: () => void;
}

export const LunarPreviewModal: React.FC<LunarPreviewModalProps> = ({
  isOpen = true,
  onBack,
  onLaunchMoon,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          marsAudio.playMenuClick();
          onBack();
        }
      }}
    >
      {/* Top Header Bar */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-[#87929a] font-mono-tech z-30 pointer-events-auto">
        <button
          onClick={() => {
            marsAudio.playMenuClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e121a]/90 hover:bg-[#181d28] border border-white/10 hover:border-white/20 text-[#cbd5e1] hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <ArrowLeft size={13} />
          <span>BACK</span>
          <kbd className="px-1 py-0.2 bg-white/5 rounded text-[9px] text-[#64748b] border border-white/10 font-mono">
            ESC
          </kbd>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-bold text-[#38bdf8] uppercase tracking-widest">
          <Orbit size={14} />
          <span>LUNAR EXPEDITION OVERVIEW // MARE TRANQUILLITATIS</span>
        </div>
      </header>

      {/* Center Modal Briefing */}
      <main className="relative z-20 w-full max-w-3xl mx-auto my-auto bg-[#070a12]/95 border border-[#38bdf8]/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Tactical Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8] pointer-events-none" />

        {/* Status Pill */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
            <span>MISSION READY // 7 REAL NASA RELICS TO FIND</span>
          </div>

          <span className="text-[10px] text-[#87929a] font-mono">DESTINATION // EARTH'S MOON</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display uppercase tracking-wider text-white mt-4">
          WALK ON THE MOON
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
          Put on your spacesuit and step onto the Moon! You will explore the gray, dusty surface where human astronauts and robotic probes first landed. Everything they left behind is still there waiting for you.
        </p>

        {/* Simple 4-Card Overview for School-Age & Casual Players */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8] uppercase">
              <Sparkles size={14} />
              <span>1. HOP IN LOW GRAVITY</span>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              Gravity is 6 times weaker here than on Earth. Press <strong className="text-white">SPACE</strong> to make giant, floating astronaut hops over rocks and crater slopes!
            </p>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8] uppercase">
              <Compass size={14} />
              <span>2. TRACK WITH YOUR SCANNER</span>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              Press <strong className="text-white">[F]</strong> to turn on your handheld scanner. It points arrows toward radio signals from hidden landers and buggies.
            </p>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8] uppercase">
              <Radio size={14} />
              <span>3. FIND REAL HISTORIC RELICS</span>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              Discover Neil Armstrong's Apollo 11 lander, real lunar roving buggies, early robot scouts, and the laser reflector that still works today!
            </p>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8] uppercase">
              <Crosshair size={14} />
              <span>4. DISCOVER THEIR STORIES</span>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              Walk up to any machine and press <strong className="text-white">[I]</strong>. You will learn what it did, who built it, and why it changed our world forever.
            </p>
          </div>
        </div>

        {/* Tip Notice */}
        <div className="mt-5 p-3 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] shrink-0">
            <Globe2 size={20} />
          </div>
          <div className="flex flex-col text-xs text-[#cbd5e1] leading-relaxed">
            <span className="font-bold text-white">LOOK UP AT PLANET EARTH!</span>
            <span className="text-[11px] text-[#87929a]">
              Look up into the black starry sky to see our blue home planet glowing in space. Keep an eye on your suit oxygen and energy as you explore.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={() => {
              marsAudio.playMenuClick();
              onBack();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[#cbd5e1] hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/10 active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>RETURN</span>
          </button>

          {onLaunchMoon && (
            <button
              onClick={() => {
                marsAudio.playMenuClick();
                onLaunchMoon();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-[#38bdf8] text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#0284c7]/30 active:scale-95 font-display flex items-center justify-center gap-2"
            >
              <Orbit size={15} />
              <span>START MOON EXPEDITION</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
