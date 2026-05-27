// src/dominio/entidades/DetalleIngreso.js
export default class DetalleIngreso {
  constructor(
    id, ingresoId, productoId, tipo,
    codigo, nombre, modelo, color, grupo,
    pvp1, observacion,
    stockIngresado, costoUnitario, subtotal
  ) {
    this.id             = id;
    this.ingresoId      = ingresoId;
    this.productoId     = productoId     ?? null;
    this.tipo           = tipo           ?? 'EXISTENTE';
    this.codigo         = codigo         ?? null;
    this.nombre         = nombre         ?? null;
    this.modelo         = modelo         ?? null;
    this.color          = color          ?? null;
    this.grupo          = grupo          ?? null;
    this.pvp1           = pvp1           ?? null;
    this.observacion    = observacion    ?? null;
    this.stockIngresado = stockIngresado ?? 0;
    this.costoUnitario  = costoUnitario  ?? 0;
    this.subtotal       = subtotal       ?? 0;
  }
}
