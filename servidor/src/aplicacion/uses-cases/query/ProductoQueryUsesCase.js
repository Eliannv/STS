// src/aplicacion/uses-cases/query/ProductoQueryUsesCase.js
export default class ProductoQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  async lista(dtoProducto) {
    return await this.adaptadorBDSalida.lista(
      dtoProducto.getBuscar(),
      dtoProducto.getSucursalId()
    );
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: null };
    return await this.adaptadorBDSalida.buscarPorId(id);
  }

  async buscarPorModeloColorGrupo(modelo, color, grupo) {
    if (!modelo || !grupo) return { estado: 'error', resultado: null };
    return await this.adaptadorBDSalida.buscarPorModeloColorGrupo(modelo, color, grupo);
  }
}
