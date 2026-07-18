import sequelize from '../base-dato/Postgresql.js';
import CobroDeudaCommandSalidaPuerto from '../../aplicacion/puertos/salida/CobroDeudaCommandSalidaPuerto.js';
import { Factura, Deuda } from '../modelos/Modelos.js';

export default class CobroDeudaPgsCommandAdaptador extends CobroDeudaCommandSalidaPuerto {
  async registrarAbono(abono) {
    const transaction = await sequelize.transaction();
    try {
      const factura = await Factura.findOne({ where: { id: abono.facturaId }, transaction, lock: transaction.LOCK.UPDATE });
      if (!factura) { await transaction.rollback(); return { estado: 'error', resultado: 'Factura no encontrada' }; }
      const monto = Number(abono.montoPagado);
      const saldoActual = Number(factura.saldo_pendiente || 0);
      if (monto <= 0) { await transaction.rollback(); return { estado: 'error', resultado: 'El monto pagado debe ser mayor a 0' }; }
      if (monto > saldoActual) { await transaction.rollback(); return { estado: 'error', resultado: `Monto ${monto} excede saldo pendiente ${saldoActual}` }; }
      const saldoNuevo = Math.max(0, saldoActual - monto);
      const estado = saldoNuevo <= 0.01 ? 'PAGADA' : 'PENDIENTE';
      const abonoCreado = await Deuda.create({ factura_id: factura.id, factura_id_personalizado: factura.id_personalizado, cliente_id: factura.cliente_id, cliente_nombre: factura.cliente_nombre || 'Cliente', metodo_pago: abono.metodoPago, fecha_pago: abono.fechaPago, monto_pagado: monto, total_factura: factura.total, saldo_restante: saldoNuevo, estado_pago: estado, es_credito: factura.es_credito, usuario_id: abono.usuarioId, created_at: new Date() }, { transaction });
      await factura.update({ abonado: Number(factura.abonado || 0) + monto, saldo_pendiente: saldoNuevo, estado_pago: estado, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: { id: abonoCreado.id, factura, abono: abonoCreado, facturaCompleta: estado === 'PAGADA' } };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }

  async registrarMultipleAbonos(abonos) {
    const resultados = [];
    for (const abono of abonos) {
      const resultado = await this.registrarAbono(abono);
      resultados.push(resultado);
      if (resultado.estado !== 'ok') return { estado: 'error', resultado: resultados };
    }
    return { estado: 'ok', resultado: resultados };
  }
}
