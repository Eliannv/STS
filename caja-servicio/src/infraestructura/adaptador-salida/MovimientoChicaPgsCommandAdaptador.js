// caja-servicio/src/infraestructura/adaptador-salida/MovimientoChicaPgsCommandAdaptador.js
import sequelize from '../base-dato/Postgresql.js';
import MovimientoSalidaCommandPuerto from '../../aplicacion/puertos/salida/MovimientoSalidaCommandPuerto.js';
import MovimientoFinanciero from '../../dominio/entidades/MovimientoFinanciero.js';
import ModeloCajaChica from '../modelos/ModeloCajaChica.js';
import ModeloMovimientoChica from '../modelos/ModeloMovimientoChica.js';

const redondear = (valor) => parseFloat(Number(valor).toFixed(2));

const mapearEntidad = (modelo) => (
  modelo ? new MovimientoFinanciero(modelo.get({ plain: true })) : null
);

const movimientoDb = (movimiento, saldos) => ({
  caja_chica_id: movimiento.getCajaBancoId(),
  fecha: movimiento.getFecha() ?? movimiento.getFechaOperacion() ?? new Date(),
  tipo: movimiento.getTipo(),
  categoria: movimiento.getCategoria(),
  origen: movimiento.getOrigen(),
  descripcion: movimiento.getDescripcion() ?? movimiento.getMotivo() ?? 'Movimiento de Caja Chica',
  monto: movimiento.getMonto(),
  saldo_anterior: saldos.anterior,
  saldo_nuevo: saldos.nuevo,
  factura_id: movimiento.getVentaId(),
  referencia: movimiento.getReferenciaCodigo(),
  referencia_tipo: movimiento.getReferenciaTipo(),
  referencia_id: movimiento.getReferenciaId(),
  referencia_codigo: movimiento.getReferenciaCodigo(),
  operacion_id: movimiento.getOperacionId(),
  idempotency_key: movimiento.getIdempotencyKey(),
  movimiento_revertido_id: movimiento.getMovimientoRevertidoId(),
  motivo: movimiento.getMotivo(),
  observacion: movimiento.getObservacion(),
  trace_id: movimiento.getTraceId(),
  fecha_operacion: movimiento.getFechaOperacion() ?? new Date(),
  afecta_flujo_operativo: movimiento.getAfectaFlujoOperativo(),
  usuario_id: movimiento.getUsuarioId(),
  usuario_nombre: movimiento.getUsuarioNombre(),
  created_at: movimiento.getCreatedAt() ?? new Date(),
});

export default class MovimientoChicaPgsCommandAdaptador extends MovimientoSalidaCommandPuerto {
  async save(movimiento) {
    const idempotencyKey = movimiento.getIdempotencyKey();
    if (!idempotencyKey) {
      throw new Error('idempotency_key es requerido');
    }

    try {
      return await sequelize.transaction(async (transaction) => {
        const existente = await ModeloMovimientoChica.findOne({
          where: { idempotency_key: idempotencyKey },
          transaction,
        });
        if (existente) {
          return mapearEntidad(existente);
        }

        const caja = await ModeloCajaChica.findByPk(
          movimiento.getCajaBancoId(),
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );
        if (!caja || caja.activo !== true) {
          throw new Error('Caja Chica no encontrada');
        }
        if (caja.estado !== 'ABIERTA') {
          throw new Error('Caja cerrada');
        }

        const monto = redondear(movimiento.getMonto());
        if (!(monto > 0)) {
          throw new Error('El monto debe ser mayor que cero');
        }

        const saldoAnterior = redondear(caja.monto_actual ?? 0);
        const saldoNuevo = redondear(
          movimiento.getTipo() === 'INGRESO'
            ? saldoAnterior + monto
            : saldoAnterior - monto,
        );
        if (saldoNuevo < 0) {
          throw new Error('Saldo insuficiente');
        }

        const creado = await ModeloMovimientoChica.create(
          movimientoDb(movimiento, {
            anterior: saldoAnterior,
            nuevo: saldoNuevo,
          }),
          { transaction },
        );
        const afectaFlujo = movimiento.getAfectaFlujoOperativo() !== false;
        await caja.update(
          {
            monto_actual: saldoNuevo,
            ingresos_acumulados: redondear(
              Number(caja.ingresos_acumulados ?? 0)
              + (afectaFlujo && movimiento.getTipo() === 'INGRESO' ? monto : 0),
            ),
            egresos_acumulados: redondear(
              Number(caja.egresos_acumulados ?? 0)
              + (afectaFlujo && movimiento.getTipo() === 'EGRESO' ? monto : 0),
            ),
            total_movimientos: Number(caja.total_movimientos ?? 0) + 1,
            updated_at: new Date(),
          },
          { transaction },
        );

        return mapearEntidad(creado);
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const existente = await ModeloMovimientoChica.findOne({
          where: { idempotency_key: idempotencyKey },
        });
        if (existente) {
          return mapearEntidad(existente);
        }
      }

      throw error;
    }
  }
}
