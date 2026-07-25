// inventario-servicio/src/dominio/entidades/EgresoMercaderia.js
export default class EgresoMercaderia {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.idPersonalizado = datos.idPersonalizado ?? datos.id_personalizado ?? null;
    this.tipoEgreso = datos.tipoEgreso ?? datos.tipo_egreso ?? null;
    this.descripcion = datos.descripcion ?? null;
    this.motivo = datos.motivo ?? null;
    this.observacion = datos.observacion ?? null;
    this.fecha = datos.fecha ?? new Date();
    this.estado = datos.estado ?? 'BORRADOR';
    this.estadoFinanciero =
      datos.estadoFinanciero
      ?? datos.estado_financiero
      ?? 'NO_APLICA';
    this.origen = datos.origen ?? 'INVENTARIO';
    this.ingresoOrigenId =
      datos.ingresoOrigenId
      ?? datos.ingreso_origen_id
      ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.costoTotal = datos.costoTotal ?? datos.costo_total ?? 0;
    this.proveedorId = datos.proveedorId ?? datos.proveedor_id ?? null;
    this.proveedorNombre =
      datos.proveedorNombre
      ?? datos.proveedor_nombre
      ?? null;
    this.sucursalId = datos.sucursalId ?? datos.sucursal_id ?? null;
    this.sucursalNombre =
      datos.sucursalNombre
      ?? datos.sucursal_nombre
      ?? null;
    this.documentoReferencia =
      datos.documentoReferencia
      ?? datos.documento_referencia
      ?? null;
    this.confirmadoEn = datos.confirmadoEn ?? datos.confirmado_en ?? null;
    this.confirmadoPorId =
      datos.confirmadoPorId
      ?? datos.confirmado_por_id
      ?? null;
    this.confirmadoPorNombre =
      datos.confirmadoPorNombre
      ?? datos.confirmado_por_nombre
      ?? null;
    this.anuladoEn = datos.anuladoEn ?? datos.anulado_en ?? null;
    this.anuladoPorId = datos.anuladoPorId ?? datos.anulado_por_id ?? null;
    this.anuladoPorNombre =
      datos.anuladoPorNombre
      ?? datos.anulado_por_nombre
      ?? null;
    this.motivoAnulacion =
      datos.motivoAnulacion
      ?? datos.motivo_anulacion
      ?? null;
    this.operacionConfirmacionId =
      datos.operacionConfirmacionId
      ?? datos.operacion_confirmacion_id
      ?? null;
    this.operacionAnulacionId =
      datos.operacionAnulacionId
      ?? datos.operacion_anulacion_id
      ?? null;
    this.createdAt = datos.createdAt ?? datos.created_at ?? null;
    this.updatedAt = datos.updatedAt ?? datos.updated_at ?? null;
  }

  getId() { return this.id; }
  setId(id) { this.id = id; }
  getIdPersonalizado() { return this.idPersonalizado; }
  setIdPersonalizado(idPersonalizado) { this.idPersonalizado = idPersonalizado; }
  getTipoEgreso() { return this.tipoEgreso; }
  setTipoEgreso(tipoEgreso) { this.tipoEgreso = tipoEgreso; }
  getDescripcion() { return this.descripcion; }
  setDescripcion(descripcion) { this.descripcion = descripcion; }
  getMotivo() { return this.motivo; }
  setMotivo(motivo) { this.motivo = motivo; }
  getObservacion() { return this.observacion; }
  setObservacion(observacion) { this.observacion = observacion; }
  getFecha() { return this.fecha; }
  setFecha(fecha) { this.fecha = fecha; }
  getEstado() { return this.estado; }
  setEstado(estado) { this.estado = estado; }
  getEstadoFinanciero() { return this.estadoFinanciero; }
  setEstadoFinanciero(estadoFinanciero) { this.estadoFinanciero = estadoFinanciero; }
  getOrigen() { return this.origen; }
  setOrigen(origen) { this.origen = origen; }
  getIngresoOrigenId() { return this.ingresoOrigenId; }
  setIngresoOrigenId(ingresoOrigenId) { this.ingresoOrigenId = ingresoOrigenId; }
  getUsuarioId() { return this.usuarioId; }
  setUsuarioId(usuarioId) { this.usuarioId = usuarioId; }
  getUsuarioNombre() { return this.usuarioNombre; }
  setUsuarioNombre(usuarioNombre) { this.usuarioNombre = usuarioNombre; }
  getCostoTotal() { return this.costoTotal; }
  setCostoTotal(costoTotal) { this.costoTotal = costoTotal; }
  getProveedorId() { return this.proveedorId; }
  setProveedorId(proveedorId) { this.proveedorId = proveedorId; }
  getProveedorNombre() { return this.proveedorNombre; }
  setProveedorNombre(proveedorNombre) { this.proveedorNombre = proveedorNombre; }
  getSucursalId() { return this.sucursalId; }
  setSucursalId(sucursalId) { this.sucursalId = sucursalId; }
  getSucursalNombre() { return this.sucursalNombre; }
  setSucursalNombre(sucursalNombre) { this.sucursalNombre = sucursalNombre; }
  getDocumentoReferencia() { return this.documentoReferencia; }
  setDocumentoReferencia(documentoReferencia) { this.documentoReferencia = documentoReferencia; }
  getConfirmadoEn() { return this.confirmadoEn; }
  setConfirmadoEn(confirmadoEn) { this.confirmadoEn = confirmadoEn; }
  getConfirmadoPorId() { return this.confirmadoPorId; }
  setConfirmadoPorId(confirmadoPorId) { this.confirmadoPorId = confirmadoPorId; }
  getConfirmadoPorNombre() { return this.confirmadoPorNombre; }
  setConfirmadoPorNombre(confirmadoPorNombre) { this.confirmadoPorNombre = confirmadoPorNombre; }
  getAnuladoEn() { return this.anuladoEn; }
  setAnuladoEn(anuladoEn) { this.anuladoEn = anuladoEn; }
  getAnuladoPorId() { return this.anuladoPorId; }
  setAnuladoPorId(anuladoPorId) { this.anuladoPorId = anuladoPorId; }
  getAnuladoPorNombre() { return this.anuladoPorNombre; }
  setAnuladoPorNombre(anuladoPorNombre) { this.anuladoPorNombre = anuladoPorNombre; }
  getMotivoAnulacion() { return this.motivoAnulacion; }
  setMotivoAnulacion(motivoAnulacion) { this.motivoAnulacion = motivoAnulacion; }
  getOperacionConfirmacionId() { return this.operacionConfirmacionId; }
  setOperacionConfirmacionId(operacionConfirmacionId) { this.operacionConfirmacionId = operacionConfirmacionId; }
  getOperacionAnulacionId() { return this.operacionAnulacionId; }
  setOperacionAnulacionId(operacionAnulacionId) { this.operacionAnulacionId = operacionAnulacionId; }
  getCreatedAt() { return this.createdAt; }
  setCreatedAt(createdAt) { this.createdAt = createdAt; }
  getUpdatedAt() { return this.updatedAt; }
  setUpdatedAt(updatedAt) { this.updatedAt = updatedAt; }

  estaConfirmado() { return this.estado === 'CONFIRMADO'; }
  esEditable() { return this.estado === 'BORRADOR'; }
  requiereMotivo() { return this.tipoEgreso === 'OTRO'; }
  generaMovimientoFinanciero() {
    return this.tipoEgreso === 'DEVOLUCION_PROVEEDOR';
  }
}
