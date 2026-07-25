// inventario-servicio/src/dominio/servicios/EgresoDominioServicio.js
import MovimientoStock from '../entidades/MovimientoStock.js';

const centavos = (valor) => Math.round(Number(valor ?? 0) * 100);
const valor = (objeto, camel, snake) => objeto?.[camel] ?? objeto?.[snake];

export default class EgresoDominioServicio {
  validarPuedeConfirmar(egreso, detalles = []) {
    if (!egreso?.esEditable?.()) {
      throw new Error('Solo se puede confirmar un egreso en borrador');
    }
    if (!Array.isArray(detalles) || detalles.length === 0) {
      throw new Error('Documento vacío');
    }
    const productos = detalles.map((detalle) => Number(detalle.getProductoId()));
    if (new Set(productos).size !== productos.length) {
      throw new Error('No se permiten productos duplicados');
    }
    if (detalles.some((detalle) => Number(detalle.getCantidad()) <= 0)) {
      throw new Error('Las cantidades deben ser mayores que cero');
    }
  }

  validarPuedeAnular(egreso) {
    if (!egreso?.estaConfirmado?.()) {
      throw new Error('Solo se puede anular un egreso confirmado');
    }
    if (egreso.getEstado() === 'ANULADO') {
      throw new Error('El egreso ya fue anulado');
    }
  }

  calcularCostoTotal(detalles = []) {
    const totalCentavos = detalles.reduce(
      (total, detalle) => total + centavos(detalle.calcularSubtotal()),
      0,
    );
    return totalCentavos / 100;
  }

  construirIdempotencyKeyDetalle(egresoId, productoId, index) {
    return `CONFIRMAR_EGRESO:${egresoId}:DETALLE:${index}:${productoId}`;
  }

  construirIdempotencyKeyAnulacion(egresoId, movimientoId) {
    return `ANULAR_EGRESO:${egresoId}:MOVIMIENTO:${movimientoId}`;
  }

  determinarNaturalezaMovimiento() {
    return 'SALIDA';
  }

  determinarTipoMovimientoStock(tipoEgreso) {
    const tiposDirectos = [
      'DEVOLUCION_PROVEEDOR',
      'MERMA',
      'ROTURA',
      'ROBO',
      'PERDIDA',
      'VENCIMIENTO',
      'CONSUMO_INTERNO',
      'MUESTRA',
      'DONACION',
      'OBSOLESCENCIA',
      'RETIRO_CALIDAD',
    ];
    return tiposDirectos.includes(tipoEgreso) ? tipoEgreso : 'EGRESO';
  }

  construirMovimientoStock(params = {}) {
    const {
      egreso,
      detalle,
      index = 0,
      operacionId,
      usuarioId,
      usuarioNombre,
      traceId,
    } = params;
    const idempotencyKey = this.construirIdempotencyKeyDetalle(
      egreso.getId(),
      detalle.getProductoId(),
      index,
    );
    return new MovimientoStock({
      naturaleza: this.determinarNaturalezaMovimiento(egreso.getTipoEgreso()),
      tipoMovimiento: this.determinarTipoMovimientoStock(egreso.getTipoEgreso()),
      origen: 'INVENTARIO',
      items: [{
        productoId: detalle.getProductoId(),
        cantidad: detalle.getCantidad(),
        costoUnitario: detalle.getCostoUnitario(),
        lineaId: detalle.getId(),
        idempotencyKey,
      }],
      referenciaId: egreso.getId(),
      referenciaTipo: 'EGRESO',
      referenciaCodigo: egreso.getIdPersonalizado(),
      usuarioId,
      usuarioNombre,
      sucursalId: egreso.getSucursalId(),
      sucursalNombre: egreso.getSucursalNombre(),
      fechaOperacion: new Date(),
      operacionId,
      idempotencyKey,
      motivo: egreso.getMotivo() ?? egreso.getTipoEgreso(),
      observacion: egreso.getObservacion() ?? egreso.getDescripcion(),
      traceId,
    });
  }

  construirMovimientoAnulacion(
    movimientoOriginal,
    operacionId,
    usuarioId,
    usuarioNombre,
  ) {
    const movimientoId = valor(movimientoOriginal, 'id', 'id');
    const egresoId = valor(
      movimientoOriginal,
      'referenciaId',
      'referencia_id',
    );
    const idempotencyKey = this.construirIdempotencyKeyAnulacion(
      egresoId,
      movimientoId,
    );
    return new MovimientoStock({
      naturaleza: 'ENTRADA',
      tipoMovimiento: 'ANULACION_EGRESO',
      origen: 'INVENTARIO',
      items: [{
        productoId: valor(movimientoOriginal, 'productoId', 'producto_id'),
        cantidad: valor(movimientoOriginal, 'cantidad', 'cantidad'),
        costoUnitario: valor(
          movimientoOriginal,
          'costoUnitario',
          'costo_unitario',
        ),
        precioVenta: valor(movimientoOriginal, 'precioVenta', 'precio_venta'),
        lineaId: movimientoId,
        movimientoRevertidoId: movimientoId,
        idempotencyKey,
      }],
      referenciaId: egresoId,
      referenciaTipo: 'EGRESO',
      referenciaCodigo: valor(
        movimientoOriginal,
        'referenciaCodigo',
        'referencia_codigo',
      ),
      usuarioId,
      usuarioNombre,
      sucursalId: valor(movimientoOriginal, 'sucursalId', 'sucursal_id'),
      sucursalNombre: valor(
        movimientoOriginal,
        'sucursalNombre',
        'sucursal_nombre',
      ),
      fechaOperacion: new Date(),
      operacionId,
      idempotencyKey,
      motivo: 'Anulación de egreso',
      observacion: 'Movimiento compensatorio de egreso',
      traceId: valor(movimientoOriginal, 'traceId', 'trace_id'),
    });
  }
}
