// SCR700 — demo dataset (realistic industrial values)

export const MACHINE_IMAGES = {
  cnc: 'https://images.hostinger.com/5e444bd2-b93c-4764-b943-53725687467c.png',
  robot: 'https://images.hostinger.com/293ab539-ad7d-4ee8-999b-5912f1cb0fd4.png',
  fill: 'https://images.hostinger.com/32d075e6-ed6e-4606-9d62-6123fdc8d0d2.png',
  press: 'https://images.hostinger.com/cc96c779-ee9c-4386-a502-4f57293d28ea.png',
};
export const PLANT_MAP = 'https://images.hostinger.com/2c9b2bed-7199-401d-bbed-eef614e76af4.png';

export const STATUS = {
  normal: { label: 'Normal', color: '#22c55e', key: 'normal' },
  warning: { label: 'Advertencia', color: '#f5c518', key: 'warning' },
  critical: { label: 'Crítico', color: '#ef4444', key: 'critical' },
  offline: { label: 'Desconectado', color: '#64748b', key: 'offline' },
  manual: { label: 'Manual', color: '#a855f7', key: 'manual' },
};

export const PLANTS = [
  { id: 'p1', name: 'Planta Norte — Monterrey', lines: 4, machines: 42 },
  { id: 'p2', name: 'Planta Bajío — Querétaro', lines: 3, machines: 28 },
  { id: 'p3', name: 'Planta Sur — Puebla', lines: 2, machines: 19 },
];

export const LINES = ['Línea 1 — Ensamble', 'Línea 2 — Mecanizado', 'Línea 3 — Envasado', 'Línea 4 — Empaque'];
export const SHIFTS = ['Turno A (06:00–14:00)', 'Turno B (14:00–22:00)', 'Turno C (22:00–06:00)'];

export const KPIS = [
  { id: 'prod', label: 'Producción', value: 8420, unit: 'u', target: 9000, trend: 2.4, status: 'warning' },
  { id: 'oee', label: 'OEE', value: 78.4, unit: '%', target: 85, trend: 1.2, status: 'warning' },
  { id: 'avail', label: 'Disponibilidad', value: 91.2, unit: '%', target: 92, trend: 0.6, status: 'normal' },
  { id: 'perf', label: 'Rendimiento', value: 88.9, unit: '%', target: 90, trend: -0.8, status: 'warning' },
  { id: 'qual', label: 'Calidad', value: 96.7, unit: '%', target: 98, trend: 0.3, status: 'normal' },
  { id: 'energy', label: 'Energía', value: 1240, unit: 'kWh', target: 1150, trend: 4.1, status: 'critical' },
  { id: 'water', label: 'Agua', value: 38.2, unit: 'm³', target: 40, trend: -1.5, status: 'normal' },
  { id: 'cost', label: 'Costo unitario', value: 4.62, unit: '$', target: 4.40, trend: 1.9, status: 'warning' },
  { id: 'alarms', label: 'Alarmas activas', value: 7, unit: '', target: 0, trend: 2, status: 'critical' },
  { id: 'connected', label: 'Máquinas conectadas', value: 38, unit: '/42', target: 42, trend: 0, status: 'normal' },
  { id: 'stopped', label: 'Equipos detenidos', value: 3, unit: '', target: 0, trend: -1, status: 'warning' },
  { id: 'mtbf', label: 'MTBF', value: 142, unit: 'h', target: 160, trend: 3.2, status: 'normal' },
];

// Process-line station 3D renders (Centro de Control process view)
export const STATION_IMAGES = {
  warehouseIn: 'https://images.hostinger.com/ae3f71ca-6a69-464d-860a-5b1979030bb7.png',
  feeder: 'https://images.hostinger.com/9f642a9e-df68-4ecf-8529-6f9883a416ed.png',
  cut: 'https://images.hostinger.com/9d6855d9-3f67-4e4d-a70b-e51474c039b4.png',
  assemblyA: 'https://images.hostinger.com/43fee0ac-feb8-4c03-96e4-a1e4d619f52a.png',
  assemblyB: 'https://images.hostinger.com/9550f3e7-1fc2-4213-bdf8-dcc6cd6a4cf6.png',
  inspection: 'https://images.hostinger.com/41fac889-593d-4872-8978-22ccef5c3ae3.png',
  warehouseOut: 'https://images.hostinger.com/b17cb4a1-bd68-4159-8b25-6c09c14e4fcd.png',
};

