// src/dominio/entidades/VentaTarjeta.js
/**
 * Entidad VentaTarjeta
 * Representa una venta realizada con tarjeta de crédito/débito
 * El banco realiza depósitos parciales conforme pasan los días/meses
 */
export default class VentaTarjeta {
  constructor(
    id,
    facturaId,
    clienteId,
    clienteNombre,
    fechaVenta,
    montoTotal,
    montoRecibido,
    saldoPendiente,
    estado,
    ultimoCuatroDígitos,
    banco,
    observacion,
    usuarioId
  ) {
    this.id = id;
    this.facturaId = facturaId;
    this.clienteId = clienteId;
    this.clienteNombre = clienteNombre;
    this.fechaVenta = fechaVenta || new Date();
    this.montoTotal = montoTotal ?? 0;
    this.montoRecibido = montoRecibido ?? 0;
    this.saldoPendiente = saldoPendiente ?? 0;
    this.estado = estado || 'PENDIENTE';
    this.ultimoCuatroDígitos = ultimoCuatroDígitos || null;
    this.banco = banco || null;
    this.observacion = observacion || null;
    this.usuarioId = usuarioId || null;
  }
}
