import MovimientoStock, { NATURALEZAS_MOVIMIENTO, ORIGENES_MOVIMIENTO, TIPOS_MOVIMIENTO_STOCK } from '../entidades/MovimientoStock.js';

export default class MovimientoStockDominioServicio {
  constructor(salidaCommand) {
    this.salidaCommand = salidaCommand;
  }

  aplicar(datos, opciones = {}) {
    const movimiento = datos instanceof MovimientoStock ? datos : new MovimientoStock(datos);
    const error = this.validar(movimiento);
    if (error) return Promise.resolve({ estado: 'error', resultado: error });
    return this.salidaCommand.aplicar(movimiento, opciones);
  }

  revertirMovimiento(datos, opciones = {}) {
    if (!datos.movimientoId) return Promise.resolve({ estado: 'error', resultado: 'movimientoId es requerido' });
    if (!TIPOS_MOVIMIENTO_STOCK.includes(datos.tipoMovimiento)) return Promise.resolve({ estado: 'error', resultado: 'tipoMovimiento inválido' });
    if (!datos.operacionId || !datos.idempotencyKey) return Promise.resolve({ estado: 'error', resultado: 'operacionId e idempotencyKey son requeridos' });
    return this.salidaCommand.revertirMovimiento(datos, opciones);
  }

  revertirReferencia(datos, opciones = {}) {
    if (!datos.referenciaTipo || !datos.referenciaId) return Promise.resolve({ estado: 'error', resultado: 'referenciaTipo y referenciaId son requeridos' });
    if (!TIPOS_MOVIMIENTO_STOCK.includes(datos.tipoMovimiento)) return Promise.resolve({ estado: 'error', resultado: 'tipoMovimiento inválido' });
    if (!datos.operacionId || !datos.idempotencyKey) return Promise.resolve({ estado: 'error', resultado: 'operacionId e idempotencyKey son requeridos' });
    return this.salidaCommand.revertirReferencia(datos, opciones);
  }

  validar(movimiento) {
    if (!NATURALEZAS_MOVIMIENTO.includes(movimiento.naturaleza)) return 'naturaleza inválida';
    if (!TIPOS_MOVIMIENTO_STOCK.includes(movimiento.tipoMovimiento)) return 'tipoMovimiento inválido';
    if (!ORIGENES_MOVIMIENTO.includes(movimiento.origen)) return 'origen inválido';
    if (!movimiento.operacionId || !movimiento.idempotencyKey) return 'operacionId e idempotencyKey son requeridos';
    if (!Array.isArray(movimiento.items) || movimiento.items.length === 0) return 'Se requiere al menos un producto';
    for (const item of movimiento.items) {
      if (!item.productoId) return 'Cada item requiere productoId';
      const cantidad = Number(item.cantidad);
      if (cantidad <= 0) return 'La cantidad debe ser positiva';
    }
    return null;
  }
}
