// src/aplicacion/uses-cases/query/ClienteQueryUsesCase.js
export default class ClienteQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  async lista(buscar) {
    return await this.adaptadorBDSalida.lista(buscar);
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: null };
    return await this.adaptadorBDSalida.buscarPorId(id);
  }
}
