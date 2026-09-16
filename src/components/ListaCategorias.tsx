import React, { useEffect, useState } from 'react';
import { Cuenta } from '../types/cuenta';
import { obtenerCuentas } from '../services/cuentaService';
import { Transaccion } from '../types/transaccion';
import { obtenerTransacciones } from '../services/transaccionService';

interface Props {
  usuarioId: string;
}

export const Dashboard: React.FC<Props> = ({ usuarioId }) => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);

  useEffect(() => {
    Promise.all([obtenerCuentas(usuarioId), obtenerTransacciones(usuarioId)])
      .then(([c, t]) => {
        setCuentas(c);
        setTransacciones(t);
      })
      .catch((error) => console.error('Error al cargar el dashboard', error));
  }, [usuarioId]);

  const saldoTotal = cuentas.reduce((acc, c) => acc + c.saldoActual, 0);
  const totalIngresos = transacciones
    .filter((t) => t.tipo === 'INGRESO')
    .reduce((acc, t) => acc + t.monto, 0);
  const totalGastos = transacciones
    .filter((t) => t.tipo === 'GASTO')
    .reduce((acc, t) => acc + t.monto, 0);

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: 'auto' }}>
      <h2>Resumen general</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <div>Saldo total</div>
          <strong style={{ fontSize: 22 }}>${saldoTotal.toFixed(2)}</strong>
        </div>
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <div>Ingresos</div>
          <strong style={{ fontSize: 22, color: '#1a7a1a' }}>${totalIngresos.toFixed(2)}</strong>
        </div>
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <div>Gastos</div>
          <strong style={{ fontSize: 22, color: '#a11a1a' }}>${totalGastos.toFixed(2)}</strong>
        </div>
      </div>

      <h3 style={{ marginTop: 30 }}>Cuentas</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cuentas.map((c, i) => (
          <li key={c.id || i}>
            {c.nombreBanco}: ${c.saldoActual.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};