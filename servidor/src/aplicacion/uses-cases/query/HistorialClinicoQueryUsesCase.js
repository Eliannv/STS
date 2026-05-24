// src/aplicacion/uses-cases/query/HistorialClinicoQueryUsesCase.js
export default class HistorialClinicoQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  async listaPorCliente(clienteId) {
    if (!clienteId) return { estado: 'error', resultado: [] };
    return await this.adaptadorBDSalida.listaPorCliente(clienteId);
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: null };
    return await this.adaptadorBDSalida.buscarPorId(id);
  }
}
