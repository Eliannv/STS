import sequelize from '../base-dato/Postgresql.js';
import IngresoSalidaCommandPuerto from '../../aplicacion/puertos/salida/IngresoSalidaCommandPuerto.js';
import { Ingreso as IngresoModel, DetalleIngreso as DetalleIngresoModel, Producto as ProductoModel } from '../modelos/Modelos.js';

const ingresoDb = (ingreso) => ({
  proveedor_id: ingreso.proveedorId,
  proveedor_nombre: ingreso.proveedorNombre,
  numero_factura: ingreso.numeroFactura,
  fecha: ingreso.fecha,
  tipo_compra: ingreso.tipoCompra,
  observacion: ingreso.observacion,
  descuento: ingreso.descuento,
  flete: ingreso.flete,
  iva: ingreso.iva,
  total: ingreso.total,
  usuario_id: ingreso.usuarioId,
  updated_at: new Date()
});

const detalleDb = (detalle, ingresoId) => ({
  ingreso_id: ingresoId ?? detalle.ingresoId,
  producto_id: detalle.productoId,
  tipo: detalle.tipo,
  codigo: detalle.codigo,
  nombre: detalle.nombre,
  modelo: detalle.modelo,
  color: detalle.color,
  grupo: detalle.grupo,
  pvp1: detalle.pvp1,
  observacion: detalle.observacion,
  stock_ingresado: detalle.stockIngresado,
  costo_unitario: detalle.costoUnitario,
  subtotal: detalle.subtotal
});

const numero = (valor) => Number(valor || 0);
const normalizar = (valor) => String(valor || '').trim().toLowerCase();

export default class IngresoPgsCommandAdaptador extends IngresoSalidaCommandPuerto {
  constructor(movimientoStockServicio) {
    super();
    this.movimientoStockServicio = movimientoStockServicio;
  }

  async guardar(ingreso, detalles = []) {
    const transaction = await sequelize.transaction();
    try {
      const creado = await IngresoModel.create({ ...ingresoDb(ingreso), estado: 'BORRADOR', created_at: new Date() }, { transaction });
      for (const detalle of detalles) await DetalleIngresoModel.create(detalleDb(detalle, creado.id), { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: creado };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.name === 'SequelizeUniqueConstraintError' ? 'Ya existe un ingreso con ese número de factura' : error.message };
    }
  }

