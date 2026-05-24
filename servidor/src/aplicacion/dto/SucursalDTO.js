// src/aplicacion/dto/SucursalDTO.js
export class SucursalDTO {
  constructor(datos) {
    this.id          = datos.id          || null;
    this.codigo      = datos.codigo      || '';
    this.nombre      = datos.nombre      || '';
    this.activo      = datos.activo !== undefined ? datos.activo : true;
    this.direccion   = datos.direccion   || null;
    this.telefono    = datos.telefono    || null;
    this.creadoPorId = datos.creadoPorId || null;
  }

  getId()          { return this.id; }
  getCodigo()      { return this.codigo; }
  getNombre()      { return this.nombre; }
  getActivo()      { return this.activo; }
  getDireccion()   { return this.direccion; }
  getTelefono()    { return this.telefono; }
  getCreadoPorId() { return this.creadoPorId; }
}
