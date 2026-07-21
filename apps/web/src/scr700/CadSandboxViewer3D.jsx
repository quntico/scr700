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
import { OrbitControls, Grid, PerspectiveCamera, Html, useGLTF, TransformControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Minimize2, Palette, X, RotateCcw, Camera, Activity,
  Sun, Layers, Box, Eye, RefreshCw, AlertTriangle, Move, Maximize2, RotateCw,
  Plus, Minus, Check, Lock, Unlock, MapPin, Sliders, Sparkles, Grid as GridIcon, Save, Video, Circle,
  Tag, Pin, Edit3, Trash2, Info, MessageSquare, Zap, Gauge, Wrench, Flame, Droplets, CheckCircle2, Cpu, ShieldAlert,
  Undo2, Redo2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Edit2
} from 'lucide-react';
import { PROCESS_STATIONS, STATION_IMAGES } from './data';

// ─── WebGL check ────────────────────────────────────────────────────────────
function checkWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// ─── 3D Icon Library Dictionary ──────────────────────────────────────────────
const ICON_MAP = {
  tag: Tag,
  pin: Pin,
  zap: Zap,
  alert: AlertTriangle,
  gauge: Gauge,
  activity: Activity,
  check: CheckCircle2,
  wrench: Wrench,
  flame: Flame,
  droplets: Droplets,
  cpu: Cpu,
  shield: ShieldAlert,
};

function RenderAnnotationIcon({ iconName, size = 12, className = '' }) {
  const IconComp = ICON_MAP[iconName] || Tag;
  return <IconComp size={size} className={className} />;
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

// ─── 3D Leader Line from Machine to Floating Label ──────────────────────────
function LabelConnectorLine({ yOffset = 3.2, color = '#22d3ee', startY = 0.4 }) {
  const points = useMemo(() => [
    new THREE.Vector3(0, startY, 0),
    new THREE.Vector3(0, yOffset, 0)
  ], [startY, yOffset]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group position={[0, 0, 0]}>
      {/* Anchor Dot on top of Machine */}
      <mesh position={[0, startY, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Anchor Ring Pulse */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, startY, 0]}>
        <ringGeometry args={[0.08, 0.16, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Glowing Leader Line Pole */}
      <line geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.85} linewidth={2} />
      </line>
    </group>
  );
}

// ─── GLB Machine Node ────────────────────────────────────────────────────────
// TWIN DIGITAL INDUSTRIAL RULES:
//   1. Model bottom face MUST sit exactly on Y=0 (the floor grid plane)
//   2. No auto-rotation, no animation — machines are anchored with mass
//   3. Bounding box must be computed BEFORE first render (useMemo, not useEffect)
//   4. Max height normalized to ~2.5 units so all machines have human-scale proportions
function GlbNode({ url, position, label, stateColor, transform, isSelected, transformMode, onTransformEnd, controlsRef, onClick, cadSettings, customLabel, isEditorUnlocked, onOpenLabelEditor }) {
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

    // Smart Industrial Scaling: target uniform height (~2.2m) across all equipment models
    const targetHeight = 2.2;
    let scale = 1;

    if (size.y > 0) {
      scale = targetHeight / size.y;
      const maxHoriz = Math.max(size.x, size.z);
      if (maxHoriz * scale > 9) {
        scale = 9 / maxHoriz;
      }
      if (size.y * scale < 1.5 && size.y > 0) {
        scale = 1.5 / size.y;
      }
    } else {
      const maxDim = Math.max(size.x, size.y, size.z);
      scale = maxDim > 0 ? 2.5 / maxDim : 1;
    }

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
    cloned.position.y -= boxScaled.min.y;
    const computedHeight = boxScaled.max.y - boxScaled.min.y;

    return { cloned, groundOffset: 0, boxHeight: computedHeight || 2.2 };
  }, [scene]);

  // Apply custom lighting / material tweaks
  useEffect(() => {
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (cadSettings?.metalness !== undefined) {
            mat.metalness = cadSettings.metalness / 100;
          }
          if (cadSettings?.roughness !== undefined) {
            mat.roughness = cadSettings.roughness / 100;
          }
          if (cadSettings?.silhouettes !== undefined) {
            mat.wireframe = cadSettings.silhouettes > 75;
          }
          mat.envMapIntensity = (cadSettings?.brightness || 100) / 50;
          mat.needsUpdate = true;
        });
      }
    });
  }, [cloned, cadSettings?.metalness, cadSettings?.roughness, cadSettings?.silhouettes, cadSettings?.brightness]);

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
        {(cadSettings?.showHalos ?? true) && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <ringGeometry args={[1.4, 1.6, 64]} />
              <meshBasicMaterial color={stateColor} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <circleGeometry args={[1.4, 64]} />
              <meshBasicMaterial color={stateColor} transparent opacity={0.06} side={THREE.DoubleSide} />
            </mesh>
          </>
        )}

        {/* GLB model — grounded, static, no rotation */}
        <primitive object={cloned} />

        {/* 3D Connector Line from Machine up to Floating Label */}
        {(cadSettings?.showLabels ?? true) && (customLabel?.showConnector ?? true) && (
          <LabelConnectorLine yOffset={customLabel?.yOffset ?? 3.2} color={customLabel?.color || stateColor} startY={0.4} />
        )}

        {/* Floating label */}
        {(cadSettings?.showLabels ?? true) && (
          <Html position={[0, customLabel?.yOffset ?? 3.2, 0]} center distanceFactor={14} zIndexRange={[1, 0]}>
            <div
              onClick={(e) => {
                if (isEditorUnlocked) {
                  e.stopPropagation();
                  onOpenLabelEditor?.();
                }
              }}
              className={`transition-all select-none ${isEditorUnlocked ? 'cursor-pointer hover:ring-2 hover:ring-cyan-400 hover:scale-105' : ''}`}
              style={{
                background: 'rgba(5,8,13,0.92)',
                border: `1px solid ${isSelected ? '#22d3ee' : (customLabel?.color || stateColor)}`,
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: `${customLabel?.fontSize ?? 12}px`,
                fontWeight: 800,
                color: '#f1f5f9',
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
                boxShadow: isSelected ? '0 0 20px #22d3ee88' : `0 0 14px ${customLabel?.color || stateColor}55`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: customLabel?.color || stateColor, color: customLabel?.color || stateColor }} />
                <RenderAnnotationIcon iconName={customLabel?.icon || 'tag'} size={Math.max(12, (customLabel?.fontSize ?? 12) - 1)} className="text-cyan-400" />
                <span>{customLabel?.title || label}</span>
                {isEditorUnlocked && (
                  <span className="ml-1 text-cyan-400 font-mono opacity-80" style={{ fontSize: `${Math.max(9, (customLabel?.fontSize ?? 12) - 3)}px` }}>✏️</span>
                )}
              </div>
              {customLabel?.subtitle && (
                <div className="font-mono text-cyan-300/90 normal-case tracking-normal mt-0.5" style={{ fontSize: `${Math.max(9, (customLabel?.fontSize ?? 12) - 3)}px` }}>
                  {customLabel.subtitle}
                </div>
              )}
            </div>
          </Html>
        )}
      </group>

      {/* 3D Transform Controls */}
      {isSelected && (
        <TransformControls
          object={groupRef}
          mode={transformMode}
          size={1.3}
          translationSnap={0.5}
          rotationSnap={Math.PI / 12}
          scaleSnap={0.1}
          onDraggingChanged={(e) => {
            if (controlsRef.current) controlsRef.current.enabled = !e.value;
          }}
          onMouseUp={() => {
            if (groupRef.current && onTransformEnd) {
              const p = groupRef.current.position;
              const r = groupRef.current.rotation;
              const s = groupRef.current.scale;
              
              // Snap Y back to floor (0) & enforce clean grid alignment
              onTransformEnd({
                position: [
                  Math.round((p.x - position[0]) * 2) / 2,
                  0, // Enforce flat floor Y=0 level
                  Math.round((p.z - position[2]) * 2) / 2
                ],
                rotation: [
                  0, // Lock pitch and roll upright!
                  Math.round(r.y / (Math.PI / 12)) * (Math.PI / 12),
                  0
                ],
                scale: [
                  Math.round(s.x * 10) / 10,
                  Math.round(s.y * 10) / 10,
                  Math.round(s.z * 10) / 10
                ],
              });
            }
          }}
        />
      )}
    </>
  );
}


