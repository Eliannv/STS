// caja-servicio/src/dominio/servicios/MovimientoFinancieroDominioServicio.js
import MovimientoFinanciero from '../entidades/MovimientoFinanciero.js';

const CATEGORIAS_ANULACION = Object.freeze({
  VENTA_EFECTIVO: 'ANULACION_VENTA',
  VENTA_TRANSFERENCIA: 'ANULACION_VENTA',
  COBRO_DEUDA_EFECTIVO: 'ANULACION_COBRO',
  COBRO_DEUDA_TRANSFERENCIA: 'ANULACION_COBRO',
  ACREDITACION_TARJETA: 'ANULACION_VENTA',
  PAGO_PROVEEDOR: 'ANULACION_PAGO',
  PAGO_TRABAJADOR: 'ANULACION_PAGO',
});

export default class MovimientoFinancieroDominioServicio {
  validarCajaAbierta(caja) {
    if (caja.getEstado() !== 'ABIERTA') {
      throw new Error('Caja cerrada');
    }
  }

  validarSaldoSuficiente(caja, monto) {
    if (
      caja.getPermiteSaldoNegativo() === false
      && Number(caja.getSaldoActual()) < Number(monto)
    ) {
      throw new Error('Saldo insuficiente');
    }
  }

  calcularSaldoNuevo(saldoActual, tipo, monto) {
    const saldo = Number(saldoActual);
    const valor = Number(monto);

    if (tipo === 'INGRESO') {
      return parseFloat((saldo + valor).toFixed(2));
    }

    if (tipo === 'EGRESO') {
      return parseFloat((saldo - valor).toFixed(2));
    }

    throw new Error('Tipo de movimiento inválido');
  }

  construirMovimiento(params = {}) {
    const esAjusteManual =
      params.categoria === 'AJUSTE'
      && (params.origen === 'AJUSTE' || params.origen == null);
    return new MovimientoFinanciero({
      ...params,
      fecha_operacion: params.fechaOperacion ?? params.fecha_operacion ?? new Date(),
      afecta_flujo_operativo:
        params.afectaFlujoOperativo
        ?? params.afecta_flujo_operativo
        ?? !esAjusteManual,
    });
  }

  construirMovimientoApertura(
    cajaBanco,
    saldoInicial,
    usuarioId,
    usuarioNombre,
    operacionId,
    idempotencyKey,
  ) {
    if (!operacionId || !idempotencyKey) {
      throw new Error('operacion_id e idempotency_key son requeridos');
    }
    const saldo = parseFloat(Number(saldoInicial).toFixed(2));

    return this.construirMovimiento({
      caja_banco_id: cajaBanco.getId(),
      tipo: 'INGRESO',
      categoria: 'APERTURA',
      origen: 'CAJA',
      monto: saldo,
      saldo_anterior: 0,
      saldo_nuevo: saldo,
      descripcion: 'Apertura de Caja Banco',
      referencia_tipo: 'CAJA_BANCO',
      referencia_id: cajaBanco.getId(),
      referencia_codigo: cajaBanco.getPeriodo(),
      operacion_id: operacionId,
      idempotency_key: idempotencyKey,
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      afecta_flujo_operativo: false,
    });
  }

  construirParTransferencia(
    cajaOrigen,
    cajaDestino,
    monto,
    operacionId,
    usuarioId,
    usuarioNombre,
    idempotencyKeys = {},
  ) {
    if (!operacionId || !idempotencyKeys.salida || !idempotencyKeys.entrada) {
      throw new Error(
        'operacion_id e idempotency_keys.salida/entrada son requeridos',
      );
    }
    this.validarCajaAbierta(cajaOrigen);
    this.validarCajaAbierta(cajaDestino);
    this.validarSaldoSuficiente(cajaOrigen, monto);

    const valor = parseFloat(Number(monto).toFixed(2));
    const saldoOrigen = Number(cajaOrigen.getSaldoActual());
    const saldoDestino = Number(cajaDestino.getSaldoActual());

    const movimientoSalida = this.construirMovimiento({
      caja_banco_id: cajaOrigen.getId(),
      tipo: 'EGRESO',
      categoria: 'TRANSFERENCIA_SALIDA',
      origen: 'TRANSFERENCIA',
      monto: valor,
      saldo_anterior: saldoOrigen,
      saldo_nuevo: this.calcularSaldoNuevo(saldoOrigen, 'EGRESO', valor),
      descripcion: 'Transferencia de salida',
      referencia_tipo: 'TRANSFERENCIA',
      referencia_id: cajaDestino.getId(),
      operacion_id: operacionId,
      idempotency_key: idempotencyKeys.salida,
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
    });

    const movimientoEntrada = this.construirMovimiento({
      caja_banco_id: cajaDestino.getId(),
      tipo: 'INGRESO',
      categoria: 'TRANSFERENCIA_ENTRADA',
      origen: 'TRANSFERENCIA',
      monto: valor,
      saldo_anterior: saldoDestino,
      saldo_nuevo: this.calcularSaldoNuevo(saldoDestino, 'INGRESO', valor),
      descripcion: 'Transferencia de entrada',
      referencia_tipo: 'TRANSFERENCIA',
      referencia_id: cajaOrigen.getId(),
      operacion_id: operacionId,
      idempotency_key: idempotencyKeys.entrada,
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
    });

    return [movimientoSalida, movimientoEntrada];
  }

  construirReverso(
    movimientoOriginal,
    motivo,
    usuarioId,
    usuarioNombre,
    operacionId,
    idempotencyKey,
  ) {
    if (!operacionId || !idempotencyKey) {
      throw new Error('operacion_id e idempotency_key son requeridos');
    }
    const tipoOriginal = movimientoOriginal.getTipo();
    const tipoReverso = tipoOriginal === 'INGRESO' ? 'EGRESO' : 'INGRESO';
    const categoria = CATEGORIAS_ANULACION[movimientoOriginal.getCategoria()] ?? 'AJUSTE';

    return this.construirMovimiento({
      caja_banco_id: movimientoOriginal.getCajaBancoId(),
      tipo: tipoReverso,
      categoria,
      origen: 'AJUSTE',
      monto: movimientoOriginal.getMonto(),
      saldo_anterior: movimientoOriginal.getSaldoNuevo(),
      saldo_nuevo: movimientoOriginal.getSaldoAnterior(),
      descripcion: `Reverso de movimiento ${movimientoOriginal.getId()}`,
      referencia_tipo: movimientoOriginal.getReferenciaTipo(),
      referencia_id: movimientoOriginal.getReferenciaId(),
      referencia_codigo: movimientoOriginal.getReferenciaCodigo(),
      operacion_id: operacionId,
      idempotency_key: idempotencyKey,
      movimiento_revertido_id: movimientoOriginal.getId(),
      motivo,
      observacion: movimientoOriginal.getObservacion(),
      trace_id: movimientoOriginal.getTraceId(),
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      afecta_flujo_operativo: movimientoOriginal.getAfectaFlujoOperativo(),
    });
  }
}
