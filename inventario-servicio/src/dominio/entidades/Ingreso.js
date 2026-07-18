export default class Ingreso {
  constructor(id, datos = {}) {
    this.id = id;
    this.idPersonalizado = datos.idPersonalizado ?? null;
    this.proveedorId = datos.proveedorId ?? null;
    this.proveedorNombre = datos.proveedorNombre ?? null;
    this.numeroFactura = datos.numeroFactura;
    this.fecha = datos.fecha;
    this.tipoCompra = datos.tipoCompra ?? 'CONTADO';
    this.observacion = datos.observacion ?? null;
    this.descuento = datos.descuento ?? 0;
    this.flete = datos.flete ?? 0;
    this.iva = datos.iva ?? 0;
    this.total = datos.total ?? 0;
    this.estado = datos.estado ?? 'BORRADOR';
    this.usuarioId = datos.usuarioId ?? null;
  }
}
