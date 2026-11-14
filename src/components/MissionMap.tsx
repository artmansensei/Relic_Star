import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Compass,
  Navigation,
  MapPin,
  Radio,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Layers,
  ChevronRight,
  Database,
  Send,
  HelpCircle,
  FileText,
  Activity,
} from 'lucide-react';
import { PlayerState } from '../mars/controls';
import { PersistentMissionData } from '../data/mission';
import { ARTIFACT_LIST, Artifact } from '../data/artifacts';
import { LUNAR_ARTIFACT_LIST } from '../data/lunarArtifacts';
import { marsAudio } from '../mars/audio';

interface MissionMapProps {
  playerState: PlayerState;
  missionProgress: PersistentMissionData;
  onSwitchToArchiveTab?: (artifactId?: string) => void;
  planet?: 'mars' | 'moon';
  artifacts?: Artifact[];
}

export type ArtifactStatus = 'UNDISCOVERED' | 'DISCOVERED' | 'DOCUMENTED' | 'TRANSMITTED' | 'ARCHIVED';

// Helper to determine primary status string and styling
export function getArtifactPrimaryStatus(prog?: {
  isDiscovered?: boolean;
  isDocumented?: boolean;
  isTransmitted?: boolean;
  isArchived?: boolean;
}): {
  status: ArtifactStatus;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgeColorHex: string;
  isDiscovered: boolean;
} {
  if (prog?.isArchived) {
    return {
      status: 'ARCHIVED',
      label: 'ARCHIVED',
      badgeBg: 'bg-[#10b981]/20',
      badgeBorder: 'border-[#10b981]/50',
      badgeText: 'text-[#10b981]',
      badgeColorHex: '#10b981',
      isDiscovered: true,
    };
  }
  if (prog?.isTransmitted) {
    return {
      status: 'TRANSMITTED',
      label: 'TRANSMITTED',
      badgeBg: 'bg-[#a855f7]/20',
      badgeBorder: 'border-[#a855f7]/50',
      badgeText: 'text-[#c084fc]',
      badgeColorHex: '#a855f7',
      isDiscovered: true,
    };
  }
  if (prog?.isDocumented) {
    return {
      status: 'DOCUMENTED',
      label: 'DOCUMENTED',
      badgeBg: 'bg-[#f59e0b]/20',
      badgeBorder: 'border-[#f59e0b]/50',
      badgeText: 'text-[#fbbf24]',
      badgeColorHex: '#f59e0b',
      isDiscovered: true,
    };
  }
  if (prog?.isDiscovered) {
    return {
      status: 'DISCOVERED',
      label: 'DISCOVERED',
      badgeBg: 'bg-[#38bdf8]/20',
      badgeBorder: 'border-[#38bdf8]/50',
      badgeText: 'text-[#38bdf8]',
      badgeColorHex: '#38bdf8',
      isDiscovered: true,
    };
  }
  return {
    status: 'UNDISCOVERED',
    label: 'UNDISCOVERED',
    badgeBg: 'bg-white/5',
    badgeBorder: 'border-white/10',
    badgeText: 'text-[#87929a]',
    badgeColorHex: '#64748b',
    isDiscovered: false,
  };
}

