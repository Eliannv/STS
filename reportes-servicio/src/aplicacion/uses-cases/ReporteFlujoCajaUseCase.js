// reportes-servicio/src/aplicacion/uses-cases/ReporteFlujoCajaUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

const TRANSFERENCIAS = new Set([
  'TRANSFERENCIA_ENTRADA',
  'TRANSFERENCIA_SALIDA',
]);

export default class ReporteFlujoCajaUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('flujo-caja', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;

    const respuestaServicio = await this.servicios.getFlujoCaja(
      contexto.filtros,
      traceId,
    );
    if (!respuestaServicio.ok) {
      return this.errorServicio('el flujo de caja', respuestaServicio, traceId);
    }
    const payload = this.extraerPayload(respuestaServicio);
    const esConsolidado = !contexto.filtros.cajaId
      && !contexto.filtros.cajaTipo;
    const filas = this.extraerItems(payload)
      .filter((fila) => !esConsolidado || !TRANSFERENCIAS.has(fila.categoria))
      .map((fila) => ({
        ...fila,
        monto: DecimalUtil.sumar(fila.monto ?? 0),
      }));
    const resumenOrigen = payload.summary ?? payload.resumen ?? {};
    const ingresos = DecimalUtil.sumar(
      resumenOrigen.ingresos_operativos
      ?? DecimalUtil.sumar(
        ...filas
          .filter((fila) => fila.tipo === 'INGRESO' && fila.afecta_flujo_operativo !== false)
          .map((fila) => fila.monto),
      ),
    );
    const egresos = DecimalUtil.sumar(
      resumenOrigen.egresos_operativos
      ?? DecimalUtil.sumar(
        ...filas
          .filter((fila) => fila.tipo === 'EGRESO' && fila.afecta_flujo_operativo !== false)
          .map((fila) => fila.monto),
      ),
    );
    const saldoInicial = DecimalUtil.sumar(
      resumenOrigen.saldo_inicial_periodo ?? 0,
    );
    const noOperativosNeto = DecimalUtil.sumar(
      resumenOrigen.no_operativos_neto ?? 0,
    );
    const saldoFinal = DecimalUtil.sumar(
      resumenOrigen.saldo_final_periodo
      ?? DecimalUtil.sumar(
        saldoInicial,
        DecimalUtil.restar(ingresos, egresos),
        noOperativosNeto,
      ),
    );
    const respuesta = ReporteRespuesta.ok(
      'flujo-caja',
      'Flujo de Caja',
      'Flujo',
      {
        ingresos_operativos: ingresos,
        egresos_operativos: egresos,
        saldo_neto: DecimalUtil.restar(ingresos, egresos),
        saldo_inicial_periodo: saldoInicial,
        no_operativos_neto: noOperativosNeto,
        saldo_final_periodo: saldoFinal,
      },
      [
        { key: 'fecha', label: 'Fecha', type: 'date' },
        { key: 'categoria', label: 'Categoría', type: 'text' },
        { key: 'tipo', label: 'Tipo', type: 'badge' },
        { key: 'monto', label: 'Monto', type: 'currency' },
        { key: 'afecta_flujo_operativo', label: 'Operativo', type: 'boolean' },
        { key: 'descripcion', label: 'Descripción', type: 'text' },
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
    return this.guardarCache(contexto.clave, respuesta, contexto.ttl);
  }
}
