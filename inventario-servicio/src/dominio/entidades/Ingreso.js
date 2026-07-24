// inventario-servicio/src/dominio/entidades/Ingreso.js
export default class Ingreso {
  constructor(id, datos = {}) {
    this.id = id;
    this.idPersonalizado = datos.idPersonalizado ?? null;
    this.proveedorId = datos.proveedorId ?? null;
    this.proveedorNombre = datos.proveedorNombre ?? null;
    this.numeroFactura = datos.numeroFactura;
    this.fecha = datos.fecha;
    this.tipoCompra = datos.tipoCompra ?? 'CONTADO';
    this.metodoPago = datos.metodoPago ?? datos.metodo_pago ?? null;
    this.cajaTipo = datos.cajaTipo ?? datos.caja_tipo ?? null;
    this.cajaId = datos.cajaId ?? datos.caja_id ?? null;
    this.fechaVencimiento =
      datos.fechaVencimiento
      ?? datos.fecha_vencimiento
      ?? null;
    this.estadoFinanciero =
      datos.estadoFinanciero
      ?? datos.estado_financiero
      ?? 'NO_APLICA';
    this.cuentaPagarId =
      datos.cuentaPagarId
      ?? datos.cuenta_pagar_id
      ?? null;
    this.observacion = datos.observacion ?? null;
    this.descuento = datos.descuento ?? 0;
    this.flete = datos.flete ?? 0;
    this.iva = datos.iva ?? 0;
    this.total = datos.total ?? 0;
    this.estado = datos.estado ?? 'BORRADOR';
    this.usuarioId = datos.usuarioId ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? null;
    this.sucursalId = datos.sucursalId ?? null;
    this.sucursalNombre = datos.sucursalNombre ?? null;
    this.origen = datos.origen ?? 'INVENTARIO';
    this.operacionId = datos.operacionId ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? null;
    this.traceId = datos.traceId ?? null;
  }
}
