import React, { useEffect, useState } from 'react';
import { Transaccion, TipoTransaccion } from '../types/transaccion';
import { obtenerTransacciones, crearTransaccion } from '../services/transaccionService';
import { Categoria } from '../types/categoria';
import { obtenerCategorias } from '../services/categoriaService';
import { Cuenta } from '../types/cuenta';
import { obtenerCuentas } from '../services/cuentaService';

interface Props {
  usuarioId: string;
}

export const ListaTransacciones: React.FC<Props> = ({ usuarioId }) => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);

  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<TipoTransaccion>('GASTO');
  const [categoriaId, setCategoriaId] = useState('');
  const [cuentaId, setCuentaId] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [usuarioId]);

  const cargarDatos = async () => {
    try {
      const [trans, cats, cuens] = await Promise.all([
        obtenerTransacciones(usuarioId),
        obtenerCategorias(usuarioId),
        obtenerCuentas(usuarioId),
      ]);
      setTransacciones(trans);
      setCategorias(cats);
      setCuentas(cuens);
    } catch (error) {
      console.error('Error al cargar transacciones', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || !categoriaId || !cuentaId) return;

    try {
      await crearTransaccion({
        monto: parseFloat(monto),
        descripcion,
        fecha,
        tipo,
        categoriaId,
        cuentaId,
        usuarioId,
      });
      setMonto('');
      setDescripcion('');
      cargarDatos();
    } catch (error) {
      console.error('Error al crear transacción', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">💰 Gestión de Transacciones</h2>

      {/* Formulario de registro */}
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Monto</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
          <input
            type="text"
            placeholder="Ej. Almuerzo, Compra..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
          <input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
          <select 
            value={tipo} 
            onChange={(e) => setTipo(e.target.value as TipoTransaccion)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="GASTO">Gasto</option>
            <option value="INGRESO">Ingreso</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
          <select 
            value={categoriaId} 
            onChange={(e) => setCategoriaId(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            required
          >
            <option value="">Selecciona categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Cuenta</label>
          <select 
            value={cuentaId} 
            onChange={(e) => setCuentaId(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            required
          >
            <option value="">Selecciona cuenta</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombreBanco}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 text-sm shadow-sm"
          >
            Registrar Transacción
          </button>
        </div>
      </form>

      {/* Tabla estilo Excel */}
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Historial de Movimientos</h3>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Fecha</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Descripción</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Tipo</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transacciones.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay transacciones registradas.
                </td>
              </tr>
            ) : (
              transacciones.map((t, index) => (
                <tr key={t.id || index} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {t.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {t.descripcion || '(sin descripción)'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      t.tipo === 'INGRESO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                    t.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.tipo === 'INGRESO' ? '+' : '-'}${t.monto.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};