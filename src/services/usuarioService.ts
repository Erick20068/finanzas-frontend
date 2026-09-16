import api from './api';
import { supabase } from './supabaseClient';

export interface UsuarioPayload {
  id: string;
  nombreCompleto: string;
  correo: string;
  monedaPreferida?: string;
}

function toDbRow(usuario: UsuarioPayload) {
  return {
    id: usuario.id,
    nombre_completo: usuario.nombreCompleto,
    correo: usuario.correo,
    moneda_preferida: usuario.monedaPreferida || 'USD',
  };
}

export const usuarioService = {
  async obtenerUsuario(id: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          nombreCompleto: data.nombre_completo,
          correo: data.correo,
          monedaPreferida: data.moneda_preferida,
          fechaRegistro: data.fecha_registro,
        };
      }
    } catch {
      /* ignore */
    }

    try {
      const { data } = await api.get(`/usuarios/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Perfil SOLO en Supabase (sin backend).
   */
  async crearUsuario(usuario: UsuarioPayload) {
    const row = toDbRow(usuario);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.info(
        '[usuarioService] Sin sesión tras registro. El perfil lo crea el trigger de Supabase.'
      );
      return row;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[usuarioService] upsert usuarios:', error.message);
      return row;
    }

    return data || row;
  },

  async actualizarUsuario(id: string, usuario: Omit<UsuarioPayload, 'id'>) {
    const row = {
      nombre_completo: usuario.nombreCompleto,
      correo: usuario.correo,
      moneda_preferida: usuario.monedaPreferida || 'USD',
    };

    const { data, error } = await supabase
      .from('usuarios')
      .update(row)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[usuarioService] update usuarios:', error.message);
      throw error;
    }

    return data;
  },

  async asegurarPerfil(user: {
    id: string;
    email?: string | null;
    user_metadata?: { nombre_completo?: string };
  }) {
    const existente = await this.obtenerUsuario(user.id);
    if (existente) return existente;

    return this.crearUsuario({
      id: user.id,
      nombreCompleto:
        user.user_metadata?.nombre_completo ||
        (user.email ? user.email.split('@')[0] : 'Usuario'),
      correo: user.email || '',
      monedaPreferida: 'USD',
    });
  },
};

export default usuarioService;