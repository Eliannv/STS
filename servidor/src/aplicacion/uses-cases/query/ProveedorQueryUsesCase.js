// src/aplicacion/uses-cases/query/ProveedorQueryUsesCase.js
export default class ProveedorQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  async lista(dtoProveedor) {
    return await this.adaptadorBDSalida.lista(dtoProveedor.getBuscar());
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: null };
    return await this.adaptadorBDSalida.buscarPorId(id);
  }
}
