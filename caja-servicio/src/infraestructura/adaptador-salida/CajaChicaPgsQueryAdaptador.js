import { Op } from 'sequelize';
import CajaChicaSalidaQueryPuerto from '../../aplicacion/puertos/salida/CajaChicaSalidaQueryPuerto.js';
import { CajaChica, MovimientoChica } from '../modelos/Modelos.js';

export default class CajaChicaPgsQueryAdaptador extends CajaChicaSalidaQueryPuerto {
  async lista({ estado, fechaDesde, fechaHasta, limit = 20, offset = 0 } = {}) {
    const where = { activo: true };
    if (estado) where.estado = estado;
    if (fechaDesde || fechaHasta) where.fecha = { ...(fechaDesde ? { [Op.gte]: fechaDesde } : {}), ...(fechaHasta ? { [Op.lte]: fechaHasta } : {}) };
    return { estado: 'ok', resultado: await CajaChica.findAll({ where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 20, 100), offset: Math.max(Number(offset) || 0, 0) }) };
  }

  async buscarPorId(id) {
    const caja = await CajaChica.findOne({ where: { id, activo: true } });
    if (!caja) return { estado: 'error', resultado: 'Caja chica no encontrada' };
    const movimientos = await MovimientoChica.findAll({ where: { caja_chica_id: id } });
    return { estado: 'ok', resultado: { ...caja.toJSON(), resumen: { total_ingresos: movimientos.filter((m) => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto || 0), 0), total_egresos: movimientos.filter((m) => m.tipo === 'EGRESO').reduce((s, m) => s + Number(m.monto || 0), 0), cantidad_movimientos: movimientos.length } } };
  }

  async cajaAbierta() { return { estado: 'ok', resultado: await CajaChica.findOne({ where: { estado: 'ABIERTA', activo: true }, order: [['created_at', 'DESC']] }) }; }
  async buscarPorFecha(fecha) { return CajaChica.findAll({ where: { fecha, activo: true }, order: [['created_at', 'DESC']] }); }
  async listarMovimientos(cajaId) { return { estado: 'ok', resultado: await MovimientoChica.findAll({ where: { caja_chica_id: cajaId }, order: [['fecha', 'DESC'], ['id', 'DESC']] }) }; }
}
