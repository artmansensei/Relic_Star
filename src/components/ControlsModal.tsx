import React from 'react';
import { X, Navigation, MousePointer, Shield, Volume2, Scan, Wind, Battery, Radio } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0d1117] border border-[#38bdf8]/40 rounded-lg p-6 shadow-2xl text-[#e2e2ea] font-mono-tech max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
              EVA EXPLORATION &amp; SYSTEMS MANUAL
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#1d2025] hover:bg-[#33353b] text-[#bdc8d1] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Keybind Grid */}
        <div className="space-y-2.5 text-xs mb-5">
          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">WASD / ARROWS</span>
            </div>
            <span className="text-white font-medium">Walk &amp; Explore Martian Surface</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">MOUSE LOOK</span>
            </div>
            <span className="text-white font-medium">Click 3D viewport to lock mouse; 360° look</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">SHIFT</span>
            </div>
            <span className="text-white font-medium">Sprint (consumes more O₂ and Energy)</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">F</span>
            </div>
            <span className="text-white font-medium">Toggle Scientific Lidar Scanner (uses Energy)</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">C</span>
            </div>
            <span className="text-white font-medium">Use Energy Charge (100% Suit Power Refill; 3-6 stored)</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">SPACE</span>
            </div>
            <span className="text-white font-medium">Low-Gravity Martian Hop / Jump</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">E</span>
            </div>
            <span className="text-white font-medium">Raise / Lower Wrist Energy Interface</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">I</span>
            </div>
            <span className="text-white font-medium">Investigate Relic / Open Dossier (when near relic)</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">T</span>
            </div>
            <span className="text-white font-medium">Transmit Documented Discovery to Earth (DSN)</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">M</span>
            </div>
            <span className="text-white font-medium">Open Contextual Mission Map &amp; Navigation</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#38bdf8] font-bold rounded">X</span>
            </div>
            <span className="text-white font-medium">Open 5-Artifact Mission Archive [NASA PDS]</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#191c21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#282a30] text-[#f59e0b] font-bold rounded">ESC</span>
            </div>
            <span className="text-white font-medium">Lower Wrist / Close Modal / Pause Mission</span>
          </div>
        </div>

        {/* Systems Guide Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] mb-5">
          <div className="p-2.5 bg-[#111319] rounded border border-white/5 space-y-1">
            <span className="text-[#38bdf8] font-bold flex items-center gap-1">
              <Wind size={12} /> O₂ SYSTEM
            </span>
            <p className="text-[#87929a] leading-tight">
              Gradually drops while exploring. Sprinting and jumping consume more O₂. Warning sounds trigger below 25% and 10%.
            </p>
          </div>

          <div className="p-2.5 bg-[#111319] rounded border border-white/5 space-y-1">
            <span className="text-[#38bdf8] font-bold flex items-center gap-1">
              <Battery size={12} /> ENERGY SYSTEM
            </span>
            <p className="text-[#87929a] leading-tight">
              Sprinting and scanner drain battery. Recovers when walking or resting. If depleted, scanner shuts off.
            </p>
          </div>

          <div className="p-2.5 bg-[#111319] rounded border border-white/5 space-y-1">
            <span className="text-[#38bdf8] font-bold flex items-center gap-1">
              <Radio size={12} /> COMM SIGNAL
            </span>
            <p className="text-[#87929a] leading-tight">
              Strongest (100%) near landing site; weakens as you travel farther into the crater.
            </p>
          </div>

          <div className="p-2.5 bg-[#111319] rounded border border-white/5 space-y-1">
            <span className="text-[#38bdf8] font-bold flex items-center gap-1">
              <Scan size={12} /> SCANNER [F]
            </span>
            <p className="text-[#87929a] leading-tight">
              Calculates real 3D distance and vector to the rover. Confidence increases as you approach.
            </p>
          </div>
        </div>

        {/* Tip */}
        <div className="p-3 rounded bg-[#111319] border-l-2 border-[#f59e0b] text-xs text-[#bdc8d1] leading-relaxed mb-5">
          <span className="text-[#f59e0b] font-bold block mb-0.5">EXPLORATION DIRECTIVE:</span>
          Activate the scanner with [F] or follow the compass ribbon to locate 5 real NASA missions scattered across the Martian terrain: Spirit Rover (MER-A), Opportunity Rover (MER-B), Phoenix Lander, InSight Lander, and Curiosity Rover (MSL). Approaching within range unlocks the scientific investigation interface. You can also look directly at components on any artifact in 3D to highlight and inspect them.
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded transition-colors"
        >
          CONFIRM &amp; RESUME MISSION
        </button>
      </div>
    </div>
  );
};
