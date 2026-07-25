// inventario-servicio/src/infraestructura/adaptador-salida/TransferenciaPgsCommandAdaptador.js
import { Op } from 'sequelize';
import TransferenciaSalidaCommandPuerto from '../../aplicacion/puertos/salida/TransferenciaSalidaCommandPuerto.js';
import { Transferencia, DetalleTransferencia } from '../modelos/ModeloTransferencia.js';
import { Producto } from '../modelos/Modelos.js';
import sequelize from '../base-dato/Postgresql.js';

const numero = (valor) => Number(valor || 0);

export default class TransferenciaPgsCommandAdaptador extends TransferenciaSalidaCommandPuerto {
  constructor(movimientoStockServicio) {
    super();
    this.movimientoStockServicio = movimientoStockServicio;
  }

  // Salida del origen y entrada al destino ocurren en la MISMA transacción: o la
  // mercadería se mueve por completo, o no se mueve nada. Nunca queda en tránsito.
  async crear(transferencia) {
    const existente = await Transferencia.findOne({ where: { idempotency_key: transferencia.idempotencyKey } });
    if (existente) return { estado: 'ok', resultado: existente.get({ plain: true }) };

    const transaction = await sequelize.transaction();
    try {
      const contextoComun = {
        origen: 'INVENTARIO',
        referenciaTipo: 'TRANSFERENCIA',
        usuarioId: transferencia.usuarioId,
        usuarioNombre: transferencia.usuarioNombre,
        operacionId: transferencia.operacionId,
        fechaOperacion: transferencia.fecha,
        motivo: transferencia.motivo,
        observacion: transferencia.observacion,
        traceId: transferencia.traceId,
      };

      // 1. Descarga del origen. Aquí se valida el stock disponible de esa sucursal.
      //    Sin costoUnitario, el ledger toma el costo promedio del origen.
      const salida = await this.movimientoStockServicio.aplicar({
        ...contextoComun,
        naturaleza: 'SALIDA',
        tipoMovimiento: 'TRANSFERENCIA_SALIDA',
        sucursalId: transferencia.sucursalOrigenId,
        sucursalNombre: transferencia.sucursalOrigenNombre,
        items: transferencia.items.map((item) => ({ ...item, costoUnitario: null })),
        idempotencyKey: `${transferencia.idempotencyKey}:SALIDA`,
      }, { transaction });
      if (salida.estado !== 'ok') throw new Error(salida.resultado);

      // 2. Carga al destino con el costo con que salió, para que el promedio del
      //    destino refleje el valor real de lo recibido.
      const costoPorProducto = new Map(salida.resultado.map((mov) => [Number(mov.producto_id), numero(mov.costo_unitario)]));
      const entrada = await this.movimientoStockServicio.aplicar({
        ...contextoComun,
        naturaleza: 'ENTRADA',
        tipoMovimiento: 'TRANSFERENCIA_ENTRADA',
        sucursalId: transferencia.sucursalDestinoId,
        sucursalNombre: transferencia.sucursalDestinoNombre,
        items: transferencia.items.map((item) => ({
          ...item,
          costoUnitario: costoPorProducto.get(Number(item.productoId)) ?? null,
        })),
        idempotencyKey: `${transferencia.idempotencyKey}:ENTRADA`,
      }, { transaction });
      if (entrada.estado !== 'ok') throw new Error(entrada.resultado);

      // 3. Documento de respaldo del traslado.
      const productos = await Producto.findAll({
        where: { id: { [Op.in]: transferencia.items.map((item) => item.productoId) } },
        transaction,
        raw: true,
      });
      const porId = new Map(productos.map((producto) => [Number(producto.id), producto]));
      const detalles = transferencia.items.map((item) => {
        const producto = porId.get(Number(item.productoId)) ?? {};
        const costoUnitario = costoPorProducto.get(Number(item.productoId)) ?? 0;
        return {
          producto_id: item.productoId,
          producto_codigo: producto.codigo ?? null,
          producto_nombre: producto.nombre ?? null,
          modelo: producto.modelo ?? null,
          color: producto.color ?? null,
          grupo: producto.grupo ?? null,
          cantidad: item.cantidad,
          costo_unitario: costoUnitario,
          subtotal: Number((costoUnitario * item.cantidad).toFixed(2)),
        };
      });

      const cabecera = await Transferencia.create({
        sucursal_origen_id: transferencia.sucursalOrigenId,
        sucursal_origen_nombre: transferencia.sucursalOrigenNombre,
        sucursal_destino_id: transferencia.sucursalDestinoId,
        sucursal_destino_nombre: transferencia.sucursalDestinoNombre,
        fecha: transferencia.fecha,
        estado: 'CONFIRMADA',
        motivo: transferencia.motivo,
        observacion: transferencia.observacion,
        total_items: detalles.reduce((suma, detalle) => suma + detalle.cantidad, 0),
        costo_total: Number(detalles.reduce((suma, detalle) => suma + detalle.subtotal, 0).toFixed(2)),
        usuario_id: transferencia.usuarioId,
        usuario_nombre: transferencia.usuarioNombre,
        operacion_id: transferencia.operacionId,
        idempotency_key: transferencia.idempotencyKey,
        trace_id: transferencia.traceId,
        created_at: new Date(),
        updated_at: new Date(),
      }, { transaction });

      await DetalleTransferencia.bulkCreate(
        detalles.map((detalle) => ({ ...detalle, transferencia_id: cabecera.id })),
        { transaction },
      );

      await transaction.commit();
      return { estado: 'ok', resultado: { ...cabecera.get({ plain: true }), detalles } };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  // Anular devuelve la mercadería al origen mediante movimientos compensatorios:
  // el ledger es inmutable, los movimientos originales no se borran.
  async anular(id, datos) {
    const cabecera = await Transferencia.findByPk(id);
    if (!cabecera) return { estado: 'error', resultado: 'Transferencia no encontrada' };
    if (cabecera.estado === 'ANULADA') return { estado: 'error', resultado: 'La transferencia ya fue anulada' };

    const transaction = await sequelize.transaction();
    try {
      const detalles = await DetalleTransferencia.findAll({ where: { transferencia_id: id }, transaction, raw: true });
      const items = detalles.map((detalle) => ({
        productoId: detalle.producto_id,
        cantidad: detalle.cantidad,
        costoUnitario: numero(detalle.costo_unitario),
      }));
      const contextoComun = {
        origen: 'INVENTARIO',
        referenciaTipo: 'ANULACION_TRANSFERENCIA',
        referenciaId: cabecera.id,
        usuarioId: datos.usuarioId,
        usuarioNombre: datos.usuarioNombre,
        operacionId: datos.operacionId,
        motivo: datos.motivo,
        traceId: datos.traceId,
      };

      // Sale del destino...
      const salida = await this.movimientoStockServicio.aplicar({
        ...contextoComun,
        naturaleza: 'SALIDA',
        tipoMovimiento: 'TRANSFERENCIA_SALIDA',
        sucursalId: cabecera.sucursal_destino_id,
        sucursalNombre: cabecera.sucursal_destino_nombre,
        items: items.map((item) => ({ ...item, costoUnitario: null })),
        idempotencyKey: `${datos.idempotencyKey}:REVERSA:SALIDA`,
      }, { transaction });
      if (salida.estado !== 'ok') throw new Error(salida.resultado);

      // ...y regresa al origen.
      const entrada = await this.movimientoStockServicio.aplicar({
        ...contextoComun,
        naturaleza: 'ENTRADA',
        tipoMovimiento: 'TRANSFERENCIA_ENTRADA',
        sucursalId: cabecera.sucursal_origen_id,
        sucursalNombre: cabecera.sucursal_origen_nombre,
        items,
        idempotencyKey: `${datos.idempotencyKey}:REVERSA:ENTRADA`,
      }, { transaction });
      if (entrada.estado !== 'ok') throw new Error(entrada.resultado);

      await cabecera.update({
        estado: 'ANULADA',
        anulada_en: new Date(),
        anulada_por_id: datos.usuarioId,
        anulada_por_nombre: datos.usuarioNombre,
        motivo_anulacion: datos.motivo,
        updated_at: new Date(),
      }, { transaction });

      await transaction.commit();
      return { estado: 'ok', resultado: cabecera.get({ plain: true }) };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }
}
