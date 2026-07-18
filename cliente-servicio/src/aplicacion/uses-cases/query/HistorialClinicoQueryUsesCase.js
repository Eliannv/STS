export default class HistorialClinicoQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  listaPorCliente(clienteId) {
    return clienteId
      ? this.adaptadorBDSalida.listaPorCliente(clienteId)
      : Promise.resolve({ estado: 'error', resultado: [] });
  }

  buscarPorId(id) {
    return id
      ? this.adaptadorBDSalida.buscarPorId(id)
      : Promise.resolve({ estado: 'error', resultado: null });
  }
}
