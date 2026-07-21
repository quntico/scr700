import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Factory, Cpu, Box, PackageCheck,
  BellRing, LineChart, Sparkles, Calculator, Wrench, Zap, FileText,
  Users, Settings, Menu, ChevronLeft, ChevronDown, Clock,
  Server, Database, Gauge, MessageSquare, AlertTriangle, CircleDot,
  Sun, Moon, Lock, Unlock, Upload, Trash2, Image, Edit, Home,
} from 'lucide-react';
import { PLANTS, LINES, SHIFTS, ALARMS } from './data';
import { Dot } from './ui';
import MachinePanel from './MachinePanel';
import {
  DashboardView, TwinView, MachinesView, AnalyticsView, IntelligenceView,
  ParametricsView, AlarmsView, MaintenanceView, EnergyView, ReportsView,
  PlantsView, UsersView, GenericView, HomeHeroView
} from './views';
import { CadSandboxOverlay } from './CadSandboxViewer3D';
import { getSettings, setSetting, removeSetting } from '../utils/supabase/settings';
import { idbGet } from '../utils/supabase/idb';

const NAV = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'control', label: 'Centro de Control', icon: LayoutDashboard },
  { id: 'plants', label: 'Plantas', icon: Factory },
  { id: 'machines', label: 'Máquinas', icon: Cpu },
  { id: 'twin', label: 'Gemelo Digital', icon: Box },
  { id: 'production', label: 'Producción', icon: PackageCheck },
  { id: 'analytics', label: 'Analítica', icon: LineChart },
  { id: 'ai', label: 'IA', icon: Sparkles },
  { id: 'params', label: 'Paramétricos', icon: Calculator },
  { id: 'maint', label: 'Mantenimiento', icon: Wrench },
  { id: 'energy', label: 'Energía', icon: Zap },
  { id: 'reports', label: 'Reportes', icon: FileText },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'config', label: 'Configuración', icon: Settings },
];

const TITLES = Object.fromEntries(NAV.map((n) => [n.id, n.label]));

