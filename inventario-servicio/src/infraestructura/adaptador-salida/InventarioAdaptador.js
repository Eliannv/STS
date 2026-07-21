import { Op } from 'sequelize';
import { Proveedor, Producto, CatalogoItem, Ingreso, DetalleIngreso, Egreso, DetalleEgreso, MovimientoStock } from '../modelos/Modelos.js';
import sequelize from '../base-dato/Postgresql.js';

const modelos = { proveedores: Proveedor, productos: Producto, catalogo: CatalogoItem, ingresos: Ingreso, 'detalle-ingresos': DetalleIngreso, egresos: Egreso, 'detalle-egresos': DetalleEgreso, movimientos: MovimientoStock };
const camposBusqueda = { proveedores: ['nombre','ruc','codigo'], productos: ['nombre','codigo','modelo','color','grupo'], catalogo: ['nombre','categoria'] };

export default class InventarioAdaptador {
  constructor(movimientoStockServicio) { this.movimientoStockServicio = movimientoStockServicio; }
  modelo(recurso) { return modelos[recurso]; }
  async listar(recurso, { buscar = null, limit = 20, offset = 0, productoId = null, ingresoId = null, egresoId = null } = {}) {
    const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' };
    const where = {};
    if (Model.rawAttributes.activo) where.activo = true;
    const campos = camposBusqueda[recurso] || [];
    if (buscar && campos.length) where[Op.or] = campos.map((campo) => ({ [campo]: { [Op.iLike]: `%${buscar}%` } }));
    if (productoId) where.producto_id = productoId;
    if (ingresoId) where.ingreso_id = ingresoId;
    if (egresoId) where.egreso_id = egresoId;
    return { estado: 'ok', resultado: await Model.findAll({ where, order: [['id', 'DESC']], limit: Math.min(Number(limit) || 20, 100), offset: Math.max(Number(offset) || 0, 0) }) };
  }
  async obtener(recurso, id) { const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' }; const item = await Model.findByPk(id); return item ? { estado: 'ok', resultado: item } : { estado: 'error', resultado: 'No encontrado' }; }
  async crear(recurso, datos) {
    if (recurso === 'detalle-egresos') return this.crearDetalleEgreso(datos);
    const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' };
    try { const ahora = new Date(); const item = await Model.create({ ...datos, created_at: datos.created_at || ahora, updated_at: datos.updated_at || ahora }); return { estado: 'ok', resultado: item }; } catch (error) { return { estado: 'error', resultado: error.message }; }
  }

  async actualizar(recurso, id, datos) {
    if (recurso === 'detalle-egresos') return this.actualizarDetalleEgreso(id, datos);
    const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' };
    try { const [count] = await Model.update({ ...datos, updated_at: new Date() }, { where: { id } }); return count ? { estado: 'ok', resultado: 'Actualizado correctamente' } : { estado: 'error', resultado: 'No encontrado' }; } catch (error) { return { estado: 'error', resultado: error.message }; }
  }

  async eliminar(recurso, id, contexto = {}) {
    if (recurso === 'detalle-egresos') return this.eliminarDetalleEgreso(id, contexto);
    if (recurso === 'egresos') return this.eliminarEgreso(id, contexto);
    const Model = this.modelo(recurso); if (!Model) return { estado: 'error', resultado: 'Recurso inválido' };
    if (Model.rawAttributes.activo) { const [count] = await Model.update({ activo: false, updated_at: new Date() }, { where: { id } }); return count ? { estado: 'ok', resultado: 'Desactivado correctamente' } : { estado: 'error', resultado: 'No encontrado' }; }
    const count = await Model.destroy({ where: { id } }); return count ? { estado: 'ok', resultado: 'Eliminado correctamente' } : { estado: 'error', resultado: 'No encontrado' };
  }

  async crearDetalleEgreso(datos) {
    const transaction = await sequelize.transaction();
    try {
      const egresoId = Number(datos.egreso_id ?? datos.egresoId);
      const egreso = await Egreso.findByPk(egresoId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!egreso) throw new Error('Egreso no encontrado');
      const detalle = await DetalleEgreso.create({
        egreso_id: egresoId,
        producto_id: Number(datos.producto_id ?? datos.productoId),
        nombre: datos.nombre,
        modelo: datos.modelo,
        color: datos.color,
        grupo: datos.grupo,
        cantidad: Number(datos.cantidad),
        costo_unitario: Number(datos.costo_unitario ?? datos.costoUnitario ?? 0),
        subtotal: Number(datos.subtotal || 0),
      }, { transaction });
      const movimiento = await this.movimientoStockServicio.aplicar(this.movimientoEgreso(egreso, detalle, datos), { transaction });
      if (movimiento.estado !== 'ok') throw new Error(movimiento.resultado);
      await transaction.commit();
      return { estado: 'ok', resultado: detalle };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizarDetalleEgreso(id, datos) {
    const transaction = await sequelize.transaction();
    try {
      const detalle = await DetalleEgreso.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!detalle) throw new Error('Detalle de egreso no encontrado');
      const egreso = await Egreso.findByPk(detalle.egreso_id, { transaction, lock: transaction.LOCK.UPDATE });
      const original = await this.movimientoActivoDetalle(egreso.id, detalle.producto_id, transaction);
      if (original) {
        const reversa = await this.movimientoStockServicio.revertirMovimiento({
          movimientoId: original.id,
          tipoMovimiento: 'COMPENSACION',
          origen: 'INVENTARIO',
          operacionId: `EGRESO-${egreso.id}-EDICION-${datos.traceId}`,
          idempotencyKey: `EGRESO-${egreso.id}-DETALLE-${detalle.id}-REVERSA-${datos.traceId}`,
          usuarioId: datos.usuarioId,
          usuarioNombre: datos.usuarioNombre,
          motivo: 'Edición de detalle de egreso',
          traceId: datos.traceId,
        }, { transaction });
        if (reversa.estado !== 'ok') throw new Error(reversa.resultado);
      }
      await detalle.update({
        producto_id: Number(datos.producto_id ?? datos.productoId ?? detalle.producto_id),
        nombre: datos.nombre ?? detalle.nombre,
        modelo: datos.modelo ?? detalle.modelo,
        color: datos.color ?? detalle.color,
        grupo: datos.grupo ?? detalle.grupo,
        cantidad: Number(datos.cantidad ?? detalle.cantidad),
        costo_unitario: Number(datos.costo_unitario ?? datos.costoUnitario ?? detalle.costo_unitario),
        subtotal: Number(datos.subtotal ?? detalle.subtotal),
      }, { transaction });
      const movimiento = await this.movimientoStockServicio.aplicar(this.movimientoEgreso(egreso, detalle, {
        ...datos,
        idempotencyKey: `EGRESO-${egreso.id}-DETALLE-${detalle.id}-EDICION-${datos.traceId}`,
      }), { transaction });
      if (movimiento.estado !== 'ok') throw new Error(movimiento.resultado);
      await transaction.commit();
      return { estado: 'ok', resultado: 'Detalle actualizado correctamente' };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async eliminarDetalleEgreso(id, contexto) {
    const transaction = await sequelize.transaction();
    try {
      const detalle = await DetalleEgreso.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!detalle) throw new Error('Detalle de egreso no encontrado');
      const egreso = await Egreso.findByPk(detalle.egreso_id, { transaction });
      const original = await this.movimientoActivoDetalle(egreso.id, detalle.producto_id, transaction);
      if (original) {
        const reversa = await this.movimientoStockServicio.revertirMovimiento({
          movimientoId: original.id,
          tipoMovimiento: 'ANULACION_EGRESO',
          origen: 'INVENTARIO',
          operacionId: `EGRESO-${egreso.id}-ELIMINAR-DETALLE-${detalle.id}`,
          idempotencyKey: `EGRESO-${egreso.id}-ELIMINAR-DETALLE-${detalle.id}`,
          usuarioId: contexto.usuarioId,
          usuarioNombre: contexto.usuarioNombre,
          motivo: 'Eliminación de detalle de egreso',
          traceId: contexto.traceId,
        }, { transaction });
        if (reversa.estado !== 'ok') throw new Error(reversa.resultado);
      }
      await detalle.destroy({ transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: 'Detalle eliminado y stock compensado correctamente' };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async eliminarEgreso(id, contexto) {
    const transaction = await sequelize.transaction();
    try {
      const egreso = await Egreso.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!egreso) throw new Error('Egreso no encontrado');
      const reversa = await this.movimientoStockServicio.revertirReferencia({
        referenciaTipo: 'EGRESO',
        referenciaId: egreso.id,
        referenciaCodigo: egreso.documento_referencia || `EGR-${egreso.id}`,
        tipoMovimiento: 'ANULACION_EGRESO',
        origen: 'INVENTARIO',
        operacionId: `EGRESO-${egreso.id}-ANULACION`,
        idempotencyKey: `EGRESO-${egreso.id}-ANULACION`,
        usuarioId: contexto.usuarioId,
        usuarioNombre: contexto.usuarioNombre,
        motivo: 'Eliminación de egreso',
        traceId: contexto.traceId,
      }, { transaction });
      if (reversa.estado !== 'ok') throw new Error(reversa.resultado);
      await egreso.destroy({ transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: 'Egreso eliminado y stock compensado correctamente' };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  movimientoEgreso(egreso, detalle, contexto) {
    return {
      naturaleza: 'SALIDA',
      tipoMovimiento: egreso.motivo === 'DEVOLUCION_PROVEEDOR' ? 'DEVOLUCION_PROVEEDOR' : 'EGRESO',
      origen: 'INVENTARIO',
      items: [{ productoId: detalle.producto_id, cantidad: Number(detalle.cantidad), costoUnitario: detalle.costo_unitario, lineaId: detalle.id }],
      referenciaId: egreso.id,
      referenciaTipo: 'EGRESO',
      referenciaCodigo: egreso.documento_referencia || `EGR-${egreso.id}`,
      usuarioId: contexto.usuarioId ?? egreso.usuario_id,
      usuarioNombre: contexto.usuarioNombre ?? egreso.usuario_nombre,
      sucursalId: contexto.sucursalId ?? egreso.sucursal_id,
      sucursalNombre: egreso.sucursal_nombre,
      fechaOperacion: egreso.fecha,
      operacionId: `EGRESO-${egreso.id}`,
      idempotencyKey: contexto.idempotencyKey || `EGRESO-${egreso.id}:DETALLE-${detalle.id}`,
      motivo: egreso.motivo,
      observacion: egreso.descripcion,
      traceId: contexto.traceId,
    };
  }

  async movimientoActivoDetalle(egresoId, productoId, transaction) {
    const candidatos = await MovimientoStock.findAll({
      where: {
        referencia_tipo: 'EGRESO',
        referencia_id: egresoId,
        producto_id: productoId,
        tipo_movimiento: { [Op.in]: ['EGRESO', 'DEVOLUCION_PROVEEDOR'] },
        movimiento_revertido_id: null,
      },
      order: [['id', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    for (const candidato of candidatos) {
      const reversa = await MovimientoStock.findOne({ where: { movimiento_revertido_id: candidato.id }, transaction });
      if (!reversa) return candidato;
    }
    return null;
  }
}
