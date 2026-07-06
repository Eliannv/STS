// src/aplicacion/dto/VentaTarjetaDTO.js
/**
 * DTO para transferencia de datos de Ventas con Tarjeta
 * Valida entrada del cliente y normaliza tipos
 */
export class VentaTarjetaAbonoDTO {
  constructor({
    ventaTarjetaId,
    fecha,
    monto,
    observacion,
    usuarioId
  } = {}) {
    this._ventaTarjetaId = ventaTarjetaId ?? null;
    this._fecha = fecha ?? new Date().toISOString();
    this._monto = monto ?? 0;
    this._observacion = observacion ?? null;
    this._usuarioId = usuarioId ?? null;
  }

  getVentaTarjetaId() { return this._ventaTarjetaId; }
  getFecha() { return this._fecha; }
  getMonto() { return this._monto; }
  getObservacion() { return this._observacion; }
  getUsuarioId() { return this._usuarioId; }
}
