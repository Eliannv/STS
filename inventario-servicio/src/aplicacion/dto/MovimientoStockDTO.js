export default class MovimientoStockDTO {
  constructor(datos = {}) {
    this.movimientoId = datos.movimientoId ?? null;
    this.naturaleza = datos.naturaleza ?? null;
    this.tipoMovimiento = datos.tipoMovimiento ?? datos.tipo_movimiento ?? null;
    this.origen = datos.origen ?? 'INVENTARIO';
    this.items = (datos.items || []).map((item) => ({
      productoId: Number(item.productoId ?? item.producto_id),
      cantidad: Number(item.cantidad) || 0,
      costoUnitario: item.costoUnitario ?? item.costo_unitario ?? null,
      precioVenta: item.precioVenta ?? item.precio_venta ?? null,
      lineaId: item.lineaId ?? item.linea_id ?? item.id ?? null,
      movimientoRevertidoId: item.movimientoRevertidoId ?? item.movimiento_revertido_id ?? null,
    }));
    this.referenciaId = datos.referenciaId ?? datos.referencia_id ?? null;
    this.referenciaTipo = datos.referenciaTipo ?? datos.referencia_tipo ?? null;
    this.referenciaCodigo = datos.referenciaCodigo ?? datos.referencia_codigo ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.sucursalId = datos.sucursalId ?? datos.sucursal_id ?? null;
    this.sucursalNombre = datos.sucursalNombre ?? datos.sucursal_nombre ?? null;
    this.fechaOperacion = datos.fechaOperacion ?? datos.fecha_operacion ?? new Date();
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key ?? null;
    this.motivo = datos.motivo ?? null;
    this.observacion = datos.observacion ?? null;
    this.traceId = datos.traceId ?? datos.trace_id ?? null;
    this.tipoOriginal = datos.tipoOriginal ?? datos.tipo_original ?? null;
  }
}
