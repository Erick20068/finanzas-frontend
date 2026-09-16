import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { cuentaService } from '../services/cuentaService';
import { transaccionService } from '../services/transaccionService';
import { Cuenta } from '../types/cuenta';
import { Transaccion } from '../types/transaccion';
import { Loader2, ExternalLink } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [c, t] = await Promise.all([
          cuentaService.getCuentas(user.id),
          transaccionService.getTransacciones(user.id),
        ]);
        setCuentas(c);
        setTransacciones(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ahora = new Date();
  const mes = ahora.getMonth();
  const anio = ahora.getFullYear();
  const nombreMes = ahora.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const nombreMesCap = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  const transMes = useMemo(() =>
    transacciones.filter(t => {
      const f = new Date(t.fecha_movimiento + 'T00:00:00');
      return f.getMonth() === mes && f.getFullYear() === anio;
    }), [transacciones, mes, anio]);

  const patrimonio = cuentas.reduce((a, c) => a + Number(c.saldo_actual), 0);
  const ingresos = transMes.filter(t => t.tipo_transaccion === 'INGRESO').reduce((a, t) => a + Number(t.monto), 0);
  const gastos = transMes.filter(t => t.tipo_transaccion === 'GASTO').reduce((a, t) => a + Number(t.monto), 0);
  const balance = ingresos - gastos;
  const pctAhorro = ingresos > 0 ? Math.round((balance / ingresos) * 100) : 0;

  const gastosPorCat = useMemo(() => {
    const m: Record<string, number> = {};
    transMes.filter(t => t.tipo_transaccion === 'GASTO').forEach(t => {
      const n = t.categorias?.nombre || 'Sin categoría';
      m[n] = (m[n] || 0) + Number(t.monto);
    });
    return Object.entries(m).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
  }, [transMes]);
  const maxCat = Math.max(...gastosPorCat.map(g => g.total), 1);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtFecha = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-neutral-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium mb-1">Libro mayor</p>
        <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">Resumen de {nombreMesCap}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Patrimonio</p>
          <p className="text-2xl sm:text-3xl font-medium text-white tabular-nums">${fmt(patrimonio)}</p>
          <p className="text-xs text-neutral-500 mt-1">Suma de cuentas</p>
        </div>
        <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Ingresos</p>
          <p className="text-2xl sm:text-3xl font-medium text-[#a8c5a0] tabular-nums">${fmt(ingresos)}</p>
          <p className="text-xs text-neutral-500 mt-1">Este mes</p>
        </div>
        <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Gastos</p>
          <p className="text-2xl sm:text-3xl font-medium text-[#c9a0a0] tabular-nums">${fmt(gastos)}</p>
          <p className="text-xs text-neutral-500 mt-1">Este mes</p>
        </div>
        <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Balance</p>
          <p className={`text-2xl sm:text-3xl font-medium tabular-nums ${balance >= 0 ? 'text-[#a8c5a0]' : 'text-[#c9a0a0]'}`}>${fmt(balance)}</p>
          <p className="text-xs text-neutral-500 mt-1">{pctAhorro}% de ahorro</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#141414] border border-neutral-800/80 rounded-2xl p-5 min-h-[220px]">
          <h3 className="text-base font-medium text-white">Flujo de caja</h3>
          <p className="text-xs text-neutral-500 mt-0.5 mb-4">Ingresos frente a gastos · últimos 6 meses</p>
          <div className="flex items-end gap-2 h-40">
            {[5,4,3,2,1,0].map(i => {
              const d = new Date(anio, mes - i, 1);
              const m = d.getMonth(); const y = d.getFullYear();
              const label = d.toLocaleDateString('es-ES', { month: 'short' });
              const ing = transacciones.filter(t => {
                const f = new Date(t.fecha_movimiento + 'T00:00:00');
                return f.getMonth() === m && f.getFullYear() === y && t.tipo_transaccion === 'INGRESO';
              }).reduce((a, t) => a + Number(t.monto), 0);
              const gas = transacciones.filter(t => {
                const f = new Date(t.fecha_movimiento + 'T00:00:00');
                return f.getMonth() === m && f.getFullYear() === y && t.tipo_transaccion === 'GASTO';
              }).reduce((a, t) => a + Number(t.monto), 0);
              const max = Math.max(ing, gas, 1);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 h-28 w-full justify-center">
                    <div className="w-3 bg-[#7a9e72] rounded-t" style={{ height: `${(ing/max)*100}%` }} title={`Ingresos ${ing}`} />
                    <div className="w-3 bg-[#b87a7a] rounded-t" style={{ height: `${(gas/max)*100}%` }} title={`Gastos ${gas}`} />
                  </div>
                  <span className="text-[10px] text-neutral-500 capitalize">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7a9e72]" /> Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#b87a7a]" /> Gastos</span>
          </div>
        </div>

        <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-white">Cuentas</h3>
            <span className="text-xs text-neutral-500 flex items-center gap-1">Ver todas <ExternalLink size={12} /></span>
          </div>
          <div className="space-y-3">
            {cuentas.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">Sin cuentas</p>
            ) : cuentas.map(c => {
              const pct = patrimonio > 0 ? Math.round((Number(c.saldo_actual) / patrimonio) * 100) : 0;
              const tipo = (c.tipo_cuenta || '').toUpperCase() === 'CORRIENTE' ? 'Corriente' :
                (c.tipo_cuenta || '').toUpperCase() === 'EFECTIVO' ? 'Efectivo' : 'Ahorro';
              return (
                <div key={c.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-xl px-3.5 py-3 border border-neutral-800/50">
                  <div>
                    <p className="text-sm font-medium text-white">{c.nombre}</p>
                    <p className="text-[11px] text-neutral-500">{tipo} · {pct}%</p>
                  </div>
                  <p className="text-sm font-medium text-white tabular-nums">${fmt(Number(c.saldo_actual))}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-white">Actividad reciente</h3>
            <span className="text-xs text-neutral-500 flex items-center gap-1">Ver historial <ExternalLink size={12} /></span>
          </div>
          <div className="divide-y divide-neutral-800/60">
            {transacciones.slice(0, 6).length === 0 ? (
              <p className="text-sm text-neutral-500 py-6 text-center">Sin movimientos</p>
            ) : transacciones.slice(0, 6).map(t => {
              const esGasto = t.tipo_transaccion === 'GASTO';
              const esIngreso = t.tipo_transaccion === 'INGRESO';
              return (
                <div key={t.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{t.descripcion || 'Sin descripción'}</p>
                    <p className="text-[11px] text-neutral-500">{fmtFecha(t.fecha_movimiento)}{t.categorias?.nombre ? ` · ${t.categorias.nombre}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-medium tabular-nums ${esGasto ? 'text-[#c9a0a0]' : esIngreso ? 'text-[#a8c5a0]' : 'text-white'}`}>
                      {esGasto ? '−' : esIngreso ? '+' : ''}${fmt(Number(t.monto))}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      esGasto ? 'border-[#5c3a3a] text-[#c9a0a0] bg-[#2a1a1a]' :
                      esIngreso ? 'border-[#3a5c3a] text-[#a8c5a0] bg-[#1a2a1a]' :
                      'border-neutral-700 text-neutral-400 bg-neutral-900'
                    }`}>{esGasto ? 'Gasto' : esIngreso ? 'Ingreso' : 'Transferencia'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-5">
          <h3 className="text-base font-medium text-white mb-1">Gastos por categoría</h3>
          <p className="text-xs text-neutral-500 mb-4">Distribución del mes en curso</p>
          <div className="space-y-3">
            {gastosPorCat.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">Sin gastos este mes</p>
            ) : gastosPorCat.map(g => (
              <div key={g.nombre}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-300">{g.nombre}</span>
                  <span className="text-white tabular-nums">${fmt(g.total)}</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c5c5b0] rounded-full" style={{ width: `${(g.total / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
