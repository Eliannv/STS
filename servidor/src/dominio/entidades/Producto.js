// src/dominio/entidades/Producto.js
export default class Producto {
  constructor(
    id, idInterno, codigo, nombre, modelo, color, grupo,
    stock, tipoControlStock, costo, pvp1, iva, precioConIva,
    proveedorId, ingresoId, observacion, activo
  ) {
    this.id               = id;
    this.idInterno        = idInterno        ?? null;
    this.codigo           = codigo;
    this.nombre           = nombre;
    this.modelo           = modelo           ?? null;
    this.color            = color            ?? null;
    this.grupo            = grupo            ?? null;
    this.stock            = stock            ?? 0;
    this.tipoControlStock = tipoControlStock ?? 'NORMAL';
    this.costo            = costo            ?? 0;
    this.pvp1             = pvp1             ?? 0;
    this.iva              = iva              ?? 0;
    this.precioConIva     = precioConIva     ?? 0;
    this.proveedorId      = proveedorId      ?? null;
    this.ingresoId        = ingresoId        ?? null;
    this.observacion      = observacion      ?? null;
    this.activo           = activo           ?? true;
  }
}
