/**
 * Interactive 3D Rover Inspection Component.
 * Renders mission-specific 3D NASA rover models with raycast hover highlights,
 * floating tooltips, orbital controls, and component inspection panels.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Sparkles,
  CheckCircle,
  Eye,
  Radio,
  Layers,
  ChevronRight,
  Maximize2,
  Minimize2,
  Compass,
  Cpu,
  Info,
} from 'lucide-react';
import { createRoverInspection3D, RoverInspectionModel } from '../mars/roverInspectionModels';
import {
  getRoverInspectionProfile,
  RoverComponentData,
  RoverInspectionProfile,
} from '../data/roverInspectionData';
import { marsAudio } from '../mars/audio';

interface RoverInspectionViewerProps {
  artifactId: string;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string) => void;
}

export const RoverInspectionViewer: React.FC<RoverInspectionViewerProps> = ({
  artifactId,
  selectedComponentId,
  onSelectComponent,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const profile: RoverInspectionProfile | null = getRoverInspectionProfile(artifactId);

  // Fallback profile if artifact is not a rover
  const activeProfile = profile || {
    roverId: artifactId,
    roverName: 'Spacecraft Architecture',
    missionName: 'NASA Planetary Mission',
    agency: 'NASA / JPL',
    architecture: 'In-Situ Surface System',
    scaleNote: 'Standard NASA Exploration Payload',
    defaultComponentId: 'rover_body',
    components: [],
  };

  const [activeCompId, setActiveCompId] = useState<string>(
    selectedComponentId || activeProfile.defaultComponentId || 'pancam'
  );

  // Sync internal state when external selectedComponentId changes
  useEffect(() => {
    if (selectedComponentId) {
      setActiveCompId(selectedComponentId);
    }
  }, [selectedComponentId]);

  // Hover state for 3D raycasting
  const [hoveredComponent, setHoveredComponent] = useState<{
    id: string;
    name: string;
    shortDesc: string;
    x: number;
    y: number;
  } | null>(null);

  // Category filter for component browser list
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<RoverInspectionModel | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Orbit camera state
  const orbitState = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    theta: Math.PI * 0.25, // azimuth angle
    phi: Math.PI * 0.22,   // elevation angle
    radius: 3.8,           // distance from center
    target: new THREE.Vector3(0, 0, 0),
    desiredTarget: new THREE.Vector3(0, 0, 0),
    desiredRadius: 3.8,
  });

  // Reset Camera View Handler
  const resetCamera = useCallback(() => {
    marsAudio.playComponentSelect();
    orbitState.current.theta = Math.PI * 0.25;
    orbitState.current.phi = Math.PI * 0.22;
    orbitState.current.desiredRadius = 3.8;
    orbitState.current.desiredTarget.set(0, 0, 0);
  }, []);

  // Quick preset camera angles
  const setCameraAngle = useCallback((theta: number, phi: number) => {
    marsAudio.playComponentSelect();
    orbitState.current.theta = theta;
    orbitState.current.phi = phi;
  }, []);

  // Select component handler
  const handleSelectComponent = useCallback(
    (compId: string) => {
      marsAudio.playComponentSelect();
      setActiveCompId(compId);
      onSelectComponent(compId);

      // Focus camera slightly toward the component if found
      if (modelRef.current) {
        const center = modelRef.current.getComponentCenter(compId);
        if (center) {
          orbitState.current.desiredTarget.copy(center).multiplyScalar(0.4);
          orbitState.current.desiredRadius = 3.2;
        }
      }
    },
    [onSelectComponent]
  );

  // Update 3D highlight when activeCompId changes
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.highlightComponent(activeCompId);
    }
  }, [activeCompId]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Subtle dark gradient background
    scene.background = new THREE.Color('#080b12');

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting: Realistic Martian ambient + directional key light
    const ambientLight = new THREE.AmbientLight(new THREE.Color('#8fa4b8'), 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(new THREE.Color('#ffeedd'), 2.2);
    sunLight.position.set(5, 8, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(new THREE.Color('#38bdf8'), 0.85);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    const bottomRimLight = new THREE.DirectionalLight(new THREE.Color('#c25d2c'), 0.45);
    bottomRimLight.position.set(0, -4, 0);
    scene.add(bottomRimLight);

    // 5. Circular Presentation Pedestal on Mars Bedrock
    const pedestalGroup = new THREE.Group();
    const pedestalGeo = new THREE.CylinderGeometry(2.4, 2.5, 0.08, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#10141e'),
      metalness: 0.65,
      roughness: 0.45,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = -0.72;
    pedestalMesh.receiveShadow = true;
    pedestalGroup.add(pedestalMesh);

    // Subtle cyan ring accent on pedestal
    const ringGeo = new THREE.RingGeometry(2.35, 2.38, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#38bdf8'), opacity: 0.4, transparent: true });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -0.678;
    pedestalGroup.add(ringMesh);

    // Reticle cross markings
    const gridHelper = new THREE.GridHelper(4.5, 12, '#38bdf8', '#1c2b3e');
    gridHelper.position.y = -0.677;
    (gridHelper.material as THREE.Material).opacity = 0.18;
    (gridHelper.material as THREE.Material).transparent = true;
    pedestalGroup.add(gridHelper);

    scene.add(pedestalGroup);

    // 6. Build the 3D Rover Model
    const roverModel = createRoverInspection3D(artifactId);
    modelRef.current = roverModel;
    scene.add(roverModel.group);

    // Initial highlight
    roverModel.highlightComponent(activeCompId);

    // 7. Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Mouse Event Handlers
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        orbitState.current.isDragging = true;
        orbitState.current.prevMouseX = e.clientX;
        orbitState.current.prevMouseY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();

      // Handle drag rotation
      if (orbitState.current.isDragging) {
        const deltaX = e.clientX - orbitState.current.prevMouseX;
        const deltaY = e.clientY - orbitState.current.prevMouseY;
        orbitState.current.prevMouseX = e.clientX;
        orbitState.current.prevMouseY = e.clientY;

        orbitState.current.theta -= deltaX * 0.008;
        orbitState.current.phi = Math.max(0.05, Math.min(Math.PI * 0.45, orbitState.current.phi - deltaY * 0.008));
        return;
      }

      // Handle raycast hovering over 3D components
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(roverModel.interactiveParts, true);

      if (intersects.length > 0) {
        let topMesh: THREE.Mesh | null = null;
        for (const hit of intersects) {
          if (hit.object.userData?.componentId) {
            topMesh = hit.object as THREE.Mesh;
            break;
          }
        }

        if (topMesh && topMesh.userData.componentId) {
          const compId = topMesh.userData.componentId;
          const compName = topMesh.userData.componentName || compId;
          const found = activeProfile.components.find((c) => c.id === compId);

          setHoveredComponent({
            id: compId,
            name: found ? found.name : compName,
            shortDesc: found ? found.shortDescription : 'Inspect physical mission hardware.',
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });

          renderer.domElement.style.cursor = 'pointer';
          roverModel.highlightComponent(compId);
          return;
        }
      }

      // Not hovering interactive component
      setHoveredComponent(null);
      renderer.domElement.style.cursor = orbitState.current.isDragging ? 'grabbing' : 'grab';
      // Restore active selection highlight
      roverModel.highlightComponent(activeCompId);
    };

    const handleMouseUp = () => {
      orbitState.current.isDragging = false;
      renderer.domElement.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.0025;
      orbitState.current.desiredRadius = Math.max(1.8, Math.min(7.5, orbitState.current.desiredRadius + zoomFactor));
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(roverModel.interactiveParts, true);

      if (intersects.length > 0) {
        for (const hit of intersects) {
          if (hit.object.userData?.componentId) {
            handleSelectComponent(hit.object.userData.componentId);
            break;
          }
        }
      }
    };

    // Touch support for mobile / tablets
    let touchStartX = 0;
    let touchStartY = 0;
    let initialPinchDist = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        orbitState.current.isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && orbitState.current.isDragging) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        orbitState.current.theta -= deltaX * 0.01;
        orbitState.current.phi = Math.max(0.05, Math.min(Math.PI * 0.45, orbitState.current.phi - deltaY * 0.01));
      } else if (e.touches.length === 2 && initialPinchDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = (initialPinchDist - currentDist) * 0.01;
        initialPinchDist = currentDist;
        orbitState.current.desiredRadius = Math.max(1.8, Math.min(7.5, orbitState.current.desiredRadius + diff));
      }
    };

    const handleTouchEnd = () => {
      orbitState.current.isDragging = false;
      initialPinchDist = 0;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('click', handleClick);
    domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    domElement.addEventListener('touchend', handleTouchEnd);

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    // 9. Animation Loop with smooth spherical camera interpolation
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth camera interpolation
      const os = orbitState.current;
      os.radius += (os.desiredRadius - os.radius) * 0.1;
      os.target.lerp(os.desiredTarget, 0.08);

      const sinPhi = Math.sin(os.phi);
      const cosPhi = Math.cos(os.phi);
      const sinTheta = Math.sin(os.theta);
      const cosTheta = Math.cos(os.theta);

      camera.position.x = os.target.x + os.radius * sinPhi * sinTheta;
      camera.position.y = os.target.y + os.radius * cosPhi;
      camera.position.z = os.target.z + os.radius * sinPhi * cosTheta;
      camera.lookAt(os.target);

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();

      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('click', handleClick);
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);

      roverModel.dispose();
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [artifactId, handleSelectComponent, activeProfile]);

  // Lookup the currently selected component
  const selectedComponent: RoverComponentData =
    activeProfile.components.find((c) => c.id === activeCompId) ||
    activeProfile.components[0] || {
      id: 'rover_body',
      name: 'Primary Rover System',
      category: 'structure',
      shortDescription: 'Core spacecraft hardware.',
      location: 'Central flight assembly',
      primaryFunction: 'In-situ exploration operations.',
      verifiedNasaFact: 'Engineered by NASA Jet Propulsion Laboratory to survive the extreme Martian surface environment.',
      simulatedFieldCondition: 'Surface exposed to Martian regolith and diurnal thermal swings.',
    };

  // Filter components for browser list
  const filteredComponents = activeProfile.components.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 select-none">
      {/* ============================================================== */}
      {/* LEFT / MAIN AREA: LARGE INTERACTIVE 3D ROVER VIEWPORT           */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-h-[360px] lg:min-h-0 bg-[#07090f] rounded-xl border border-[#38bdf8]/30 overflow-hidden relative shadow-2xl">
        {/* Upper Viewport HUD Bar */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 bg-[#070a0f]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="text-[10px] font-bold text-[#38bdf8] tracking-widest uppercase">
              INTERACTIVE 3D EXPLORATION VIEW // NASA JPL CAD MODEL
            </span>
          </div>

          {/* Preset Camera Angle Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto bg-[#070a0f]/80 backdrop-blur-md p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setCameraAngle(0, Math.PI * 0.22)}
              className="px-2 py-0.5 text-[9px] font-bold rounded bg-white/5 hover:bg-[#38bdf8]/20 text-[#87929a] hover:text-white transition-colors cursor-pointer"
              title="Front View"
            >
              FRONT
            </button>
            <button
              onClick={() => setCameraAngle(Math.PI * 0.5, Math.PI * 0.22)}
              className="px-2 py-0.5 text-[9px] font-bold rounded bg-white/5 hover:bg-[#38bdf8]/20 text-[#87929a] hover:text-white transition-colors cursor-pointer"
              title="Side View"
            >
              SIDE
            </button>
            <button
              onClick={() => setCameraAngle(Math.PI * 0.25, 0.1)}
              className="px-2 py-0.5 text-[9px] font-bold rounded bg-white/5 hover:bg-[#38bdf8]/20 text-[#87929a] hover:text-white transition-colors cursor-pointer"
              title="Top View"
            >
              TOP
            </button>
            <button
              onClick={resetCamera}
              className="p-1 rounded bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-bold px-2"
              title="Reset View"
            >
              <RotateCcw size={11} />
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* 3D Canvas Mount Point */}
        <div ref={mountRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing outline-none" />

        {/* Floating Tooltip upon Hovering Component */}
        {hoveredComponent && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 bg-[#070a0f]/95 backdrop-blur-md rounded-lg border border-[#38bdf8] shadow-2xl animate-in fade-in duration-100 max-w-[260px]"
            style={{
              left: `${Math.max(140, Math.min(hoveredComponent.x, (mountRef.current?.clientWidth || 500) - 140))}px`,
              top: `${Math.max(60, hoveredComponent.y)}px`,
            }}
          >
            <div className="flex items-center gap-1.5 text-[9px] text-[#38bdf8] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
              <span>HOVER TARGET // CLICK TO INSPECT</span>
            </div>
            <div className="text-xs font-bold text-white mt-0.5">{hoveredComponent.name}</div>
            <div className="text-[10px] text-[#bdc8d1] leading-tight mt-1 line-clamp-2">
              {hoveredComponent.shortDesc}
            </div>
          </div>
        )}

        {/* Bottom Instruction Bar */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 pointer-events-none flex items-center justify-between text-[10px] text-[#87929a]">
          <div className="bg-[#070a0f]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow flex items-center gap-2">
            <span><strong className="text-white">Drag</strong> Rotate</span>
            <span className="text-white/20">•</span>
            <span><strong className="text-white">Scroll</strong> Zoom</span>
            <span className="text-white/20">•</span>
            <span><strong className="text-[#38bdf8]">Hover</strong> Inspect</span>
            <span className="text-white/20">•</span>
            <span><strong className="text-[#38bdf8]">Click</strong> Select</span>
          </div>

          <div className="hidden sm:flex bg-[#070a0f]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow items-center gap-1.5 text-[#38bdf8]">
            <CheckCircle size={11} />
            <span className="font-bold">{activeProfile.scaleNote}</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT / SECONDARY AREA: SELECTED COMPONENT INFORMATION         */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-3 shrink-0">
        {/* Card 1: Selected Component Detail Card */}
        <div className="bg-[#10141e]/90 p-4 rounded-xl border border-[#38bdf8]/40 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[10px] text-[#38bdf8] font-bold tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
              PHYSICAL COMPONENT INSPECTION
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]">
              {selectedComponent.category}
            </span>
          </div>

          {/* Component Name & Location */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-display leading-tight">
              {selectedComponent.name}
            </h2>
            <div className="text-[11px] text-[#87929a] mt-0.5 flex items-center gap-1">
              <span className="text-[#38bdf8] font-semibold">Location:</span>
              <span>{selectedComponent.location}</span>
            </div>
          </div>

          {/* Primary Function */}
          <div className="bg-[#0b0e15] p-2.5 rounded-lg border border-white/5 text-xs">
            <span className="text-[9px] text-[#87929a] uppercase font-bold block mb-0.5">
              Engineering Function &amp; Purpose
            </span>
            <p className="text-white leading-relaxed text-[11px] sm:text-xs">
              {selectedComponent.primaryFunction}
            </p>
          </div>

          {/* Explicit Distinction: VERIFIED NASA FACT */}
          <div className="bg-[#0b1018] p-3 rounded-lg border border-[#38bdf8]/30 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle size={13} className="text-[#38bdf8]" />
                VERIFIED NASA FACT
              </span>
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold">
                PDS ARCHIVE
              </span>
            </div>
            <p className="text-xs text-[#bdc8d1] leading-relaxed mt-0.5">
              {selectedComponent.verifiedNasaFact}
            </p>
          </div>

          {/* Explicit Distinction: SIMULATED FIELD INVESTIGATION */}
          <div className="bg-[#15120c] p-2.5 rounded-lg border border-[#f59e0b]/40 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={12} className="text-[#f59e0b]" />
                SIMULATED FIELD INVESTIGATION (EVA)
              </span>
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#f59e0b]/15 text-[#f59e0b] font-bold">
                EXPEDITION SIMULATION
              </span>
            </div>
            <p className="text-[11px] text-[#f59e0b]/90 leading-relaxed mt-0.5">
              {selectedComponent.simulatedFieldCondition}
            </p>
          </div>
        </div>

        {/* Card 2: Rover Component Quick Selector Directory */}
        <div className="bg-[#10141e]/80 p-3 rounded-xl border border-white/10 flex-1 flex flex-col min-h-[180px] max-h-[260px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
            <span className="text-[10px] text-[#87929a] font-bold uppercase tracking-wider">
              ALL COMPONENTS ({activeProfile.components.length})
            </span>

            {/* Filter pills */}
            <div className="flex items-center gap-1 text-[9px]">
              {(['all', 'optics', 'science', 'power', 'mobility', 'comm'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-1.5 py-0.5 rounded uppercase font-bold transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#38bdf8] text-[#07090e]'
                      : 'text-[#87929a] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable list of components */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 scrollbar-thin">
            {filteredComponents.map((c) => {
              const isSelected = c.id === activeCompId;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectComponent(c.id)}
                  className={`text-left p-2 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-[#bdc8d1]'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-bold text-xs truncate flex items-center gap-1.5">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />}
                      <span>{c.name}</span>
                    </div>
                    <div className="text-[10px] text-[#87929a] truncate mt-0.5">
                      {c.shortDescription}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-transform ${
                      isSelected ? 'text-[#38bdf8] translate-x-0.5' : 'text-[#87929a]'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
