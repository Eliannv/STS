export class IngresoDTO {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.idPersonalizado = datos.idPersonalizado ?? null;
    this.proveedorId = datos.proveedorId ?? null;
    this.proveedorNombre = datos.proveedorNombre ?? null;
    this.numeroFactura = datos.numeroFactura ?? null;
    this.fecha = datos.fecha ?? null;
    this.tipoCompra = datos.tipoCompra ?? 'CONTADO';
    this.observacion = datos.observacion ?? null;
    this.descuento = Number(datos.descuento) || 0;
    this.flete = Number(datos.flete) || 0;
    this.iva = Number(datos.iva) || 0;
    this.total = Number(datos.total) || 0;
    this.estado = datos.estado ?? null;
    this.usuarioId = datos.usuarioId ?? null;
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
