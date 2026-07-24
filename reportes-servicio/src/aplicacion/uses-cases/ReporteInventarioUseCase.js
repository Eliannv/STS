// reportes-servicio/src/aplicacion/uses-cases/ReporteInventarioUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

export default class ReporteInventarioUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('inventario-movimientos', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;
    const respuestaServicio = await this.servicios.getMovimientosStock(
      contexto.filtros,
      traceId,
    );
    if (!respuestaServicio.ok) {
      return this.errorServicio('los movimientos de inventario', respuestaServicio, traceId);
    }
    const payload = this.extraerPayload(respuestaServicio);
    const resumenOrigen = payload.summary ?? payload.resumen ?? {};
    const filas = this.extraerItems(payload).map((movimiento) => ({
      ...movimiento,
      cantidad: DecimalUtil.sumar(movimiento.cantidad ?? 0),
      costo_unitario: DecimalUtil.sumar(movimiento.costo_unitario ?? 0),
      costo_total: DecimalUtil.sumar(movimiento.costo_total ?? 0),
    }));
    const productos = new Set(
      filas.map((movimiento) => movimiento.producto_id).filter(Boolean),
    );
    const respuesta = ReporteRespuesta.ok(
      'inventario-movimientos',
      'Movimientos de Inventario',
      'Kardex',
      {
        total_entradas: DecimalUtil.sumar(
          resumenOrigen.total_entradas
          ?? DecimalUtil.sumar(
            ...filas
              .filter((movimiento) => movimiento.naturaleza === 'ENTRADA')
              .map((movimiento) => movimiento.cantidad),
          ),
        ),
        total_salidas: DecimalUtil.sumar(
          resumenOrigen.total_salidas
          ?? DecimalUtil.sumar(
            ...filas
              .filter((movimiento) => movimiento.naturaleza === 'SALIDA')
              .map((movimiento) => movimiento.cantidad),
          ),
        ),
        productos_con_movimiento: Number(
          resumenOrigen.productos_con_movimiento ?? productos.size,
        ),
        costo_total_movido: DecimalUtil.sumar(
          resumenOrigen.costo_total_movido
          ?? DecimalUtil.sumar(
            ...filas.map((movimiento) => movimiento.costo_total),
          ),
        ),
      },
      [
        { key: 'fecha_operacion', label: 'Fecha', type: 'date' },
        { key: 'producto_codigo', label: 'Código', type: 'text' },
        { key: 'producto_nombre', label: 'Producto', type: 'text' },
        { key: 'tipo_movimiento', label: 'Movimiento', type: 'badge' },
        { key: 'stock_anterior', label: 'Stock anterior', type: 'number' },
        { key: 'cantidad', label: 'Cantidad', type: 'number' },
        { key: 'stock_nuevo', label: 'Stock final', type: 'number' },
        { key: 'costo_unitario', label: 'Costo', type: 'currency' },
        { key: 'referencia_codigo', label: 'Documento', type: 'text' },
      ],
      filas,
      this.construirPaginacion(payload, contexto.page, contexto.limit, filas.length),
      contexto.filtros,
    );
    return this.guardarCache(contexto.clave, respuesta, contexto.ttl);
  }
}
