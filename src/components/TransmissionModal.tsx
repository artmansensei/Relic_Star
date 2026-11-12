import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Send,
  CheckCircle,
  Database,
  ArrowRight,
  RefreshCw,
  Globe,
  Satellite,
  Layers,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { PlayerState } from '../mars/controls';
import { Artifact } from '../data/artifacts';
import { calculateDeepSpaceLinkTelemetry, TransmissionStep } from '../data/mission';
import { calculateLunarLinkTelemetry } from '../data/lunarMission';
import { marsAudio } from '../mars/audio';

interface TransmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: Artifact;
  playerState: PlayerState;
  onTransmissionComplete: (artifactId: string) => void;
  onOpenArchive: () => void;
  planet?: 'mars' | 'moon';
}

export const TransmissionModal: React.FC<TransmissionModalProps> = ({
  isOpen,
  onClose,
  artifact,
  playerState,
  onTransmissionComplete,
  onOpenArchive,
  planet = 'mars',
}) => {
  const [step, setStep] = useState<TransmissionStep>('idle');
  const [packetsSent, setPacketsSent] = useState(0);
  const [packetsReceived, setPacketsReceived] = useState(0);
  const [packetsVerified, setPacketsVerified] = useState(0);
  const [packetsDropped, setPacketsDropped] = useState(0);
  const [activePacketType, setActivePacketType] = useState<string>('Initialization');
  const [verificationChecklist, setVerificationChecklist] = useState({
    identity: false,
    metadata: false,
    fieldData: false,
    scienceReport: false,
    checksum: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const packetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const missionData = artifact.historical;
  const linkTelemetry = planet === 'moon' ? calculateLunarLinkTelemetry() : calculateDeepSpaceLinkTelemetry();

  // Reset or initialize state when opening
  useEffect(() => {
    if (isOpen) {
      if (step === 'idle') {
        startTransmissionSequence();
      }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (packetIntervalRef.current) clearInterval(packetIntervalRef.current);
      setStep('idle');
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (packetIntervalRef.current) clearInterval(packetIntervalRef.current);
    };
  }, [isOpen, artifact.id]);

  const startTransmissionSequence = () => {
    marsAudio.playTransmissionStart();
    setStep('link_request');
    setPacketsSent(0);
    setPacketsReceived(0);
    setPacketsVerified(0);
    setPacketsDropped(0);
    setVerificationChecklist({
      identity: false,
      metadata: false,
      fieldData: false,
      scienceReport: false,
      checksum: false,
    });

    // Sequence progression
    timerRef.current = setTimeout(() => {
      marsAudio.playRelayBeep();
      setStep('signal_acquired');

      timerRef.current = setTimeout(() => {
        marsAudio.playComponentSelect();
        setStep('packetization');

        timerRef.current = setTimeout(() => {
          setStep('transmitting');
          runPacketStream();
        }, 1100);
      }, 1200);
    }, 1400);
  };

  const runPacketStream = () => {
    // Transmission rate and packet loss influenced by live player signal strength
    const signalNorm = Math.max(0.15, playerState.signal / 100);
    const intervalMs = Math.round(75 - signalNorm * 45);

    let sent = 0;
    let received = 0;
    let verified = 0;
    let dropped = 0;

    const packetTypes = [
      `Mission Header & ${missionData.designation} GUID`,
      'Surface Coordinates & In-Situ AGL',
      'Atmospheric Pressure & Regolith Spectra',
      'Panoramic Multispectral Frames (1024x1024)',
      'Science Instrument Telemetry Stream',
      'Engineering Hardware State of Health',
      'Geochemical Elemental Abundances',
      'Mission Elapsed Sol Clock Synchronization',
      'Deep Space Network X-Band Frame Lock',
      'Cryptographic SHA-256 Science Digest',
    ];

    packetIntervalRef.current = setInterval(() => {
      if (sent < 100) {
        sent += 1;
        setPacketsSent(sent);

        // Packet type cycling
        const typeIdx = Math.floor((sent / 100) * packetTypes.length) % packetTypes.length;
        setActivePacketType(packetTypes[typeIdx]);

        // Simulating packet reception with potential minimal loss when signal is low
        const lossThreshold = signalNorm < 0.35 ? 0.06 : 0.01;
        const isLost = Math.random() < lossThreshold && dropped < 4;

        if (!isLost) {
          received += 1;
          setPacketsReceived(received);
          verified += 1;
          setPacketsVerified(verified);
        } else {
          dropped += 1;
          setPacketsDropped(dropped);
        }

        // Periodic audio chirp for packet bursts
        if (sent % 12 === 0) {
          marsAudio.playFootstep();
        }
      } else {
        // Packets finished streaming
        if (packetIntervalRef.current) clearInterval(packetIntervalRef.current);

        timerRef.current = setTimeout(() => {
          marsAudio.playRelayBeep();
          setStep('deep_space_relay');

          timerRef.current = setTimeout(() => {
            marsAudio.playRelayBeep();
            setStep('earth_receiving');

            timerRef.current = setTimeout(() => {
              setStep('packet_verification');
              runVerificationChecklist();
            }, 1400);
          }, 1500);
        }, 800);
      }
    }, intervalMs);
  };

  const runVerificationChecklist = () => {
    marsAudio.playComponentSelect();
    setVerificationChecklist((prev) => ({ ...prev, identity: true }));

    timerRef.current = setTimeout(() => {
      marsAudio.playComponentSelect();
      setVerificationChecklist((prev) => ({ ...prev, metadata: true }));

      timerRef.current = setTimeout(() => {
        marsAudio.playComponentSelect();
        setVerificationChecklist((prev) => ({ ...prev, fieldData: true }));

        timerRef.current = setTimeout(() => {
          marsAudio.playComponentSelect();
          setVerificationChecklist((prev) => ({ ...prev, scienceReport: true }));

          timerRef.current = setTimeout(() => {
            marsAudio.playDiscoveryChime();
            setVerificationChecklist((prev) => ({ ...prev, checksum: true }));
            setStep('archive_complete');
            onTransmissionComplete(artifact.id);
          }, 800);
        }, 700);
      }, 700);
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && step === 'archive_complete') {
          marsAudio.playTargetLock();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#07090e]/95 border border-[#38bdf8]/50 rounded-xl shadow-2xl flex flex-col text-[#e2e2ea] font-mono-tech overflow-hidden">
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
              <Satellite size={13} className="text-[#38bdf8] animate-pulse" />
              <span>NASA DEEP SPACE NETWORK // INTERPLANETARY TELEMETRY DOWNLINK</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold font-display text-white tracking-wide mt-0.5">
              MARS → EARTH DATA TRANSMISSION TERMINAL
            </h1>
          </div>

          <button
            onClick={() => {
              marsAudio.playTargetLock();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#181d28] hover:bg-[#252c3d] text-[#87929a] hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Close Terminal"
          >
            <X size={18} />
          </button>
        </header>

        {/* ============================================================== */}
        {/* 2. BODY CONTENT                                                */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5 text-xs">
          {/* A. Orbital Communication Path Visualization (Mars -> DSN -> Earth) */}
          <div className="bg-[#0b0e17] p-4 rounded-lg border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between text-[10px] text-[#87929a] uppercase">
              <span>INTERPLANETARY TELEMETRY ROUTING</span>
              <span className="text-[#38bdf8] font-bold">X-BAND CARRIER LOCK: VERIFIED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center">
              {/* Node 1: Mars */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                  step === 'transmitting' || step === 'packetization' || step === 'link_request'
                    ? 'bg-[#a84b26]/20 border-[#f59e0b]'
                    : 'bg-[#121622]/60 border-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#c3582d]/30 border border-[#c3582d] flex items-center justify-center text-[#f59e0b]">
                  <Globe size={18} />
                </div>
                <span className="font-bold text-white text-xs">SOURCE: MARS</span>
                <span className="text-[10px] text-[#38bdf8] font-bold uppercase">{artifact.name}</span>
                <span className="text-[9px] text-[#87929a]">{artifact.site}</span>
              </div>

              {/* Node 2: Deep Space Network Relay */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                  step === 'deep_space_relay'
                    ? 'bg-[#38bdf8]/20 border-[#38bdf8] shadow-lg shadow-[#38bdf8]/10'
                    : 'bg-[#121622]/60 border-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8] flex items-center justify-center text-[#38bdf8]">
                  <Satellite size={18} className={step === 'deep_space_relay' ? 'animate-spin' : ''} />
                </div>
                <span className="font-bold text-white text-xs">DEEP SPACE NETWORK</span>
                <span className="text-[10px] text-[#f59e0b] font-bold">GOLDSTONE DSS-14 (70M)</span>
                <span className="text-[9px] text-[#87929a]">Propagation Delay Active</span>
              </div>

              {/* Node 3: Earth Mission Archive */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                  step === 'earth_receiving' || step === 'packet_verification' || step === 'archive_complete'
                    ? 'bg-[#10b981]/20 border-[#10b981] shadow-lg shadow-[#10b981]/10'
                    : 'bg-[#121622]/60 border-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#10b981]/20 border border-[#10b981] flex items-center justify-center text-[#10b981]">
                  <Database size={18} />
                </div>
                <span className="font-bold text-white text-xs">DESTINATION: EARTH</span>
                <span className="text-[10px] text-[#10b981] font-bold">NASA PDS ARCHIVE</span>
                <span className="text-[9px] text-[#87929a]">JPL Planetary Data System</span>
              </div>
            </div>

            {/* Realistic Light-Time Communication Delay Label */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-[#07090e] border border-white/5 text-[11px]">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-[#f59e0b]" />
                <span className="text-[#87929a]">
                  SIMULATED COMMUNICATION DELAY:
                </span>
                <span className="text-white font-bold">
                  ONE-WAY: {linkTelemetry.oneWayLightTimeStr}
                </span>
              </div>
              <div className="text-[#87929a]">
                ROUND-TRIP DELAY: <span className="text-[#38bdf8] font-bold">{linkTelemetry.roundTripDelayStr}</span>
              </div>
              <div className="text-[10px] text-[#87929a]">
                RANGE: {(linkTelemetry.distanceKm / 1e6).toFixed(1)}M KM ({linkTelemetry.distanceAU} AU)
              </div>
            </div>
          </div>

          {/* B. Transmission Progress & Packet Stream */}
          <div className="bg-[#0b0e17] p-4 rounded-lg border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                <span className="text-[#38bdf8] font-bold uppercase tracking-wider">
                  COMMUNICATION STATUS: {step.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-[#bdc8d1]">
                DATA PACKAGE: <strong className="text-white uppercase">{artifact.name} DISCOVERY</strong>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#181d28] h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  step === 'archive_complete'
                    ? 'bg-[#10b981]'
                    : 'bg-gradient-to-r from-[#38bdf8] to-[#f59e0b]'
                }`}
                style={{ width: `${packetsSent}%` }}
              />
            </div>

            {/* Packet Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-[#121622] p-2 rounded border border-white/5">
                <span className="text-[10px] text-[#87929a] block">PACKETS SENT</span>
                <span className="font-bold text-white text-sm">{packetsSent} / 100</span>
              </div>
              <div className="bg-[#121622] p-2 rounded border border-white/5">
                <span className="text-[10px] text-[#87929a] block">PACKETS RECEIVED</span>
                <span className="font-bold text-[#38bdf8] text-sm">{packetsReceived} / 100</span>
              </div>
              <div className="bg-[#121622] p-2 rounded border border-white/5">
                <span className="text-[10px] text-[#87929a] block">PACKETS VERIFIED</span>
                <span className="font-bold text-[#10b981] text-sm">{packetsVerified} / 100</span>
              </div>
              <div className="bg-[#121622] p-2 rounded border border-white/5">
                <span className="text-[10px] text-[#87929a] block">PACKET LOSS</span>
                <span className="font-bold text-[#f59e0b] text-sm">{packetsDropped} PKT</span>
              </div>
            </div>

            {/* Active Packet Stream Feed */}
            <div className="p-2.5 rounded bg-[#07090e] border border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-[#87929a]">ACTIVE PACKET BUFFER:</span>
              <span className="text-[#38bdf8] font-bold font-mono-tech">{activePacketType}</span>
              <span className="text-[#87929a]">
                SIGNAL QUALITY: <strong className="text-white">{playerState.signal}%</strong>
              </span>
            </div>
          </div>

          {/* C. Earth Receiving & Verification Sequence */}
          {(step === 'earth_receiving' || step === 'packet_verification' || step === 'archive_complete') && (
            <div className="bg-[#0b0e17] p-4 rounded-lg border border-[#10b981]/40 flex flex-col gap-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#10b981]" />
                  <span className="text-white font-bold uppercase tracking-wider text-xs">
                    EARTH RECEIVING &amp; VERIFICATION SEQUENCE
                  </span>
                </div>
                <span className="text-[10px] bg-[#10b981]/20 px-2 py-0.5 rounded text-[#10b981] font-bold">
                  NASA PDS GOLDSTONE TERMINAL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded bg-[#10141e]">
                  {verificationChecklist.identity ? (
                    <CheckCircle size={14} className="text-[#10b981]" />
                  ) : (
                    <RefreshCw size={14} className="text-[#87929a] animate-spin" />
                  )}
                  <span>Artifact Identity: <strong>{artifact.name} ({missionData.designation})</strong></span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-[#10141e]">
                  {verificationChecklist.metadata ? (
                    <CheckCircle size={14} className="text-[#10b981]" />
                  ) : (
                    <RefreshCw size={14} className="text-[#87929a] animate-spin" />
                  )}
                  <span>Mission Metadata: <strong>{missionData.missionName} (NASA/JPL)</strong></span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-[#10141e]">
                  {verificationChecklist.fieldData ? (
                    <CheckCircle size={14} className="text-[#10b981]" />
                  ) : (
                    <RefreshCw size={14} className="text-[#87929a] animate-spin" />
                  )}
                  <span>Field Telemetry &amp; Coordinates Received</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-[#10141e]">
                  {verificationChecklist.scienceReport ? (
                    <CheckCircle size={14} className="text-[#10b981]" />
                  ) : (
                    <RefreshCw size={14} className="text-[#87929a] animate-spin" />
                  )}
                  <span>Scientific Dossier &amp; Discoveries Ingested</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-[#10141e] border border-[#10b981]/30">
                <div className="flex items-center gap-2">
                  {verificationChecklist.checksum ? (
                    <CheckCircle size={15} className="text-[#10b981]" />
                  ) : (
                    <RefreshCw size={15} className="text-[#f59e0b] animate-spin" />
                  )}
                  <span className="font-bold text-white">SHA-256 Science Data Checksum Verification</span>
                </div>
                <span className="text-[#10b981] font-bold">
                  {verificationChecklist.checksum ? '✓ CHECKSUM MATCHED' : 'COMPUTING...'}
                </span>
              </div>

              {step === 'archive_complete' && (
                <div className="bg-[#10b981]/15 p-3 rounded-lg border border-[#10b981]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div>
                    <span className="text-xs font-bold text-[#10b981] block">
                      ARCHIVE ENTRY CREATED &amp; CATALOGED PERMANENTLY
                    </span>
                    <span className="text-[11px] text-[#bdc8d1]">
                      Record archived under NASA PDS ID: {missionData.designation}-SOL{Math.round(playerState.elapsedTimeSec / 60)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      marsAudio.playComponentSelect();
                      onOpenArchive();
                    }}
                    className="px-4 py-2 bg-[#10b981] hover:bg-[#34d399] text-[#07090e] font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#10b981]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Database size={14} />
                    <span>VIEW IN MISSION ARCHIVE</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 3. FOOTER                                                      */}
        {/* ============================================================== */}
        <footer className="px-5 py-3.5 border-t border-white/10 bg-[#090c12]/95 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#87929a]">
            {step === 'archive_complete' ? (
              <span className="text-[#10b981] font-bold">
                ✓ ALL PACKETS VERIFIED &amp; PERMANENTLY ARCHIVED
              </span>
            ) : (
              <span>DSN Link Status: Interplanetary Downlink In Progress</span>
            )}
          </div>

          <button
            onClick={() => {
              marsAudio.playTargetLock();
              onClose();
            }}
            className="px-4 py-2 bg-[#181d28] hover:bg-[#252c3d] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-white/10 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>{step === 'archive_complete' ? 'RETURN TO EVA [ESC]' : 'CLOSE MONITOR [ESC]'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
