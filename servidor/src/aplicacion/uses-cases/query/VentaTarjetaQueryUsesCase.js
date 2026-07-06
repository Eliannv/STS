// src/aplicacion/uses-cases/query/VentaTarjetaQueryUsesCase.js
/**
 * Use Case de Consulta para Ventas con Tarjeta
 * Obtiene información de ventas tarjeta y abonos
 */
export default class VentaTarjetaQueryUsesCase {
  constructor(ventaTarjetaQueryAdaptador) {
    this._adaptador = ventaTarjetaQueryAdaptador;
  }

  async listarVentasTarjeta(filtros = {}) {
    return this._adaptador.listarVentasTarjeta(filtros);
  }

  async obtenerVentaTarjeta(id) {
    if (!id)
      return { estado: 'error', resultado: 'id es requerido' };
    return this._adaptador.obtenerVentaTarjeta(id);
  }

  async historialAbonos(ventaTarjetaId) {
    if (!ventaTarjetaId)
      return { estado: 'error', resultado: 'ventaTarjetaId es requerido' };
    return this._adaptador.historialAbonos(ventaTarjetaId);
  }

  async resumenVentasTarjeta() {
    return this._adaptador.resumenVentasTarjeta();
  }
}