// ─── 2D Image Billboard (for stations without GLB) ──────────────────────────
function ImageNode({ imgSrc, position, label, stateColor, cadSettings, customLabel, isEditorUnlocked, onOpenLabelEditor }) {
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
      {(cadSettings?.showHalos ?? true) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[1.2, 1.35, 48]} />
          <meshBasicMaterial color={stateColor} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Billboard quad */}
      {texture && (
        <mesh ref={meshRef} position={[0, 2.2, 0]}>
          <planeGeometry args={[2.8, 2.8]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.1} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 3D Connector Line from Machine up to Floating Label */}
      {(cadSettings?.showLabels ?? true) && (customLabel?.showConnector ?? true) && (
        <LabelConnectorLine yOffset={customLabel?.yOffset ?? 3.8} color={customLabel?.color || stateColor} startY={0.4} />
      )}

      {/* Floating Label */}
      {(cadSettings?.showLabels ?? true) && (
        <Html position={[0, customLabel?.yOffset ?? 3.8, 0]} center distanceFactor={14} zIndexRange={[1, 0]}>
          <div
            onClick={(e) => {
              if (isEditorUnlocked) {
                e.stopPropagation();
                onOpenLabelEditor?.();
              }
            }}
            className={`transition-all select-none ${isEditorUnlocked ? 'cursor-pointer hover:ring-2 hover:ring-cyan-400 hover:scale-105' : ''}`}
            style={{
              background: 'rgba(5,8,13,0.92)',
              border: `1px solid ${customLabel?.color || stateColor}`,
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: `${customLabel?.fontSize ?? 12}px`,
              fontWeight: 800,
              color: '#f1f5f9',
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
              boxShadow: `0 0 14px ${customLabel?.color || stateColor}55`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: customLabel?.color || stateColor, color: customLabel?.color || stateColor }} />
              <RenderAnnotationIcon iconName={customLabel?.icon || 'tag'} size={Math.max(12, (customLabel?.fontSize ?? 12) - 1)} className="text-cyan-400" />
              <span>{customLabel?.title || label}</span>
              {isEditorUnlocked && (
                <span className="ml-1 text-cyan-400 font-mono opacity-80" style={{ fontSize: `${Math.max(9, (customLabel?.fontSize ?? 12) - 3)}px` }}>✏️</span>
              )}
            </div>
            {customLabel?.subtitle && (
              <div className="font-mono text-cyan-300/90 normal-case tracking-normal mt-0.5" style={{ fontSize: `${Math.max(9, (customLabel?.fontSize ?? 12) - 3)}px` }}>
                {customLabel.subtitle}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Free 3D Pin Annotation ──────────────────────────────────────────────────
function FreeAnnotation3D({ annotation, isEditorUnlocked, isSelected, onSelect, onTransformEnd, controlsRef, transformMode, showLabels }) {
  const groupRef = useRef();
  if (showLabels === false) return null;

  const colorMap = {
    cyan: '#22d3ee',
    emerald: '#10b981',
    amber: '#f59e0b',
    crimson: '#ef4444',
    purple: '#a855f7',
  };
  const themeColor = colorMap[annotation.color] || '#22d3ee';

  return (
    <>
      <group
        ref={groupRef}
        position={annotation.position || [0, 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
      >
        {/* 3D Pin Needle */}
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.02, 0.12, 0.5, 16]} />
          <meshBasicMaterial color={themeColor} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={0.6} />
        </mesh>

        {/* Floating HTML Tag */}
        <Html position={[0, 0.5, 0]} center distanceFactor={13} zIndexRange={[2, 0]}>
          <div
            className={`cursor-pointer transition-all select-none ${
              isSelected ? 'scale-110 ring-2 ring-cyan-400' : 'hover:scale-105'
            }`}
            style={{
              background: 'rgba(5, 8, 13, 0.92)',
              border: `1px solid ${themeColor}aa`,
              borderRadius: 8,
              padding: '4px 10px',
              backdropFilter: 'blur(8px)',
              boxShadow: isSelected ? `0 0 20px ${themeColor}` : `0 0 12px ${themeColor}44`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
              <RenderAnnotationIcon iconName={annotation.icon || 'pin'} size={12} className="text-cyan-400" />
              <span className="text-[10px] font-black tracking-wider text-white uppercase whitespace-nowrap">
                {annotation.text || 'Etiqueta 3D'}
              </span>
            </div>
            {annotation.detail && (
              <div className="text-[8px] font-mono text-slate-300 mt-0.5 whitespace-nowrap">
                {annotation.detail}
              </div>
            )}
          </div>
        </Html>
      </group>

      {/* TransformControls for positioning annotation */}
      {isEditorUnlocked && isSelected && (
        <TransformControls
          object={groupRef}
          mode={transformMode || 'translate'}
          onDraggingChanged={(e) => {
            if (controlsRef.current) controlsRef.current.enabled = !e.value;
          }}
          onMouseUp={() => {
            if (groupRef.current && onTransformEnd) {
              const p = groupRef.current.position;
              onTransformEnd([p.x, p.y, p.z]);
            }
          }}
        />
      )}
    </>
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
function TwinScene({
  stationAssets,
  theme,
  isPlaying,
  orbitRef,
  studioSettings,
  onSaveNodeTransform,
  selectedNode,
  onSelectNode,
  transformMode,
  cadSettings = {},
  gridTransform = {},
  isEditorUnlocked = false,
  onOpenLabelEditor,
  selectedAnnotation,
  onSelectAnnotation,
  onSaveAnnotationTransform,
}) {
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
  const SPACING = 7.5;
  const totalWidth = (PROCESS_STATIONS.length - 1) * SPACING;
  const startX = -totalWidth / 2;

  const stateColors = {
    run: '#22c55e', wait: '#f5c518', alarm: '#ef4444',
    maint: '#3b82f6', off: '#64748b',
  };

  // Dynamic Sun Position calculation based on sunAngle (0 - 360 deg)
  const sunAngleRad = ((cadSettings.sunAngle ?? 90) * Math.PI) / 180;
  const sunX = Math.cos(sunAngleRad) * 18;
  const sunZ = Math.sin(sunAngleRad) * 18;

  // Dynamic brightness multiplier
  const brightnessMult = (cadSettings.brightness ?? 100) / 100;
  const ambientIntensity = (t.ambientIntensity + 0.4) * brightnessMult;
  const dirIntensity = (t.dirIntensity + 0.5) * brightnessMult;

  // Dynamic floor mode settings
  const floorMode = cadSettings.floorMode || 'reflective';
  const showGrid = floorMode !== 'none';
  const showFloor = floorMode !== 'none' && floorMode !== 'grid';
  const isReflective = floorMode === 'reflective';
  const gridVisMult = (cadSettings.gridVis ?? 100) / 100;
  const fogLevel = ((cadSettings.fog ?? 0) / 100) * 0.05; // 0 to 0.05 fog density

  return (
    <>
      <PerspectiveCamera makeDefault fov={50} near={0.1} far={500} />

      {/* Industrial Fog */}
      {fogLevel > 0 && <fogExp2 attach="fog" args={[t.fog || '#03060a', fogLevel]} />}

      {/* HDRI Environment reflection lighting — illuminates metallic GLB shaders */}
      <Environment preset="city" />
      <hemisphereLight intensity={1.2 * brightnessMult} skyColor="#ffffff" groundColor="#1e293b" />

      {/* Lighting rig */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[sunX, 18, sunZ]}
        intensity={dirIntensity}
        color={t.dirColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-10, 6, -10]} intensity={0.8 * brightnessMult} color={t.pointColor} />
      
      {/* Front fill light (Backlight filter) */}
      {(cadSettings.backlight ?? true) && (
        <directionalLight position={[-10, 10, 15]} intensity={1.5 * brightnessMult} color="#ffffff" />
      )}
      <directionalLight position={[0, 20, 0]} intensity={1.2 * brightnessMult} color="#ffffff" />

      {/* Transformed Grid & Floor Plane Group */}
      <group
        position={[
          gridTransform.x || 0,
          gridTransform.y ?? -0.01,
          gridTransform.z || 0
        ]}
        rotation={[
          0,
          ((gridTransform.rotationY || 0) * Math.PI) / 180,
          0
        ]}
      >
        {/* Engineering Grid — Three.js real geometry */}
        {showGrid && (
          <Grid
            position={[0, 0, 0]}
            args={[gridTransform.size || 100, gridTransform.size || 100]}
            cellSize={gridTransform.cellSize || 1}
            cellThickness={0.5 * gridVisMult}
            cellColor={t.gridCell}
            sectionSize={5}
            sectionThickness={1.0 * gridVisMult}
            sectionColor={t.gridSection}
            fadeDistance={65}
            fadeStrength={1}
          />
        )}

        {/* Floor plane — PBR material (reflective or matte based on theme and floorMode) */}
        {showFloor && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
            <planeGeometry args={[2000, 2000]} />
            <meshStandardMaterial
              color={t.floorColor}
              roughness={isReflective ? (cadSettings.roughness !== undefined ? cadSettings.roughness / 100 : 0.15) : 0.9}
              metalness={isReflective ? (cadSettings.metalness !== undefined ? cadSettings.metalness / 100 : 0.8) : 0.05}
            />
          </mesh>
        )}
      </group>

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
                  cadSettings={cadSettings}
                  customLabel={studioSettings?.customLabels?.[st.id]}
                  isEditorUnlocked={isEditorUnlocked}
                  onOpenLabelEditor={() => onOpenLabelEditor?.(st.id)}
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
                  cadSettings={cadSettings}
                  customLabel={studioSettings?.customLabels?.[st.id]}
                  isEditorUnlocked={isEditorUnlocked}
                  onOpenLabelEditor={() => onOpenLabelEditor?.(st.id)}
                />
              )}
            </Suspense>
          </React.Fragment>
        );
      })}

      {/* Free 3D Pin Annotations */}
      {(studioSettings?.freeAnnotations || []).map((ann) => (
        <FreeAnnotation3D
          key={ann.id}
          annotation={ann}
          isEditorUnlocked={isEditorUnlocked}
          isSelected={selectedAnnotation === ann.id}
          onSelect={() => onSelectAnnotation?.(ann.id)}
          onTransformEnd={(newPos) => onSaveAnnotationTransform?.(ann.id, newPos)}
          controlsRef={orbitRef}
          transformMode={transformMode}
          showLabels={cadSettings?.showLabels ?? true}
        />
      ))}

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

// ─── Pin Modal (Editor Security Lock) ────────────────────────────────────────
function PinModal({ onUnlock, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.trim() === '2021') {
      onUnlock();
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(2,4,8,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl border p-6 w-[420px] max-w-[95vw] shadow-2xl"
        style={{ background: '#070d18', borderColor: 'rgba(34,211,238,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <Lock size={22} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-100">
            Acceso Modo Editor CAD
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Ingresa el PIN de seguridad industrial para modificar la alineación de máquinas, iluminación y entorno.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              placeholder="PIN de Seguridad (2021)"
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl bg-[#03060a] border text-center text-sm font-mono tracking-widest text-cyan-400 placeholder:text-slate-600 outline-none transition-all ${error ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'border-[#1e3a5f] focus:border-cyan-400'}`}
            />
            {error && <p className="text-[10px] text-red-400 font-bold text-center mt-1.5">PIN incorrecto. Ingresa el PIN 2021</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-[#03060a] text-xs font-black uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            >
              Desbloquear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Pandora Draggable Floating CAD Studio Pro Panel ───────────────────────
function CadStudioProPanel({
  cadSettings,
  setCadSettings,
  onSaveSettings,
  onSnapshot,
  onClose
}) {
  const dragControls = useDragControls();

  const updateSetting = (key, value) => {
    setCadSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-16 right-6 z-40 w-[360px] max-w-[92vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-cyan-500/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none custom-scrollbar pointer-events-auto"
      style={{
        background: 'rgba(7, 13, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.7), 0 0 1px 1px rgba(34,211,238,0.3)'
      }}
    >
      {/* Header Handle (Pull & Place - Only dragging here moves window!) */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between border-b border-[#1e3a5f] pb-3 mb-4 cursor-grab active:cursor-grabbing bg-[#03060a]/80 p-2.5 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sliders size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-100">
                ESTUDIO CAD PRO
              </h3>
              <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                PREMIUM
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono">Arrastra desde esta barra para mover</p>
          </div>
        </div>
        <button
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
        {/* Sección 1: Iluminación y Sombras */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Sun size={13} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Iluminación y Sombras
            </span>
          </div>

          {/* Brillo e Iluminación */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Brillo e Iluminación
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateSetting('brightness', Math.max(10, (cadSettings.brightness || 100) - 10))}
                  className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white text-xs font-bold"
                >-</button>
                <span className="text-cyan-400 font-mono font-bold text-[11px] w-9 text-center">
                  {cadSettings.brightness || 100}%
                </span>
                <button
                  onClick={() => updateSetting('brightness', Math.min(300, (cadSettings.brightness || 100) + 10))}
                  className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white text-xs font-bold"
                >+</button>
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              value={cadSettings.brightness || 100}
              onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Ángulo del Sol (Sombras) */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Ángulo del Sol (Sombras)
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {cadSettings.sunAngle || 90}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={cadSettings.sunAngle || 90}
              onChange={(e) => updateSetting('sunAngle', parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Sección 2: Detalle y Acabado CAD */}
        <div className="space-y-2.5 pt-2 border-t border-[#1e3a5f]/60">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Sparkles size={13} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Detalle y Acabado CAD
            </span>
          </div>

          {/* Brillo Metálico */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Brillo Metálico
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {cadSettings.metalness || 95}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cadSettings.metalness || 95}
              onChange={(e) => updateSetting('metalness', parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Rugosidad / Pulido */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Rugosidad / Pulido
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {cadSettings.roughness || 25}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cadSettings.roughness || 25}
              onChange={(e) => updateSetting('roughness', parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Siluetas e Ingeniería */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Siluetas e Ingeniería
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {cadSettings.silhouettes || 35}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cadSettings.silhouettes || 35}
              onChange={(e) => updateSetting('silhouettes', parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Sección 3: Entorno y Cuadrícula */}
        <div className="space-y-2.5 pt-2 border-t border-[#1e3a5f]/60">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <GridIcon size={13} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Entorno y Cuadrícula
            </span>
          </div>

          {/* Botones de Modo de Piso */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'grid', label: 'CUADRÍCULA' },
              { id: 'solid', label: 'PISO SÓLIDO' },
              { id: 'reflective', label: 'REFLECTIVO' },
              { id: 'none', label: 'SIN PISO' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => updateSetting('floorMode', m.id)}
                className={`py-2 px-2 rounded-lg border text-[9px] font-black tracking-wider transition-all ${
                  (cadSettings.floorMode || 'reflective') === m.id
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'border-[#1e3a5f] bg-[#03060a] text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Grosor / Visibilidad Cuadrícula */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Grosor / Visibilidad Cuadrícula
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {cadSettings.gridVis || 100}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={cadSettings.gridVis || 100}
              onChange={(e) => updateSetting('gridVis', parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Niebla Industrial (FOG) */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Niebla Industrial (FOG)
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {cadSettings.fog || 0}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cadSettings.fog || 0}
              onChange={(e) => updateSetting('fog', parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Filtro de Contraluz Toggle */}
          <div className="flex items-center justify-between bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Filtro de Contraluz
              </span>
              <span className="text-[8px] text-slate-500 font-mono">Iluminación frontal CAD</span>
            </div>
            <button
              onClick={() => updateSetting('backlight', !(cadSettings.backlight ?? true))}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                (cadSettings.backlight ?? true) ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                (cadSettings.backlight ?? true) ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Halos y Anillos de Estado Toggle */}
          <div className="flex items-center justify-between bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Halos y Anillos Verdes (Base)
              </span>
              <span className="text-[8px] text-slate-500 font-mono">Círculos de presencia en piso</span>
            </div>
            <button
              onClick={() => updateSetting('showHalos', !(cadSettings.showHalos ?? true))}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                (cadSettings.showHalos ?? true) ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                (cadSettings.showHalos ?? true) ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#1e3a5f]">
          <button
            onClick={onSaveSettings}
            className="w-full py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-xs font-black uppercase tracking-wider hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Save size={14} />
            Guardar Ajustes de Estudio
          </button>

          <button
            onClick={onSnapshot}
            className="w-full py-2.5 rounded-xl bg-cyan-500 text-[#03060a] text-xs font-black uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2"
          >
            <Camera size={14} />
            Descargar Foto 3D 📥
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Pandora Draggable Floating Grid Transform Panel ───────────────────────
function GridTransformPanel({
  gridTransform,
  setGridTransform,
  onSaveTransform,
  onClose
}) {
  const dragControls = useDragControls();

  const update = (key, value) => {
    setGridTransform(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setGridTransform({
      x: 0,
      y: -0.01,
      z: 0,
      rotationY: 0,
      cellSize: 1,
      size: 100
    });
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-16 left-6 z-40 w-[340px] max-w-[92vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-cyan-500/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none custom-scrollbar pointer-events-auto"
      style={{
        background: 'rgba(7, 13, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.7), 0 0 1px 1px rgba(34,211,238,0.3)'
      }}
    >
      {/* Header Handle (Pull & Place) */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between border-b border-[#1e3a5f] pb-3 mb-4 cursor-grab active:cursor-grabbing bg-[#03060a]/80 p-2.5 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <GridIcon size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-100">
                TRANSFORMADOR DE GRID
              </h3>
              <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                PISO 3D
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono">Calibra posición y rotación del grid</p>
          </div>
        </div>
        <button
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
        {/* Posición Espacial */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
            Posición Espacial del Grid
          </span>

          {/* Posición X */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Desplazamiento Eje X
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {(gridTransform.x || 0).toFixed(1)}m
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="0.5"
              value={gridTransform.x || 0}
              onChange={(e) => update('x', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Altura Y (Piso Zero Level) */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Altura Y (Nivel del Piso)
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {(gridTransform.y ?? -0.01).toFixed(2)}m
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.05"
              value={gridTransform.y ?? -0.01}
              onChange={(e) => update('y', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Posición Z */}
          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Desplazamiento Eje Z
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {(gridTransform.z || 0).toFixed(1)}m
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="0.5"
              value={gridTransform.z || 0}
              onChange={(e) => update('z', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Rotación Y del Grid */}
        <div className="space-y-2.5 pt-2 border-t border-[#1e3a5f]/60">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
            Orientación de Nave
          </span>

          <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Giro del Piso / Retícula
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                {gridTransform.rotationY || 0}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={gridTransform.rotationY || 0}
              onChange={(e) => update('rotationY', parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Módulo y Escala de Celdas */}
        <div className="space-y-2.5 pt-2 border-t border-[#1e3a5f]/60">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
            Módulo y Celdas CAD
          </span>

          <div className="grid grid-cols-4 gap-1.5">
            {[0.5, 1, 2, 5].map(val => (
              <button
                key={val}
                onClick={() => update('cellSize', val)}
                className={`py-1.5 px-1 rounded-lg border text-[9px] font-mono font-black tracking-wider transition-all ${
                  (gridTransform.cellSize || 1) === val
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'border-[#1e3a5f] bg-[#03060a] text-slate-400 hover:text-slate-200'
                }`}
              >
                {val}m
              </button>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-2 pt-2 border-t border-[#1e3a5f]">
          <button
            onClick={handleReset}
            className="w-full py-2 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={13} />
            Re-centrar Grid en Origen (0,0,0)
          </button>

          <button
            onClick={onSaveTransform}
            className="w-full py-2.5 rounded-xl bg-cyan-500 text-[#03060a] text-xs font-black uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2"
          >
            <Save size={14} />
            Guardar Alineación de Grid
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Floating Draggable 3D Alignment & Axis Control Modal ─────────────────────
function TransformControlModal({
  open,
  onClose,
  selectedStation,
  transformMode,
  setTransformMode,
  handleManualMove,
  handleManualRotate,
  handleManualScale,
  handleResetPosition,
  handleSnapToGrid,
  handleResetMachineCompletely,
  onDeselect,
}) {
  if (!open || !selectedStation) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed bottom-6 right-6 z-50 w-96 bg-[#070d19]/95 border border-[#1e3a5f] rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl text-slate-100 font-sans select-none"
    >
      {/* Header (Draggable handle) */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e3a5f] cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sliders size={16} />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-cyan-300">
              {selectedStation.num ? `${selectedStation.num} ` : ''}{selectedStation.name}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Panel Flotante de Posición & Ejes 3D
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          title="Cerrar Panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body: Axis Movement Sections */}
      <div className="py-3 space-y-3">
        {/* Mode Selector */}
        <div className="flex gap-1 bg-[#03060a] p-1 rounded-xl border border-[#1e3a5f]">
          <button
            onClick={() => setTransformMode('translate')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              transformMode === 'translate'
                ? 'bg-cyan-500 text-[#070d18] shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Move size={13} /> Mover (Ejes)
          </button>
          <button
            onClick={() => setTransformMode('rotate')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              transformMode === 'rotate'
                ? 'bg-cyan-500 text-[#070d18] shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw size={13} /> Girar
          </button>
          <button
            onClick={() => setTransformMode('scale')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              transformMode === 'scale'
                ? 'bg-cyan-500 text-[#070d18] shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 size={13} /> Escala
          </button>
        </div>

        {/* 🔵 EJE X (Azul - Lateral) */}
        <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-400 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
              Eje Azul (X) — Desplazamiento Lateral
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleManualMove('x', -1)}
              className="py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold hover:bg-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              ⬅ Mover -1m Izq
            </button>
            <button
              onClick={() => handleManualMove('x', 1)}
              className="py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold hover:bg-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              Mover +1m Der ➡
            </button>
          </div>
        </div>

        {/* 🔴 EJE Z (Rojo - Profundidad) */}
        <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]">
          <div className="flex items-center justify-between text-[11px] font-bold text-red-400 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
              Eje Rojo (Z) — Profundidad (Adelante/Atrás)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleManualMove('z', -1)}
              className="py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/25 transition-all flex items-center justify-center gap-2"
            >
              ⬇ Mover -1m Atrás
            </button>
            <button
              onClick={() => handleManualMove('z', 1)}
              className="py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/25 transition-all flex items-center justify-center gap-2"
            >
              Mover +1m Adelante ⬆
            </button>
          </div>
        </div>

        {/* 🟢 EJE Y (Verde - Altura) */}
        <div className="bg-[#03060a]/80 p-2.5 rounded-xl border border-[#1e3a5f]">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Eje Verde (Y) — Elevar / Bajar Suelo
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleManualMove('y', -0.5)}
              className="py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              🔽 Bajar -0.5m
            </button>
            <button
              onClick={() => handleManualMove('y', 0.5)}
              className="py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              Subir +0.5m 🔼
            </button>
          </div>
        </div>

        {/* Rotación & Escala Rápida */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleManualRotate('+90')}
            className="flex-1 py-1.5 rounded-lg bg-[#1e3a5f]/40 border border-[#1e3a5f] text-slate-300 text-xs font-bold hover:bg-[#1e3a5f] transition-all flex items-center justify-center gap-1"
          >
            <RotateCw size={12} /> Giro +90°
          </button>
          <button
            onClick={() => handleManualScale(1.1)}
            className="py-1.5 px-3 rounded-lg bg-[#1e3a5f]/40 border border-[#1e3a5f] text-slate-300 text-xs font-bold hover:bg-[#1e3a5f] transition-all"
          >
            🔍 +10%
          </button>
          <button
            onClick={() => handleManualScale(0.9)}
            className="py-1.5 px-3 rounded-lg bg-[#1e3a5f]/40 border border-[#1e3a5f] text-slate-300 text-xs font-bold hover:bg-[#1e3a5f] transition-all"
          >
            🔍 -10%
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[#1e3a5f] space-y-2">
        <button
          onClick={handleSnapToGrid}
          className="w-full py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2"
        >
          <GridIcon size={14} /> Snap Magnético a Cuadrícula
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleResetMachineCompletely}
            className="flex-1 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1"
          >
            <RotateCcw size={12} /> Restablecer Fábrica
          </button>

          <button
            onClick={onDeselect}
            className="py-1.5 px-3 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 text-[10px] font-bold uppercase hover:bg-slate-700 transition-all"
          >
            Cerrar Selección
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 3D Label & Annotation Manager Modal (Draggable & Icon Library) ────────────
function LabelEditorModal({
  open,
  onClose,
  stationId,
  studioSettings,
  onSaveStudioSettings,
  stationAssets,
  onSelectAnnotation,
  onSelectNode
}) {
  const dragControls = useDragControls();
  const [selectedStId, setSelectedStId] = useState(stationId || 'station-1');
  const activeStation = PROCESS_STATIONS.find(s => s.id === selectedStId) || PROCESS_STATIONS[0];

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [color, setColor] = useState('#22d3ee');
  const [icon, setIcon] = useState('tag');
  const [yOffset, setYOffset] = useState(3.2);
  const [fontSize, setFontSize] = useState(12);
  const [showConnector, setShowConnector] = useState(true);

  // Free Pin Annotations
  const [freeText, setFreeText] = useState('');
  const [freeDetail, setFreeDetail] = useState('');
  const [freeColor, setFreeColor] = useState('cyan');
  const [freeIcon, setFreeIcon] = useState('pin');

  // Sync state if stationId or selectedStId changes
  useEffect(() => {
    if (open) {
      const targetId = selectedStId || stationId || 'station-1';
      const st = PROCESS_STATIONS.find(s => s.id === targetId) || PROCESS_STATIONS[0];
      const lbl = studioSettings?.customLabels?.[targetId] || {};
      setTitle(lbl.title !== undefined ? lbl.title : (st ? `${st.num ? st.num + ' ' : ''}${st.name}` : ''));
      setSubtitle(lbl.subtitle || '');
      setColor(lbl.color || '#22d3ee');
      setIcon(lbl.icon || 'tag');
      setYOffset(lbl.yOffset ?? 3.2);
      setFontSize(lbl.fontSize ?? 12);
      setShowConnector(lbl.showConnector ?? true);
    }
  }, [open, selectedStId, stationId, studioSettings]);

  if (!open) return null;

  const handleSaveStationLabel = () => {
    const customLabels = { ...(studioSettings?.customLabels || {}) };
    customLabels[selectedStId] = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      color,
      icon,
      yOffset: parseFloat(yOffset),
      fontSize: parseInt(fontSize, 10),
      showConnector: !!showConnector,
    };
    onSaveStudioSettings?.({
      ...studioSettings,
      customLabels
    });
    onSelectNode?.(selectedStId);
    onClose();
  };

  const handleResetStationLabel = () => {
    const customLabels = { ...(studioSettings?.customLabels || {}) };
    delete customLabels[selectedStId];
    onSaveStudioSettings?.({
      ...studioSettings,
      customLabels
    });
    onClose();
  };

  const handleAddFreeAnnotation = () => {
    if (!freeText.trim()) return;
    const newId = `ann-${Date.now()}`;
    // Find machine position
    const stAsset = stationAssets?.find?.(a => a.id === selectedStId);
    const activePos = stAsset?.position || [0, 1.5, 0];
    const initialPos = [activePos[0], activePos[1] + 2.5, activePos[2]];

    const freeAnnotations = [...(studioSettings?.freeAnnotations || [])];
    freeAnnotations.push({
      id: newId,
      text: freeText.trim(),
      detail: freeDetail.trim(),
      position: initialPos,
      color: freeColor,
      icon: freeIcon,
    });
    onSaveStudioSettings?.({
      ...studioSettings,
      freeAnnotations
    });
    onSelectAnnotation?.(newId);
    setFreeText('');
    setFreeDetail('');
  };

  const handleDeleteFreeAnnotation = (annId) => {
    const freeAnnotations = (studioSettings?.freeAnnotations || []).filter(a => a.id !== annId);
    onSaveStudioSettings?.({
      ...studioSettings,
      freeAnnotations
    });
  };

  const colorPresets = [
    { label: 'Cian', value: '#22d3ee' },
    { label: 'Verde', value: '#10b981' },
    { label: 'Ámbar', value: '#f59e0b' },
    { label: 'Rojo', value: '#ef4444' },
    { label: 'Púrpura', value: '#a855f7' },
  ];

  const iconOptions = [
    { id: 'tag', label: 'Etiqueta' },
    { id: 'pin', label: 'Pin 3D' },
    { id: 'zap', label: 'Energía' },
    { id: 'alert', label: 'Alarma' },
    { id: 'gauge', label: 'Telemetría' },
    { id: 'activity', label: 'Operación' },
    { id: 'check', label: 'Estado OK' },
    { id: 'wrench', label: 'Mantenimiento' },
    { id: 'flame', label: 'Temperatura' },
    { id: 'droplets', label: 'Presión' },
    { id: 'cpu', label: 'PLC Motor' },
    { id: 'shield', label: 'Seguridad' },
  ];

  return (
    <AnimatePresence>
      {/* Container: non-blocking transparent overlay to see the 3D scene underneath */}
      <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center p-4">
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="w-[480px] max-w-[95vw] rounded-2xl bg-[#0b1322]/95 border border-cyan-500/40 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-slate-200 select-none custom-scrollbar max-h-[88vh] overflow-y-auto pointer-events-auto backdrop-blur-xl"
        >
          {/* Header Drag Handle */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="flex items-center justify-between border-b border-[#1e3a5f] pb-3 mb-4 cursor-grab active:cursor-grabbing bg-[#03060a]/80 p-3 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Tag size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Editor de Etiquetas y Íconos 3D
                  </h3>
                  <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    PULL & PLACE
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-mono">
                  Mantén presionado aquí para mover esta ventana y observar tus modelos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Section A: Station Label Customizer */}
            <div className="p-3.5 rounded-xl bg-[#03060a]/80 border border-[#1e3a5f]/60 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                <Edit3 size={13} /> Etiqueta de Máquina 3D
              </span>

              {/* Station Dropdown Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  Máquina a Anclar Etiqueta:
                </label>
                <select
                  value={selectedStId}
                  onChange={(e) => setSelectedStId(e.target.value)}
                  className="w-full bg-[#070d18] border border-cyan-500/50 rounded-lg p-2 text-xs font-bold text-cyan-300 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {PROCESS_STATIONS.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.num ? `${st.num} ` : ''}{st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase">Título de Etiqueta (Nombre 3D)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#070d18] border border-[#1e3a5f] rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400"
                  placeholder="Ej. TRITURADORA MADERA"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase">Telemetría / Detalle (Subtítulo)</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full bg-[#070d18] border border-[#1e3a5f] rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400"
                  placeholder="Ej. 175 kW • 1200 RPM • OPERANDO"
                />
              </div>

              {/* Icon Selection Library */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Sparkles size={11} className="text-cyan-400" /> Librería de Íconos
                </label>
                <div className="grid grid-cols-6 gap-1.5 p-2 bg-[#070d18] rounded-xl border border-[#1e3a5f]">
                  {iconOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIcon(opt.id)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${
                        icon === opt.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                      title={opt.label}
                    >
                      <RenderAnnotationIcon iconName={opt.id} size={14} />
                      <span className="text-[7px] font-mono mt-0.5 truncate max-w-full">{opt.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase">Color de Insignia</label>
                  <div className="flex gap-1.5 pt-1">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setColor(preset.value)}
                        className={`w-6 h-6 rounded-full border transition-transform ${
                          color === preset.value ? 'scale-125 border-white shadow-[0_0_8px_white]' : 'border-transparent opacity-70'
                        }`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase">Altura Y (Anclaje: {yOffset}m)</label>
                  <input
                    type="range" min="1" max="6" step="0.1"
                    value={yOffset}
                    onChange={e => setYOffset(e.target.value)}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Font Size & 3D Leader Line Connector Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1e3a5f]/40">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
                    <span>Tamaño de Texto</span>
                    <span className="text-cyan-400 font-mono font-black">{fontSize}px</span>
                  </div>
                  <input
                    type="range" min="10" max="28" step="1"
                    value={fontSize}
                    onChange={e => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>10px</span>
                    <span>18px</span>
                    <span>28px</span>
                  </div>
                </div>

                <div className="space-y-1 flex flex-col justify-between">
                  <label className="text-[10px] font-bold text-slate-300 uppercase">Conector a Máquina</label>
                  <button
                    type="button"
                    onClick={() => setShowConnector(prev => !prev)}
                    className={`w-full py-1.5 px-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      showConnector
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                        : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {showConnector ? '✓ Conector 3D Activo' : '✕ Sin Conector'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleResetStationLabel}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase"
                >
                  Restablecer
                </button>
                <button
                  onClick={handleSaveStationLabel}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all hover:scale-105"
                >
                  Guardar Etiqueta
                </button>
              </div>
            </div>

            {/* Section B: Create Free 3D Pin Annotations */}
            <div className="p-3.5 rounded-xl bg-[#03060a]/80 border border-[#1e3a5f]/60 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Pin size={13} /> Agregar Pin o Anotación Libre en Espacio 3D
              </span>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  className="bg-[#070d18] border border-[#1e3a5f] rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-400"
                  placeholder="Título del Pin (Ej: Sensor P1)"
                />
                <input
                  type="text"
                  value={freeDetail}
                  onChange={e => setFreeDetail(e.target.value)}
                  className="bg-[#070d18] border border-[#1e3a5f] rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-400"
                  placeholder="Detalle (Ej: Inspección 480V)"
                />
              </div>

              {/* Free Icon Library selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Ícono para el Pin Libre</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {iconOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFreeIcon(opt.id)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all whitespace-nowrap ${
                        freeIcon === opt.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'border-[#1e3a5f] text-slate-400 hover:text-white'
                      }`}
                    >
                      <RenderAnnotationIcon iconName={opt.id} size={13} />
                      <span className="text-[9px]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1.5">
                  {['cyan', 'emerald', 'amber', 'crimson', 'purple'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFreeColor(c)}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        freeColor === c ? 'scale-125 border-white ring-2 ring-emerald-400' : 'border-transparent opacity-60'
                      }`}
                      style={{
                        backgroundColor:
                          c === 'cyan' ? '#22d3ee' :
                          c === 'emerald' ? '#10b981' :
                          c === 'amber' ? '#f59e0b' :
                          c === 'crimson' ? '#ef4444' : '#a855f7'
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleAddFreeAnnotation}
                  disabled={!freeText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
                >
                  <Plus size={14} /> Crear Pin
                </button>
              </div>

              <p className="text-[9px] text-cyan-300/80 font-mono bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/40">
                💡 <b>¿Cómo posicionar tu pin?</b> Al hacer clic sobre el pin creado en la pantalla 3D, aparecerán las flechas XYZ para arrastrarlo y posicionarlo en la ubicación exacta que desees.
              </p>

              {/* Existing Free Annotations List */}
              {(studioSettings?.freeAnnotations || []).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#1e3a5f]/40">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Pines Anclados ({studioSettings.freeAnnotations.length})</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                    {studioSettings.freeAnnotations.map(ann => (
                      <div key={ann.id} className="flex items-center justify-between p-2 rounded-lg bg-[#070d18] border border-[#1e3a5f]">
                        <div className="flex items-center gap-2">
                          <RenderAnnotationIcon iconName={ann.icon || 'pin'} size={14} className="text-cyan-400" />
                          <div>
                            <span className="text-[10px] font-bold text-white uppercase block">{ann.text}</span>
                            {ann.detail && <span className="text-[8px] font-mono text-slate-400">{ann.detail}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFreeAnnotation(ann.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Eliminar Pin"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
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

  // Editor Lock & Pandora CAD Studio State
  const [isEditorUnlocked, setIsEditorUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showCadStudioPanel, setShowCadStudioPanel] = useState(false);
  const [showGridTransformPanel, setShowGridTransformPanel] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabelStationId, setEditingLabelStationId] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const [cadSettings, setCadSettings] = useState({
    brightness: 100,
    sunAngle: 90,
    metalness: 95,
    roughness: 25,
    silhouettes: 35,
    floorMode: 'reflective',
    gridVis: 100,
    fog: 0,
    backlight: true,
    ...(studioSettings?.cadSettings || {})
  });

  const [gridTransform, setGridTransform] = useState({
    x: 0,
    y: -0.01,
    z: 0,
    rotationY: 0,
    cellSize: 1,
    size: 100,
    ...(studioSettings?.gridTransform || {})
  });
  
  // Transform State
  const [selectedNode, setSelectedNode] = useState(null);
  const [transformMode, setTransformMode] = useState('rotate'); // 'translate', 'rotate', 'scale'
  const [showTransformModal, setShowTransformModal] = useState(true);

  // Header Collapse & Custom System/Project Name State
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [systemName, setSystemName] = useState(studioSettings?.systemName || 'TWIN DIGITAL ACTIVO — SCR700');
  const [isEditingSystemName, setIsEditingSystemName] = useState(false);

  useEffect(() => {
    if (studioSettings?.systemName) {
      setSystemName(studioSettings.systemName);
    }
  }, [studioSettings?.systemName]);

  const handleSaveSystemName = useCallback((newName) => {
    const trimmed = newName.trim() || 'TWIN DIGITAL ACTIVO — SCR700';
    setSystemName(trimmed);
    setIsEditingSystemName(false);
    if (onSaveStudioSettings) {
      onSaveStudioSettings({
        ...studioSettings,
        systemName: trimmed
      });
    }
  }, [studioSettings, onSaveStudioSettings]);

  const selectedStation = useMemo(() => PROCESS_STATIONS.find(s => s.id === selectedNode), [selectedNode]);

  useEffect(() => {
    if (selectedNode) {
      setShowTransformModal(true);
    }
  }, [selectedNode]);

  const orbitRef = useRef();
  const containerRef = useRef();
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  // Snapshot current layout state for Undo
  const pushUndoSnapshot = useCallback(() => {
    if (!studioSettings) return;
    const snapshot = {
      nodeTransforms: studioSettings.nodeTransforms ? JSON.parse(JSON.stringify(studioSettings.nodeTransforms)) : {},
      freeAnnotations: studioSettings.freeAnnotations ? JSON.parse(JSON.stringify(studioSettings.freeAnnotations)) : [],
    };
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = []; // Reset redo stack on new action
  }, [studioSettings]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0 || !onSaveStudioSettings) return;
    const currentSnapshot = {
      nodeTransforms: studioSettings?.nodeTransforms ? JSON.parse(JSON.stringify(studioSettings.nodeTransforms)) : {},
      freeAnnotations: studioSettings?.freeAnnotations ? JSON.parse(JSON.stringify(studioSettings.freeAnnotations)) : [],
    };
    redoStackRef.current.push(currentSnapshot);

    const prevSnapshot = undoStackRef.current.pop();
    onSaveStudioSettings({
      ...studioSettings,
      nodeTransforms: prevSnapshot.nodeTransforms,
      freeAnnotations: prevSnapshot.freeAnnotations,
    });
  }, [studioSettings, onSaveStudioSettings]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0 || !onSaveStudioSettings) return;
    const currentSnapshot = {
      nodeTransforms: studioSettings?.nodeTransforms ? JSON.parse(JSON.stringify(studioSettings.nodeTransforms)) : {},
      freeAnnotations: studioSettings?.freeAnnotations ? JSON.parse(JSON.stringify(studioSettings.freeAnnotations)) : [],
    };
    undoStackRef.current.push(currentSnapshot);

    const nextSnapshot = redoStackRef.current.pop();
    onSaveStudioSettings({
      ...studioSettings,
      nodeTransforms: nextSnapshot.nodeTransforms,
      freeAnnotations: nextSnapshot.freeAnnotations,
    });
  }, [studioSettings, onSaveStudioSettings]);

  const handleSaveTransformsWithUndo = useCallback((newTransforms) => {
    if (!onSaveStudioSettings) return;
    pushUndoSnapshot();
    onSaveStudioSettings({
      ...studioSettings,
      nodeTransforms: newTransforms
    });
  }, [studioSettings, onSaveStudioSettings, pushUndoSnapshot]);

  const handleResetAllTransforms = useCallback(() => {
    if (!onSaveStudioSettings) return;
    pushUndoSnapshot();
    onSaveStudioSettings({
      ...studioSettings,
      nodeTransforms: {},
      freeAnnotations: []
    });
    setSelectedNode(null);
    setSelectedAnnotation(null);
  }, [studioSettings, onSaveStudioSettings, pushUndoSnapshot]);

  const handleResetMachineCompletely = useCallback(() => {
    if (!selectedNode || !onSaveStudioSettings) return;
    pushUndoSnapshot();
    const currentTransforms = { ...(studioSettings?.nodeTransforms || {}) };
    delete currentTransforms[selectedNode]; // Delete custom transform -> restores factory alignment!
    onSaveStudioSettings({
      ...studioSettings,
      nodeTransforms: currentTransforms
    });
  }, [selectedNode, studioSettings, onSaveStudioSettings, pushUndoSnapshot]);

  const handleSnapToGrid = useCallback(() => {
    if (!selectedNode || !onSaveStudioSettings) return;
    pushUndoSnapshot();
    const currentTransforms = { ...(studioSettings?.nodeTransforms || {}) };
    const nodeTransform = currentTransforms[selectedNode] || {};
    const pos = nodeTransform.position || [0, 0, 0];
    const rot = nodeTransform.rotation || [0, 0, 0];

    // Snap position X/Z to exact 0.5m grid units and Y to floor (0)
    const snappedX = Math.round(pos[0] * 2) / 2;
    const snappedZ = Math.round(pos[2] * 2) / 2;
    // Snap rotation Y to nearest 90 degrees
    const snappedRotY = Math.round(rot[1] / (Math.PI / 2)) * (Math.PI / 2);

    currentTransforms[selectedNode] = {
      ...nodeTransform,
      position: [snappedX, 0, snappedZ],
      rotation: [0, snappedRotY, 0],
    };

    onSaveStudioSettings({
      ...studioSettings,
      nodeTransforms: currentTransforms
    });
  }, [selectedNode, studioSettings, onSaveStudioSettings, pushUndoSnapshot]);

  const handleManualMove = useCallback((axis, delta) => {
    if (!selectedNode || !onSaveStudioSettings) return;
    pushUndoSnapshot();
    const currentTransforms = { ...(studioSettings?.nodeTransforms || {}) };
    const nodeTransform = currentTransforms[selectedNode] || {};
    const pos = [...(nodeTransform.position || [0, 0, 0])];

    if (axis === 'x') pos[0] = Math.round((pos[0] + delta) * 2) / 2;
    if (axis === 'z') pos[2] = Math.round((pos[2] + delta) * 2) / 2;
    pos[1] = 0; // Lock floor Y=0

    currentTransforms[selectedNode] = {
      ...nodeTransform,
      position: pos
    };

    onSaveStudioSettings({
      ...studioSettings,
      nodeTransforms: currentTransforms
    });
  }, [selectedNode, studioSettings, onSaveStudioSettings, pushUndoSnapshot]);

  const handleSaveCadSettings = useCallback(() => {
    if (onSaveStudioSettings) {
      onSaveStudioSettings({
        cadSettings
      });
    }
  }, [cadSettings, onSaveStudioSettings]);

  const handleSaveGridTransform = useCallback(() => {
    if (onSaveStudioSettings) {
      onSaveStudioSettings({
        gridTransform
      });
    }
  }, [gridTransform, onSaveStudioSettings]);

  // Global Keyboard Listener for Ctrl+Z, Ctrl+Y, Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keybindings when editing text inputs
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedAnnotation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

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
        {/* ── Top Bar (Collapsible with Floating Tab) ── */}
        {isHeaderCollapsed ? (
          /* Floating Minimalist Tab when Toolbar is Hidden */
          <div className="absolute top-3 left-4 z-[110] flex items-center gap-3 bg-[#05080d]/92 border border-cyan-500/40 backdrop-blur-md px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-all animate-in fade-in slide-in-from-top-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: t.gridSection }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: t.gridSection }} />
            </span>

            <div className="flex items-center gap-2">
              {isEditingSystemName ? (
                <input
                  type="text"
                  autoFocus
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  onBlur={() => handleSaveSystemName(systemName)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSystemName(systemName)}
                  className="bg-slate-900 border border-cyan-400 text-xs font-black tracking-widest text-cyan-300 px-2.5 py-1 rounded-lg outline-none uppercase"
                />
              ) : (
                <div
                  onClick={() => isEditorUnlocked && setIsEditingSystemName(true)}
                  className={`flex items-center gap-2 text-xs font-black tracking-widest text-slate-100 uppercase ${isEditorUnlocked ? 'cursor-pointer hover:text-cyan-400' : ''}`}
                  title={isEditorUnlocked ? 'Clic para editar nombre del sistema' : ''}
                >
                  <span>{systemName}</span>
                  {isEditorUnlocked && <Edit3 size={12} className="text-cyan-400 opacity-80" />}
                </div>
              )}
            </div>

            {/* Lock Status Pill */}
            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border tracking-widest ${
              isEditorUnlocked ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isEditorUnlocked ? 'EDITOR DESBLOQUEADO' : 'MODO OPERATIVO'}
            </span>

            {/* Expand Tab Trigger Button */}
            <button
              onClick={() => setIsHeaderCollapsed(false)}
              className="flex items-center gap-1.5 ml-2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all hover:scale-105"
              title="Mostrar Barra Completa de Herramientas 3D"
            >
              <span>HERRAMIENTAS</span>
              <ChevronDown size={14} />
            </button>
          </div>
        ) : (
          /* Full Organized Toolbar Header */
          <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b z-10 gap-3"
            style={{ background: 'rgba(5,8,13,0.94)', borderColor: '#1e3a5f', backdropFilter: 'blur(10px)' }}>

            {/* GROUP 1: Brand & Project Name + Lock Mode */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: t.gridSection }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: t.gridSection }} />
              </span>

              {/* Editable System / Project Title */}
              <div className="flex items-center gap-1.5">
                {isEditingSystemName ? (
                  <input
                    type="text"
                    autoFocus
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    onBlur={() => handleSaveSystemName(systemName)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSystemName(systemName)}
                    className="bg-slate-900 border border-cyan-400 text-xs font-black tracking-widest text-cyan-300 px-2 py-0.5 rounded outline-none uppercase"
                  />
                ) : (
                  <div
                    onClick={() => isEditorUnlocked && setIsEditingSystemName(true)}
                    className={`flex items-center gap-1.5 text-xs font-black tracking-widest text-slate-100 uppercase whitespace-nowrap ${isEditorUnlocked ? 'cursor-pointer hover:text-cyan-400' : ''}`}
                    title={isEditorUnlocked ? 'Clic para editar el nombre del sistema / proyecto' : ''}
                  >
                    <span>{systemName}</span>
                    {isEditorUnlocked && <Edit3 size={11} className="text-cyan-400 opacity-70" />}
                  </div>
                )}
              </div>

              {/* Lock/Unlock Candado Button */}
              <button
                onClick={() => {
                  if (isEditorUnlocked) {
                    setIsEditorUnlocked(false);
                    setSelectedNode(null);
                  } else {
                    setShowPinModal(true);
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  isEditorUnlocked
                    ? 'border-cyan-400/80 bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'border-[#1e3a5f] bg-[#070d18] text-slate-400 hover:text-slate-200'
                }`}
                title={isEditorUnlocked ? 'Modo Editor Desbloqueado (Clic para Bloquear)' : 'Modo Operativo Protegido (Clic para ingresar PIN)'}
              >
                {isEditorUnlocked ? <Unlock size={11} className="text-cyan-400" /> : <Lock size={11} />}
                <span>{isEditorUnlocked ? 'EDITOR' : 'BLOQUEADO'}</span>
              </button>
            </div>

            {/* GROUP 2: History (Undo/Redo) & Factory Reset */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#070d18] border border-[#1e3a5f] rounded-xl p-1">
                <button
                  onClick={handleUndo}
                  disabled={undoStackRef.current.length === 0}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  title="Deshacer Cambio (Ctrl + Z)"
                >
                  <Undo2 size={11} /> DESHACER
                </button>
                <div className="w-px h-3.5 bg-[#1e3a5f]" />
                <button
                  onClick={handleRedo}
                  disabled={redoStackRef.current.length === 0}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  title="Rehacer Cambio (Ctrl + Y / Ctrl + Shift + Z)"
                >
                  <Redo2 size={11} /> REHACER
                </button>
              </div>

              <button
                onClick={handleResetAllTransforms}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                title="Restablecer alineación de fábrica de todas las máquinas en 3D"
              >
                <RotateCcw size={11} /> RESTAURAR PLANTA
              </button>
            </div>

            {/* GROUP 3: Quick Camera Views & REC */}
            <div className="flex items-center gap-1 bg-[#070d18] border border-[#1e3a5f] rounded-xl p-1">
              <button
                onClick={() => {
                  if (orbitRef.current) {
                    orbitRef.current.object.position.set(0, 3, 22);
                    orbitRef.current.target.set(0, 0.5, 0);
                    orbitRef.current.update();
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                title="Vista Lateral 3D"
              >
                <Camera size={11} /> LATERAL
              </button>

              <button
                onClick={() => {
                  if (orbitRef.current) {
                    orbitRef.current.object.position.set(0, 25, 0.1);
                    orbitRef.current.target.set(0, 0.5, 0);
                    orbitRef.current.update();
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                title="Vista Superior CAD"
              >
                <Camera size={11} /> SUPERIOR
              </button>

              <button
                onClick={() => {
                  if (orbitRef.current) {
                    orbitRef.current.object.position.set(12, 9, 14);
                    orbitRef.current.target.set(0, 0.5, 0);
                    orbitRef.current.update();
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                title="Vista Isométrica 3D"
              >
                <Camera size={11} /> ISOMÉTRICA
              </button>

              <button
                onClick={() => setIsRecording(r => !r)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Grabar Simulación REC"
              >
                <Video size={11} className={isRecording ? 'text-red-400' : ''} />
                {isRecording ? 'REC ON' : 'REC'}
              </button>
            </div>

            {/* GROUP 4: Toggles & Tools */}
            <div className="flex items-center gap-1.5">
              {/* Transform Controls Trigger (when node selected) */}
              {isEditorUnlocked && selectedNode && (
                <button
                  onClick={() => setShowTransformModal(prev => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                    showTransformModal
                      ? 'bg-cyan-500 text-[#070d18] border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                      : 'bg-[#070d18] text-cyan-400 border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white'
                  }`}
                  title="Abrir/Cerrar Panel Flotante de Posición & Ejes 3D"
                >
                  <Sliders size={11} />
                  EJES 3D
                </button>
              )}

              {/* SIM status */}
              <button onClick={() => setIsPlaying(p => !p)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all"
                style={{
                  borderColor: isPlaying ? `${t.gridSection}55` : '#334155',
                  color: isPlaying ? t.gridSection : '#64748b',
                  background: isPlaying ? `${t.gridSection}11` : 'transparent',
                }}>
                <Activity size={11} />
                {isPlaying ? 'SIM ON' : 'SIM OFF'}
              </button>

              {/* Quick Toggle Halos Verdes */}
              <button onClick={() => setCadSettings(prev => ({ ...prev, showHalos: !(prev.showHalos ?? true) }))}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${
                  (cadSettings.showHalos ?? true)
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'border-slate-700 bg-[#070d18] text-slate-500 hover:text-slate-300'
                }`}
                title="Ocultar / Mostrar Halos Verdes de Máquinas">
                <Circle size={11} className={(cadSettings.showHalos ?? true) ? 'fill-emerald-400/40 text-emerald-400' : ''} />
                {(cadSettings.showHalos ?? true) ? 'HALOS' : 'HALOS OFF'}
              </button>

              {/* Quick Toggle Labels/Etiquetas 3D */}
              <button onClick={() => setCadSettings(prev => ({ ...prev, showLabels: !(prev.showLabels ?? true) }))}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${
                  (cadSettings.showLabels ?? true)
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'border-slate-700 bg-[#070d18] text-slate-500 hover:text-slate-300'
                }`}
                title="Ocultar / Mostrar Etiquetas 3D Ancladas">
                <Tag size={11} />
                {(cadSettings.showLabels ?? true) ? 'ETIQUETAS' : 'ETIQUETAS OFF'}
              </button>

              {/* Abrir Gestor de Etiquetas 3D Modal */}
              <button onClick={() => {
                setEditingLabelStationId(selectedNode || 'station-1');
                setShowLabelModal(true);
              }}
                className={`grid place-items-center h-7 w-7 rounded-lg border transition-all ${
                  showLabelModal
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'border-[#1e3a5f] bg-[#070d18] text-slate-400 hover:text-white'
                }`}
                title="Crear / Editar Etiquetas y Pines 3D Anclados">
                <Pin size={12} />
              </button>

              {/* Transformador de Grid Trigger */}
              <button onClick={() => setShowGridTransformPanel(prev => !prev)}
                className={`grid place-items-center h-7 w-7 rounded-lg border transition-all ${
                  showGridTransformPanel
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'border-[#1e3a5f] bg-[#070d18] text-slate-400 hover:text-white'
                }`}
                title="Abrir Transformador y Calibrador de Grid (Piso 3D)">
                <GridIcon size={12} />
              </button>

              {/* Pandora ESTUDIO CAD PRO Floating Panel Trigger */}
              <button onClick={() => setShowCadStudioPanel(prev => !prev)}
                className={`grid place-items-center h-7 w-7 rounded-lg border transition-all ${
                  showCadStudioPanel
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'border-[#1e3a5f] bg-[#070d18] text-slate-400 hover:text-white'
                }`}
                title="Abrir Panel ESTUDIO CAD PRO (Pandora)">
                <Sliders size={12} />
              </button>

              {/* Theme picker */}
              <button onClick={() => setShowThemeModal(true)}
                className="grid place-items-center h-7 w-7 rounded-lg border text-slate-400 hover:text-white transition-all"
                style={{ borderColor: '#1e3a5f', background: '#070d18' }}
                title="Cambiar Tema">
                <Palette size={12} />
              </button>

              {/* Reset camera */}
              <button onClick={handleResetCamera}
                className="grid place-items-center h-7 w-7 rounded-lg border text-slate-400 hover:text-white transition-all"
                style={{ borderColor: '#1e3a5f', background: '#070d18' }}
                title="Restablecer Cámara">
                <RotateCcw size={12} />
              </button>

              {/* Snapshot */}
              <button onClick={handleSnapshot}
                className="grid place-items-center h-7 w-7 rounded-lg border text-slate-400 hover:text-cyan-400 transition-all"
                style={{ borderColor: '#1e3a5f', background: '#070d18' }}
                title="Capturar Foto HD PNG">
                <Camera size={12} />
              </button>

              {/* Close Overlay */}
              <button onClick={onClose}
                className="grid place-items-center h-7 w-7 rounded-lg border text-slate-400 hover:text-white transition-all"
                style={{ borderColor: '#1e3a5f', background: '#070d18' }}
                title="Cerrar Vista 3D">
                <Minimize2 size={12} />
              </button>

              {/* TAB PARA OCULTAR LA BARRA SUPERIOR */}
              <button
                onClick={() => setIsHeaderCollapsed(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/50 text-[9px] font-black uppercase tracking-wider transition-all ml-1 shadow-sm"
                title="Ocultar Barra Superior para Máxima Visibilidad 3D"
              >
                <span>OCULTAR</span>
                <ChevronUp size={13} />
              </button>
            </div>
          </header>
        )}

        {/* ── Viewport ── */}
        <div className="flex-1 relative overflow-hidden">
          {!webglOk ? (
            <Fallback onRetry={() => { setWebglOk(checkWebGL()); setCanvasKey(k => k + 1); }} />
          ) : (
            <Canvas
              key={canvasKey}
              shadows={{ type: THREE.PCFShadowMap }}
              gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
              pixelRatio={[1, 2]}
              style={{ width: '100%', height: '100%' }}
              onCreated={({ gl }) => {
                gl.shadowMap.type = THREE.PCFShadowMap;
                gl.setClearColor(new THREE.Color(t.bg));
                const canvasEl = gl.domElement;
                if (canvasEl) {
                  canvasEl.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    setWebglOk(false);
                  }, { once: true });
                }
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
                onSelectNode={(id) => {
                  if (isEditorUnlocked) setSelectedNode(id);
                }}
                transformMode={transformMode}
                cadSettings={cadSettings}
                gridTransform={gridTransform}
                isEditorUnlocked={isEditorUnlocked}
                onOpenLabelEditor={(stId) => {
                  setEditingLabelStationId(stId);
                  setShowLabelModal(true);
                }}
                selectedAnnotation={selectedAnnotation}
                onSelectAnnotation={(id) => {
                  if (isEditorUnlocked) setSelectedAnnotation(id);
                }}
                onSaveAnnotationTransform={(annId, newPos) => {
                  const freeAnnotations = (studioSettings?.freeAnnotations || []).map(a =>
                    a.id === annId ? { ...a, position: newPos } : a
                  );
                  onSaveStudioSettings?.({ ...studioSettings, freeAnnotations });
                }}
              />
            </Canvas>
          )}

          {/* Modals & Floating Studio Panels */}
          {showThemeModal && (
            <ThemeModal
              active={theme}
              onSelect={handleThemeChange}
              onClose={() => setShowThemeModal(false)}
            />
          )}

          {showPinModal && (
            <PinModal
              onUnlock={() => setIsEditorUnlocked(true)}
              onClose={() => setShowPinModal(false)}
            />
          )}

          {showLabelModal && (
            <LabelEditorModal
              open={showLabelModal}
              onClose={() => setShowLabelModal(false)}
              stationId={editingLabelStationId}
              studioSettings={studioSettings}
              onSaveStudioSettings={onSaveStudioSettings}
              stationAssets={stationAssets}
              onSelectAnnotation={(id) => {
                setIsEditorUnlocked(true);
                setSelectedAnnotation(id);
              }}
              onSelectNode={(id) => {
                setIsEditorUnlocked(true);
                setSelectedNode(id);
              }}
            />
          )}

          {showCadStudioPanel && (
            <CadStudioProPanel
              cadSettings={cadSettings}
              setCadSettings={setCadSettings}
              onSaveSettings={handleSaveCadSettings}
              onSnapshot={handleSnapshot}
              onClose={() => setShowCadStudioPanel(false)}
            />
          )}

          {showGridTransformPanel && (
            <GridTransformPanel
              gridTransform={gridTransform}
              setGridTransform={setGridTransform}
              onSaveTransform={handleSaveGridTransform}
              onClose={() => setShowGridTransformPanel(false)}
            />
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

        {/* ── Transform Floating Control Modal ── */}
        {isEditorUnlocked && selectedNode && showTransformModal && (
          <TransformControlModal
            open={showTransformModal}
            onClose={() => setShowTransformModal(false)}
            selectedStation={selectedStation}
            transformMode={transformMode}
            setTransformMode={setTransformMode}
            handleManualMove={handleManualMove}
            handleManualRotate={handleManualRotate}
            handleManualScale={handleManualScale}
            handleResetPosition={handleResetPosition}
            handleSnapToGrid={handleSnapToGrid}
            handleResetMachineCompletely={handleResetMachineCompletely}
            onDeselect={() => setSelectedNode(null)}
          />
        )}

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

// ─── Single Machine 3D WebGL Viewer ─────────────────────────────────────────
// Real WebGL 3D canvas with engineering floor grid at Y=0.
// Anchors the GLB model bottom face exactly to Y=0 so machine NEVER floats.
function SingleGlbGroundedNode({ url }) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Scale model to standard 2.5 unit height
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.5 / maxDim : 1;
    c.scale.setScalar(scale);

    c.updateMatrixWorld(true);
    const boxScaled = new THREE.Box3().setFromObject(c);
    const centerScaled = new THREE.Vector3();
    boxScaled.getCenter(centerScaled);

    // Center on X and Z
    c.position.x -= centerScaled.x;
    c.position.z -= centerScaled.z;
    // Anchor bottom face directly to Y=0 (the grid plane!)
    c.position.y -= boxScaled.min.y;

    // Enhance materials so metallic surfaces reflect light
    c.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (mat.metalness > 0.5) mat.roughness = Math.max(mat.roughness, 0.35);
          mat.envMapIntensity = 1.8;
        });
      }
    });

    return c;
  }, [scene]);

  return <primitive object={cloned} />;
}

export function SingleMachineViewer3D({ url, stateColor = '#22d3ee', isAutoRotating = false }) {
  const [webglOk, setWebglOk] = useState(() => checkWebGL());

  if (!webglOk || !url) return null;

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      pixelRatio={[1, 2]}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <PerspectiveCamera makeDefault fov={45} position={[4, 3, 5]} />
      <OrbitControls
        autoRotate={isAutoRotating}
        autoRotateSpeed={2.5}
        enablePan={true}
        enableZoom={true}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.02}
      />
      <Environment preset="city" />
      <hemisphereLight intensity={1.2} skyColor="#ffffff" groundColor="#1e293b" />
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 15, 10]} intensity={1.8} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.8} />
      <directionalLight position={[0, 20, 0]} intensity={1.2} />
      <pointLight position={[0, -2, 5]} intensity={0.5} />

      {/* Engineering 3D Floor Grid Plane sitting at Y=0 */}
      <Grid
        position={[0, 0, 0]}
        args={[16, 16]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#1a2536"
        sectionSize={2.5}
        sectionThickness={1.2}
        sectionColor={stateColor}
        fadeDistance={18}
        fadeStrength={1}
      />

      {/* Model grounded synchronously at Y=0 */}
      <Suspense fallback={null}>
        <SingleGlbGroundedNode url={url} />
      </Suspense>
    </Canvas>
  );
}
