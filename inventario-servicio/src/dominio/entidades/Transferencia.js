export const ESTADOS_TRANSFERENCIA = Object.freeze(['CONFIRMADA', 'ANULADA']);

export default class Transferencia {
  constructor(datos = {}) {
    this.id = datos.id ?? null;
    this.idPersonalizado = datos.idPersonalizado ?? datos.id_personalizado ?? null;
    this.sucursalOrigenId = Number(datos.sucursalOrigenId ?? datos.sucursal_origen_id) || null;
    this.sucursalOrigenNombre = datos.sucursalOrigenNombre ?? datos.sucursal_origen_nombre ?? null;
    this.sucursalDestinoId = Number(datos.sucursalDestinoId ?? datos.sucursal_destino_id) || null;
    this.sucursalDestinoNombre = datos.sucursalDestinoNombre ?? datos.sucursal_destino_nombre ?? null;
    this.fecha = datos.fecha ?? new Date();
    this.estado = datos.estado ?? 'CONFIRMADA';
    this.motivo = datos.motivo ?? null;
    this.observacion = datos.observacion ?? null;
    this.items = (datos.items ?? []).map((item) => ({
      productoId: Number(item.productoId ?? item.producto_id) || null,
      cantidad: Number(item.cantidad) || 0,
    }));
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? datos.usuario_nombre ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
    this.idempotencyKey = datos.idempotencyKey ?? datos.idempotency_key ?? null;
    this.traceId = datos.traceId ?? datos.trace_id ?? null;
  }

  // Una transferencia mueve stock real: cualquier dato ausente corrompería el kardex.
  validar() {
    if (!this.sucursalOrigenId) return 'La sucursal de origen es requerida';
    if (!this.sucursalDestinoId) return 'La sucursal de destino es requerida';
    if (this.sucursalOrigenId === this.sucursalDestinoId) return 'La sucursal de origen y destino no pueden ser la misma';
    if (!this.operacionId || !this.idempotencyKey) return 'operacionId e idempotencyKey son requeridos';
    if (!Array.isArray(this.items) || this.items.length === 0) return 'Se requiere al menos un producto';

    const productos = new Set();
    for (const item of this.items) {
      if (!item.productoId) return 'Cada item requiere productoId';
      if (!(item.cantidad > 0)) return 'La cantidad debe ser positiva';
      if (productos.has(item.productoId)) return 'Hay productos repetidos en la transferencia';
      productos.add(item.productoId);
    }
    return null;
  }
}
