import React from 'react';
import { Transaccion } from '../types/transaccion';

interface Props {
  transacciones: Transaccion[];
}

export const TablaFinanciera: React.FC<Props> = ({ transacciones }) => {

  const totalIngresos = transacciones
    .filter(t => t.tipo === 'INGRESO')
    .reduce((acc, t) => acc + t.monto, 0);

  const totalGastos = transacciones
    .filter(t => t.tipo === 'GASTO')
    .reduce((acc, t) => acc + t.monto, 0);

  const balanceNeto = totalIngresos - totalGastos;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">📈 Resumen y Tabla Financiera</h2>
        
        <div className="flex gap-4">
          <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs font-semibold text-green-700">Ingresos</span>
            <span className="text-lg font-bold text-green-800">+${totalIngresos.toFixed(2)}</span>
          </div>
          <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs font-semibold text-red-700">Gastos</span>
            <span className="text-lg font-bold text-red-800">-${totalGastos.toFixed(2)}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs font-semibold text-blue-700">Balance Neto</span>
            <span className={`text-lg font-bold ${balanceNeto >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
              ${balanceNeto.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabla Estilo Hoja de Cálculo */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transacciones.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No hay movimientos registrados para mostrar en la tabla.
                </td>
              </tr>
            ) : (
              transacciones.map((t, index) => (
                <tr key={t.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                    {t.fecha}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                    {t.descripcion || '(Sin descripción)'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      t.tipo === 'INGRESO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className={`px-6 py-3 whitespace-nowrap text-sm font-bold text-right ${
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