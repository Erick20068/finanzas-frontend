import api from './api';

export interface UsuarioPayload {
  id: string;
  nombreCompleto: string;
  correo: string;
  monedaPreferida?: string;
}

export const usuarioService = {
  async obtenerUsuario(id: string) {
    const { data } = await api.get(`/usuarios/${id}`);
    return data;
  },

  async crearUsuario(usuario: UsuarioPayload) {
    const { data } = await api.post('/usuarios', usuario);
    return data;
  },

  async actualizarUsuario(id: string, usuario: Omit<UsuarioPayload, 'id'>) {
    const { data } = await api.put(`/usuarios/${id}`, usuario);
    return data;
  },
};

export default usuarioService;