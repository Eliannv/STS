// inventario-servicio/src/aplicacion/puertos/salida/ExistenciaStockSalidaPuerto.js
export default class ExistenciaStockSalidaPuerto {
  findStockByProductoId(productoId, options) { throw new Error('findStockByProductoId no implementado'); }
  lockProductoForUpdate(productoId, transaction) { throw new Error('lockProductoForUpdate no implementado'); }
  bloquear(productoId, sucursalId, transaction) { throw new Error('bloquear no implementado'); }
  actualizar(existencia, valores, transaction) { throw new Error('actualizar no implementado'); }
}
