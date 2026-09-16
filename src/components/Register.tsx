import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { usuarioService } from '../services/usuarioService';
import { Loader2 } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
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

    try {
      // 1. Registrar en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      if (data.user) {
        // 2. Crear el perfil complementario a través del backend Java
        try {
          await usuarioService.crearUsuario({
            id: data.user.id,
            nombreCompleto: nombre,
            correo: email,
            monedaPreferida: 'USD',
          });
        } catch (perfilErr: any) {
          console.error('Error al crear el perfil en el backend:', perfilErr);
          setError(
            'Tu cuenta de acceso se creó, pero no se pudo guardar tu perfil en el servidor: ' +
            (perfilErr?.response?.data?.message || perfilErr?.message || 'error desconocido del backend') +
            '. Avisa al soporte con este mensaje.'
          );
          setLoading(false);
          return;
        }
      }

      setSuccessMsg('¡Cuenta creada con éxito! Redirigiendo...');
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta');
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
              placeholder="Erick Guaillas"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black hover:bg-neutral-200 font-medium py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Registrarse
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-neutral-500">
            ¿Ya tienes una cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-white font-medium hover:underline focus:outline-none"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};