// Ordered stations for the horizontal process flow
export const PROCESS_STATIONS = [
  { id: 'win', num: '', name: 'ALMACÉN', img: 'warehouseIn', state: null },
  { id: 's01', num: '01', name: 'Alimentador', img: 'feeder', state: 'run' },
  { id: 's02', num: '02', name: 'Corte', img: 'cut', state: 'run' },
  { id: 's03', num: '03', name: 'Ensamble A', img: 'assemblyA', state: 'run' },
  { id: 's04', num: '04', name: 'Ensamble B', img: 'assemblyB', state: 'wait' },
  { id: 's05', num: '05', name: 'Inspección', img: 'inspection', state: 'run' },
  { id: 'wout', num: '', name: 'ALMACÉN\nPRODUCTO\nTERMINADO', img: 'warehouseOut', state: null },
];

// KPI strip on Centro de Control (matches control-room layout)
export const DASH_KPIS = [
  { id: 'prod', label: 'Producción', value: '8,420', unit: 'u', trend: 2.4, sub: 'obj 9,000', status: 'normal', icon: 'prod' },
  { id: 'oee', label: 'OEE', value: '78.4', unit: '%', trend: 1.2, sub: 'obj 85%', status: 'normal', icon: 'oee' },
  { id: 'avail', label: 'Disponibilidad', value: '91.2', unit: '%', trend: 0.6, sub: 'obj 92%', status: 'normal', icon: 'avail' },
  { id: 'perf', label: 'Rendimiento', value: '88.9', unit: '%', trend: -0.8, sub: 'obj 90%', status: 'normal', icon: 'perf' },
  { id: 'qual', label: 'Calidad', value: '96.7', unit: '%', trend: 0.3, sub: 'obj 98%', status: 'normal', icon: 'qual' },
  { id: 'energy', label: 'Energía', value: '1,240', unit: 'kWh', trend: 4.1, sub: 'obj 1,150 kWh', status: 'normal', icon: 'energy' },
  { id: 'water', label: 'Agua', value: '38.2', unit: 'm³', trend: -1.5, sub: 'obj 40 m³', status: 'normal', icon: 'water' },
  { id: 'alarms', label: 'Alarmas', value: '7', unit: '', sub: '2 Críticas', subColor: '#ef4444', status: 'critical', icon: 'alarms' },
  { id: 'stopped', label: 'Equipos', value: '3', unit: '', sub: 'Detenidos', status: 'warning', icon: 'stopped' },
  { id: 'mtbf', label: 'MTBF', value: '142', unit: 'h', trend: 3.2, sub: 'obj 168 h', status: 'normal', icon: 'mtbf' },
];

// Machine status table (Estado de máquinas)
export const MACHINE_STATUS = [
  { num: '01', name: 'Alimentador', state: 'run', oee: 92.1 },
  { num: '02', name: 'Corte', state: 'run', oee: 85.4 },
  { num: '03', name: 'Ensamble A', state: 'run', oee: 79.8 },
  { num: '04', name: 'Ensamble B', state: 'wait', oee: 62.3 },
  { num: '05', name: 'Inspección', state: 'run', oee: 94.7 },
  { num: '06', name: 'Empaque', state: 'run', oee: 90.2 },
];

// AI insights cards (Insights de IA)
export const AI_INSIGHTS = [
  { id: 'opt', tag: 'OPTIMIZACIÓN DE RENDIMIENTO', color: '#22d3ee', text: 'El modelo predictivo sugiere ajustar la velocidad de Ensamble B a 92% para mejorar el OEE en +2.3%.', badge: '+2.3% OEE', badgeColor: '#22c55e', chart: true },
  { id: 'maint', tag: 'MANTENIMIENTO PREDICTIVO', color: '#22d3ee', text: 'Riesgo de falla en Corte (Máq. 02) en las próximas 48h.', badge: 'Riesgo Alto', badgeColor: '#ef4444', gauge: true },
  { id: 'energy', tag: 'CONSUMO ENERGÉTICO', color: '#22d3ee', text: 'Oportunidad de ahorro detectada en sistema de compresores.', badge: '↓6.8% kWh', badgeColor: '#22c55e', energy: true },
];

