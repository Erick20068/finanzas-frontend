import React, { useEffect, useState } from 'react';
import { X, Loader2, FileDown, Mail, CalendarRange } from 'lucide-react';
import {
  PeriodoTipo,
  ResumenReporte,
  calcularRango,
  generarResumenReporte,
  descargarPdfNavegador,
  enviarReporteEmail,
} from '../services/reporteService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PERIODOS: { id: PeriodoTipo; label: string }[] = [
  { id: 'este_mes', label: 'Este mes' },
  { id: 'mes_pasado', label: 'Mes pasado' },
  { id: 'ultimos_3', label: 'Últimos 3 meses' },
  { id: 'ultimos_6', label: 'Últimos 6 meses' },
  { id: 'anio', label: 'Este año' },
  { id: 'personalizado', label: 'Personalizado' },
];

const money = (n: number) =>
  n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ReporteMesModal({ isOpen, onClose }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoTipo>('este_mes');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState<ResumenReporte | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const r = calcularRango('este_mes');
    setInicio(r.inicio);
    setFin(r.fin);
    setPeriodo('este_mes');
    setReporte(null);
    setError('');
    setMsg('');
  }, [isOpen]);

  const cargar = async () => {
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const data = await generarResumenReporte(
        periodo,
        periodo === 'personalizado' ? { inicio, fin } : undefined
      );
      setReporte(data);
    } catch (e: any) {
      setError(e?.message || 'No se pudo generar el reporte');
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && periodo !== 'personalizado') {
      cargar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, periodo]);

  const handlePdf = () => {
    if (!reporte) return;
    try {
      descargarPdfNavegador(reporte);
      setMsg('Se abrió la vista de impresión: elige "Guardar como PDF".');
    } catch (e: any) {
      setError(e?.message || 'No se pudo abrir el PDF');
    }
  };

  const handleEmail = async () => {
    if (!reporte) return;
    if (!reporte.usuario.correo) {
      setError('No hay correo asociado a tu cuenta.');
      return;
    }
    setEnviando(true);
    setMsg('');
    setError('');
    const res = await enviarReporteEmail(reporte);
    if (res.ok) setMsg(res.message);
    else setError(res.message);
    setEnviando(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto text-zinc-200 shadow-2xl">
        <div className="flex justify-between items-start p-6 pb-2 sticky top-0 bg-[#141414] z-10 border-b border-zinc-800/80">
          <div>
            <h2 className="text-2xl font-serif text-[#e4dec7]">Reporte financiero</h2>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <CalendarRange size={12} /> Elige el periodo, genera el resumen, PDF o email
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodo(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  periodo === p.id
                    ? 'bg-[#e4dec7] text-zinc-900'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodo === 'personalizado' && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Desde</label>
                <input
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="bg-[#0f0f0f] border border-zinc-800 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Hasta</label>
                <input
                  type="date"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                  className="bg-[#0f0f0f] border border-zinc-800 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={cargar}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium px-4 py-2 rounded-xl"
              >
                Aplicar filtro
              </button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-zinc-400" size={28} />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}
          {msg && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-3 rounded-xl">
              {msg}
            </div>
          )}

          {!loading && reporte && (
            <>
              <p className="text-sm text-zinc-400">
                Periodo: <span className="text-[#e4dec7] font-medium">{reporte.rango.etiqueta}</span>
                <span className="text-zinc-600"> · {reporte.rango.inicio} → {reporte.rango.fin}</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-zinc-500">Ingresos</p>
                  <p className="text-lg text-green-500/90 font-medium">${money(reporte.ingresos)}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-zinc-500">Gastos</p>
                  <p className="text-lg text-red-400/90 font-medium">${money(reporte.gastos)}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-zinc-500">Balance</p>
                  <p className={`text-lg font-medium ${reporte.balance >= 0 ? 'text-[#e4dec7]' : 'text-red-400'}`}>
                    ${money(reporte.balance)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-zinc-500">Saldo cuentas</p>
                  <p className="text-lg text-zinc-200 font-medium">${money(reporte.saldoTotal)}</p>
                </div>
              </div>

              {reporte.porCategoria.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">Top gastos por categoría</h3>
                  <ul className="space-y-1.5">
                    {reporte.porCategoria.slice(0, 6).map((c) => (
                      <li key={c.nombre} className="flex justify-between text-xs text-zinc-400">
                        <span>{c.nombre}</span>
                        <span className="text-zinc-200">${money(c.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[11px] text-zinc-500">
                {reporte.movimientos.length} movimientos · {reporte.cuentas.length} cuentas ·{' '}
                {reporte.deudas.length} deudas · Se enviará a{' '}
                <span className="text-zinc-300">{reporte.usuario.correo || '—'}</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePdf}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#e4dec7] hover:bg-[#d4ceb8] text-zinc-900 font-semibold text-sm py-3 rounded-xl transition"
                >
                  <FileDown size={16} /> Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={handleEmail}
                  disabled={enviando}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm py-3 rounded-xl transition disabled:opacity-60"
                >
                  {enviando ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Enviar al email
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 text-center">
                PDF: usa “Guardar como PDF” en el diálogo de impresión. El envío por correo requiere el endpoint del backend.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
