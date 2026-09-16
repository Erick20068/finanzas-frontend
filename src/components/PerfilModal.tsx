import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { usuarioService } from '../services/usuarioService';

interface Props {
  userId: string;
  nombreActual: string;
  emailActual: string;
  onClose: () => void;
  onUpdated: (nombre: string) => void;
}

export const PerfilModal: React.FC<Props> = ({ userId, nombreActual, emailActual, onClose, onUpdated }) => {
  const [nombre, setNombre] = useState(nombreActual);
  const [email, setEmail] = useState(emailActual);
  const [monedaPreferida, setMonedaPreferida] = useState('USD');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    // El PUT del backend sobreescribe los 3 campos a la vez,
    // así que necesitamos la moneda actual para no perderla.
    usuarioService.obtenerUsuario(userId)
      .then((data) => {
        if (data?.monedaPreferida) setMonedaPreferida(data.monedaPreferida);
      })
      .catch((err) => console.error('No se pudo leer el perfil actual:', err));
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAviso('');

    if (!nombre.trim()) { setError('El nombre no puede estar vacío.'); return; }
    if (nuevaPassword && nuevaPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (nuevaPassword && nuevaPassword !== confirmarPassword) { setError('Las contraseñas no coinciden.'); return; }

    try {
      setLoading(true);

      // 1. Nombre y correo del perfil -> backend Java (UsuarioControlador)
      if (nombre.trim() !== nombreActual || email.trim() !== emailActual) {
        await usuarioService.actualizarUsuario(userId, {
          nombreCompleto: nombre.trim(),
          correo: email.trim(),
          monedaPreferida,
        });
      }

      // 2. Correo -> auth (requiere confirmación por email en Supabase)
      if (email.trim() && email.trim() !== emailActual) {
        const { error: errEmail } = await supabase.auth.updateUser({ email: email.trim() });
        if (errEmail) throw errEmail;
        setAviso('Te enviamos un correo de confirmación para validar el nuevo email.');
      }

      // 3. Contraseña
      if (nuevaPassword) {
        const { error: errPass } = await supabase.auth.updateUser({ password: nuevaPassword });
        if (errPass) throw errPass;
      }

      onUpdated(nombre.trim());
      if (!aviso) onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161616] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <h2 className="text-lg font-serif text-white">Editar cuenta</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Actualiza tu nombre, correo o contraseña.</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          <div>
            <label className="text-[11px] text-neutral-500 mb-1 block">Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Erick Guaillas"
              className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="text-[11px] text-neutral-500 mb-1 block">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600"
            />
            <p className="text-[10px] text-neutral-600 mt-1">Si lo cambias, tendrás que confirmarlo desde tu correo.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Nueva contraseña</label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Opcional"
                className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Confirmar</label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Opcional"
                className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">{error}</div>
          )}
          {aviso && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl">{aviso}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4d4c8] hover:bg-[#c5c5b8] text-[#1a1a1a] font-semibold text-sm py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />} Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
};

export default PerfilModal;