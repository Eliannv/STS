// caja-servicio/src/dominio/entidades/MovimientoCuenta.js
export default class MovimientoCuenta {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.cuentaId = datos.cuentaId ?? datos.cuenta_id ?? null;
    this.tipoMovimiento =
      datos.tipoMovimiento
      ?? datos.tipo_movimiento
      ?? null;
    this.monto = datos.monto ?? null;
    this.saldoAnterior = datos.saldoAnterior ?? datos.saldo_anterior ?? null;
    this.saldoNuevo = datos.saldoNuevo ?? datos.saldo_nuevo ?? null;
    this.metodoPago = datos.metodoPago ?? datos.metodo_pago ?? null;
    this.cajaTipo = datos.cajaTipo ?? datos.caja_tipo ?? null;
    this.cajaId = datos.cajaId ?? datos.caja_id ?? null;
    this.movimientoFinancieroId =
      datos.movimientoFinancieroId
      ?? datos.movimiento_financiero_id
      ?? null;
    this.referenciaTipo =
      datos.referenciaTipo
      ?? datos.referencia_tipo
      ?? null;
    this.referenciaId = datos.referenciaId ?? datos.referencia_id ?? null;
    this.referenciaCodigo =
      datos.referenciaCodigo
      ?? datos.referencia_codigo
      ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
    this.idempotencyKey =
      datos.idempotencyKey
      ?? datos.idempotency_key
      ?? null;
    this.movimientoRevertidoId =
      datos.movimientoRevertidoId
      ?? datos.movimiento_revertido_id
      ?? null;
    this.motivo = datos.motivo ?? null;
    this.observacion = datos.observacion ?? null;
    this.traceId = datos.traceId ?? datos.trace_id ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre =
      datos.usuarioNombre
      ?? datos.usuario_nombre
      ?? null;
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
  }

  getId() {
    return this.id;
  }

  getCuentaId() {
    return this.cuentaId;
  }

  setCuentaId(cuentaId) {
    this.cuentaId = cuentaId;
  }

  getTipoMovimiento() {
    return this.tipoMovimiento;
  }

  setTipoMovimiento(tipoMovimiento) {
    this.tipoMovimiento = tipoMovimiento;
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

  getMetodoPago() {
    return this.metodoPago;
  }

  setMetodoPago(metodoPago) {
    this.metodoPago = metodoPago;
  }

  getCajaTipo() {
    return this.cajaTipo;
  }

  setCajaTipo(cajaTipo) {
    this.cajaTipo = cajaTipo;
  }

  getCajaId() {
    return this.cajaId;
  }

  setCajaId(cajaId) {
    this.cajaId = cajaId;
  }

  getMovimientoFinancieroId() {
    return this.movimientoFinancieroId;
  }

  setMovimientoFinancieroId(movimientoFinancieroId) {
    this.movimientoFinancieroId = movimientoFinancieroId;
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
}
