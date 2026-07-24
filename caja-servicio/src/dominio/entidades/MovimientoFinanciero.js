// caja-servicio/src/dominio/entidades/MovimientoFinanciero.js
export default class MovimientoFinanciero {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.cajaBancoId =
      datos.cajaBancoId
      ?? datos.caja_banco_id
      ?? datos.caja_chica_id
      ?? null;
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
    this.referenciaCodigo =
      datos.referenciaCodigo
      ?? datos.referencia_codigo
      ?? datos.referencia
      ?? null;
    this.ventaId = datos.ventaId ?? datos.venta_id ?? datos.factura_id ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key ?? null;
    this.movimientoRevertidoId = datos.movimientoRevertidoId ?? datos.movimiento_revertido_id ?? null;
    this.motivo = datos.motivo ?? null;
    this.observacion = datos.observacion ?? null;
    this.traceId = datos.traceId ?? datos.trace_id ?? null;
    this.fechaOperacion = datos.fechaOperacion ?? datos.fecha_operacion ?? null;
    this.afectaFlujoOperativo = datos.afectaFlujoOperativo ?? datos.afecta_flujo_operativo ?? true;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
  }

  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  getCajaBancoId() {
    return this.cajaBancoId;
  }

  setCajaBancoId(cajaBancoId) {
    this.cajaBancoId = cajaBancoId;
  }

  getFecha() {
    return this.fecha;
  }

  setFecha(fecha) {
    this.fecha = fecha;
  }

  getTipo() {
    return this.tipo;
  }

  setTipo(tipo) {
    this.tipo = tipo;
  }

  getCategoria() {
    return this.categoria;
  }

  setCategoria(categoria) {
    this.categoria = categoria;
  }

  getOrigen() {
    return this.origen;
  }

  setOrigen(origen) {
    this.origen = origen;
  }

  getMonto() {
    return this.monto;
  }

  setMonto(monto) {
    this.monto = monto;
  }

  getSaldoAnterior() {
    return this.saldoAnterior;
  }

  setSaldoAnterior(saldoAnterior) {
    this.saldoAnterior = saldoAnterior;
  }

  getSaldoNuevo() {
    return this.saldoNuevo;
  }

  setSaldoNuevo(saldoNuevo) {
    this.saldoNuevo = saldoNuevo;
  }

  getDescripcion() {
    return this.descripcion;
  }

  setDescripcion(descripcion) {
    this.descripcion = descripcion;
  }

  getReferenciaTipo() {
    return this.referenciaTipo;
  }

  setReferenciaTipo(referenciaTipo) {
    this.referenciaTipo = referenciaTipo;
  }

  getReferenciaId() {
    return this.referenciaId;
  }

  setReferenciaId(referenciaId) {
    this.referenciaId = referenciaId;
  }

  getReferenciaCodigo() {
    return this.referenciaCodigo;
  }

  setReferenciaCodigo(referenciaCodigo) {
    this.referenciaCodigo = referenciaCodigo;
  }

  getVentaId() {
    return this.ventaId;
  }

  setVentaId(ventaId) {
    this.ventaId = ventaId;
  }

  getOperacionId() {
    return this.operacionId;
  }

  setOperacionId(operacionId) {
    this.operacionId = operacionId;
  }

  getIdempotencyKey() {
    return this.idempotencyKey;
  }

  setIdempotencyKey(idempotencyKey) {
    this.idempotencyKey = idempotencyKey;
  }

  getMovimientoRevertidoId() {
    return this.movimientoRevertidoId;
  }

  setMovimientoRevertidoId(movimientoRevertidoId) {
    this.movimientoRevertidoId = movimientoRevertidoId;
  }

  getMotivo() {
    return this.motivo;
  }

  setMotivo(motivo) {
    this.motivo = motivo;
  }

  getObservacion() {
    return this.observacion;
  }

  setObservacion(observacion) {
    this.observacion = observacion;
  }

  getTraceId() {
    return this.traceId;
  }

  setTraceId(traceId) {
    this.traceId = traceId;
  }

  getFechaOperacion() {
    return this.fechaOperacion;
  }

  setFechaOperacion(fechaOperacion) {
    this.fechaOperacion = fechaOperacion;
  }

  getAfectaFlujoOperativo() {
    return this.afectaFlujoOperativo;
  }

  setAfectaFlujoOperativo(afectaFlujoOperativo) {
    this.afectaFlujoOperativo = afectaFlujoOperativo;
  }

  getUsuarioId() {
    return this.usuarioId;
  }

  setUsuarioId(usuarioId) {
    this.usuarioId = usuarioId;
  }

  getUsuarioNombre() {
    return this.usuarioNombre;
  }

  setUsuarioNombre(usuarioNombre) {
    this.usuarioNombre = usuarioNombre;
  }

  getCreatedAt() {
    return this.createdAt;
  }

  setCreatedAt(createdAt) {
    this.createdAt = createdAt;
  }
}
