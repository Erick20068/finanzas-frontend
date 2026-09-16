import React, { useEffect, useState } from 'react';
import { transaccionService } from '../services/transaccionService';
import { Cuenta } from '../types/cuenta';
import { Loader2, PlusCircle } from 'lucide-react';
import { Categoria } from '../types/categoria';
import { cuentaService } from '../services/cuentaService';
import { categoriaService } from '../services/categoriaService';
import { supabase } from '../services/supabaseClient';

interface RegistrarTransaccionProps {
  onTransaccionCreada?: () => void;
}

export const RegistrarTransaccion: React.FC<RegistrarTransaccionProps> = ({ onTransaccionCreada }) => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Estados del formulario
  const [tipoTransaccion, setTipoTransaccion] = useState<'INGRESO' | 'GASTO' | 'TRANSFERENCIA'>('GASTO');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cuentaOrigenId, setCuentaOrigenId] = useState<string>('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [fechaMovimiento, setFechaMovimiento] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const cargarDatosAuxiliares = async () => {
      try {
        setFetchingData(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [cuentasRes, categoriasRes] = await Promise.all([
            cuentaService.getCuentas(user.id),
            categoriaService.getCategorias(user.id)
          ]);
          setCuentas(cuentasRes);
          setCategorias(categoriasRes);
          if (cuentasRes.length > 0) setCuentaOrigenId(cuentasRes[0].id.toString());
          if (categoriasRes.length > 0) setCategoriaId(categoriasRes[0].id.toString());
        }
      } catch (error) {
        console.error('Error al cargar datos para el formulario:', error);
      } finally {
        setFetchingData(false);
      }
    };

    cargarDatosAuxiliares();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await transaccionService.crearTransaccion({
        usuario_id: user.id,
        tipo_transaccion: tipoTransaccion,
        monto: parseFloat(monto),
        descripcion,
        cuenta_origen_id: parseInt(cuentaOrigenId),
        cuenta_destino_id: cuentaDestinoId ? parseInt(cuentaDestinoId) : undefined,
        categoria_id: categoriaId ? parseInt(categoriaId) : undefined,
        fecha_movimiento: fechaMovimiento,
      });

      // Limpiar formulario
      setMonto('');
      setDescripcion('');
      if (onTransaccionCreada) onTransaccionCreada();
      alert('Transacción registrada con éxito');
    } catch (error) {
      console.error('Error al registrar transacción:', error);
      alert('Hubo un error al registrar la transacción');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <PlusCircle className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-900">Nueva Transacción</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1 rounded-lg">
          {(['GASTO', 'INGRESO', 'TRANSFERENCIA'] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setTipoTransaccion(tipo)}
              className={`py-2 text-xs font-semibold rounded-md transition ${
                tipoTransaccion === tipo 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              required
              value={fechaMovimiento}
              onChange={(e) => setFechaMovimiento(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {tipoTransaccion === 'TRANSFERENCIA' ? 'Cuenta de Origen' : 'Cuenta'}
            </label>
            <select
              value={cuentaOrigenId}
              onChange={(e) => setCuentaOrigenId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} (${c.saldo_actual})</option>
              ))}
            </select>
          </div>

          {tipoTransaccion === 'TRANSFERENCIA' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">Cuenta de Destino</label>
              <select
                value={cuentaDestinoId}
                onChange={(e) => setCuentaDestinoId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Seleccione destino</option>
                {cuentas.filter(c => c.id.toString() !== cuentaOrigenId).map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre} ({cat.tipo_categoria})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Compra de supermercado o pago de servicios"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          Guardar Transacción
        </button>
      </form>
    </div>
  );
};