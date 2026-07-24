// caja-servicio/src/infraestructura/adaptador-salida/CuentaPgsCommandAdaptador.js
import sequelize from '../base-dato/Postgresql.js';
import CuentaSalidaCommandPuerto from '../../aplicacion/puertos/salida/CuentaSalidaCommandPuerto.js';
import Cuenta from '../../dominio/entidades/Cuenta.js';
import MovimientoCuenta from '../../dominio/entidades/MovimientoCuenta.js';
import ModeloCuenta from '../modelos/ModeloCuenta.js';
import ModeloMovimientoCuenta from '../modelos/ModeloMovimientoCuenta.js';

const redondear = (valor) => parseFloat(Number(valor ?? 0).toFixed(2));

const mapearCuenta = (modelo) => (
  modelo ? new Cuenta(modelo.get({ plain: true })) : null
);

const mapearMovimiento = (modelo) => (
  modelo ? new MovimientoCuenta(modelo.get({ plain: true })) : null
);

const cuentaDb = (cuenta) => ({
  fecha: cuenta.getFecha(),
  tipo: cuenta.getTipo(),
  tipo_cuenta_por_pagar: cuenta.getTipoCuentaPorPagar(),
  monto_total: cuenta.getMontoTotal(),
  monto_abonado: cuenta.getMontoAbonado(),
  saldo: cuenta.getSaldo(),
  estado: cuenta.getEstado(),
  observacion: cuenta.getObservacion(),
  tercero_nombre: cuenta.getTerceroNombre(),
  tercero_id: cuenta.getTerceroId(),
  usuario_id: cuenta.getUsuarioId(),
  sucursal_id: cuenta.getSucursalId(),
  caja_banco_id: cuenta.getCajaBancoId(),
  origen: cuenta.getOrigen(),
  referencia_tipo: cuenta.getReferenciaTipo(),
  referencia_id: cuenta.getReferenciaId(),
  referencia_codigo: cuenta.getReferenciaCodigo(),
  tercero_tipo: cuenta.getTerceroTipo(),
  fecha_emision: cuenta.getFechaEmision(),
  fecha_vencimiento: cuenta.getFechaVencimiento(),
  moneda: cuenta.getMoneda(),
  usuario_nombre: cuenta.getUsuarioNombre(),
  operacion_id: cuenta.getOperacionId(),
  idempotency_key: cuenta.getIdempotencyKey(),
});

const movimientoDb = (movimiento) => ({
  cuenta_id: movimiento.getCuentaId(),
  tipo_movimiento: movimiento.getTipoMovimiento(),
  monto: movimiento.getMonto(),
  saldo_anterior: movimiento.getSaldoAnterior(),
  saldo_nuevo: movimiento.getSaldoNuevo(),
  metodo_pago: movimiento.getMetodoPago(),
  caja_tipo: movimiento.getCajaTipo(),
  caja_id: movimiento.getCajaId(),
  movimiento_financiero_id: movimiento.getMovimientoFinancieroId(),
  referencia_tipo: movimiento.getReferenciaTipo(),
  referencia_id: movimiento.getReferenciaId(),
  referencia_codigo: movimiento.getReferenciaCodigo(),
  operacion_id: movimiento.getOperacionId(),
  idempotency_key: movimiento.getIdempotencyKey(),
  movimiento_revertido_id: movimiento.getMovimientoRevertidoId(),
  motivo: movimiento.getMotivo(),
  observacion: movimiento.getObservacion(),
  trace_id: movimiento.getTraceId(),
  usuario_id: movimiento.getUsuarioId(),
  usuario_nombre: movimiento.getUsuarioNombre(),
  created_at: movimiento.getCreatedAt() ?? new Date(),
});

export default class CuentaPgsCommandAdaptador extends CuentaSalidaCommandPuerto {
  async save(cuenta) {
    return sequelize.transaction(async (transaction) => {
      if (cuenta.getIdempotencyKey()) {
        const existente = await ModeloCuenta.findOne({
          where: { idempotency_key: cuenta.getIdempotencyKey() },
          transaction,
        });
        if (existente) {
          return mapearCuenta(existente);
        }
      }

      const creada = await ModeloCuenta.create(
        {
          ...cuentaDb(cuenta),
          created_at: cuenta.getCreatedAt() ?? new Date(),
          updated_at: cuenta.getUpdatedAt() ?? new Date(),
        },
        { transaction },
      );
      return mapearCuenta(creada);
    });
  }

  async updateSaldo(id, saldoNuevo, montoAbonado, estado) {
    return sequelize.transaction(async (transaction) => {
      const cuenta = await ModeloCuenta.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!cuenta) {
        throw new Error('Cuenta no encontrada');
      }
      await cuenta.update(
        {
          saldo: redondear(saldoNuevo),
          monto_abonado: redondear(montoAbonado),
          estado,
          updated_at: new Date(),
        },
        { transaction },
      );
      return mapearCuenta(cuenta);
    });
  }

  async saveMovimiento(movimiento, cuentaActualizada = null) {
    const idempotencyKey = movimiento.getIdempotencyKey();
    if (!idempotencyKey) {
      throw new Error('idempotency_key es requerido');
    }

    return sequelize.transaction(async (transaction) => {
      const existente = await ModeloMovimientoCuenta.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction,
      });
      if (existente) {
        return mapearMovimiento(existente);
      }

      const cuenta = await ModeloCuenta.findByPk(movimiento.getCuentaId(), {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!cuenta) {
        throw new Error('Cuenta no encontrada');
      }

      const creado = await ModeloMovimientoCuenta.create(
        movimientoDb(movimiento),
        { transaction },
      );

      if (movimiento.getTipoMovimiento() !== 'CREACION') {
        const saldoNuevo = redondear(movimiento.getSaldoNuevo());
        const montoAbonado = cuentaActualizada
          ? redondear(cuentaActualizada.getMontoAbonado())
          : redondear(Number(cuenta.monto_total) - saldoNuevo);
        const estado = cuentaActualizada?.getEstado()
          ?? (saldoNuevo === 0 ? 'PAGADA' : 'PARCIAL');
        await cuenta.update(
          {
            saldo: saldoNuevo,
            monto_abonado: montoAbonado,
            estado,
            updated_at: new Date(),
          },
          { transaction },
        );
      }

      return mapearMovimiento(creado);
    });
  }

  async crear(cuenta) {
    return { estado: 'ok', resultado: await this.save(cuenta) };
  }

  actualizar() {
    return Promise.resolve({
      estado: 'error',
      resultado: 'La actualización general de cuentas no está permitida',
    });
  }

  cancelar() {
    return Promise.resolve({
      estado: 'error',
      resultado: 'La cuenta debe anularse mediante una operación financiera',
    });
  }
}
