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

  async finalizar(id) {
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
        if (detalle.tipo === 'EXISTENTE' && detalle.producto_id) {
          const producto = await ProductoModel.findOne({ where: { id: detalle.producto_id }, transaction, lock: transaction.LOCK.UPDATE });
          if (!producto) throw new Error('Producto no encontrado para el detalle del ingreso');
          const stockActual = numero(producto.stock);
          const stockNuevo = numero(detalle.stock_ingresado);
          const costoPromedio = stockActual + stockNuevo > 0
            ? Number(((stockActual * numero(producto.costo) + stockNuevo * numero(detalle.costo_unitario)) / (stockActual + stockNuevo)).toFixed(4))
            : numero(detalle.costo_unitario);
          await producto.update({ stock: stockActual + stockNuevo, costo: costoPromedio, updated_at: new Date() }, { transaction });
          productosActualizados++;
          continue;
        }

        if (detalle.tipo === 'NUEVO') {
          const candidatos = await ProductoModel.findAll({ where: { activo: true, grupo: detalle.grupo }, transaction, lock: transaction.LOCK.UPDATE });
          const existente = candidatos.find((producto) => normalizar(producto.modelo) === normalizar(detalle.modelo) && normalizar(producto.color) === normalizar(detalle.color));
          const stockNuevo = numero(detalle.stock_ingresado);
          const costoNuevo = numero(detalle.costo_unitario);
          if (existente) {
            const stockActual = numero(existente.stock);
            const costoPromedio = stockActual + stockNuevo > 0
              ? Number(((stockActual * numero(existente.costo) + stockNuevo * costoNuevo) / (stockActual + stockNuevo)).toFixed(4))
              : costoNuevo;
            await existente.update({ stock: stockActual + stockNuevo, costo: costoPromedio, updated_at: new Date() }, { transaction });
            await detalle.update({ producto_id: existente.id, tipo: 'EXISTENTE' }, { transaction });
            productosActualizados++;
          } else {
            const producto = await ProductoModel.create({
              codigo: detalle.codigo,
              nombre: detalle.nombre,
              modelo: detalle.modelo,
              color: detalle.color,
              grupo: detalle.grupo,
              stock: stockNuevo,
              tipo_control_stock: 'NORMAL',
              costo: costoNuevo,
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

  async eliminar(id) {
    const cantidad = await IngresoModel.destroy({ where: { id, estado: 'BORRADOR' } });
    return cantidad ? { estado: 'ok', resultado: 'Ingreso eliminado correctamente' } : { estado: 'error', resultado: 'Ingreso no encontrado o ya fue finalizado' };
  }

  async guardarDetalle(detalle) {
    try {
      const resultado = await DetalleIngresoModel.create(detalleDb(detalle));
      return { estado: 'ok', resultado };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async actualizarDetalle(detalle) {
    try {
      const [cantidad] = await DetalleIngresoModel.update(detalleDb(detalle), { where: { id: detalle.id } });
      return cantidad ? { estado: 'ok', resultado: 'Detalle actualizado correctamente' } : { estado: 'error', resultado: 'Detalle no encontrado' };
    } catch (error) {
      return { estado: 'error', resultado: error.message };
    }
  }

  async eliminarDetalle(id) {
    const cantidad = await DetalleIngresoModel.destroy({ where: { id } });
    return cantidad ? { estado: 'ok', resultado: 'Detalle eliminado correctamente' } : { estado: 'error', resultado: 'Detalle no encontrado' };
  }
}
