// src/aplicacion/uses-cases/query/FacturaQueryUsesCase.js
export default class FacturaQueryUsesCase {
  constructor(ventaQueryAdaptador) {
    this._adaptador = ventaQueryAdaptador;
  }

  async listaPorCliente(clienteId) {
    if (!clienteId) return { estado: 'error', resultado: 'clienteId requerido' };
    return this._adaptador.listaPorCliente(clienteId);
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: 'id requerido' };
    return this._adaptador.buscarPorId(id);
  }

  async resumenPorCliente(clienteId) {
    if (!clienteId) return { estado: 'error', resultado: 'clienteId requerido' };
    return this._adaptador.resumenPorCliente(clienteId);
  }

  async listaGeneral(filtros = {}) {
    return this._adaptador.listaGeneral(filtros);
  }
}
