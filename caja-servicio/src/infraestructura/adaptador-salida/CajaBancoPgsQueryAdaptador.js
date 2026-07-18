import { Op } from 'sequelize';
import CajaBancoSalidaQueryPuerto from '../../aplicacion/puertos/salida/CajaBancoSalidaQueryPuerto.js';
import { CajaBanco, MovimientoBanco } from '../modelos/Modelos.js';

export default class CajaBancoPgsQueryAdaptador extends CajaBancoSalidaQueryPuerto {
  async lista({ estado, fechaDesde, fechaHasta, limit = 20, offset = 0 } = {}) {
    const where = { activo: true };
    if (estado) where.estado = estado;
    if (fechaDesde || fechaHasta) where.fecha = { ...(fechaDesde ? { [Op.gte]: fechaDesde } : {}), ...(fechaHasta ? { [Op.lte]: fechaHasta } : {}) };
    return { estado: 'ok', resultado: await CajaBanco.findAll({ where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 20, 100), offset: Math.max(Number(offset) || 0, 0) }) };
  }

  async buscarPorId(id) {
    const caja = await CajaBanco.findOne({ where: { id, activo: true } });
    if (!caja) return { estado: 'error', resultado: 'Caja banco no encontrada' };
    const movimientos = await MovimientoBanco.findAll({ where: { caja_banco_id: id } });
    return { estado: 'ok', resultado: { ...caja.toJSON(), resumen: { total_ingresos: movimientos.filter((m) => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto || 0), 0), total_egresos: movimientos.filter((m) => m.tipo === 'EGRESO').reduce((s, m) => s + Number(m.monto || 0), 0), cantidad_movimientos: movimientos.length } } };
  }

  async cajaAbierta() { return { estado: 'ok', resultado: await CajaBanco.findOne({ where: { estado: 'ABIERTA', activo: true }, order: [['created_at', 'DESC']] }) }; }
  async buscarPorMes(mes) {
    const inicio = new Date(`${mes}-01T00:00:00Z`);
    const fin = new Date(inicio);
    fin.setUTCMonth(fin.getUTCMonth() + 1);
    return CajaBanco.findAll({ where: { activo: true, fecha: { [Op.gte]: inicio, [Op.lt]: fin } }, order: [['created_at', 'DESC']] });
  }
  async listarMovimientos(cajaId) { return { estado: 'ok', resultado: await MovimientoBanco.findAll({ where: { caja_banco_id: cajaId }, order: [['fecha', 'DESC'], ['id', 'DESC']] }) }; }
  async buscarMovimientoPorVentaId(ventaId) { return { estado: 'ok', resultado: await MovimientoBanco.findAll({ where: { venta_id: ventaId }, order: [['created_at', 'DESC']] }) }; }
}
