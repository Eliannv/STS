// src/aplicacion/dto/ProveedorDTO.js
export class ProveedorDTO {
  constructor(datos) {
    this.id                 = datos.id                 || null;
    this.codigo             = datos.codigo             || null;
    this.nombre             = datos.nombre             || null;
    this.representante      = datos.representante      || null;
    this.ruc                = datos.ruc                || null;
    this.telefonoPrincipal  = datos.telefonoPrincipal  || null;
    this.telefonoSecundario = datos.telefonoSecundario || null;
    this.codigoLugar        = datos.codigoLugar        || null;
    this.direccion          = datos.direccion          || null;
    this.fechaIngreso       = datos.fechaIngreso       || null;
    this.saldo              = datos.saldo              ?? 0;
    this.activo             = datos.activo             ?? true;
    this.buscar             = datos.buscar             || null;
  }

  getId()                 { return this.id; }
  getCodigo()             { return this.codigo; }
  getNombre()             { return this.nombre; }
  getRepresentante()      { return this.representante; }
  getRuc()                { return this.ruc; }
  getTelefonoPrincipal()  { return this.telefonoPrincipal; }
  getTelefonoSecundario() { return this.telefonoSecundario; }
  getCodigoLugar()        { return this.codigoLugar; }
  getDireccion()          { return this.direccion; }
  getFechaIngreso()       { return this.fechaIngreso; }
  getSaldo()              { return this.saldo; }
  getActivo()             { return this.activo; }
  getBuscar()             { return this.buscar; }
}
