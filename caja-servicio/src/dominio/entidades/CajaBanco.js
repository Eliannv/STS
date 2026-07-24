// caja-servicio/src/dominio/entidades/CajaBanco.js
export default class CajaBanco {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.fecha = datos.fecha ?? null;
    this.saldoInicial = datos.saldoInicial ?? datos.saldo_inicial ?? 0;
    this.saldoActual = datos.saldoActual ?? datos.saldo_actual ?? 0;
    this.estado = datos.estado ?? 'ABIERTA';
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.observacion = datos.observacion ?? null;
    this.activo = datos.activo ?? true;
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
    this.updatedAt = datos.updatedAt ?? datos.updated_at ?? null;
    this.cerradoEn = datos.cerradoEn ?? datos.cerrado_en ?? null;
    this.cerradoPorId = datos.cerradoPorId ?? datos.cerrado_por_id ?? null;
    this.cerradoPorNombre = datos.cerradoPorNombre ?? datos.cerrado_por_nombre ?? null;
    this.periodo = datos.periodo ?? null;
    this.fechaApertura = datos.fechaApertura ?? datos.fecha_apertura ?? null;
    this.ingresosAcumulados = datos.ingresosAcumulados ?? datos.ingresos_acumulados ?? 0;
    this.egresosAcumulados = datos.egresosAcumulados ?? datos.egresos_acumulados ?? 0;
    this.totalMovimientos = datos.totalMovimientos ?? datos.total_movimientos ?? 0;
    this.saldoContadoCierre = datos.saldoContadoCierre ?? datos.saldo_contado_cierre ?? null;
    this.diferenciaCierre = datos.diferenciaCierre ?? datos.diferencia_cierre ?? null;
    this.motivoDiferencia = datos.motivoDiferencia ?? datos.motivo_diferencia ?? null;
    this.observacionCierre = datos.observacionCierre ?? datos.observacion_cierre ?? null;
    this.permiteSaldoNegativo = datos.permiteSaldoNegativo ?? datos.permite_saldo_negativo ?? false;
  }

  getTipoCaja() {
    return 'BANCO';
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

  getSaldoInicial() {
    return this.saldoInicial;
  }

  setSaldoInicial(saldoInicial) {
    this.saldoInicial = saldoInicial;
  }

  getSaldoActual() {
    return this.saldoActual;
  }

  setSaldoActual(saldoActual) {
    this.saldoActual = saldoActual;
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

  getPeriodo() {
    return this.periodo;
  }

  setPeriodo(periodo) {
    this.periodo = periodo;
  }

  getFechaApertura() {
    return this.fechaApertura;
  }

  setFechaApertura(fechaApertura) {
    this.fechaApertura = fechaApertura;
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

  getObservacionCierre() {
    return this.observacionCierre;
  }

  setObservacionCierre(observacionCierre) {
    this.observacionCierre = observacionCierre;
  }

  getPermiteSaldoNegativo() {
    return this.permiteSaldoNegativo;
  }

  setPermiteSaldoNegativo(permiteSaldoNegativo) {
    this.permiteSaldoNegativo = permiteSaldoNegativo;
  }
}
