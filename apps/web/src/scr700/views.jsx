import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ComposedChart,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Play, RotateCw,
  UploadCloud, BellRing, Wrench, Box, FlaskConical, GitCompare, FileText,
  Sparkles, CheckCircle2, XCircle, CalendarClock, Cpu, Gauge, Zap, Droplets, Wind,
  Activity, Target, ShieldCheck, CheckCircle, Clock, OctagonX, ChevronDown,
  SlidersHorizontal, Maximize2, Home, ArrowRight, Upload,
  Edit, X, Image, FileCode, Plus, Server,
  Pause, RotateCcw, RefreshCw, Trash2, Camera, Video, Minimize2, Lightbulb, Sun, Layers, Palette,
} from 'lucide-react';
import {
  MACHINES, ALARMS, AI_RECS, PROD_SERIES, OEE_SERIES, ENERGY_SERIES,
  PARETO, QUALITY_DONUT, MAINTENANCE, PARAM_SCENARIOS, REPORTS, USERS,
  MACHINE_IMAGES, PLANT_MAP, PLANTS, STATUS,
  DASH_KPIS, PROCESS_STATIONS, STATION_IMAGES, MACHINE_STATUS, AI_INSIGHTS,
  THROUGHPUT_BARS, PPM_SERIES, QUALITY_LEGEND,
} from './data';
import { Panel, Pill, Dot, Btn, statusColor, statusLabel, chartTheme } from './ui';
import { SingleMachineViewer3D } from './CadSandboxViewer3D';

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('es-MX', { maximumFractionDigits: 2 }) : n);

/* ---------------- Dashboard (Centro de Control) ---------------- */
const KPI_ICONS = {
  prod: Activity, oee: Target, avail: ShieldCheck, perf: Gauge, qual: CheckCircle,
  energy: Zap, water: Droplets, alarms: BellRing, stopped: OctagonX, mtbf: Clock,
};

function DashKpiCard({ k, i }) {
  const c = statusColor(k.status);
  const Icon = KPI_ICONS[k.icon] || Activity;
  const hasTrend = typeof k.trend === 'number';
  const up = k.trend > 0;
  const TrendIcon = up ? TrendingUp : TrendingDown;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.025, duration: 0.3, ease: 'easeOut' }}
      className="rounded-xl border px-3 py-3 flex flex-col"
      style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[9.5px] uppercase tracking-[0.08em] text-slate-400 font-semibold leading-tight">{k.label}</span>
        <Icon size={15} color={c} strokeWidth={2} className="shrink-0" />
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="scr-display text-[22px] font-bold text-slate-50 leading-none">{k.value}</span>
        {k.unit && <span className="text-[11px] text-slate-500">{k.unit}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px]">
        {hasTrend ? (
          <span className="flex items-center gap-0.5 font-medium" style={{ color: up ? '#22c55e' : '#ef4444' }}>
            <TrendIcon size={11} /> {Math.abs(k.trend)}%
          </span>
        ) : (
          <span className="font-medium" style={{ color: k.subColor || 'var(--scr-text-400)' }}>{k.sub}</span>
        )}
        {hasTrend && <span className="scr-mono text-slate-500">{k.sub}</span>}
      </div>
    </motion.div>
  );
}

function Sparkbars({ data, color = '#22d3ee', h = 34 }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[2px]" style={{ height: h }}>
      {data.map((v, i) => (
        <span key={i} className="rounded-[1px]" style={{ width: 4, height: `${(v / max) * 100}%`, background: color, opacity: 0.45 + (v / max) * 0.55 }} />
      ))}
    </div>
  );
}

const STATE_META = {
  run: { label: 'Operando', color: '#22c55e' },
  wait: { label: 'En espera', color: '#f5c518' },
  alarm: { label: 'Alarma', color: '#ef4444' },
  maint: { label: 'Mantenimiento', color: '#3b82f6' },
  off: { label: 'Desconectado', color: '#64748b' },
};

function ProcessStation({ st, i, editorMode, asset, onEdit }) {
  const meta = st.state ? STATE_META[st.state] : null;
  const c = meta ? meta.color : '#3b82f6';
  
  const isModel = asset && asset.type === 'model' && !!asset.value;
  const assetUrl = (asset && asset.value) ? asset.value : STATION_IMAGES[st.img];
  const rotate = asset ? asset.rotate !== false : true;
  const hueRotate = asset ? asset.hueRotate || 0 : 0;
  const filterStyle = hueRotate ? `hue-rotate(${hueRotate}deg)` : undefined;
  
  const tScale = asset?.metadata?.scale ?? 1;
  const tX = asset?.metadata?.posX ?? 0;
  const tY = asset?.metadata?.posY ?? 0;
  const tZ = asset?.metadata?.posZ ?? 0;
  const transformStyle = `translate3d(${tX}px, ${tY}px, ${tZ}px) scale(${tScale})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
      className="relative flex flex-col items-center shrink-0 group cursor-pointer"
      style={{ width: 210 }}
      onClick={onEdit}
    >
      <div className="relative h-[160px] w-[190px] grid place-items-center" style={{ perspective: '1000px' }}>
        {/* Ground shadow oval */}
        <span
          className="absolute bottom-2 left-1/2 -translate-x-1/2"
          style={{ width: 145, height: 32, borderRadius: '50%', background: `radial-gradient(ellipse at center, ${c}44, transparent 70%)`, filter: 'blur(4px)' }}
        />
        <span
          className="absolute bottom-3 left-1/2 -translate-x-1/2"
          style={{ width: 125, height: 20, borderRadius: '50%', border: `1px solid ${c}55`, boxShadow: `0 0 14px ${c}33` }}
        />
        
        {isModel ? (
          <div
            style={{ width: '180px', height: '155px', filter: filterStyle, transform: transformStyle, transition: 'transform 0.2s ease-out' }}
            className="relative drop-shadow-[0_12px_24px_rgba(0,0,0,0.75)] flex items-center justify-center"
          >
            <model-viewer
              src={assetUrl}
              alt={st.name}
              shadow-intensity="1.6"
              shadow-softness="0.5"
              exposure="1.15"
              render-scale="2"
              quality-policy="high"
              interaction-prompt="none"
              camera-orbit="0deg 80deg 105%"
              min-camera-orbit="0deg 80deg 105%"
              max-camera-orbit="0deg 80deg 105%"
              field-of-view="28deg"
              disable-zoom
              disable-pan
              disable-tap
              style={{ width: '180px', height: '155px', background: 'transparent', pointerEvents: 'none', imageRendering: '-webkit-optimize-contrast' }}
            />
          </div>
        ) : (
          <img 
            src={assetUrl} 
            alt={st.name} 
            style={{ 
              filter: `${filterStyle || ''} contrast(1.06) brightness(1.04)`, 
              transform: `${transformStyle} translateZ(0)`, 
              transition: 'transform 0.2s ease-out',
              imageRendering: '-webkit-optimize-contrast',
              WebkitBackfaceVisibility: 'hidden'
            }} 
            className="relative h-[155px] w-[180px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.75)] hover:scale-105" 
          />
        )}

        <div className="absolute inset-0 bg-[#05080d]/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-cyan-500 text-[#05080d] p-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-lg">
            {editorMode ? <><Edit size={12} /> EDITAR 3D / FICHA</> : <><Maximize2 size={12} /> VER EQUIPO</>}
          </div>
        </div>
      </div>
      <div className="mt-6 text-center px-1 flex flex-col items-center w-full">
        <div className="flex items-start justify-center gap-1.5 min-h-[40px]">
          {st.num && <span className="scr-mono text-[14px] font-bold" style={{ color: c, marginTop: '2px' }}>{st.num}</span>}
          <span className="scr-display text-[13px] font-bold text-slate-100 whitespace-pre-line leading-tight max-w-[150px] drop-shadow-md">{asset?.metadata?.name || st.name}</span>
        </div>
        {meta && (
          <div className="mt-0 flex items-center justify-center gap-1.5 text-[11.5px] font-bold tracking-wide" style={{ color: meta.color }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
            {meta.label}
          </div>
        )}
        {asset?.metadata && (
          <div className="mt-3 flex flex-col items-center gap-2.5 border-t border-slate-700/60 pt-3 w-full">
            {asset.metadata.capacityValue && (
              <span className="text-[11px] text-slate-200 font-bold whitespace-nowrap bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-600 shadow-lg">
                Cap: <span className="text-cyan-400 font-bold scr-mono text-[13px]">{asset.metadata.capacityValue}</span> <span className="text-slate-400">{asset.metadata.capacityUnit || 'u/h'}</span>
              </span>
            )}
            {(asset.metadata.power || asset.metadata.water || asset.metadata.air) && (
              <div className="flex items-center gap-3 mt-0.5 bg-[#05080d]/90 px-3 py-2 rounded-full border border-[#1e3a5f]/60 shadow-lg">
                {asset.metadata.power && <Zap size={14} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]" title="Energía Eléctrica" />}
                {asset.metadata.water && <Droplets size={14} className="text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.9)]" title="Agua" />}
                {asset.metadata.air && <Wind size={14} className="text-slate-200 drop-shadow-[0_0_6px_rgba(203,213,225,0.9)]" title="Aire Comprimido" />}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProcessView({ 
  theme = 'dark', 
  editorMode = false,
  stationAssets = {},
  onSaveStationAsset,
  onResetStationAsset,
  onOpenSandbox
}) {
  // Determine background gradient based on theme
  const isDark = theme === 'dark';
  
  const bgGradient = isDark 
    ? 'radial-gradient(ellipse at 50% 120%, rgba(34,211,238,0.08), transparent 60%), linear-gradient(180deg,#070b12,#0a1220)'
    : 'radial-gradient(ellipse at 50% 120%, rgba(8,182,212,0.06), transparent 60%), linear-gradient(180deg,#f1f5f9,#e2e8f0)';
  
  const metricsBoxBg = isDark 
    ? 'rgba(11,17,26,0.85)'
    : 'rgba(255,255,255,0.9)';
  
  const metricsTextColor = isDark ? '#f1f5f9' : '#0f172a';
  const metricsLabelColor = isDark ? '#64748b' : '#475569';
  const metricsThroughputColor = isDark ? '#67e8f9' : '#0e7490';

  const [editingStation, setEditingStation] = useState(null);
  
  const [activeStations, setActiveStations] = useState(() => {
    try {
      const saved = localStorage.getItem('scr700-active-stations');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return PROCESS_STATIONS;
  });

  const [stationSpacing, setStationSpacing] = useState(() => {
    try {
      const saved = localStorage.getItem('scr700-station-spacing');
      if (saved) return parseInt(saved);
    } catch(e) {}
    return 200;
  });

  useEffect(() => {
    localStorage.setItem('scr700-active-stations', JSON.stringify(activeStations));
  }, [activeStations]);

  useEffect(() => {
    localStorage.setItem('scr700-station-spacing', stationSpacing.toString());
  }, [stationSpacing]);

  const handleSaveAsset = (stationId, asset) => {
    if (onSaveStationAsset) {
      onSaveStationAsset(stationId, asset);
    }
    setEditingStation(null);
  };

  const handleResetAsset = (stationId) => {
    if (onResetStationAsset) {
      onResetStationAsset(stationId);
    }
    setEditingStation(null);
  };

  return (
    <Panel pad={false} className="overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b flex-wrap" style={{ borderColor: 'var(--scr-border)' }}>
        <h3 className="scr-display text-[13px] font-semibold tracking-wide text-slate-200 uppercase">Vista de Proceso — Línea 1 Ensamble</h3>
        <div className="flex items-center gap-3 flex-wrap ml-1">
          {Object.values(STATE_META).map((s) => (
            <span key={s.label} className="flex items-center gap-1 text-[10.5px] text-slate-400">
              <span style={{ width: 7, height: 7, borderRadius: 99, background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid var(--scr-border)' }}>
            <span className="text-slate-500">Vista</span> Flujo de Proceso <ChevronDown size={13} className="text-slate-500" />
          </div>
          <button className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-200" style={{ border: '1px solid var(--scr-border)' }}><SlidersHorizontal size={14} /></button>
          <button 
            onClick={onOpenSandbox}
            className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-200 active:scale-95 transition-all" 
            style={{ border: '1px solid var(--scr-border)' }}
            title="Abrir Visor CAD Sandbox"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </header>
      <div className="relative" style={{ background: bgGradient }}>
        {/* grid floor */}
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)', backgroundSize: '46px 46px', maskImage: 'linear-gradient(180deg, transparent, black 40%, black)' }} />
        <div className="relative overflow-x-auto pt-6 pb-6 px-4">
          {editorMode && (
            <div className="flex justify-center mb-6 sticky left-0 right-0">
              <div className="bg-[#05080d]/80 border border-[#1e3a5f] rounded-lg px-4 py-2 flex items-center gap-4 shadow-[0_0_15px_rgba(34,211,238,0.15)] backdrop-blur-md">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Distancia entre equipos</span>
                <input 
                  type="range" min="0" max="300" step="5" value={stationSpacing} 
                  onChange={e => setStationSpacing(parseInt(e.target.value))}
                  className="w-48 h-1.5 bg-slate-800 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 font-mono w-8">{stationSpacing}px</span>
              </div>
            </div>
          )}
          <div className="flex items-start gap-1 min-w-max mx-auto w-fit relative" style={{ perspective: '1200px' }}>
            {/* Single Unified 3D CAD Floor Grid Plane under entire process line */}
            <div 
              className="absolute -left-6 -right-6 top-[152px] h-[105px] pointer-events-none select-none z-0"
              style={{
                transform: 'rotateX(76deg)',
                transformOrigin: '50% 0%',
                background: `
                  linear-gradient(to right, rgba(34,211,238,0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(34,211,238,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
                border: '1px solid rgba(34,211,238,0.6)',
                boxShadow: '0 0 30px rgba(34,211,238,0.2), inset 0 0 20px rgba(34,211,238,0.15)',
                borderRadius: '4px'
              }}
            >
              {/* Continuous Center Axis Line */}
              <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-cyan-400/80" />
              {/* CAD Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
            </div>

            {activeStations.map((st, i) => (
              <React.Fragment key={st.id}>
                <div className="relative group/station">
                  <ProcessStation
                    st={st}
                    i={i}
                    editorMode={editorMode}
                    asset={stationAssets[st.id]}
                    onEdit={() => setEditingStation(st)}
                  />
                  {editorMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveStations(activeStations.filter(s => s.id !== st.id)); }}
                      className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 p-1.5 rounded-full opacity-0 group-hover/station:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-50 shadow-lg border border-red-500/50"
                      title="Ocultar Estación"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {i < activeStations.length - 1 && (
                  <svg width={stationSpacing} height="16" className="shrink-0 mt-[132px] overflow-visible">
                    <line x1="0" y1="8" x2={stationSpacing} y2="8" stroke="#0891b2" strokeWidth="1.5" opacity="0.6" />
                    {stationSpacing >= 30 && (
                      <g transform={`translate(${stationSpacing / 2}, 8)`} style={{ filter: 'drop-shadow(0 0 5px #22d3ee)' }}>
                        <motion.g
                          initial={{ x: -15, opacity: 0 }}
                          animate={{ x: 15, opacity: [0, 1, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        >
                          <polyline points="-12,-5 -5,0 -12,5" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="-3,-5 4,0 -3,5" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="6,-5 13,0 6,5" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.g>
                      </g>
                    )}
                  </svg>
                )}
              </React.Fragment>
            ))}
            {editorMode && (
               <div className="flex items-start ml-2 h-[130px] items-center">
                 <button
                   onClick={() => {
                     const newId = 's' + Date.now();
                     const num = activeStations.length > 0 ? String(activeStations.length).padStart(2, '0') : '01';
                     setActiveStations([...activeStations, { id: newId, num, name: 'Nueva Estación', img: 'feeder', state: 'run' }]);
                   }}
                   className="h-[80px] w-12 rounded-xl border border-dashed border-cyan-500/40 flex items-center justify-center text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all cursor-pointer"
                   title="Agregar Estación"
                 >
                   <div className="bg-cyan-500/20 p-2 rounded-full"><Plus size={16} /></div>
                 </button>
               </div>
            )}
          </div>
        </div>
        {/* metrics panel — below the process visualization, non-overlapping */}
        <div className="relative px-4 pb-4">
          <div className="rounded-xl border px-4 py-3 inline-flex flex-wrap items-center gap-6 sm:gap-8" style={{ background: metricsBoxBg, borderColor: 'var(--scr-border)' }}>
            <div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: metricsLabelColor }}>WIP Actual</div>
              <div className="scr-display text-lg font-bold mt-0.5" style={{ color: metricsTextColor }}>128 <span className="text-[10px] font-normal" style={{ color: metricsLabelColor }}>u</span></div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: metricsLabelColor }}>Tiempo Takt</div>
              <div className="scr-display text-lg font-bold mt-0.5" style={{ color: metricsTextColor }}>58.6 <span className="text-[10px] font-normal" style={{ color: metricsLabelColor }}>s</span></div>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <div className="text-[9px] uppercase tracking-wide" style={{ color: metricsLabelColor }}>Rendimiento</div>
                <div className="scr-display text-base font-bold mt-0.5" style={{ color: metricsThroughputColor }}>1,152 <span className="text-[10px] font-normal" style={{ color: metricsLabelColor }}>u/h</span></div>
              </div>
              <Sparkbars data={THROUGHPUT_BARS} h={28} />
            </div>
          </div>
        </div>
      </div>

      <StationAssetEditorDialog
        open={!!editingStation}
        onClose={() => setEditingStation(null)}
        station={editingStation}
        currentAsset={editingStation ? stationAssets[editingStation.id] : null}
        onSave={(asset) => handleSaveAsset(editingStation.id, asset)}
        onReset={() => handleResetAsset(editingStation.id)}
        editorMode={editorMode}
      />
    </Panel>
  );
}

