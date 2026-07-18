import { Op } from 'sequelize';
import IngresoSalidaQueryPuerto from '../../aplicacion/puertos/salida/IngresoSalidaQueryPuerto.js';
import { Ingreso as IngresoModel, DetalleIngreso as DetalleIngresoModel } from '../modelos/Modelos.js';

export default class IngresoPgsQueryAdaptador extends IngresoSalidaQueryPuerto {
  async lista(buscar, estado, fechaDesde, fechaHasta, { limit = 10, offset = 0 } = {}) {
    const where = {};
    if (buscar) where[Op.or] = ['numero_factura', 'proveedor_nombre', 'id_personalizado'].map((campo) => ({ [campo]: { [Op.iLike]: `%${buscar}%` } }));
    if (estado) where.estado = estado;
    if (fechaDesde || fechaHasta) where.fecha = { ...(fechaDesde ? { [Op.gte]: fechaDesde } : {}), ...(fechaHasta ? { [Op.lte]: fechaHasta } : {}) };
    try {
      const ingresos = await IngresoModel.findAll({ where, order: [['fecha', 'DESC'], ['created_at', 'DESC']], limit: Math.min(Number(limit) || 10, 100), offset: Math.max(Number(offset) || 0, 0) });
      const resultado = await Promise.all(ingresos.map(async (ingreso) => {
        const detalles = await DetalleIngresoModel.findAll({ where: { ingreso_id: ingreso.id } });
        return { ...ingreso.toJSON(), cantidad_detalles: detalles.length, total_items: detalles.reduce((suma, detalle) => suma + Number(detalle.stock_ingresado || 0), 0) };
      }));
      return { estado: 'ok', resultado };
    } catch (error) {
      return { estado: 'error', resultado: [] };
    }
  }

  async buscarPorId(id) {
    try {
      const ingreso = await IngresoModel.findByPk(id);
      if (!ingreso) return { estado: 'error', resultado: null };
      const detalles = await DetalleIngresoModel.findAll({ where: { ingreso_id: id }, order: [['id', 'ASC']] });
      return { estado: 'ok', resultado: { ...ingreso.toJSON(), detalles } };
    } catch (error) {
      return { estado: 'error', resultado: null };
    }
  }
}
