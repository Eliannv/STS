import { Op } from 'sequelize';
import FacturaSalidaCommandPuerto from '../../aplicacion/puertos/salida/FacturaSalidaCommandPuerto.js';
import sequelize from '../base-dato/Postgresql.js';
import { Factura, DetalleFactura, Deuda, VentaTarjeta } from '../modelos/Modelos.js';

const facturaDb = (venta) => ({
  cliente_id: venta.clienteId,
  cliente_nombre: venta.nombreCliente,
  historial_clinico_id: venta.historialClinicoId,
  subtotal: venta.subtotal,
  subtotal_bruto: venta.subtotal,
  total: venta.total,
  metodo_pago: venta.metodoPago,
  es_credito: venta.tipo === 'CREDITO',
  abonado: Math.max(0, Number(venta.total || 0) - Number(venta.saldoPendiente || 0)),
  saldo_pendiente: venta.saldoPendiente,
  tipo_venta: venta.tipo,
  estado_pago: venta.estado,
  observacion: venta.observacion,
  usuario_id: venta.usuarioId,
  sucursal_id: venta.sucursalId,
  updated_at: new Date()
});

const detalleDb = (item, facturaId) => ({
  factura_id: facturaId,
  producto_id: item.productoId ?? item.producto_id ?? item.id ?? null,
  catalogo_item_id: item.catalogoItemId ?? item.catalogo_item_id ?? null,
  nombre: item.nombre ?? 'Producto',
  tipo: item.tipo ?? null,
  codigo: item.codigo ?? null,
  id_interno: item.idInterno ?? item.id_interno ?? null,
  cantidad: Number(item.cantidad) || 1,
  precio_unitario: Number(item.precioUnitario ?? item.precio_unitario ?? item.precio) || 0,
  total: Number(item.total ?? item.precioTotal ?? item.precio_total) || (Number(item.precioUnitario ?? item.precio_unitario ?? item.precio) || 0) * (Number(item.cantidad) || 1),
  es_servicio: Boolean(item.esServicio ?? item.es_servicio)
});

export default class FacturaPgsCommandAdaptador extends FacturaSalidaCommandPuerto {
  async guardar(venta) {
    const transaction = await sequelize.transaction();
    try {
      const factura = await Factura.create({ ...facturaDb(venta), estado_inventario: 'PENDIENTE', fecha: venta.fechaPago || new Date(), created_at: new Date() }, { transaction });
      for (const item of venta.items) await DetalleFactura.create(detalleDb(item, factura.id), { transaction });
      if (Number(venta.total) - Number(venta.saldoPendiente) > 0) {
        await Deuda.create({ factura_id: factura.id, factura_id_personalizado: factura.id_personalizado, cliente_id: venta.clienteId, cliente_nombre: venta.nombreCliente || 'Cliente', metodo_pago: venta.metodoPago, fecha_pago: venta.fechaPago || new Date(), monto_pagado: factura.abonado, total_factura: venta.total, saldo_restante: venta.saldoPendiente, estado_pago: venta.estado, es_credito: venta.tipo === 'CREDITO', usuario_id: venta.usuarioId, created_at: new Date() }, { transaction });
      }
      if (venta.metodoPago?.toUpperCase() === 'TARJETA') {
        const montoRecibido = Math.max(0, Number(venta.total || 0) - Number(venta.saldoPendiente || 0));
        const saldoPendiente = Math.max(0, Number(venta.saldoPendiente || 0));
        await VentaTarjeta.create({ factura_id: factura.id, factura_id_personalizado: factura.id_personalizado, cliente_id: venta.clienteId, cliente_nombre: venta.nombreCliente, monto_total: venta.total, monto_recibido: montoRecibido, saldo_pendiente: saldoPendiente, estado: saldoPendiente <= 0.01 ? 'LIQUIDADA' : 'PENDIENTE', observacion: venta.observacion, created_at: new Date(), updated_at: new Date() }, { transaction });
      }
      await transaction.commit();
      return { estado: 'ok', resultado: factura };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizar(venta) {
    try {
      const [cantidad] = await Factura.update(facturaDb(venta), { where: { id: venta.id } });
      return cantidad ? { estado: 'ok', resultado: 'Factura actualizada correctamente' } : { estado: 'error', resultado: 'Factura no encontrada' };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async cobrar(id) {
    const [cantidad] = await Factura.update({ saldo_pendiente: 0, abonado: sequelize.literal('total'), estado_pago: 'PAGADA', updated_at: new Date() }, { where: { id } });
    return cantidad ? { estado: 'ok', resultado: 'Factura marcada como pagada' } : { estado: 'error', resultado: 'Factura no encontrada' };
  }

  async anular(id, estadoInventario = 'REVERSADO') {
    const [cantidad] = await Factura.update({ estado_pago: 'ANULADA', estado_inventario: estadoInventario, saldo_pendiente: 0, deleted_at: new Date(), updated_at: new Date() }, { where: { id, estado_pago: { [Op.ne]: 'ANULADA' } } });
    return cantidad ? { estado: 'ok', resultado: 'Factura anulada correctamente' } : { estado: 'error', resultado: 'Factura no encontrada o ya estaba anulada' };
  }

  async eliminar(id) {
    const [cantidad] = await Factura.update({ estado_pago: 'ANULADA', estado_inventario: 'REVERSADO', deleted_at: new Date(), updated_at: new Date() }, { where: { id, deleted_at: null } });
    return cantidad ? { estado: 'ok', resultado: 'Factura eliminada correctamente' } : { estado: 'error', resultado: 'Factura no encontrada o ya eliminada' };
  }

  async actualizarEstadoInventario(id, estado) {
    const [cantidad] = await Factura.update({ estado_inventario: estado, updated_at: new Date() }, { where: { id } });
    return cantidad ? { estado: 'ok', resultado: estado } : { estado: 'error', resultado: 'Factura no encontrada' };
  }
}
