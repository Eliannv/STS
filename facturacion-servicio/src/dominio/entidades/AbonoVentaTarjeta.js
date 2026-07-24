// facturacion-servicio/src/dominio/entidades/AbonoVentaTarjeta.js
export default class AbonoVentaTarjeta {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.ventaTarjetaId =
      datos.ventaTarjetaId
      ?? datos.venta_tarjeta_id
      ?? null;
    this.fecha = datos.fecha ?? datos.fechaAcreditacion ?? datos.fecha_acreditacion ?? new Date();
    this.monto = datos.monto ?? datos.montoBruto ?? datos.monto_bruto ?? 0;
    this.observacion = datos.observacion ?? null;
    this.montoBruto = datos.montoBruto ?? datos.monto_bruto ?? this.monto;
    this.comision = datos.comision ?? 0;
    this.retencion = datos.retencion ?? 0;
    this.montoNeto = datos.montoNeto ?? datos.monto_neto ?? 0;
    this.banco = datos.banco ?? null;
    this.numeroLote = datos.numeroLote ?? datos.numero_lote ?? null;
    this.numeroAutorizacion =
      datos.numeroAutorizacion
      ?? datos.numero_autorizacion
      ?? null;
    this.voucher = datos.voucher ?? null;
    this.fechaAcreditacion =
      datos.fechaAcreditacion
      ?? datos.fecha_acreditacion
      ?? this.fecha;
    this.cuentaBancoId =
      datos.cuentaBancoId
      ?? datos.cuenta_banco_id
      ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
    this.idempotencyKey =
      datos.idempotencyKey
      ?? datos.idempotency_key
      ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre =
      datos.usuarioNombre
      ?? datos.usuario_nombre
      ?? null;
    this.traceId = datos.traceId ?? datos.trace_id ?? null;
    this.estado = datos.estado ?? 'PENDIENTE';
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
  }

  getId() { return this.id; }
  setId(id) { this.id = id; }
  getVentaTarjetaId() { return this.ventaTarjetaId; }
  setVentaTarjetaId(valor) { this.ventaTarjetaId = valor; }
  getFecha() { return this.fecha; }
  setFecha(fecha) { this.fecha = fecha; }
  getMonto() { return this.monto; }
  setMonto(monto) { this.monto = monto; }
  getObservacion() { return this.observacion; }
  setObservacion(observacion) { this.observacion = observacion; }
  getMontoBruto() { return this.montoBruto; }
  setMontoBruto(valor) { this.montoBruto = valor; }
  getComision() { return this.comision; }
  setComision(valor) { this.comision = valor; }
  getRetencion() { return this.retencion; }
  setRetencion(valor) { this.retencion = valor; }
  getMontoNeto() { return this.montoNeto; }
  setMontoNeto(valor) { this.montoNeto = valor; }
  getBanco() { return this.banco; }
  setBanco(banco) { this.banco = banco; }
  getNumeroLote() { return this.numeroLote; }
  setNumeroLote(valor) { this.numeroLote = valor; }
  getNumeroAutorizacion() { return this.numeroAutorizacion; }
  setNumeroAutorizacion(valor) { this.numeroAutorizacion = valor; }
  getVoucher() { return this.voucher; }
  setVoucher(voucher) { this.voucher = voucher; }
  getFechaAcreditacion() { return this.fechaAcreditacion; }
  setFechaAcreditacion(valor) { this.fechaAcreditacion = valor; }
  getCuentaBancoId() { return this.cuentaBancoId; }
  setCuentaBancoId(valor) { this.cuentaBancoId = valor; }
  getOperacionId() { return this.operacionId; }
  setOperacionId(valor) { this.operacionId = valor; }
  getIdempotencyKey() { return this.idempotencyKey; }
  setIdempotencyKey(valor) { this.idempotencyKey = valor; }
  getUsuarioId() { return this.usuarioId; }
  setUsuarioId(valor) { this.usuarioId = valor; }
  getUsuarioNombre() { return this.usuarioNombre; }
  setUsuarioNombre(valor) { this.usuarioNombre = valor; }
  getTraceId() { return this.traceId; }
  setTraceId(valor) { this.traceId = valor; }
  getEstado() { return this.estado; }
  setEstado(valor) { this.estado = valor; }
  getCreatedAt() { return this.createdAt; }
  setCreatedAt(valor) { this.createdAt = valor; }
}
