export default class Factura {
  constructor(id, datos = {}) {
    this.id = id;
    this.clienteId = datos.clienteId;
    this.nombreCliente = datos.nombreCliente ?? null;
    this.tipo = datos.tipo ?? 'CONTADO';
    this.estado = datos.estado ?? 'PAGADA';
    this.subtotal = datos.subtotal ?? 0;
    this.descuento = datos.descuento ?? 0;
    this.total = datos.total ?? 0;
    this.saldoPendiente = datos.saldoPendiente ?? 0;
    this.observacion = datos.observacion ?? null;
    this.metodoPago = datos.metodoPago ?? 'EFECTIVO';
    this.usuarioId = datos.usuarioId ?? null;
    this.historialClinicoId = datos.historialClinicoId ?? null;
    this.fechaPago = datos.fechaPago ?? null;
    this.items = datos.items ?? [];
  }
}
