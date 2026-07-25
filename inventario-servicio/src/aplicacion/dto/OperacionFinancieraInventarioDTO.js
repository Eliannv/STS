// inventario-servicio/src/aplicacion/dto/OperacionFinancieraInventarioDTO.js
export default class OperacionFinancieraInventarioDTO {
  constructor(datos = {}) {
    Object.assign(this, datos);
  }

  static fromEntidad(entidad) {
    return new OperacionFinancieraInventarioDTO({
      id: entidad.getId(),
      ingreso_id: entidad.getIngresoId(),
      egreso_id: entidad.getEgresoId(),
      cuenta_pagar_id: entidad.getCuentaPagarId(),
      operacion_id: entidad.getOperacionId(),
      operacion_id_original: entidad.getOperacionIdOriginal(),
      idempotency_key: entidad.getIdempotencyKey(),
      tipo: entidad.getTipo(),
      tipo_compra: entidad.getTipoCompra(),
      metodo_pago: entidad.getMetodoPago(),
      caja_tipo: entidad.getCajaTipo(),
      caja_id: entidad.getCajaId(),
      monto_total: entidad.getMontoTotal(),
      monto: entidad.getMonto(),
      proveedor_id: entidad.getProveedorId(),
      proveedor_nombre: entidad.getProveedorNombre(),
      ingreso_origen_id: entidad.getIngresoOrigenId(),
      fecha_vencimiento: entidad.getFechaVencimiento(),
      estado: entidad.getEstado(),
      intentos: entidad.getIntentos(),
      ultimo_error: entidad.getUltimoError(),
      payload: entidad.getPayload(),
      respuesta: entidad.getRespuesta(),
      proximo_reintento_en: entidad.getProximoReintentoEn(),
      aplicado_en: entidad.getAplicadoEn(),
      descartado_en: entidad.getDescartadoEn(),
      motivo_descarte: entidad.getMotivoDescarte(),
      motivo: entidad.getMotivo(),
      trace_id: entidad.getTraceId(),
      usuario_id: entidad.getUsuarioId(),
      usuario_nombre: entidad.getUsuarioNombre(),
      sucursal_id: entidad.getSucursalId(),
      created_at: entidad.getCreatedAt(),
      updated_at: entidad.getUpdatedAt(),
    });
  }

  getId() { return this.id; }
  getIngresoId() { return this.ingreso_id; }
  getOperacionId() { return this.operacion_id; }
  getIdempotencyKey() { return this.idempotency_key; }
  getTipo() { return this.tipo; }
  getEstado() { return this.estado; }
  getPayload() { return this.payload; }
}
