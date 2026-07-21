import sequelize from '../base-dato/Postgresql.js';
import MovimientoStockSalidaCommandPuerto from '../../aplicacion/puertos/salida/MovimientoStockSalidaCommandPuerto.js';
import { MovimientoStock } from '../modelos/Modelos.js';

const numero = (valor) => Number(valor || 0);

const tipoLegacy = (tipoMovimiento, naturaleza) => {
  if (tipoMovimiento === 'VENTA') return 'VENTA';
  if (tipoMovimiento === 'COMPRA' || tipoMovimiento === 'INVENTARIO_INICIAL') return 'INGRESO';
  if (tipoMovimiento === 'ANULACION_VENTA' || tipoMovimiento === 'ANULACION_EGRESO') return 'ANULACION';
  if (tipoMovimiento === 'ANULACION_COMPRA') return 'ELIMINACION';
  if (['EGRESO', 'DEVOLUCION_PROVEEDOR', 'TRANSFERENCIA_SALIDA'].includes(tipoMovimiento)) return 'SALIDA';
  if (tipoMovimiento === 'TRANSFERENCIA_ENTRADA' || tipoMovimiento === 'DEVOLUCION_CLIENTE') return 'INGRESO';
  return naturaleza === 'SALIDA' ? 'SALIDA' : 'AJUSTE';
};

const costoResultante = ({ tipoMovimiento, naturaleza, stockAnterior, cantidad, costoAnterior, costoUnitario }) => {
  if (tipoMovimiento === 'REVALORIZACION') return costoUnitario;
  if (naturaleza !== 'ENTRADA' || !['COMPRA', 'INVENTARIO_INICIAL'].includes(tipoMovimiento)) return costoAnterior;
  const total = stockAnterior + cantidad;
  return total > 0 ? Number(((stockAnterior * costoAnterior + cantidad * costoUnitario) / total).toFixed(4)) : costoUnitario;
};

export default class MovimientoStockPgsCommandAdaptador extends MovimientoStockSalidaCommandPuerto {
  constructor(existenciaStock) {
    super();
    this.existenciaStock = existenciaStock;
  }

