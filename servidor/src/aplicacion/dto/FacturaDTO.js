// src/aplicacion/dto/FacturaDTO.js
export class FacturaDTO {
  constructor({ id, clienteId, nombreCliente, numeroFactura, tipo, estado, subtotal, descuento, total, saldoPendiente, observacion, metodoPago, usuarioId, historialClinicoId, fechaPago, items } = {}) {
    this._id                 = id                 ?? null;
    this._clienteId          = clienteId          ?? null;
    this._nombreCliente      = nombreCliente      ?? null;
    this._numeroFactura      = numeroFactura      ?? null;
    this._tipo               = tipo               ?? 'NORMAL';
    this._estado             = estado             ?? 'PENDIENTE';
    this._subtotal           = subtotal           ?? 0;
    this._descuento          = descuento          ?? 0;
    this._total              = total              ?? 0;
    this._saldoPendiente     = saldoPendiente     ?? 0;
    this._observacion        = observacion        ?? null;
    this._metodoPago         = metodoPago         ?? null;
    this._usuarioId          = usuarioId          ?? null;
    this._historialClinicoId = historialClinicoId ?? null;
    this._fechaPago          = fechaPago          ?? null;
    this._items              = Array.isArray(items) ? items : [];
  }

  getId()                 { return this._id; }
  getClienteId()          { return this._clienteId; }
  getNombreCliente()      { return this._nombreCliente; }
  getNumeroFactura()      { return this._numeroFactura; }
  getTipo()               { return this._tipo; }
  getEstado()             { return this._estado; }
  getSubtotal()           { return this._subtotal; }
  getDescuento()          { return this._descuento; }
  getTotal()              { return this._total; }
  getSaldoPendiente()     { return this._saldoPendiente; }
  getObservacion()        { return this._observacion; }
  getMetodoPago()         { return this._metodoPago; }
  getUsuarioId()          { return this._usuarioId; }
  getHistorialClinicoId() { return this._historialClinicoId; }
  getFechaPago()          { return this._fechaPago; }
  getItems()              { return this._items; }
}
