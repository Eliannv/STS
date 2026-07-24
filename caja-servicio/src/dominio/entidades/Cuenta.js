// caja-servicio/src/dominio/entidades/Cuenta.js
export default class Cuenta {
  constructor(datos = {}, datosLegacy = null) {
    const valores = typeof datos === 'object' && datos !== null
      ? datos
      : { id: datos, ...(datosLegacy ?? {}) };

    this.id = valores.id ?? null;
    this.fecha = valores.fecha ?? null;
    this.tipo = valores.tipo ?? null;
    this.tipoCuentaPorPagar =
      valores.tipoCuentaPorPagar
      ?? valores.tipo_cuenta_por_pagar
      ?? null;
    this.montoTotal = valores.montoTotal ?? valores.monto_total ?? 0;
    this.montoAbonado = valores.montoAbonado ?? valores.monto_abonado ?? 0;
    this.saldo = valores.saldo ?? 0;
    this.estado = valores.estado ?? 'PENDIENTE';
    this.observacion = valores.observacion ?? null;
    this.terceroNombre = valores.terceroNombre ?? valores.tercero_nombre ?? null;
    this.terceroId = valores.terceroId ?? valores.tercero_id ?? null;
    this.usuarioId = valores.usuarioId ?? valores.usuario_id ?? null;
    this.sucursalId = valores.sucursalId ?? valores.sucursal_id ?? null;
    this.cajaBancoId = valores.cajaBancoId ?? valores.caja_banco_id ?? null;
    this.createdAt = valores.createdAt ?? valores.created_at ?? null;
    this.updatedAt = valores.updatedAt ?? valores.updated_at ?? null;
    this.origen = valores.origen ?? null;
    this.referenciaTipo =
      valores.referenciaTipo
      ?? valores.referencia_tipo
      ?? null;
    this.referenciaId = valores.referenciaId ?? valores.referencia_id ?? null;
    this.referenciaCodigo =
      valores.referenciaCodigo
      ?? valores.referencia_codigo
      ?? null;
    this.terceroTipo = valores.terceroTipo ?? valores.tercero_tipo ?? null;
    this.fechaEmision = valores.fechaEmision ?? valores.fecha_emision ?? null;
    this.fechaVencimiento =
      valores.fechaVencimiento
      ?? valores.fecha_vencimiento
      ?? null;
    this.moneda = valores.moneda ?? 'USD';
    this.usuarioNombre =
      valores.usuarioNombre
      ?? valores.usuario_nombre
      ?? null;
    this.operacionId = valores.operacionId ?? valores.operacion_id ?? null;
    this.idempotencyKey =
      valores.idempotencyKey
      ?? valores.idempotency_key
      ?? null;
  }

  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
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

  getTipoCuentaPorPagar() {
    return this.tipoCuentaPorPagar;
  }

  setTipoCuentaPorPagar(tipoCuentaPorPagar) {
    this.tipoCuentaPorPagar = tipoCuentaPorPagar;
  }

  getMontoTotal() {
    return this.montoTotal;
  }

  setMontoTotal(montoTotal) {
    this.montoTotal = montoTotal;
  }

  getMontoAbonado() {
    return this.montoAbonado;
  }

  setMontoAbonado(montoAbonado) {
    this.montoAbonado = montoAbonado;
  }

  getSaldo() {
    return this.saldo;
  }

  setSaldo(saldo) {
    this.saldo = saldo;
  }

  getEstado() {
    return this.estado;
  }

  setEstado(estado) {
    this.estado = estado;
  }

  getObservacion() {
    return this.observacion;
  }

  setObservacion(observacion) {
    this.observacion = observacion;
  }

  getTerceroNombre() {
    return this.terceroNombre;
  }

  setTerceroNombre(terceroNombre) {
    this.terceroNombre = terceroNombre;
  }

  getTerceroId() {
    return this.terceroId;
  }

  setTerceroId(terceroId) {
    this.terceroId = terceroId;
  }

  getUsuarioId() {
    return this.usuarioId;
  }

  setUsuarioId(usuarioId) {
    this.usuarioId = usuarioId;
  }

  getSucursalId() {
    return this.sucursalId;
  }

  setSucursalId(sucursalId) {
    this.sucursalId = sucursalId;
  }

  getCajaBancoId() {
    return this.cajaBancoId;
  }

  setCajaBancoId(cajaBancoId) {
    this.cajaBancoId = cajaBancoId;
  }

  getCreatedAt() {
    return this.createdAt;
  }

  setCreatedAt(createdAt) {
    this.createdAt = createdAt;
  }

  getUpdatedAt() {
    return this.updatedAt;
  }

  setUpdatedAt(updatedAt) {
    this.updatedAt = updatedAt;
  }

  getOrigen() {
    return this.origen;
  }

  setOrigen(origen) {
    this.origen = origen;
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

  getTerceroTipo() {
    return this.terceroTipo;
  }

  setTerceroTipo(terceroTipo) {
    this.terceroTipo = terceroTipo;
  }

  getFechaEmision() {
    return this.fechaEmision;
  }

  setFechaEmision(fechaEmision) {
    this.fechaEmision = fechaEmision;
  }

  getFechaVencimiento() {
    return this.fechaVencimiento;
  }

  setFechaVencimiento(fechaVencimiento) {
    this.fechaVencimiento = fechaVencimiento;
  }

  getMoneda() {
    return this.moneda;
  }

  setMoneda(moneda) {
    this.moneda = moneda;
  }

  getUsuarioNombre() {
    return this.usuarioNombre;
  }

  setUsuarioNombre(usuarioNombre) {
    this.usuarioNombre = usuarioNombre;
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
}
