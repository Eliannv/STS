import sequelize from '../base-dato/Postgresql.js';
import VentaTarjetaSalidaCommandPuerto from '../../aplicacion/puertos/salida/VentaTarjetaSalidaCommandPuerto.js';
import { VentaTarjeta, AbonoTarjeta } from '../modelos/Modelos.js';

export default class VentaTarjetaPgsCommandAdaptador extends VentaTarjetaSalidaCommandPuerto {
  async registrarAbono(dto) {
    const transaction = await sequelize.transaction();
    try {
      const venta = await VentaTarjeta.findOne({ where: { id: dto.ventaTarjetaId }, transaction, lock: transaction.LOCK.UPDATE });
      if (!venta) { await transaction.rollback(); return { estado: 'error', resultado: 'Venta con tarjeta no encontrada' }; }
      const saldo = Number(venta.saldo_pendiente || 0);
      if (dto.monto > saldo) { await transaction.rollback(); return { estado: 'error', resultado: `Monto ${dto.monto} excede saldo pendiente ${saldo}` }; }
      const nuevoSaldo = Math.max(0, saldo - dto.monto);
      const estado = nuevoSaldo <= 0.01 ? 'LIQUIDADA' : 'PENDIENTE';
      const abono = await AbonoTarjeta.create({ venta_tarjeta_id: venta.id, fecha: dto.fecha, monto: dto.monto, observacion: dto.observacion, created_at: new Date() }, { transaction });
      await venta.update({ monto_recibido: Number(venta.monto_recibido || 0) + dto.monto, saldo_pendiente: nuevoSaldo, estado, updated_at: new Date() }, { transaction });
      await transaction.commit();
      return { estado: 'ok', resultado: { id: abono.id, ventaTarjeta: venta, abono, ventaCompleta: estado === 'LIQUIDADA' } };
    } catch (error) {
      await transaction.rollback();
      return { estado: 'error', resultado: error.message };
    }
  }
}
