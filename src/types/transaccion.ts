export interface Transaccion {
  id: number;
  usuario_id: string;
  cuenta_origen_id: number;
  cuenta_destino_id?: number;
  categoria_id?: number;
  tipo_transaccion: 'INGRESO' | 'GASTO' | 'TRANSFERENCIA';
  monto: number;
  descripcion?: string;
  fecha_movimiento: string;
  comprobante_url?: string;
  fecha_registro?: string;
  cuentas?: { nombre: string };
  categorias?: { nombre: string; icono?: string; color_hex?: string };
}