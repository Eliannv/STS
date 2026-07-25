// caja-servicio/src/dominio/entidades/CajaChica.js
export default class CajaChica {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.fecha = datos.fecha ?? null;
    this.montoInicial = datos.montoInicial ?? datos.monto_inicial ?? 0;
    this.montoActual = datos.montoActual ?? datos.monto_actual ?? 0;
    this.estado = datos.estado ?? 'ABIERTA';
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.observacion = datos.observacion ?? null;
    this.activo = datos.activo ?? true;
    this.cajaBancoId = datos.cajaBancoId ?? datos.caja_banco_id ?? null;
    this.sucursalId = datos.sucursalId ?? datos.sucursal_id ?? null;
    this.sucursalNombre = datos.sucursalNombre ?? datos.sucursal_nombre ?? null;
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
    this.updatedAt = datos.updatedAt ?? datos.updated_at ?? null;
    this.cerradoEn = datos.cerradoEn ?? datos.cerrado_en ?? null;
    this.cerradoPorId = datos.cerradoPorId ?? datos.cerrado_por_id ?? null;
    this.cerradoPorNombre = datos.cerradoPorNombre ?? datos.cerrado_por_nombre ?? null;
    this.ingresosAcumulados = datos.ingresosAcumulados ?? datos.ingresos_acumulados ?? 0;
    this.egresosAcumulados = datos.egresosAcumulados ?? datos.egresos_acumulados ?? 0;
    this.totalMovimientos = datos.totalMovimientos ?? datos.total_movimientos ?? 0;
    this.saldoContadoCierre = datos.saldoContadoCierre ?? datos.saldo_contado_cierre ?? null;
    this.diferenciaCierre = datos.diferenciaCierre ?? datos.diferencia_cierre ?? null;
    this.motivoDiferencia = datos.motivoDiferencia ?? datos.motivo_diferencia ?? null;
    this.transferirABanco = datos.transferirABanco ?? datos.transferir_a_banco ?? true;
  }

  getTipoCaja() {
    return 'CHICA';
  }

  getSucursalId() {
    return this.sucursalId;
  }

  setSucursalId(sucursalId) {
    this.sucursalId = sucursalId;
  }

  getSucursalNombre() {
    return this.sucursalNombre;
  }

  getPermiteSaldoNegativo() {
    return false;
  }

  getSaldoActual() {
    return this.montoActual;
  }

  setSaldoActual(saldoActual) {
    this.montoActual = saldoActual;
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

  getMontoInicial() {
    return this.montoInicial;
  }

  setMontoInicial(montoInicial) {
    this.montoInicial = montoInicial;
  }

  getMontoActual() {
    return this.montoActual;
  }

  setMontoActual(montoActual) {
    this.montoActual = montoActual;
  }

  getEstado() {
    return this.estado;
  }

  setEstado(estado) {
    this.estado = estado;
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

  getObservacion() {
    return this.observacion;
  }

  setObservacion(observacion) {
    this.observacion = observacion;
  }

  getActivo() {
    return this.activo;
  }

  setActivo(activo) {
    this.activo = activo;
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

  getCerradoEn() {
    return this.cerradoEn;
  }

  setCerradoEn(cerradoEn) {
    this.cerradoEn = cerradoEn;
  }

  getCerradoPorId() {
    return this.cerradoPorId;
  }

  setCerradoPorId(cerradoPorId) {
    this.cerradoPorId = cerradoPorId;
  }

  getCerradoPorNombre() {
    return this.cerradoPorNombre;
  }

  setCerradoPorNombre(cerradoPorNombre) {
    this.cerradoPorNombre = cerradoPorNombre;
  }

  getIngresosAcumulados() {
    return this.ingresosAcumulados;
  }

  setIngresosAcumulados(ingresosAcumulados) {
    this.ingresosAcumulados = ingresosAcumulados;
  }

  getEgresosAcumulados() {
    return this.egresosAcumulados;
  }

  setEgresosAcumulados(egresosAcumulados) {
    this.egresosAcumulados = egresosAcumulados;
  }

  getTotalMovimientos() {
    return this.totalMovimientos;
  }

  setTotalMovimientos(totalMovimientos) {
    this.totalMovimientos = totalMovimientos;
  }

  getSaldoContadoCierre() {
    return this.saldoContadoCierre;
  }

  setSaldoContadoCierre(saldoContadoCierre) {
    this.saldoContadoCierre = saldoContadoCierre;
  }

  getDiferenciaCierre() {
    return this.diferenciaCierre;
  }

  setDiferenciaCierre(diferenciaCierre) {
    this.diferenciaCierre = diferenciaCierre;
  }

  getMotivoDiferencia() {
    return this.motivoDiferencia;
  }

  setMotivoDiferencia(motivoDiferencia) {
    this.motivoDiferencia = motivoDiferencia;
  }

  getTransferirABanco() {
    return this.transferirABanco;
  }

  setTransferirABanco(transferirABanco) {
    this.transferirABanco = transferirABanco;
  }
}