// throughput mini-bars + ppm mini-line
export const THROUGHPUT_BARS = [40, 55, 48, 62, 58, 70, 65, 74, 68, 80, 72, 78, 66, 82, 76, 88];
export const PPM_SERIES = [1180, 1210, 1150, 1290, 1240, 1320, 1260, 1300, 1230, 1280, 1240].map((v, i) => ({ i, v }));
export const QUALITY_LEGEND = [
  { name: 'Conforme', pct: '96.7%', qty: '8,142 u', color: '#22c55e' },
  { name: 'Reproceso', pct: '2.1%', qty: '176 u', color: '#f5c518' },
  { name: 'Rechazo', pct: '1.2%', qty: '102 u', color: '#ef4444' },
];

export const MACHINES = [
  { id: 'M-101', name: 'Centro CNC Alpha', type: 'cnc', img: 'cnc', model: 'HAAS VF-4SS', status: 'normal', mode: 'auto', speed: 1420, temp: 62, pressure: 5.8, power: 34, prod: 1240, target: 1300, alarms: 0, x: 18, y: 30 },
  { id: 'M-102', name: 'Robot Soldadura Beta', type: 'robot', img: 'robot', model: 'FANUC R-2000iC', status: 'warning', mode: 'auto', speed: 98, temp: 74, pressure: 6.4, power: 21, prod: 980, target: 1000, alarms: 1, x: 40, y: 22 },
  { id: 'M-103', name: 'Envasadora Gamma', type: 'fill', img: 'fill', model: 'Krones VarioFill', status: 'critical', mode: 'manual', speed: 320, temp: 88, pressure: 7.9, power: 42, prod: 640, target: 1100, alarms: 3, x: 66, y: 34 },
  { id: 'M-104', name: 'Prensa Delta', type: 'press', img: 'press', model: 'Schuler MSD-2500', status: 'offline', mode: 'off', speed: 0, temp: 24, pressure: 0, power: 0, prod: 0, target: 900, alarms: 0, x: 78, y: 60 },
  { id: 'M-105', name: 'Centro CNC Epsilon', type: 'cnc', img: 'cnc', model: 'DMG MORI NLX', status: 'normal', mode: 'auto', speed: 1610, temp: 58, pressure: 5.2, power: 31, prod: 1310, target: 1300, alarms: 0, x: 26, y: 66 },
  { id: 'M-106', name: 'Robot Manipulador Zeta', type: 'robot', img: 'robot', model: 'KUKA KR-210', status: 'manual', mode: 'manual', speed: 45, temp: 51, pressure: 4.1, power: 18, prod: 420, target: 800, alarms: 0, x: 52, y: 70 },
];

export const ALARMS = [
  { id: 'A-9012', machine: 'M-103', sev: 'critical', title: 'Sobretemperatura cabezal', ts: '10:42:18', ack: false },
  { id: 'A-9011', machine: 'M-103', sev: 'critical', title: 'Presión hidráulica fuera de rango', ts: '10:39:02', ack: false },
  { id: 'A-9010', machine: 'M-102', sev: 'warning', title: 'Vibración eje 3 elevada', ts: '10:31:47', ack: false },
  { id: 'A-9009', machine: 'M-103', sev: 'critical', title: 'Nivel de lubricante bajo', ts: '10:22:10', ack: false },
  { id: 'A-9008', machine: 'M-101', sev: 'warning', title: 'Desgaste de herramienta 68%', ts: '09:58:33', ack: true },
  { id: 'A-9007', machine: 'M-105', sev: 'warning', title: 'Deriva de calidad detectada', ts: '09:41:20', ack: true },
  { id: 'A-9006', machine: 'M-106', sev: 'warning', title: 'Modo manual prolongado', ts: '09:12:05', ack: true },
];

export const AI_RECS = [
  { id: 'IA-01', title: 'Reducir velocidad de M-103 12% para estabilizar temperatura', type: 'Anomalía', impact: '-3 alarmas / turno', risk: 'Bajo', confidence: 94, vars: ['Temperatura', 'Velocidad', 'Calidad'] },
  { id: 'IA-02', title: 'Predicción de falla en rodamiento — Robot M-102 en ~72 h', type: 'Predicción', impact: 'Evita paro no planeado 6 h', risk: 'Medio', confidence: 88, vars: ['Vibración', 'MTBF', 'Potencia'] },
  { id: 'IA-03', title: 'Optimizar punto de consigna energético en Línea 3', type: 'Optimización', impact: '-8.2% kWh', risk: 'Bajo', confidence: 91, vars: ['Energía', 'Costo unitario'] },
  { id: 'IA-04', title: 'Causa raíz de rechazo: humedad de material lote #4471', type: 'Causa raíz', impact: '+1.4% calidad', risk: 'Bajo', confidence: 83, vars: ['Calidad', 'Rechazo', 'Materia prima'] },
];

