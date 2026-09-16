import React, { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, ArrowLeftRight, PieChart, Calendar, Bot, Wallet, X, Settings, LogOut, ChevronUp } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { PerfilModal } from './PerfilModal';

interface NavbarProps {
  vistaActual: string;
  setVistaActual: (vista: string) => void;
  menuAbierto: boolean;
  setMenuAbierto: (abierto: boolean) => void;
  onAbrirReporte?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ vistaActual, setVistaActual, menuAbierto, setMenuAbierto, onAbrirReporte }) => {
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('Usuario');
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const perfilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        const { data } = await supabase
          .from('usuarios')
          .select('nombre_completo')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.nombre_completo) {
          setUserName(data.nombre_completo);
        } else if (user.email) {
          setUserName(user.email.split('@')[0]);
        }
      }
    };
    fetchUser();
  }, []);

  // Cerrar el menú desplegable al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (perfilRef.current && !perfilRef.current.contains(e.target as Node)) {
        setMenuPerfilAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCerrarSesion = async () => {
    setMenuPerfilAbierto(false);
    await supabase.auth.signOut();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const menuItems = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'presupuestos', label: 'Presupuestos', icon: PieChart },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'asesor', label: 'Asesor', icon: Bot },
    { id: 'cuentas', label: 'Cuentas', icon: Wallet },
  ];

  return (
    <>
      {/* Fondo oscuro translúcido para móviles cuando el menú está abierto */}
      {menuAbierto && (
        <div 
          onClick={() => setMenuAbierto(false)} 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Lateral */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-neutral-800 flex flex-col justify-between h-screen select-none text-neutral-300 transform transition-transform duration-300 ease-in-out ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif tracking-wide text-white italic">Arca</h1>
            <button 
              onClick={() => setMenuAbierto(false)}
              className="md:hidden text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setVistaActual(item.id);
                    setMenuAbierto(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-800 space-y-4">
          <button 
            onClick={() => onAbrirReporte?.()}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xl text-xs font-medium transition"
          >
            Reporte del mes
          </button>

          <div className="relative" ref={perfilRef}>
            {menuPerfilAbierto && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#161616] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
                <button
                  onClick={() => { setModalPerfilAbierto(true); setMenuPerfilAbierto(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-neutral-300 hover:bg-neutral-900 hover:text-white transition"
                >
                  <Settings size={14} /> Editar cuenta
                </button>
                <button
                  onClick={handleCerrarSesion}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-red-400 hover:bg-red-500/10 transition border-t border-neutral-800"
                >
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
            <button
              onClick={() => setMenuPerfilAbierto((v) => !v)}
              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-neutral-900 transition overflow-hidden"
            >
              <div className="w-9 h-9 min-w-[36px] rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(userName)}
              </div>
              <div className="overflow-hidden text-left flex-1">
                <p className="text-xs font-medium text-white truncate">{userName}</p>
                <p className="text-[11px] text-neutral-500 truncate">{userEmail}</p>
              </div>
              <ChevronUp size={14} className={`text-neutral-500 shrink-0 transition-transform ${menuPerfilAbierto ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </aside>

      {modalPerfilAbierto && userId && (
        <PerfilModal
          userId={userId}
          nombreActual={userName}
          emailActual={userEmail}
          onClose={() => setModalPerfilAbierto(false)}
          onUpdated={(nuevoNombre) => {
            setUserName(nuevoNombre);
            setModalPerfilAbierto(false);
          }}
        />
      )}
    </>
  );
};