import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface ReporteMesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReporteMesModal({ isOpen, onClose }: ReporteMesModalProps) {
  const [data, setData] = useState({ ingresos: 0, gastos: 0, transferencias: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchReporte = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const inicioMes = '2026-09-01';
        const finMes = '2026-09-30';

        const { data: trans } = await supabase
          .from('transacciones')
          .select('tipo_transaccion, monto')
          .eq('usuario_id', user.id)
          .gte('fecha_movimiento', inicioMes)
          .lte('fecha_movimiento', finMes);

        if (trans) {
          setData({
            ingresos: trans.filter(t => t.tipo_transaccion === 'INGRESO').reduce((a, b) => a + Number(b.monto), 0),
            gastos: trans.filter(t => t.tipo_transaccion === 'GASTO').reduce((a, b) => a + Number(b.monto), 0),
            transferencias: trans.filter(t => t.tipo_transaccion === 'TRANSFERENCIA').reduce((a, b) => a + Number(b.monto), 0),
          });
        }
        setLoading(false);
      };
      fetchReporte();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const balance = data.ingresos - data.gastos;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#141414] border border-zinc-800 p-8 rounded-2xl w-full max-w-lg text-zinc-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif text-[#e4dec7]">Reporte: Septiembre 2026</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        {loading ? (
          <p className="text-center text-zinc-500 py-10">Calculando reporte...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] p-4 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">TOTAL INGRESOS</p>
                <p className="text-xl text-green-500/80">+${data.ingresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">TOTAL GASTOS</p>
                <p className="text-xl text-red-400">-${data.gastos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#c69a5c]/30 text-center">
              <p className="text-sm text-zinc-400 mb-2">BALANCE NETO DEL MES</p>
              <p className={`text-4xl font-serif ${balance >= 0 ? 'text-[#e4dec7]' : 'text-red-400'}`}>
                ${balance.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <button onClick={onClose} className="w-full bg-zinc-800 text-white rounded-xl py-3 hover:bg-zinc-700 mt-4">
              Cerrar Reporte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}