import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Movimiento {
  id: string;
  descripcion: string;
  monto: number;
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  fecha: string;
}

export const VistaMovimientos = () => {
  const [movimientos] = useState<Movimiento[]>([
    { id: '1', descripcion: 'Supermercado', monto: 45.50, tipo: 'gasto', categoria: 'Alimentos', fecha: '2026-09-14' },
    { id: '2', descripcion: 'Nómina mensual', monto: 1200.00, tipo: 'ingreso', categoria: 'Trabajo', fecha: '2026-09-01' },
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} /> Nuevo Movimiento
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {movimientos.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                  {item.tipo === 'ingreso' ? (
                    <ArrowDownLeft className="text-green-500" size={16} />
                  ) : (
                    <ArrowUpRight className="text-red-500" size={16} />
                  )}
                  {item.descripcion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.categoria}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fecha}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.tipo === 'ingreso' ? 'text-green-600' : 'text-gray-900'}`}>
                  {item.tipo === 'ingreso' ? '+' : '-'}${item.monto.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};