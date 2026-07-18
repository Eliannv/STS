export default class ClienteQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  lista(buscar, pag = {}) {
    return this.adaptadorBDSalida.lista(buscar, pag);
  }

  buscarPorId(id) {
    return id
      ? this.adaptadorBDSalida.buscarPorId(id)
      : Promise.resolve({ estado: 'error', resultado: null });
  }
}
