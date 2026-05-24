// src/dominio/entidades/Cliente.js
export default class Cliente {
  constructor(
    id, nombres, apellidos, cedula, telefono, email,
    fechaNacimiento, direccion, pais, provincia, ciudad,
    activo, tieneHistorialClinico, tieneCredito, tieneDeuda,
    esConsumidorFinal
  ) {
    this.id                   = id;
    this.nombres              = nombres;
    this.apellidos            = apellidos;
    this.cedula               = cedula               ?? null;
    this.telefono             = telefono             ?? null;
    this.email                = email               ?? null;
    this.fechaNacimiento      = fechaNacimiento      ?? null;
    this.direccion            = direccion            ?? null;
    this.pais                 = pais                ?? null;
    this.provincia            = provincia           ?? null;
    this.ciudad               = ciudad              ?? null;
    this.activo               = activo              ?? true;
    this.tieneHistorialClinico = tieneHistorialClinico ?? false;
    this.tieneCredito         = tieneCredito         ?? false;
    this.tieneDeuda           = tieneDeuda           ?? false;
    this.esConsumidorFinal    = esConsumidorFinal    ?? false;
  }
}
