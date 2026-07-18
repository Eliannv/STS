import sequelize from '../base-dato/Postgresql.js';
import CajaChicaSalidaCommandPuerto from '../../aplicacion/puertos/salida/CajaChicaSalidaCommandPuerto.js';
import { CajaChica, MovimientoChica } from '../modelos/Modelos.js';

const cajaDb = (caja) => ({ fecha: caja.fecha, monto_inicial: caja.montoInicial, monto_actual: caja.montoActual, estado: caja.estado, usuario_id: caja.usuarioId, usuario_nombre: caja.usuarioNombre, observacion: caja.observacion, activo: caja.activo, caja_banco_id: caja.cajaBancoId, updated_at: new Date() });

export default class CajaChicaPgsCommandAdaptador extends CajaChicaSalidaCommandPuerto {
  async abrir(caja) { try { return { estado: 'ok', resultado: await CajaChica.create({ ...cajaDb(caja), created_at: new Date() }) }; } catch (error) { return { estado: 'error', resultado: error.message }; } }

  async cerrar(id, datos) {
    const transaction = await sequelize.transaction();
    try {
      const caja = await CajaChica.findOne({ where: { id, activo: true }, transaction, lock: transaction.LOCK.UPDATE });
      if (!caja) { await transaction.rollback(); return { estado: 'error', resultado: 'Caja chica no encontrada' }; }
      if (caja.estado === 'CERRADA') { await transaction.rollback(); return { estado: 'error', resultado: 'La caja chica ya está cerrada' }; }
      await caja.update({ estado: 'CERRADA', cerrado_en: datos.cerradoEn, cerrado_por_id: datos.cerradoPorId, cerrado_por_nombre: datos.cerradoPorNombre, caja_banco_id: datos.cajaBancoId, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: caja };
    } catch (error) { await transaction.rollback(); return { estado: 'error', resultado: error.message }; }
  }

  async registrarMovimiento(movimiento) {
    const transaction = await sequelize.transaction();
    try {
      const caja = await CajaChica.findOne({ where: { id: movimiento.cajaChicaId, activo: true }, transaction, lock: transaction.LOCK.UPDATE });
      if (!caja) { await transaction.rollback(); return { estado: 'error', resultado: 'Caja chica no encontrada' }; }
      if (caja.estado === 'CERRADA') { await transaction.rollback(); return { estado: 'error', resultado: 'No se puede registrar en una caja cerrada' }; }
      const anterior = Number(caja.monto_actual || 0);
      const monto = Number(movimiento.monto);
      const nuevo = movimiento.tipo === 'INGRESO' ? anterior + monto : Math.max(0, anterior - monto);
      const mov = await MovimientoChica.create({ caja_chica_id: caja.id, fecha: movimiento.fecha || new Date(), tipo: movimiento.tipo, descripcion: movimiento.descripcion, monto, saldo_anterior: anterior, saldo_nuevo: nuevo, factura_id: movimiento.facturaId, usuario_id: movimiento.usuarioId, usuario_nombre: movimiento.usuarioNombre, referencia: movimiento.referencia, created_at: new Date() }, { transaction });
      await caja.update({ monto_actual: nuevo, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: mov };
    } catch (error) { await transaction.rollback(); return { estado: 'error', resultado: error.message }; }
  }

  async eliminarMovimiento(id) {
    const transaction = await sequelize.transaction();
    try {
      const mov = await MovimientoChica.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!mov) { await transaction.rollback(); return { estado: 'error', resultado: 'Movimiento no encontrado' }; }
      const caja = await CajaChica.findByPk(mov.caja_chica_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!caja || caja.estado === 'CERRADA') { await transaction.rollback(); return { estado: 'error', resultado: 'No se puede modificar una caja cerrada' }; }
      const saldo = mov.tipo === 'INGRESO' ? Math.max(0, Number(caja.monto_actual) - Number(mov.monto)) : Number(caja.monto_actual) + Number(mov.monto);
      await mov.destroy({ transaction });
      await caja.update({ monto_actual: saldo, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: { movimientoId: id, saldoRevertido: saldo } };
    } catch (error) { await transaction.rollback(); return { estado: 'error', resultado: error.message }; }
  }
}
