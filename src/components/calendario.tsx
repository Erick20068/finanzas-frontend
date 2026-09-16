import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface Deuda {
  id: number;
  entidad_persona: string;
  monto_total: number;
  monto_pagado: number;
  fecha_vencimiento: string;
  tipo_deuda: string;
  estado: 'PENDIENTE' | 'PAGADO';
}

export default function Calendario() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(new Date().getDate());
  
  const anio = 2026;
  const mes = 9; // Septiembre
  const diasMes = Array.from({ length: 30 }, (_, i) => i + 1); // Septiembre tiene 30 días

  useEffect(() => {
    const fetchDeudas = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const inicioMes = `${anio}-09-01`;
      const finMes = `${anio}-09-30`;

      const { data, error } = await supabase
        .from('deudas')
        .select('*')
        .eq('usuario_id', user.id)
        .gte('fecha_vencimiento', inicioMes)
        .lte('fecha_vencimiento', finMes)
        .order('fecha_vencimiento', { ascending: true });
      
      if (!error && data) {
        setDeudas(data);
      }
    };
    fetchDeudas();
  }, []);

  const deudasDelDia = deudas.filter(d => {
    if(!d.fecha_vencimiento) return false;
    const diaDeuda = parseInt(d.fecha_vencimiento.split('-')[2]);
    return diaDeuda === diaSeleccionado;
  });

  const marcarComoPagado = async (id: number) => {
    await supabase.from('deudas').update({ estado: 'PAGADO' }).eq('id', id);
    setDeudas(deudas.map(d => d.id === id ? { ...d, estado: 'PAGADO' } : d));
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-8 bg-[#0a0a0a] text-zinc-200 min-h-screen font-sans">
      {/* Panel Izquierdo - Calendario */}
      <div className="flex-1">
        <h1 className="text-3xl font-serif text-[#e4dec7] mb-2">Calendario de pagos</h1>
        <p className="text-zinc-500 mb-8 text-sm">
          Deudas y cargos programados. Selecciona un día para ver su agenda.
        </p>

        <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800/50 max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif text-[#e4dec7]">Septiembre de 2026</h2>
          </div>

          <div className="grid grid-cols-7 gap-4 text-center text-xs text-zinc-500 mb-4">
            <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
          </div>
          
          <div className="grid grid-cols-7 gap-y-6 text-center">
            {/* Espacios vacíos si el mes no empieza en Lunes (1 sep 2026 fue Martes) */}
            <div></div>
            {diasMes.map(dia => {
              const tieneDeudaPendiente = deudas.some(d => parseInt(d.fecha_vencimiento.split('-')[2]) === dia && d.estado === 'PENDIENTE');
              const tieneDeudaPagada = deudas.some(d => parseInt(d.fecha_vencimiento.split('-')[2]) === dia && d.estado === 'PAGADO');

              return (
                <div key={dia} className="flex flex-col items-center justify-center relative cursor-pointer" onClick={() => setDiaSeleccionado(dia)}>
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${dia === diaSeleccionado ? 'border border-zinc-500 text-white bg-zinc-800' : 'text-zinc-300 hover:bg-zinc-800/50'}`}>
                    {dia}
                  </span>
                  {tieneDeudaPendiente && <span className="w-1 h-1 rounded-full absolute bottom-[-8px] bg-[#c69a5c]"></span>}
                  {!tieneDeudaPendiente && tieneDeudaPagada && <span className="w-1 h-1 rounded-full absolute bottom-[-8px] bg-green-600/70"></span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel Derecho - Agenda del Día */}
      <div className="w-full md:w-96 flex flex-col gap-4 pt-16">
        <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800/50 flex justify-between items-center">
          <div>
            <h3 className="font-serif text-[#e4dec7] text-lg">{diaSeleccionado} de septiembre</h3>
            <p className="text-zinc-500 text-sm mt-1">{deudasDelDia.length} vencimiento(s)</p>
          </div>
        </div>

        <div>
          <h3 className="font-serif text-[#e4dec7] text-xl mb-4 mt-4">Agenda del día</h3>
          <div className="flex flex-col gap-3">
            {deudasDelDia.length === 0 ? (
              <p className="text-zinc-500 text-sm">No hay compromisos para este día.</p>
            ) : (
              deudasDelDia.map(deuda => {
                const isPaid = deuda.estado === 'PAGADO';
                const montoRestante = deuda.monto_total - deuda.monto_pagado;
                
                return (
                  <div key={deuda.id} className="bg-[#141414] border border-zinc-800/50 rounded-xl p-4 flex justify-between items-center group">
                    <div>
                      <p className="text-zinc-200 text-sm font-medium">{deuda.entidad_persona}</p>
                      <p className="text-zinc-500 text-xs capitalize">{deuda.tipo_deuda.toLowerCase()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-zinc-200 font-medium text-sm">${montoRestante.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                      {isPaid ? (
                        <span className="text-xs text-green-500/70">Pagado</span>
                      ) : (
                        <button onClick={() => marcarComoPagado(deuda.id)} className="text-xs text-[#c69a5c] hover:text-[#e4dec7] underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Marcar pagado
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}