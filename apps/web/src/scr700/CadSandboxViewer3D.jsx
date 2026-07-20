/**
 * CadSandboxViewer3D — Motor de Twin Digital Industrial
 * Arquitectura idéntica a PANDORA SharedTwinViewer3D:
 *   - React Three Fiber (WebGL real, no CSS tricks)
 *   - OrbitControls libre: pan, orbit, zoom tipo cámara real
 *   - Grid Three.js: cuadrícula de ingeniería en plano Y=0
 *   - Luces PBR: directional, ambient, point, fill
 *   - Soporte model-viewer GLB/GLTF renderizado en escena 3D
 *   - Temas: dark, blueprint, toxic, aluminum
 */

import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Html, useGLTF, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minimize2, Palette, X, RotateCcw, Camera, Activity,
  Sun, Layers, Box, Eye, RefreshCw, AlertTriangle, Move, Maximize2, RotateCw,
  Plus, Minus, Check, Lock, MapPin
} from 'lucide-react';
import { PROCESS_STATIONS, STATION_IMAGES } from './data';

// ─── WebGL check ────────────────────────────────────────────────────────────
function checkWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// ─── Theme configs ───────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    label: 'Cyberpunk Dark',
    bg: '#03060a',
    fog: '#03060a',
    fogDensity: 0.012,
    ambientIntensity: 0.4,
    dirIntensity: 1.2,
    dirColor: '#ffffff',
    pointColor: '#00F0FF',
    gridCell: '#1a2536',
    gridSection: '#22d3ee',
    floorColor: '#05080d',
    floorRoughness: 0.15,
    floorMetal: 0.8,
  },
  blueprint: {
    label: 'Planos Blueprint',
    bg: '#edf4f9',
    fog: '#edf4f9',
    fogDensity: 0.008,
    ambientIntensity: 1.0,
    dirIntensity: 1.5,
    dirColor: '#c7e8ff',
    pointColor: '#0d9488',
    gridCell: '#b2f5ea',
    gridSection: '#0d9488',
    floorColor: '#dbeafe',
    floorRoughness: 0.9,
    floorMetal: 0.0,
  },
  toxic: {
    label: 'Industrial Toxic',
    bg: '#0c0d0e',
    fog: '#0c0d0e',
    fogDensity: 0.015,
    ambientIntensity: 0.35,
    dirIntensity: 1.0,
    dirColor: '#ffffff',
    pointColor: '#84cc16',
    gridCell: '#2c302e',
    gridSection: '#84cc16',
    floorColor: '#0a0b0a',
    floorRoughness: 0.6,
    floorMetal: 0.3,
  },
  aluminum: {
    label: 'Gris Aluminio',
    bg: '#15181c',
    fog: '#15181c',
    fogDensity: 0.010,
    ambientIntensity: 0.6,
    dirIntensity: 1.4,
    dirColor: '#f0f4f8',
    pointColor: '#94a3b8',
    gridCell: '#1e2228',
    gridSection: '#334155',
    floorColor: '#0f1115',
    floorRoughness: 0.08,
    floorMetal: 0.95,
  },
};

