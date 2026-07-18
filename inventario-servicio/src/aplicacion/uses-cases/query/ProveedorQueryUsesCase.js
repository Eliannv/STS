export default class ProveedorQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  lista(dtoProveedor, pag = {}) { return this.adaptadorBDSalida.lista(dtoProveedor.buscar, pag); }
  buscarPorId(id) { return id ? this.adaptadorBDSalida.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
}
