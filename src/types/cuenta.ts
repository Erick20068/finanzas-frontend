export interface Cuenta {
  id: number;
  usuario_id: string;
  nombre: string;
  tipo_cuenta: string;
  saldo_inicial: number;
  saldo_actual: number;
  color_hex?: string;
  fecha_creacion?: string;
}