function PlantSelectorDropdown({ plant, setPlant, line, setLine, shift, setShift }) {
  const [open, setOpen] = useState(false);

  const plantShort = (plant || '').split('—')[0].trim();
  const lineShort = (line || '').split('—')[0].trim();
  const shiftShort = (shift || '').split('(')[0].trim();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border bg-slate-900/60 hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-all shadow-sm group"
        style={{ borderColor: open ? '#22d3ee' : 'var(--scr-border)' }}
        title="Configurar Planta, Línea y Turno"
      >
        <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
          <Factory size={16} />
        </div>
        <div className="text-left leading-tight">
          <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <span>Ubicación y Operación</span>
          </div>
          <div className="text-[12px] font-semibold text-slate-100 flex items-center gap-1">
            <span>{plantShort}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">{lineShort}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 text-[11px]">{shiftShort}</span>
          </div>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ml-1 ${open ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 mt-2 z-50 w-80 rounded-2xl border bg-[#070d18]/96 border-cyan-500/30 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <Factory size={15} /> Selectores de Planta
                </div>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
                  SCR700 TWIN
                </span>
              </div>

              {/* Selector 1: Planta */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Factory size={13} className="text-cyan-400" /> Planta Industrial
                </label>
                <div className="space-y-1">
                  {PLANTS.map((p) => {
                    const selected = plant === p.name;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPlant(p.name)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                          selected
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-semibold shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                            : 'bg-slate-900/50 border border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <span>{p.name}</span>
                        {selected && <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector 2: Línea */}
              <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu size={13} className="text-cyan-400" /> Línea de Proceso
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {LINES.map((l) => {
                    const selected = line === l;
                    return (
                      <button
                        key={l}
                        onClick={() => setLine(l)}
                        className={`text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                          selected
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-semibold'
                            : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <span>{l}</span>
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector 3: Turno */}
              <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-cyan-400" /> Turno Operativo
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {SHIFTS.map((s) => {
                    const selected = shift === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setShift(s)}
                        className={`text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                          selected
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-semibold'
                            : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <span>{s}</span>
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[11px] font-bold uppercase tracking-wider hover:bg-cyan-400 transition-colors shadow"
                >
                  Listo
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Scr700App() {
  const [active, setActive] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [machine, setMachine] = useState(null);
  const [plant, setPlant] = useState(PLANTS[0].name);
  const [line, setLine] = useState(LINES[0]);
  const [shift, setShift] = useState(SHIFTS[0]);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('scr700-theme') || 'dark';
  });

  const [heroConfig, setHeroConfig] = useState(() => {
    if (typeof window === 'undefined') return {};
    const val = window.localStorage.getItem('scr700-hero-config');
    if (val) {
      try { return JSON.parse(val); } catch (e) {}
    }
    return {
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-robotic-arm-in-a-factory-43251-large.mp4',
      badge: 'PLATAFORMA INDUSTRIAL 4.0',
      title: 'THINK.\nDESIGN.\nAUTOMATE.',
      subtitle: 'Gemelo Digital 3D, Inteligencia Artificial y Monitoreo en Tiempo Real para la Maximización Operativa.'
    };
  });

  const [editorMode, setEditorMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoDark, setLogoDark] = useState(() => {
    if (typeof window === 'undefined') return '/logo-dark.png';
    return window.localStorage.getItem('scr700-logo-dark') || '/logo-dark.png';
  });
  const [logoLight, setLogoLight] = useState(() => {
    if (typeof window === 'undefined') return '/logo-light.png';
    return window.localStorage.getItem('scr700-logo-light') || '/logo-light.png';
  });
  const [logoSize, setLogoSize] = useState(() => {
    if (typeof window === 'undefined') return 128;
    const val = window.localStorage.getItem('scr700-logo-size');
    return val ? parseInt(val, 10) : 128;
  });

  const [stationAssets, setStationAssets] = useState(() => {
    if (typeof window === 'undefined') return {};
    const assets = {
      s01: { metadata: { capacityValue: '950', capacityUnit: 'kg/h' } },
      s03: { metadata: { capacityValue: '300', capacityUnit: 'u/h', power: true, water: true } }
    };
    const ids = ['win', 's01', 's02', 's03', 's04', 's05', 'wout'];
    for (const id of ids) {
      const val = window.localStorage.getItem(`scr700-station-asset-${id}`);
      if (val) {
        try {
          assets[id] = JSON.parse(val);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return assets;
  });

  const [showSandbox, setShowSandbox] = useState(false);
  const [studioSettings, setStudioSettings] = useState({
    brightness: 40,
    shadowAngle: 210,
    metallic: 75,
    roughness: 55,
    silhouettes: 0,
    floorStyle: 'grid',
    gridOpacity: 100,
    fog: 10,
    backlight: true
  });

  // Load all settings asynchronously from Supabase & IndexedDB cache on mount
  useEffect(() => {
    async function loadAllSettings() {
      const ids = ['win', 's01', 's02', 's03', 's04', 's05', 'wout'];
      const defaultMetadata = {
        s01: { metadata: { capacityValue: '950', capacityUnit: 'kg/h' } },
        s03: { metadata: { capacityValue: '300', capacityUnit: 'u/h', power: true, water: true } }
      };

      // Fast-pass: load instantly from IndexedDB disk cache
      try {
        const fastAssets = { ...defaultMetadata };
        let hasFast = false;
        for (const id of ids) {
          const cached = await idbGet(`scr700-station-asset-${id}`);
          if (cached) {
            try {
              fastAssets[id] = JSON.parse(cached);
              hasFast = true;
            } catch (e) {}
          }
        }
        if (hasFast) {
          setStationAssets(fastAssets);
        }
      } catch (e) {}

      // Full-pass: fetch latest settings from Supabase
      const settings = await getSettings();
      if (settings['scr700-theme']) {
        setTheme(settings['scr700-theme']);
      }
      if (settings['scr700-logo-dark']) {
        setLogoDark(settings['scr700-logo-dark']);
      }
      if (settings['scr700-logo-light']) {
        setLogoLight(settings['scr700-logo-light']);
      }
      if (settings['scr700-logo-size']) {
        setLogoSize(parseInt(settings['scr700-logo-size'], 10) || 128);
      }
      if (settings['scr700-hero-config']) {
        try {
          setHeroConfig(JSON.parse(settings['scr700-hero-config']));
        } catch (e) {
          console.error(e);
        }
      }
      if (settings['scr700-studio-settings']) {
        try {
          setStudioSettings(JSON.parse(settings['scr700-studio-settings']));
        } catch (e) {
          console.error(e);
        }
      }
      
      const assets = { ...defaultMetadata };
      for (const id of ids) {
        const val = settings[`scr700-station-asset-${id}`];
        if (val) {
          try {
            assets[id] = JSON.parse(val);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setStationAssets(assets);
    }
    loadAllSettings();
  }, []);

  const handleSaveLogos = async (dark, light, size) => {
    setLogoDark(dark);
    setLogoLight(light);
    setLogoSize(size);
    setShowLogoModal(false);
    
    await setSetting('scr700-logo-dark', dark);
    await setSetting('scr700-logo-light', light);
    await setSetting('scr700-logo-size', size.toString());
  };

  const handleResetLogos = async () => {
    setLogoDark('/logo-dark.png');
    setLogoLight('/logo-light.png');
    setLogoSize(128);
    setShowLogoModal(false);

    await removeSetting('scr700-logo-dark');
    await removeSetting('scr700-logo-light');
    await removeSetting('scr700-logo-size');
  };

  const currentLogo = theme === 'dark' ? logoDark : logoLight;

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    await setSetting('scr700-theme', next);
  };

  const handleSaveStationAsset = async (stationId, asset) => {
    setStationAssets((prev) => ({ ...prev, [stationId]: asset }));
    await setSetting(`scr700-station-asset-${stationId}`, JSON.stringify(asset));
  };

  const handleResetStationAsset = async (stationId) => {
    setStationAssets((prev) => {
      const copy = { ...prev };
      delete copy[stationId];
      return copy;
    });
    await removeSetting(`scr700-station-asset-${stationId}`);
  };

  const handleSaveStudioSettings = async (settingsObj) => {
    setStudioSettings((prev) => {
      const merged = { ...prev, ...settingsObj };
      // Save the merged settings asynchronously
      setSetting('scr700-studio-settings', JSON.stringify(merged)).catch(console.error);
      return merged;
    });
  };

  const handleSaveHeroConfig = async (cfg) => {
    setHeroConfig(cfg);
    await setSetting('scr700-hero-config', JSON.stringify(cfg));
  };

  const handleResetAllAssets = async () => {
    if (window.confirm("¿Seguro que deseas restablecer todos los modelos y configuraciones 3D a sus valores de fábrica?")) {
      const ids = ['win', 's01', 's02', 's03', 's04', 's05', 'wout'];
      setStationAssets({});
      for (const id of ids) {
        await removeSetting(`scr700-station-asset-${id}`);
      }
    }
  };

  const activeAlarms = ALARMS.filter((a) => !a.ack).length;
  const selectMachine = (m) => setMachine(m);

  const render = () => {
    switch (active) {
      case 'home':
        return (
          <HomeHeroView
            editorMode={editorMode}
            heroConfig={heroConfig}
            onSaveHeroConfig={handleSaveHeroConfig}
            onNavigate={(targetView) => setActive(targetView)}
          />
        );
      case 'control': 
        return (
          <DashboardView 
            onSelectMachine={selectMachine} 
            theme={theme} 
            editorMode={editorMode} 
            stationAssets={stationAssets}
            onSaveStationAsset={handleSaveStationAsset}
            onResetStationAsset={handleResetStationAsset}
            onOpenSandbox={() => setShowSandbox(true)}
          />
        );
      case 'plants': return <PlantsView />;
      case 'machines': return <MachinesView onSelectMachine={selectMachine} />;
      case 'twin': return <TwinView onSelectMachine={selectMachine} selected={machine} />;
      case 'production': return <GenericView title="Producción" desc="Órdenes de producción, ritmo de línea, cumplimiento de plan y tiempo takt por turno. Datos demo disponibles en Centro de Control y Analítica." />;
      case 'alarms': return <AlarmsView />;
      case 'analytics': return <AnalyticsView />;
      case 'ai': return <IntelligenceView />;
      case 'params': return <ParametricsView />;
      case 'maint': return <MaintenanceView />;
      case 'energy': return <EnergyView />;
      case 'reports': return <ReportsView />;
      case 'users': return <UsersView />;
      case 'config': return <GenericView title="Configuración" desc="Preferencias del sistema, unidades, integraciones OPC-UA/MQTT, umbrales de alarma y respaldo. Módulo independiente SCR700." />;
      default: return null;
    }
  };

  const NavList = ({ onNav }) => (
    <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
      {NAV.map((n) => {
        const on = active === n.id;
        return (
          <button key={n.id} onClick={() => { setActive(n.id); onNav && onNav(); }}
            title={n.label}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${collapsed ? 'justify-center' : ''}`}
            style={on ? { background: 'linear-gradient(90deg,rgba(34,211,238,0.18),transparent)', color: 'var(--scr-nav-active-text)', boxShadow: 'inset 2px 0 0 #22d3ee' } : { color: 'var(--scr-text-400)' }}
          >
            <n.icon size={18} strokeWidth={on ? 2.4 : 2} />
            {!collapsed && <span className="truncate">{n.label}</span>}
            {!collapsed && n.id === 'alarms' && activeAlarms > 0 && <span className="ml-auto scr-mono text-[10px] px-1.5 rounded-full text-white scr-blink" style={{ background: '#ef4444' }}>{activeAlarms}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className={`scr700 ${theme} flex h-screen w-full overflow-hidden text-slate-200`} style={{ background: 'var(--scr-bg)' }}>
      <Helmet><title>SCR700 — Inteligencia Industrial y Sistema de Control</title></Helmet>

      {/* Sidebar desktop */}
      <aside className={`hidden lg:flex flex-col border-r transition-all duration-300 relative ${collapsed ? 'w-[68px]' : 'w-64'}`} style={{ background: 'var(--scr-graphite)', borderColor: 'var(--scr-border)' }}>
        <div 
          className="flex items-center justify-between border-b px-3 relative" 
          style={{ borderColor: 'var(--scr-border)', height: '78px' }}
        >
          <div 
            onClick={editorMode ? () => setShowLogoModal(true) : undefined}
            title={editorMode ? 'Configurar logotipos del sistema' : undefined}
            className={`flex items-center justify-center flex-1 transition-all relative ${editorMode ? 'cursor-pointer hover:bg-cyan-500/10 group' : ''}`} 
          >
            <div 
              className="flex items-center justify-center"
              style={{ width: collapsed ? '40px' : `${logoSize}px`, height: collapsed ? '40px' : `${logoSize}px` }}
            >
              {currentLogo ? (
                <img src={currentLogo} alt="Logo" className="object-contain rounded-lg shrink-0" style={{ width: collapsed ? '40px' : `${logoSize}px`, height: collapsed ? '40px' : `${logoSize}px` }} />
              ) : (
                <div className="grid place-items-center rounded-lg shrink-0 shadow-[0_0_15px_rgba(0,210,255,0.4)]" style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #00d2ff 50%, #0284c7 100%)', width: collapsed ? '36px' : `${logoSize}px`, height: collapsed ? '36px' : `${logoSize}px` }}>
                  <CircleDot size={collapsed ? 20 : Math.round(logoSize * 0.53)} color="#05080d" />
                </div>
              )}
              {editorMode && !collapsed && (
                <div className="absolute inset-0 bg-[#05080d]/70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit size={Math.round(logoSize * 0.33)} className="text-cyan-400" />
                </div>
              )}
            </div>
          </div>

          {/* Floating Collapse Tab on Top Right Edge of Sidebar */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="absolute -right-3 top-6 z-20 grid place-items-center h-7 w-7 rounded-full border bg-slate-900 border-cyan-500/50 text-cyan-400 hover:text-white hover:bg-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:scale-110"
              title="Minimizar / Contraer Panel Lateral"
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        <NavList />
        
        {/* Bottom Expand/Collapse Button Tab */}
        <button 
          onClick={() => setCollapsed((c) => !c)} 
          className={`flex items-center gap-2 px-3 py-3 border-t text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all text-[12px] ${collapsed ? 'justify-center' : 'justify-between'}`} 
          style={{ borderColor: 'var(--scr-border)' }}
          title={collapsed ? 'Expandir Panel' : 'Minimizar / Contraer Panel'}
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180 text-cyan-400' : ''}`} />
            {!collapsed && <span className="font-bold uppercase tracking-wider text-[10px] text-slate-300">Minimizar Panel</span>}
          </div>
          {!collapsed && (
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">OCULTAR</span>
          )}
        </button>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(3,6,12,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed left-0 top-0 z-50 h-full w-64 flex flex-col border-r lg:hidden" style={{ background: 'var(--scr-graphite)', borderColor: 'var(--scr-border)' }}>
              <div 
                onClick={editorMode ? () => setShowLogoModal(true) : undefined}
                title={editorMode ? 'Configurar logotipos del sistema' : undefined}
                className={`flex items-center justify-center w-full border-b transition-all relative ${editorMode ? 'cursor-pointer hover:bg-cyan-500/10 group' : ''}`} 
                style={{ borderColor: 'var(--scr-border)', height: '78px' }}
              >
                <div 
                  className="absolute flex items-center justify-center"
                  style={{ width: `${logoSize}px`, height: `${logoSize}px`, top: '50%', transform: 'translateY(-50%)' }}
                >
                  {currentLogo ? (
                    <img src={currentLogo} alt="Logo" className="object-contain rounded-lg shrink-0" style={{ width: `${logoSize}px`, height: `${logoSize}px` }} />
                  ) : (
                    <div className="grid place-items-center rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg,#22d3ee,#3b82f6)', width: `${logoSize}px`, height: `${logoSize}px` }}>
                      <CircleDot size={Math.round(logoSize * 0.53)} color="#05080d" />
                    </div>
                  )}
                  {editorMode && (
                    <div className="absolute inset-0 bg-[#05080d]/70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit size={Math.round(logoSize * 0.33)} className="text-cyan-400" />
                    </div>
                  )}
                </div>
              </div>
              <NavList onNav={() => setMobileNav(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="shrink-0 flex items-center gap-2 px-3 border-b" style={{ background: 'var(--scr-graphite)', borderColor: 'var(--scr-border)', height: '78px' }}>
          {/* Desktop Toggle Sidebar Tab */}
          <button 
            onClick={() => setCollapsed(c => !c)} 
            className="hidden lg:grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 border transition-all mr-1"
            style={{ borderColor: 'var(--scr-border)' }}
            title={collapsed ? "Expandir Panel Lateral" : "Minimizar Panel Lateral"}
          >
            <Menu size={18} className={collapsed ? "text-cyan-400 animate-pulse" : ""} />
          </button>

          <button className="lg:hidden text-slate-400 p-1" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <h1 className="scr-display font-semibold text-slate-100 text-[15px] mr-2 hidden sm:block">{TITLES[active]}</h1>
          <div className="hidden md:flex items-center gap-2">
            <PlantSelectorDropdown
              plant={plant} setPlant={setPlant}
              line={line} setLine={setLine}
              shift={shift} setShift={setShift}
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={() => {
                if (editorMode) {
                  setEditorMode(false);
                } else {
                  setShowPasswordModal(true);
                }
              }}
              title={editorMode ? 'Salir del Modo Editor' : 'Acceso Administrador (Editor)'}
              className="grid place-items-center h-8 w-8 rounded-lg transition-colors"
              style={{
                border: '1px solid var(--scr-border)',
                color: editorMode ? '#22d3ee' : '#64748b',
                background: editorMode ? 'rgba(34,211,238,0.1)' : 'transparent',
              }}
            >
              {editorMode ? <Unlock size={16} /> : <Lock size={16} />}
            </button>

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              style={{ border: '1px solid var(--scr-border)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <span className="hidden sm:flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium"><span className="scr-live-dot" style={{ width: 7, height: 7, borderRadius: 99, background: '#22c55e', display: 'inline-block' }} /> CONECTADO</span>
              <span className="scr-mono text-slate-400">99.8%</span>
            </span>
            <button onClick={() => setActive('alarms')} className="relative text-slate-300 hover:text-white">
              <BellRing size={19} className={activeAlarms ? 'scr-blink text-red-400' : ''} />
              {activeAlarms > 0 && <span className="absolute -top-1.5 -right-1.5 scr-mono text-[9px] px-1 rounded-full text-white" style={{ background: '#ef4444' }}>3</span>}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--scr-border)' }}>
              <span className="grid place-items-center rounded-full h-8 w-8 scr-display text-[12px] font-semibold text-cyan-300" style={{ background: 'var(--scr-panel-2)' }}>AH</span>
              <div className="hidden sm:block leading-tight"><div className="text-[12px] text-slate-200">A. Herrera</div><div className="text-[10px] text-slate-500">Administrador</div></div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {render()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom status bar */}
        <footer className="h-10 shrink-0 flex items-center gap-6 px-4 border-t text-[11px] overflow-x-auto whitespace-nowrap" style={{ background: 'var(--scr-graphite)', borderColor: 'var(--scr-border)' }}>
          <span className="flex items-center gap-2 text-slate-400"><Database size={13} className="text-cyan-400" /> <span className="text-slate-500 uppercase text-[9px] tracking-wide">Historiador de Datos</span> <span className="flex items-center gap-1 text-emerald-400"><Dot status="normal" live /> Sincronizado</span></span>
          <span className="flex items-center gap-2 text-slate-400"><Gauge size={13} className="text-slate-500" /> <span className="text-slate-500 uppercase text-[9px] tracking-wide">Latencia</span> <span className="scr-mono text-slate-200">24 ms</span></span>
          <span className="flex items-center gap-2 text-slate-400"><Server size={13} className="text-slate-500" /> <span className="text-slate-500 uppercase text-[9px] tracking-wide">Servidores</span> <span className="scr-mono text-slate-200">SCR700-01 / 02</span></span>
          <span className="flex items-center gap-2 text-slate-400"><MessageSquare size={13} className="text-slate-500" /> <span className="text-slate-500 uppercase text-[9px] tracking-wide">Mensajes</span> <span className="scr-mono text-slate-200">12,540 /min</span></span>
          <span className="flex items-center gap-2 text-slate-400"><AlertTriangle size={13} className="text-red-400" /> <span className="text-slate-500 uppercase text-[9px] tracking-wide">Alarmas Activas</span> <span className="text-red-400 font-medium">7 (2 críticas)</span></span>
          <span className="ml-auto scr-mono text-slate-500">17 MAY 2025 &nbsp; 10:24:18</span>
        </footer>
      </div>

      <MachinePanel machine={machine} onClose={() => setMachine(null)} />

      <AdminPasswordDialog
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={() => {
          setEditorMode(true);
          setShowPasswordModal(false);
        }}
      />

      <LogoEditorDialog
        open={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        logoDark={logoDark}
        logoLight={logoLight}
        logoSize={logoSize}
        onSave={handleSaveLogos}
        onReset={handleResetLogos}
      />

      <CadSandboxOverlay
        open={showSandbox}
        onClose={() => setShowSandbox(false)}
        stationAssets={stationAssets}
        onResetAllAssets={handleResetAllAssets}
        studioSettings={studioSettings}
        onSaveStudioSettings={handleSaveStudioSettings}
      />
    </div>
  );
}

function AdminPasswordDialog({ open, onClose, onConfirm }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass === '2021') {
      setError(false);
      setPass('');
      onConfirm();
    } else {
      setError(true);
    }
  };

  return (
    <AnimatePresence>
      {open && (
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
            className="w-full max-w-sm rounded-xl border p-6 text-slate-200"
            style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full p-3 bg-cyan-500/10 text-cyan-400 mb-4">
                <Lock size={28} />
              </div>
              <h4 className="scr-display font-bold text-lg text-slate-50">Acceso de Administrador</h4>
              <p className="text-slate-400 text-xs mt-1">Introduce la contraseña para ingresar al Modo Editor</p>
              
              <form onSubmit={handleSubmit} className="w-full mt-5 space-y-4">
                <div>
                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => { setPass(e.target.value); setError(false); }}
                    placeholder="Contraseña"
                    className="w-full text-center tracking-widest rounded-lg border text-slate-200 text-sm p-2.5 outline-none focus:border-cyan-500 transition-colors"
                    style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                    autoFocus
                  />
                  {error && (
                    <span className="block text-red-400 text-xs mt-1.5 font-medium">Contraseña incorrecta</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/2 rounded-lg py-2 text-sm border text-slate-500 border-slate-700 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 rounded-lg py-2 text-sm text-[#05080d] font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LogoEditorDialog({ open, onClose, logoDark, logoLight, logoSize, onSave, onReset }) {
  const [tempDark, setTempDark] = useState(logoDark);
  const [tempLight, setTempLight] = useState(logoLight);
  const [tempSize, setTempSize] = useState(logoSize);

  useEffect(() => {
    setTempDark(logoDark);
    setTempLight(logoLight);
    setTempSize(logoSize);
  }, [logoDark, logoLight, logoSize, open]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es demasiado grande. El límite es de 2MB para almacenamiento local.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'dark') {
          setTempDark(reader.result);
        } else {
          setTempLight(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(tempDark, tempLight, tempSize);
  };

  return (
    <AnimatePresence>
      {open && (
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
            <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--scr-border)' }}>
              <div className="rounded-lg p-2 bg-cyan-500/10 text-cyan-400">
                <Image size={20} />
              </div>
              <div>
                <h4 className="scr-display font-bold text-base text-slate-50">Configurar Logotipos del Sistema</h4>
                <p className="text-slate-400 text-xs">Modifique las imágenes para los temas Oscuro y Claro.</p>
              </div>
            </div>

            <div className="mt-5 space-y-6">
              {/* Slider de tamaño */}
              <div className="space-y-2 border-b pb-4" style={{ borderColor: 'var(--scr-border)' }}>
                <div className="flex justify-between items-center">
                  <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Tamaño del Logotipo</label>
                  <span className="text-xs scr-mono text-cyan-400 font-bold">{tempSize}px</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-500 uppercase">Min (24px)</span>
                  <input
                    type="range"
                    min="24"
                    max="128"
                    value={tempSize}
                    onChange={(e) => setTempSize(parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{ background: 'var(--scr-border)', accentColor: '#22d3ee' }}
                  />
                  <span className="text-[10px] text-slate-500 uppercase">Max (128px)</span>
                </div>
              </div>

              {/* Logo Tema Oscuro */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Logo para Tema Oscuro</label>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="col-span-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempDark}
                        onChange={(e) => setTempDark(e.target.value)}
                        placeholder="URL de imagen o carga un archivo"
                        className="flex-1 rounded-lg border text-slate-200 text-xs p-2 outline-none focus:border-cyan-500"
                        style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'dark')}
                        className="hidden"
                        id="dark-logo-file"
                      />
                      <label
                        htmlFor="dark-logo-file"
                        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 py-2 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer transition-all"
                      >
                        <Upload size={14} /> Seleccionar Archivo
                      </label>
                    </div>
                  </div>
                  <div className="h-20 rounded-lg border border-slate-800 bg-[#070b12] flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                    <span className="text-[9px] text-slate-600 absolute top-1 uppercase tracking-wider">Vista Oscura</span>
                    {tempDark ? (
                      <div className="relative w-full h-full flex items-center justify-center pt-2">
                        <img src={tempDark} alt="Preview Dark" className="max-h-12 max-w-full object-contain" />
                        <button
                          onClick={() => setTempDark('')}
                          className="absolute right-1 top-1 text-red-400 hover:text-red-300 bg-[#070b12]/80 p-0.5 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 mt-2">Vacío</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo Tema Claro */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">Logo para Tema Claro</label>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="col-span-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempLight}
                        onChange={(e) => setTempLight(e.target.value)}
                        placeholder="URL de imagen o carga un archivo"
                        className="flex-1 rounded-lg border text-slate-200 text-xs p-2 outline-none focus:border-cyan-500"
                        style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'light')}
                        className="hidden"
                        id="light-logo-file"
                      />
                      <label
                        htmlFor="light-logo-file"
                        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 py-2 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer transition-all"
                      >
                        <Upload size={14} /> Seleccionar Archivo
                      </label>
                    </div>
                  </div>
                  <div className="h-20 rounded-lg border border-slate-300 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                    <span className="text-[9px] text-slate-400 absolute top-1 uppercase tracking-wider">Vista Clara</span>
                    {tempLight ? (
                      <div className="relative w-full h-full flex items-center justify-center pt-2">
                        <img src={tempLight} alt="Preview Light" className="max-h-12 max-w-full object-contain" />
                        <button
                          onClick={() => setTempLight('')}
                          className="absolute right-1 top-1 text-red-500 hover:text-red-400 bg-white/80 p-0.5 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-2">Vacío</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-between gap-2" style={{ borderColor: 'var(--scr-border)' }}>
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} /> Restablecer defecto
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-xs border text-slate-500 border-slate-700 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-lg px-4 py-2 text-xs text-[#05080d] font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
