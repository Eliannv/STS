// src/dominio/entidades/Proveedor.js
export default class Proveedor {
  constructor(
    id, codigo, nombre, representante, ruc,
    telefonoPrincipal, telefonoSecundario, codigoLugar,
    direccion, fechaIngreso, saldo, activo
  ) {
    this.id                = id;
    this.codigo            = codigo            ?? null;
    this.nombre            = nombre;
    this.representante     = representante     ?? null;
    this.ruc               = ruc;
    this.telefonoPrincipal = telefonoPrincipal ?? null;
    this.telefonoSecundario= telefonoSecundario?? null;
    this.codigoLugar       = codigoLugar       ?? null;
    this.direccion         = direccion         ?? null;
    this.fechaIngreso      = fechaIngreso      ?? null;
    this.saldo             = saldo             ?? 0;
    this.activo            = activo            ?? true;
  }
}
