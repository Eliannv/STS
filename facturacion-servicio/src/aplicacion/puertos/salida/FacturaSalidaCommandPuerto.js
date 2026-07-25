// facturacion-servicio/src/aplicacion/puertos/salida/FacturaSalidaCommandPuerto.js
export default class FacturaSalidaCommandPuerto {
  guardar(factura) { throw new Error('guardar no implementado'); }
  actualizar(factura) { throw new Error('actualizar no implementado'); }
  cobrar(id) { throw new Error('cobrar no implementado'); }
  anular(id, estadoInventario, operacionFinanciera) { throw new Error('anular no implementado'); }
  eliminar(id) { throw new Error('eliminar no implementado'); }
  actualizarEstadoInventario(id, estado) { throw new Error('actualizarEstadoInventario no implementado'); }
}
