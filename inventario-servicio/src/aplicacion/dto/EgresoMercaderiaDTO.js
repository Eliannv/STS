// inventario-servicio/src/aplicacion/dto/EgresoMercaderiaDTO.js
export default class EgresoMercaderiaDTO {
  constructor(datos = {}) {
    Object.assign(this, datos);
  }

  static fromEntidad(egreso, detalles = undefined) {
    return new EgresoMercaderiaDTO({
      id: egreso.getId(),
      id_personalizado: egreso.getIdPersonalizado(),
      tipo_egreso: egreso.getTipoEgreso(),
      descripcion: egreso.getDescripcion(),
      motivo: egreso.getMotivo(),
      observacion: egreso.getObservacion(),
      fecha: egreso.getFecha(),
      estado: egreso.getEstado(),
      estado_financiero: egreso.getEstadoFinanciero(),
      origen: egreso.getOrigen(),
      ingreso_origen_id: egreso.getIngresoOrigenId(),
      usuario_id: egreso.getUsuarioId(),
      usuario_nombre: egreso.getUsuarioNombre(),
      costo_total: Number(egreso.getCostoTotal() ?? 0),
      proveedor_id: egreso.getProveedorId(),
      proveedor_nombre: egreso.getProveedorNombre(),
      sucursal_id: egreso.getSucursalId(),
      sucursal_nombre: egreso.getSucursalNombre(),
      documento_referencia: egreso.getDocumentoReferencia(),
      confirmado_en: egreso.getConfirmadoEn(),
      confirmado_por_id: egreso.getConfirmadoPorId(),
      confirmado_por_nombre: egreso.getConfirmadoPorNombre(),
      anulado_en: egreso.getAnuladoEn(),
      anulado_por_id: egreso.getAnuladoPorId(),
      anulado_por_nombre: egreso.getAnuladoPorNombre(),
      motivo_anulacion: egreso.getMotivoAnulacion(),
      created_at: egreso.getCreatedAt(),
      updated_at: egreso.getUpdatedAt(),
      ...(detalles === undefined ? {} : { detalles }),
    });
  }
}
