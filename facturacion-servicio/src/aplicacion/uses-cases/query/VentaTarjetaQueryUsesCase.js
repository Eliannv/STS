export default class VentaTarjetaQueryUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  listarVentasTarjeta(filtros) { return this.adaptador.listarVentasTarjeta(filtros); }
  obtenerVentaTarjeta(id) { return id ? this.adaptador.obtenerVentaTarjeta(id) : Promise.resolve({ estado: 'error', resultado: 'id es requerido' }); }
  historialAbonos(id) { return id ? this.adaptador.historialAbonos(id) : Promise.resolve({ estado: 'error', resultado: 'ventaTarjetaId es requerido' }); }
  resumenVentasTarjeta() { return this.adaptador.resumenVentasTarjeta(); }
}
