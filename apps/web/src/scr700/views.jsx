import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ComposedChart,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Play, RotateCw,
  UploadCloud, BellRing, Wrench, Box, FlaskConical, GitCompare, FileText,
  Sparkles, CheckCircle2, XCircle, CalendarClock, Cpu, Gauge, Zap, Droplets,
  Activity, Target, ShieldCheck, CheckCircle, Clock, OctagonX, ChevronDown,
  SlidersHorizontal, Maximize2,
  Edit, X, Image, FileCode,
} from 'lucide-react';
import {
  MACHINES, ALARMS, AI_RECS, PROD_SERIES, OEE_SERIES, ENERGY_SERIES,
  PARETO, QUALITY_DONUT, MAINTENANCE, PARAM_SCENARIOS, REPORTS, USERS,
  MACHINE_IMAGES, PLANT_MAP, PLANTS, STATUS,
  DASH_KPIS, PROCESS_STATIONS, STATION_IMAGES, MACHINE_STATUS, AI_INSIGHTS,
  THROUGHPUT_BARS, PPM_SERIES, QUALITY_LEGEND,
} from './data';
import { Panel, Pill, Dot, Btn, statusColor, statusLabel, chartTheme } from './ui';

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
  
  const isModel = asset && asset.type === 'model';
  const assetUrl = asset ? asset.value : STATION_IMAGES[st.img];
  const rotate = asset ? asset.rotate !== false : true;
  const hueRotate = asset ? asset.hueRotate || 0 : 0;
  const filterStyle = hueRotate ? `hue-rotate(${hueRotate}deg)` : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
      className={`relative flex flex-col items-center shrink-0 ${editorMode ? 'group cursor-pointer' : ''}`}
      style={{ width: 150 }}
      onClick={editorMode ? onEdit : undefined}
    >
      <div className="relative h-[130px] w-[130px] grid place-items-center">
        {/* glow platform */}
        <span
          className="absolute bottom-2 left-1/2 -translate-x-1/2"
          style={{ width: 108, height: 30, borderRadius: '50%', background: `radial-gradient(ellipse at center, ${c}55, transparent 70%)`, filter: 'blur(2px)' }}
        />
        <span
          className="absolute bottom-3 left-1/2 -translate-x-1/2"
          style={{ width: 92, height: 20, borderRadius: '50%', border: `1px solid ${c}77`, boxShadow: `0 0 12px ${c}55` }}
        />
        
        {isModel ? (
          <div
            style={{ width: '118px', height: '118px', filter: filterStyle }}
            className="relative drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] flex items-center justify-center"
          >
            <model-viewer
              src={assetUrl}
              alt={st.name}
              auto-rotate={rotate ? "" : undefined}
              interaction-prompt="none"
              style={{ width: '118px', height: '118px', background: 'transparent' }}
            />
          </div>
        ) : (
          <img src={assetUrl} alt={st.name} style={{ filter: filterStyle }} className="relative h-[118px] w-[118px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]" />
        )}

        {editorMode && (
          <div className="absolute inset-0 bg-[#05080d]/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-cyan-500 text-[#05080d] p-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-lg">
              <Edit size={12} /> EDITAR
            </div>
          </div>
        )}
      </div>
      <div className="mt-1 text-center px-1">
        <div className="flex items-center justify-center gap-1.5">
          {st.num && <span className="scr-mono text-[12px] font-bold" style={{ color: c }}>{st.num}</span>}
          <span className="scr-display text-[11px] font-semibold text-slate-200 whitespace-pre-line leading-tight">{st.name}</span>
        </div>
        {meta && (
          <div className="mt-1 flex items-center justify-center gap-1 text-[10px]" style={{ color: meta.color }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
            {meta.label}
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
  onResetStationAsset
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
          <button className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-200" style={{ border: '1px solid var(--scr-border)' }}><Maximize2 size={14} /></button>
        </div>
      </header>
      <div className="relative" style={{ background: bgGradient }}>
        {/* grid floor */}
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)', backgroundSize: '46px 46px', maskImage: 'linear-gradient(180deg, transparent, black 40%, black)' }} />
        <div className="relative overflow-x-auto pt-6 pb-6 px-4">
          <div className="flex items-center gap-1 min-w-max mx-auto w-fit">
            {PROCESS_STATIONS.map((st, i) => (
              <React.Fragment key={st.id}>
                <ProcessStation
                  st={st}
                  i={i}
                  editorMode={editorMode}
                  asset={stationAssets[st.id]}
                  onEdit={() => setEditingStation(st)}
                />
                {i < PROCESS_STATIONS.length - 1 && (
                  <svg width="34" height="4" className="shrink-0 -mt-6"><line x1="0" y1="2" x2="34" y2="2" stroke="#22d3ee" strokeWidth="2" className="scr-flow" opacity="0.7" /></svg>
                )}
              </React.Fragment>
            ))}
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
  onResetStationAsset 
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

export function StationAssetEditorDialog({ open, onClose, station, currentAsset, onSave, onReset }) {
  const [assetType, setAssetType] = useState(currentAsset?.type || 'image');
  const [assetValue, setAssetValue] = useState(currentAsset?.value || '');
  const [urlInput, setUrlInput] = useState(currentAsset?.value && !currentAsset.value.startsWith('data:') ? currentAsset.value : '');
  const [rotate, setRotate] = useState(currentAsset?.rotate !== false);
  const [hueRotate, setHueRotate] = useState(currentAsset?.hueRotate || 0);
  const [hasColorFilter, setHasColorFilter] = useState(!!currentAsset?.hueRotate);

  // Reset local state if station changes
  React.useEffect(() => {
    if (station) {
      setAssetType(currentAsset?.type || 'image');
      setAssetValue(currentAsset?.value || '');
      setUrlInput(currentAsset?.value && !currentAsset.value.startsWith('data:') ? currentAsset.value : '');
      setRotate(currentAsset?.rotate !== false);
      setHueRotate(currentAsset?.hueRotate || 0);
      setHasColorFilter(!!currentAsset?.hueRotate);
    }
  }, [station, currentAsset]);

  if (!open || !station) return null;

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
        style={{ background: 'rgba(3,6,12,0.75)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-xl border p-6 text-slate-200"
          style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--scr-border)' }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-cyan-500/10 text-cyan-400">
                <Edit size={20} />
              </div>
              <div>
                <h4 className="scr-display font-bold text-base text-slate-50">Editar Estación: {station.name}</h4>
                <p className="text-slate-400 text-xs font-medium">Sube una imagen 2D o un modelo 3D (.glb) para esta estación.</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors"><X size={18} /></button>
          </div>

          <div className="mt-5 space-y-6">
            {/* Asset Type Selector */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Tipo de Recurso</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setAssetType('image'); setAssetValue(''); setUrlInput(''); }}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors"
                  style={{
                    borderColor: assetType === 'image' ? '#22d3ee' : 'var(--scr-border)',
                    background: assetType === 'image' ? 'rgba(34,211,238,0.1)' : 'var(--scr-panel-2)',
                    color: assetType === 'image' ? '#22d3ee' : 'var(--scr-text-300)'
                  }}
                >
                  <Image size={14} /> Imagen 2D
                </button>
                <button
                  type="button"
                  onClick={() => { setAssetType('model'); setAssetValue(''); setUrlInput(''); }}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors"
                  style={{
                    borderColor: assetType === 'model' ? '#22d3ee' : 'var(--scr-border)',
                    background: assetType === 'model' ? 'rgba(34,211,238,0.1)' : 'var(--scr-panel-2)',
                    color: assetType === 'model' ? '#22d3ee' : 'var(--scr-text-300)'
                  }}
                >
                  <FileCode size={14} /> Modelo 3D (.glb)
                </button>
              </div>
            </div>

            {/* Asset Input: File or URL */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold font-medium">
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
                  className="flex items-center justify-center gap-2 border border-dashed rounded-lg py-4 px-4 text-xs font-medium cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5 transition-all text-slate-400 flex-1 text-center"
                  style={{ borderColor: 'var(--scr-border)' }}
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
                    className="flex-1 rounded-lg border text-slate-200 text-xs p-2 outline-none focus:border-cyan-500"
                    style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 rounded-lg text-xs font-semibold bg-[#05080d] hover:bg-slate-800 transition-colors border"
                    style={{ borderColor: 'var(--scr-border)', color: 'var(--scr-text-200)' }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

            {/* Rotation Controls for Model */}
            {assetType === 'model' && (
              <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--scr-border)' }}>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Rotación del Modelo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotate(true)}
                    className="py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors"
                    style={{
                      borderColor: rotate ? '#22d3ee' : 'var(--scr-border)',
                      background: rotate ? 'rgba(34,211,238,0.1)' : 'var(--scr-panel-2)',
                      color: rotate ? '#22d3ee' : 'var(--scr-text-300)'
                    }}
                  >
                    Girar Automáticamente
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotate(false)}
                    className="py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors"
                    style={{
                      borderColor: !rotate ? '#22d3ee' : 'var(--scr-border)',
                      background: !rotate ? 'rgba(34,211,238,0.1)' : 'var(--scr-panel-2)',
                      color: !rotate ? '#22d3ee' : 'var(--scr-text-300)'
                    }}
                  >
                    Estático
                  </button>
                </div>
              </div>
            )}

            {/* Color Filter Controls */}
            <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--scr-border)' }}>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Filtro de Color</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHasColorFilter(false);
                    setHueRotate(0);
                  }}
                  className="py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors"
                  style={{
                    borderColor: !hasColorFilter ? '#22d3ee' : 'var(--scr-border)',
                    background: !hasColorFilter ? 'rgba(34,211,238,0.1)' : 'var(--scr-panel-2)',
                    color: !hasColorFilter ? '#22d3ee' : 'var(--scr-text-300)'
                  }}
                >
                  Colores Originales
                </button>
                <button
                  type="button"
                  onClick={() => setHasColorFilter(true)}
                  className="py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors"
                  style={{
                    borderColor: hasColorFilter ? '#22d3ee' : 'var(--scr-border)',
                    background: hasColorFilter ? 'rgba(34,211,238,0.1)' : 'var(--scr-panel-2)',
                    color: hasColorFilter ? '#22d3ee' : 'var(--scr-text-300)'
                  }}
                >
                  Tonalidad Personalizada
                </button>
              </div>

              {hasColorFilter && (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400 font-medium">Rotación de Matiz (Hue Rotate)</span>
                    <span className="text-xs scr-mono text-cyan-400 font-bold">{hueRotate}°</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hueRotate}
                      onChange={(e) => setHueRotate(parseInt(e.target.value))}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer outline-none"
                      style={{
                        background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                      }}
                    />
                    {hueRotate > 0 && (
                      <button
                        type="button"
                        onClick={() => setHueRotate(0)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-bold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Section */}
            {assetValue && (
              <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--scr-border)' }}>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Vista Previa</label>
                <div className="rounded-lg p-2 flex items-center justify-center bg-[#05080d]/60 border" style={{ borderColor: 'var(--scr-border)', minHeight: '140px' }}>
                  {assetType === 'image' ? (
                    <img
                      src={assetValue}
                      alt="Preview"
                      className="max-h-[120px] object-contain rounded"
                      style={{ filter: (hasColorFilter && hueRotate) ? `hue-rotate(${hueRotate}deg)` : undefined }}
                    />
                  ) : (
                    <div style={{ filter: (hasColorFilter && hueRotate) ? `hue-rotate(${hueRotate}deg)` : undefined }}>
                      <model-viewer
                        src={assetValue}
                        alt="Preview 3D"
                        auto-rotate={rotate ? "" : undefined}
                        camera-controls
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

          {/* Footer Actions */}
          <div className="mt-6 flex justify-between items-center border-t pt-4" style={{ borderColor: 'var(--scr-border)' }}>
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
                className="rounded-lg text-xs font-semibold px-4 py-2 hover:bg-slate-800 transition-colors border"
                style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)', color: 'var(--scr-text-300)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onSave({ type: assetType, value: assetValue, rotate, hueRotate: hasColorFilter ? hueRotate : 0 })}
                disabled={!assetValue}
                className="rounded-lg text-xs font-semibold px-4 py-2 transition-all active:scale-[0.97] disabled:opacity-40"
                style={{ background: 'linear-gradient(180deg,#22d3ee,#3b82f6)', color: '#05080d' }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
