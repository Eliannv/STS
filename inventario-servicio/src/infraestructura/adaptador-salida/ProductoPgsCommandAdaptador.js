import ProductoSalidaCommandPuerto from '../../aplicacion/puertos/salida/ProductoSalidaCommandPuerto.js';
import { Producto as ProductoModel } from '../modelos/Modelos.js';
import sequelize from '../base-dato/Postgresql.js';

const aPersistencia = (producto, incluirInventario = true) => ({
  id_interno: producto.idInterno,
  codigo: producto.codigo,
  nombre: producto.nombre,
  modelo: producto.modelo,
  color: producto.color,
  grupo: producto.grupo,
  ...(incluirInventario ? { stock: producto.stock ?? 0, costo: producto.costo ?? 0 } : {}),
  tipo_control_stock: producto.tipoControlStock,
  pvp1: producto.pvp1,
  iva: producto.iva,
  precio_con_iva: producto.precioConIva,
  proveedor_id: producto.proveedorId,
  ingreso_id: producto.ingresoId,
  observacion: producto.observacion,
  activo: producto.activo,
  updated_at: new Date()
});

export default class ProductoPgsCommandAdaptador extends ProductoSalidaCommandPuerto {
  constructor(movimientoStockServicio) {
    super();
    this.movimientoStockServicio = movimientoStockServicio;
  }

  async guardar(producto) {
    const transaction = await sequelize.transaction();
    try {
      const stockInicial = Number(producto.stock || 0);
      const creado = await ProductoModel.create({ ...aPersistencia(producto), stock: 0, costo: stockInicial > 0 ? 0 : producto.costo, created_at: new Date() }, { transaction });
      if (stockInicial > 0) {
        const movimiento = await this.movimientoStockServicio.aplicar({
          naturaleza: 'ENTRADA',
          tipoMovimiento: 'INVENTARIO_INICIAL',
          origen: 'INVENTARIO',
          items: [{ productoId: creado.id, cantidad: stockInicial, costoUnitario: producto.costo, precioVenta: producto.pvp1 }],
          referenciaId: creado.id,
          referenciaTipo: 'PRODUCTO',
          referenciaCodigo: creado.codigo,
          usuarioId: producto.usuarioId,
          usuarioNombre: producto.usuarioNombre,
          sucursalId: producto.sucursalId,
          sucursalNombre: producto.sucursalNombre,
          operacionId: producto.operacionId || `PRODUCTO-${creado.id}-INICIAL`,
          idempotencyKey: producto.idempotencyKey || `PRODUCTO-${creado.id}-INICIAL`,
          motivo: producto.motivo || 'Registro de inventario inicial',
          traceId: producto.traceId,
        }, { transaction });
        if (movimiento.estado !== 'ok') throw new Error(movimiento.resultado);
        await creado.reload({ transaction });
      }
      await transaction.commit();
      return { estado: 'ok', resultado: creado };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizar(producto) {
    const transaction = await sequelize.transaction();
    try {
      const existente = await ProductoModel.findByPk(producto.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!existente) throw new Error('Producto no encontrado');
      const stockAnterior = Number(existente.stock || 0);
      const costoAnterior = Number(existente.costo || 0);
      const stockSolicitado = producto.stock == null ? stockAnterior : Number(producto.stock);
      const costoSolicitado = producto.costo == null ? costoAnterior : Number(producto.costo);

      await existente.update(aPersistencia(producto, false), { transaction });

      if (stockSolicitado !== stockAnterior) {
        const diferencia = stockSolicitado - stockAnterior;
        const movimiento = await this.movimientoStockServicio.aplicar({
          naturaleza: diferencia > 0 ? 'ENTRADA' : 'SALIDA',
          tipoMovimiento: 'AJUSTE',
          origen: 'INVENTARIO',
          items: [{ productoId: existente.id, cantidad: Math.abs(diferencia), costoUnitario: costoAnterior, precioVenta: producto.pvp1 }],
          referenciaId: existente.id,
          referenciaTipo: 'PRODUCTO',
          referenciaCodigo: producto.codigo || existente.codigo,
          usuarioId: producto.usuarioId,
          usuarioNombre: producto.usuarioNombre,
          sucursalId: producto.sucursalId,
          sucursalNombre: producto.sucursalNombre,
          operacionId: producto.operacionId,
          idempotencyKey: `${producto.idempotencyKey}:STOCK`,
          motivo: producto.motivo || 'Corrección manual de stock',
          observacion: producto.observacion,
          traceId: producto.traceId,
        }, { transaction });
        if (movimiento.estado !== 'ok') throw new Error(movimiento.resultado);
      }

      if (costoSolicitado !== costoAnterior) {
        const movimiento = await this.movimientoStockServicio.aplicar({
          naturaleza: 'NEUTRO',
          tipoMovimiento: 'REVALORIZACION',
          origen: 'INVENTARIO',
          items: [{ productoId: existente.id, cantidad: Math.max(stockAnterior, 1), costoUnitario: costoSolicitado, precioVenta: producto.pvp1 }],
          referenciaId: existente.id,
          referenciaTipo: 'PRODUCTO',
          referenciaCodigo: producto.codigo || existente.codigo,
          usuarioId: producto.usuarioId,
          usuarioNombre: producto.usuarioNombre,
          sucursalId: producto.sucursalId,
          sucursalNombre: producto.sucursalNombre,
          operacionId: producto.operacionId,
          idempotencyKey: `${producto.idempotencyKey}:COSTO`,
          motivo: producto.motivo || 'Cambio del costo promedio',
          observacion: producto.observacion,
          traceId: producto.traceId,
        }, { transaction });
        if (movimiento.estado !== 'ok') throw new Error(movimiento.resultado);
      }

      await transaction.commit();
      return { estado: 'ok', resultado: 'Producto actualizado correctamente' };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async eliminar(id) {
    const [cantidad] = await ProductoModel.update({ activo: false, updated_at: new Date() }, { where: { id } });
    return cantidad ? { estado: 'ok', resultado: 'Producto desactivado correctamente' } : { estado: 'error', resultado: 'Producto no encontrado' };
  }

  async reducirStock(items, contexto = {}) {
    return this.movimientoStockServicio.aplicar({
      naturaleza: 'SALIDA',
      tipoMovimiento: 'VENTA',
      origen: 'FACTURACION',
      items,
      referenciaId: contexto.referenciaId,
      referenciaTipo: 'FACTURA',
      referenciaCodigo: contexto.referenciaCodigo,
      usuarioId: contexto.usuarioId,
      usuarioNombre: contexto.usuarioNombre,
      sucursalId: contexto.sucursalId,
      operacionId: contexto.operacionId,
      idempotencyKey: contexto.idempotencyKey,
      motivo: 'Compatibilidad con descuento de stock anterior',
      traceId: contexto.traceId,
    });
  }
}
