/** Categorías fijas de la app (no cambian por usuario). */
export const CATEGORIAS_FIJAS = [
  { nombre: 'Salario', tipo_categoria: 'INGRESO', icono: 'briefcase', color_hex: '#7a9e72' },
  { nombre: 'Freelance', tipo_categoria: 'INGRESO', icono: 'laptop', color_hex: '#8fbc8f' },
  { nombre: 'Inversiones', tipo_categoria: 'INGRESO', icono: 'trending-up', color_hex: '#a8c5a0' },
  { nombre: 'Otros ingresos', tipo_categoria: 'INGRESO', icono: 'plus-circle', color_hex: '#b8d4b0' },
  { nombre: 'Alimentación', tipo_categoria: 'GASTO', icono: 'utensils', color_hex: '#c9a0a0' },
  { nombre: 'Transporte', tipo_categoria: 'GASTO', icono: 'car', color_hex: '#c4a574' },
  { nombre: 'Vivienda', tipo_categoria: 'GASTO', icono: 'home', color_hex: '#a090c0' },
  { nombre: 'Servicios', tipo_categoria: 'GASTO', icono: 'zap', color_hex: '#90b0c0' },
  { nombre: 'Salud', tipo_categoria: 'GASTO', icono: 'heart', color_hex: '#d08080' },
  { nombre: 'Educación', tipo_categoria: 'GASTO', icono: 'book', color_hex: '#8090c0' },
  { nombre: 'Ocio', tipo_categoria: 'GASTO', icono: 'smile', color_hex: '#c0a080' },
  { nombre: 'Compras', tipo_categoria: 'GASTO', icono: 'shopping-bag', color_hex: '#c090b0' },
  { nombre: 'Suscripciones', tipo_categoria: 'GASTO', icono: 'repeat', color_hex: '#90a0b0' },
  { nombre: 'Otros gastos', tipo_categoria: 'GASTO', icono: 'more-horizontal', color_hex: '#a0a0a0' },
] as const;
