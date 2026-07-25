// inventario-servicio/src/aplicacion/dto/DetalleEgresoDTO.js
export default class DetalleEgresoDTO {
  constructor(datos = {}) {
    Object.assign(this, datos);
  }

  static fromEntidad(detalle) {
    return new DetalleEgresoDTO({
      id: detalle.getId(),
      egreso_id: detalle.getEgresoId(),
      producto_id: detalle.getProductoId(),
      detalle_ingreso_id: detalle.getDetalleIngresoId(),
      nombre: detalle.getNombre(),
      modelo: detalle.getModelo(),
      color: detalle.getColor(),
      grupo: detalle.getGrupo(),
      cantidad: detalle.getCantidad(),
      costo_unitario: detalle.getCostoUnitario(),
      costo_unitario_original: detalle.getCostoUnitarioOriginal(),
      subtotal: detalle.calcularSubtotal(),
      operacion_id: detalle.getOperacionId(),
    });
  }
}
