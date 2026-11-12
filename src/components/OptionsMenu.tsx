import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Sliders,
  Monitor,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Radio,
  Zap,
} from 'lucide-react';
import { GameSettings, saveGameSettings } from '../data/settings';
import { resetPersistentMission, getSavedMissionSummary } from '../data/mission';
import { getSavedLunarMissionSummary } from '../data/lunarMission';
import { marsAudio } from '../mars/audio';
import { EnergyDrainRate, ENERGY_DRAIN_PRESETS } from '../data/survivalConfig';

interface OptionsMenuProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onBack: () => void;
  onExpeditionReset?: () => void;
  activePlanet?: 'mars' | 'moon';
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  onExpeditionReset,
  activePlanet = 'mars',
}) => {
  const [localSettings, setLocalSettings] = useState<GameSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showResetConfirm) {
          setShowResetConfirm(false);
        } else {
          marsAudio.playMenuClick();
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResetConfirm, onBack]);

  const handleVolumeChange = (newVol: number) => {
    const updated: GameSettings = {
      ...localSettings,
      masterVolume: newVol,
      isMuted: newVol === 0 ? true : localSettings.isMuted,
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveGameSettings(updated);
    marsAudio.setMasterVolume(newVol);
  };

  const handleMuteToggle = () => {
    const nextMuted = !localSettings.isMuted;
    const updated: GameSettings = {
      ...localSettings,
      isMuted: nextMuted,
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveGameSettings(updated);
    marsAudio.setMuted(nextMuted);
    if (!nextMuted) {
      marsAudio.playMenuClick();
    }
  };

  const handleSensitivityChange = (newSens: number) => {
    const updated: GameSettings = {
      ...localSettings,
      mouseSensitivity: Number(newSens.toFixed(2)),
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveGameSettings(updated);
  };

  const handleGraphicsChange = (quality: 'low' | 'medium' | 'high') => {
    marsAudio.playMenuClick();
    const updated: GameSettings = {
      ...localSettings,
      graphicsQuality: quality,
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveGameSettings(updated);
  };

  const handleDrainRateChange = (rate: EnergyDrainRate) => {
    marsAudio.playMenuClick();
    const updated: GameSettings = {
      ...localSettings,
      energyDrainRate: rate,
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveGameSettings(updated);
  };

  const handleConfirmReset = () => {
    marsAudio.playTargetLock();
    if (onExpeditionReset) {
      onExpeditionReset();
    } else {
      resetPersistentMission();
    }
    setShowResetConfirm(false);
    setResetSuccessMessage(true);
    setTimeout(() => {
      setResetSuccessMessage(false);
    }, 3500);
  };

  const marsSummary = getSavedMissionSummary();
  const lunarSummary = getSavedLunarMissionSummary();
  const activeSummary = activePlanet === 'moon' ? lunarSummary : marsSummary;

  return (
    <div className="relative w-full h-full min-h-screen overflow-y-auto overflow-x-hidden bg-[#04060a]/95 backdrop-blur-md text-[#e2e2ea] select-none font-mono-tech flex flex-col justify-between p-4 sm:p-8 lg:p-12 animate-in fade-in duration-200">
      {/* Background Starfield Grid Pattern (fixed position) */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between text-xs w-full max-w-4xl mx-auto">
        <button
          onClick={() => {
            marsAudio.playMenuClick();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0d121c]/80 hover:bg-[#182338] text-[#87929a] hover:text-white border border-white/10 hover:border-[#38bdf8]/40 transition-all cursor-pointer group active:scale-95"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold tracking-wider uppercase text-[11px]">BACK TO PREVIOUS</span>
          <kbd className="px-1 py-0.2 bg-white/5 rounded text-[9px] text-[#64748b] border border-white/10 font-mono">
            ESC
          </kbd>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-bold text-[#38bdf8] uppercase tracking-widest">
          <Sliders size={14} />
          <span>RELIC STAR // SYSTEM CONFIGURATION</span>
        </div>
      </header>

      {/* Main Options Form */}
      <main className="relative z-20 w-full max-w-2xl mx-auto my-auto bg-[#070a12]/90 border border-[#38bdf8]/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6">
        {/* Title */}
        <div className="pb-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display uppercase tracking-wider text-white">
              OPTIONS &amp; TELEMETRY SETTINGS
            </h2>
            <p className="text-xs text-[#87929a] mt-0.5">
              Configure audio, spacesuit mouse input, graphics fidelity, and expedition save logs.
            </p>
          </div>
          <Sliders size={22} className="text-[#38bdf8]" />
        </div>

        {/* Setting 1: Master Volume */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Volume2 size={15} className="text-[#38bdf8]" />
              <span>MASTER AUDIO VOLUME</span>
            </span>
            <span className="font-bold text-[#38bdf8] font-mono">
              {localSettings.isMuted ? 'MUTED' : `${localSettings.masterVolume}%`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localSettings.isMuted ? 0 : localSettings.masterVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="flex-1 accent-[#38bdf8] h-1.5 bg-[#182338] rounded-lg appearance-none cursor-pointer"
            />
            <button
              onClick={handleMuteToggle}
              className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                localSettings.isMuted
                  ? 'bg-red-950/60 text-red-300 border-red-500/50'
                  : 'bg-white/5 text-[#87929a] hover:text-white border-white/10'
              }`}
              title={localSettings.isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {localSettings.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </div>

        {/* Setting 2: Mouse Sensitivity */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Radio size={15} className="text-[#38bdf8]" />
              <span>SPACESUIT MOUSE LOOK SENSITIVITY</span>
            </span>
            <span className="font-bold text-[#38bdf8] font-mono">
              {localSettings.mouseSensitivity.toFixed(2)}×
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={localSettings.mouseSensitivity}
              onChange={(e) => handleSensitivityChange(Number(e.target.value))}
              className="flex-1 accent-[#38bdf8] h-1.5 bg-[#182338] rounded-lg appearance-none cursor-pointer"
            />
            <button
              onClick={() => handleSensitivityChange(1.0)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-[#87929a] hover:text-white border border-white/10 cursor-pointer"
            >
              RESET (1.0×)
            </button>
          </div>
          <span className="text-[10px] text-[#64748b]">
            Controls first-person camera yaw and pitch sensitivity during surface exploration.
          </span>
        </div>

        {/* Setting 3: Graphics Quality */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Monitor size={15} className="text-[#38bdf8]" />
              <span>GRAPHICS FIDELITY &amp; SHADOWS</span>
            </span>
            <span className="font-bold text-[#38bdf8] uppercase font-mono">
              {localSettings.graphicsQuality}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => handleGraphicsChange(q)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  localSettings.graphicsQuality === q
                    ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                    : 'bg-white/5 border-white/10 text-[#87929a] hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{q}</span>
                <span className="text-[8px] text-[#64748b] font-normal">
                  {q === 'low' ? '1x Scale, No Shadow' : q === 'medium' ? '1.5x Scale, Shadows' : '2x Scale, Full PCF'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Setting 4: Spacesuit Energy Drain Rate (Configurable Balancing) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Zap size={15} className="text-[#38bdf8]" />
              <span>SPACESUIT ENERGY CONSUMPTION RATE</span>
            </span>
            <span className="font-bold text-[#38bdf8] uppercase font-mono">
              {ENERGY_DRAIN_PRESETS[localSettings.energyDrainRate || 'standard'].label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['relaxed', 'standard', 'challenging'] as const).map((rate) => (
              <button
                key={rate}
                onClick={() => handleDrainRateChange(rate)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  (localSettings.energyDrainRate || 'standard') === rate
                    ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                    : 'bg-white/5 border-white/10 text-[#87929a] hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{rate}</span>
                <span className="text-[8px] text-[#64748b] font-normal text-center">
                  {ENERGY_DRAIN_PRESETS[rate].description}
                </span>
              </button>
            ))}
          </div>
          <span className="text-[10px] text-[#64748b]">
            Adjusts locomotion and life-support power drain. Documenting relics grants +1 energy charge (up to 6 max).
          </span>
        </div>

        {/* Setting 5: Expedition Save Management (Reset with Confirmation) */}
        <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <RotateCcw size={15} className="text-[#ef4444]" />
              <span>EXPEDITION SURVEY DATA</span>
            </span>
            <span className="text-[10px] text-[#87929a]">
              {activePlanet === 'moon' ? 'Moon' : 'Mars'} Progress: {activeSummary.discovered}/{activeSummary.total} Localized
            </span>
          </div>

          {resetSuccessMessage && (
            <div className="p-2.5 rounded-lg bg-[#10b981]/15 border border-[#10b981]/40 text-[#10b981] text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle size={14} />
              <span>Expedition progress reset successfully. All survey logs returned to Sol 01 baseline.</span>
            </div>
          )}

          {!showResetConfirm ? (
            <button
              onClick={() => {
                marsAudio.playMenuHover();
                setShowResetConfirm(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-500/40 hover:border-red-500 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              <span>RESET CURRENT EXPEDITION PROGRESS</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-500 text-xs flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-2.5 text-red-200">
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold uppercase tracking-wider text-red-300">
                    CONFIRM EXPEDITION DATA PURGE?
                  </span>
                  <p className="text-[11px] text-red-200/90 leading-relaxed">
                    This action will permanently erase all localized artifact coordinates, recorded telemetry, documented dossiers, and transmitted Deep Space Network archives. You will restart from Sol 01 at the Landing Base clearing.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-500/30">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold cursor-pointer"
                >
                  CANCEL (ABORT)
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-red-600/30"
                >
                  PURGE EXPEDITION DATA
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 flex items-center justify-between text-[11px] text-[#64748b] w-full max-w-4xl mx-auto pt-4 border-t border-white/5">
        <span>SETTINGS ARE AUTOMATICALLY PERSISTED TO LOCAL STORAGE</span>
        <span>PRESS ESC TO RETURN</span>
      </footer>
    </div>
  );
};
