export class FacturaDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.clienteId = datos.clienteId ?? datos.cliente_id ?? null;
    this.nombreCliente = datos.nombreCliente ?? datos.clienteNombre ?? datos.cliente_nombre ?? null;
    this.numeroFactura = datos.numeroFactura ?? datos.numero_factura ?? null;
    this.tipo = datos.tipo ?? datos.tipoVenta ?? datos.tipo_venta ?? 'CONTADO';
    this.estado = datos.estado ?? datos.estadoPago ?? datos.estado_pago ?? 'PAGADA';
    this.subtotal = Number(datos.subtotal) || 0;
    this.descuento = Number(datos.descuento) || 0;
    this.total = Number(datos.total) || 0;
    this.saldoPendiente = Number(datos.saldoPendiente ?? datos.saldo_pendiente) || 0;
    this.observacion = datos.observacion ?? null;
    this.metodoPago = datos.metodoPago ?? datos.metodo_pago ?? 'EFECTIVO';
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.historialClinicoId = datos.historialClinicoId ?? datos.historial_clinico_id ?? null;
    this.fechaPago = datos.fechaPago ?? datos.fecha_pago ?? null;
    this.items = Array.isArray(datos.items) ? datos.items : [];
  }
}
