// inventario-servicio/src/aplicacion/dto/IngresoDTO.js
export class IngresoDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.idPersonalizado = datos.idPersonalizado ?? null;
    this.proveedorId = datos.proveedorId ?? null;
    this.proveedorNombre = datos.proveedorNombre ?? null;
    this.numeroFactura = datos.numeroFactura ?? null;
    this.fecha = datos.fecha ?? null;
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
      ?? null;
    this.cuentaPagarId =
      datos.cuentaPagarId
      ?? datos.cuenta_pagar_id
      ?? null;
    this.observacion = datos.observacion ?? null;
    this.descuento = Number(datos.descuento) || 0;
    this.flete = Number(datos.flete) || 0;
    this.iva = Number(datos.iva) || 0;
    this.total = Number(datos.total) || 0;
    this.estado = datos.estado ?? null;
    this.usuarioId = datos.usuarioId ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? null;
    this.sucursalId = datos.sucursalId ?? null;
    this.sucursalNombre = datos.sucursalNombre ?? null;
    this.origen = datos.origen ?? 'INVENTARIO';
    this.operacionId = datos.operacionId ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? null;
    this.motivo = datos.motivo ?? null;
    this.conReembolso =
      datos.conReembolso
      ?? datos.con_reembolso
      ?? false;
    this.operacionIdOriginal =
      datos.operacionIdOriginal
      ?? datos.operacion_id_original
      ?? null;
    this.traceId = datos.traceId ?? null;
    this.buscar = datos.buscar ?? null;
    this.fechaDesde = datos.fechaDesde ?? null;
    this.fechaHasta = datos.fechaHasta ?? null;
    this.detalles = (datos.detalles || []).map((detalle) => new DetalleIngresoDTO(detalle));
  }
}

export class DetalleIngresoDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.ingresoId = datos.ingresoId ?? datos.ingreso_id ?? null;
    this.productoId = datos.productoId ?? datos.producto_id ?? null;
    this.tipo = datos.tipo ?? 'EXISTENTE';
    this.codigo = datos.codigo ?? null;
    this.nombre = datos.nombre ?? null;
    this.modelo = datos.modelo ?? null;
    this.color = datos.color ?? null;
    this.grupo = datos.grupo ?? null;
    this.pvp1 = datos.pvp1 == null ? null : Number(datos.pvp1);
    this.observacion = datos.observacion ?? null;
    this.stockIngresado = Number(datos.stockIngresado ?? datos.stock_ingresado) || 0;
    this.costoUnitario = Number(datos.costoUnitario ?? datos.costo_unitario) || 0;
    this.subtotal = Number(datos.subtotal) || 0;
  }
}