  async actualizar(ingreso) {
    try {
      const [cantidad] = await IngresoModel.update(ingresoDb(ingreso), { where: { id: ingreso.id, estado: 'BORRADOR' } });
      return cantidad ? { estado: 'ok', resultado: 'Ingreso actualizado correctamente' } : { estado: 'error', resultado: 'Ingreso no encontrado o ya fue finalizado' };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async finalizar(contexto) {
    const id = contexto.id;
    const transaction = await sequelize.transaction();
    try {
      const ingreso = await IngresoModel.findOne({ where: { id, estado: 'BORRADOR' }, transaction, lock: transaction.LOCK.UPDATE });
      if (!ingreso) {
        await transaction.rollback();
        return { estado: 'error', resultado: 'Ingreso no encontrado o ya fue finalizado' };
      }
      const detalles = await DetalleIngresoModel.findAll({ where: { ingreso_id: id }, order: [['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
      if (!detalles.length) {
        await transaction.rollback();
        return { estado: 'error', resultado: 'El ingreso no tiene productos. Agregue al menos uno antes de finalizar' };
      }

      let productosCreados = 0;
      let productosActualizados = 0;
      for (const detalle of detalles) {
        let producto;
        if (detalle.tipo === 'EXISTENTE' && detalle.producto_id) {
          producto = await ProductoModel.findOne({ where: { id: detalle.producto_id }, transaction, lock: transaction.LOCK.UPDATE });
          if (!producto) throw new Error('Producto no encontrado para el detalle del ingreso');
          productosActualizados++;
        } else if (detalle.tipo === 'NUEVO') {
          const candidatos = await ProductoModel.findAll({ where: { activo: true, grupo: detalle.grupo }, transaction, lock: transaction.LOCK.UPDATE });
          const existente = candidatos.find((producto) => normalizar(producto.modelo) === normalizar(detalle.modelo) && normalizar(producto.color) === normalizar(detalle.color));
          const stockNuevo = numero(detalle.stock_ingresado);
          const costoNuevo = numero(detalle.costo_unitario);
          if (existente) {
            await detalle.update({ producto_id: existente.id, tipo: 'EXISTENTE' }, { transaction });
            producto = existente;
            productosActualizados++;
          } else {
            producto = await ProductoModel.create({
              codigo: detalle.codigo,
              nombre: detalle.nombre,
              modelo: detalle.modelo,
              color: detalle.color,
              grupo: detalle.grupo,
              stock: 0,
              tipo_control_stock: 'NORMAL',
              costo: 0,
              pvp1: detalle.pvp1 ?? costoNuevo,
              iva: 0,
              precio_con_iva: detalle.pvp1 ?? costoNuevo,
              observacion: detalle.observacion,
              proveedor_id: ingreso.proveedor_id,
              ingreso_id: id,
              activo: true,
              created_at: new Date(),
              updated_at: new Date()
            }, { transaction });
            await detalle.update({ producto_id: producto.id }, { transaction });
            productosCreados++;
          }
        }

        if (!producto) throw new Error('No se pudo resolver el producto del ingreso');
        const movimiento = await this.movimientoStockServicio.aplicar({
          naturaleza: 'ENTRADA',
          tipoMovimiento: 'COMPRA',
          origen: contexto.origen === 'IMPORTACION' ? 'IMPORTACION' : 'INVENTARIO',
          items: [{
            productoId: producto.id,
            cantidad: numero(detalle.stock_ingresado),
            costoUnitario: numero(detalle.costo_unitario),
            precioVenta: detalle.pvp1,
            lineaId: detalle.id,
          }],
          referenciaId: ingreso.id,
          referenciaTipo: 'INGRESO',
          referenciaCodigo: ingreso.id_personalizado || ingreso.numero_factura,
          usuarioId: contexto.usuarioId ?? ingreso.usuario_id,
          usuarioNombre: contexto.usuarioNombre,
          sucursalId: contexto.sucursalId,
          sucursalNombre: contexto.sucursalNombre,
          fechaOperacion: ingreso.fecha,
          operacionId: contexto.operacionId || `INGRESO-${ingreso.id}`,
          idempotencyKey: `${contexto.idempotencyKey || `INGRESO-${ingreso.id}`}:DETALLE-${detalle.id}`,
          motivo: 'Confirmación de ingreso de mercadería',
          observacion: detalle.observacion || ingreso.observacion,
          traceId: contexto.traceId,
        }, { transaction });
        if (movimiento.estado !== 'ok') throw new Error(movimiento.resultado);
      }

      const total = Number((detalles.reduce((suma, detalle) => suma + numero(detalle.subtotal), 0) + numero(ingreso.flete) - numero(ingreso.descuento) + numero(ingreso.iva)).toFixed(2));
      const finalizado = await ingreso.update({ estado: 'FINALIZADO', total, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: finalizado, reporte: { productosCreados, productosActualizados, totalProcesados: detalles.length } };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: `Error al finalizar el ingreso: ${error.message}` };
    }
  }

  async eliminar(contexto) {
    const transaction = await sequelize.transaction();
    try {
      const ingreso = await IngresoModel.findByPk(contexto.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!ingreso) throw new Error('Ingreso no encontrado');
      if (ingreso.estado === 'BORRADOR') {
        await ingreso.destroy({ transaction });
        await transaction.commit();
        return { estado: 'ok', resultado: 'Borrador de ingreso eliminado correctamente' };
      }
      if (ingreso.estado === 'ANULADO') throw new Error('El ingreso ya fue anulado');

      const reversa = await this.movimientoStockServicio.revertirReferencia({
        referenciaTipo: 'INGRESO',
        referenciaId: ingreso.id,
        referenciaCodigo: ingreso.id_personalizado || ingreso.numero_factura,
        tipoOriginal: 'COMPRA',
        tipoMovimiento: 'ANULACION_COMPRA',
        origen: 'INVENTARIO',
        operacionId: `INGRESO-${ingreso.id}-ANULACION`,
        idempotencyKey: `INGRESO-${ingreso.id}-ANULACION`,
        usuarioId: contexto.usuarioId,
        usuarioNombre: contexto.usuarioNombre,
        motivo: contexto.motivo || 'Anulación de ingreso confirmado',
        traceId: contexto.traceId,
      }, { transaction });
      if (reversa.estado !== 'ok') throw new Error(reversa.resultado);
      await ingreso.update({ estado: 'ANULADO', updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: 'Ingreso anulado y stock compensado correctamente' };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async guardarDetalle(detalle) {
    try {
      const ingreso = await IngresoModel.findOne({ where: { id: detalle.ingresoId, estado: 'BORRADOR' } });
      if (!ingreso) return { estado: 'error', resultado: 'Solo se pueden agregar detalles a ingresos en borrador' };
      const resultado = await DetalleIngresoModel.create(detalleDb(detalle));
      return { estado: 'ok', resultado };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizarDetalle(detalle) {
    try {
      const actual = await DetalleIngresoModel.findByPk(detalle.id);
      if (!actual) return { estado: 'error', resultado: 'Detalle no encontrado' };
      const ingreso = await IngresoModel.findOne({ where: { id: actual.ingreso_id, estado: 'BORRADOR' } });
      if (!ingreso) return { estado: 'error', resultado: 'No se puede editar un ingreso confirmado o anulado' };
      const [cantidad] = await DetalleIngresoModel.update(detalleDb(detalle, actual.ingreso_id), { where: { id: detalle.id } });
      return cantidad ? { estado: 'ok', resultado: 'Detalle actualizado correctamente' } : { estado: 'error', resultado: 'Detalle no encontrado' };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async eliminarDetalle(id) {
    const detalle = await DetalleIngresoModel.findByPk(id);
    if (!detalle) return { estado: 'error', resultado: 'Detalle no encontrado' };
    const ingreso = await IngresoModel.findOne({ where: { id: detalle.ingreso_id, estado: 'BORRADOR' } });
    if (!ingreso) return { estado: 'error', resultado: 'No se puede eliminar un detalle de un ingreso confirmado o anulado' };
    await detalle.destroy();
    return { estado: 'ok', resultado: 'Detalle eliminado correctamente' };
  }
}
