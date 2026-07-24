// caja-servicio/src/dominio/servicios/CuentaDominioServicio.js
import Cuenta from '../entidades/Cuenta.js';
import MovimientoCuenta from '../entidades/MovimientoCuenta.js';

const redondear = (valor) => parseFloat(Number(valor).toFixed(2));

const validarMontoPositivo = (monto) => {
  const valor = redondear(monto);
  if (!(valor > 0)) {
    throw new Error('El monto debe ser mayor que cero');
  }
  return valor;
};

export default class CuentaDominioServicio {
  construirCuentaCobrar(params = {}) {
    const montoTotal = redondear(
      params.montoTotal
      ?? params.monto_total
      ?? 0,
    );
    const montoAbonado = redondear(
      params.montoAbonado
      ?? params.monto_abonado
      ?? params.montoCobrado
      ?? params.monto_cobrado
      ?? 0,
    );
    const saldo = redondear(
      params.saldo
      ?? params.montoCredito
      ?? params.monto_credito
      ?? Math.max(0, montoTotal - montoAbonado),
    );

    return new Cuenta({
      ...params,
      fecha: params.fecha ?? params.fechaEmision ?? params.fecha_emision ?? new Date(),
      tipo: 'COBRAR',
      montoTotal,
      montoAbonado,
      saldo,
      estado: 'PENDIENTE',
      origen: params.origen ?? 'FACTURACION',
      terceroTipo: params.terceroTipo ?? params.tercero_tipo ?? 'CLIENTE',
      fechaEmision:
        params.fechaEmision
        ?? params.fecha_emision
        ?? params.fecha
        ?? new Date(),
      moneda: params.moneda ?? 'USD',
      observacion:
        params.observacion
        ?? `Cuenta por cobrar ${params.referenciaCodigo ?? params.referencia_codigo ?? ''}`.trim(),
    });
  }

  construirCuentaPagar(params = {}) {
    const montoTotal = validarMontoPositivo(
      params.montoTotal
      ?? params.monto_total,
    );

    return new Cuenta({
      ...params,
      fecha: params.fecha ?? params.fechaEmision ?? params.fecha_emision ?? new Date(),
      tipo: 'PAGAR',
      tipoCuentaPorPagar:
        params.tipoCuentaPorPagar
        ?? params.tipo_cuenta_por_pagar
        ?? 'Deuda',
      montoTotal,
      montoAbonado: 0,
      saldo: montoTotal,
      estado: 'PENDIENTE',
      origen: params.origen ?? 'INVENTARIO',
      terceroTipo: params.terceroTipo ?? params.tercero_tipo ?? 'PROVEEDOR',
      fechaEmision:
        params.fechaEmision
        ?? params.fecha_emision
        ?? params.fecha
        ?? new Date(),
      moneda: params.moneda ?? 'USD',
      observacion:
        params.observacion
        ?? `Cuenta por pagar ${params.referenciaCodigo ?? params.referencia_codigo ?? ''}`.trim(),
    });
  }

  construirMovimientoCuenta(
    cuenta,
    tipo,
    monto,
    operacionId,
    usuarioId,
    usuarioNombre,
    extra = {},
  ) {
    const valor = validarMontoPositivo(monto);
    const saldoCuenta = redondear(cuenta.getSaldo());
    let saldoAnterior = saldoCuenta;
    let saldoNuevo = saldoCuenta;

    if (tipo === 'CREACION') {
      saldoAnterior = 0;
      saldoNuevo = saldoCuenta;
    } else if (['ABONO', 'PAGO', 'ANULACION'].includes(tipo)) {
      saldoNuevo = redondear(Math.max(0, saldoAnterior - valor));
    } else if (tipo === 'REVERSO') {
      saldoNuevo = redondear(saldoAnterior + valor);
    } else if (tipo === 'AJUSTE') {
      if (extra.saldoNuevo === undefined && extra.saldo_nuevo === undefined) {
        throw new Error('El saldo nuevo es requerido para un ajuste');
      }
      saldoNuevo = redondear(extra.saldoNuevo ?? extra.saldo_nuevo);
    } else {
      throw new Error('Tipo de movimiento de cuenta inválido');
    }

    return new MovimientoCuenta({
      ...extra,
      cuentaId: cuenta.getId(),
      tipoMovimiento: tipo,
      monto: valor,
      saldoAnterior,
      saldoNuevo,
      referenciaTipo:
        extra.referenciaTipo
        ?? extra.referencia_tipo
        ?? cuenta.getReferenciaTipo(),
      referenciaId:
        extra.referenciaId
        ?? extra.referencia_id
        ?? cuenta.getReferenciaId(),
      referenciaCodigo:
        extra.referenciaCodigo
        ?? extra.referencia_codigo
        ?? cuenta.getReferenciaCodigo(),
      operacionId,
      usuarioId,
      usuarioNombre,
    });
  }

  aplicarAbono(cuenta, monto) {
    this.validarCuentaActiva(cuenta);
    const valor = validarMontoPositivo(monto);
    const saldoActual = redondear(cuenta.getSaldo());
    if (valor > saldoActual) {
      throw new Error('El abono no puede superar el saldo pendiente');
    }

    const saldoNuevo = redondear(saldoActual - valor);
    const montoAbonado = redondear(
      Number(cuenta.getMontoAbonado()) + valor,
    );
    cuenta.setSaldo(saldoNuevo);
    cuenta.setMontoAbonado(montoAbonado);

    if (saldoNuevo === 0) {
      cuenta.setEstado('PAGADA');
    } else if (saldoNuevo < Number(cuenta.getMontoTotal())) {
      cuenta.setEstado('PARCIAL');
    } else {
      cuenta.setEstado('PENDIENTE');
    }

    return cuenta;
  }

  aplicarPago(cuenta, monto) {
    if (cuenta.getTipo() !== 'PAGAR') {
      throw new Error('La cuenta no es una cuenta por pagar');
    }
    return this.aplicarAbono(cuenta, monto);
  }

  validarCuentaActiva(cuenta) {
    if (['PAGADA', 'ANULADA', 'VENCIDA'].includes(cuenta.getEstado())) {
      throw new Error('La cuenta no admite movimientos');
    }
  }

  construirAnulacion(cuenta, motivo, usuarioId, usuarioNombre = null, extra = {}) {
    this.validarCuentaActiva(cuenta);
    if (!motivo) {
      throw new Error('El motivo es requerido');
    }

    return this.construirMovimientoCuenta(
      cuenta,
      'ANULACION',
      cuenta.getSaldo(),
      extra.operacionId ?? extra.operacion_id ?? null,
      usuarioId,
      usuarioNombre,
      {
        ...extra,
        motivo,
        observacion:
          extra.observacion
          ?? `Anulación de cuenta por ${cuenta.getTipo() === 'PAGAR' ? 'pagar' : 'cobrar'}`,
      },
    );
  }
}
