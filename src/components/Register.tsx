import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { usuarioService } from '../services/usuarioService';
import { Loader2 } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

function traducirErrorAuth(msg: string): string {
  const m = (msg || '').toLowerCase();
  if (m.includes('already registered') || m.includes('user already') || m.includes('already been registered')) {
    return 'Este correo ya está registrado. Inicia sesión o usa otro email.';
  }
  if (m.includes('password') && (m.includes('least') || m.includes('short') || m.includes('6'))) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'El correo no es válido.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  if (m.includes('signup is disabled') || m.includes('signups not allowed')) {
    return 'El registro está deshabilitado en Supabase. Actívalo en Authentication → Providers → Email.';
  }
  return msg || 'Error al registrar la cuenta';
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nombre_completo: nombre.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('No se pudo crear el usuario. Revisa Auth en Supabase.');
      }

      // Perfil: no bloquea el registro si falla (RLS / sin sesión / backend)
      await usuarioService.crearUsuario({
        id: data.user.id,
        nombreCompleto: nombre.trim(),
        correo: email.trim(),
        monedaPreferida: 'USD',
      });

      if (!data.session) {
        setSuccessMsg(
          'Cuenta creada. Si Confirm email está activo, revisa tu correo y luego inicia sesión.'
        );
      } else {
        setSuccessMsg('¡Cuenta creada con éxito! Redirigiendo al login...');
        setTimeout(() => onSwitchToLogin(), 1200);
      }
    } catch (err: any) {
      console.error('Registro:', err);
      setError(traducirErrorAuth(err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-neutral-800 text-white">
      <div className="max-w-md w-full bg-[#121212] border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif italic tracking-wide text-white">Arca</h1>
          <p className="text-sm text-neutral-400">Crea tu cuenta financiera</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-3 rounded-xl text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre completo</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4d4c8] hover:bg-[#c5c5b8] text-[#1a1a1a] font-semibold text-sm py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Crear cuenta
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#d4d4c8] hover:underline font-medium"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
};