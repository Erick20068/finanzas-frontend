import React, { useEffect, useState } from 'react';
import { Search, Trash2, Plus, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { transaccionService } from '../../services/transaccionService';
import { cuentaService } from '../../services/cuentaService';
import { Transaccion } from '../../types/transaccion';
import { Cuenta } from '../../types/cuenta';

interface MovimientosProps {
  onNuevoMovimientoClick?: () => void;
}

export const Movimientos: React.FC<MovimientosProps> = ({ onNuevoMovimientoClick }) => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros
  const [busqueda, setBusqueda] = useState('');
  const [cuentaFiltro, setCuentaFiltro] = useState('TODAS');
  const [tabActivo, setTabActivo] = useState<'TODOS' | 'GASTO' | 'INGRESO' | 'TRANSFERENCIA'>('TODOS');

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [transRes, cuentasRes] = await Promise.all([
          transaccionService.getTransacciones(user.id),
          cuentaService.getCuentas(user.id)
        ]);
        setTransacciones(transRes);
        setCuentas(cuentasRes);
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;
    try {
      const { error } = await supabase.from('transacciones').delete().eq('id', id);
      if (error) throw error;
      setTransacciones(transacciones.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
    }
  };

  // Filtrado dinámico
  const transaccionesFiltradas = transacciones.filter(item => {
    // Filtro por pestaña
    if (tabActivo === 'GASTO' && item.tipo_transaccion !== 'GASTO') return false;
    if (tabActivo === 'INGRESO' && item.tipo_transaccion !== 'INGRESO') return false;
    if (tabActivo === 'TRANSFERENCIA' && item.tipo_transaccion !== 'TRANSFERENCIA') return false;

    // Filtro por cuenta
    if (cuentaFiltro !== 'TODAS' && item.cuenta_origen_id.toString() !== cuentaFiltro) return false;

    // Filtro por búsqueda (descripción o categoría)
    if (busqueda.trim() !== '') {
      const query = busqueda.toLowerCase();
      const desc = (item.descripcion || '').toLowerCase();
      const cat = (item.categorias?.nombre || '').toLowerCase();
      if (!desc.includes(query) && !cat.includes(query)) return false;
    }

    return true;
  });

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0f0f0f] flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0f0f0f] min-h-screen text-white p-8 overflow-y-auto selection:bg-neutral-800">
      
      {/* Botón superior derecho */}
      <div className="flex justify-end items-center mb-6">
        <button 
          onClick={onNuevoMovimientoClick}
          className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-medium transition shadow-sm"
        >
          <Plus size={16} /> Nuevo movimiento
        </button>
      </div>

      {/* Cabecera de la vista */}
      <div className="mb-6">
        <h2 className="text-3xl font-serif tracking-tight text-white mb-1">Movimientos</h2>
        <p className="text-sm text-neutral-400">
          Ingresos, gastos y transferencias. Al elegir Traspaso se oculta la categoría y aparece la cuenta destino.
        </p>
      </div>

      {/* Barra de Búsqueda y Filtro de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-3 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
            <Search size={16} />
          </span>
          <input 
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar descripción o categoría"
            className="w-full bg-[#121212] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition"
          />
        </div>
        <div>
          <select 
            value={cuentaFiltro}
            onChange={(e) => setCuentaFiltro(e.target.value)}
            className="w-full bg-[#121212] border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-700 transition"
          >
            <option value="TODAS">Todas las cuentas</option>
            {cuentas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pestañas de Filtrado (Todos, Gastos, Ingresos, Traspasos) */}
      <div className="grid grid-cols-4 bg-[#121212] p-1 border border-neutral-800 rounded-xl mb-8 max-w-2xl text-xs font-medium">
        <button
          onClick={() => setTabActivo('TODOS')}
          className={`py-2 rounded-lg transition ${tabActivo === 'TODOS' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setTabActivo('GASTO')}
          className={`py-2 rounded-lg transition ${tabActivo === 'GASTO' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
        >
          Gastos
        </button>
        <button
          onClick={() => setTabActivo('INGRESO')}
          className={`py-2 rounded-lg transition ${tabActivo === 'INGRESO' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setTabActivo('TRANSFERENCIA')}
          className={`py-2 rounded-lg transition ${tabActivo === 'TRANSFERENCIA' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
        >
          Traspasos
        </button>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl overflow-hidden">
        {transaccionesFiltradas.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-sm">
            No se encontraron movimientos registrados.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-800/60 text-left">
            <thead>
              <tr className="text-[11px] font-medium tracking-wider text-neutral-500 uppercase bg-[#141414]">
                <th className="px-6 py-3.5">Fecha</th>
                <th className="px-6 py-3.5">Descripción</th>
                <th className="px-6 py-3.5">Categoría / Destino</th>
                <th className="px-6 py-3.5">Tipo</th>
                <th className="px-6 py-3.5 text-right">Monto</th>
                <th className="px-4 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40 text-sm">
              {transaccionesFiltradas.map((item) => {
                const esIngreso = item.tipo_transaccion === 'INGRESO';
                const esTransferencia = item.tipo_transaccion === 'TRANSFERENCIA';
                
                // Buscar nombre de cuenta destino si es transferencia
                const cuentaDestinoObj = cuentas.find(c => c.id === item.cuenta_destino_id);

                return (
                  <tr key={item.id} className="hover:bg-neutral-900/40 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-400 text-xs">
                      {formatearFecha(item.fecha_movimiento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-white">{item.descripcion || 'Sin descripción'}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.cuentas?.nombre || 'Cuenta principal'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-300 text-xs">
                      {esTransferencia ? (
                        <span className="text-neutral-400">→ {cuentaDestinoObj?.nombre || 'Otra cuenta'}</span>
                      ) : (
                        item.categorias?.nombre || 'General'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                        {item.tipo_transaccion.charAt(0) + item.tipo_transaccion.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${esIngreso ? 'text-white' : 'text-white'}`}>
                      {esIngreso ? '+' : esTransferencia ? '' : '-'}${Number(item.monto).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-neutral-500 hover:text-red-400 transition p-1"
                        title="Eliminar movimiento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};