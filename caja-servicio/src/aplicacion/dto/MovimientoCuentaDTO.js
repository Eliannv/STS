// caja-servicio/src/aplicacion/dto/MovimientoCuentaDTO.js
export default class MovimientoCuentaDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.cuentaId = datos.cuentaId ?? null;
    this.tipoMovimiento = datos.tipoMovimiento ?? null;
    this.monto = datos.monto ?? 0;
    this.saldoAnterior = datos.saldoAnterior ?? 0;
    this.saldoNuevo = datos.saldoNuevo ?? 0;
    this.metodoPago = datos.metodoPago ?? null;
    this.cajaTipo = datos.cajaTipo ?? null;
    this.cajaId = datos.cajaId ?? null;
    this.movimientoFinancieroId = datos.movimientoFinancieroId ?? null;
    this.referenciaTipo = datos.referenciaTipo ?? null;
    this.referenciaId = datos.referenciaId ?? null;
    this.referenciaCodigo = datos.referenciaCodigo ?? null;
    this.operacionId = datos.operacionId ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? null;
    this.movimientoRevertidoId = datos.movimientoRevertidoId ?? null;
    this.motivo = datos.motivo ?? null;
    this.observacion = datos.observacion ?? null;
    this.traceId = datos.traceId ?? null;
    this.usuarioId = datos.usuarioId ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? null;
    this.createdAt = datos.createdAt ?? null;
  }

  static fromEntidad(entidad) {
    if (!entidad) {
      return null;
    }

    return new MovimientoCuentaDTO({
      id: entidad.getId(),
      cuentaId: entidad.getCuentaId(),
      tipoMovimiento: entidad.getTipoMovimiento(),
      monto: entidad.getMonto(),
      saldoAnterior: entidad.getSaldoAnterior(),
      saldoNuevo: entidad.getSaldoNuevo(),
      metodoPago: entidad.getMetodoPago(),
      cajaTipo: entidad.getCajaTipo(),
      cajaId: entidad.getCajaId(),
      movimientoFinancieroId: entidad.getMovimientoFinancieroId(),
      referenciaTipo: entidad.getReferenciaTipo(),
      referenciaId: entidad.getReferenciaId(),
      referenciaCodigo: entidad.getReferenciaCodigo(),
      operacionId: entidad.getOperacionId(),
      idempotencyKey: entidad.getIdempotencyKey(),
      movimientoRevertidoId: entidad.getMovimientoRevertidoId(),
      motivo: entidad.getMotivo(),
      observacion: entidad.getObservacion(),
      traceId: entidad.getTraceId(),
      usuarioId: entidad.getUsuarioId(),
      usuarioNombre: entidad.getUsuarioNombre(),
      createdAt: entidad.getCreatedAt(),
    });
  }

  getId() { return this.id; }
  getCuentaId() { return this.cuentaId; }
  getTipoMovimiento() { return this.tipoMovimiento; }
  getMonto() { return this.monto; }
  getSaldoAnterior() { return this.saldoAnterior; }
  getSaldoNuevo() { return this.saldoNuevo; }
  getMetodoPago() { return this.metodoPago; }
  getCajaTipo() { return this.cajaTipo; }
  getCajaId() { return this.cajaId; }
  getMovimientoFinancieroId() { return this.movimientoFinancieroId; }
  getReferenciaTipo() { return this.referenciaTipo; }
  getReferenciaId() { return this.referenciaId; }
  getReferenciaCodigo() { return this.referenciaCodigo; }
  getOperacionId() { return this.operacionId; }
  getIdempotencyKey() { return this.idempotencyKey; }
  getMovimientoRevertidoId() { return this.movimientoRevertidoId; }
  getMotivo() { return this.motivo; }
  getObservacion() { return this.observacion; }
  getTraceId() { return this.traceId; }
  getUsuarioId() { return this.usuarioId; }
  getUsuarioNombre() { return this.usuarioNombre; }
  getCreatedAt() { return this.createdAt; }
}
