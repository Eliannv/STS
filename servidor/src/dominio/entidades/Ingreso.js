// src/dominio/entidades/Ingreso.js
export default class Ingreso {
  constructor(
    id, idPersonalizado, proveedorId, proveedorNombre,
    numeroFactura, fecha, tipoCompra, observacion,
    descuento, flete, iva, total, estado, usuarioId
  ) {
    this.id               = id;
    this.idPersonalizado  = idPersonalizado  ?? null;
    this.proveedorId      = proveedorId      ?? null;
    this.proveedorNombre  = proveedorNombre  ?? null;
    this.numeroFactura    = numeroFactura;
    this.fecha            = fecha;
    this.tipoCompra       = tipoCompra       ?? 'CONTADO';
    this.observacion      = observacion      ?? null;
    this.descuento        = descuento        ?? 0;
    this.flete            = flete            ?? 0;
    this.iva              = iva              ?? 0;
    this.total            = total            ?? 0;
    this.estado           = estado           ?? 'BORRADOR';
    this.usuarioId        = usuarioId        ?? null;
  }
}
