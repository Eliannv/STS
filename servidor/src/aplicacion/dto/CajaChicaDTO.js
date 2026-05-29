// src/aplicacion/dto/CajaChicaDTO.js

export class CajaChicaDTO {
  constructor({
    id, fecha, montoInicial, montoActual, estado,
    usuarioId, usuarioNombre, observacion, activo, cajaBancoId,
    cerradoEn, cerradoPorId, cerradoPorNombre,
  } = {}) {
    this._id               = id               ?? null;
    this._fecha            = fecha            ?? null;
    this._montoInicial     = montoInicial     ?? 0;
    this._montoActual      = montoActual      ?? 0;
    this._estado           = estado           ?? 'ABIERTA';
    this._usuarioId        = usuarioId        ?? null;
    this._usuarioNombre    = usuarioNombre    ?? null;
    this._observacion      = observacion      ?? null;
    this._activo           = activo           ?? true;
    this._cajaBancoId      = cajaBancoId      ?? null;
    this._cerradoEn        = cerradoEn        ?? null;
    this._cerradoPorId     = cerradoPorId     ?? null;
    this._cerradoPorNombre = cerradoPorNombre ?? null;
  }

  getId()               { return this._id; }
  getFecha()            { return this._fecha; }
  getMontoInicial()     { return this._montoInicial; }
  getMontoActual()      { return this._montoActual; }
  getEstado()           { return this._estado; }
  getUsuarioId()        { return this._usuarioId; }
  getUsuarioNombre()    { return this._usuarioNombre; }
  getObservacion()      { return this._observacion; }
  getActivo()           { return this._activo; }
  getCajaBancoId()      { return this._cajaBancoId; }
  getCerradoEn()        { return this._cerradoEn; }
  getCerradoPorId()     { return this._cerradoPorId; }
  getCerradoPorNombre() { return this._cerradoPorNombre; }
}

export class MovimientoCajaChicaDTO {
  constructor({
    id, cajaChicaId, fecha, tipo, descripcion, monto,
    saldoAnterior, saldoNuevo, usuarioId, usuarioNombre, referencia,
  } = {}) {
    this._id             = id             ?? null;
    this._cajaChicaId    = cajaChicaId    ?? null;
    this._fecha          = fecha          ?? null;
    this._tipo           = tipo           ?? null;
    this._descripcion    = descripcion    ?? null;
    this._monto          = monto          ?? 0;
    this._saldoAnterior  = saldoAnterior  ?? 0;
    this._saldoNuevo     = saldoNuevo     ?? 0;
    this._usuarioId      = usuarioId      ?? null;
    this._usuarioNombre  = usuarioNombre  ?? null;
    this._referencia     = referencia     ?? null;
  }

  getId()            { return this._id; }
  getCajaChicaId()   { return this._cajaChicaId; }
  getFecha()         { return this._fecha; }
  getTipo()          { return this._tipo; }
  getDescripcion()   { return this._descripcion; }
  getMonto()         { return this._monto; }
  getSaldoAnterior() { return this._saldoAnterior; }
  getSaldoNuevo()    { return this._saldoNuevo; }
  getUsuarioId()     { return this._usuarioId; }
  getUsuarioNombre() { return this._usuarioNombre; }
  getReferencia()    { return this._referencia; }
}
