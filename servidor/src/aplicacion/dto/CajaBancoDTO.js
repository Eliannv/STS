// src/aplicacion/dto/CajaBancoDTO.js

export class CajaBancoDTO {
  constructor({
    id, fecha, saldoInicial, saldoActual, estado,
    usuarioId, usuarioNombre, observacion, activo,
    cerradoEn, cerradoPorId, cerradoPorNombre,
  } = {}) {
    this._id               = id               ?? null;
    this._fecha            = fecha            ?? null;
    this._saldoInicial     = saldoInicial     ?? 0;
    this._saldoActual      = saldoActual      ?? 0;
    this._estado           = estado           ?? 'ABIERTA';
    this._usuarioId        = usuarioId        ?? null;
    this._usuarioNombre    = usuarioNombre    ?? null;
    this._observacion      = observacion      ?? null;
    this._activo           = activo           ?? true;
    this._cerradoEn        = cerradoEn        ?? null;
    this._cerradoPorId     = cerradoPorId     ?? null;
    this._cerradoPorNombre = cerradoPorNombre ?? null;
  }

  getId()               { return this._id; }
  getFecha()            { return this._fecha; }
  getSaldoInicial()     { return this._saldoInicial; }
  getSaldoActual()      { return this._saldoActual; }
  getEstado()           { return this._estado; }
  getUsuarioId()        { return this._usuarioId; }
  getUsuarioNombre()    { return this._usuarioNombre; }
  getObservacion()      { return this._observacion; }
  getActivo()           { return this._activo; }
  getCerradoEn()        { return this._cerradoEn; }
  getCerradoPorId()     { return this._cerradoPorId; }
  getCerradoPorNombre() { return this._cerradoPorNombre; }
}

export class MovimientoCajaBancoDTO {
  constructor({
    id, cajaBancoId, fecha, tipo, categoria, monto,
    saldoAnterior, saldoNuevo, descripcion, referencia, ventaId,
    usuarioId, usuarioNombre,
  } = {}) {
    this._id             = id             ?? null;
    this._cajaBancoId    = cajaBancoId    ?? null;
    this._fecha          = fecha          ?? null;
    this._tipo           = tipo           ?? null;
    this._categoria      = categoria      ?? 'OTRO';
    this._monto          = monto          ?? 0;
    this._saldoAnterior  = saldoAnterior  ?? 0;
    this._saldoNuevo     = saldoNuevo     ?? 0;
    this._descripcion    = descripcion    ?? null;
    this._referencia     = referencia     ?? null;
    this._ventaId        = ventaId        ?? null;
    this._usuarioId      = usuarioId      ?? null;
    this._usuarioNombre  = usuarioNombre  ?? null;
  }

  getId()            { return this._id; }
  getCajaBancoId()   { return this._cajaBancoId; }
  getFecha()         { return this._fecha; }
  getTipo()          { return this._tipo; }
  getCategoria()     { return this._categoria; }
  getMonto()         { return this._monto; }
  getSaldoAnterior() { return this._saldoAnterior; }
  getSaldoNuevo()    { return this._saldoNuevo; }
  getDescripcion()   { return this._descripcion; }
  getReferencia()    { return this._referencia; }
  getVentaId()       { return this._ventaId; }
  getUsuarioId()     { return this._usuarioId; }
  getUsuarioNombre() { return this._usuarioNombre; }
}
