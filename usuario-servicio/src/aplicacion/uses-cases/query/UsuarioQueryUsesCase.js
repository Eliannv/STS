export default class UsuarioQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  async lista(buscar, pag = {}) {
    return this.adaptadorBDSalida.lista(buscar, pag);
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: null };
    return this.adaptadorBDSalida.buscarPorId(id);
  }
}
