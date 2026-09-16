import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Cuenta } from '../../types/cuenta';
import { Categoria } from '../../types/categoria';
import { supabase } from '../../services/supabaseClient';
import { cuentaService } from '../../services/cuentaService';
import { categoriaService } from '../../services/categoriaService';
import { transaccionService } from '../../services/transaccionService';


interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const NuevoMovimientoModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [tipo, setTipo] = useState<'GASTO' | 'INGRESO' | 'TRANSFERENCIA'>('GASTO');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cuentaId, setCuentaId] = useState<number | ''>('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState<number | ''>('');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [c, cat] = await Promise.all([
        cuentaService.getCuentas(user.id),
        categoriaService.getCategorias(user.id),
      ]);
      setCuentas(c);
      setCategorias(cat);
      if (c.length) setCuentaId(c[0].id);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const valor = parseFloat(monto);
    if (!valor || valor <= 0) { setError('Ingresa un monto válido'); return; }
    if (!cuentaId) { setError('Selecciona una cuenta'); return; }
    if (tipo === 'TRANSFERENCIA' && !cuentaDestinoId) { setError('Selecciona cuenta destino'); return; }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await transaccionService.crearTransaccion({
        usuario_id: user.id,
        cuenta_origen_id: Number(cuentaId),
        cuenta_destino_id: tipo === 'TRANSFERENCIA' ? Number(cuentaDestinoId) : undefined,
        categoria_id: tipo !== 'TRANSFERENCIA' && categoriaId ? Number(categoriaId) : undefined,
        tipo_transaccion: tipo,
        monto: valor,
        descripcion: descripcion || undefined,
        fecha_movimiento: fecha,
      });

      const origen = cuentas.find(c => c.id === Number(cuentaId));
      if (origen) {
        let s = Number(origen.saldo_actual);
        if (tipo === 'GASTO' || tipo === 'TRANSFERENCIA') s -= valor;
        if (tipo === 'INGRESO') s += valor;
        await supabase.from('cuentas').update({ saldo_actual: s }).eq('id', origen.id);
      }
      if (tipo === 'TRANSFERENCIA' && cuentaDestinoId) {
        const dest = cuentas.find(c => c.id === Number(cuentaDestinoId));
        if (dest) {
          await supabase.from('cuentas').update({ saldo_actual: Number(dest.saldo_actual) + valor }).eq('id', dest.id);
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161616] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <h2 className="text-lg font-serif text-white">Nuevo movimiento</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Registra un ingreso, un gasto o una transferencia entre cuentas.</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          <div className="flex bg-[#0f0f0f] rounded-xl p-1 border border-neutral-800">
            {(['GASTO','INGRESO','TRANSFERENCIA'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${tipo===t?'bg-neutral-700 text-white':'text-neutral-400 hover:text-white'}`}>
                {t==='GASTO'?'Gasto':t==='INGRESO'?'Ingreso':'Traspaso'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Monto</label>
              <input type="number" step="0.01" min="0" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0.00"
                className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600" />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Fecha</label>
              <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-neutral-500 mb-1 block">Cuenta</label>
            <select value={cuentaId} onChange={e=>setCuentaId(e.target.value?Number(e.target.value):'')}
              className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600">
              <option value="">Selecciona...</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} · ${Number(c.saldo_actual).toFixed(2)}</option>)}
            </select>
          </div>
          {tipo==='TRANSFERENCIA' && (
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Cuenta destino</label>
              <select value={cuentaDestinoId} onChange={e=>setCuentaDestinoId(e.target.value?Number(e.target.value):'')}
                className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600">
                <option value="">Selecciona...</option>
                {cuentas.filter(c=>c.id!==cuentaId).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}
          {tipo!=='TRANSFERENCIA' && (
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Categoría</label>
              <select value={categoriaId} onChange={e=>setCategoriaId(e.target.value?Number(e.target.value):'')}
                className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600">
                <option value="">Selecciona...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[11px] text-neutral-500 mb-1 block">Descripción</label>
            <input type="text" value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Ej. Super Tía"
              className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#d4d4c8] hover:bg-[#c5c5b8] text-[#1a1a1a] font-semibold text-sm py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />} Registrar
          </button>
        </form>
      </div>
    </div>
  );
};
