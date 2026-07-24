// reportes-servicio/src/aplicacion/uses-cases/ReporteCobrosUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

const CATEGORIAS_COBRO = new Set([
  'COBRO_DEUDA_EFECTIVO',
  'COBRO_DEUDA_TRANSFERENCIA',
]);

export default class ReporteCobrosUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('cobros', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;

    const paralelo = await this.dominio.aplicarParalelo([
      this.servicios.getMovimientosCaja({
        ...contexto.filtros,
        tipo: 'INGRESO',
        categorias:
          'COBRO_DEUDA_EFECTIVO,COBRO_DEUDA_TRANSFERENCIA',
      }, traceId),
      this.servicios.getCobrosPeriodo(contexto.filtros, traceId),
    ]);
    const movimientosRespuesta = paralelo.resultados.find(
      ({ indice }) => indice === 0,
    )?.valor;
    if (!movimientosRespuesta) {
      return this.errorServicio('el reporte de cobros', paralelo.fallidos[0], traceId);
    }

    const payload = this.extraerPayload(movimientosRespuesta);
    const resumenMovimientos = payload.summary ?? payload.resumen ?? {};
    const detallesRespuesta = paralelo.resultados.find(
      ({ indice }) => indice === 1,
    )?.valor;
    const detalles = detallesRespuesta
      ? this.extraerItems(this.extraerPayload(detallesRespuesta))
      : [];
    const resumenDetalles = detallesRespuesta
      ? (
        this.extraerPayload(detallesRespuesta).summary
        ?? this.extraerPayload(detallesRespuesta).resumen
        ?? {}
      )
      : {};
    const detallePorOperacion = new Map(
      detalles.map((detalle) => [detalle.operacion_id, detalle]),
    );
    const filas = this.extraerItems(payload)
      .filter((movimiento) => CATEGORIAS_COBRO.has(movimiento.categoria))
      .map((movimiento) => {
        const detalle = detallePorOperacion.get(movimiento.operacion_id) ?? {};
        return {
          fecha: movimiento.fecha_operacion ?? movimiento.fecha,
          cliente: detalle.cliente ?? detalle.cliente_nombre ?? null,
          factura_ref:
            movimiento.referencia_codigo
            ?? detalle.factura_ref
            ?? detalle.factura_codigo,
          metodo_pago:
            movimiento.categoria === 'COBRO_DEUDA_EFECTIVO'
              ? 'EFECTIVO'
              : 'TRANSFERENCIA',
          monto: DecimalUtil.sumar(movimiento.monto ?? 0),
          movimiento_id: movimiento.id,
          operacion_id: movimiento.operacion_id,
        };
      });
    const clientes = new Set(filas.map((fila) => fila.cliente).filter(Boolean));
    const parcial = !detallesRespuesta;
    const respuesta = ReporteRespuesta.ok(
      'cobros',
      'Cobros Registrados',
      'Cobros',
      {
        total_cobrado: DecimalUtil.sumar(
          resumenMovimientos.total_monto
          ?? DecimalUtil.sumar(...filas.map((fila) => fila.monto)),
        ),
        cantidad_cobros: Number(
          resumenMovimientos.cantidad ?? payload.totalRows ?? filas.length,
        ),
        clientes_unicos: Number(
          resumenDetalles.clientes_unicos ?? clientes.size,
        ),
        advertencias: paralelo.fallidos.map(({ error }) => error),
      },
      [
        { key: 'fecha', label: 'Fecha', type: 'date' },
        { key: 'cliente', label: 'Cliente', type: 'text' },
        { key: 'factura_ref', label: 'Factura', type: 'text' },
        { key: 'metodo_pago', label: 'Método de pago', type: 'text' },
        { key: 'monto', label: 'Monto', type: 'currency' },
        { key: 'movimiento_id', label: 'Movimiento', type: 'number' },
        { key: 'operacion_id', label: 'Operación', type: 'text' },
      ],
      filas,
      this.construirPaginacion(
        payload,
        contexto.page,
        contexto.limit,
        filas.length,
      ),
      contexto.filtros,
    );
    return this.guardarCache(
      contexto.clave,
      respuesta,
      contexto.ttl,
      parcial,
    );
  }
}
