// src/aplicacion/dto/ClienteDTO.js
export class ClienteDTO {
  constructor(datos) {
    this.id                   = datos.id                   || null;
    this.nombres              = datos.nombres              || '';
    this.apellidos            = datos.apellidos            || '';
    this.cedula               = datos.cedula               || null;
    this.telefono             = datos.telefono             || null;
    this.email                = datos.email                || null;
    this.fechaNacimiento      = datos.fechaNacimiento      || null;
    this.direccion            = datos.direccion            || null;
    this.pais                 = datos.pais                 || null;
    this.provincia            = datos.provincia            || null;
    this.ciudad               = datos.ciudad               || null;
    this.activo               = datos.activo !== undefined ? datos.activo : true;
    this.tieneHistorialClinico = datos.tieneHistorialClinico ?? false;
    this.tieneCredito         = datos.tieneCredito         ?? false;
    this.tieneDeuda           = datos.tieneDeuda           ?? false;
    this.esConsumidorFinal    = datos.esConsumidorFinal    ?? false;
    this.buscar               = datos.buscar               || null;
  }

  getId()                   { return this.id; }
  getNombres()              { return this.nombres; }
  getApellidos()            { return this.apellidos; }
  getCedula()               { return this.cedula; }
  getTelefono()             { return this.telefono; }
  getEmail()                { return this.email; }
  getFechaNacimiento()      { return this.fechaNacimiento; }
  getDireccion()            { return this.direccion; }
  getPais()                 { return this.pais; }
  getProvincia()            { return this.provincia; }
  getCiudad()               { return this.ciudad; }
  getActivo()               { return this.activo; }
  getTieneHistorialClinico(){ return this.tieneHistorialClinico; }
  getTieneCredito()         { return this.tieneCredito; }
  getTieneDeuda()           { return this.tieneDeuda; }
  getEsConsumidorFinal()    { return this.esConsumidorFinal; }
  getBuscar()               { return this.buscar; }
}
