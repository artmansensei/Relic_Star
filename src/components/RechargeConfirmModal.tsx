import React, { useEffect } from 'react';
import { Zap, AlertTriangle, Check, X, Shield, BatteryCharging } from 'lucide-react';
import { SURVIVAL_CONFIG, getEnergySpeedStage } from '../data/survivalConfig';
import { marsAudio } from '../mars/audio';

interface RechargeConfirmModalProps {
  isOpen: boolean;
  currentEnergy: number;
  currentCharges: number;
  maxCharges?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RechargeConfirmModal: React.FC<RechargeConfirmModalProps> = ({
  isOpen,
  currentEnergy,
  currentCharges,
  maxCharges = SURVIVAL_CONFIG.MAX_ENERGY_CHARGES,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentCharges > 0) {
          marsAudio.playComponentSelect();
          onConfirm();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        marsAudio.playComponentSelect();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentCharges, onConfirm, onCancel]);

  if (!isOpen) return null;

  const currentStage = getEnergySpeedStage(currentEnergy);
  const remainingAfterArm = Math.max(0, currentCharges - 1);
  const canArm = currentCharges > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-mono-tech select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recharge-modal-title"
      onClick={(e) => {
        // Clicking backdrop closes safely
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-[#080d17] border-2 border-[#0284c7]/80 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-sky-950/80 text-[#e2e2ea] flex flex-col gap-5 overflow-hidden">
        {/* Tactical Cyan Corner Notches */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#38bdf8]" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#38bdf8]" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#38bdf8]" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#38bdf8]" />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-75" />

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-sky-500/20 pb-4">
          <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-400/50 flex items-center justify-center text-[#38bdf8] shrink-0 shadow-lg shadow-sky-950/50">
            <BatteryCharging size={26} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-[#38bdf8] uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
              <span>ARES EVA // POWER INJECTOR PROTOCOL</span>
            </div>
            <h2
              id="recharge-modal-title"
              className="text-lg sm:text-xl font-bold font-display text-white tracking-wide uppercase mt-0.5"
            >
              CONFIRM ENERGY RECHARGE
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Cancel and close [Esc]"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Telemetry Comparison & Charges Inventory */}
        <div className="grid grid-cols-2 gap-3">
          {/* Current Battery Level */}
          <div className="bg-[#0e1626]/90 border border-sky-500/20 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              CURRENT BATTERY
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                currentEnergy <= 0 ? 'text-red-400' : currentEnergy < 30 ? 'text-amber-400' : 'text-[#38bdf8]'
              }`}>
                {Math.round(currentEnergy)}%
              </span>
              <span className="text-[10px] text-slate-400">STATE</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{currentStage.label}</span>
            </div>
          </div>

          {/* Recharged Target */}
          <div className="bg-[#0b1b2b]/90 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Check size={11} />
              <span>POST-RECHARGE TARGET</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-300">
                100%
              </span>
              <span className="text-[10px] text-emerald-400/80">CAPACITY</span>
            </div>
            <div className="text-[10px] text-emerald-300/90 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>NOMINAL (100% EVA SPEED)</span>
            </div>
          </div>
        </div>

        {/* 6-Slot Charges Visual Bar */}
        <div className="bg-[#0c121e] border border-sky-500/20 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Zap size={13} className="text-[#38bdf8]" />
              <span>STORED ENERGY CHARGES</span>
            </span>
            <span className="font-mono font-bold text-[#38bdf8]">
              {currentCharges} OF {maxCharges} AVAILABLE
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5 mt-1">
            {Array.from({ length: maxCharges }).map((_, idx) => {
              const isFilled = idx < currentCharges;
              const isConsumedSlot = idx === currentCharges - 1;

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all ${
                    isConsumedSlot
                      ? 'bg-amber-950/40 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400/50'
                      : isFilled
                      ? 'bg-sky-950/60 border-sky-400/70 text-[#38bdf8]'
                      : 'bg-black/40 border-slate-800 text-slate-600'
                  }`}
                >
                  <Zap
                    size={15}
                    className={
                      isConsumedSlot
                        ? 'text-amber-400 animate-pulse'
                        : isFilled
                        ? 'text-[#38bdf8]'
                        : 'text-slate-700'
                    }
                  />
                  <span className="text-[8px] font-mono mt-0.5 font-bold">
                    {isConsumedSlot ? 'USE 1' : isFilled ? `C0${idx + 1}` : 'EMPTY'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
            <span>CONSUMES: <strong className="text-white">1 CHARGE</strong></span>
            <span>REMAINING AFTER ARMING: <strong className="text-[#38bdf8]">{remainingAfterArm}</strong></span>
          </div>
        </div>

        {/* Explanation & Safety Notice */}
        <div className="bg-[#060b13] border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2.5">
          <Shield size={16} className="text-[#38bdf8] shrink-0 mt-0.5" />
          <div>
            <p>
              Confirming consumes <span className="text-white font-bold">1 charge</span> and arms the wrist recharge system (<strong>Step 2</strong>).
              To execute the energy transfer, click the physical <strong className="text-[#38bdf8]">RECHARGE</strong> button on your astronaut wrist display (<strong>Step 3</strong>).
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Cancellation is supported at any time before clicking the physical button and will safely refund your consumed charge.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={() => {
              marsAudio.playComponentSelect();
              onCancel();
            }}
            className="w-full sm:w-1/3 py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X size={14} />
            <span>CANCEL [Esc]</span>
          </button>

          <button
            onClick={() => {
              if (canArm) {
                marsAudio.playComponentSelect();
                onConfirm();
              }
            }}
            disabled={!canArm}
            className={`w-full sm:w-2/3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              canArm
                ? 'bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0284c7] text-[#040810] shadow-lg shadow-sky-600/40 hover:shadow-sky-500/60 cursor-pointer active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Zap size={14} className="fill-current" />
            <span>CONFIRM & ARM INJECTOR [Enter]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
