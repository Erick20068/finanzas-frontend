import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react';

interface Deuda {
  id: number;
  entidad_persona: string;
  monto_total: number;
  monto_pagado: number;
  fecha_vencimiento: string;
  tipo_deuda: string;
  estado: 'PENDIENTE' | 'PAGADO';
  notas?: string;
}

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function Calendario() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(hoy.getDate());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form nueva deuda
  const [entidad, setEntidad] = useState('');
  const [tipoDeuda, setTipoDeuda] = useState('PRESTAMO');
  const [monto, setMonto] = useState('');
  const [fechaVenc, setFechaVenc] = useState('');
  const [notas, setNotas] = useState('');

  const diasEnMes = useMemo(() => new Date(anio, mes, 0).getDate(), [anio, mes]);
  const diasMes = useMemo(() => Array.from({ length: diasEnMes }, (_, i) => i + 1), [diasEnMes]);
  const offsetInicio = useMemo(() => {
    const d = new Date(anio, mes - 1, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }, [anio, mes]);

  const inicioMes = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const finMes = `${anio}-${String(mes).padStart(2, '0')}-${String(diasEnMes).padStart(2, '0')}`;
  const nombreMes = NOMBRES_MES[mes - 1];

  const fetchDeudas = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('deudas')
      .select('*')
      .eq('usuario_id', user.id)
      .gte('fecha_vencimiento', inicioMes)
      .lte('fecha_vencimiento', finMes)
      .order('fecha_vencimiento', { ascending: true });

    if (!error && data) setDeudas(data as Deuda[]);
    else if (error) console.error('Error deudas:', error);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeudas();
  }, [anio, mes, inicioMes, finMes]);

  const deudasDelDia = deudas.filter((d) => {
    if (!d.fecha_vencimiento) return false;
    return parseInt(d.fecha_vencimiento.split('-')[2], 10) === diaSeleccionado;
  });

  const marcarComoPagado = async (id: number) => {
    const { error } = await supabase.from('deudas').update({ estado: 'PAGADO' }).eq('id', id);
    if (!error) {
      setDeudas(deudas.map((d) => (d.id === id ? { ...d, estado: 'PAGADO' } : d)));
    }
  };

  const abrirModalNueva = () => {
    const dia = String(diaSeleccionado).padStart(2, '0');
    setFechaVenc(`${anio}-${String(mes).padStart(2, '0')}-${dia}`);
    setEntidad('');
    setTipoDeuda('PRESTAMO');
    setMonto('');
    setNotas('');
    setFormError('');
    setModalOpen(true);
  };

  const guardarDeuda = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const valor = parseFloat(monto);
    if (!entidad.trim()) {
      setFormError('Indica a quién o qué entidad');
      return;
    }
    if (!valor || valor <= 0) {
      setFormError('Monto inválido');
      return;
    }
    if (!fechaVenc) {
      setFormError('Fecha de vencimiento requerida');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFormError('Sin sesión');
        return;
      }
      const { error } = await supabase.from('deudas').insert({
        usuario_id: user.id,
        entidad_persona: entidad.trim(),
        tipo_deuda: tipoDeuda,
        monto_total: valor,
        monto_pagado: 0,
        fecha_vencimiento: fechaVenc,
        estado: 'PENDIENTE',
        notas: notas.trim() || null,
      });
      if (error) throw error;
      setModalOpen(false);
      await fetchDeudas();
    } catch (err: any) {
      setFormError(err?.message || 'No se pudo guardar (revisa RLS de deudas)');
    } finally {
      setSaving(false);
    }
  };

  const mesAnterior = () => {
    if (mes === 1) {
      setMes(12);
      setAnio(anio - 1);
    } else setMes(mes - 1);
    setDiaSeleccionado(1);
  };

  const mesSiguiente = () => {
    if (mes === 12) {
      setMes(1);
      setAnio(anio + 1);
    } else setMes(mes + 1);
    setDiaSeleccionado(1);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 sm:p-8 bg-[#0a0a0a] text-zinc-200 min-h-screen font-sans">
      <div className="flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <h1 className="text-3xl font-serif text-[#e4dec7] mb-2">Calendario de pagos</h1>
            <p className="text-zinc-500 mb-4 text-sm">
              Deudas y cargos programados. Selecciona un día para ver su agenda.
            </p>
          </div>
          <button
            onClick={abrirModalNueva}
            className="flex items-center gap-1.5 bg-[#e4dec7] hover:bg-[#d4ceb8] text-zinc-900 font-medium px-4 py-2 rounded-full text-sm transition"
          >
            <Plus size={16} /> Nueva deuda
          </button>
        </div>

        <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800/50 max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <button onClick={mesAnterior} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" aria-label="Mes anterior">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-serif text-[#e4dec7]">
              {nombreMes} de {anio}
            </h2>
            <button onClick={mesSiguiente} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white" aria-label="Mes siguiente">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs text-zinc-500 mb-4">
            <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-neutral-400" size={28} />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-y-4 text-center">
              {Array.from({ length: offsetInicio }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {diasMes.map((dia) => {
                const pendiente = deudas.some(
                  (d) =>
                    d.fecha_vencimiento &&
                    parseInt(d.fecha_vencimiento.split('-')[2], 10) === dia &&
                    d.estado === 'PENDIENTE'
                );
                const pagada = deudas.some(
                  (d) =>
                    d.fecha_vencimiento &&
                    parseInt(d.fecha_vencimiento.split('-')[2], 10) === dia &&
                    d.estado === 'PAGADO'
                );
                return (
                  <div
                    key={dia}
                    className="flex flex-col items-center justify-center relative cursor-pointer"
                    onClick={() => setDiaSeleccionado(dia)}
                  >
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                        dia === diaSeleccionado
                          ? 'border border-zinc-500 text-white bg-zinc-800'
                          : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      {dia}
                    </span>
                    {pendiente && <span className="w-1.5 h-1.5 rounded-full absolute bottom-[-6px] bg-[#c69a5c]" />}
                    {!pendiente && pagada && (
                      <span className="w-1.5 h-1.5 rounded-full absolute bottom-[-6px] bg-green-600/70" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-96 flex flex-col gap-4 md:pt-16">
        <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800/50">
          <h3 className="font-serif text-[#e4dec7] text-lg">
            {diaSeleccionado} de {nombreMes.toLowerCase()}
          </h3>
          <p className="text-zinc-500 text-sm mt-1">{deudasDelDia.length} vencimiento(s)</p>
        </div>

        <div>
          <h3 className="font-serif text-[#e4dec7] text-xl mb-4">Agenda del día</h3>
          <div className="flex flex-col gap-3">
            {deudasDelDia.length === 0 ? (
              <p className="text-zinc-500 text-sm">No hay compromisos para este día.</p>
            ) : (
              deudasDelDia.map((deuda) => {
                const isPaid = deuda.estado === 'PAGADO';
                const restante = Number(deuda.monto_total) - Number(deuda.monto_pagado || 0);
                return (
                  <div
                    key={deuda.id}
                    className="bg-[#141414] border border-zinc-800/50 rounded-xl p-4 flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-zinc-200 text-sm font-medium">{deuda.entidad_persona}</p>
                      <p className="text-zinc-500 text-xs capitalize">{(deuda.tipo_deuda || '').toLowerCase()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-zinc-200 font-medium text-sm">
                        ${restante.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </p>
                      {isPaid ? (
                        <span className="text-xs text-green-500/70">Pagado</span>
                      ) : (
                        <button
                          onClick={() => marcarComoPagado(deuda.id)}
                          className="text-xs text-[#c69a5c] hover:text-[#e4dec7] underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Marcar pagado
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161616] border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-serif text-[#e4dec7]">Nueva deuda / pago</h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={guardarDeuda} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Entidad / persona</label>
                <input
                  value={entidad}
                  onChange={(e) => setEntidad(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white"
                  placeholder="Ej. Banco Pichincha"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Tipo</label>
                <select
                  value={tipoDeuda}
                  onChange={(e) => setTipoDeuda(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="PRESTAMO">Préstamo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="SERVICIO">Servicio</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Monto total</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Vencimiento</label>
                  <input
                    type="date"
                    value={fechaVenc}
                    onChange={(e) => setFechaVenc(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Notas</label>
                <input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white"
                  placeholder="Opcional"
                />
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#e4dec7] hover:bg-[#d4ceb8] text-zinc-900 font-semibold text-sm py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />} Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
