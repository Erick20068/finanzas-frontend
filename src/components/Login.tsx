import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { usuarioService } from '../services/usuarioService';
import { Loader2, Eye, EyeOff, Wallet, PiggyBank, LineChart } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister: () => void;
}


function traducirErrorLogin(msg: string): string {
  const m = (msg || '').toLowerCase();
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja (y spam) o desactiva Confirm email en Supabase.';
  }
  if (m.includes('invalid login') || m.includes('invalid credentials') || m.includes('invalid_grant')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (m.includes('user not found')) {
    return 'No existe una cuenta con ese correo. Regístrate primero.';
  }
  if (m.includes('too many') || m.includes('rate limit')) {
    return 'Demasiados intentos. Espera un momento.';
  }
  return msg || 'Error al iniciar sesión';
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      // Asegurar fila en public.usuarios (si el trigger o el registro fallaron)
      if (data.user) {
        try {
          await usuarioService.asegurarPerfil(data.user);
        } catch (e) {
          console.warn('No se pudo asegurar perfil:', e);
        }
      }
    } catch (err: any) {
      setError(traducirErrorLogin(err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Panel izquierdo de marca — se oculta en móvil */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-[#0f0f0f] border-r border-neutral-900 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d4d4c8, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7a9e72, transparent 70%)' }}
        />

        <span className="text-3xl font-serif italic tracking-wide relative z-10">Arca</span>

        <div className="relative z-10 space-y-8 max-w-sm">
          <h2 className="text-4xl font-serif leading-tight text-white">
            Tus finanzas,<br />en un solo lugar.
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Controla ingresos, gastos, presupuestos y cuentas en tiempo real, sincronizado en la nube.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <span className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-neutral-800 flex items-center justify-center shrink-0">
                <Wallet size={16} className="text-[#d4d4c8]" />
              </span>
              Movimientos e ingresos organizados por cuenta
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <span className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-neutral-800 flex items-center justify-center shrink-0">
                <PiggyBank size={16} className="text-[#a8c5a0]" />
              </span>
              Presupuestos con límites por categoría
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <span className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-neutral-800 flex items-center justify-center shrink-0">
                <LineChart size={16} className="text-[#c9a0a0]" />
              </span>
              Un asesor que analiza tus números del mes
            </div>
          </div>
        </div>

        <p className="text-[11px] text-neutral-600 relative z-10">© {new Date().getFullYear()} Arca. Todos los derechos reservados.</p>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-sm w-full space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-serif italic tracking-wide text-white lg:hidden">Arca</h1>
            <h1 className="hidden lg:block text-2xl font-serif text-white">Bienvenido de nuevo</h1>
            <p className="text-sm text-neutral-400">Ingresa a tu panel financiero</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-400">Contraseña</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4d4c8] text-[#1a1a1a] hover:bg-[#c5c5b8] font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Iniciar sesión
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-neutral-500">
              ¿No tienes una cuenta?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-white font-medium hover:underline focus:outline-none"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;