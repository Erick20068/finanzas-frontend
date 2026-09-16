import React, { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Cuenta } from '../../types/cuenta';
import { cuentaService } from '../../services/cuentaService';
import { supabase } from '../../services/supabaseClient';

export const Cuentas: React.FC = () => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Estados del formulario para nueva cuenta
  const [nombre, setNombre] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('CORRIENTE');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await cuentaService.getCuentas(user.id);
        setCuentas(data);
      }
    } catch (error) {
      console.error('Error al obtener cuentas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
  }, []);

  const handleCrearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');

    if (!nombre.trim()) {
      setErrorForm('Ponle un nombre a la cuenta.');
      return;
    }

    try {
      setGuardando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorForm('Tu sesión expiró. Vuelve a iniciar sesión.');
        return;
      }

      const monto = parseFloat(saldoInicial) || 0;

      await cuentaService.crearCuenta({
        usuario_id: user.id,
        nombre,
        tipo_cuenta: tipoCuenta,
        saldo_inicial: monto,
        saldo_actual: monto,
      });

      setNombre('');
      setSaldoInicial('');
      setModalOpen(false);
      await fetchCuentas();
    } catch (error: any) {
      console.error('Error al crear cuenta:', error);
      setErrorForm(error?.message || 'No se pudo guardar la cuenta. Revisa la conexión con Supabase.');
    } finally {
      setGuardando(false);
    }
  };

  // Cálculo dinámico del patrimonio total basado estrictamente en Supabase
  const patrimonioTotal = cuentas.reduce((acc, c) => acc + Number(c.saldo_actual), 0);

  if (loading) {
    return (
      <div className="flex-1 bg-[#0f0f0f] flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0f0f0f] min-h-screen text-white p-8 overflow-y-auto">
      {/* Cabecera superior */}
      <div className="flex justify-end items-center mb-8">
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-medium transition shadow-sm"
        >
          <Plus size={16} /> Nueva cuenta
        </button>
      </div>

      {/* Título de la sección y Patrimonio Total Dinámico */}
      <div className="mb-8">
        <h2 className="text-3xl font-serif tracking-tight text-white mb-1">Cuentas</h2>
        <p className="text-sm text-neutral-400">
          Patrimonio total <span className="text-white font-semibold">${patrimonioTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </p>
      </div>

      {/* Grid de Tarjetas de Cuentas */}
      {cuentas.length === 0 ? (
        <div className="text-center py-16 border border-neutral-800 rounded-2xl bg-[#121212]">
          <p className="text-neutral-400 text-sm">No tienes cuentas registradas en la base de datos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cuentas.map((cuenta) => {
            const saldo = Number(cuenta.saldo_actual);
            const porcentaje = patrimonioTotal > 0 ? Math.round((saldo / patrimonioTotal) * 100) : 0;

            return (
              <div 
                key={cuenta.id} 
                className="bg-[#121212] border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between hover:border-neutral-700 transition space-y-6"
              >
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                    {cuenta.tipo_cuenta}
                  </span>
                  <h3 className="text-xl font-serif text-white mt-1">{cuenta.nombre}</h3>
                  <p className="text-3xl font-bold tracking-tight text-white mt-2">
                    ${saldo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Barra de progreso de participación patrimonial */}
                <div className="space-y-2">
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-neutral-300 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500">{porcentaje}% del patrimonio</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para crear cuenta */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-6">
            <h3 className="text-xl font-serif text-white">Registrar nueva cuenta</h3>
            <form onSubmit={handleCrearCuenta} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre de la cuenta</label>
                <input 
                  type="text" 
                  required 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Cuenta JEP Principal" 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Tipo</label>
                <select 
                  value={tipoCuenta} 
                  onChange={(e) => setTipoCuenta(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600"
                >
                  <option value="CORRIENTE">CORRIENTE</option>
                  <option value="AHORRO">AHORRO</option>
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="INVERSIÓN">INVERSIÓN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Saldo inicial ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={saldoInicial} 
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>
              {errorForm && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                  {errorForm}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setModalOpen(false); setErrorForm(''); }}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-medium transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={guardando}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-medium transition disabled:opacity-60"
                >
                  {guardando && <Loader2 size={14} className="animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};