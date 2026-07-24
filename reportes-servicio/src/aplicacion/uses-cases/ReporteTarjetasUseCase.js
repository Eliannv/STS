// reportes-servicio/src/aplicacion/uses-cases/ReporteTarjetasUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

export default class ReporteTarjetasUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('tarjetas', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;
    const respuestaServicio = await this.servicios.getTarjetas(
      contexto.filtros,
      traceId,
    );
    if (!respuestaServicio.ok) {
      return this.errorServicio('el reporte de tarjetas', respuestaServicio, traceId);
    }
    const payload = this.extraerPayload(respuestaServicio);
    const resumenOrigen = payload.summary ?? payload.resumen ?? {};
    const filas = this.extraerItems(payload).map((venta) => {
      const abonosAplicados = (venta.abonos ?? venta.acreditaciones ?? [])
        .filter((abono) => abono.estado === 'APLICADO');
      const brutoAcreditado = DecimalUtil.sumar(
        ...abonosAplicados.map((abono) => abono.monto_bruto ?? 0),
      );
      return {
        ...venta,
        monto_total: DecimalUtil.sumar(venta.monto_total ?? 0),
        monto_bruto_acreditado: brutoAcreditado,
        pendiente_acreditar: DecimalUtil.restar(
          venta.monto_total ?? 0,
          brutoAcreditado,
        ),
        comision_acumulada: DecimalUtil.sumar(
          ...abonosAplicados.map((abono) => abono.comision ?? 0),
        ),
        monto_neto_acreditado: DecimalUtil.sumar(
          ...abonosAplicados.map((abono) => abono.monto_neto ?? 0),
        ),
        abonos_aplicados: abonosAplicados.length,
      };
    });
    const abonos = filas.flatMap(
      (venta) => (venta.abonos ?? venta.acreditaciones ?? [])
        .filter((abono) => abono.estado === 'APLICADO'),
    );
    const pendientes = filas.filter((venta) => venta.pendiente_acreditar > 0);
    const respuesta = ReporteRespuesta.ok(
      'tarjetas',
      'Ventas con Tarjeta',
      'Tarjetas',
      {
        pendientes_cantidad: Number(
          resumenOrigen.pendientes_cantidad ?? pendientes.length,
        ),
        pendientes_monto: DecimalUtil.sumar(
          resumenOrigen.pendientes_monto
          ?? DecimalUtil.sumar(
            ...pendientes.map((venta) => venta.pendiente_acreditar),
          ),
        ),
        acreditadas_cantidad: Number(
          resumenOrigen.acreditadas_cantidad ?? abonos.length,
        ),
        acreditadas_monto_bruto: DecimalUtil.sumar(
          resumenOrigen.acreditadas_monto_bruto
          ?? DecimalUtil.sumar(
            ...abonos.map((abono) => abono.monto_bruto ?? 0),
          ),
        ),
        total_comisiones: DecimalUtil.sumar(
          resumenOrigen.total_comisiones
          ?? DecimalUtil.sumar(
            ...abonos.map((abono) => abono.comision ?? 0),
          ),
        ),
        total_monto_neto: DecimalUtil.sumar(
          resumenOrigen.total_monto_neto
          ?? DecimalUtil.sumar(
            ...abonos.map((abono) => abono.monto_neto ?? 0),
          ),
        ),
      },
      [
        { key: 'factura_codigo', label: 'Factura', type: 'text' },
        { key: 'fecha', label: 'Fecha', type: 'date' },
        { key: 'banco', label: 'Banco', type: 'text' },
        { key: 'monto_total', label: 'Monto esperado', type: 'currency' },
        { key: 'monto_bruto_acreditado', label: 'Acreditado', type: 'currency' },
        { key: 'pendiente_acreditar', label: 'Pendiente', type: 'currency' },
        { key: 'comision_acumulada', label: 'Comisiones', type: 'currency' },
        { key: 'monto_neto_acreditado', label: 'Neto recibido', type: 'currency' },
        { key: 'estado', label: 'Estado', type: 'badge' },
      ],
      filas,
      this.construirPaginacion(payload, contexto.page, contexto.limit, filas.length),
      contexto.filtros,
    );
    return this.guardarCache(contexto.clave, respuesta, contexto.ttl);
  }
}
