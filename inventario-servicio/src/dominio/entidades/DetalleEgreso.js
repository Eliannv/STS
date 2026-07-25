// inventario-servicio/src/dominio/entidades/DetalleEgreso.js
export default class DetalleEgreso {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.egresoId = datos.egresoId ?? datos.egreso_id ?? null;
    this.productoId = datos.productoId ?? datos.producto_id ?? null;
    this.detalleIngresoId =
      datos.detalleIngresoId
      ?? datos.detalle_ingreso_id
      ?? null;
    this.nombre = datos.nombre ?? null;
    this.modelo = datos.modelo ?? null;
    this.color = datos.color ?? null;
    this.grupo = datos.grupo ?? null;
    this.cantidad = Number(datos.cantidad ?? 0);
    this.costoUnitario =
      Number(datos.costoUnitario ?? datos.costo_unitario ?? 0);
    this.costoUnitarioOriginal =
      Number(
        datos.costoUnitarioOriginal
        ?? datos.costo_unitario_original
        ?? this.costoUnitario,
      );
    this.subtotal = Number(datos.subtotal ?? this.calcularSubtotal());
    this.idempotencyKey =
      datos.idempotencyKey
      ?? datos.idempotency_key
      ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
  }

  getId() { return this.id; }
  setId(id) { this.id = id; }
  getEgresoId() { return this.egresoId; }
  setEgresoId(egresoId) { this.egresoId = egresoId; }
  getProductoId() { return this.productoId; }
  setProductoId(productoId) { this.productoId = productoId; }
  getDetalleIngresoId() { return this.detalleIngresoId; }
  setDetalleIngresoId(detalleIngresoId) { this.detalleIngresoId = detalleIngresoId; }
  getNombre() { return this.nombre; }
  setNombre(nombre) { this.nombre = nombre; }
  getModelo() { return this.modelo; }
  setModelo(modelo) { this.modelo = modelo; }
  getColor() { return this.color; }
  setColor(color) { this.color = color; }
  getGrupo() { return this.grupo; }
  setGrupo(grupo) { this.grupo = grupo; }
  getCantidad() { return this.cantidad; }
  setCantidad(cantidad) { this.cantidad = Number(cantidad ?? 0); }
  getCostoUnitario() { return this.costoUnitario; }
  setCostoUnitario(costoUnitario) {
    this.costoUnitario = Number(costoUnitario ?? 0);
  }
  getCostoUnitarioOriginal() { return this.costoUnitarioOriginal; }
  setCostoUnitarioOriginal(costoUnitarioOriginal) {
    this.costoUnitarioOriginal = Number(costoUnitarioOriginal ?? 0);
  }
  getSubtotal() { return this.subtotal; }
  setSubtotal(subtotal) { this.subtotal = Number(subtotal ?? 0); }
  getIdempotencyKey() { return this.idempotencyKey; }
  setIdempotencyKey(idempotencyKey) { this.idempotencyKey = idempotencyKey; }
  getOperacionId() { return this.operacionId; }
  setOperacionId(operacionId) { this.operacionId = operacionId; }

  calcularSubtotal() {
    return Number((this.cantidad * this.costoUnitario).toFixed(2));
  }
}