function SectionHead({ title, action = 'Ver todas' }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--scr-border)' }}>
      <h3 className="scr-display text-[13px] font-semibold tracking-wide text-slate-200 uppercase">{title}</h3>
      <button className="text-[11px] text-cyan-400 hover:text-cyan-300">{action}</button>
    </header>
  );
}

function TodayTag() {
  return <span className="flex items-center gap-1 text-[11px] text-slate-300 px-2 py-1 rounded-md" style={{ border: '1px solid var(--scr-border)' }}>Hoy <ChevronDown size={12} className="text-slate-500" /></span>;
}

function ProductionPanel() {
  return (
    <section className="rounded-xl border flex flex-col" style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}>
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--scr-border)' }}>
        <h3 className="scr-display text-[13px] font-semibold tracking-wide text-slate-200 uppercase">Producción — Real vs Objetivo</h3>
        <TodayTag />
      </header>
      <div className="p-3 flex-1">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={PROD_SERIES} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="h" stroke={chartTheme.axis} fontSize={10} tickLine={false} />
            <YAxis stroke={chartTheme.axis} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip {...chartTheme.tooltip} />
            <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            <Bar dataKey="real" name="Real" fill="#22d3ee" radius={[2, 2, 0, 0]} barSize={14} />
            <Line dataKey="target" name="Objetivo" stroke="var(--scr-text-400)" strokeWidth={1.6} dot={false} strokeDasharray="5 4" />
            <Line dataKey="sim" name="Simulación" stroke="#a855f7" strokeWidth={1.8} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 border-t divide-x" style={{ borderColor: 'var(--scr-border)' }}>
        {[['Total Producido', '8,420 u'], ['Objetivo', '9,000 u'], ['Diferencia', '-580 u', '#ef4444'], ['OEE Promedio', '78.4 %']].map(([l, v, col]) => (
          <div key={l} className="px-3 py-2.5" style={{ borderColor: 'var(--scr-border)' }}>
            <div className="text-[9px] uppercase tracking-wide text-slate-500">{l}</div>
            <div className="scr-display text-[15px] font-bold mt-0.5" style={{ color: col || '#f1f5f9' }}>{v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QualityPanel() {
  return (
    <section className="rounded-xl border flex flex-col" style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}>
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--scr-border)' }}>
        <h3 className="scr-display text-[13px] font-semibold tracking-wide text-slate-200 uppercase">Calidad del Turno</h3>
        <TodayTag />
      </header>
      <div className="p-4 flex items-center gap-4">
        <div className="relative" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={QUALITY_DONUT} dataKey="value" innerRadius={44} outerRadius={62} paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                {QUALITY_DONUT.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <div className="scr-display text-xl font-bold text-emerald-400 leading-none">96.7<span className="text-xs">%</span></div>
              <div className="text-[9px] text-slate-400 mt-0.5">Conforme</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {QUALITY_LEGEND.map((q) => (
            <div key={q.name} className="flex items-start gap-2">
              <span className="mt-1" style={{ width: 8, height: 8, borderRadius: 2, background: q.color }} />
              <div className="leading-tight">
                <div className="text-[12px] text-slate-300">{q.name}</div>
                <div className="scr-mono text-[11px] text-slate-100 font-semibold">{q.pct} <span className="text-slate-500 font-normal">({q.qty})</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t px-4 py-2.5 flex items-center gap-3" style={{ borderColor: 'var(--scr-border)' }}>
        <div>
          <div className="text-[9px] uppercase tracking-wide text-slate-500">PPM</div>
          <div className="scr-display text-base font-bold text-slate-50">1,240</div>
        </div>
        <div className="flex-1 h-9">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PPM_SERIES} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
              <Line dataKey="v" stroke="#22d3ee" strokeWidth={1.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function MachineStatusPanel() {
  return (
    <section className="rounded-xl border flex flex-col" style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}>
      <SectionHead title="Estado de Máquinas" />
      <div className="px-4 py-2 grid grid-cols-[1fr_auto_auto] gap-x-4 text-[9px] uppercase tracking-wide text-slate-500 border-b" style={{ borderColor: 'var(--scr-border)' }}>
        <span>Máquina</span><span>Estado</span><span className="text-right">OEE</span>
      </div>
      <div className="divide-y flex-1" style={{ borderColor: 'var(--scr-border)' }}>
        {MACHINE_STATUS.map((m) => {
          const meta = STATE_META[m.state];
          return (
            <div key={m.num} className="px-4 py-2.5 grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
              <span className="text-[12px] text-slate-200"><span className="scr-mono text-slate-500 mr-1.5">{m.num}</span>{m.name}</span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: meta.color }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} /> {meta.label}
              </span>
              <span className="scr-mono text-[12px] text-slate-300 text-right w-12">{m.oee}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InsightsPanel() {
  return (
    <section className="rounded-xl border flex flex-col" style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}>
      <SectionHead title="Insights de IA" />
      <div className="divide-y flex-1" style={{ borderColor: 'var(--scr-border)' }}>
        {AI_INSIGHTS.map((a) => (
          <div key={a.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-wide" style={{ color: a.color }}>{a.tag}</span>
              <span className="scr-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0" style={{ color: a.badgeColor, background: `${a.badgeColor}1a`, border: `1px solid ${a.badgeColor}44` }}>{a.badge}</span>
            </div>
            <div className="flex items-end justify-between gap-3 mt-1.5">
              <p className="text-[11px] text-slate-400 leading-snug flex-1">{a.text}</p>
              {a.chart && <Sparkbars data={[30, 45, 40, 55, 50, 62, 58, 70]} h={26} />}
              {a.gauge && <Gauge size={26} className="text-red-400 shrink-0" />}
              {a.energy && <Zap size={22} className="text-emerald-400 shrink-0" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardView({ 
  theme = 'dark', 
  editorMode = false, 
  stationAssets = {}, 
  onSaveStationAsset, 
  onResetStationAsset,
  onOpenSandbox
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-2.5">
        {DASH_KPIS.map((k, i) => <DashKpiCard key={k.id} k={k} i={i} />)}
      </div>
      <ProcessView 
        theme={theme} 
        editorMode={editorMode} 
        stationAssets={stationAssets}
        onSaveStationAsset={onSaveStationAsset}
        onResetStationAsset={onResetStationAsset}
        onOpenSandbox={onOpenSandbox}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <ProductionPanel />
        <QualityPanel />
        <MachineStatusPanel />
        <InsightsPanel />
      </div>
    </div>
  );
}

/* ---------------- Digital Twin / Plant map ---------------- */
export function TwinView({ onSelectMachine, selected }) {
  return (
    <div className="space-y-4">
      <Panel
        title="Gemelo Digital — Planta Norte (vista 2D/3D)"
        right={<div className="flex gap-2"><Btn variant="ghost" icon={RotateCw}>Rotar</Btn><Btn variant="ghost" icon={GitCompare}>Real vs Simulación</Btn><Btn variant="primary" icon={Play}>Reproducir histórico</Btn></div>}
        pad={false}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-b-xl">
          <img src={PLANT_MAP} alt="Layout de planta" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(7,10,16,0.2), rgba(7,10,16,0.85))' }} />
          <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
            <line x1="18%" y1="30%" x2="40%" y2="22%" stroke="#22d3ee" strokeWidth="2" className="scr-flow" opacity="0.6" />
            <line x1="40%" y1="22%" x2="66%" y2="34%" stroke="#22d3ee" strokeWidth="2" className="scr-flow" opacity="0.6" />
            <line x1="26%" y1="66%" x2="52%" y2="70%" stroke="#3b82f6" strokeWidth="2" className="scr-flow" opacity="0.6" />
          </svg>
          {MACHINES.map((m) => {
            const c = statusColor(m.status);
            const active = selected?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMachine(m)}
                style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%,-50%)' }}
                className="absolute group"
              >
                <span
                  className={`flex items-center justify-center rounded-lg border-2 transition-all ${active ? 'scale-110' : 'group-hover:scale-110'}`}
                  style={{ width: 40, height: 40, borderColor: c, background: 'rgba(14,24,38,0.9)', boxShadow: active ? `0 0 16px ${c}` : `0 0 8px ${c}88` }}
                >
                  <Dot status={m.status} live={m.status === 'critical'} size={12} />
                </span>
                <span className="scr-mono absolute left-1/2 -translate-x-1/2 mt-1 text-[10px] text-slate-300 whitespace-nowrap px-1 rounded" style={{ background: 'rgba(7,10,16,0.7)', color: '#e2e8f0' }}>{m.id}</span>
              </button>
            );
          })}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {Object.values(STATUS).map((s) => (
              <span key={s.key} className="flex items-center gap-1 text-[10px] text-slate-300 px-1.5 py-0.5 rounded" style={{ background: 'rgba(7,10,16,0.7)', color: '#e2e8f0' }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color }} /> {s.label}
              </span>
            ))}
          </div>
        </div>
      </Panel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Flujo de material', '1 180 u/h', Box, '#22d3ee'], ['Flujo de energía', '1 240 kWh', Zap, '#f5c518'], ['Flujo de agua', '38.2 m³', Droplets, '#3b82f6'], ['Flujo de aire', '6.4 bar', Gauge, '#22c55e']].map(([l, v, Ic, c]) => (
          <div key={l} className="rounded-xl border p-3.5" style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}>
            <Ic size={18} color={c} />
            <div className="scr-display text-lg font-bold text-slate-50 mt-2">{v}</div>
            <div className="text-[11px] text-slate-400">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Machines grid ---------------- */
export function MachinesView({ onSelectMachine }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {MACHINES.map((m, i) => (
        <motion.button
          key={m.id} onClick={() => onSelectMachine(m)}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="text-left rounded-xl border overflow-hidden group"
          style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}
        >
          <div className="relative h-36 overflow-hidden">
            <img src={MACHINE_IMAGES[m.img]} alt={m.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent,rgba(14,24,38,0.9))' }} />
            <div className="absolute top-2 left-2"><Pill color={statusColor(m.status)} filled>{statusLabel(m.status)}</Pill></div>
            {m.alarms > 0 && <div className="absolute top-2 right-2"><Pill color="#ef4444"><BellRing size={10} className="inline scr-blink" /> {m.alarms}</Pill></div>}
          </div>
          <div className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="scr-display font-semibold text-slate-100 text-[14px]">{m.name}</span>
              <span className="scr-mono text-[11px] text-slate-500">{m.id}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{m.model}</div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {[['Vel', m.speed], ['Temp', `${m.temp}°`], ['Pot', `${m.power}kW`]].map(([l, v]) => (
                <div key={l} className="rounded-lg py-1.5" style={{ background: 'var(--scr-panel-2)' }}>
                  <div className="scr-mono text-[13px] text-cyan-300">{v}</div>
                  <div className="text-[9px] text-slate-500 uppercase">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/* ---------------- Analytics ---------------- */
const TIME_FILTERS = ['1h', '8h', '24h', '7d', '30d'];
export function AnalyticsView() {
  const [tf, setTf] = useState('8h');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-slate-400">Rango:</span>
        {TIME_FILTERS.map((t) => (
          <button key={t} onClick={() => setTf(t)} className="scr-mono text-[12px] px-3 py-1.5 rounded-lg transition-colors"
            style={t === tf ? { background: 'linear-gradient(180deg,#22d3ee,#3b82f6)', color: '#05080d' } : { background: 'var(--scr-panel-2)', color: 'var(--scr-text-400)', border: '1px solid var(--scr-border)' }}>{t}</button>
        ))}
        <div className="ml-auto flex gap-2"><Btn variant="ghost" icon={GitCompare}>Comparar</Btn><Btn variant="ghost" icon={FileText}>Exportar</Btn></div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Energía y agua">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={ENERGY_SERIES}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis dataKey="h" stroke={chartTheme.axis} fontSize={11} />
              <YAxis yAxisId="l" stroke={chartTheme.axis} fontSize={11} />
              <YAxis yAxisId="r" orientation="right" stroke={chartTheme.axis} fontSize={11} />
              <Tooltip {...chartTheme.tooltip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="energia" name="Energía kWh" fill="#f5c518" radius={[3, 3, 0, 0]} barSize={16} />
              <Line yAxisId="r" dataKey="agua" name="Agua m³" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Pareto de paros (min)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PARETO} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis type="number" stroke={chartTheme.axis} fontSize={11} />
              <YAxis type="category" dataKey="causa" stroke={chartTheme.axis} fontSize={10} width={110} />
              <Tooltip {...chartTheme.tooltip} />
              <Bar dataKey="min" name="Minutos" fill="#ef4444" radius={[0, 3, 3, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="OEE por hora">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={OEE_SERIES}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis dataKey="h" stroke={chartTheme.axis} fontSize={11} />
              <YAxis domain={[70, 100]} stroke={chartTheme.axis} fontSize={11} />
              <Tooltip {...chartTheme.tooltip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="disp" name="Disp" stroke="#22d3ee" strokeWidth={2} dot={false} />
              <Line dataKey="perf" name="Rend" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line dataKey="qual" name="Cal" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="MTBF / MTTR por máquina (h)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MACHINES.map((m) => ({ id: m.id, mtbf: 100 + (m.temp % 90), mttr: 2 + (m.alarms * 1.5) }))}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis dataKey="id" stroke={chartTheme.axis} fontSize={10} />
              <YAxis stroke={chartTheme.axis} fontSize={11} />
              <Tooltip {...chartTheme.tooltip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="mtbf" name="MTBF" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="mttr" name="MTTR" fill="#f5c518" radius={[3, 3, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- SCR Intelligence (AI) ---------------- */
export function IntelligenceView() {
  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-start gap-3">
          <div className="rounded-xl p-2.5" style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7)' }}><Sparkles size={22} color="#05080d" /></div>
          <div>
            <h3 className="scr-display text-slate-100 font-semibold text-[15px]">Inteligencia SCR</h3>
            <p className="text-[13px] text-slate-400 mt-1 max-w-2xl">Detección de anomalías, predicción de fallas, análisis de causa raíz y optimización de velocidad, energía, agua, calidad y producción. La IA nunca ejecuta acciones críticas sin autorización.</p>
          </div>
        </div>
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AI_RECS.map((r) => (
          <Panel key={r.id}>
            <div className="flex items-center justify-between">
              <Pill color="#a855f7">{r.type}</Pill>
              <span className="scr-mono text-[11px] text-slate-500">{r.id}</span>
            </div>
            <h4 className="scr-display text-slate-100 font-semibold text-[14px] mt-2 leading-snug">{r.title}</h4>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[['Impacto', r.impact], ['Riesgo', r.risk], ['Confianza', `${r.confidence}%`]].map(([l, v]) => (
                <div key={l} className="rounded-lg p-2" style={{ background: 'var(--scr-panel-2)' }}>
                  <div className="text-[9px] text-slate-500 uppercase">{l}</div>
                  <div className="text-[12px] text-cyan-300 font-medium mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {r.vars.map((v) => <span key={v} className="scr-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded" style={{ background: 'var(--scr-panel-2)' }}>{v}</span>)}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Btn variant="ghost" icon={FlaskConical}>Simular</Btn>
              <Btn variant="primary" icon={CheckCircle2} confirm reason>Aprobar</Btn>
              <Btn variant="danger" icon={XCircle}>Rechazar</Btn>
              <Btn variant="ghost" icon={CalendarClock}>Programar</Btn>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Parametrics ---------------- */
export function ParametricsView() {
  const [sel, setSel] = useState('norm');
  const s = PARAM_SCENARIOS.find((x) => x.key === sel);
  return (
    <div className="space-y-4">
      <Panel title="Paramétricos — Escenarios" right={<Pill color="#22d3ee">acceso independiente</Pill>}>
        <div className="flex flex-wrap gap-2">
          {PARAM_SCENARIOS.map((x) => (
            <button key={x.key} onClick={() => setSel(x.key)} className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
              style={x.key === sel ? { background: 'linear-gradient(180deg,#22d3ee,#3b82f6)', color: '#05080d' } : { background: 'var(--scr-panel-2)', color: 'var(--scr-text-300)', border: '1px solid var(--scr-border)' }}>{x.name}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {[['Producción', fmt(s.prod), 'u/día'], ['OPEX', `$${s.opex}`, '/u'], ['CAPEX', `$${s.capex}M`, ''], ['ROI', `${s.roi}%`, ''], ['Balance de masas', `${s.mass}%`, '']].map(([l, v, u]) => (
            <div key={l} className="rounded-xl border p-3.5" style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}>
              <div className="text-[11px] text-slate-400 uppercase">{l}</div>
              <div className="scr-display text-xl font-bold text-slate-50 mt-1">{v}<span className="text-[11px] text-slate-500 ml-1">{u}</span></div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Comparativa de escenarios">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={PARAM_SCENARIOS}>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={11} />
            <YAxis yAxisId="l" stroke={chartTheme.axis} fontSize={11} />
            <YAxis yAxisId="r" orientation="right" stroke={chartTheme.axis} fontSize={11} />
            <Tooltip {...chartTheme.tooltip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="prod" name="Producción u/día" fill="#22d3ee" radius={[3, 3, 0, 0]} barSize={30} />
            <Bar yAxisId="r" dataKey="roi" name="ROI %" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

/* ---------------- Alarms ---------------- */
export function AlarmsView() {
  const [acked, setAcked] = useState({});
  return (
    <Panel title="Gestión de alarmas" pad={false}>
      <div className="divide-y" style={{ borderColor: 'var(--scr-border)' }}>
        {ALARMS.map((a) => {
          const isAck = a.ack || acked[a.id];
          return (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <Dot status={a.sev} live={a.sev === 'critical' && !isAck} />
              <span className="scr-mono text-[11px] text-slate-500 w-16">{a.ts}</span>
              <span className="scr-mono text-[11px] text-slate-400 w-16">{a.machine}</span>
              <span className="text-[13px] text-slate-200 flex-1">{a.title}</span>
              <Pill color={statusColor(a.sev)}>{statusLabel(a.sev)}</Pill>
              {isAck
                ? <span className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 size={13} /> Reconocida</span>
                : <Btn variant="ghost" icon={BellRing} confirm reason onClick={() => setAcked((p) => ({ ...p, [a.id]: true }))}>Reconocer</Btn>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ---------------- Maintenance ---------------- */
export function MaintenanceView() {
  const prioColor = { Alta: '#ef4444', Media: '#f5c518', Baja: '#22c55e' };
  return (
    <Panel title="Órdenes de mantenimiento" right={<Btn variant="primary" icon={Wrench} confirm reason>Solicitar mantenimiento</Btn>} pad={false}>
      <div className="divide-y" style={{ borderColor: 'var(--scr-border)' }}>
        {MAINTENANCE.map((w) => (
          <div key={w.id} className="flex items-center gap-3 px-4 py-3">
            <Wrench size={15} className="text-slate-500" />
            <span className="scr-mono text-[11px] text-slate-400 w-20">{w.id}</span>
            <span className="scr-mono text-[11px] text-slate-500 w-16">{w.machine}</span>
            <span className="text-[13px] text-slate-200 flex-1">{w.type}</span>
            <Pill color={prioColor[w.prio]}>{w.prio}</Pill>
            <span className="scr-mono text-[11px] text-slate-500 w-24 text-right">{w.due}</span>
            <span className="text-[11px] text-cyan-300 w-20 text-right">{w.status}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------- Energy ---------------- */
export function EnergyView() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Panel title="Consumo energético por hora">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={ENERGY_SERIES}>
            <defs><linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5c518" stopOpacity={0.4} /><stop offset="100%" stopColor="#f5c518" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="h" stroke={chartTheme.axis} fontSize={11} />
            <YAxis stroke={chartTheme.axis} fontSize={11} />
            <Tooltip {...chartTheme.tooltip} />
            <Area dataKey="energia" name="kWh" stroke="#f5c518" fill="url(#ge)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Consumo de agua (m³)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={ENERGY_SERIES}>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="h" stroke={chartTheme.axis} fontSize={11} />
            <YAxis stroke={chartTheme.axis} fontSize={11} />
            <Tooltip {...chartTheme.tooltip} />
            <Bar dataKey="agua" name="m³" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Eficiencia energética" className="xl:col-span-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['Costo energía', '$0.184', '/kWh'], ['Intensidad', '0.147', 'kWh/u'], ['Factor de potencia', '0.96', ''], ['Pico demanda', '312', 'kW']].map(([l, v, u]) => (
            <div key={l} className="rounded-xl p-3.5" style={{ background: 'var(--scr-panel-2)' }}>
              <div className="text-[11px] text-slate-400 uppercase">{l}</div>
              <div className="scr-display text-xl font-bold text-slate-50 mt-1">{v}<span className="text-[11px] text-slate-500 ml-1">{u}</span></div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Reports ---------------- */
export function ReportsView() {
  return (
    <Panel title="Reportes" right={<Btn variant="primary" icon={FileText}>Generar reporte</Btn>} pad={false}>
      <div className="divide-y" style={{ borderColor: 'var(--scr-border)' }}>
        {REPORTS.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <FileText size={16} className="text-cyan-400" />
            <span className="scr-mono text-[11px] text-slate-500 w-20">{r.id}</span>
            <span className="text-[13px] text-slate-200 flex-1">{r.name}</span>
            <Pill color="#3b82f6">{r.type}</Pill>
            <span className="scr-mono text-[11px] text-slate-500 w-16 text-right">{r.date}</span>
            <Btn variant="ghost" icon={UploadCloud}>Exportar</Btn>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------- Plants ---------------- */
export function PlantsView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PLANTS.map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="rounded-xl border p-4" style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}>
          <div className="flex items-center justify-between">
            <Cpu size={20} className="text-cyan-400" />
            <Dot status={i === 2 ? 'warning' : 'normal'} live />
          </div>
          <h3 className="scr-display font-semibold text-slate-100 mt-3">{p.name}</h3>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-lg p-2.5" style={{ background: 'var(--scr-panel-2)' }}><div className="scr-display text-lg font-bold text-slate-50">{p.lines}</div><div className="text-[10px] text-slate-500">Líneas</div></div>
            <div className="rounded-lg p-2.5" style={{ background: 'var(--scr-panel-2)' }}><div className="scr-display text-lg font-bold text-slate-50">{p.machines}</div><div className="text-[10px] text-slate-500">Máquinas</div></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------- Users ---------------- */
export function UsersView() {
  return (
    <Panel title="Usuarios y permisos" pad={false}>
      <div className="divide-y" style={{ borderColor: 'var(--scr-border)' }}>
        {USERS.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <span className="grid place-items-center rounded-full h-8 w-8 scr-display text-[12px] font-semibold text-cyan-300" style={{ background: 'var(--scr-panel-2)' }}>{u.name.split(' ').map((x) => x[0]).join('')}</span>
            <span className="text-[13px] text-slate-200 flex-1">{u.name}</span>
            <Pill color="#3b82f6">{u.role}</Pill>
            <span className="scr-mono text-[11px] text-slate-500 hidden sm:block w-28">{u.plant}</span>
            <span className="text-[11px] flex items-center gap-1" style={{ color: u.status === 'En línea' ? '#22c55e' : 'var(--scr-text-400)' }}><Dot status={u.status === 'En línea' ? 'normal' : 'offline'} /> {u.status}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------- Generic placeholder (Control de Proceso / Producción / Config) ---------------- */
export function GenericView({ title, desc }) {
  return (
    <Panel title={title}>
      <div className="py-10 text-center">
        <Gauge size={34} className="mx-auto text-slate-600" />
        <p className="text-slate-400 text-[13px] mt-3 max-w-md mx-auto">{desc}</p>
      </div>
    </Panel>
  );
}

export function StationOperationDialog({ open, onClose, station, currentAsset, onSave }) {
  const assetUrl = currentAsset ? currentAsset.value : STATION_IMAGES[station?.img];
  const isModel = currentAsset && currentAsset.type === 'model';
  const filterStyle = (currentAsset && currentAsset.hueRotate) ? `hue-rotate(${currentAsset.hueRotate}deg)` : undefined;
  
  const initialCap = currentAsset?.metadata?.capacityValue ? parseFloat(currentAsset.metadata.capacityValue.toString().replace(/,/g,'')) : 950;
  const initialUnit = currentAsset?.metadata?.capacityUnit || 'kg/h';
  
  const [speed, setSpeed] = useState(72);
  const [capacity, setCapacity] = useState(initialCap);
  const [unit, setUnit] = useState(initialUnit);
  const [feedLevel, setFeedLevel] = useState(72);
  const [amps, setAmps] = useState(122);
  const [isRunning, setIsRunning] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modelRef = React.useRef(null);

  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!open || !station) return null;

  const stationName = currentAsset?.metadata?.name || station.name;
  
  // Computations
  const computedProduction = isRunning ? (capacity * (speed / 100)).toFixed(1) : "0.0";
  // Visual rotation capped at 10 RPM (10 * 360 / 60 = 60 deg/sec) to avoid dizzying effects
  const visualRpm = Math.min(speed, 10);
  const rotationPerSecond = isAutoRotating ? `${visualRpm * 6}deg` : '0deg';
  
  const handleSaveConfig = () => {
    if (onSave) {
      onSave({
        ...currentAsset,
        metadata: {
          ...currentAsset?.metadata,
          capacityValue: capacity.toString(),
          capacityUnit: unit
        }
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(3, 6, 12, 0.6)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[1200px] h-[90vh] max-h-[800px] rounded-xl border flex flex-col overflow-hidden shadow-2xl relative"
          style={{ 
             background: 'linear-gradient(180deg, rgba(7, 12, 20, 0.9), rgba(4, 7, 12, 0.95))',
             borderColor: 'rgba(34, 211, 238, 0.3)',
             boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 24px 48px rgba(0,0,0,0.8)'
          }}
        >
          {/* Header */}
          <div className="flex-none px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(34,211,238,0.2)' }}>
            <div className="flex items-center gap-4">
              <div className="rounded-lg p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Gauge size={24} />
              </div>
              <div>
                <h4 className="scr-display font-bold text-lg text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] uppercase">
                  PANEL DE OPERACIÓN — {stationName}
                </h4>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Configuración operativa interactiva y simulación en tiempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-4">
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 scr-blink" /> Conectado</span>
                <span className="text-[10px] text-slate-500 scr-mono">SYS-ONLINE</span>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-[#05080d] p-2 rounded-md border border-[#1e3a5f]/50"><X size={20} /></button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                ['PRODUCCIÓN', computedProduction, unit, Activity, '#22d3ee'],
                ['CARGA MOTOR', isRunning ? '68' : '0', '%', Gauge, '#3b82f6'],
                ['VELOCIDAD', isRunning ? speed.toString() : '0', 'rpm', RotateCw, '#22c55e'],
                ['TORQUE', isRunning ? '1,250' : '0', 'Nm', Target, '#f5c518'],
                ['PRESIÓN', isRunning ? '118' : '0', 'bar', Droplets, '#3b82f6'],
                ['TEMP.', isRunning ? '54' : '22', '°C', Lightbulb, '#ef4444'],
                ['CONSUMO', isRunning ? '125.6' : '1.2', 'kW', Zap, '#a855f7'],
                ['ALARMAS', '0', 'activas', BellRing, '#22c55e'],
              ].map(([l, v, u, Ic, c], idx) => (
                <div key={idx} className="rounded-lg border p-3 flex flex-col relative overflow-hidden" style={{ borderColor: 'rgba(30,58,95,0.6)', background: 'rgba(5,8,13,0.5)' }}>
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    {l}
                    <Ic size={12} color={c} opacity={0.8} />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="scr-display font-bold text-xl text-slate-100">{v}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{u}</span>
                  </div>
                  {/* Fake sparkline */}
                  <div className="absolute bottom-0 left-0 right-0 h-4 opacity-30">
                    <svg width="100%" height="100%" preserveAspectRatio="none"><path d={`M0,15 L10,12 L20,14 L30,5 L40,8 L50,14 L60,10 L70,12 L80,6 L90,10 L100,${isRunning ? '15' : '15'}`} fill="none" stroke={c} strokeWidth="1.5" /></svg>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[360px]">
              
              {/* Left: 3D Model / Status (Span 6) */}
              <div 
                className={`${isFullscreen ? 'absolute inset-0 z-[200] bg-[#05080d] border border-cyan-500/50 rounded-xl' : 'lg:col-span-6 border border-[#1e3a5f]/60 bg-[#05080d]/50 rounded-xl relative'} p-4 flex flex-col transition-all duration-300`}
              >
                <h5 className="text-[10px] uppercase tracking-wider text-cyan-500 font-bold">ESTADO DE LA MÁQUINA</h5>
                <div className="flex-1 relative mt-2 flex items-center justify-center min-h-[260px] h-full" style={{ perspective: '1000px' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/10 to-transparent pointer-events-none rounded-lg" />
                  {isModel ? (
                    <>
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[#05080d]/90 p-1.5 rounded-lg border border-[#1e3a5f]/60 shadow-xl">
                        <button
                          onClick={() => setIsAutoRotating(!isAutoRotating)}
                          className={`p-2 rounded-md transition-colors ${isAutoRotating ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-red-400'}`}
                          title={isAutoRotating ? 'Detener Rotación' : 'Activar Rotación'}
                        >
                          {isAutoRotating ? <RotateCw size={16} /> : <X size={16} />}
                        </button>
                        <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className={`p-2 rounded-md transition-colors ${isFullscreen ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-cyan-400'}`}
                          title="Pantalla Completa"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                      <SingleMachineViewer3D
                        url={assetUrl}
                        stateColor="#22d3ee"
                        isAutoRotating={isAutoRotating}
                      />
                    </>
                  ) : (
                    <>
                      {/* 2D Image fallback floor grid */}
                      <div 
                        className="absolute pointer-events-none select-none z-0"
                        style={{
                          top: '68%',
                          left: '50%',
                          width: '460px',
                          height: '160px',
                          transform: 'translate(-50%, -50%) rotateX(78deg)',
                          transformOrigin: '50% 50%',
                          background: `
                            linear-gradient(to right, rgba(34,211,238,0.3) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(34,211,238,0.3) 1px, transparent 1px)
                          `,
                          backgroundSize: '20px 20px',
                          border: '1px solid rgba(34,211,238,0.6)',
                          boxShadow: '0 0 30px rgba(34,211,238,0.2), inset 0 0 20px rgba(34,211,238,0.15)',
                          borderRadius: '4px'
                        }}
                      />
                      <img src={assetUrl} alt={stationName} className="max-h-full object-contain relative z-10" style={{ filter: filterStyle }} />
                    </>
                  )}
                  
                  {/* Overlay tags for effect */}
                  <div className="absolute top-2 left-2 bg-[#05080d]/80 border border-[#1e3a5f] p-2 rounded-lg backdrop-blur-sm shadow-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">ALIMENTACIÓN</div>
                    <div className="text-xs text-cyan-400 font-bold mt-0.5">Nivel: {feedLevel}%</div>
                  </div>
                  <div className="absolute bottom-4 right-2 bg-[#05080d]/80 border border-[#1e3a5f] p-2 rounded-lg backdrop-blur-sm shadow-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">SALIDA</div>
                    <div className={`text-xs font-bold mt-0.5 ${isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>{isRunning ? 'Flujo: OK' : 'DETENIDO'}</div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
                  <div className="flex items-center gap-2">
                    {isRunning ? <CheckCircle size={16} className="text-emerald-400" /> : <OctagonX size={16} className="text-red-400" />}
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">ESTADO GENERAL</div>
                      <div className={`text-xs font-bold uppercase ${isRunning ? 'text-emerald-400' : 'text-red-400'}`}>{isRunning ? 'OPERANDO NORMALMENTE' : 'PARO SOLICITADO'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-slate-500 uppercase">HORAS TOTALES</div>
                    <div className="text-xs text-slate-200 font-bold">1,256 h</div>
                  </div>
                </div>
              </div>

              {/* Middle: Controls (Span 3) */}
              <div className="lg:col-span-3 rounded-xl border p-4 flex flex-col space-y-4" style={{ borderColor: 'rgba(30,58,95,0.6)', background: 'rgba(5,8,13,0.5)' }}>
                <h5 className="text-[10px] uppercase tracking-wider text-cyan-500 font-bold">CONTROLES DE OPERACIÓN</h5>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button 
                    onClick={() => setIsRunning(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-lg border transition-all active:scale-95 shadow-inner" 
                    style={{ borderColor: isRunning ? 'rgba(34,197,94,0.8)' : 'rgba(34,197,94,0.3)', background: isRunning ? 'rgba(34,197,94,0.15)' : 'rgba(5,8,13,0.6)' }}
                  >
                    <Play size={24} className={`mb-2 ${isRunning ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'text-emerald-700'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isRunning ? 'text-emerald-400' : 'text-emerald-700'}`}>MARCHA</span>
                  </button>
                  <button 
                    onClick={() => setIsRunning(false)}
                    className="flex flex-col items-center justify-center p-4 rounded-lg border transition-all active:scale-95 shadow-inner" 
                    style={{ borderColor: !isRunning ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.3)', background: !isRunning ? 'rgba(239,68,68,0.15)' : 'rgba(5,8,13,0.6)' }}
                  >
                    <div className={`w-5 h-5 rounded-sm mb-2 ${!isRunning ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-red-900'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${!isRunning ? 'text-red-400' : 'text-red-800'}`}>PARO</span>
                  </button>
                </div>
                <button 
                  onClick={() => setIsRunning(false)}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border transition-all hover:bg-red-500/20 active:scale-95 w-full shadow-inner" 
                  style={{ borderColor: 'rgba(239,68,68,0.6)', background: 'rgba(239,68,68,0.15)' }}
                >
                  <OctagonX size={16} className="text-red-500" />
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest">PARO DE EMERGENCIA</span>
                </button>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border transition-all" style={{ borderColor: '#22d3ee', background: 'rgba(34,211,238,0.15)' }}>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">AUTO</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border transition-all hover:bg-slate-800" style={{ borderColor: 'rgba(30,58,95,0.5)', background: 'rgba(5,8,13,0.6)' }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MANUAL</span>
                  </button>
                </div>
              </div>

              {/* Right: Parameters (Span 3) */}
              <div className="lg:col-span-3 rounded-xl border p-4 flex flex-col space-y-4" style={{ borderColor: 'rgba(30,58,95,0.6)', background: 'rgba(5,8,13,0.5)' }}>
                <h5 className="text-[10px] uppercase tracking-wider text-cyan-500 font-bold flex justify-between items-center">
                  <span>PARÁMETROS OPERATIVOS</span>
                  <button onClick={handleSaveConfig} className="text-[9px] bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/30 transition-colors">Guardar Base</button>
                </h5>
                
                <div className="space-y-4 mt-2 flex-1">
                  
                  {/* Speed Slider */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-slate-400">Velocidad del rotor</span>
                      <span className="text-xs font-bold text-cyan-300">{speed} <span className="text-[9px] text-slate-500 font-normal">rpm</span></span>
                    </div>
                    <input 
                      type="range" min="10" max="100" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
                      style={{ background: `linear-gradient(to right, #06b6d4 ${speed}%, #1e293b ${speed}%)` }}
                    />
                    <div className="flex justify-between mt-1 text-[8px] text-slate-600"><span>10</span><span>100</span></div>
                  </div>

                  {/* Capacity Slider & Unit Selector */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-slate-400">Capacidad Base</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-cyan-300">{capacity}</span>
                        <select 
                          value={unit} onChange={(e) => setUnit(e.target.value)} 
                          className="text-[9px] bg-[#05080d] text-slate-300 border border-[#1e3a5f] rounded outline-none"
                        >
                          <option value="kg/h">kg/h</option>
                          <option value="m/min">m/min</option>
                          <option value="u/h">u/h</option>
                          <option value="ppm">PPM</option>
                        </select>
                      </div>
                    </div>
                    <input 
                      type="range" min="100" max="2500" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
                      style={{ background: `linear-gradient(to right, #06b6d4 ${(capacity/2500)*100}%, #1e293b ${(capacity/2500)*100}%)` }}
                    />
                    <div className="flex justify-between mt-1 text-[8px] text-slate-600"><span>100</span><span>2500</span></div>
                  </div>

                  {/* Feed Level Slider */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-slate-400">Nivel de alimentación</span>
                      <span className="text-xs font-bold text-cyan-300">{feedLevel} <span className="text-[9px] text-slate-500 font-normal">%</span></span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={feedLevel} onChange={(e) => setFeedLevel(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
                      style={{ background: `linear-gradient(to right, #06b6d4 ${feedLevel}%, #1e293b ${feedLevel}%)` }}
                    />
                    <div className="flex justify-between mt-1 text-[8px] text-slate-600"><span>0</span><span>100</span></div>
                  </div>

                  {/* Amps Level Slider */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-slate-400">Amperaje Motor</span>
                      <span className="text-xs font-bold text-cyan-300">{amps} <span className="text-[9px] text-slate-500 font-normal">A</span></span>
                    </div>
                    <input 
                      type="range" min="0" max="250" value={amps} onChange={(e) => setAmps(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
                      style={{ background: `linear-gradient(to right, #06b6d4 ${(amps/250)*100}%, #1e293b ${(amps/250)*100}%)` }}
                    />
                    <div className="flex justify-between mt-1 text-[8px] text-slate-600"><span>0</span><span>250</span></div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function StationAssetEditorDialog(props) {
  const { open, station, editorMode } = props;
  if (!open || !station) return null;
  if (!editorMode) {
    return <StationOperationDialog {...props} />;
  }
  return <StationAssetEditorContent {...props} />;
}

function StationAssetEditorContent({ open, onClose, station, currentAsset, onSave, onReset }) {
  const [assetType, setAssetType] = useState(currentAsset?.type || 'image');
  const [assetValue, setAssetValue] = useState(currentAsset?.value || '');
  const [urlInput, setUrlInput] = useState(currentAsset?.value && !currentAsset.value.startsWith('data:') ? currentAsset.value : '');
  const [rotate, setRotate] = useState(currentAsset?.rotate !== false);
  const [hueRotate, setHueRotate] = useState(currentAsset?.hueRotate || 0);
  const [hasColorFilter, setHasColorFilter] = useState(!!currentAsset?.hueRotate);

  const [stationName, setStationName] = useState(currentAsset?.metadata?.name || station?.name || '');
  const [capacityValue, setCapacityValue] = useState(currentAsset?.metadata?.capacityValue || '');
  const [capacityUnit, setCapacityUnit] = useState(currentAsset?.metadata?.capacityUnit || 'u/h');
  const [reqPower, setReqPower] = useState(currentAsset?.metadata?.power || false);
  const [reqWater, setReqWater] = useState(currentAsset?.metadata?.water || false);
  const [reqAir, setReqAir] = useState(currentAsset?.metadata?.air || false);
  
  const [modelScale, setModelScale] = useState(currentAsset?.metadata?.scale ?? 1);
  const [posX, setPosX] = useState(currentAsset?.metadata?.posX ?? 0);
  const [posY, setPosY] = useState(currentAsset?.metadata?.posY ?? 0);
  const [posZ, setPosZ] = useState(currentAsset?.metadata?.posZ ?? 0);

  // Reset local state if station changes
  React.useEffect(() => {
    if (station) {
      setAssetType(currentAsset?.type || 'image');
      setAssetValue(currentAsset?.value || '');
      setUrlInput(currentAsset?.value && !currentAsset.value.startsWith('data:') ? currentAsset.value : '');
      setRotate(currentAsset?.rotate !== false);
      setHueRotate(currentAsset?.hueRotate || 0);
      setHasColorFilter(!!currentAsset?.hueRotate);
      
      setStationName(currentAsset?.metadata?.name || station?.name || '');
      setCapacityValue(currentAsset?.metadata?.capacityValue || '');
      setCapacityUnit(currentAsset?.metadata?.capacityUnit || 'u/h');
      setReqPower(currentAsset?.metadata?.power || false);
      setReqWater(currentAsset?.metadata?.water || false);
      setReqAir(currentAsset?.metadata?.air || false);
      
      setModelScale(currentAsset?.metadata?.scale ?? 1);
      setPosX(currentAsset?.metadata?.posX ?? 0);
      setPosY(currentAsset?.metadata?.posY ?? 0);
      setPosZ(currentAsset?.metadata?.posZ ?? 0);
    }
  }, [station, currentAsset]);

  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAssetValue(reader.result);
        setUrlInput(''); // clear text URL if file uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setAssetValue(urlInput.trim());
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(5, 8, 13, 0.4)', backdropFilter: 'blur(16px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl rounded-xl border p-6 text-slate-200 shadow-2xl"
          style={{ 
             background: 'rgba(7, 12, 20, 0.45)',
             borderColor: 'rgba(34, 211, 238, 0.3)',
             boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 1px 0 0 rgba(255,255,255,0.05), 0 24px 48px rgba(0,0,0,0.8)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-5" style={{ borderColor: 'rgba(34,211,238,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h4 className="scr-display font-bold text-base text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">PANEL DE CONTROL — {station.name}</h4>
                <p className="text-slate-400 text-xs font-medium">Configuración operativa, velocidad y recursos visuales.</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-[#05080d]/60 p-1.5 rounded-md border border-[#1e3a5f]/50"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT COL: VISUALS */}
            <div className="space-y-6">
              {/* Asset Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-cyan-500 font-bold">Tipo de Recurso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAssetType('image'); setAssetValue(''); setUrlInput(''); }}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors shadow-inner"
                    style={{
                      borderColor: assetType === 'image' ? '#22d3ee' : 'rgba(30,58,95,0.5)',
                      background: assetType === 'image' ? 'rgba(34,211,238,0.15)' : 'rgba(5,8,13,0.6)',
                      color: assetType === 'image' ? '#22d3ee' : '#cbd5e1'
                    }}
                  >
                    <Image size={14} /> Imagen 2D
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAssetType('model'); setAssetValue(''); setUrlInput(''); }}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors shadow-inner"
                    style={{
                      borderColor: assetType === 'model' ? '#22d3ee' : 'rgba(30,58,95,0.5)',
                      background: assetType === 'model' ? 'rgba(34,211,238,0.15)' : 'rgba(5,8,13,0.6)',
                      color: assetType === 'model' ? '#22d3ee' : '#cbd5e1'
                    }}
                  >
                    <FileCode size={14} /> Modelo 3D (.glb)
                  </button>
                </div>
              </div>

              {/* Asset Input: File or URL */}
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wider text-cyan-500 font-bold">
                  {assetType === 'image' ? 'Cargar Imagen' : 'Cargar Modelo .glb'}
                </label>
                
                {/* File Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="station-file-upload"
                    accept={assetType === 'image' ? 'image/*' : '.glb'}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="station-file-upload"
                    className="flex items-center justify-center gap-2 border border-dashed rounded-lg py-3 px-4 text-xs font-medium cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/10 transition-all text-slate-300 flex-1 text-center bg-[rgba(5,8,13,0.4)]"
                    style={{ borderColor: 'rgba(30,58,95,0.8)' }}
                  >
                    <UploadCloud size={16} className="text-cyan-400" />
                    {assetValue.startsWith('data:') ? '¡Archivo cargado con éxito!' : `Seleccionar archivo ${assetType === 'image' ? 'de imagen' : '3D (.glb)'}`}
                  </label>
                </div>

                {/* URL Input */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">O usar una URL directa</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={assetType === 'image' ? 'https://ejemplo.com/imagen.png' : 'https://ejemplo.com/modelo.glb'}
                      className="flex-1 rounded-lg border text-slate-200 text-xs p-2 outline-none focus:border-cyan-500 shadow-inner"
                      style={{ borderColor: 'rgba(30,58,95,0.5)', background: 'rgba(5,8,13,0.6)' }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors border"
                      style={{ borderColor: 'rgba(30,58,95,0.5)', background: 'rgba(5,8,13,0.8)', color: '#e2e8f0' }}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>

              {/* Rotation Controls for Model */}
              {assetType === 'model' && (
                <div className="space-y-2 border-t pt-4" style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
                  <label className="block text-xs uppercase tracking-wider text-cyan-500 font-bold">Rotación del Modelo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRotate(true)}
                      className="py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors shadow-inner"
                      style={{
                        borderColor: rotate ? '#22d3ee' : 'rgba(30,58,95,0.5)',
                        background: rotate ? 'rgba(34,211,238,0.15)' : 'rgba(5,8,13,0.6)',
                        color: rotate ? '#22d3ee' : '#cbd5e1'
                      }}
                    >
                      Girar Automáticamente
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotate(false)}
                      className="py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors shadow-inner"
                      style={{
                        borderColor: !rotate ? '#22d3ee' : 'rgba(30,58,95,0.5)',
                        background: !rotate ? 'rgba(34,211,238,0.15)' : 'rgba(5,8,13,0.6)',
                        color: !rotate ? '#22d3ee' : '#cbd5e1'
                      }}
                    >
                      Estático
                    </button>
                  </div>
                </div>
              )}

              {/* Transform Controls */}
              <div className="space-y-3 border-t pt-4 mt-4" style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
                <label className="block text-xs uppercase tracking-wider text-cyan-500 font-bold">Posición y Escala (XYZ)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Escala ({modelScale}x)</span>
                    <input type="range" min="0.1" max="3" step="0.1" value={modelScale} onChange={e => setModelScale(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Offset Z ({posZ}px)</span>
                    <input type="range" min="-100" max="100" step="1" value={posZ} onChange={e => setPosZ(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Offset X ({posX}px)</span>
                    <input type="range" min="-100" max="100" step="1" value={posX} onChange={e => setPosX(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Offset Y ({posY}px)</span>
                    <input type="range" min="-100" max="100" step="1" value={posY} onChange={e => setPosY(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COL: METADATA & PREVIEW */}
            <div className="space-y-6">
              
              {/* Configuración Operativa y Metadata */}
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wider text-cyan-500 font-bold">Parámetros Operativos</label>
                
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nombre del Equipo</span>
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    placeholder="Ej. Alimentador Principal"
                    className="w-full rounded-lg border text-slate-200 text-xs p-2 outline-none focus:border-cyan-500 shadow-inner"
                    style={{ borderColor: 'rgba(30,58,95,0.5)', background: 'rgba(5,8,13,0.6)' }}
                  />
                </div>
                
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Velocidad / Capacidad Programada</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={capacityValue}
                      onChange={(e) => setCapacityValue(e.target.value)}
                      placeholder="Ej. 120"
                      className="flex-1 rounded-lg border text-slate-200 text-xs p-2 outline-none focus:border-cyan-500 shadow-inner"
                      style={{ borderColor: 'rgba(30,58,95,0.5)', background: 'rgba(5,8,13,0.6)' }}
                    />
                    <select
                      value={capacityUnit}
                      onChange={(e) => setCapacityUnit(e.target.value)}
                      className="w-24 rounded-lg border text-slate-200 text-xs p-2 outline-none focus:border-cyan-500 appearance-none shadow-inner"
                      style={{ borderColor: 'rgba(30,58,95,0.5)', background: 'rgba(5,8,13,0.6)' }}
                    >
                      <option value="RPM">RPM</option>
                      <option value="m/min">m/min</option>
                      <option value="u/h">u/h</option>
                      <option value="ppm">PPM</option>
                      <option value="kg/h">kg/h</option>
                      <option value="l/min">l/min</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Servicios Requeridos (Luz, Agua, Aire)</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setReqPower(!reqPower)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-semibold transition-colors shadow-inner ${reqPower ? 'border-amber-400/50 bg-amber-400/20 text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]' : 'border-[#1e3a5f]/50 bg-[#05080d]/60 text-slate-400'}`}>
                      <Zap size={14} /> Eléctrica
                    </button>
                    <button type="button" onClick={() => setReqWater(!reqWater)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-semibold transition-colors shadow-inner ${reqWater ? 'border-blue-400/50 bg-blue-400/20 text-blue-300 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]' : 'border-[#1e3a5f]/50 bg-[#05080d]/60 text-slate-400'}`}>
                      <Droplets size={14} /> Agua
                    </button>
                    <button type="button" onClick={() => setReqAir(!reqAir)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-semibold transition-colors shadow-inner ${reqAir ? 'border-slate-300/50 bg-slate-300/20 text-slate-100 drop-shadow-[0_0_4px_rgba(203,213,225,0.3)]' : 'border-[#1e3a5f]/50 bg-[#05080d]/60 text-slate-400'}`}>
                      <Wind size={14} /> Neumática
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {assetValue && (
                <div className="space-y-2 border-t pt-4" style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
                  <label className="block text-xs uppercase tracking-wider text-cyan-500 font-bold">Vista Previa</label>
                  <div className="rounded-lg p-2 flex items-center justify-center border shadow-inner overflow-hidden relative" style={{ borderColor: 'rgba(30,58,95,0.6)', background: 'rgba(5,8,13,0.7)', minHeight: '140px', perspective: '1000px' }}>
                    {/* 3D Floor Grid Plane */}
                    <div 
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none select-none z-0"
                      style={{
                        width: '130px',
                        height: '50px',
                        transform: 'rotateX(68deg)',
                        background: `
                          linear-gradient(to right, rgba(34,211,238,0.25) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(34,211,238,0.25) 1px, transparent 1px)
                        `,
                        backgroundSize: '12px 12px',
                        border: '1px solid rgba(34,211,238,0.5)',
                        boxShadow: '0 0 16px rgba(34,211,238,0.2)',
                        borderRadius: '4px'
                      }}
                    >
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/60" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/60" />
                    </div>
                    {assetType === 'image' ? (
                      <img
                        src={assetValue}
                        alt="Preview"
                        className="max-h-[120px] object-contain rounded"
                        style={{ filter: (hasColorFilter && hueRotate) ? `hue-rotate(${hueRotate}deg)` : undefined, transform: `translate3d(${posX}px, ${posY}px, ${posZ}px) scale(${modelScale})`, transition: 'transform 0.1s ease-out' }}
                      />
                    ) : (
                      <div style={{ filter: (hasColorFilter && hueRotate) ? `hue-rotate(${hueRotate}deg)` : undefined, transform: `translate3d(${posX}px, ${posY}px, ${posZ}px) scale(${modelScale})`, transition: 'transform 0.1s ease-out' }}>
                        <model-viewer
                          src={assetValue}
                          alt="Preview 3D"
                          auto-rotate={rotate ? "" : undefined}
                          camera-controls
                          camera-orbit="0deg 80deg 105%"
                          min-camera-orbit="-Infinity 80deg 70%"
                          max-camera-orbit="Infinity 80deg 140%"
                          interaction-prompt="none"
                          style={{
                            width: '130px',
                            height: '130px',
                            background: 'transparent'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex justify-between items-center border-t pt-4" style={{ borderColor: 'rgba(34,211,238,0.2)' }}>
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
            >
              Restablecer defecto
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg text-xs font-semibold px-4 py-2 hover:bg-slate-700 transition-colors border"
                style={{ borderColor: 'rgba(30,58,95,0.8)', background: 'rgba(5,8,13,0.6)', color: '#cbd5e1' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onSave({ 
                  type: assetType, 
                  value: assetValue, 
                  rotate, 
                  hueRotate: hasColorFilter ? hueRotate : 0,
                  metadata: {
                    name: stationName,
                    capacityValue,
                    capacityUnit,
                    power: reqPower,
                    water: reqWater,
                    air: reqAir,
                    scale: modelScale,
                    posX,
                    posY,
                    posZ
                  }
                })}
                disabled={!assetValue}
                className="rounded-lg text-xs font-bold px-6 py-2 transition-all active:scale-[0.97] disabled:opacity-40 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                style={{ background: 'linear-gradient(180deg,#22d3ee,#0ea5e9)', color: '#05080d' }}
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------- CAD Studio Sandbox Mode (Twin Digital Activo) ---------------- */
export function CadSandboxOverlay({
  open,
  onClose,
  stationAssets,
  onResetAllAssets,
  studioSettings,
  onSaveStudioSettings
}) {
  const [play, setPlay] = useState(true);
  const [viewMode, setViewMode] = useState('isometric'); // isometric, lateral, superior
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success

  // Theme & Color Preset State
  const [activeTheme, setActiveTheme] = useState(studioSettings?.activeTheme ?? 'blueprint');
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Mouse Drag, Pan, and Zoom states
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotateAngle, setRotateAngle] = useState({ x: 0, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Studio parameters
  const [brightness, setBrightness] = useState(studioSettings?.brightness ?? 40);
  const [shadowAngle, setShadowAngle] = useState(studioSettings?.shadowAngle ?? 210);
  const [metallic, setMetallic] = useState(studioSettings?.metallic ?? 75);
  const [roughness, setRoughness] = useState(studioSettings?.roughness ?? 55);
  const [silhouettes, setSilhouettes] = useState(studioSettings?.silhouettes ?? 0);
  const [floorStyle, setFloorStyle] = useState(studioSettings?.floorStyle ?? 'grid'); // grid, solid, reflective, none
  const [gridOpacity, setGridOpacity] = useState(studioSettings?.gridOpacity ?? 100);
  const [fog, setFog] = useState(studioSettings?.fog ?? 10);
  const [backlight, setBacklight] = useState(studioSettings?.backlight ?? true);

  // Load parent settings if they change
  useEffect(() => {
    if (studioSettings) {
      setBrightness(studioSettings.brightness ?? 40);
      setShadowAngle(studioSettings.shadowAngle ?? 210);
      setMetallic(studioSettings.metallic ?? 75);
      setRoughness(studioSettings.roughness ?? 55);
      setSilhouettes(studioSettings.silhouettes ?? 0);
      setFloorStyle(studioSettings.floorStyle ?? 'grid');
      setGridOpacity(studioSettings.gridOpacity ?? 100);
      setFog(studioSettings.fog ?? 10);
      setBacklight(studioSettings.backlight ?? true);
      setActiveTheme(studioSettings.activeTheme ?? 'blueprint');
    }
  }, [studioSettings, open]);

  // REC Timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Apply metallic & roughness properties on render
  useEffect(() => {
    if (!open) return;
    const viewers = document.querySelectorAll('.sandbox-viewer');
    viewers.forEach((v) => {
      if (v.model) {
        for (const material of v.model.materials) {
          const pbr = material.pbrMetallicRoughness;
          if (pbr) {
            pbr.setMetallicFactor(metallic / 100);
            pbr.setRoughnessFactor(roughness / 100);
          }
        }
      }
    });
  }, [metallic, roughness, open, isReloading]);

  if (!open) return null;

  const formatRecTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleResetStudio = () => {
    setBrightness(40);
    setShadowAngle(210);
    setMetallic(75);
    setRoughness(55);
    setSilhouettes(0);
    setFloorStyle('grid');
    setGridOpacity(100);
    setFog(10);
    setBacklight(true);
    setViewMode('isometric');
    setPlay(true);
    setActiveTheme('blueprint');
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
    setRotateAngle({ x: 0, z: 0 });
  };

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
    setRotateAngle({ x: 0, z: 0 });
  };

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => {
      setIsReloading(false);
    }, 1000);
  };

  const handleSaveStudio = async () => {
    setSaveStatus('saving');
    if (onSaveStudioSettings) {
      await onSaveStudioSettings({
        brightness,
        shadowAngle,
        metallic,
        roughness,
        silhouettes,
        floorStyle,
        gridOpacity,
        fog,
        backlight,
        activeTheme
      });
    }
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleDownloadCapture = async () => {
    const firstViewer = document.querySelector('.sandbox-viewer');
    if (firstViewer) {
      try {
        const blob = await firstViewer.toBlob({ mimeType: 'image/png' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'twin-digital-render.png';
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Error capturing canvas image:", err);
      }
    } else {
      alert("No hay modelos 3D cargados en el visor para fotografiar.");
    }
  };

  const applyThemePreset = (themeKey) => {
    setActiveTheme(themeKey);
    if (themeKey === 'blueprint') {
      setFloorStyle('grid');
      setBrightness(50);
      setMetallic(20);
      setRoughness(90);
      setSilhouettes(70);
      setGridOpacity(100);
      setFog(5);
      setBacklight(true);
    } else if (themeKey === 'cyberpunk') {
      setFloorStyle('grid');
      setBrightness(40);
      setMetallic(90);
      setRoughness(30);
      setSilhouettes(30);
      setGridOpacity(80);
      setFog(15);
      setBacklight(true);
    } else if (themeKey === 'toxic') {
      setFloorStyle('grid');
      setBrightness(35);
      setMetallic(50);
      setRoughness(70);
      setSilhouettes(60);
      setGridOpacity(90);
      setFog(12);
      setBacklight(false);
    } else if (themeKey === 'aluminum') {
      setFloorStyle('solid');
      setBrightness(60);
      setMetallic(95);
      setRoughness(25);
      setSilhouettes(0);
      setGridOpacity(0);
      setFog(8);
      setBacklight(true);
    }
  };

  // Mouse Interaction Handlers
  const handleMouseDown = (e) => {
    if (
      e.target.closest('button') || 
      e.target.closest('aside') || 
      e.target.closest('header') || 
      e.target.closest('.theme-modal') ||
      (e.target.closest('model-viewer') && !e.shiftKey)
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Shift drag or Right click drag rotates, otherwise pans
    const isRotate = e.shiftKey || e.buttons === 2;
    if (isRotate) {
      setRotateAngle((prev) => ({
        x: Math.min(Math.max(prev.x - dy * 0.4, -45), 45),
        z: prev.z + dx * 0.4
      }));
    } else {
      setPan((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    // Perspective-based zoom: adjust the 3D camera distance, not pixel scale.
    // Scroll up (deltaY < 0) = move camera closer = zoom value increases.
    // Scroll down (deltaY > 0) = move camera farther = zoom value decreases.
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.3), 3.0));
  };

  // Dynamic Theme Colors Config
  const themeConfig = {
    blueprint: {
      bgColor: '#091624',
      gridColor: 'rgba(255, 255, 255, 0.08)',
      dashedColor: 'rgba(255, 255, 255, 0.3)',
      glowColor: '#38bdf8',
      modelFilter: 'invert(0.1) hue-rotate(185deg) saturate(2) brightness(1.2)'
    },
    cyberpunk: {
      bgColor: '#020408',
      gridColor: 'rgba(34, 211, 238, 0.08)',
      dashedColor: 'rgba(34, 211, 238, 0.3)',
      glowColor: '#c084fc',
      modelFilter: 'hue-rotate(290deg) saturate(1.8)'
    },
    toxic: {
      bgColor: '#070c08',
      gridColor: 'rgba(34, 197, 94, 0.08)',
      dashedColor: 'rgba(34, 197, 94, 0.3)',
      glowColor: '#4ade80',
      modelFilter: 'hue-rotate(85deg) saturate(1.4) brightness(0.95)'
    },
    aluminum: {
      bgColor: '#0f172a',
      gridColor: 'rgba(100, 116, 139, 0.06)',
      dashedColor: 'rgba(100, 116, 139, 0.2)',
      glowColor: '#94a3b8',
      modelFilter: 'none'
    }
  }[activeTheme] || {
    bgColor: '#04070c',
    gridColor: 'rgba(34, 211, 238, 0.07)',
    dashedColor: 'var(--scr-border)',
    glowColor: '#22d3ee',
    modelFilter: 'none'
  };

  // Combine default viewpoint rotations with user dragged offsets
  // NOTE: pan is intentionally kept SEPARATE from the 3D rotation transform.
  // The pan must be on the outer (non-rotated) wrapper so it moves in screen space.
  const baseRx = viewMode === 'isometric' ? 60 : viewMode === 'lateral' ? 86 : 0;
  const baseRz = viewMode === 'isometric' ? -15 : 0;
  // baseScale only sets the initial view fit for each viewMode preset— it does NOT zoom.
  const baseScale = viewMode === 'isometric' ? 0.9 : viewMode === 'lateral' ? 1.0 : 0.85;

  const currentRx = baseRx + rotateAngle.x;
  const currentRz = baseRz + rotateAngle.z;

  // PERSPECTIVE-BASED ZOOM — physics-correct 3D camera movement:
  // Increasing zoom moves the camera closer (smaller perspective value = objects appear larger).
  // Decreasing zoom moves the camera farther (larger perspective value = objects appear smaller).
  // This preserves the true physical proportions of all 3D objects in the scene—
  // models, floor tiles, and conveyor lines all scale together as real geometry.
  // zoom=1.0 → 2000px (default view)
  // zoom=2.0 → 1000px (camera 2× closer)
  // zoom=0.5 → 4000px (camera 2× farther)
  const perspectiveZoom = Math.round(2000 / zoom);

  // The grid itself only rotates + the initial viewMode fit scale — NO zoom scale here
  const gridTransform = `rotateX(${currentRx}deg) rotateZ(${currentRz}deg) scale(${baseScale})`;
  // The individual elements counter-rotate so they always face the camera
  const elementTransform = `rotateZ(${-currentRz}deg) rotateX(${-currentRx}deg)`;
  // Pan is applied on the outer floor wrapper (flat screen space)
  const panStyle = { transform: `translate(${pan.x}px, ${pan.y}px)` };

  // Exposure mapping: 40% maps to 1.0, 100% to 2.5, etc.
  const exposureVal = (brightness / 40) * 1.0;

  // Filter effect mapping for silhouettes (contrast & outline feel)
  const silhouetteStyle = silhouettes > 0 
    ? `contrast(${1 + silhouettes / 50}) brightness(${1 - silhouettes / 200}) saturate(${1 - silhouettes / 100})`
    : '';

  // Combined final filter style for models — applied to a wrapper div around model-viewer
  // because CSS filters don't propagate through shadow DOM inside <model-viewer>
  const finalModelFilter = [
    themeConfig.modelFilter !== 'none' ? themeConfig.modelFilter : '',
    silhouetteStyle
  ].filter(Boolean).join(' ') || 'none';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#03060a] text-slate-200 flex flex-col font-sans select-none overflow-hidden"
      >
        {/* Top Control Bar (TWIN DIGITAL ACTIVO) */}
        <header className="h-16 border-b shrink-0 flex items-center justify-between px-4 bg-[#070c14]/90 backdrop-blur-md z-10" style={{ borderColor: 'var(--scr-border)' }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22d3ee]"></span>
              </span>
              <h2 className="scr-display font-black text-sm tracking-widest text-slate-50 uppercase">Twin Digital Activo</h2>
            </div>

            {/* Topbar Operations */}
            <div className="flex items-center gap-1.5 bg-[#090f1a]/80 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setPlay(!play)}
                title={play ? "Pausar Simulación" : "Iniciar Simulación"}
                className="p-1.5 rounded hover:bg-slate-800 transition-colors"
                style={{ color: play ? '#22d3ee' : '#64748b' }}
              >
                {play ? <Activity size={14} /> : <Activity size={14} />}
              </button>
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: play ? '#22d3ee' : '#64748b', background: play ? 'rgba(34,211,238,0.1)' : 'transparent', border: play ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent' }}>{play ? 'SIM ON' : 'SIM OFF'}</span>
              <button
                type="button"
                onClick={handleResetStudio}
                title="Restablecer Cámara y Estudio"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowThemeModal(true)}
                title="Seleccionar Paleta de Colores"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <Palette size={14} />
              </button>
              <span className="w-px h-4 bg-slate-800" />

              {/* Viewpoints */}
              <div className="flex gap-1">
                {['lateral', 'superior', 'isometric'].map((mode) => {
                  const active = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleSetViewMode(mode)}
                      className="px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all"
                      style={{
                        background: active ? 'rgba(34,211,238,0.12)' : 'transparent',
                        color: active ? '#22d3ee' : 'var(--scr-text-400)',
                        border: active ? '1px solid rgba(34,211,238,0.3)' : '1px solid transparent'
                      }}
                    >
                      {mode === 'isometric' ? 'Isométrica' : mode === 'lateral' ? 'Lateral' : 'Superior'}
                    </button>
                  );
                })}
              </div>

              <span className="w-px h-4 bg-slate-800" />
              <button
                type="button"
                onClick={onResetAllAssets}
                title="Limpiar Todos los Modelos Personalizados"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={handleReload}
                title="Actualizar Modelos"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setBacklight(!backlight)}
                title="Filtro de Contraluz"
                className="p-1.5 rounded hover:bg-slate-800 transition-colors"
                style={{ color: backlight ? '#22d3ee' : '#64748b' }}
              >
                <Lightbulb size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Blinking REC Status */}
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all"
              style={{
                borderColor: isRecording ? '#ef4444' : 'var(--scr-border)',
                background: isRecording ? 'rgba(239,68,68,0.1)' : 'var(--scr-panel-2)',
                color: isRecording ? '#ef4444' : 'var(--scr-text-300)'
              }}
            >
              <span className={`h-2 w-2 rounded-full bg-red-500 ${isRecording ? 'animate-pulse' : ''}`} />
              {isRecording ? `REC ${formatRecTime(recSeconds)}` : 'REC'}
            </button>

            {/* Exit Visor */}
            <button
              type="button"
              onClick={onClose}
              className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-900 transition-all active:scale-95"
            >
              <Minimize2 size={15} />
            </button>
          </div>
        </header>

        {/* Central Workspace area */}
        <div className="flex-1 flex overflow-hidden relative">
          <div 
            className="flex-1 relative flex items-center justify-center p-8 overflow-hidden select-none cursor-grab active:cursor-grabbing"
            style={{ background: themeConfig.bgColor }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Background Nebulas */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.03),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.03),transparent_50%)] pointer-events-none" />

            {/* Industrial Fog Overlay */}
            {fog > 0 && (
              <div 
                className="absolute inset-0 pointer-events-none transition-opacity" 
                style={{ 
                  background: 'linear-gradient(to top, rgba(3,6,10,0.7) 0%, transparent 80%)',
                  backdropFilter: `blur(${fog / 2}px)`,
                  maskImage: 'linear-gradient(to top, black, transparent 60%)',
                  opacity: fog / 20
                }} 
              />
            )}

            {isReloading ? (
              <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="text-xs scr-mono text-cyan-400 tracking-wider">REGENERANDO ESCENA CAD...</span>
              </div>
            ) : (
              /* Perspective Sandbox Floor Wrapper — pan + perspective-camera zoom here */
              <div 
                className="sandbox-floor absolute inset-0 flex items-center justify-center"
                style={{ 
                  ...panStyle, 
                  perspective: `${perspectiveZoom}px`,
                  perspectiveOrigin: '50% 40%'
                }}
              >
                {/* Rotatable Grid Floor — rotation+scale only, NO translate */}
                <div 
                  className="sandbox-grid flex items-center justify-center gap-12 py-16 px-20 transition-all duration-200 ease-out"
                  style={{
                    transform: gridTransform,
                    transformStyle: 'preserve-3d',
                    width: '160%',
                    minWidth: '1400px',
                    height: '700px',
                    position: 'relative',
                    // Floor styles driven by active theme
                    background: floorStyle === 'grid' || floorStyle === 'reflective'
                      ? `rgba(9,15,26,0.6)`
                      : floorStyle === 'solid' ? '#101622' : 'transparent',
                    border: floorStyle !== 'none' ? `1px solid ${themeConfig.glowColor}33` : 'none',
                    boxShadow: floorStyle === 'reflective'
                      ? `0 0 80px -20px ${themeConfig.glowColor}44, inset 0 0 60px ${themeConfig.glowColor}11`
                      : `0 0 40px -20px ${themeConfig.glowColor}22`
                  }}
                >
                  {/* Full-area Grid Lines Overlay */}
                  {(floorStyle === 'grid' || floorStyle === 'reflective') && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        opacity: gridOpacity / 100,
                        backgroundImage: [
                          `linear-gradient(${themeConfig.glowColor}18 1px, transparent 1px)`,
                          `linear-gradient(90deg, ${themeConfig.glowColor}18 1px, transparent 1px)`,
                          `linear-gradient(${themeConfig.glowColor}06 1px, transparent 1px)`,
                          `linear-gradient(90deg, ${themeConfig.glowColor}06 1px, transparent 1px)`
                        ].join(', '),
                        backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px'
                      }}
                    />
                  )}

                  {/* Reflection Mirror Overlay */}
                  {floorStyle === 'reflective' && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at center bottom, ${themeConfig.glowColor}18, transparent 70%)`
                      }}
                    />
                  )}

                  {/* Render all stations sequentially */}
                  {PROCESS_STATIONS.map((st, idx) => {
                    const asset = stationAssets[st.id] || null;
                    const isModel = asset && asset.type === 'model';
                    const assetUrl = asset ? asset.value : null;
                    const c = st.state === 'run' ? '#22c55e' : st.state === 'wait' ? '#f5c518' : '#64748b';

                    return (
                      <React.Fragment key={st.id}>
                        {/* Connecting conveyor line */}
                        {idx > 0 && (
                          <div 
                            className="w-10 h-1 border-t-2 border-dashed self-center opacity-60 shrink-0" 
                            style={{ 
                              borderColor: themeConfig.dashedColor,
                              transform: 'translateZ(10px)'
                            }} 
                          />
                        )}

                        {/* Station Standup Node — counter-rotates so it faces the camera */}
                        <div 
                          className="flex flex-col items-center relative"
                          style={{ 
                            transformStyle: 'preserve-3d',
                            transform: elementTransform
                          }}
                        >
                          {/* Holographic Glowing Platform with 3D Floor Grid */}
                          <div 
                            className="absolute bottom-1 w-36 h-12 rounded-full blur-[3px] animate-pulse"
                            style={{
                              background: `radial-gradient(ellipse at center, ${themeConfig.glowColor}55, transparent 70%)`,
                              transform: 'rotateX(75deg) translateZ(-4px)'
                            }}
                          />
                          <div 
                            className="absolute bottom-1 w-36 h-14 pointer-events-none select-none rounded border"
                            style={{
                              borderColor: `${themeConfig.glowColor}aa`,
                              boxShadow: `0 0 20px ${themeConfig.glowColor}55, inset 0 0 14px ${themeConfig.glowColor}33`,
                              background: `
                                linear-gradient(to right, ${themeConfig.glowColor}44 1px, transparent 1px),
                                linear-gradient(to bottom, ${themeConfig.glowColor}44 1px, transparent 1px)
                              `,
                              backgroundSize: '12px 12px',
                              transform: 'rotateX(75deg) translateZ(0px)'
                            }}
                          >
                            <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: `${themeConfig.glowColor}dd` }} />
                            <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: `${themeConfig.glowColor}dd` }} />
                            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: themeConfig.glowColor }} />
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: themeConfig.glowColor }} />
                            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: themeConfig.glowColor }} />
                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: themeConfig.glowColor }} />
                          </div>

                          {/* Model Viewport / Image billboard */}
                          {/* The outer div carries the CSS filter; model-viewer is inside so the
                              filter composites over the rendered WebGL output correctly */}
                          <div 
                            style={{ 
                              transform: 'translateZ(24px)',
                              marginBottom: '28px'
                            }}
                          >
                            {/* Filter wrapper — CSS filter works on the composited output */}
                            <div style={{ filter: finalModelFilter }}>
                              {isModel && assetUrl ? (
                                /*
                                  TWIN DIGITAL INDUSTRIAL — Propiedades físicas:
                                  - Sin auto-rotate: las máquinas industriales no giran solas
                                  - Sin camera-controls: el usuario NO puede orbitar el modelo
                                  - camera-orbit fijo: ángulo industrial (frontal ligeramente elevado)
                                  - disable-zoom / disable-pan / disable-tap: completamente anclado
                                  - min/max-camera-orbit: cámara bloqueada al preset
                                  - shadow-intensity: sombra de proyección al piso
                                */
                                <model-viewer
                                  class="sandbox-viewer"
                                  src={assetUrl}
                                  alt={st.name}
                                  shadow-intensity="1.5"
                                  shadow-softness="0.8"
                                  exposure={exposureVal}
                                  interaction-prompt="none"
                                  camera-orbit="0deg 80deg 105%"
                                  min-camera-orbit="0deg 80deg 105%"
                                  max-camera-orbit="0deg 80deg 105%"
                                  field-of-view="28deg"
                                  disable-zoom
                                  disable-pan
                                  disable-tap
                                  style={{ 
                                    width: '160px', height: '160px', 
                                    background: 'transparent', display: 'block',
                                    pointerEvents: 'none'
                                  }}
                                />
                              ) : (
                                <div className="relative flex flex-col items-center">
                                  <img 
                                    src={STATION_IMAGES[st.img]} 
                                    alt={st.name} 
                                    className="h-32 w-32 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]" 
                                    style={{ filter: finalModelFilter }}
                                  />
                                  <span className="absolute bottom-0 text-[8px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider">2D CAD</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Float Station Info Banner */}
                          <div 
                            className="px-2.5 py-1 rounded-md border text-center whitespace-nowrap bg-[#060b13]/90 backdrop-blur-sm shadow-lg shrink-0"
                            style={{ 
                              borderColor: 'var(--scr-border)',
                              transform: 'translateZ(30px)' 
                            }}
                          >
                            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                              {st.num ? `ST-${st.num}` : 'SYS'}
                            </span>
                            <span className="block text-[11px] font-bold text-slate-100 mt-0.5">
                              {st.name.replace('\n', ' ')}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Control Panel (ESTUDIO CAD PRO) */}
          <aside className="w-80 border-l shrink-0 bg-[#060b12]/95 backdrop-blur-md p-4 overflow-y-auto flex flex-col gap-5 z-10" style={{ borderColor: 'var(--scr-border)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--scr-border)' }}>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-cyan-400" />
                <h3 className="scr-display font-black text-xs uppercase tracking-wider text-slate-100">Estudio CAD Pro</h3>
              </div>
              <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Premium</span>
            </div>

            {/* Theme / Palette Selection Info Block */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Palette size={12} className="text-slate-400" /> Paleta y Temas
              </h4>
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Paleta Activa</span>
                  <span className="text-cyan-400 font-black uppercase tracking-wider text-[10px]">
                    {activeTheme === 'blueprint' ? 'Planos Blueprint' : activeTheme === 'cyberpunk' ? 'Clásico Cyberpunk' : activeTheme === 'toxic' ? 'Industrial Toxic' : 'Gris Aluminio'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowThemeModal(true)}
                  className="w-full py-1.5 border border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <Palette size={12} /> Seleccionar Paleta
                </button>
              </div>
            </div>

            {/* Category: Iluminacion y Sombras */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Sun size={12} className="text-slate-400" /> Iluminación y Sombras
              </h4>

              {/* Exposure Slider */}
              <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Brillo e Iluminación</span>
                  <span className="text-cyan-400 font-bold scr-mono">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Sun Angle Slider */}
              <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Ángulo del Sol (Sombras)</span>
                  <span className="text-cyan-400 font-bold scr-mono">{shadowAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={shadowAngle}
                  onChange={(e) => setShadowAngle(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Category: Detalle y Acabado CAD */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <SlidersHorizontal size={12} className="text-slate-400" /> Detalle y Acabado CAD
              </h4>

              {/* Metallic factor */}
              <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Brillo Metálico</span>
                  <span className="text-cyan-400 font-bold scr-mono">{metallic}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={metallic}
                  onChange={(e) => setMetallic(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Roughness factor */}
              <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Rugosidad / Pulido</span>
                  <span className="text-cyan-400 font-bold scr-mono">{roughness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={roughness}
                  onChange={(e) => setRoughness(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Silhouettes / outlines */}
              <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Siluetas e Ingeniería</span>
                  <span className="text-cyan-400 font-bold scr-mono">{silhouettes}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={silhouettes}
                  onChange={(e) => setSilhouettes(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Category: Entorno y Cuadricula */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Layers size={12} className="text-slate-400" /> Entorno y Cuadrícula
              </h4>

              {/* Floor selector grids */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'grid', label: 'Cuadrícula' },
                  { id: 'solid', label: 'Piso Sólido' },
                  { id: 'reflective', label: 'Reflectivo' },
                  { id: 'none', label: 'Sin Piso' }
                ].map((item) => {
                  const selected = floorStyle === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFloorStyle(item.id)}
                      className="py-2 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-colors"
                      style={{
                        borderColor: selected ? '#22d3ee' : 'var(--scr-border)',
                        background: selected ? 'rgba(34,211,238,0.1)' : 'var(--scr-panel-2)',
                        color: selected ? '#22d3ee' : 'var(--scr-text-400)'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Grid line weight */}
              {floorStyle === 'grid' && (
                <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Grosor/Visibilidad Cuadrícula</span>
                    <span className="text-cyan-400 font-bold scr-mono">{gridOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={gridOpacity}
                    onChange={(e) => setGridOpacity(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              )}

              {/* Industrial Fog */}
              <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Niebla Industrial (FOG)</span>
                  <span className="text-cyan-400 font-bold scr-mono">{fog}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={fog}
                  onChange={(e) => setFog(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Backlight toggle */}
              <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">Filtro de Contraluz</span>
                <button
                  type="button"
                  onClick={() => setBacklight(!backlight)}
                  className="w-9 h-5 rounded-full p-0.5 transition-colors relative duration-300"
                  style={{ background: backlight ? '#22d3ee' : '#1e293b' }}
                >
                  <span 
                    className="block w-4 h-4 rounded-full bg-slate-950 transition-transform duration-300"
                    style={{ transform: backlight ? 'translateX(16px)' : 'translateX(0px)' }}
                  />
                </button>
              </div>
            </div>

            {/* Actions Footer inside sidebar */}
            <div className="mt-auto space-y-2.5 border-t pt-4" style={{ borderColor: 'var(--scr-border)' }}>
              <button
                type="button"
                onClick={handleSaveStudio}
                disabled={saveStatus !== 'idle'}
                className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border"
                style={{
                  background: saveStatus === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(34,211,238,0.06)',
                  borderColor: saveStatus === 'success' ? '#22c55e' : '#22d3ee',
                  color: saveStatus === 'success' ? '#22c55e' : '#22d3ee'
                }}
              >
                {saveStatus === 'saving' ? (
                  <>Guardando...</>
                ) : saveStatus === 'success' ? (
                  <>Ajustes Guardados ✓</>
                ) : (
                  <>Guardar Ajustes de Estudio</>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadCapture}
                className="w-full py-2.5 rounded-lg text-xs font-bold text-[#05080d] bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Camera size={13} /> Descargar Foto 3D
              </button>
            </div>
          </aside>
        </div>

        {/* Color Palette / Theme Selection Modal (Image 2 matching) */}
        {showThemeModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-sm theme-modal">
            <div className="bg-[#050b14] border border-[#0d233a] rounded-2xl p-6 w-[840px] max-w-[95vw] shadow-2xl relative">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#0d233a] pb-4">
                <div className="flex items-center gap-3">
                  <Palette size={18} className="text-[#22d3ee] drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                  <h3 className="scr-display font-black text-sm uppercase tracking-wider text-slate-100">
                    Seleccionar Paleta de Colores / Temas del Twin
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowThemeModal(false)}
                  className="text-slate-500 hover:text-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid of themes */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-6">
                {[
                  {
                    id: 'blueprint',
                    name: 'PLANOS BLUEPRINT',
                    desc: 'Estilo esquema técnico en azul celeste y cuadrícula blanca.',
                    bgGradient: 'bg-gradient-to-br from-[#0b2239] to-[#0f3456]',
                    previewEl: (
                      <div className="w-full h-full flex items-center justify-center relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
                        <div className="w-8 h-8 rounded-sm border border-cyan-400 bg-cyan-400/20 shadow-[0_0_8px_rgba(34,211,238,0.3)] rotate-12" />
                      </div>
                    )
                  },
                  {
                    id: 'cyberpunk',
                    name: 'CLÁSICO CYBERPUNK',
                    desc: 'Fondo oscuro con flujo cian de alto contraste y partículas.',
                    bgGradient: 'bg-gradient-to-br from-[#020408] to-[#080e1a]',
                    previewEl: (
                      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,rgba(192,132,252,0.15),transparent_60%)]" />
                        <div className="w-8 h-8 rounded-sm border border-purple-400 bg-purple-400/20 shadow-[0_0_8px_rgba(192,132,252,0.3)] rotate-45" />
                      </div>
                    )
                  },
                  {
                    id: 'toxic',
                    name: 'INDUSTRIAL TOXIC',
                    desc: 'Gris mate industrial con contornos verde de alta visibilidad.',
                    bgGradient: 'bg-gradient-to-br from-[#070c08] to-[#121f14]',
                    previewEl: (
                      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                        <div className="w-8 h-8 rounded-sm border border-emerald-400 bg-emerald-400/10 shadow-[0_0_8px_rgba(52,211,153,0.3)] animate-pulse" />
                      </div>
                    )
                  },
                  {
                    id: 'aluminum',
                    name: 'GRIS ALUMINIO',
                    desc: 'Modelo 3D de aluminio pulido metálico realista sin contornos.',
                    bgGradient: 'bg-gradient-to-br from-[#1e293b] to-[#334155]',
                    previewEl: (
                      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 shadow-lg border border-slate-300" />
                      </div>
                    )
                  }
                ].map((item) => {
                  const active = activeTheme === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => applyThemePreset(item.id)}
                      className={`cursor-pointer rounded-xl border p-3 flex flex-col transition-all duration-300 relative select-none ${active ? 'border-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,0.2)] bg-[#081324]' : 'border-slate-800 bg-[#060b13] hover:border-slate-700'}`}
                    >
                      {/* Preview Box */}
                      <div className={`h-24 rounded-lg overflow-hidden border border-slate-800 ${item.bgGradient} mb-3 relative`}>
                        {item.previewEl}
                        {active && (
                          <div className="absolute top-2 left-2 bg-[#22c55e] text-[#05080d] text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                            ACTIVO
                          </div>
                        )}
                      </div>
                      <span className="block text-[11px] font-black uppercase tracking-wider text-slate-100 mb-1">
                        {item.name}
                      </span>
                      <span className="block text-[9px] text-slate-500 leading-tight">
                        {item.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Customizer Button */}
              <div className="border-t border-[#0d233a] pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowThemeModal(false)}
                  className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-100 bg-gradient-to-r from-[#0d233a] via-[#132c48] to-[#0d233a] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-[#1a3d60]"
                >
                  <SlidersHorizontal size={14} className="text-[#22d3ee]" /> Subir Foto / Personalizar Colores de la Línea
                </button>
              </div>

            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------- Matrix Decode Line Component ---------------- */
function MatrixDecodeLine({ text, isLast, delay = 0 }) {
  const [displayText, setDisplayText] = useState('');
  const [completed, setCompleted] = useState(false);
  const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$&%*@!~?<>';

  useEffect(() => {
    let timeoutId;
    let intervalId;

    timeoutId = setTimeout(() => {
      let step = 0;
      const targetLength = text.length;
      const stepsPerChar = 3;
      const maxSteps = targetLength * stepsPerChar;

      intervalId = setInterval(() => {
        setDisplayText(() => {
          return text
            .split('')
            .map((char, idx) => {
              if (char === ' ' || char === '\n') return char;
              const solvedChars = Math.floor(step / stepsPerChar);
              if (idx < solvedChars) {
                return text[idx];
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('');
        });

        step += 1;
        if (step >= maxSteps) {
          clearInterval(intervalId);
          setDisplayText(text);
          setCompleted(true);
        }
      }, 32);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, delay]);

  const isAutomate = isLast || text.toUpperCase().includes('AUTOMATE');

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <span
        className={isAutomate ? 'font-black' : 'text-slate-100 font-extrabold'}
        style={
          isAutomate
            ? {
                color: '#0055ff',
                backgroundImage: 'linear-gradient(90deg, #00d2ff 0%, #0055ff 45%, #0044ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(0, 85, 255, 0.9))',
              }
            : {}
        }
      >
        {displayText}
      </span>
      {isLast && completed && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 450, damping: 14 }}
          className="inline-block w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-[#0055ff] shadow-[0_0_22px_#0055ff] animate-pulse"
        />
      )}
    </div>
  );
}

/* ---------------- Home Hero Landing View ---------------- */
export function HomeHeroView({ editorMode, heroConfig, onSaveHeroConfig, onNavigate }) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const defaultVideo = 'https://assets.mixkit.co/videos/preview/mixkit-robotic-arm-in-a-factory-43251-large.mp4';

  const videoUrl = heroConfig?.videoUrl || defaultVideo;
  const videoOpacity = heroConfig?.videoOpacity !== undefined ? heroConfig.videoOpacity : 0.4;
  const badge = heroConfig?.badge || 'PLATAFORMA INDUSTRIAL 4.0';
  const title = heroConfig?.title || 'THINK.\nDESIGN.\nAUTOMATE.';
  const subtitle = heroConfig?.subtitle || 'Gemelo Digital 3D, Inteligencia Artificial y Monitoreo en Tiempo Real para la Maximización Operativa.';

  const lines = title.split('\n');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-[calc(100vh-130px)] flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-[#05080d]"
    >
      {/* Hero Video Background - Loads & Plays Immediately */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{ opacity: videoOpacity }}
            className="w-full h-full object-cover filter contrast-125 saturate-110 scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-950/50 via-[#05080d] to-cyan-950/50" />
        )}
        
        {/* Ambient Dark Gradients & Grid Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080d] via-[#05080d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080d] via-[#05080d]/40 to-[#05080d]" />
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(0,140,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,140,255,0.15) 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />
      </div>

      {/* Editor Trigger Overlay Badge */}
      {editorMode && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowEditDialog(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-400/60 text-blue-300 text-xs font-bold uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_15px_rgba(0,102,255,0.4)] pointer-events-auto"
          >
            <Edit size={14} /> Editar Hero (Video y Textos)
          </button>
        </div>
      )}

      {/* Main Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-[11px] font-bold uppercase tracking-widest mb-8 shadow-[0_0_12px_rgba(0,102,255,0.2)]"
        >
          <Sparkles size={13} className="animate-pulse text-blue-400" />
          <span>{badge}</span>
        </motion.div>

        {/* Big Impactful Title with Sequential Matrix Decode */}
        <h1 className="scr-display font-black tracking-tight text-white uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-center select-none space-y-1">
          {lines.map((lineText, idx) => {
            const isLast = idx === lines.length - 1;
            const lineDelay = 150 + idx * 450;
            return (
              <MatrixDecodeLine
                key={idx + '-' + lineText}
                text={lineText}
                isLast={isLast}
                delay={lineDelay}
              />
            );
          })}
        </h1>

        {/* Decorative Divider Line */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '90px', opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="h-1.5 rounded-full my-6 shadow-[0_0_15px_#0055ff]"
          style={{ background: 'linear-gradient(90deg, #00d2ff 0%, #0055ff 50%, #0044ff 100%)' }}
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="text-slate-300 text-base sm:text-lg md:text-xl font-medium max-w-2xl leading-relaxed text-center drop-shadow-md"
        >
          {subtitle}
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => onNavigate && onNavigate('control')}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-sm tracking-wider uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(34,211,238,0.4)]"
          >
            Ingresar al Sistema <ArrowRight size={16} />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('twin')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 font-semibold text-sm tracking-wider uppercase hover:border-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-all shadow-lg"
          >
            <Box size={16} className="text-cyan-400" /> Gemelo Digital 3D
          </button>
        </motion.div>
      </div>

      {/* Bottom Features Cards Bar */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-t border-slate-800/80 bg-[#05080d]/80 backdrop-blur-md">
        <div 
          onClick={() => onNavigate && onNavigate('control')}
          className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity size={15} /> Centro de Control
          </div>
          <p className="text-slate-400 text-xs leading-snug">Monitoreo en tiempo real de OEE, disponibilidad y alertas operativas de planta.</p>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('twin')}
          className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Box size={15} /> Gemelo Digital CAD
          </div>
          <p className="text-slate-400 text-xs leading-snug">Modelado 3D fidedigno de estaciones de ensamble con rotación y cotas de precisión.</p>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('ai')}
          className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} /> Inteligencia IA
          </div>
          <p className="text-slate-400 text-xs leading-snug">Diagnóstico prescriptivo de fallas y recomendaciones óptimas de proceso.</p>
        </div>
      </div>

      {/* Hero Editor Dialog */}
      <HeroEditorDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        currentConfig={{ videoUrl, videoOpacity, badge, title, subtitle }}
        onSave={(newCfg) => {
          onSaveHeroConfig && onSaveHeroConfig(newCfg);
          setShowEditDialog(false);
        }}
      />
    </motion.div>
  );
}

/* ---------------- Hero Editor Dialog ---------------- */
function HeroEditorDialog({ open, onClose, currentConfig, onSave }) {
  const [videoUrl, setVideoUrl] = useState(currentConfig?.videoUrl || '');
  const [videoOpacity, setVideoOpacity] = useState(currentConfig?.videoOpacity !== undefined ? currentConfig.videoOpacity : 0.4);
  const [badge, setBadge] = useState(currentConfig?.badge || '');
  const [title, setTitle] = useState(currentConfig?.title || '');
  const [subtitle, setSubtitle] = useState(currentConfig?.subtitle || '');

  useEffect(() => {
    if (currentConfig) {
      setVideoUrl(currentConfig.videoUrl || '');
      setVideoOpacity(currentConfig.videoOpacity !== undefined ? currentConfig.videoOpacity : 0.4);
      setBadge(currentConfig.badge || '');
      setTitle(currentConfig.title || '');
      setSubtitle(currentConfig.subtitle || '');
    }
  }, [currentConfig, open]);

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('El video es demasiado grande para memoria local. Use videos menores a 15MB o un enlace de video web.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({ videoUrl, videoOpacity, badge, title, subtitle });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(3,6,12,0.8)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border p-6 text-slate-200"
            style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}
          >
            <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--scr-border)' }}>
              <div className="rounded-xl p-2.5 bg-cyan-500/10 text-cyan-400">
                <Video size={22} />
              </div>
              <div>
                <h4 className="scr-display font-bold text-lg text-slate-50">Configurar Hero de Inicio</h4>
                <p className="text-slate-400 text-xs">Cargue el video de fondo y personalice los títulos y subtítulos.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Video URL or File Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Video de Fondo Hero (MP4 / WebM / URL)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Enlace URL directo a video (e.g. https://.../video.mp4)"
                    className="w-full rounded-xl border text-slate-200 text-xs p-2.5 outline-none focus:border-cyan-500"
                    style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="hidden"
                      id="hero-video-file"
                    />
                    <label
                      htmlFor="hero-video-file"
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-2.5 px-3 text-xs text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 cursor-pointer transition-all"
                    >
                      <Upload size={14} /> Cargar Archivo de Video Local (.mp4)
                    </label>
                  </div>
                </div>
              </div>

              {/* Transparencia / Opacidad del Video */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                  <label>Transparencia / Opacidad del Video</label>
                  <span className="scr-mono text-cyan-400 font-extrabold">{Math.round(videoOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={videoOpacity}
                  onChange={(e) => setVideoOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-800 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Badge text */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Etiqueta Superior (Badge)</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. PLATAFORMA INDUSTRIAL 4.0"
                  className="w-full rounded-xl border text-slate-200 text-xs p-2.5 outline-none focus:border-cyan-500"
                  style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                />
              </div>

              {/* Hero Title (Multiline) */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Título Principal (Cada línea en un renglón)</label>
                <textarea
                  rows={3}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="THINK.&#10;DESIGN.&#10;AUTOMATE."
                  className="w-full rounded-xl border text-slate-200 text-xs p-2.5 outline-none focus:border-cyan-500 scr-mono font-bold uppercase tracking-wider"
                  style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Subtítulo / Descripción</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Descripción secundaria..."
                  className="w-full rounded-xl border text-slate-200 text-xs p-2.5 outline-none focus:border-cyan-500"
                  style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--scr-border)' }}>
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs border text-slate-500 border-slate-700 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl px-5 py-2 text-xs text-[#05080d] font-bold bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                Guardar Hero
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
