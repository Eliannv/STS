export const NATURALEZAS_MOVIMIENTO = Object.freeze(['ENTRADA', 'SALIDA', 'NEUTRO']);

export const TIPOS_MOVIMIENTO_STOCK = Object.freeze([
  'INVENTARIO_INICIAL',
  'COMPRA',
  'VENTA',
  'DEVOLUCION_CLIENTE',
  'DEVOLUCION_PROVEEDOR',
  'EGRESO',
  'AJUSTE',
  'TRANSFERENCIA_ENTRADA',
  'TRANSFERENCIA_SALIDA',
  'ANULACION_VENTA',
  'ANULACION_COMPRA',
  'ANULACION_EGRESO',
  'REVALORIZACION',
  'COMPENSACION',
]);

export const ORIGENES_MOVIMIENTO = Object.freeze(['INVENTARIO', 'FACTURACION', 'IMPORTACION', 'MIGRACION', 'SISTEMA']);

export default class MovimientoStock {
  constructor(datos = {}) {
    this.naturaleza = datos.naturaleza;
    this.tipoMovimiento = datos.tipoMovimiento;
    this.origen = datos.origen;
    this.items = datos.items || [];
    this.referenciaId = datos.referenciaId ?? null;
    this.referenciaTipo = datos.referenciaTipo ?? null;
    this.referenciaCodigo = datos.referenciaCodigo ?? null;
    this.usuarioId = datos.usuarioId ?? null;
    this.usuarioNombre = datos.usuarioNombre ?? null;
    this.sucursalId = datos.sucursalId ?? null;
    this.sucursalNombre = datos.sucursalNombre ?? null;
    this.fechaOperacion = datos.fechaOperacion ?? new Date();
    this.operacionId = datos.operacionId;
    this.idempotencyKey = datos.idempotencyKey;
    this.motivo = datos.motivo ?? null;
    this.observacion = datos.observacion ?? null;
    this.traceId = datos.traceId ?? null;
  }
}
