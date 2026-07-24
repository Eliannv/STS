// facturacion-servicio/src/dominio/entidades/OperacionFinanciera.js
export default class OperacionFinanciera {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.facturaId = datos.facturaId ?? datos.factura_id ?? null;
    this.facturaDeudaId = datos.facturaDeudaId ?? datos.factura_deuda_id ?? null;
    this.cuentaCobrarId = datos.cuentaCobrarId ?? datos.cuenta_cobrar_id ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
    this.operacionIdOriginal =
      datos.operacionIdOriginal
      ?? datos.operacion_id_original
      ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key ?? null;
    this.tipo = datos.tipo ?? null;
    this.metodoPago = datos.metodoPago ?? datos.metodo_pago ?? null;
    this.metodoCobro = datos.metodoCobro ?? datos.metodo_cobro ?? null;
    this.montoTotal = datos.montoTotal ?? datos.monto_total ?? 0;
    this.montoCobrado = datos.montoCobrado ?? datos.monto_cobrado ?? 0;
    this.montoCredito = datos.montoCredito ?? datos.monto_credito ?? 0;
    this.fechaVencimiento =
      datos.fechaVencimiento
      ?? datos.fecha_vencimiento
      ?? null;
    this.referenciaPago =
      datos.referenciaPago
      ?? datos.referencia_pago
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
    this.traceId = datos.traceId ?? datos.trace_id ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.sucursalId = datos.sucursalId ?? datos.sucursal_id ?? null;
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
    this.updatedAt = datos.updatedAt ?? datos.updated_at ?? null;
  }

  getId() { return this.id; }
  setId(id) { this.id = id; }
  getFacturaId() { return this.facturaId; }
  setFacturaId(facturaId) { this.facturaId = facturaId; }
  getFacturaDeudaId() { return this.facturaDeudaId; }
  setFacturaDeudaId(facturaDeudaId) { this.facturaDeudaId = facturaDeudaId; }
  getCuentaCobrarId() { return this.cuentaCobrarId; }
  setCuentaCobrarId(cuentaCobrarId) { this.cuentaCobrarId = cuentaCobrarId; }
  getOperacionId() { return this.operacionId; }
  setOperacionId(operacionId) { this.operacionId = operacionId; }
  getOperacionIdOriginal() { return this.operacionIdOriginal; }
  setOperacionIdOriginal(operacionIdOriginal) { this.operacionIdOriginal = operacionIdOriginal; }
  getIdempotencyKey() { return this.idempotencyKey; }
  setIdempotencyKey(idempotencyKey) { this.idempotencyKey = idempotencyKey; }
  getTipo() { return this.tipo; }
  setTipo(tipo) { this.tipo = tipo; }
  getMetodoPago() { return this.metodoPago; }
  setMetodoPago(metodoPago) { this.metodoPago = metodoPago; }
  getMetodoCobro() { return this.metodoCobro; }
  setMetodoCobro(metodoCobro) { this.metodoCobro = metodoCobro; }
  getMontoTotal() { return this.montoTotal; }
  setMontoTotal(montoTotal) { this.montoTotal = montoTotal; }
  getMontoCobrado() { return this.montoCobrado; }
  setMontoCobrado(montoCobrado) { this.montoCobrado = montoCobrado; }
  getMontoCredito() { return this.montoCredito; }
  setMontoCredito(montoCredito) { this.montoCredito = montoCredito; }
  getFechaVencimiento() { return this.fechaVencimiento; }
  setFechaVencimiento(fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
  getReferenciaPago() { return this.referenciaPago; }
  setReferenciaPago(referenciaPago) { this.referenciaPago = referenciaPago; }
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
