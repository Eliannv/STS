import { Op } from 'sequelize';
import CobroDeudaQuerySalidaPuerto from '../../aplicacion/puertos/salida/CobroDeudaQuerySalidaPuerto.js';
import { Factura, Deuda } from '../modelos/Modelos.js';

export default class CobroDeudaPgsQueryAdaptador extends CobroDeudaQuerySalidaPuerto {
  async facturasPendientes(clienteId = null, filtros = {}) {
    const where = { estado_pago: 'PENDIENTE', saldo_pendiente: { [Op.gt]: 0 } };
    if (clienteId) where.cliente_id = clienteId;
    if (filtros.buscar) where[Op.or] = [{ id_personalizado: { [Op.iLike]: `%${filtros.buscar}%` } }, { cliente_nombre: { [Op.iLike]: `%${filtros.buscar}%` } }];
    const resultado = await Factura.findAll({ where, order: [['created_at', 'DESC']], limit: 500 });
    return { estado: 'ok', resultado };
  }

  async abonosPorFactura(facturaId) { return { estado: 'ok', resultado: await Deuda.findAll({ where: { factura_id: facturaId }, order: [['fecha_pago', 'DESC']] }) }; }
  async abonoPorId(id) { const resultado = await Deuda.findByPk(id); return resultado ? { estado: 'ok', resultado } : { estado: 'error', resultado: 'Abono no encontrado' }; }

  async resumenClienteDeuda(clienteId) {
    const facturas = await Factura.findAll({ where: { cliente_id: clienteId } });
    const abonos = await Deuda.findAll({ where: { cliente_id: clienteId } });
    return { estado: 'ok', resultado: { facturas_pendientes: facturas.filter((f) => f.estado_pago === 'PENDIENTE').length, monto_total_deuda: facturas.filter((f) => f.estado_pago === 'PENDIENTE').reduce((s, f) => s + Number(f.total || 0), 0), monto_total_pagado: facturas.reduce((s, f) => s + Number(f.abonado || 0), 0), monto_saldo_pendiente: facturas.reduce((s, f) => s + Number(f.saldo_pendiente || 0), 0), total_abonos_registrados: abonos.length, ultimo_abono_fecha: abonos[0]?.fecha_pago ?? null, total_cobrado: abonos.reduce((s, a) => s + Number(a.monto_pagado || 0), 0) } };
  }

  async listaAbonos(filtros = {}) {
    const where = {};
    if (filtros.clienteId) where.cliente_id = filtros.clienteId;
    if (filtros.metodoPago) where.metodo_pago = filtros.metodoPago;
    if (filtros.buscar) where[Op.or] = [{ cliente_nombre: { [Op.iLike]: `%${filtros.buscar}%` } }, { factura_id_personalizado: { [Op.iLike]: `%${filtros.buscar}%` } }];
    return { estado: 'ok', resultado: await Deuda.findAll({ where, order: [['fecha_pago', 'DESC']], limit: 1000 }) };
  }

  async deudasPaginadas(offset = 0, limite = 5) {
    const where = { estado_pago: 'PENDIENTE', saldo_pendiente: { [Op.gt]: 0 } };
    const resultado = await Factura.findAll({ where, order: [['fecha', 'DESC'], ['created_at', 'DESC']], limit: limite, offset });
    const total = await Factura.count({ where });
    return { estado: 'ok', resultado, total, offset, limite };
  }
}
