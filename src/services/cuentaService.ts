import { supabase } from './supabaseClient';
import { Cuenta } from '../types/cuenta';

export const cuentaService = {
  async getCuentas(usuarioId: string): Promise<Cuenta[]> {
    const { data, error } = await supabase
      .from('cuentas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async crearCuenta(cuenta: Omit<Cuenta, 'id' | 'fecha_creacion'>): Promise<Cuenta> {
    const { data, error } = await supabase
      .from('cuentas')
      .insert([cuenta])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};