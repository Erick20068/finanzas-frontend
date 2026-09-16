import { supabase } from './supabaseClient';
import { Transaccion } from '../types/transaccion';

export const transaccionService = {
  async getTransacciones(usuarioId: string): Promise<Transaccion[]> {
    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        *,
        cuentas!transacciones_cuenta_origen_id_fkey(nombre),
        categorias(nombre, icono, color_hex)
      `)
      .eq('usuario_id', usuarioId)
      .order('fecha_movimiento', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async crearTransaccion(transaccion: Omit<Transaccion, 'id' | 'fecha_registro' | 'cuentas' | 'categorias'>): Promise<Transaccion> {
    const { data, error } = await supabase
      .from('transacciones')
      .insert([transaccion])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};