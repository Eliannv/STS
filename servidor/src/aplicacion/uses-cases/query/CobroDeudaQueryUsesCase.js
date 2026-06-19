// src/aplicacion/uses-cases/query/CobroDeudaQueryUsesCase.js
/**
 * Use Case de Consulta para Cobro de Deuda
 * Obtiene información de facturas pendientes y abonos
 */
export default class CobroDeudaQueryUsesCase {
  constructor(cobroDeudaQueryAdaptador) {
    this._adaptador = cobroDeudaQueryAdaptador;
  }

  async facturasPendientes(clienteId = null, filtros = {}) {
    return this._adaptador.facturasPendientes(clienteId, filtros);
  }

  async abonosPorFactura(facturaId) {
    if (!facturaId)
      return { estado: 'error', resultado: 'facturaId es requerido' };
    return this._adaptador.abonosPorFactura(facturaId);
  }

  async abonoPorId(id) {
    if (!id)
      return { estado: 'error', resultado: 'id es requerido' };
    return this._adaptador.abonoPorId(id);
  }

  async resumenClienteDeuda(clienteId) {
    if (!clienteId)
      return { estado: 'error', resultado: 'clienteId es requerido' };
    return this._adaptador.resumenClienteDeuda(clienteId);
  }

  async listaAbonos(filtros = {}) {
    return this._adaptador.listaAbonos(filtros);
  }

  async deudasPaginadas(offset = 0, limite = 5) {
    return this._adaptador.deudasPaginadas(offset, limite);
  }
}
