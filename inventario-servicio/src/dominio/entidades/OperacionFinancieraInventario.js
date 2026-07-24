// inventario-servicio/src/dominio/entidades/OperacionFinancieraInventario.js
export default class OperacionFinancieraInventario {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.ingresoId = datos.ingresoId ?? datos.ingreso_id ?? null;
    this.cuentaPagarId = datos.cuentaPagarId ?? datos.cuenta_pagar_id ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
    this.operacionIdOriginal =
      datos.operacionIdOriginal
      ?? datos.operacion_id_original
      ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key ?? null;
    this.tipo = datos.tipo ?? null;
    this.tipoCompra = datos.tipoCompra ?? datos.tipo_compra ?? null;
    this.metodoPago = datos.metodoPago ?? datos.metodo_pago ?? null;
    this.cajaTipo = datos.cajaTipo ?? datos.caja_tipo ?? null;
    this.cajaId = datos.cajaId ?? datos.caja_id ?? null;
    this.montoTotal = datos.montoTotal ?? datos.monto_total ?? 0;
    this.fechaVencimiento =
      datos.fechaVencimiento
      ?? datos.fecha_vencimiento
      ?? null;
    this.estado = datos.estado ?? 'PENDIENTE';
    this.intentos = datos.intentos ?? 0;
    this.ultimoError = datos.ultimoError ?? datos.ultimo_error ?? null;
    this.payload = datos.payload ?? {};
    this.respuesta = datos.respuesta ?? null;
    this.proximoReintentoEn =
      datos.proximoReintentoEn
      ?? datos.proximo_reintento_en
      ?? null;
    this.aplicadoEn = datos.aplicadoEn ?? datos.aplicado_en ?? null;
    this.descartadoEn = datos.descartadoEn ?? datos.descartado_en ?? null;
    this.motivoDescarte =
      datos.motivoDescarte
      ?? datos.motivo_descarte
      ?? null;
    this.motivo = datos.motivo ?? null;
    this.traceId = datos.traceId ?? datos.trace_id ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.sucursalId = datos.sucursalId ?? datos.sucursal_id ?? null;
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
    this.updatedAt = datos.updatedAt ?? datos.updated_at ?? null;
  }

  getId() { return this.id; }
  setId(id) { this.id = id; }
  getIngresoId() { return this.ingresoId; }
  setIngresoId(ingresoId) { this.ingresoId = ingresoId; }
  getCuentaPagarId() { return this.cuentaPagarId; }
  setCuentaPagarId(cuentaPagarId) { this.cuentaPagarId = cuentaPagarId; }
  getOperacionId() { return this.operacionId; }
  setOperacionId(operacionId) { this.operacionId = operacionId; }
  getOperacionIdOriginal() { return this.operacionIdOriginal; }
  setOperacionIdOriginal(operacionIdOriginal) { this.operacionIdOriginal = operacionIdOriginal; }
  getIdempotencyKey() { return this.idempotencyKey; }
  setIdempotencyKey(idempotencyKey) { this.idempotencyKey = idempotencyKey; }
  getTipo() { return this.tipo; }
  setTipo(tipo) { this.tipo = tipo; }
  getTipoCompra() { return this.tipoCompra; }
  setTipoCompra(tipoCompra) { this.tipoCompra = tipoCompra; }
  getMetodoPago() { return this.metodoPago; }
  setMetodoPago(metodoPago) { this.metodoPago = metodoPago; }
  getCajaTipo() { return this.cajaTipo; }
  setCajaTipo(cajaTipo) { this.cajaTipo = cajaTipo; }
  getCajaId() { return this.cajaId; }
  setCajaId(cajaId) { this.cajaId = cajaId; }
  getMontoTotal() { return this.montoTotal; }
  setMontoTotal(montoTotal) { this.montoTotal = montoTotal; }
  getFechaVencimiento() { return this.fechaVencimiento; }
  setFechaVencimiento(fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
  getEstado() { return this.estado; }
  setEstado(estado) { this.estado = estado; }
  getIntentos() { return this.intentos; }
  setIntentos(intentos) { this.intentos = intentos; }
  getUltimoError() { return this.ultimoError; }
  setUltimoError(ultimoError) { this.ultimoError = ultimoError; }
  getPayload() { return this.payload; }
  setPayload(payload) { this.payload = payload; }
  getRespuesta() { return this.respuesta; }
  setRespuesta(respuesta) { this.respuesta = respuesta; }
  getProximoReintentoEn() { return this.proximoReintentoEn; }
  setProximoReintentoEn(proximoReintentoEn) { this.proximoReintentoEn = proximoReintentoEn; }
  getAplicadoEn() { return this.aplicadoEn; }
  setAplicadoEn(aplicadoEn) { this.aplicadoEn = aplicadoEn; }
  getDescartadoEn() { return this.descartadoEn; }
  setDescartadoEn(descartadoEn) { this.descartadoEn = descartadoEn; }
  getMotivoDescarte() { return this.motivoDescarte; }
  setMotivoDescarte(motivoDescarte) { this.motivoDescarte = motivoDescarte; }
  getMotivo() { return this.motivo; }
  setMotivo(motivo) { this.motivo = motivo; }
  getTraceId() { return this.traceId; }
  setTraceId(traceId) { this.traceId = traceId; }
  getUsuarioId() { return this.usuarioId; }
  setUsuarioId(usuarioId) { this.usuarioId = usuarioId; }
  getUsuarioNombre() { return this.usuarioNombre; }
  setUsuarioNombre(usuarioNombre) { this.usuarioNombre = usuarioNombre; }
  getSucursalId() { return this.sucursalId; }
  setSucursalId(sucursalId) { this.sucursalId = sucursalId; }
  getCreatedAt() { return this.createdAt; }
  setCreatedAt(createdAt) { this.createdAt = createdAt; }
  getUpdatedAt() { return this.updatedAt; }
  setUpdatedAt(updatedAt) { this.updatedAt = updatedAt; }
}
