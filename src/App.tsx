import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Movimientos } from './components/momvimientos/Movimientos';
import { Cuentas } from './components/cuentas/Cuentas';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Loader2, Menu, Plus } from 'lucide-react';
import Calendario from './components/calendario';
import { NuevoMovimientoModal } from './components/momvimientos/NuevoMovimientoModal';
import Presupuestos from './components/Presupuestos';
import Asesor from './components/Asesor';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [vistaActual, setVistaActual] = useState('resumen');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleMovimientoCreado = () => {
    setModalMovimiento(false);
    setRefreshKey((k) => k + 1);
  };

  const titulos: Record<string, string> = {
    resumen: 'Resumen',
    movimientos: 'Movimientos',
    presupuestos: 'Presupuestos',
    calendario: 'Calendario',
    asesor: 'Asesor',
    cuentas: 'Cuentas',
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={36} />
      </div>
    );
  }

  if (!session) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex">
      <Navbar
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
      />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        <header className="bg-[#0a0a0a] border-b border-neutral-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuAbierto(true)} className="md:hidden text-neutral-400 hover:text-white p-1">
              <Menu size={20} />
            </button>
            <span className="text-sm text-neutral-400 font-medium">{titulos[vistaActual] || 'Resumen'}</span>
          </div>
          <button
            onClick={() => setModalMovimiento(true)}
            className="flex items-center gap-1.5 bg-[#d4d4c8] hover:bg-[#c5c5b8] text-[#1a1a1a] px-3.5 py-2 rounded-full text-xs font-semibold transition shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            Nuevo movimiento
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {vistaActual === 'resumen' && <Dashboard key={refreshKey} />}
          {vistaActual === 'movimientos' && <Movimientos key={refreshKey} />}
          {vistaActual === 'presupuestos' && <Presupuestos key={refreshKey} />}
          {vistaActual === 'calendario' && <Calendario key={refreshKey} />}
          {vistaActual === 'asesor' && <Asesor key={refreshKey} />}
          {vistaActual === 'cuentas' && <Cuentas key={refreshKey} />}
        </main>
      </div>
      {modalMovimiento && (
        <NuevoMovimientoModal onClose={() => setModalMovimiento(false)} onSuccess={handleMovimientoCreado} />
      )}
    </div>
  );
}

export default App;
