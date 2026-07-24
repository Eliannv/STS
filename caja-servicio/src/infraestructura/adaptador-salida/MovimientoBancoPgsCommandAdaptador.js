// caja-servicio/src/infraestructura/adaptador-salida/MovimientoBancoPgsCommandAdaptador.js
import { Op } from 'sequelize';
import sequelize from '../base-dato/Postgresql.js';
import MovimientoSalidaCommandPuerto from '../../aplicacion/puertos/salida/MovimientoSalidaCommandPuerto.js';
import MovimientoFinanciero from '../../dominio/entidades/MovimientoFinanciero.js';
import ModeloCajaBanco from '../modelos/ModeloCajaBanco.js';
import ModeloMovimientoBanco from '../modelos/ModeloMovimientoBanco.js';

const redondear = (valor) => parseFloat(Number(valor).toFixed(2));

const mapearEntidad = (modelo) => (
  modelo ? new MovimientoFinanciero(modelo.get({ plain: true })) : null
);

const movimientoDb = (movimiento, saldos) => ({
  caja_banco_id: movimiento.getCajaBancoId(),
  fecha: movimiento.getFecha() ?? movimiento.getFechaOperacion() ?? new Date(),
  tipo: movimiento.getTipo(),
  categoria: movimiento.getCategoria(),
  origen: movimiento.getOrigen(),
  monto: movimiento.getMonto(),
  saldo_anterior: saldos.anterior,
  saldo_nuevo: saldos.nuevo,
  descripcion: movimiento.getDescripcion(),
  referencia_tipo: movimiento.getReferenciaTipo(),
  referencia_id: movimiento.getReferenciaId(),
  referencia_codigo: movimiento.getReferenciaCodigo(),
  venta_id: movimiento.getVentaId(),
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

export default class MovimientoBancoPgsCommandAdaptador extends MovimientoSalidaCommandPuerto {
  async save(movimiento) {
    const idempotencyKey = movimiento.getIdempotencyKey();
    if (!idempotencyKey) {
      throw new Error('idempotency_key es requerido');
    }

    try {
      return await sequelize.transaction(async (transaction) => {
        const existente = await ModeloMovimientoBanco.findOne({
          where: { idempotency_key: idempotencyKey },
          transaction,
        });
        if (existente) {
          return mapearEntidad(existente);
        }

        const caja = await ModeloCajaBanco.findByPk(
          movimiento.getCajaBancoId(),
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );
        if (!caja || caja.activo !== true) {
          throw new Error('Caja Banco no encontrada');
        }
        if (caja.estado !== 'ABIERTA') {
          throw new Error('Caja cerrada');
        }

        const monto = redondear(movimiento.getMonto());
        if (!(monto > 0)) {
          throw new Error('El monto debe ser mayor que cero');
        }

        const saldoAnterior = redondear(caja.saldo_actual ?? 0);
        const saldoNuevo = redondear(
          movimiento.getTipo() === 'INGRESO'
            ? saldoAnterior + monto
            : saldoAnterior - monto,
        );
        if (saldoNuevo < 0 && caja.permite_saldo_negativo !== true) {
          throw new Error('Saldo insuficiente');
        }

        const creado = await ModeloMovimientoBanco.create(
          movimientoDb(movimiento, {
            anterior: saldoAnterior,
            nuevo: saldoNuevo,
          }),
          { transaction },
        );
        const afectaFlujo = movimiento.getAfectaFlujoOperativo() !== false;
        await caja.update(
          {
            saldo_actual: saldoNuevo,
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
        const existente = await ModeloMovimientoBanco.findOne({
          where: { idempotency_key: idempotencyKey },
        });
        if (existente) {
          return mapearEntidad(existente);
        }
      }

      throw error;
    }
  }

  async saveAll(movimientos) {
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      throw new Error('Se requiere al menos un movimiento');
    }
    const idempotencyKeys = movimientos.map(
      (movimiento) => movimiento.getIdempotencyKey(),
    );
    if (idempotencyKeys.some((key) => !key)) {
      throw new Error('idempotency_key es requerido en todos los movimientos');
    }
    const cajaId = movimientos[0].getCajaBancoId();
    if (movimientos.some((movimiento) => movimiento.getCajaBancoId() !== cajaId)) {
      throw new Error('Todos los movimientos deben pertenecer a la misma Caja Banco');
    }

    return sequelize.transaction(async (transaction) => {
      const caja = await ModeloCajaBanco.findByPk(cajaId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!caja || caja.activo !== true) {
        throw new Error('Caja Banco no encontrada');
      }
      if (caja.estado !== 'ABIERTA') {
        throw new Error('Caja cerrada');
      }

      const existentes = await ModeloMovimientoBanco.findAll({
        where: { idempotency_key: { [Op.in]: idempotencyKeys } },
        order: [['id', 'ASC']],
        transaction,
      });
      if (existentes.length === movimientos.length) {
        return existentes.map(mapearEntidad);
      }
      if (existentes.length > 0) {
        throw new Error('Lote financiero parcialmente registrado');
      }

      let saldo = redondear(caja.saldo_actual ?? 0);
      let deltaIngresos = 0;
      let deltaEgresos = 0;
      const creados = [];
      for (const movimiento of movimientos) {
        const monto = redondear(movimiento.getMonto());
        if (!(monto > 0)) {
          throw new Error('El monto debe ser mayor que cero');
        }
        const saldoAnterior = saldo;
        saldo = redondear(
          movimiento.getTipo() === 'INGRESO'
            ? saldoAnterior + monto
            : saldoAnterior - monto,
        );
        if (saldo < 0 && caja.permite_saldo_negativo !== true) {
          throw new Error('Saldo insuficiente');
        }

        const creado = await ModeloMovimientoBanco.create(
          movimientoDb(movimiento, {
            anterior: saldoAnterior,
            nuevo: saldo,
          }),
          { transaction },
        );
        creados.push(mapearEntidad(creado));
        if (movimiento.getAfectaFlujoOperativo() !== false) {
          if (movimiento.getTipo() === 'INGRESO') {
            deltaIngresos = redondear(deltaIngresos + monto);
          } else {
            deltaEgresos = redondear(deltaEgresos + monto);
          }
        }
      }

      await caja.update(
        {
          saldo_actual: saldo,
          ingresos_acumulados: redondear(
            Number(caja.ingresos_acumulados ?? 0) + deltaIngresos,
          ),
          egresos_acumulados: redondear(
            Number(caja.egresos_acumulados ?? 0) + deltaEgresos,
          ),
          total_movimientos:
            Number(caja.total_movimientos ?? 0) + movimientos.length,
          updated_at: new Date(),
        },
        { transaction },
      );
      return creados;
    });
  }
}
