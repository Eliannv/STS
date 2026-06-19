// src/aplicacion/puertos/entrada/CobroDeudaEntradaPuerto.js
/**
 * Puerto de entrada para Cobro de Deuda
 * Define contrato que debe implementar el Controlador
 */
export default class CobroDeudaEntradaPuerto {
  async registrarAbono(req, res) {
    throw new Error('registrarAbono() debe ser implementado');
  }

  async facturasPendientes(req, res) {
    throw new Error('facturasPendientes() debe ser implementado');
  }

  async abonosPorFactura(req, res) {
    throw new Error('abonosPorFactura() debe ser implementado');
  }

  async obtenerAbono(req, res) {
    throw new Error('obtenerAbono() debe ser implementado');
  }

  async resumenDeuda(req, res) {
    throw new Error('resumenDeuda() debe ser implementado');
  }

  async listaAbonos(req, res) {
    throw new Error('listaAbonos() debe ser implementado');
  }
}
