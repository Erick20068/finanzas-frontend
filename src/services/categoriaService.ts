import { supabase } from './supabaseClient';
import { Categoria } from '../types/categoria';
import { CATEGORIAS_FIJAS } from '../constants/categoriasFijas';

async function asegurarCategoriasFijas(usuarioId: string): Promise<void> {
  const { data: existentes, error } = await supabase
    .from('categorias')
    .select('id, nombre')
    .eq('usuario_id', usuarioId);

  if (error) {
    console.warn('[categoriaService] leer:', error.message);
    return;
  }

  const nombres = new Set((existentes || []).map((c) => (c.nombre || '').trim().toLowerCase()));
  const faltantes = CATEGORIAS_FIJAS.filter(
    (c) => !nombres.has(c.nombre.trim().toLowerCase())
  ).map((c) => ({
    usuario_id: usuarioId,
    nombre: c.nombre,
    tipo_categoria: c.tipo_categoria,
    icono: c.icono,
    color_hex: c.color_hex,
  }));

  if (faltantes.length === 0) return;

  const { error: insertError } = await supabase.from('categorias').insert(faltantes);
  if (insertError) {
    console.warn('[categoriaService] insert fijas:', insertError.message);
  }
}

export const categoriaService = {
  async getCategorias(usuarioId: string): Promise<Categoria[]> {
    await asegurarCategoriasFijas(usuarioId);

    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('nombre', { ascending: true });

    if (error) {
      console.warn('[categoriaService] select:', error.message);
      return [];
    }

    // Normalizar tipo a mayúsculas para filtros del UI
    return (data || []).map((c) => ({
      ...c,
      tipo_categoria: (c.tipo_categoria || '').toUpperCase(),
    }));
  },

  async crearCategoria(categoria: Omit<Categoria, 'id'>): Promise<Categoria> {
    const { data, error } = await supabase
      .from('categorias')
      .insert([categoria])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
