// facturacion-servicio/src/dominio/entidades/VentaTarjeta.js
export default class VentaTarjeta {
  constructor(idOrDatos = null, datos = {}) {
    const valores = typeof idOrDatos === 'object' && idOrDatos !== null
      ? idOrDatos
      : { ...datos, id: idOrDatos };

    this.id = valores.id ?? null;
    this.facturaId = valores.facturaId ?? valores.factura_id ?? null;
    this.facturaIdPersonalizado =
      valores.facturaIdPersonalizado
      ?? valores.factura_id_personalizado
      ?? null;
    this.clienteId = valores.clienteId ?? valores.cliente_id ?? null;
    this.clienteNombre =
      valores.clienteNombre
      ?? valores.cliente_nombre
      ?? null;
    this.fechaVenta = valores.fechaVenta ?? valores.fecha_venta ?? new Date();
    this.montoTotal = valores.montoTotal ?? valores.monto_total ?? 0;
    this.montoRecibido = valores.montoRecibido ?? valores.monto_recibido ?? 0;
    this.saldoPendiente =
      valores.saldoPendiente
      ?? valores.saldo_pendiente
      ?? this.montoTotal;
    this.estado = valores.estado ?? 'PENDIENTE';
    this.ultimosCuatroTarjeta =
      valores.ultimosCuatroTarjeta
      ?? valores.ultimos_cuatro_tarjeta
      ?? null;
    this.banco = valores.banco ?? null;
    this.numeroLote = valores.numeroLote ?? valores.numero_lote ?? null;
    this.observacion = valores.observacion ?? null;
    this.cuentaBancoId =
      valores.cuentaBancoId
      ?? valores.cuenta_banco_id
      ?? null;
    this.fechaUltimaAcreditacion =
      valores.fechaUltimaAcreditacion
      ?? valores.fecha_ultima_acreditacion
      ?? null;
    this.comisionAcumulada =
      valores.comisionAcumulada
      ?? valores.comision_acumulada
      ?? 0;
    this.retencionAcumulada =
      valores.retencionAcumulada
      ?? valores.retencion_acumulada
      ?? 0;
    this.montoBrutoAcreditado =
      valores.montoBrutoAcreditado
      ?? valores.monto_bruto_acreditado
      ?? 0;
    this.montoNetoAcreditado =
      valores.montoNetoAcreditado
      ?? valores.monto_neto_acreditado
      ?? 0;
    this.createdAt = valores.createdAt ?? valores.created_at ?? null;
    this.updatedAt = valores.updatedAt ?? valores.updated_at ?? null;
  }

  getId() { return this.id; }
  setId(id) { this.id = id; }
  getFacturaId() { return this.facturaId; }
  setFacturaId(facturaId) { this.facturaId = facturaId; }
  getFacturaIdPersonalizado() { return this.facturaIdPersonalizado; }
  setFacturaIdPersonalizado(valor) { this.facturaIdPersonalizado = valor; }
  getClienteId() { return this.clienteId; }
  setClienteId(clienteId) { this.clienteId = clienteId; }
  getClienteNombre() { return this.clienteNombre; }
  setClienteNombre(clienteNombre) { this.clienteNombre = clienteNombre; }
  getFechaVenta() { return this.fechaVenta; }
  setFechaVenta(fechaVenta) { this.fechaVenta = fechaVenta; }
  getMontoTotal() { return this.montoTotal; }
  setMontoTotal(montoTotal) { this.montoTotal = montoTotal; }
  getMontoRecibido() { return this.montoRecibido; }
  setMontoRecibido(montoRecibido) { this.montoRecibido = montoRecibido; }
  getSaldoPendiente() { return this.saldoPendiente; }
  setSaldoPendiente(saldoPendiente) { this.saldoPendiente = saldoPendiente; }
  getEstado() { return this.estado; }
  setEstado(estado) { this.estado = estado; }
  getUltimosCuatroTarjeta() { return this.ultimosCuatroTarjeta; }
  setUltimosCuatroTarjeta(valor) { this.ultimosCuatroTarjeta = valor; }
  getBanco() { return this.banco; }
  setBanco(banco) { this.banco = banco; }
  getNumeroLote() { return this.numeroLote; }
  setNumeroLote(numeroLote) { this.numeroLote = numeroLote; }
  getObservacion() { return this.observacion; }
  setObservacion(observacion) { this.observacion = observacion; }
  getCuentaBancoId() { return this.cuentaBancoId; }
  setCuentaBancoId(cuentaBancoId) { this.cuentaBancoId = cuentaBancoId; }
  getFechaUltimaAcreditacion() { return this.fechaUltimaAcreditacion; }
  setFechaUltimaAcreditacion(valor) { this.fechaUltimaAcreditacion = valor; }
  getComisionAcumulada() { return this.comisionAcumulada; }
  setComisionAcumulada(valor) { this.comisionAcumulada = valor; }
  getRetencionAcumulada() { return this.retencionAcumulada; }
  setRetencionAcumulada(valor) { this.retencionAcumulada = valor; }
  getMontoBrutoAcreditado() { return this.montoBrutoAcreditado; }
  setMontoBrutoAcreditado(valor) { this.montoBrutoAcreditado = valor; }
  getMontoNetoAcreditado() { return this.montoNetoAcreditado; }
  setMontoNetoAcreditado(valor) { this.montoNetoAcreditado = valor; }
  getCreatedAt() { return this.createdAt; }
  setCreatedAt(createdAt) { this.createdAt = createdAt; }
  getUpdatedAt() { return this.updatedAt; }
  setUpdatedAt(updatedAt) { this.updatedAt = updatedAt; }
}