// ─── GLB Machine Node ────────────────────────────────────────────────────────
// TWIN DIGITAL INDUSTRIAL RULES:
//   1. Model bottom face MUST sit exactly on Y=0 (the floor grid plane)
//   2. No auto-rotation, no animation — machines are anchored with mass
//   3. Bounding box must be computed BEFORE first render (useMemo, not useEffect)
//   4. Max height normalized to ~2.5 units so all machines have human-scale proportions
function GlbNode({ url, position, label, stateColor, transform, isSelected, transformMode, onTransformEnd, controlsRef, onClick }) {
  const groupRef = useRef();
  const { scene } = useGLTF(url);

  // Compute grounding offset synchronously — this is the critical fix.
  // useEffect would run AFTER paint, causing the floating/tilted frame.
  const { cloned, groundOffset } = useMemo(() => {
    const cloned = scene.clone(true);

    // Force update world matrices so bounding box is accurate
    cloned.updateMatrixWorld(true);

    // Compute axis-aligned bounding box of the entire model
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Normalize scale: target max dimension of 2.5 units (industrial human scale)
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 2.5;
    const scale = maxDim > 0 ? targetSize / maxDim : 1;
    cloned.scale.setScalar(scale);

    // After scaling, recompute bounding box
    cloned.updateMatrixWorld(true);
    const boxScaled = new THREE.Box3().setFromObject(cloned);

    // Center on X/Z axis (remove internal offset from model origin)
    const centerScaled = new THREE.Vector3();
    boxScaled.getCenter(centerScaled);
    cloned.position.x -= centerScaled.x;
    cloned.position.z -= centerScaled.z;

    // Ground: move model so its lowest point is at Y=0
    // boxScaled.min.y is the lowest vertex in world space
    cloned.position.y -= boxScaled.min.y;

    return { cloned, groundOffset: 0 };
  }, [scene]);

  return (
    <>
      <group 
        ref={groupRef} 
        position={[
          position[0] + (transform?.position?.[0] || 0),
          position[1] + (transform?.position?.[1] || 0),
          position[2] + (transform?.position?.[2] || 0)
        ]}
        rotation={transform?.rotation || [0, 0, 0]}
        scale={transform?.scale || [1, 1, 1]}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        {/* Holographic ground ring — sits on Y=0 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[1.4, 1.6, 64]} />
          <meshBasicMaterial color={stateColor} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <circleGeometry args={[1.4, 64]} />
          <meshBasicMaterial color={stateColor} transparent opacity={0.06} side={THREE.DoubleSide} />
        </mesh>

        {/* GLB model — grounded, static, no rotation */}
        <primitive object={cloned} />

        {/* Floating label */}
        <Html position={[0, 3.2, 0]} center distanceFactor={14} zIndexRange={[1, 0]}>
          <div style={{
            background: 'rgba(5,8,13,0.85)',
            border: `1px solid ${isSelected ? '#22d3ee' : stateColor}88`,
            borderRadius: 8,
            padding: '3px 10px',
            fontSize: 10,
            fontWeight: 700,
            color: '#f1f5f9',
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(4px)',
            boxShadow: isSelected ? '0 0 16px #22d3ee88' : `0 0 12px ${stateColor}44`,
          }}>
            {label}
          </div>
        </Html>
      </group>

      {/* 3D Transform Controls */}
      {isSelected && (
        <TransformControls
          object={groupRef}
          mode={transformMode}
          onDraggingChanged={(e) => {
            if (controlsRef.current) controlsRef.current.enabled = !e.value;
          }}
          onMouseUp={() => {
            if (groupRef.current && onTransformEnd) {
              const p = groupRef.current.position;
              const r = groupRef.current.rotation;
              const s = groupRef.current.scale;
              onTransformEnd({
                position: [p.x - position[0], p.y - position[1], p.z - position[2]],
                rotation: [r.x, r.y, r.z],
                scale: [s.x, s.y, s.z],
              });
            }
          }}
        />
      )}
    </>
  );
}