const hours = ['06', '07', '08', '09', '10', '11', '12', '13'];
export const PROD_SERIES = hours.map((h, i) => ({
  h: `${h}:00`,
  real: [780, 910, 1040, 1120, 980, 1060, 1150, 1080][i],
  target: 1100,
  sim: [820, 950, 1080, 1150, 1120, 1140, 1180, 1160][i],
}));

export const OEE_SERIES = hours.map((h, i) => ({
  h: `${h}:00`,
  disp: [90, 92, 88, 91, 85, 89, 93, 90][i],
  perf: [86, 88, 90, 89, 82, 87, 91, 88][i],
  qual: [97, 96, 98, 97, 95, 96, 98, 97][i],
}));

export const ENERGY_SERIES = hours.map((h, i) => ({
  h: `${h}:00`,
  energia: [140, 165, 180, 172, 190, 175, 168, 150][i],
  agua: [4.2, 5.1, 5.8, 5.2, 6.1, 5.4, 4.9, 4.4][i],
}));

export const PARETO = [
  { causa: 'Cambio de herramienta', min: 84 },
  { causa: 'Ajuste de calidad', min: 62 },
  { causa: 'Falta de material', min: 48 },
  { causa: 'Falla mecánica', min: 31 },
  { causa: 'Limpieza', min: 22 },
  { causa: 'Otros', min: 14 },
];

export const QUALITY_DONUT = [
  { name: 'Conforme', value: 96.7, color: '#22c55e' },
  { name: 'Reproceso', value: 2.1, color: '#f5c518' },
  { name: 'Rechazo', value: 1.2, color: '#ef4444' },
];

export const MAINTENANCE = [
  { id: 'OT-3301', machine: 'M-103', type: 'Correctivo', prio: 'Alta', due: 'Hoy 15:00', status: 'En curso' },
  { id: 'OT-3302', machine: 'M-102', type: 'Predictivo', prio: 'Media', due: 'Mañana', status: 'Programado' },
  { id: 'OT-3303', machine: 'M-101', type: 'Preventivo', prio: 'Baja', due: '2 días', status: 'Programado' },
  { id: 'OT-3304', machine: 'M-104', type: 'Correctivo', prio: 'Alta', due: 'Vencido', status: 'Pendiente' },
];

export const PARAM_SCENARIOS = [
  { key: 'cons', name: 'Conservador', prod: 7800, opex: 1.82, capex: 12.4, roi: 14.2, mass: 91.0 },
  { key: 'norm', name: 'Normal', prod: 9000, opex: 1.64, capex: 12.4, roi: 19.8, mass: 94.5 },
  { key: 'alto', name: 'Alto Rendimiento', prod: 10200, opex: 1.71, capex: 15.9, roi: 23.1, mass: 96.2 },
];

export const REPORTS = [
  { id: 'R-2201', name: 'OEE por línea — Turno A', date: 'Hoy', type: 'Producción' },
  { id: 'R-2200', name: 'Consumo energético semanal', date: 'Ayer', type: 'Energía' },
  { id: 'R-2199', name: 'Análisis de paros (Pareto)', date: '2 días', type: 'Mantenimiento' },
  { id: 'R-2198', name: 'Calidad y rechazo mensual', date: '3 días', type: 'Calidad' },
];

export const USERS = [
  { id: 'U-01', name: 'A. Herrera', role: 'Administrador', plant: 'Todas', status: 'En línea' },
  { id: 'U-02', name: 'M. Solís', role: 'Supervisor', plant: 'Planta Norte', status: 'En línea' },
  { id: 'U-03', name: 'R. Cárdenas', role: 'Operador', plant: 'Planta Norte', status: 'Ausente' },
  { id: 'U-04', name: 'L. Vega', role: 'Ingeniero', plant: 'Planta Bajío', status: 'En línea' },
];
