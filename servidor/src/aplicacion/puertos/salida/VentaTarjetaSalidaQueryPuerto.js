// src/aplicacion/puertos/salida/VentaTarjetaSalidaQueryPuerto.js
/**
 * Puerto de salida (Query) para Ventas con Tarjeta
 * Define contrato para operaciones de lectura en BD
 */
export default class VentaTarjetaSalidaQueryPuerto {
  async listarVentasTarjeta(filtros) {
    throw new Error('listarVentasTarjeta() debe ser implementado');
  }

  async obtenerVentaTarjeta(id) {
    throw new Error('obtenerVentaTarjeta() debe ser implementado');
  }

  async historialAbonos(ventaTarjetaId) {
    throw new Error('historialAbonos() debe ser implementado');
  }

  async resumenVentasTarjeta() {
    throw new Error('resumenVentasTarjeta() debe ser implementado');
  }
}
