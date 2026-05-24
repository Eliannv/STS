// src/aplicacion/dto/ProductoDTO.js
export class ProductoDTO {
  constructor(datos) {
    this.id               = datos.id               || null;
    this.idInterno        = datos.idInterno        ?? null;
    this.codigo           = datos.codigo           || null;
    this.nombre           = datos.nombre           || null;
    this.modelo           = datos.modelo           || null;
    this.color            = datos.color            || null;
    this.grupo            = datos.grupo            || null;
    this.stock            = datos.stock            ?? 0;
    this.tipoControlStock = datos.tipoControlStock || 'NORMAL';
    this.costo            = datos.costo            ?? 0;
    this.pvp1             = datos.pvp1             ?? 0;
    this.iva              = datos.iva              ?? 0;
    this.precioConIva     = datos.precioConIva     ?? 0;
    this.proveedorId      = datos.proveedorId      || null;
    this.ingresoId        = datos.ingresoId        || null;
    this.observacion      = datos.observacion      || null;
    this.activo           = datos.activo           ?? true;
    this.buscar           = datos.buscar           || null;
    this.sucursalId       = datos.sucursalId       || null;
  }

  getId()               { return this.id; }
  getIdInterno()        { return this.idInterno; }
  getCodigo()           { return this.codigo; }
  getNombre()           { return this.nombre; }
  getModelo()           { return this.modelo; }
  getColor()            { return this.color; }
  getGrupo()            { return this.grupo; }
  getStock()            { return this.stock; }
  getTipoControlStock() { return this.tipoControlStock; }
  getCosto()            { return this.costo; }
  getPvp1()             { return this.pvp1; }
  getIva()              { return this.iva; }
  getPrecioConIva()     { return this.precioConIva; }
  getProveedorId()      { return this.proveedorId; }
  getIngresoId()        { return this.ingresoId; }
  getObservacion()      { return this.observacion; }
  getActivo()           { return this.activo; }
  getBuscar()           { return this.buscar; }
  getSucursalId()       { return this.sucursalId; }
}