  async aplicar(movimiento, opciones = {}) {
    const transaccionExterna = opciones.transaction;
    const transaction = transaccionExterna || await sequelize.transaction();
    const creados = [];
    const omitidos = [];

    try {
      for (let indice = 0; indice < movimiento.items.length; indice++) {
        const item = movimiento.items[indice];
        const claveLinea = item.lineaId ?? item.productoId;
        const idempotencyKey = `${movimiento.idempotencyKey}:${claveLinea}:${indice}`;
        const existente = await MovimientoStock.findOne({ where: { idempotency_key: idempotencyKey }, transaction });
        if (existente) {
          creados.push(existente);
          continue;
        }

        const producto = await this.existenciaStock.bloquear(item.productoId, movimiento.sucursalId, transaction);
        if (!producto) throw new Error(`Producto ID ${item.productoId} no encontrado`);
        if (producto.tipo_control_stock === 'ILIMITADO') {
          omitidos.push({ productoId: producto.id, motivo: 'Producto sin control de stock' });
          continue;
        }

        const cantidad = numero(item.cantidad);
        const stockAnterior = numero(producto.stock);
        const costoAnterior = numero(producto.costo);
        const costoUnitario = item.costoUnitario == null ? costoAnterior : numero(item.costoUnitario);
        let stockNuevo = stockAnterior;

        if (movimiento.naturaleza === 'ENTRADA') stockNuevo += cantidad;
        if (movimiento.naturaleza === 'SALIDA') {
          if (stockAnterior < cantidad) throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${stockAnterior}, solicitado: ${cantidad}`);
          stockNuevo -= cantidad;
        }

        const costoNuevo = costoResultante({
          tipoMovimiento: movimiento.tipoMovimiento,
          naturaleza: movimiento.naturaleza,
          stockAnterior,
          cantidad,
          costoAnterior,
          costoUnitario,
        });

        await this.existenciaStock.actualizar(producto, { stock: stockNuevo, costoPromedio: costoNuevo }, transaction);
        const creado = await MovimientoStock.create({
          producto_id: producto.id,
          producto_codigo: producto.codigo,
          producto_nombre: producto.nombre,
          grupo_producto: producto.grupo,
          sucursal_id: movimiento.sucursalId,
          sucursal_nombre: movimiento.sucursalNombre,
          tipo: tipoLegacy(movimiento.tipoMovimiento, movimiento.naturaleza),
          naturaleza: movimiento.naturaleza,
          tipo_movimiento: movimiento.tipoMovimiento,
          origen: movimiento.origen,
          cantidad,
          costo_unitario: costoUnitario,
          precio_venta: item.precioVenta == null ? producto.pvp1 : numero(item.precioVenta),
          costo_promedio_anterior: costoAnterior,
          costo_promedio_nuevo: costoNuevo,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          referencia_id: movimiento.referenciaId,
          referencia_tipo: movimiento.referenciaTipo,
          referencia_codigo: movimiento.referenciaCodigo,
          usuario_id: movimiento.usuarioId,
          usuario_nombre: movimiento.usuarioNombre,
          fecha_operacion: movimiento.fechaOperacion || new Date(),
          operacion_id: movimiento.operacionId,
          idempotency_key: idempotencyKey,
          movimiento_revertido_id: item.movimientoRevertidoId,
          motivo: movimiento.motivo,
          observacion: movimiento.observacion,
          trace_id: movimiento.traceId,
          created_at: new Date(),
        }, { transaction });
        creados.push(creado);
      }

      if (!transaccionExterna) await transaction.commit();
      return { estado: 'ok', resultado: creados, omitidos };
    } catch (error) {
      if (!transaccionExterna) await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async revertirMovimiento(datos, opciones = {}) {
    return this.revertir({ ...datos, movimientoId: Number(datos.movimientoId) }, opciones);
  }

  async revertirReferencia(datos, opciones = {}) {
    return this.revertir(datos, opciones);
  }

  async revertir(datos, opciones = {}) {
    const transaccionExterna = opciones.transaction;
    const transaction = transaccionExterna || await sequelize.transaction();
    try {
      const where = datos.movimientoId
        ? { id: datos.movimientoId }
        : {
            referencia_tipo: datos.referenciaTipo,
            referencia_id: Number(datos.referenciaId),
            movimiento_revertido_id: null,
            ...(datos.tipoOriginal ? { tipo_movimiento: datos.tipoOriginal } : {}),
          };
      const originales = await MovimientoStock.findAll({ where, order: [['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
      if (datos.movimientoId && originales.length === 0) throw new Error('Movimiento no encontrado');

      const reversiones = [];
      for (const original of originales) {
        const existente = await MovimientoStock.findOne({ where: { movimiento_revertido_id: original.id }, transaction });
        if (existente) {
          reversiones.push(existente);
          continue;
        }

        const resultado = await this.aplicar({
          naturaleza: original.naturaleza === 'ENTRADA' ? 'SALIDA' : original.naturaleza === 'SALIDA' ? 'ENTRADA' : 'NEUTRO',
          tipoMovimiento: datos.tipoMovimiento,
          origen: datos.origen || original.origen,
          items: [{
            productoId: original.producto_id,
            cantidad: original.cantidad,
            costoUnitario: original.costo_unitario,
            precioVenta: original.precio_venta,
            lineaId: original.id,
            movimientoRevertidoId: original.id,
          }],
          referenciaId: datos.referenciaId ?? original.referencia_id,
          referenciaTipo: datos.referenciaTipo ?? original.referencia_tipo,
          referenciaCodigo: datos.referenciaCodigo ?? original.referencia_codigo,
          usuarioId: datos.usuarioId,
          usuarioNombre: datos.usuarioNombre,
          sucursalId: original.sucursal_id,
          sucursalNombre: original.sucursal_nombre,
          fechaOperacion: datos.fechaOperacion || new Date(),
          operacionId: datos.operacionId,
          idempotencyKey: `${datos.idempotencyKey}:REVERSA:${original.id}`,
          motivo: datos.motivo,
          observacion: datos.observacion,
          traceId: datos.traceId,
        }, { transaction });
        if (resultado.estado !== 'ok') throw new Error(resultado.resultado);
        reversiones.push(...resultado.resultado);
      }

      if (!transaccionExterna) await transaction.commit();
      return { estado: 'ok', resultado: reversiones };
    } catch (error) {
      if (!transaccionExterna) await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }
}
