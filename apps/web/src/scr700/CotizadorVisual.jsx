import React, { useEffect, useState } from 'react';
import { ExternalLink, Maximize2 } from 'lucide-react';

const modulePath = '/cotizador-visual/index.html';
const mapUrl = modulePath + '#flujo';

export default function CotizadorVisual() {
  const [available, setAvailable] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/cotizador-visual/disponible.json', {signal: controller.signal, cache: 'no-store'})
      .then(response => response.ok ? response.json() : null)
      .then(data => setAvailable(data?.module === 'cotizador-visual'))
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, []);
  if (!available) return <section className="grid h-full place-content-center p-6 text-center">
    <h2 className="text-lg font-semibold">Cotizador visual</h2>
    <p className="mt-2 text-sm text-slate-400" role="status">{available === null ? 'Abriendo el proyecto…' : 'El catálogo privado todavía no está instalado en este entorno.'}</p>
  </section>;
  return <section className="h-full min-h-0 flex flex-col" aria-label="Cotizador visual">
    <div className="flex shrink-0 justify-end gap-4 px-3 py-1">
      <a className="inline-flex items-center gap-1 text-xs text-cyan-400" href={mapUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/>Abrir mapa</a>
      <button className="inline-flex items-center gap-1 text-xs text-cyan-400" onClick={event => { const panel=event.currentTarget.closest('section'); if(document.fullscreenElement) document.exitFullscreen(); else panel.requestFullscreen?.().catch(()=>{}); }}><Maximize2 size={13}/>Pantalla completa</button>
    </div>
    <iframe title="Mapa y cotización de equipos" src={mapUrl} allowFullScreen className="w-full flex-1 min-h-0 border-0 bg-white"/>
  </section>;
}
