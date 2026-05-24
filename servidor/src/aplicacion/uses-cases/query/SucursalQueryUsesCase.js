// src/aplicacion/uses-cases/query/SucursalQueryUsesCase.js
export default class SucursalQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  async lista() {
    return await this.adaptadorBDSalida.lista();
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: null };
    return await this.adaptadorBDSalida.buscarPorId(id);
  }
}
