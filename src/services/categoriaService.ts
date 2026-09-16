import { Categoria } from '../types/categoria';
import { supabase } from './supabaseClient';


export const categoriaService = {
  async getCategorias(usuarioId: string): Promise<Categoria[]> {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('usuario_id', usuarioId);

    if (error) throw error;
    return data || [];
  },

  async crearCategoria(categoria: Omit<Categoria, 'id'>): Promise<Categoria> {
    const { data, error } = await supabase
      .from('categorias')
      .insert([categoria])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};