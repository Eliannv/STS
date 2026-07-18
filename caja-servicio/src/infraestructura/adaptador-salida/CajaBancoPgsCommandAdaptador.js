import sequelize from '../base-dato/Postgresql.js';
import CajaBancoSalidaCommandPuerto from '../../aplicacion/puertos/salida/CajaBancoSalidaCommandPuerto.js';
import { CajaBanco, MovimientoBanco } from '../modelos/Modelos.js';

const cajaDb = (caja) => ({ fecha: caja.fecha, saldo_inicial: caja.saldoInicial, saldo_actual: caja.saldoActual, estado: caja.estado, usuario_id: caja.usuarioId, usuario_nombre: caja.usuarioNombre, observacion: caja.observacion, activo: caja.activo, updated_at: new Date() });

export default class CajaBancoPgsCommandAdaptador extends CajaBancoSalidaCommandPuerto {
  async abrir(caja) { try { return { estado: 'ok', resultado: await CajaBanco.create({ ...cajaDb(caja), created_at: new Date() }) }; } catch (error) { return { estado: 'error', resultado: error.message }; } }

  async cerrar(id, datos) {
    const transaction = await sequelize.transaction();
    try {
      const caja = await CajaBanco.findOne({ where: { id, activo: true }, transaction, lock: transaction.LOCK.UPDATE });
      if (!caja) { await transaction.rollback(); return { estado: 'error', resultado: 'Caja banco no encontrada' }; }
      if (caja.estado === 'CERRADA') { await transaction.rollback(); return { estado: 'error', resultado: 'La caja banco ya está cerrada' }; }
      await caja.update({ estado: 'CERRADA', cerrado_en: datos.cerradoEn, cerrado_por_id: datos.cerradoPorId, cerrado_por_nombre: datos.cerradoPorNombre, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: caja };
    } catch (error) { await transaction.rollback(); return { estado: 'error', resultado: error.message }; }
  }

  async registrarMovimiento(movimiento) {
    const transaction = await sequelize.transaction();
    try {
      const caja = await CajaBanco.findOne({ where: { id: movimiento.cajaBancoId, activo: true }, transaction, lock: transaction.LOCK.UPDATE });
      if (!caja) { await transaction.rollback(); return { estado: 'error', resultado: 'Caja banco no encontrada' }; }
      if (caja.estado === 'CERRADA') { await transaction.rollback(); return { estado: 'error', resultado: 'No se puede registrar en una caja cerrada' }; }
      const anterior = Number(caja.saldo_actual || 0);
      const monto = Number(movimiento.monto);
      const nuevo = movimiento.tipo === 'INGRESO' ? anterior + monto : Math.max(0, anterior - monto);
      const mov = await MovimientoBanco.create({ caja_banco_id: caja.id, fecha: movimiento.fecha || new Date(), tipo: movimiento.tipo, categoria: movimiento.categoria, monto, saldo_anterior: anterior, saldo_nuevo: nuevo, descripcion: movimiento.descripcion, referencia_id: movimiento.referenciaId, venta_id: movimiento.ventaId, usuario_id: movimiento.usuarioId, usuario_nombre: movimiento.usuarioNombre, created_at: new Date() }, { transaction });
      await caja.update({ saldo_actual: nuevo, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: mov };
    } catch (error) { await transaction.rollback(); return { estado: 'error', resultado: error.message }; }
  }

  async eliminarMovimiento(id) {
    const transaction = await sequelize.transaction();
    try {
      const mov = await MovimientoBanco.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!mov) { await transaction.rollback(); return { estado: 'error', resultado: 'Movimiento no encontrado' }; }
      const caja = await CajaBanco.findByPk(mov.caja_banco_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!caja || caja.estado === 'CERRADA') { await transaction.rollback(); return { estado: 'error', resultado: 'No se puede modificar una caja cerrada' }; }
      const saldo = mov.tipo === 'INGRESO' ? Math.max(0, Number(caja.saldo_actual) - Number(mov.monto)) : Number(caja.saldo_actual) + Number(mov.monto);
      await mov.destroy({ transaction });
      await caja.update({ saldo_actual: saldo, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: { movimientoId: id, saldoRevertido: saldo } };
    } catch (error) { await transaction.rollback(); return { estado: 'error', resultado: error.message }; }
  }
}