// Convert degrees to 16-point cardinal direction string
function getCompassDirection(deg: number): string {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

// World coordinate bounds for the 1100m x 1100m quadrant
// Base is at (0, 0).
// -Z is North, +Z is South.
// +X is East, -X is West.
const WORLD_HALF_SIZE = 550; // -550 to +550
const SVG_VIEW_SIZE = 600; // viewBox 0 0 600 600
const SVG_PADDING = 38; // padding inside border for coordinate numbers
const USABLE_RADIUS = SVG_VIEW_SIZE / 2 - SVG_PADDING; // 262px for 550m

function worldToSvg(x: number, z: number): { cx: number; cy: number } {
  const cx = SVG_VIEW_SIZE / 2 + (x / WORLD_HALF_SIZE) * USABLE_RADIUS;
  // -z is North (up), so negative z maps to smaller cy (top of SVG)
  const cy = SVG_VIEW_SIZE / 2 + (z / WORLD_HALF_SIZE) * USABLE_RADIUS;
  return { cx, cy };
}

export const MissionMap: React.FC<MissionMapProps> = ({
  playerState,
  missionProgress,
  onSwitchToArchiveTab,
  planet = 'mars',
  artifacts,
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mouse and Touch Drag Panning State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Planetary relics registered for orbital and surface mapping
  const mapArtifacts = useMemo(() => {
    return artifacts || (planet === 'moon' ? LUNAR_ARTIFACT_LIST : ARTIFACT_LIST);
  }, [artifacts, planet]);

  const discoveredCount = useMemo(() => {
    return mapArtifacts.filter((art: Artifact) => {
      const prog = missionProgress[art.id];
      return prog && prog.isDiscovered === true;
    }).length;
  }, [missionProgress, mapArtifacts]);

  // Selected artifact data
  const selectedArtifact = useMemo(() => {
    if (!selectedArtifactId) return null;
    return mapArtifacts.find((a: Artifact) => a.id === selectedArtifactId) || null;
  }, [selectedArtifactId, mapArtifacts]);

  // Player position in SVG coordinates
  const playerSvg = worldToSvg(playerState.position.x, playerState.position.z);
  // Base clearing at (0, 0)
  const baseSvg = worldToSvg(0, 0);

  // Dynamic telemetry calculations for selected artifact
  const selectedTelemetry = useMemo(() => {
    if (!selectedArtifact) return null;
    const dx = selectedArtifact.worldPosition.x - playerState.position.x;
    const dz = selectedArtifact.worldPosition.z - playerState.position.z;
    const distance = Math.hypot(dx, dz);
    const angleRad = Math.atan2(dx, -dz);
    const bearingDeg = ((angleRad * 180) / Math.PI + 360) % 360;
    const compassDir = getCompassDirection(bearingDeg);
    const bearingStr = `${Math.round(bearingDeg).toString().padStart(3, '0')}° ${compassDir}`;

    // Relative angle to player heading
    const relAngle = ((bearingDeg - playerState.headingDeg + 180) % 360) - 180;
    let relStr = 'AHEAD';
    if (Math.abs(relAngle) < 18) {
      relStr = 'DIRECTLY AHEAD';
    } else if (relAngle >= 18 && relAngle < 75) {
      relStr = `${Math.round(relAngle)}° TO STARBOARD (RIGHT)`;
    } else if (relAngle >= 75 && relAngle < 135) {
      relStr = 'RIGHT FLANK';
    } else if (relAngle <= -18 && relAngle > -75) {
      relStr = `${Math.round(Math.abs(relAngle))}° TO PORT (LEFT)`;
    } else if (relAngle <= -75 && relAngle > -135) {
      relStr = 'LEFT FLANK';
    } else {
      relStr = 'ASTERN (BEHIND)';
    }

    const prog = missionProgress[selectedArtifact.id] || {
      isDiscovered: false,
      isDocumented: false,
      isTransmitted: false,
      isArchived: false,
    };

    const statusInfo = getArtifactPrimaryStatus(prog);

    return {
      distance,
      bearingDeg,
      bearingStr,
      relStr,
      progress: prog,
      statusInfo,
    };
  }, [selectedArtifact, playerState.position, playerState.headingDeg, missionProgress]);

  // Zoom controls
  const handleZoomIn = () => {
    marsAudio.playComponentSelect();
    setZoomLevel((prev) => Math.min(2.8, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    marsAudio.playComponentSelect();
    setZoomLevel((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))));
  };

  const handleResetView = () => {
    marsAudio.playComponentSelect();
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCenterOnPlayer = () => {
    marsAudio.playTargetLock();
    const svgCoords = worldToSvg(playerState.position.x, playerState.position.z);
    setPanOffset({
      x: (SVG_VIEW_SIZE / 2 - svgCoords.cx) * zoomLevel,
      y: (SVG_VIEW_SIZE / 2 - svgCoords.cy) * zoomLevel,
    });
  };

  const handleCenterOnBase = () => {
    marsAudio.playTargetLock();
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse drag panning handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Left click only
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...panOffset };
    },
    [panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const maxPan = 420 * zoomLevel;
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.x + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.y + dy)),
      });
    },
    [isDragging, zoomLevel]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomLevel((prev) => Math.max(0.75, Math.min(2.8, Number((prev * zoomFactor).toFixed(2)))));
  }, []);

  // Touch panning handlers
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panStartRef.current = { ...panOffset };
      }
    },
    [panOffset]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartRef.current.x;
        const dy = e.touches[0].clientY - touchStartRef.current.y;
        const maxPan = 420 * zoomLevel;
        setPanOffset({
          x: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.x + dx)),
          y: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.y + dy)),
        });
      }
    },
    [zoomLevel]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full select-none text-[#e2e2ea] font-mono-tech animate-in fade-in duration-150">
      {/* ============================================================== */}
      {/* 1. TACTICAL 2D VECTOR MISSION MAP VIEWPORT                     */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col bg-[#06080d] rounded-xl border border-[#38bdf8]/30 shadow-2xl overflow-hidden relative min-h-[440px] lg:min-h-[520px]">
        {/* Top Header / Map Datum Bar */}
        <div className="px-3.5 py-2.5 bg-[#0a0d14]/95 border-b border-white/10 flex items-center justify-between text-xs shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
              {planet === 'moon'
                ? 'LUNAR EXPLORATION MAP // 1100M × 1100M MARE TRANQUILLITATIS'
                : 'MARS EXPLORATION MAP // 1100M × 1100M JEZERO SECTOR'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#87929a]">
            <span className="hidden sm:inline">ORIGIN: LANDING BASE (0, 0)</span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="text-[#38bdf8] font-bold">
              Visited {discoveredCount}/{mapArtifacts.length}
            </span>
          </div>
        </div>

        {/* Map Interactive Canvas Container with Drag-to-Pan and Wheel Zoom */}
        <div
          className={`relative flex-1 bg-[#05070c] overflow-hidden flex items-center justify-center p-1 sm:p-3 select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at center, rgba(56, 189, 248, 0.08) 0, transparent 70%),
                linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 30px 30px, 30px 30px',
            }}
          />

          {/* SVG Tactical Vector Map */}
          <div
            className="relative w-full max-w-[580px] aspect-square transition-transform duration-75"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transformOrigin: 'center center',
            }}
          >
            <svg
              viewBox={`0 0 ${SVG_VIEW_SIZE} ${SVG_VIEW_SIZE}`}
              className="w-full h-full drop-shadow-2xl overflow-visible pointer-events-auto"
            >
              <defs>
                {/* Background Radar Radial Falloff */}
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1a2536" stopOpacity="0.4" />
                  <stop offset="65%" stopColor="#0b0e14" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#05070c" stopOpacity="0.95" />
                </radialGradient>

                {/* Player FOV Vision Cone Gradient */}
                <radialGradient id="playerFov" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </radialGradient>

                {/* Base Safe Zone Gradient */}
                <radialGradient id="baseZone" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              {/* Map Domain Background Circle */}
              <circle
                cx={SVG_VIEW_SIZE / 2}
                cy={SVG_VIEW_SIZE / 2}
                r={USABLE_RADIUS}
                fill="url(#mapGlow)"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeOpacity="0.3"
              />

              {/* ======================================================== */}
              {/* TACTICAL CARTESIAN COORDINATE GRID (Every 100m)          */}
              {/* ======================================================== */}
              {[-400, -300, -200, -100, 100, 200, 300, 400].map((coordM) => {
                const vertSvg = worldToSvg(coordM, 0);
                const horizSvg = worldToSvg(0, coordM);
                const isMajor = coordM % 200 === 0;

                return (
                  <g key={`grid-${coordM}`}>
                    {/* Vertical grid line (Constant X, North-South) */}
                    <line
                      x1={vertSvg.cx}
                      y1={SVG_PADDING}
                      x2={vertSvg.cx}
                      y2={SVG_VIEW_SIZE - SVG_PADDING}
                      stroke="#38bdf8"
                      strokeWidth={isMajor ? 0.6 : 0.4}
                      strokeOpacity={isMajor ? 0.14 : 0.07}
                      strokeDasharray={isMajor ? '2 3' : '1 5'}
                    />
                    {/* Horizontal grid line (Constant Z, East-West) */}
                    <line
                      x1={SVG_PADDING}
                      y1={horizSvg.cy}
                      x2={SVG_VIEW_SIZE - SVG_PADDING}
                      y2={horizSvg.cy}
                      stroke="#38bdf8"
                      strokeWidth={isMajor ? 0.6 : 0.4}
                      strokeOpacity={isMajor ? 0.14 : 0.07}
                      strokeDasharray={isMajor ? '2 3' : '1 5'}
                    />
                    {/* Coordinate Axis Labels */}
                    {isMajor && (
                      <>
                        <text
                          x={vertSvg.cx}
                          y={SVG_VIEW_SIZE / 2 - 4}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="7"
                          fontFamily="monospace"
                          opacity="0.65"
                        >
                          {coordM > 0 ? `+${coordM}` : coordM}m
                        </text>
                        <text
                          x={SVG_VIEW_SIZE / 2 + 5}
                          y={horizSvg.cy + 3}
                          textAnchor="start"
                          fill="#64748b"
                          fontSize="7"
                          fontFamily="monospace"
                          opacity="0.65"
                        >
                          {coordM < 0 ? `N${Math.abs(coordM)}` : `S${coordM}`}m
                        </text>
                      </>
                    )}
                  </g>
                );
              })}

              {/* Concentric Range Rings from Base Clearing (100m, 200m, 300m, 400m, 500m) */}
              {[100, 200, 300, 400, 500].map((radiusM) => {
                const r = (radiusM / WORLD_HALF_SIZE) * USABLE_RADIUS;
                return (
                  <g key={`ring-${radiusM}`}>
                    <circle
                      cx={SVG_VIEW_SIZE / 2}
                      cy={SVG_VIEW_SIZE / 2}
                      r={r}
                      fill="none"
                      stroke="#475569"
                      strokeWidth="0.8"
                      strokeDasharray="4 6"
                      strokeOpacity="0.35"
                    />
                    {/* Ring Label along North axis */}
                    <text
                      x={SVG_VIEW_SIZE / 2 + 4}
                      y={SVG_VIEW_SIZE / 2 - r + 9}
                      fill="#64748b"
                      fontSize="8"
                      fontFamily="monospace"
                      opacity="0.75"
                    >
                      {radiusM}M
                    </text>
                  </g>
                );
              })}

              {/* Major Crosshair Axes through Base (0, 0) */}
              <line
                x1={SVG_VIEW_SIZE / 2}
                y1={SVG_PADDING}
                x2={SVG_VIEW_SIZE / 2}
                y2={SVG_VIEW_SIZE - SVG_PADDING}
                stroke="#38bdf8"
                strokeWidth="1.0"
                strokeOpacity="0.3"
                strokeDasharray="3 4"
              />
              <line
                x1={SVG_PADDING}
                y1={SVG_VIEW_SIZE / 2}
                x2={SVG_VIEW_SIZE - SVG_PADDING}
                y2={SVG_VIEW_SIZE / 2}
                stroke="#38bdf8"
                strokeWidth="1.0"
                strokeOpacity="0.3"
                strokeDasharray="3 4"
              />

              {/* ======================================================== */}
              {/* SUBTLE TOPOGRAPHICAL GEOLOGICAL CONTOURS (PER-PLANET)    */}
              {/* ======================================================== */}
              {planet === 'mars' && (
                <>
                  {/* Spirit Ridge Crater: (140, -180, r: 55m) */}
                  {(() => {
                    const p = worldToSvg(140, -180);
                    const r = (55 / WORLD_HALF_SIZE) * USABLE_RADIUS;
                    return (
                      <g>
                        <circle
                          cx={p.cx}
                          cy={p.cy}
                          r={r}
                          fill="#9a3412"
                          fillOpacity="0.05"
                          stroke="#9a3412"
                          strokeWidth="0.8"
                          strokeDasharray="3 4"
                          strokeOpacity="0.35"
                        />
                        <circle cx={p.cx} cy={p.cy} r={r * 0.65} fill="none" stroke="#9a3412" strokeWidth="0.5" strokeOpacity="0.2" />
                        <text x={p.cx} y={p.cy + 3} textAnchor="middle" fill="#9a3412" fontSize="6.5" opacity="0.5">CRATER A</text>
                      </g>
                    );
                  })()}

                  {/* Opportunity Crater: (-200, -160, r: 70m) */}
                  {(() => {
                    const p = worldToSvg(-200, -160);
                    const r = (70 / WORLD_HALF_SIZE) * USABLE_RADIUS;
                    return (
                      <g>
                        <circle
                          cx={p.cx}
                          cy={p.cy}
                          r={r}
                          fill="#9a3412"
                          fillOpacity="0.05"
                          stroke="#9a3412"
                          strokeWidth="0.8"
                          strokeDasharray="3 4"
                          strokeOpacity="0.35"
                        />
                        <circle cx={p.cx} cy={p.cy} r={r * 0.65} fill="none" stroke="#9a3412" strokeWidth="0.5" strokeOpacity="0.2" />
                        <text x={p.cx} y={p.cy + 3} textAnchor="middle" fill="#9a3412" fontSize="6.5" opacity="0.5">CRATER B</text>
                      </g>
                    );
                  })()}

                  {/* Phoenix Basin: (-180, 220, r: 58m) */}
                  {(() => {
                    const p = worldToSvg(-180, 220);
                    const r = (58 / WORLD_HALF_SIZE) * USABLE_RADIUS;
                    return (
                      <g>
                        <circle
                          cx={p.cx}
                          cy={p.cy}
                          r={r}
                          fill="#9a3412"
                          fillOpacity="0.05"
                          stroke="#9a3412"
                          strokeWidth="0.8"
                          strokeDasharray="3 4"
                          strokeOpacity="0.35"
                        />
                        <circle cx={p.cx} cy={p.cy} r={r * 0.65} fill="none" stroke="#9a3412" strokeWidth="0.5" strokeOpacity="0.2" />
                        <text x={p.cx} y={p.cy + 3} textAnchor="middle" fill="#9a3412" fontSize="6.5" opacity="0.5">BASIN C</text>
                      </g>
                    );
                  })()}

                  {/* InSight Plain Crater: (230, 170, r: 52m) */}
                  {(() => {
                    const p = worldToSvg(230, 170);
                    const r = (52 / WORLD_HALF_SIZE) * USABLE_RADIUS;
                    return (
                      <g>
                        <circle
                          cx={p.cx}
                          cy={p.cy}
                          r={r}
                          fill="#9a3412"
                          fillOpacity="0.05"
                          stroke="#9a3412"
                          strokeWidth="0.8"
                          strokeDasharray="3 4"
                          strokeOpacity="0.35"
                        />
                        <circle cx={p.cx} cy={p.cy} r={r * 0.65} fill="none" stroke="#9a3412" strokeWidth="0.5" strokeOpacity="0.2" />
                        <text x={p.cx} y={p.cy + 3} textAnchor="middle" fill="#9a3412" fontSize="6.5" opacity="0.5">CRATER D</text>
                      </g>
                    );
                  })()}

                  {/* Northern Rise / Curiosity Basin: (50, -340, r: 68m) */}
                  {(() => {
                    const p = worldToSvg(50, -340);
                    const r = (68 / WORLD_HALF_SIZE) * USABLE_RADIUS;
                    return (
                      <g>
                        <circle
                          cx={p.cx}
                          cy={p.cy}
                          r={r}
                          fill="#9a3412"
                          fillOpacity="0.05"
                          stroke="#9a3412"
                          strokeWidth="0.8"
                          strokeDasharray="3 4"
                          strokeOpacity="0.35"
                        />
                        <text x={p.cx} y={p.cy + 3} textAnchor="middle" fill="#9a3412" fontSize="6.5" opacity="0.5">NORTH RISE BASIN</text>
                      </g>
                    );
                  })()}

                  {/* Scattered Minor Craters */}
                  {[
                    { x: -75, z: -45, r: 22 },
                    { x: 85, z: -65, r: 24 },
                    { x: -110, z: 95, r: 26 },
                    { x: 125, z: 75, r: 20 },
                    { x: -280, z: 60, r: 38 },
                    { x: 290, z: -110, r: 42 },
                  ].map((c, i) => {
                    const pt = worldToSvg(c.x, c.z);
                    const rad = (c.r / WORLD_HALF_SIZE) * USABLE_RADIUS;
                    return (
                      <circle
                        key={`scat-${i}`}
                        cx={pt.cx}
                        cy={pt.cy}
                        r={rad}
                        fill="none"
                        stroke="#9a3412"
                        strokeWidth="0.5"
                        strokeDasharray="2 3"
                        strokeOpacity="0.2"
                      />
                    );
                  })}

                  {/* Mount Sharp / Northern Elevation Ridge Lines (Z < -300) */}
                  {(() => {
                    const z300Svg = worldToSvg(0, -300).cy;
                    const z400Svg = worldToSvg(0, -400).cy;
                    return (
                      <g stroke="#9a3412" strokeWidth="0.6" strokeDasharray="3 5" strokeOpacity="0.25">
                        <line x1={SVG_PADDING + 40} y1={z300Svg} x2={SVG_VIEW_SIZE - SVG_PADDING - 40} y2={z300Svg} />
                        <line x1={SVG_PADDING + 80} y1={z400Svg} x2={SVG_VIEW_SIZE - SVG_PADDING - 80} y2={z400Svg} />
                        <text
                          x={SVG_VIEW_SIZE / 2}
                          y={z400Svg + 12}
                          textAnchor="middle"
                          fill="#9a3412"
                          fontSize="7"
                          letterSpacing="1"
                          opacity="0.45"
                        >
                          MOUNT SHARP ELEVATION GRADIENT ▲
                        </text>
                      </g>
                    );
                  })()}
                </>
              )}

              {planet === 'moon' && (
                <>
                  {/* Lunar Named Craters (from moonTerrain.ts) */}
                  {[
                    { x: -160, z: -190, r: 60, label: 'WEST CRATER' },
                    { x: 180, z: -120, r: 52, label: 'SURVEYOR CRATER' },
                    { x: 250, z: 220, r: 48, label: 'SHORTY CRATER' },
                    { x: 140, z: 300, r: 75, label: 'CONE CRATER' },
                    { x: -90, z: -340, r: 45, label: 'FLAMSTEED RING' },
                  ].map((c) => {
                    const p = worldToSvg(c.x, c.z);
                    const rad = (c.r / WORLD_HALF_SIZE) * USABLE_RADIUS;
                    return (
                      <g key={c.label}>
                        <circle
                          cx={p.cx}
                          cy={p.cy}
                          r={rad}
                          fill="#64748b"
                          fillOpacity="0.06"
                          stroke="#94a3b8"
                          strokeWidth="0.8"
                          strokeDasharray="3 4"
                          strokeOpacity="0.3"
                        />
                        <circle cx={p.cx} cy={p.cy} r={rad * 0.65} fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeOpacity="0.18" />
                        <text x={p.cx} y={p.cy + 3} textAnchor="middle" fill="#94a3b8" fontSize="6.5" opacity="0.5">
                          {c.label}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* Base Clearing Rim: (0, 0, r: 45m) */}
              {(() => {
                const r = (45 / WORLD_HALF_SIZE) * USABLE_RADIUS;
                return (
                  <circle
                    cx={baseSvg.cx}
                    cy={baseSvg.cy}
                    r={r}
                    fill="url(#baseZone)"
                    stroke="#10b981"
                    strokeWidth="1.0"
                    strokeDasharray="3 3"
                    strokeOpacity="0.5"
                  />
                );
              })()}

              {/* Metric Boundary Labels on perimeter */}
              <text
                x={SVG_VIEW_SIZE / 2}
                y={SVG_PADDING - 14}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="11"
                fontWeight="bold"
                letterSpacing="1"
              >
                {planet === 'moon' ? '▲ LUNAR NORTH [000°] (-550M Z)' : '▲ MARTIAN NORTH [000°] (-550M Z)'}
              </text>

              <text
                x={SVG_VIEW_SIZE / 2}
                y={SVG_VIEW_SIZE - SVG_PADDING + 22}
                textAnchor="middle"
                fill="#87929a"
                fontSize="9"
                fontWeight="bold"
              >
                ▼ SOUTH [180°] (+550M Z)
              </text>

              <text
                x={SVG_PADDING - 6}
                y={SVG_VIEW_SIZE / 2 + 3}
                textAnchor="end"
                fill="#87929a"
                fontSize="9"
                fontWeight="bold"
              >
                WEST [-550M X]
              </text>

              <text
                x={SVG_VIEW_SIZE - SVG_PADDING + 6}
                y={SVG_VIEW_SIZE / 2 + 3}
                textAnchor="start"
                fill="#87929a"
                fontSize="9"
                fontWeight="bold"
              >
                EAST [+550M X]
              </text>

              {/* ======================================================== */}
              {/* EXPEDITION LANDING BASE AT (0, 0)                        */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  marsAudio.playComponentSelect();
                  setSelectedArtifactId(null);
                }}
              >
                {/* Base Habitat Octagon */}
                <polygon
                  points={`
                    ${baseSvg.cx - 7},${baseSvg.cy - 11}
                    ${baseSvg.cx + 7},${baseSvg.cy - 11}
                    ${baseSvg.cx + 11},${baseSvg.cy - 7}
                    ${baseSvg.cx + 11},${baseSvg.cy + 7}
                    ${baseSvg.cx + 7},${baseSvg.cy + 11}
                    ${baseSvg.cx - 7},${baseSvg.cy + 11}
                    ${baseSvg.cx - 11},${baseSvg.cy + 7}
                    ${baseSvg.cx - 11},${baseSvg.cy - 7}
                  `}
                  fill="#10b981"
                  fillOpacity="0.3"
                  stroke="#10b981"
                  strokeWidth="1.6"
                />
                {/* Solar array wings */}
                <line
                  x1={baseSvg.cx - 18}
                  y1={baseSvg.cy}
                  x2={baseSvg.cx - 11}
                  y2={baseSvg.cy}
                  stroke="#10b981"
                  strokeWidth="2.0"
                />
                <line
                  x1={baseSvg.cx + 11}
                  y1={baseSvg.cy}
                  x2={baseSvg.cx + 18}
                  y2={baseSvg.cy}
                  stroke="#10b981"
                  strokeWidth="2.0"
                />
                <circle cx={baseSvg.cx} cy={baseSvg.cy} r="3" fill="#10b981" />

                {/* Base Label */}
                <text
                  x={baseSvg.cx}
                  y={baseSvg.cy + 22}
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="8.5"
                  fontWeight="bold"
                  letterSpacing="0.5"
                >
                  EXPEDITION BASE (0, 0)
                </text>
              </g>

              {/* ======================================================== */}
              {/* NASA HISTORICAL ARTIFACT MARKERS (7 RELICS)             */}
              {/* ======================================================== */}
              {mapArtifacts.map((art) => {
                const pos = worldToSvg(art.worldPosition.x, art.worldPosition.z);
                const isSelected = selectedArtifactId === art.id;
                const isRover = art.type === 'rover';

                // Distance from player
                const dx = art.worldPosition.x - playerState.position.x;
                const dz = art.worldPosition.z - playerState.position.z;
                const dist = Math.hypot(dx, dz);

                const prog = missionProgress[art.id];
                const statusInfo = getArtifactPrimaryStatus(prog);
                const isDiscovered = Boolean(prog && prog.isDiscovered === true);

                // Undiscovered relics are not revealed on the map until discovered during surface EVA
                if (!isDiscovered) {
                  return null;
                }

                return (
                  <g
                    key={art.id}
                    className="cursor-pointer transition-transform duration-150"
                    onClick={(e) => {
                      e.stopPropagation();
                      marsAudio.playComponentSelect();
                      setSelectedArtifactId(art.id);
                    }}
                  >
                    {/* Pulsing selection bracket */}
                    {isSelected && (
                      <g>
                        <circle
                          cx={pos.cx}
                          cy={pos.cy}
                          r="17"
                          fill="none"
                          stroke={statusInfo.badgeColorHex}
                          strokeWidth="1.6"
                          strokeDasharray="4 3"
                          className="animate-spin"
                          style={{ animationDuration: '6s', transformOrigin: `${pos.cx}px ${pos.cy}px` }}
                        />
                        <rect
                          x={pos.cx - 14}
                          y={pos.cy - 14}
                          width="28"
                          height="28"
                          fill="none"
                          stroke={statusInfo.badgeColorHex}
                          strokeWidth="1.2"
                          strokeOpacity="0.9"
                        />
                      </g>
                    )}

                    {/* Artifact Marker Glyph: Scientifically distinctive rover / lander / helicopter symbols */}
                    {isRover ? (
                      // Rover chassis with rocker-bogie wheels
                      <g transform={`translate(${pos.cx}, ${pos.cy})`}>
                        <rect
                          x="-8"
                          y="-8"
                          width="16"
                          height="16"
                          fill={isDiscovered ? statusInfo.badgeColorHex : '#1e293b'}
                          fillOpacity={isDiscovered ? 0.25 : 0.4}
                          stroke={isDiscovered ? statusInfo.badgeColorHex : '#64748b'}
                          strokeWidth={isDiscovered ? 1.6 : 1.2}
                          strokeDasharray={isDiscovered ? undefined : '2.5 2'}
                          rx="2"
                        />
                        {/* Mast dot & wheel bars */}
                        <circle cx="0" cy="-2.5" r="2.2" fill={isDiscovered ? '#ffffff' : '#94a3b8'} />
                        <line
                          x1="-6"
                          y1="5.5"
                          x2="6"
                          y2="5.5"
                          stroke={isDiscovered ? statusInfo.badgeColorHex : '#64748b'}
                          strokeWidth="1.4"
                        />
                      </g>
                    ) : art.type === 'helicopter' ? (
                      // Aerial rotorcraft glyph
                      <g transform={`translate(${pos.cx}, ${pos.cy})`}>
                        <line
                          x1="-10"
                          y1="-3"
                          x2="10"
                          y2="-3"
                          stroke={isDiscovered ? statusInfo.badgeColorHex : '#64748b'}
                          strokeWidth="2.0"
                        />
                        <line
                          x1="-8"
                          y1="-5.5"
                          x2="8"
                          y2="-5.5"
                          stroke={isDiscovered ? statusInfo.badgeColorHex : '#64748b'}
                          strokeWidth="1.4"
                          strokeDasharray="2 1"
                        />
                        <rect
                          x="-4.5"
                          y="-1.5"
                          width="9"
                          height="9"
                          fill={isDiscovered ? statusInfo.badgeColorHex : '#1e293b'}
                          fillOpacity={isDiscovered ? 0.3 : 0.4}
                          stroke={isDiscovered ? statusInfo.badgeColorHex : '#64748b'}
                          strokeWidth={isDiscovered ? 1.4 : 1.1}
                          strokeDasharray={isDiscovered ? undefined : '2 2'}
                          rx="1.5"
                        />
                        <line
                          x1="-6.5"
                          y1="7.5"
                          x2="6.5"
                          y2="7.5"
                          stroke={isDiscovered ? statusInfo.badgeColorHex : '#64748b'}
                          strokeWidth="1.4"
                        />
                        <circle cx="0" cy="3" r="1.8" fill={isDiscovered ? '#ffffff' : '#94a3b8'} />
                      </g>
                    ) : (
                      // Stationary lander tripod
                      <g transform={`translate(${pos.cx}, ${pos.cy})`}>
                        <polygon
                          points="0,-9 8,6 -8,6"
                          fill={isDiscovered ? statusInfo.badgeColorHex : '#1e293b'}
                          fillOpacity={isDiscovered ? 0.25 : 0.4}
                          stroke={isDiscovered ? statusInfo.badgeColorHex : '#64748b'}
                          strokeWidth={isDiscovered ? 1.6 : 1.2}
                          strokeDasharray={isDiscovered ? undefined : '2.5 2'}
                        />
                        <circle cx="0" cy="0" r="2.5" fill={isDiscovered ? '#ffffff' : '#94a3b8'} />
                      </g>
                    )}

                    {/* Scientific Label Tag */}
                    <g transform={`translate(${pos.cx}, ${pos.cy - 18})`}>
                      <rect
                        x="-54"
                        y="-10"
                        width="108"
                        height="14"
                        rx="2"
                        fill="#0b0e14"
                        fillOpacity="0.92"
                        stroke={isSelected ? '#ffffff' : isDiscovered ? statusInfo.badgeColorHex : '#475569'}
                        strokeWidth={isDiscovered ? 0.9 : 0.7}
                        strokeDasharray={isDiscovered ? undefined : '2 2'}
                      />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        fill={isSelected ? '#ffffff' : isDiscovered ? statusInfo.badgeColorHex : '#94a3b8'}
                        fontSize="7.2"
                        fontWeight="bold"
                        letterSpacing="0.4"
                      >
                        {art.name.toUpperCase()} {isDiscovered ? `[${dist.toFixed(0)}M]` : '• UNDISCOVERED'}
                      </text>
                    </g>

                    {/* IN-MAP TACTICAL CALLOUT WHEN SELECTED */}
                    {isSelected && (
                      <g
                        transform={`translate(${pos.cx}, ${pos.cy - 44})`}
                        className="pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                      >
                        <rect
                          x="-68"
                          y="-20"
                          width="136"
                          height="28"
                          rx="4"
                          fill="#070a10"
                          fillOpacity="0.96"
                          stroke={statusInfo.badgeColorHex}
                          strokeWidth="1.3"
                          filter="drop-shadow(0 4px 8px rgba(0,0,0,0.8))"
                        />
                        <text
                          x="0"
                          y="-8"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="bold"
                          letterSpacing="0.4"
                        >
                          {art.designation}
                        </text>
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill={statusInfo.badgeColorHex}
                          fontSize="7.5"
                          fontWeight="bold"
                          letterSpacing="0.8"
                        >
                          STATUS: {statusInfo.status}
                        </text>
                        {/* Downward indicator pointer */}
                        <polygon
                          points="0,11 -4,8 4,8"
                          fill={statusInfo.badgeColorHex}
                        />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ======================================================== */}
              {/* CURRENT PLAYER ASTRONAUT POSITION (ARES EVA)             */}
              {/* ======================================================== */}
              <g transform={`translate(${playerSvg.cx}, ${playerSvg.cy})`}>
                {/* Field-of-View Cone aligned with player's compass heading */}
                {/* Heading 0° is North (pointing up / -Z) */}
                <g transform={`rotate(${playerState.headingDeg})`}>
                  <path
                    d="M 0 0 L -22 -48 A 54 54 0 0 1 22 -48 Z"
                    fill="url(#playerFov)"
                    stroke="#38bdf8"
                    strokeWidth="0.8"
                    strokeOpacity="0.5"
                  />
                  {/* Heading Vector Arrow */}
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="-32"
                    stroke="#38bdf8"
                    strokeWidth="2.0"
                  />
                  <polygon points="0,-36 -4,-28 4,-28" fill="#38bdf8" />
                </g>

                {/* Astronaut Location Beacon with pulsing halo */}
                <circle
                  cx="0"
                  cy="0"
                  r="12"
                  fill="#38bdf8"
                  fillOpacity="0.15"
                  className="animate-ping"
                  style={{ animationDuration: '3s' }}
                />
                <circle
                  cx="0"
                  cy="0"
                  r="7.5"
                  fill="#38bdf8"
                  fillOpacity="0.3"
                  stroke="#38bdf8"
                  strokeWidth="2.0"
                />
                <circle cx="0" cy="0" r="3.2" fill="#ffffff" />

                {/* Astronaut Tag */}
                <g transform="translate(0, 18)">
                  <rect
                    x="-38"
                    y="-9"
                    width="76"
                    height="13"
                    rx="2"
                    fill="#070a10"
                    fillOpacity="0.9"
                    stroke="#38bdf8"
                    strokeWidth="0.9"
                  />
                  <text
                    x="0"
                    y="-1"
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="7"
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    {planet === 'moon' ? 'ARTEMIS EVA (YOU)' : 'ARES EVA (YOU)'}
                  </text>
                </g>
              </g>
            </svg>
          </div>

          {/* Interactive Navigation Control Buttons in Bottom-Left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-20 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-1.5 rounded-lg bg-[#111622]/90 hover:bg-[#1b2336] text-[#bdc8d1] hover:text-white border border-white/10 transition-colors shadow-lg cursor-pointer active:scale-95"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-1.5 rounded-lg bg-[#111622]/90 hover:bg-[#1b2336] text-[#bdc8d1] hover:text-white border border-white/10 transition-colors shadow-lg cursor-pointer active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetView();
              }}
              className="px-2 py-1 rounded-lg bg-[#111622]/90 hover:bg-[#1b2336] text-[10px] text-[#bdc8d1] hover:text-white border border-white/10 transition-colors shadow-lg cursor-pointer active:scale-95 font-bold"
              title="Reset View (100%)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCenterOnPlayer();
              }}
              className="px-2 py-1 rounded-lg bg-[#111622]/90 hover:bg-[#1b2336] text-[10px] text-[#38bdf8] hover:text-white border border-[#38bdf8]/40 transition-colors shadow-lg flex items-center gap-1 cursor-pointer active:scale-95 font-bold"
              title="Center on Astronaut"
            >
              <Navigation size={11} />
              <span>TRACK EVA</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCenterOnBase();
              }}
              className="px-2 py-1 rounded-lg bg-[#111622]/90 hover:bg-[#1b2336] text-[10px] text-[#10b981] hover:text-white border border-[#10b981]/40 transition-colors shadow-lg flex items-center gap-1 cursor-pointer active:scale-95 font-bold"
              title="Center on Base Clearing"
            >
              <MapPin size={11} />
              <span>BASE</span>
            </button>
          </div>

          {/* Tactical NASA Compass Rose in Top-Right */}
          <div className="absolute top-3 right-3 bg-[#070a0f]/90 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex items-center gap-2.5 text-[10px] shadow-xl pointer-events-none">
            {/* Compass Rose Reticle */}
            <div className="relative w-9 h-9 flex items-center justify-center rounded-full border border-white/10 bg-[#0d121c]">
              {/* North Pointer Marker */}
              <span className="absolute -top-1 text-[8px] font-bold text-[#38bdf8]">N</span>
              <span className="absolute -bottom-0.5 text-[7px] text-[#87929a]">S</span>
              <span className="absolute -left-0.5 text-[7px] text-[#87929a]">W</span>
              <span className="absolute -right-0.5 text-[7px] text-[#87929a]">E</span>
              {/* Rotating Heading Needle */}
              <div
                className="w-0.5 h-6 bg-gradient-to-t from-transparent via-[#38bdf8] to-[#38bdf8] rounded-full transition-transform duration-100"
                style={{
                  transform: `rotate(${playerState.headingDeg}deg)`,
                  transformOrigin: 'center center',
                }}
              />
              <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-[9px] text-[#87929a] font-bold uppercase tracking-wider">
                COMPASS BEARING
              </span>
              <span className="text-xs font-bold text-white font-mono-tech">
                {Math.round(playerState.headingDeg).toString().padStart(3, '0')}°{' '}
                <span className="text-[#38bdf8]">{getCompassDirection(playerState.headingDeg)}</span>
              </span>
              <span className="text-[9px] text-[#87929a] font-mono-tech">
                X: {playerState.position.x >= 0 ? '+' : ''}{playerState.position.x.toFixed(0)}m | Z:{' '}
                {playerState.position.z >= 0 ? '+' : ''}{playerState.position.z.toFixed(0)}m
              </span>
            </div>
          </div>

          {/* Interactive Drag & Zoom Tip */}
          <div className="absolute top-3 left-3 bg-[#070a0f]/80 backdrop-blur-xs border border-white/5 rounded-lg px-2.5 py-1 text-[9px] text-[#87929a] pointer-events-none hidden sm:block">
            <span className="text-white font-bold">DRAG</span> to pan •{' '}
            <span className="text-white font-bold">SCROLL</span> to zoom
          </div>
        </div>

        {/* Bottom Legend Footer */}
        <div className="px-3 py-2 bg-[#090c12]/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#87929a] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
              <strong className="text-white">{planet === 'moon' ? 'ARTEMIS EVA:' : 'ARES EVA:'}</strong> ({playerState.position.x.toFixed(0)}m,{' '}
              {playerState.position.z.toFixed(0)}m)
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
              <strong className="text-[#10b981]">BASE:</strong> (0, 0) [
              {playerState.distanceFromStart.toFixed(0)}m away]
            </span>
          </div>

          <div className="text-[9px] text-[#64748b]">
            * Select any NASA artifact marker or roster site to lock directional telemetry & scan data
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SIDEBAR: DISCOVERY ROSTER & TARGET TELEMETRY INSPECTOR       */}
      {/* ============================================================== */}
      <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
        {/* NASA RELICS ROSTER */}
        <div className="bg-[#0b0e17]/95 rounded-xl border border-white/10 p-3.5 shadow-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
            <span className="font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <Layers size={13} className="text-[#38bdf8]" />
              NASA HISTORICAL SITES
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#bdc8d1]">
              Visited {discoveredCount}/{mapArtifacts.length}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[175px] overflow-y-auto pr-1">
            {mapArtifacts.map((art) => {
              const isSelected = selectedArtifactId === art.id;
              const dx = art.worldPosition.x - playerState.position.x;
              const dz = art.worldPosition.z - playerState.position.z;
              const dist = Math.hypot(dx, dz);
              const angleRad = Math.atan2(dx, -dz);
              const bearingDeg = ((angleRad * 180) / Math.PI + 360) % 360;
              const bearingStr = `${Math.round(bearingDeg).toString().padStart(3, '0')}° ${getCompassDirection(bearingDeg)}`;

              const prog = missionProgress[art.id];
              const statusInfo = getArtifactPrimaryStatus(prog);
              const isDiscovered = Boolean(prog && prog.isDiscovered === true);

              return (
                <button
                  key={art.id}
                  onClick={() => {
                    marsAudio.playComponentSelect();
                    setSelectedArtifactId(art.id);
                  }}
                  className={`w-full p-2 rounded-lg text-left transition-all text-xs flex items-center justify-between border cursor-pointer ${
                    isSelected
                      ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-white shadow-md'
                      : isDiscovered
                      ? 'bg-[#0f1420]/75 hover:bg-[#151c2c] border-white/10 text-[#cbd5e1] hover:text-white'
                      : 'bg-[#090c12]/50 hover:bg-[#0f1420] border-white/5 text-[#87929a] hover:text-[#cbd5e1]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] text-white flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: statusInfo.badgeColorHex }}
                      />
                      {art.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[8.5px] px-1 py-0.2 rounded border font-bold ${statusInfo.badgeBg} ${statusInfo.badgeBorder} ${statusInfo.badgeText}`}
                      >
                        {statusInfo.status}
                      </span>
                      <span className="text-[9px] text-[#87929a]">
                        {art.type === 'rover' ? 'Rover' : art.type === 'helicopter' ? 'Helicopter' : 'Lander'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-[10px] text-[#38bdf8] block">
                      {isDiscovered ? `${dist.toFixed(0)}M` : '---'}
                    </span>
                    <span className="text-[9px] text-[#87929a]">
                      {isDiscovered ? bearingStr : 'UNRESOLVED'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SELECTED TARGET TELEMETRY INSPECTOR */}
        <div className="bg-[#0b0e17]/95 rounded-xl border border-[#38bdf8]/30 p-3.5 shadow-xl flex-1 flex flex-col justify-between gap-3">
          {selectedArtifact && selectedTelemetry ? (
            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="pb-2 border-b border-white/10">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold mb-1">
                  <span className={selectedTelemetry.statusInfo.isDiscovered ? 'text-[#38bdf8]' : 'text-[#87929a]'}>
                    {selectedTelemetry.statusInfo.isDiscovered ? 'DISCOVERED SITE TELEMETRY' : 'ANOMALY VECTOR TELEMETRY'}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${selectedTelemetry.statusInfo.badgeBg} ${selectedTelemetry.statusInfo.badgeBorder} ${selectedTelemetry.statusInfo.badgeText}`}>
                    {selectedArtifact.type === 'rover' ? 'SURFACE ROVER' : selectedArtifact.type === 'helicopter' ? 'MARS HELICOPTER' : 'STATIONARY LANDER'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  {selectedArtifact.name} ({selectedArtifact.designation})
                </h3>
                <span className="text-[10px] text-[#87929a]">
                  {selectedArtifact.historical.agency} • {selectedArtifact.site}
                </span>

                {/* Prominent Primary Status Banner */}
                <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-[#0e131d] border border-white/10">
                  <span className="text-[10px] text-[#87929a] font-bold uppercase">MISSION STATUS:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${selectedTelemetry.statusInfo.badgeBg} ${selectedTelemetry.statusInfo.badgeBorder} ${selectedTelemetry.statusInfo.badgeText}`}
                  >
                    {selectedTelemetry.statusInfo.status}
                  </span>
                </div>
              </div>

              {/* 4-Stage Milestone Progression Breakdown */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {/* 1. Discovered */}
                <div className="p-1.5 rounded bg-[#0e131d] border border-white/5 flex items-center gap-1.5">
                  <CheckCircle
                    size={12}
                    className={`shrink-0 ${
                      selectedTelemetry.progress.isDiscovered ? 'text-[#10b981]' : 'text-[#64748b]'
                    }`}
                  />
                  <div className="flex flex-col leading-tight">
                    <span
                      className={`font-bold ${
                        selectedTelemetry.progress.isDiscovered ? 'text-[#10b981]' : 'text-[#64748b]'
                      }`}
                    >
                      1. DISCOVERED
                    </span>
                    <span className="text-[8.5px] text-[#87929a]">
                      {selectedTelemetry.progress.isDiscovered
                        ? selectedTelemetry.progress.discoveredAt || 'Confirmed'
                        : 'Pending Approach'}
                    </span>
                  </div>
                </div>

                {/* 2. Documented */}
                <div className="p-1.5 rounded bg-[#0e131d] border border-white/5 flex items-center gap-1.5">
                  <CheckCircle
                    size={12}
                    className={`shrink-0 ${
                      selectedTelemetry.progress.isDocumented ? 'text-[#f59e0b]' : 'text-[#64748b]'
                    }`}
                  />
                  <div className="flex flex-col leading-tight">
                    <span
                      className={`font-bold ${
                        selectedTelemetry.progress.isDocumented ? 'text-[#f59e0b]' : 'text-[#64748b]'
                      }`}
                    >
                      2. DOCUMENTED
                    </span>
                    <span className="text-[8.5px] text-[#87929a]">
                      {selectedTelemetry.progress.isDocumented
                        ? selectedTelemetry.progress.documentedAt || 'Completed'
                        : 'Pending EVA'}
                    </span>
                  </div>
                </div>

                {/* 3. Transmitted */}
                <div className="p-1.5 rounded bg-[#0e131d] border border-white/5 flex items-center gap-1.5">
                  <CheckCircle
                    size={12}
                    className={`shrink-0 ${
                      selectedTelemetry.progress.isTransmitted ? 'text-[#a855f7]' : 'text-[#64748b]'
                    }`}
                  />
                  <div className="flex flex-col leading-tight">
                    <span
                      className={`font-bold ${
                        selectedTelemetry.progress.isTransmitted ? 'text-[#a855f7]' : 'text-[#64748b]'
                      }`}
                    >
                      3. TRANSMITTED
                    </span>
                    <span className="text-[8.5px] text-[#87929a]">
                      {selectedTelemetry.progress.isTransmitted
                        ? selectedTelemetry.progress.transmittedAt || 'Earth Uplink'
                        : 'Pending Link'}
                    </span>
                  </div>
                </div>

                {/* 4. Archived */}
                <div className="p-1.5 rounded bg-[#0e131d] border border-white/5 flex items-center gap-1.5">
                  <CheckCircle
                    size={12}
                    className={`shrink-0 ${
                      selectedTelemetry.progress.isArchived ? 'text-[#10b981]' : 'text-[#64748b]'
                    }`}
                  />
                  <div className="flex flex-col leading-tight">
                    <span
                      className={`font-bold ${
                        selectedTelemetry.progress.isArchived ? 'text-[#10b981]' : 'text-[#64748b]'
                      }`}
                    >
                      4. ARCHIVED
                    </span>
                    <span className="text-[8.5px] text-[#87929a]">
                      {selectedTelemetry.progress.isArchived
                        ? selectedTelemetry.progress.archivedAt || 'PDS Logged'
                        : 'Unarchived'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Real-Time Vectors */}
              <div className="p-2.5 rounded-lg bg-[#0e131d] border border-white/5 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-white/5 text-[10px] text-[#87929a] font-bold uppercase">
                  <span>LIVE RELATIVE NAVIGATION</span>
                  <span className="text-[#38bdf8]">FROM ACTIVE EVA</span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-[#87929a]">Surface Distance:</span>
                  <span className="text-white font-bold">{selectedTelemetry.distance.toFixed(1)} M</span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-[#87929a]">Compass Bearing:</span>
                  <span className="text-[#38bdf8] font-bold">{selectedTelemetry.bearingStr}</span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-[#87929a]">Relative Vector:</span>
                  <span className="text-[#f59e0b] font-bold">{selectedTelemetry.relStr}</span>
                </div>
              </div>

              {/* World Coordinates vs Historical NASA Archive */}
              <div className="p-2.5 rounded-lg bg-[#0e131d] border border-white/5 flex flex-col gap-1.5 text-[11px]">
                <div className="text-[9px] text-[#87929a] uppercase font-bold tracking-wider">
                  COORDINATE BREAKDOWN
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#38bdf8] font-bold">
                    SIMULATED GAME-WORLD POSITION:
                  </span>
                  <span className="text-white font-mono-tech text-[10px]">
                    X: {selectedArtifact.worldPosition.x >= 0 ? '+' : ''}
                    {selectedArtifact.worldPosition.x.toFixed(1)}m | Z:{' '}
                    {selectedArtifact.worldPosition.z >= 0 ? '+' : ''}
                    {selectedArtifact.worldPosition.z.toFixed(1)}m | Elev:{' '}
                    +{selectedArtifact.worldPosition.y.toFixed(1)}m
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 pt-1.5 border-t border-white/5">
                  <span className="text-[10px] text-[#cbd5e1] font-bold">
                    AUTHENTIC NASA PDS ARCHIVE ({planet === 'moon' ? 'REAL MOON' : 'REAL MARS'}):
                  </span>
                  <span className="text-[#87929a] text-[10px]">
                    {selectedArtifact.historical.realCoordinates} ({selectedArtifact.historical.landingSite})
                  </span>
                </div>
              </div>

              {/* Action to switch to Archive Tab */}
              {onSwitchToArchiveTab && (
                <button
                  disabled={!selectedTelemetry.progress.isDiscovered}
                  onClick={() => {
                    if (selectedTelemetry.progress.isDiscovered) {
                      onSwitchToArchiveTab(selectedArtifact.id);
                    }
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                    selectedTelemetry.progress.isDiscovered
                      ? 'bg-[#182338] hover:bg-[#25324d] text-[#38bdf8] border-[#38bdf8]/40 hover:border-[#38bdf8] cursor-pointer shadow-md active:scale-95'
                      : 'bg-white/5 border-white/10 text-[#64748b] cursor-not-allowed opacity-60'
                  }`}
                >
                  <Database size={13} />
                  <span>
                    {selectedTelemetry.progress.isDiscovered
                      ? 'VIEW FULL PDS ARCHIVE DOSSIER'
                      : 'DOSSIER LOCKED — APPROACH TO DISCOVER'}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 my-auto gap-2 text-[#87929a]">
              <Crosshair size={28} className="text-[#38bdf8]/40" />
              <div className="text-xs font-bold text-white uppercase">NO SITE SELECTED</div>
              <p className="text-[11px] leading-relaxed max-w-xs">
                Click any discovered artifact marker on the vector map or choose from the discovered
                hardware roster above to view real-time distance, bearing, status, and coordinates.
              </p>
            </div>
          )}

          {/* Expedition Landing Base Quick Status */}
          <div className="p-2.5 rounded-lg bg-[#07090e] border border-white/5 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-[#10b981]">
              <MapPin size={12} />
              <span className="font-bold">BASE CLEARING STATUS</span>
            </div>
            <span className="text-[#87929a]">
              {playerState.distanceFromStart.toFixed(0)}M //{' '}
              {Math.round(playerState.baseBearingDeg ?? 180).toString().padStart(3, '0')}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
