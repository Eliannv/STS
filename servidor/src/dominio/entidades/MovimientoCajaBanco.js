// src/dominio/entidades/MovimientoCajaBanco.js
export default class MovimientoCajaBanco {
  constructor(id, cajaBancoId, fecha, tipo, categoria, monto, saldoAnterior, saldoNuevo, descripcion, referenciaId, ventaId, usuarioId, usuarioNombre) {
    this.id             = id;
    this.cajaBancoId    = cajaBancoId;
    this.fecha          = fecha          ?? new Date();
    this.tipo           = tipo           || 'INGRESO';
    this.categoria      = categoria      || 'OTRO_INGRESO';
    this.monto          = monto          ?? 0;
    this.saldoAnterior  = saldoAnterior  ?? 0;
    this.saldoNuevo     = saldoNuevo     ?? 0;
    this.descripcion    = descripcion    || null;
    this.referenciaId   = referenciaId   ?? null;
    this.ventaId        = ventaId        ?? null;  // ID de la factura/venta para trazabilidad
    this.usuarioId      = usuarioId      ?? null;
    this.usuarioNombre  = usuarioNombre  || null;
  }
}
