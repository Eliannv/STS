// src/aplicacion/puertos/salida/CobroDeudaQuerySalidaPuerto.js
/**
 * Puerto de salida (Query) para Cobro de Deuda
 * Define contrato para operaciones de lectura en BD
 */
export default class CobroDeudaQuerySalidaPuerto {
  async facturasPendientes(clienteId, filtros) {
    throw new Error('facturasPendientes() debe ser implementado');
  }

  async abonosPorFactura(facturaId) {
    throw new Error('abonosPorFactura() debe ser implementado');
  }

  async abonoPorId(id) {
    throw new Error('abonoPorId() debe ser implementado');
  }

  async resumenClienteDeuda(clienteId) {
    throw new Error('resumenClienteDeuda() debe ser implementado');
  }

  async listaAbonos(filtros) {
    throw new Error('listaAbonos() debe ser implementado');
  }
}
