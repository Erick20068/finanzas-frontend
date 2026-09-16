import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { categoriaService } from '../services/categoriaService';

interface Categoria {
  id: number;
  nombre: string;
}

interface PresupuestoData {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  limite: number;
  gastado: number;
}

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState<PresupuestoData[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<number | ''>('');
  const [montoLimite, setMontoLimite] = useState<string>('');

  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1; // 1-12
  const anioActual = ahora.getFullYear();
  const diasEnMes = new Date(anioActual, mesActual, 0).getDate();
  const nombreMes = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ][mesActual - 1];

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Categorías fijas (se crean en BD si faltan)
    try {
      const cats = await categoriaService.getCategorias(user.id);
      setCategorias(cats);
    } catch (e) {
      console.warn('Error categorías:', e);
    }

    // 2. Obtener presupuestos del mes
    const { data: presups } = await supabase
      .from('presupuestos')
      .select('id, categoria_id, monto_limite, categorias(nombre)')
      .eq('usuario_id', user.id)
      .eq('mes', mesActual)
      .eq('anio', anioActual);

    // 3. Obtener transacciones (gastos) del mes para calcular el progreso
    const inicioMes = `${anioActual}-${String(mesActual).padStart(2, '0')}-01`;
    const finMes = `${anioActual}-${String(mesActual).padStart(2, '0')}-${String(diasEnMes).padStart(2, '0')}`;
    const { data: transacciones } = await supabase
      .from('transacciones')
      .select('categoria_id, monto')
      .eq('usuario_id', user.id)
      .eq('tipo_transaccion', 'GASTO')
      .gte('fecha_movimiento', inicioMes)
      .lte('fecha_movimiento', finMes);

    if (presups) {
      const dataMapeada = presups.map((p: any) => {
        const gastado = transacciones
          ?.filter(t => t.categoria_id === p.categoria_id)
          .reduce((acc, curr) => acc + Number(curr.monto), 0) || 0;

        return {
          id: p.id,
          categoria_id: p.categoria_id,
          categoria_nombre: p.categorias?.nombre || 'Desconocida',
          limite: Number(p.monto_limite),
          gastado: gastado
        };
      });
      setPresupuestos(dataMapeada);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPresupuestado = presupuestos.reduce((acc, p) => acc + p.limite, 0);
  const totalGastado = presupuestos.reduce((acc, p) => acc + p.gastado, 0);
  const totalDisponible = totalPresupuestado - totalGastado;

  // Funciones CRUD
  const handleOpenModal = (presupuesto?: PresupuestoData) => {
    if (presupuesto) {
      setEditId(presupuesto.id);
      setSelectedCategoria(presupuesto.categoria_id);
      setMontoLimite(presupuesto.limite.toString());
    } else {
      setEditId(null);
      setSelectedCategoria('');
      setMontoLimite('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Sesión no válida');
      return;
    }
    if (!selectedCategoria || !montoLimite) {
      alert('Elige categoría y monto límite');
      return;
    }

    let error;
    if (editId) {
      ({ error } = await supabase.from('presupuestos').update({
        categoria_id: Number(selectedCategoria),
        monto_limite: Number(montoLimite)
      }).eq('id', editId));
    } else {
      ({ error } = await supabase.from('presupuestos').insert({
        usuario_id: user.id,
        categoria_id: Number(selectedCategoria),
        mes: mesActual,
        anio: anioActual,
        monto_limite: Number(montoLimite)
      }));
    }
    if (error) {
      alert('Error al guardar presupuesto: ' + error.message + '\nRevisa RLS de la tabla presupuestos.');
      return;
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Seguro que deseas eliminar este presupuesto?')) {
      await supabase.from('presupuestos').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="p-8 bg-[#0a0a0a] text-zinc-200 min-h-screen font-sans">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-4xl font-serif text-[#e4dec7]">{nombreMes} de {anioActual}</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#e4dec7] hover:bg-[#d4ceb8] text-zinc-900 font-medium px-4 py-2 rounded-full text-sm transition-colors"
        >
          Nuevo límite
        </button>
      </div>
      <p className="text-zinc-500 mb-8 text-sm">
        Asigna un techo a cada categoría. Las barras se pintan en verde o rojo según el avance.
      </p>

      {loading ? (
        <p className="text-zinc-500">Cargando presupuestos...</p>
      ) : (
        <>
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#141414] p-6 rounded-2xl border border-zinc-800/50">
              <p className="text-xs text-zinc-500 tracking-wider font-semibold mb-2">PRESUPUESTADO</p>
              <p className="text-3xl text-zinc-200 font-serif">${totalPresupuestado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#141414] p-6 rounded-2xl border border-zinc-800/50">
              <p className="text-xs text-zinc-500 tracking-wider font-semibold mb-2">GASTADO</p>
              <p className="text-3xl text-zinc-400 font-serif">${totalGastado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#141414] p-6 rounded-2xl border border-zinc-800/50">
              <p className="text-xs text-zinc-500 tracking-wider font-semibold mb-2">DISPONIBLE</p>
              <p className={`text-3xl font-serif ${totalDisponible < 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                ${totalDisponible.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Tabla */}
          <div className="w-full">
            <div className="grid grid-cols-12 text-xs text-zinc-500 tracking-wider font-semibold mb-4 border-b border-zinc-800/50 pb-4">
              <div className="col-span-3">CATEGORÍA</div>
              <div className="col-span-2">LÍMITE</div>
              <div className="col-span-2">GASTADO</div>
              <div className="col-span-3">PROGRESO</div>
              <div className="col-span-2 text-right">ACCIONES</div>
            </div>

            <div className="flex flex-col gap-6 mt-6">
              {presupuestos.map((cat) => {
                const porcentaje = Math.min((cat.gastado / cat.limite) * 100, 100);
                const isLimit = porcentaje >= 100;
                const restante = cat.limite - cat.gastado;

                return (
                  <div key={cat.id} className="grid grid-cols-12 items-center text-sm group hover:bg-[#141414] p-2 -mx-2 rounded-xl transition-colors">
                    <div className="col-span-3 font-medium text-zinc-300">{cat.categoria_nombre}</div>
                    <div className="col-span-2">
                      <div className="bg-[#1a1a1a] border border-zinc-800 rounded-lg px-4 py-2 w-24 text-zinc-300 text-center">
                        ${cat.limite}
                      </div>
                    </div>
                    <div className="col-span-2 text-zinc-400">
                      ${cat.gastado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="col-span-3 flex flex-col justify-center pr-4">
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>{Math.round(porcentaje)}%</span>
                        <span>{restante < 0 ? 'Excedido' : `$${restante.toLocaleString('es-EC')}`}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isLimit ? 'bg-red-400/80' : 'bg-green-600/70'}`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(cat)} className="text-zinc-400 hover:text-white px-2 py-1">Editar</button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-300 px-2 py-1">Eliminar</button>
                    </div>
                  </div>
                );
              })}
              {presupuestos.length === 0 && <p className="text-zinc-500 text-center py-8">No hay presupuestos configurados para este mes.</p>}
            </div>
          </div>
        </>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-zinc-800 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-serif text-[#e4dec7] mb-4">
              {editId ? 'Editar Presupuesto' : 'Nuevo Límite de Presupuesto'}
            </h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Categoría</label>
                <select 
                  required
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(Number(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-zinc-800 text-zinc-200 rounded-xl p-3 focus:outline-none focus:border-[#e4dec7]"
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categorias.filter(c => c.nombre).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Monto Límite ($)</label>
                <input 
                  type="number" step="0.01" required
                  value={montoLimite}
                  onChange={(e) => setMontoLimite(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-zinc-800 text-zinc-200 rounded-xl p-3 focus:outline-none focus:border-[#e4dec7]"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-zinc-800 text-white rounded-xl py-3 hover:bg-zinc-700">Cancelar</button>
                <button type="submit" className="flex-1 bg-[#e4dec7] text-black rounded-xl py-3 hover:bg-[#d4ceb8]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}