// src/aplicacion/puertos/entrada/VentaTarjetaEntradaPuerto.js
/**
 * Puerto de entrada para Ventas con Tarjeta
 * Define contrato que debe implementar el Controlador
 */
export default class VentaTarjetaEntradaPuerto {
  async listarVentasTarjeta(req, res) {
    throw new Error('listarVentasTarjeta() debe ser implementado');
  }

  async obtenerVentaTarjeta(req, res) {
    throw new Error('obtenerVentaTarjeta() debe ser implementado');
  }

  async registrarAbono(req, res) {
    throw new Error('registrarAbono() debe ser implementado');
  }

  async obtenerHistorialAbonos(req, res) {
    throw new Error('obtenerHistorialAbonos() debe ser implementado');
  }

  async resumenVentasTarjeta(req, res) {
    throw new Error('resumenVentasTarjeta() debe ser implementado');
  }
}
