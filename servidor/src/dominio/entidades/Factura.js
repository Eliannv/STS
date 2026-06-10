// src/dominio/entidades/Factura.js
export default class Factura {
  constructor(id, clienteId, numeroFactura, tipo, estado, subtotal, descuento, total, saldoPendiente, observacion, usuarioId, nombreCliente, metodoPago, historialClinicoId, fechaPago, items) {
    this.id                 = id;
    this.clienteId          = clienteId;
    this.numeroFactura      = numeroFactura;
    this.tipo               = tipo           || 'NORMAL';
    this.estado             = estado         || 'PENDIENTE';
    this.subtotal           = subtotal       ?? 0;
    this.descuento          = descuento      ?? 0;
    this.total              = total          ?? 0;
    this.saldoPendiente     = saldoPendiente ?? 0;
    this.observacion        = observacion    || null;
    this.usuarioId          = usuarioId      || null;
    this.nombreCliente      = nombreCliente  || null;
    this.metodoPago         = metodoPago     || null;
    this.historialClinicoId = historialClinicoId || null;
    this.fechaPago          = fechaPago      || null;
    this.items              = items          || [];
  }
}
