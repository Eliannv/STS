// caja-servicio/src/aplicacion/dto/MovimientoFinancieroDTO.js
export default class MovimientoFinancieroDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.cajaBancoId = datos.cajaBancoId ?? datos.caja_banco_id ?? null;
    this.fecha = datos.fecha ?? null;
    this.tipo = datos.tipo ?? null;
    this.categoria = datos.categoria ?? null;
    this.origen = datos.origen ?? null;
    this.monto = datos.monto ?? null;
    this.saldoAnterior = datos.saldoAnterior ?? datos.saldo_anterior ?? null;
    this.saldoNuevo = datos.saldoNuevo ?? datos.saldo_nuevo ?? null;
    this.descripcion = datos.descripcion ?? null;
    this.referenciaTipo = datos.referenciaTipo ?? datos.referencia_tipo ?? null;
    this.referenciaId = datos.referenciaId ?? datos.referencia_id ?? null;
    this.referenciaCodigo = datos.referenciaCodigo ?? datos.referencia_codigo ?? null;
    this.ventaId = datos.ventaId ?? datos.venta_id ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key ?? null;
    this.movimientoRevertidoId =
      datos.movimientoRevertidoId
      ?? datos.movimiento_revertido_id
      ?? null;
    this.motivo = datos.motivo ?? null;
    this.observacion = datos.observacion ?? null;
    this.traceId = datos.traceId ?? datos.trace_id ?? null;
    this.fechaOperacion = datos.fechaOperacion ?? datos.fecha_operacion ?? null;
    this.afectaFlujoOperativo =
      datos.afectaFlujoOperativo
      ?? datos.afecta_flujo_operativo
      ?? true;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
  }

  static fromEntidad(entidad) {
    if (!entidad) {
      return null;
    }

    return new MovimientoFinancieroDTO({
      id: entidad.getId(),
      cajaBancoId: entidad.getCajaBancoId(),
      fecha: entidad.getFecha(),
      tipo: entidad.getTipo(),
      categoria: entidad.getCategoria(),
      origen: entidad.getOrigen(),
      monto: entidad.getMonto(),
      saldoAnterior: entidad.getSaldoAnterior(),
      saldoNuevo: entidad.getSaldoNuevo(),
      descripcion: entidad.getDescripcion(),
      referenciaTipo: entidad.getReferenciaTipo(),
      referenciaId: entidad.getReferenciaId(),
      referenciaCodigo: entidad.getReferenciaCodigo(),
      ventaId: entidad.getVentaId(),
      operacionId: entidad.getOperacionId(),
      idempotencyKey: entidad.getIdempotencyKey(),
      movimientoRevertidoId: entidad.getMovimientoRevertidoId(),
      motivo: entidad.getMotivo(),
      observacion: entidad.getObservacion(),
      traceId: entidad.getTraceId(),
      fechaOperacion: entidad.getFechaOperacion(),
      afectaFlujoOperativo: entidad.getAfectaFlujoOperativo(),
      usuarioId: entidad.getUsuarioId(),
      usuarioNombre: entidad.getUsuarioNombre(),
      createdAt: entidad.getCreatedAt(),
    });
  }

  getId() {
    return this.id;
  }

  getCajaBancoId() {
    return this.cajaBancoId;
  }

  getFecha() {
    return this.fecha;
  }

  getTipo() {
    return this.tipo;
  }

  getCategoria() {
    return this.categoria;
  }

  getOrigen() {
    return this.origen;
  }

  getMonto() {
    return this.monto;
  }

  getSaldoAnterior() {
    return this.saldoAnterior;
  }

  getSaldoNuevo() {
    return this.saldoNuevo;
  }

  getDescripcion() {
    return this.descripcion;
  }

  getReferenciaTipo() {
    return this.referenciaTipo;
  }

  getReferenciaId() {
    return this.referenciaId;
  }

  getReferenciaCodigo() {
    return this.referenciaCodigo;
  }

  getVentaId() {
    return this.ventaId;
  }

  getOperacionId() {
    return this.operacionId;
  }

  getIdempotencyKey() {
    return this.idempotencyKey;
  }

  getMovimientoRevertidoId() {
    return this.movimientoRevertidoId;
  }

  getMotivo() {
    return this.motivo;
  }

  getObservacion() {
    return this.observacion;
  }

  getTraceId() {
    return this.traceId;
  }

  getFechaOperacion() {
    return this.fechaOperacion;
  }

  getAfectaFlujoOperativo() {
    return this.afectaFlujoOperativo;
  }

  getUsuarioId() {
    return this.usuarioId;
  }

  getUsuarioNombre() {
    return this.usuarioNombre;
  }

  getCreatedAt() {
    return this.createdAt;
  }
}
