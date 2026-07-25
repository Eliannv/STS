// inventario-servicio/src/infraestructura/adaptador-salida/ProductoStockPorSucursalPgsAdaptador.js
import { QueryTypes } from 'sequelize';
import ExistenciaStockSalidaPuerto from '../../aplicacion/puertos/salida/ExistenciaStockSalidaPuerto.js';
import { Producto } from '../modelos/Modelos.js';
import sequelize from '../base-dato/Postgresql.js';

// Columnas del producto que el ledger necesita para describir el movimiento.
const CAMPOS_PRODUCTO = 'p.id, p.nombre, p.codigo, p.grupo, p.pvp1, p.tipo_control_stock, p.activo';

export default class ProductoStockPorSucursalPgsAdaptador extends ExistenciaStockSalidaPuerto {
  async findStockByProductoId(productoId, options = {}) {
    const sucursalId = options.sucursalId ?? null;

    // Sin sucursal se devuelve el consolidado: productos.stock es la suma de existencias.
    if (!sucursalId) {
      const producto = await Producto.findByPk(productoId, { transaction: options.transaction });
      return producto?.get({ plain: true }) ?? null;
    }

    const [fila] = await sequelize.query(
      `SELECT ${CAMPOS_PRODUCTO},
              COALESCE(e.stock, 0) AS stock,
              COALESCE(e.costo_promedio, p.costo, 0) AS costo,
              e.id AS existencia_id
       FROM productos p
       LEFT JOIN existencias e ON e.producto_id = p.id AND e.sucursal_id = :sucursalId
       WHERE p.id = :productoId`,
      { replacements: { productoId, sucursalId }, transaction: options.transaction, type: QueryTypes.SELECT },
    );
    return fila ?? null;
  }

  lockProductoForUpdate(productoId, transaction) {
    return Producto.findOne({ where: { id: productoId }, transaction, lock: transaction.LOCK.UPDATE });
  }

  // Bloquea la existencia del producto EN ESA SUCURSAL. Devuelve un objeto con la
  // forma que espera el ledger, pero con stock y costo propios de la sucursal.
  async bloquear(productoId, sucursalId, transaction) {
    if (!sucursalId) {
      throw new Error('No se puede mover stock sin una sucursal asignada');
    }

    // Un producto que nunca se movió en esta sucursal arranca en cero heredando el costo.
    await sequelize.query(
      `INSERT INTO existencias (producto_id, sucursal_id, stock, costo_promedio)
       SELECT p.id, :sucursalId, 0, COALESCE(p.costo, 0) FROM productos p WHERE p.id = :productoId
       ON CONFLICT (producto_id, sucursal_id) DO NOTHING`,
      { replacements: { productoId, sucursalId }, transaction },
    );

    const [fila] = await sequelize.query(
      `SELECT ${CAMPOS_PRODUCTO},
              e.id AS existencia_id, e.sucursal_id, e.stock, e.costo_promedio AS costo
       FROM existencias e
       JOIN productos p ON p.id = e.producto_id
       WHERE e.producto_id = :productoId AND e.sucursal_id = :sucursalId
       FOR UPDATE OF e`,
      { replacements: { productoId, sucursalId }, transaction, type: QueryTypes.SELECT },
    );
    return fila ?? null;
  }

  async actualizar(existencia, valores, transaction) {
    // productos.stock y productos.costo se recalculan solos por trigger a partir
    // de existencias; aquí solo se toca la fila de la sucursal.
    await sequelize.query("SELECT set_config('app.movimiento_stock_autorizado', 'true', true)", { transaction });
    await sequelize.query(
      'UPDATE existencias SET stock = :stock, costo_promedio = :costo, updated_at = NOW() WHERE id = :id',
      {
        replacements: { stock: valores.stock, costo: valores.costoPromedio, id: existencia.existencia_id },
        transaction,
      },
    );
    await sequelize.query("SELECT set_config('app.movimiento_stock_autorizado', 'false', true)", { transaction });

    return { ...existencia, stock: valores.stock, costo: valores.costoPromedio };
  }

  // Existencias de un producto en todas las sucursales: alimenta la vista de stock
  // distribuido y la validación previa a una transferencia.
  porProducto(productoId) {
    return sequelize.query(
      `SELECT sucursal_id, stock, costo_promedio, stock_minimo
       FROM existencias WHERE producto_id = :productoId ORDER BY sucursal_id`,
      { replacements: { productoId }, type: QueryTypes.SELECT },
    );
  }
}
