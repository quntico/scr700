import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Square, Pause, RotateCw, RefreshCw, UploadCloud, Sliders,
  BellRing, Wrench, Box, FlaskConical, GitCompare, FileText, Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { MACHINE_IMAGES } from './data';
import { Pill, Dot, Btn, statusColor, statusLabel } from './ui';

const spark = Array.from({ length: 16 }, (_, i) => ({ v: 50 + Math.sin(i / 2) * 18 + (i % 3) * 5 }));

const Metric = ({ label, value, unit }) => (
  <div className="rounded-lg p-2.5" style={{ background: 'var(--scr-panel-2)' }}>
    <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    <div className="scr-mono text-[15px] text-cyan-300 mt-0.5">{value}<span className="text-[10px] text-slate-500 ml-0.5">{unit}</span></div>
  </div>
);

export default function MachinePanel({ machine, onClose }) {
  return (
    <AnimatePresence>
      {machine && (
        <>
          <motion.div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(3,6,12,0.6)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 z-50 h-full w-full sm:w-[400px] border-l overflow-y-auto"
            style={{ background: 'var(--scr-graphite)', borderColor: 'var(--scr-border)' }}
          >
            <div className="relative h-44">
              <img src={MACHINE_IMAGES[machine.img]} alt={machine.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(7,10,16,0.2),var(--scr-graphite))' }} />
              <button onClick={onClose} className="absolute top-3 right-3 rounded-lg p-1.5" style={{ background: 'rgba(7,10,16,0.6)', color: '#e2e8f0' }}><X size={18} /></button>
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center gap-2">
                  <Pill color={statusColor(machine.status)} filled>{statusLabel(machine.status)}</Pill>
                  <Pill color="#a855f7">{machine.mode === 'manual' ? 'Manual' : machine.mode === 'off' ? 'Apagado' : 'Automático'}</Pill>
                </div>
                <h2 className="scr-display text-lg font-bold text-slate-50 mt-1.5">{machine.name}</h2>
                <div className="scr-mono text-[11px] text-slate-400">{machine.id} · {machine.model}</div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Velocidad" value={machine.speed} unit="rpm" />
                <Metric label="Temperatura" value={machine.temp} unit="°C" />
                <Metric label="Presión" value={machine.pressure} unit="bar" />
                <Metric label="Potencia" value={machine.power} unit="kW" />
                <Metric label="Producción" value={machine.prod} unit="u" />
                <Metric label="Objetivo" value={machine.target} unit="u" />
              </div>

              <div className="rounded-lg p-3" style={{ background: 'var(--scr-panel)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 uppercase">Tendencia (últimos 16 min)</span>
                  <Dot status={machine.status} live={machine.status === 'critical'} />
                </div>
                <ResponsiveContainer width="100%" height={54}>
                  <LineChart data={spark}><YAxis hide domain={['dataMin-10', 'dataMax+10']} /><Line dataKey="v" stroke={statusColor(machine.status)} strokeWidth={2} dot={false} /></LineChart>
                </ResponsiveContainer>
              </div>

              {machine.alarms > 0 && (
                <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: '#ef44441a', border: '1px solid #ef444455' }}>
                  <BellRing size={16} className="text-red-400 scr-blink" />
                  <span className="text-[13px] text-red-300">{machine.alarms} alarma(s) activa(s)</span>
                </div>
              )}

              <div>
                <div className="text-[11px] text-slate-500 uppercase mb-2">Control de operación</div>
                <div className="grid grid-cols-2 gap-2">
                  <Btn variant="primary" icon={Play} confirm reason>Iniciar</Btn>
                  <Btn variant="danger" icon={Square} critical reason>Detener</Btn>
                  <Btn variant="ghost" icon={Pause} confirm>Pausar</Btn>
                  <Btn variant="ghost" icon={RefreshCw} confirm>Reiniciar</Btn>
                  <Btn variant="ghost" icon={RotateCw} confirm>Cambiar modo</Btn>
                  <Btn variant="ghost" icon={UploadCloud}>Cargar receta</Btn>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase mb-2">Acciones</div>
                <div className="grid grid-cols-2 gap-2">
                  <Btn variant="ghost" icon={Sliders} critical reason>Ajustar parámetros</Btn>
                  <Btn variant="ghost" icon={BellRing} confirm reason>Reconocer alarma</Btn>
                  <Btn variant="ghost" icon={Wrench} confirm reason>Mantenimiento</Btn>
                  <Btn variant="ghost" icon={Box}>Abrir Gemelo</Btn>
                  <Btn variant="ghost" icon={FlaskConical}>Simular</Btn>
                  <Btn variant="ghost" icon={GitCompare}>Comparar</Btn>
                  <Btn variant="ghost" icon={FileText}>Generar reporte</Btn>
                  <Btn variant="ghost" icon={Sparkles}>Consultar IA</Btn>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase mb-2">Historial reciente</div>
                <div className="space-y-1.5">
                  {[['10:42', 'Cambio a modo manual'], ['10:18', 'Receta #4471 cargada'], ['09:50', 'Mantenimiento preventivo OK'], ['08:12', 'Arranque de turno']].map(([t, e]) => (
                    <div key={t} className="flex gap-3 text-[12px]">
                      <span className="scr-mono text-slate-500">{t}</span>
                      <span className="text-slate-300">{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
