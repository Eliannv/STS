export class CobroDeudaDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.facturaId = datos.facturaId ?? datos.factura_id ?? null;
    this.fechaPago = datos.fechaPago ?? datos.fecha_pago ?? new Date().toISOString();
    this.montoPagado = Number(datos.montoPagado ?? datos.monto_pagado) || 0;
    this.metodoPago = datos.metodoPago ?? datos.metodo_pago ?? 'EFECTIVO';
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.observacion = datos.observacion ?? null;
  }
}
