export default class ProductoQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  lista(dtoProducto, pag = {}) { return this.adaptadorBDSalida.lista(dtoProducto.buscar, dtoProducto.sucursalId, pag); }
  buscarPorId(id) { return id ? this.adaptadorBDSalida.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
  buscarPorModeloColorGrupo(modelo, color, grupo) {
    return modelo && grupo
      ? this.adaptadorBDSalida.buscarPorModeloColorGrupo(modelo, color, grupo)
      : Promise.resolve({ estado: 'error', resultado: null });
  }
}