// ─── 2D Image Billboard (for stations without GLB) ──────────────────────────
function ImageNode({ imgSrc, position, label, stateColor }) {
  const meshRef = useRef();
  const { camera } = useThree();
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    new THREE.TextureLoader().load(imgSrc, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      setTexture(t);
    });
  }, [imgSrc]);

  // Billboard: always face camera
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group position={position}>
      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.2, 1.35, 48]} />
        <meshBasicMaterial color={stateColor} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* Billboard quad */}
      {texture && (
        <mesh ref={meshRef} position={[0, 2.2, 0]}>
          <planeGeometry args={[2.8, 2.8]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.1} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      <Html position={[0, 3.8, 0]} center distanceFactor={14} zIndexRange={[1, 0]}>
        <div style={{
          background: 'rgba(5,8,13,0.85)',
          border: `1px solid ${stateColor}88`,
          borderRadius: 8,
          padding: '3px 10px',
          fontSize: 10,
          fontWeight: 700,
          color: '#f1f5f9',
          whiteSpace: 'nowrap',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          backdropFilter: 'blur(4px)',
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

// ─── Conveyor Arrow between two stations ────────────────────────────────────
function ConveyorLine({ from, to, color = '#22d3ee' }) {
  const points = [
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={0.5} linewidth={1} />
    </line>
  );
}

// ─── Main 3D Scene ───────────────────────────────────────────────────────────
function TwinScene({ stationAssets, theme, isPlaying, orbitRef, studioSettings, onSaveNodeTransform, selectedNode, onSelectNode, transformMode }) {
  const t = THEMES[theme] || THEMES.dark;
  const { camera } = useThree();

  // Camera preset on mount
  useEffect(() => {
    camera.position.set(12, 9, 14);
    if (orbitRef.current) {
      orbitRef.current.target.set(0, 0.5, 0);
      orbitRef.current.update();
    }
  }, [camera, orbitRef]);

  // Station positions: spread linearly along X axis
  const SPACING = 5.5;
  const totalWidth = (PROCESS_STATIONS.length - 1) * SPACING;
  const startX = -totalWidth / 2;

  const stateColors = {
    run: '#22c55e', wait: '#f5c518', alarm: '#ef4444',
    maint: '#3b82f6', off: '#64748b',
  };

  return (
    <>
      <PerspectiveCamera makeDefault fov={50} near={0.1} far={500} />

      {/* Fog */}
      {t.fogDensity > 0 && <fogExp2 attach="fog" args={[t.fog, t.fogDensity]} />}

      {/* Lighting rig — same as PANDORA */}
      <ambientLight intensity={t.ambientIntensity} />
      <directionalLight
        position={[10, 18, 10]}
        intensity={t.dirIntensity}
        color={t.dirColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-10, 6, -10]} intensity={0.5} color={t.pointColor} />
      {/* Fill lights */}
      <directionalLight position={[-10, 10, 15]} intensity={1.2} color="#ffffff" />
      <pointLight position={[0, -4, 10]} intensity={0.4} color="#ffffff" />

      {/* Engineering Grid — Three.js real geometry on Y=0 */}
      <Grid
        position={[0, -0.01, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={t.gridCell}
        sectionSize={5}
        sectionThickness={1.0}
        sectionColor={t.gridSection}
        fadeDistance={55}
        fadeStrength={1}
      />

      {/* Floor plane — PBR material (reflective or matte based on theme) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial
          color={t.floorColor}
          roughness={t.floorRoughness}
          metalness={t.floorMetal}
        />
      </mesh>

      {/* Station Nodes */}
      {PROCESS_STATIONS.map((st, idx) => {
        const asset = stationAssets?.[st.id] || null;
        const isModel = asset?.type === 'model' && asset?.value;
        const posX = startX + idx * SPACING;
        const pos = [posX, 0, 0];
        const stateColor = stateColors[st.state] || '#64748b';

        // Conveyor line to next station
        const nextPosX = startX + (idx + 1) * SPACING;

        return (
          <React.Fragment key={st.id}>
            {idx < PROCESS_STATIONS.length - 1 && (
              <ConveyorLine
                from={[posX + 1.5, 0.3, 0]}
                to={[nextPosX - 1.5, 0.3, 0]}
                color={t.gridSection}
              />
            )}

            <Suspense fallback={null}>
              {isModel ? (
                <GlbNode
                  url={asset.value}
                  position={pos}
                  label={`${st.num ? st.num + ' ' : ''}${st.name}`}
                  stateColor={stateColor}
                  transform={studioSettings?.nodeTransforms?.[st.id]}
                  isSelected={selectedNode === st.id}
                  transformMode={transformMode}
                  controlsRef={orbitRef}
                  onClick={() => onSelectNode(st.id)}
                  onTransformEnd={(transform) => {
                    const currentTransforms = studioSettings?.nodeTransforms || {};
                    onSaveNodeTransform?.({
                      ...currentTransforms,
                      [st.id]: transform
                    });
                  }}
                />
              ) : (
                <ImageNode
                  imgSrc={STATION_IMAGES[st.img]}
                  position={pos}
                  label={`${st.num ? st.num + ' ' : ''}${st.name}`}
                  stateColor={stateColor}
                />
              )}
            </Suspense>
          </React.Fragment>
        );
      })}

      {/* OrbitControls — free camera like PANDORA */}
      <OrbitControls
        ref={orbitRef}
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2 - 0.04}
        panSpeed={0.8}
        zoomSpeed={1.0}
        rotateSpeed={0.6}
        minDistance={3}
        maxDistance={80}
      />
    </>
  );
}

// ─── Theme Modal ─────────────────────────────────────────────────────────────
function ThemeModal({ active, onSelect, onClose }) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(2,4,8,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl border p-6 w-[580px] max-w-[95vw]"
        style={{ background: '#070d18', borderColor: '#1e3a5f' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2 mb-5">
          <Palette size={16} color="#22d3ee" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-200">
            Tema del Twin Digital
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(THEMES).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { onSelect(key); onClose(); }}
              className="relative rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
              style={{
                background: cfg.bg === '#edf4f9' ? '#1a2940' : cfg.bg,
                borderColor: active === key ? cfg.gridSection : '#1e3a5f',
                boxShadow: active === key ? `0 0 16px ${cfg.gridSection}55` : 'none',
              }}
            >
              {active === key && (
                <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: cfg.gridSection, color: '#03060a' }}>
                  ACTIVO
                </span>
              )}
              {/* Color preview strip */}
              <div className="flex gap-1.5 mb-3">
                {[cfg.bg === '#edf4f9' ? '#c7e8ff' : cfg.bg, cfg.gridSection, cfg.pointColor, cfg.floorColor].map((c, i) => (
                  <span key={i} className="h-4 flex-1 rounded" style={{ background: c }} />
                ))}
              </div>
              <div className="text-[11px] font-bold text-slate-200">{cfg.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 capitalize">{key}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fallback UI ─────────────────────────────────────────────────────────────
function Fallback({ onRetry }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#03060a]">
      <AlertTriangle size={36} color="#ef4444" opacity={0.7} />
      <p className="text-xs font-black uppercase tracking-widest text-red-400">Error de WebGL</p>
      <p className="text-[11px] text-slate-500 max-w-xs text-center leading-relaxed">
        No se pudo inicializar el contexto 3D. Cierra otras pestañas con gráficos 3D e inténtalo de nuevo.
      </p>
      <button onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-[11px] font-bold uppercase tracking-widest hover:bg-cyan-500/20 transition-all">
        <RefreshCw size={13} /> Reintentar
      </button>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function CadSandboxOverlay({
  open,
  onClose,
  stationAssets = {},
  studioSettings,
  onSaveStudioSettings,
}) {
  const [theme, setTheme] = useState(studioSettings?.activeTheme ?? 'dark');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [webglOk, setWebglOk] = useState(true);
  const [canvasKey, setCanvasKey] = useState(0);
  
  // Transform State
  const [selectedNode, setSelectedNode] = useState(null);
  const [transformMode, setTransformMode] = useState('rotate'); // 'translate', 'rotate', 'scale'

  const orbitRef = useRef();
  const containerRef = useRef();
  const undoStackRef = useRef([]);

  const handleSaveTransformsWithUndo = useCallback((newTransforms) => {
    if (!onSaveStudioSettings) return;
    const currentTransforms = studioSettings?.nodeTransforms || {};
    undoStackRef.current.push(JSON.parse(JSON.stringify(currentTransforms)));
    if (undoStackRef.current.length > 30) undoStackRef.current.shift();
    
    onSaveStudioSettings({ nodeTransforms: newTransforms });
  }, [studioSettings?.nodeTransforms, onSaveStudioSettings]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Allow Ctrl+Z (or Cmd+Z on Mac) to undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (undoStackRef.current.length > 0) {
          e.preventDefault();
          const prevState = undoStackRef.current.pop();
          if (onSaveStudioSettings) {
            onSaveStudioSettings({ nodeTransforms: prevState });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSaveStudioSettings]);

  useEffect(() => {
    setWebglOk(checkWebGL());
  }, []);

  // Sync theme from parent settings
  useEffect(() => {
    if (studioSettings?.activeTheme) setTheme(studioSettings.activeTheme);
  }, [studioSettings?.activeTheme, open]);

  const handleThemeChange = useCallback((key) => {
    setTheme(key);
    if (onSaveStudioSettings) onSaveStudioSettings({ activeTheme: key });
  }, [onSaveStudioSettings]);

  const handleResetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.target.set(0, 0.5, 0);
      orbitRef.current.update();
    }
    setCanvasKey(k => k + 1);
  };

  const handleSnapshot = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `SCR700_Twin_${Date.now()}.png`;
    a.click();
  };

  const handleManualScale = (factor) => {
    if (!selectedNode || !onSaveStudioSettings) return;
    const currentTransforms = studioSettings?.nodeTransforms || {};
    const nodeTransform = currentTransforms[selectedNode] || {};
    
    // Default scale is [1,1,1]
    const currentScale = nodeTransform.scale || [1, 1, 1];
    const newScale = currentScale.map(val => val * factor);

    handleSaveTransformsWithUndo({
      ...currentTransforms,
      [selectedNode]: {
        ...nodeTransform,
        scale: newScale
      }
    });
  };

  const handleManualRotate = (mode) => {
    if (!selectedNode || !onSaveStudioSettings) return;
    const currentTransforms = studioSettings?.nodeTransforms || {};
    const nodeTransform = currentTransforms[selectedNode] || {};
    
    const currentRot = nodeTransform.rotation || [0, 0, 0];
    let newRot = [...currentRot];

    if (mode === 'reset') {
      newRot = [0, 0, 0]; // Reset to exactly 0 on all axes
    } else if (mode === '+90') {
      newRot[1] = currentRot[1] + (Math.PI / 2); // Rotate +90 degrees on Y axis (floor)
    }

    handleSaveTransformsWithUndo({
      ...currentTransforms,
      [selectedNode]: {
        ...nodeTransform,
        rotation: newRot
      }
    });
  };

  const handleResetPosition = () => {
    if (!selectedNode || !onSaveStudioSettings) return;
    const currentTransforms = studioSettings?.nodeTransforms || {};
    const nodeTransform = currentTransforms[selectedNode] || {};
    
    handleSaveTransformsWithUndo({
      ...currentTransforms,
      [selectedNode]: {
        ...nodeTransform,
        position: [0, 0, 0]
      }
    });
  };

  const t = THEMES[theme] || THEMES.dark;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col font-sans select-none overflow-hidden"
        style={{ background: t.bg }}
        ref={containerRef}
      >
        {/* ── Top Bar ── */}
        <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b z-10"
          style={{ background: 'rgba(5,8,13,0.9)', borderColor: '#1e3a5f', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: t.gridSection }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ background: t.gridSection }} />
            </span>
            <h2 className="text-xs font-black tracking-widest text-slate-50 uppercase">
              Twin Digital Activo — SCR700
            </h2>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
              style={{ color: t.gridSection, borderColor: `${t.gridSection}44`, background: `${t.gridSection}11` }}>
              WebGL
            </span>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Transform Controls Toolbar (only visible if node selected) */}
            {selectedNode && (
              <div className="flex items-center gap-1 bg-[#070d18] border border-[#1e3a5f] rounded-lg p-1 mr-2"
                style={{ backdropFilter: 'blur(8px)' }}>
                <button onClick={() => setTransformMode('translate')} 
                  className={`p-1.5 rounded transition-colors ${transformMode === 'translate' ? 'bg-[#22d3ee] text-[#070d18]' : 'text-slate-400 hover:text-white'}`}
                  title="Mover (Translate)">
                  <Move size={14} />
                </button>
                <div className="flex bg-[#1e3a5f]/30 rounded ml-1 mr-1 border border-[#1e3a5f]">
                  <button onClick={handleResetPosition} 
                    className="p-1 px-1.5 text-slate-300 hover:text-white hover:bg-emerald-500/20 transition-colors"
                    title="Restablecer posición (volver a anclar)">
                    <MapPin size={12} />
                  </button>
                </div>
                <div className="w-px h-4 bg-[#1e3a5f] mx-1"></div>
                <button onClick={() => setTransformMode('rotate')} 
                  className={`p-1.5 rounded transition-colors ${transformMode === 'rotate' ? 'bg-[#22d3ee] text-[#070d18]' : 'text-slate-400 hover:text-white'}`}
                  title="Girar Libre (Rotate)">
                  <RotateCw size={14} />
                </button>
                <div className="flex bg-[#1e3a5f]/30 rounded ml-1 border border-[#1e3a5f]">
                  <button onClick={() => handleManualRotate('+90')} 
                    className="p-1 px-1.5 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-[#22d3ee]/20 transition-colors"
                    title="Girar exactamente +90°">
                    +90°
                  </button>
                  <div className="w-px bg-[#1e3a5f]"></div>
                  <button onClick={() => handleManualRotate('reset')} 
                    className="p-1 px-1.5 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-red-500/20 transition-colors"
                    title="Restablecer giro a 0°">
                    0°
                  </button>
                </div>
                <div className="w-px h-4 bg-[#1e3a5f] mx-1"></div>
                <button onClick={() => setTransformMode('scale')} 
                  className={`p-1.5 rounded transition-colors ${transformMode === 'scale' ? 'bg-[#22d3ee] text-[#070d18]' : 'text-slate-400 hover:text-white'}`}
                  title="Agrandar/Achicar Libre (Scale)">
                  <Maximize2 size={14} />
                </button>
                <div className="flex bg-[#1e3a5f]/30 rounded ml-1 border border-[#1e3a5f]">
                  <button onClick={() => handleManualScale(1.1)} 
                    className="p-1 px-1.5 text-slate-300 hover:text-white hover:bg-[#22d3ee]/20 transition-colors"
                    title="Agrandar Modelo +10%">
                    <Plus size={12} />
                  </button>
                  <div className="w-px bg-[#1e3a5f]"></div>
                  <button onClick={() => handleManualScale(0.9)} 
                    className="p-1 px-1.5 text-slate-300 hover:text-white hover:bg-red-500/20 transition-colors"
                    title="Achicar Modelo -10%">
                    <Minus size={12} />
                  </button>
                </div>
                <div className="w-px h-4 bg-[#1e3a5f] mx-2"></div>
                <button onClick={() => setSelectedNode(null)} 
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/40 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest"
                  title="Fijar y bloquear modelo en esta posición">
                  <Lock size={12} />
                  Fijar Modelo
                </button>
              </div>
            )}

            {/* Simulation status */}
            <button onClick={() => setIsPlaying(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{
                borderColor: isPlaying ? `${t.gridSection}55` : '#334155',
                color: isPlaying ? t.gridSection : '#64748b',
                background: isPlaying ? `${t.gridSection}11` : 'transparent',
              }}>
              <Activity size={12} />
              {isPlaying ? 'SIM ON' : 'SIM OFF'}
            </button>

            {/* Theme picker */}
            <button onClick={() => setShowThemeModal(true)}
              className="grid place-items-center h-8 w-8 rounded-lg border text-slate-400 hover:text-white transition-all"
              style={{ borderColor: '#1e3a5f', background: '#070d18' }}
              title="Cambiar Tema">
              <Palette size={14} />
            </button>

            {/* Reset camera */}
            <button onClick={handleResetCamera}
              className="grid place-items-center h-8 w-8 rounded-lg border text-slate-400 hover:text-white transition-all"
              style={{ borderColor: '#1e3a5f', background: '#070d18' }}
              title="Restablecer Cámara">
              <RotateCcw size={14} />
            </button>

            {/* Snapshot */}
            <button onClick={handleSnapshot}
              className="grid place-items-center h-8 w-8 rounded-lg border text-slate-400 hover:text-white transition-all"
              style={{ borderColor: '#1e3a5f', background: '#070d18' }}
              title="Capturar PNG">
              <Camera size={14} />
            </button>

            {/* Close */}
            <button onClick={onClose}
              className="grid place-items-center h-8 w-8 rounded-lg border text-slate-400 hover:text-white transition-all"
              style={{ borderColor: '#1e3a5f', background: '#070d18' }}>
              <Minimize2 size={14} />
            </button>
          </div>
        </header>

        {/* ── Viewport ── */}
        <div className="flex-1 relative overflow-hidden">
          {!webglOk ? (
            <Fallback onRetry={() => { setWebglOk(checkWebGL()); setCanvasKey(k => k + 1); }} />
          ) : (
            <Canvas
              key={canvasKey}
              shadows
              gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
              style={{ width: '100%', height: '100%' }}
              onCreated={({ gl }) => {
                gl.setClearColor(new THREE.Color(t.bg));
              }}
            >
              <TwinScene
                stationAssets={stationAssets}
                theme={theme}
                isPlaying={isPlaying}
                orbitRef={orbitRef}
                studioSettings={studioSettings}
                onSaveNodeTransform={handleSaveTransformsWithUndo}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                transformMode={transformMode}
              />
            </Canvas>
          )}

          {/* Navigation hint overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] text-slate-500 font-mono"
              style={{ background: 'rgba(5,8,13,0.7)', borderColor: '#1e3a5f', backdropFilter: 'blur(4px)' }}>
              <span>🖱 Arrastrar = Orbitar</span>
              <span>·</span>
              <span>Rueda = Zoom</span>
              <span>·</span>
              <span>Clic Derecho = Pan</span>
              <span>·</span>
              <span className="text-cyan-400">Clic en Modelo = Modificar</span>
            </div>
          </div>
        </div>

        {/* ── Theme Modal ── */}
        {showThemeModal && (
          <ThemeModal
            active={theme}
            onSelect={handleThemeChange}
            onClose={() => setShowThemeModal(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
