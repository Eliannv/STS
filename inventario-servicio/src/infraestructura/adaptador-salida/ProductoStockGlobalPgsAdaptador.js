import ExistenciaStockSalidaPuerto from '../../aplicacion/puertos/salida/ExistenciaStockSalidaPuerto.js';
import { Producto } from '../modelos/Modelos.js';
import sequelize from '../base-dato/Postgresql.js';

export default class ProductoStockGlobalPgsAdaptador extends ExistenciaStockSalidaPuerto {
  bloquear(productoId, sucursalId, transaction) {
    return Producto.findOne({ where: { id: productoId }, transaction, lock: transaction.LOCK.UPDATE });
  }

  async actualizar(producto, valores, transaction) {
    await sequelize.query("SELECT set_config('app.movimiento_stock_autorizado', 'true', true)", { transaction });
    const actualizado = await producto.update({ stock: valores.stock, costo: valores.costoPromedio, updated_at: new Date() }, { transaction });
    await sequelize.query("SELECT set_config('app.movimiento_stock_autorizado', 'false', true)", { transaction });
    return actualizado;
  }
}
