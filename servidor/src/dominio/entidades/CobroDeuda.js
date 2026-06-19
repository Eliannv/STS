// src/dominio/entidades/CobroDeuda.js
/**
 * Entidad CobroDeuda
 * Representa un abono o pago parcial de una factura pendiente
 */
export default class CobroDeuda {
  constructor(id, facturaId, fechaPago, montoPagado, metodoPago, usuarioId, observacion, saldoAnterior, saldoNuevo) {
    this.id               = id;
    this.facturaId        = facturaId;
    this.fechaPago        = fechaPago || new Date();
    this.montoPagado      = montoPagado ?? 0;
    this.metodoPago       = metodoPago || 'EFECTIVO';
    this.usuarioId        = usuarioId || null;
    this.observacion      = observacion || null;
    this.saldoAnterior    = saldoAnterior ?? 0;
    this.saldoNuevo       = saldoNuevo ?? 0;
  }
}
