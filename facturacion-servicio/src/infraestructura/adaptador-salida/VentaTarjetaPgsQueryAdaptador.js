import { Op } from 'sequelize';
import VentaTarjetaSalidaQueryPuerto from '../../aplicacion/puertos/salida/VentaTarjetaSalidaQueryPuerto.js';
import { VentaTarjeta, AbonoTarjeta } from '../modelos/Modelos.js';

export default class VentaTarjetaPgsQueryAdaptador extends VentaTarjetaSalidaQueryPuerto {
  async listarVentasTarjeta(filtros = {}) {
    const where = {};
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.clienteId) where.cliente_id = filtros.clienteId;
    if (filtros.banco) where.banco = { [Op.iLike]: `%${filtros.banco}%` };
    if (filtros.buscar) where[Op.or] = [{ factura_id_personalizado: { [Op.iLike]: `%${filtros.buscar}%` } }, { cliente_nombre: { [Op.iLike]: `%${filtros.buscar}%` } }];
    const ventas = await VentaTarjeta.findAll({ where, order: [['fecha_venta', 'DESC']], limit: 500 });
    const resultado = await Promise.all(ventas.map(async (venta) => ({
      ...venta.toJSON(),
      cantidad_abonos: await AbonoTarjeta.count({ where: { venta_tarjeta_id: venta.id } }),
      total_abonado_verificado: await AbonoTarjeta.sum('monto', { where: { venta_tarjeta_id: venta.id } }) || 0
    })));
    return { estado: 'ok', resultado };
  }

  async obtenerVentaTarjeta(id) {
    const venta = await VentaTarjeta.findByPk(id);
    if (!venta) return { estado: 'error', resultado: 'Venta tarjeta no encontrada' };
    return { estado: 'ok', resultado: {
      ...venta.toJSON(),
      cantidad_abonos: await AbonoTarjeta.count({ where: { venta_tarjeta_id: id } }),
      total_abonado_verificado: await AbonoTarjeta.sum('monto', { where: { venta_tarjeta_id: id } }) || 0
    } };
  }

  async historialAbonos(ventaTarjetaId) { return { estado: 'ok', resultado: await AbonoTarjeta.findAll({ where: { venta_tarjeta_id: ventaTarjetaId }, order: [['fecha', 'DESC']] }) }; }

  async resumenVentasTarjeta() {
    const ventas = await VentaTarjeta.findAll();
    return { estado: 'ok', resultado: { total_ventas: ventas.length, vendidas_pendientes: ventas.filter((v) => v.estado === 'PENDIENTE').length, vendidas_liquidadas: ventas.filter((v) => v.estado === 'LIQUIDADA').length, monto_total: ventas.reduce((s, v) => s + Number(v.monto_total || 0), 0), monto_recibido: ventas.reduce((s, v) => s + Number(v.monto_recibido || 0), 0), saldo_pendiente_total: ventas.reduce((s, v) => s + Number(v.saldo_pendiente || 0), 0) } };
  }
}
