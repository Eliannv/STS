// src/aplicacion/dto/CobroDeudaDTO.js
/**
 * DTO para transferencia de datos de Cobro de Deuda
 * Valida entrada del cliente y normaliza tipos
 */
export class CobroDeudaDTO {
  constructor({ id, facturaId, fechaPago, montoPagado, metodoPago, usuarioId, observacion, saldoAnterior, saldoNuevo } = {}) {
    this._id             = id ?? null;
    this._facturaId      = facturaId ?? null;
    this._fechaPago      = fechaPago ?? new Date().toISOString();
    this._montoPagado    = montoPagado ?? 0;
    this._metodoPago     = metodoPago ?? 'EFECTIVO';
    this._usuarioId      = usuarioId ?? null;
    this._observacion    = observacion ?? null;
    this._saldoAnterior  = saldoAnterior ?? 0;
    this._saldoNuevo     = saldoNuevo ?? 0;
  }

  getId()              { return this._id; }
  getFacturaId()       { return this._facturaId; }
  getFechaPago()       { return this._fechaPago; }
  getMontoPagado()     { return this._montoPagado; }
  getMetodoPago()      { return this._metodoPago; }
  getUsuarioId()       { return this._usuarioId; }
  getObservacion()     { return this._observacion; }
  getSaldoAnterior()   { return this._saldoAnterior; }
  getSaldoNuevo()      { return this._saldoNuevo; }
}
