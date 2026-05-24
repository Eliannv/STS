// src/aplicacion/dto/UsuarioDTO.js
export class UsuarioDTO {
  constructor(datos) {
    this.id              = datos.id              || null;
    this.nombre          = datos.nombre          || '';
    this.apellido        = datos.apellido        || '';
    this.email           = datos.email           || '';
    this.password        = datos.password        || '';
    this.cedula          = datos.cedula          || null;
    this.fechaNacimiento = datos.fechaNacimiento || null;
    this.rol             = datos.rol             || 'OPERADOR';
    this.activo          = datos.activo !== undefined ? datos.activo : true;
    this.sucursalId      = datos.sucursalId      || null;
  }

  getId()             { return this.id; }
  getNombre()         { return this.nombre; }
  getApellido()       { return this.apellido; }
  getEmail()          { return this.email; }
  getPassword()       { return this.password; }
  getCedula()         { return this.cedula; }
  getFechaNacimiento(){ return this.fechaNacimiento; }
  getRol()            { return this.rol; }
  getActivo()         { return this.activo; }
  getSucursalId()     { return this.sucursalId; }
}