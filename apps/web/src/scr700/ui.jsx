import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';
import { STATUS } from './data';

export const statusColor = (k) => (STATUS[k] || STATUS.offline).color;
export const statusLabel = (k) => (STATUS[k] || STATUS.offline).label;

export function Dot({ status, live = false, size = 8 }) {
  const c = statusColor(status);
  return (
    <span
      className={live ? 'scr-live-dot' : ''}
      style={{ width: size, height: size, borderRadius: 99, background: c, display: 'inline-block', boxShadow: `0 0 6px ${c}` }}
    />
  );
}

export function Panel({ title, right, children, className = '', pad = true }) {
  return (
    <section
      className={`rounded-xl border ${className}`}
      style={{ background: 'var(--scr-panel)', borderColor: 'var(--scr-border)' }}
    >
      {title && (
        <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--scr-border)' }}>
          <h3 className="scr-display text-[13px] font-semibold tracking-wide text-slate-200 uppercase">{title}</h3>
          {right}
        </header>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

export function Pill({ children, color = '#22d3ee', filled = false }) {
  return (
    <span
      className="scr-mono text-[10px] font-semibold px-2 py-0.5 rounded-md tracking-wide"
      style={filled
        ? { background: color, color: '#05080d' }
        : { color, background: `${color}1a`, border: `1px solid ${color}55` }}
    >
      {children}
    </span>
  );
}

const btnBase = 'inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium px-3 py-2 transition-all active:scale-[0.97] disabled:opacity-40';

export function Btn({ children, icon: Icon, variant = 'ghost', critical = false, confirm, reason, onClick, className = '', ...rest }) {
  const [open, setOpen] = useState(false);
  const styles = {
    primary: { background: 'linear-gradient(180deg,#22d3ee,#3b82f6)', color: '#05080d' },
    ghost: { background: 'var(--scr-panel-2)', color: 'var(--scr-text-300)', border: '1px solid var(--scr-border)' },
    danger: { background: '#ef44441a', color: 'var(--scr-danger-text)', border: '1px solid #ef444455' },
  };
  const handle = () => {
    if (confirm || critical) setOpen(true);
    else onClick && onClick();
  };
  return (
    <>
      <button className={`${btnBase} ${className}`} style={styles[variant]} onClick={handle} {...rest}>
        {Icon && <Icon size={15} strokeWidth={2.2} />}
        {children}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={children}
        critical={critical}
        needReason={reason}
        onConfirm={() => { setOpen(false); onClick && onClick(); }}
      />
    </>
  );
}

export function ConfirmDialog({ open, onClose, title, critical, needReason, onConfirm }) {
  const [why, setWhy] = useState('');
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(3,6,12,0.7)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border p-5"
            style={{ background: 'var(--scr-panel)', borderColor: critical ? '#ef444466' : 'var(--scr-border)' }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg p-2" style={{ background: critical ? '#ef44441a' : '#22d3ee1a' }}>
                <ShieldAlert size={20} color={critical ? '#ef4444' : '#22d3ee'} />
              </div>
              <div className="flex-1">
                <h4 className="scr-display text-slate-100 font-semibold text-[15px]">Confirmar acción</h4>
                <p className="text-slate-400 text-[13px] mt-1">
                  {critical ? 'Acción crítica: requiere permisos, motivo y quedará auditada.' : 'Confirma para continuar.'}
                </p>
                <p className="mt-2 text-cyan-300 text-[13px] font-medium">{title}</p>
                {needReason && (
                  <textarea
                    value={why} onChange={(e) => setWhy(e.target.value)}
                    placeholder="Motivo / justificación (obligatorio)"
                    rows={2}
                    className="scr-mono mt-3 w-full rounded-lg border text-slate-200 text-[12px] p-2 outline-none focus:border-cyan-500"
                    style={{ borderColor: 'var(--scr-border)', background: 'var(--scr-panel-2)' }}
                  />
                )}
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
              <button
                disabled={needReason && !why.trim()}
                onClick={onConfirm}
                className={`${btnBase} disabled:opacity-40`}
                style={critical
                  ? { background: '#ef4444', color: '#fff' }
                  : { background: 'linear-gradient(180deg,#22d3ee,#3b82f6)', color: '#05080d' }}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const chartTheme = {
  grid: 'var(--scr-border)',
  axis: 'var(--scr-text-400)',
  tooltip: {
    contentStyle: { background: 'var(--scr-panel)', border: '1px solid var(--scr-border)', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: 'var(--scr-text-400)' },
    itemStyle: { color: 'var(--scr-text-200)' },
  },
};
