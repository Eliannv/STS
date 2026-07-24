// reportes-servicio/src/aplicacion/uses-cases/ReporteCuentasCobrarUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import FechaUtil from '../../infraestructura/util/FechaUtil.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

const calcularAntiguedad = (fecha) => {
  if (!fecha) return 'SIN_VENCIMIENTO';
  const dias = Math.max(
    0,
    Math.floor(
      (FechaUtil.hoyInicio().getTime()
        - FechaUtil.normalizarInicio(fecha).getTime())
      / 86_400_000,
    ),
  );
  if (dias <= 30) return '0_30';
  if (dias <= 60) return '31_60';
  if (dias <= 90) return '61_90';
  return 'MAS_90';
};

export default class ReporteCuentasCobrarUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('cuentas-cobrar', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;
    const respuestaServicio = await this.servicios.getCuentasCobrar(
      contexto.filtros,
      traceId,
    );
    if (!respuestaServicio.ok) {
      return this.errorServicio('las cuentas por cobrar', respuestaServicio, traceId);
    }
    const payload = this.extraerPayload(respuestaServicio);
    const resumenOrigen = payload.summary ?? payload.resumen ?? {};
    const filas = this.extraerItems(payload)
      .filter((cuenta) => ['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(cuenta.estado))
      .map((cuenta) => ({
        ...cuenta,
        saldo: DecimalUtil.sumar(cuenta.saldo ?? 0),
        antiguedad: calcularAntiguedad(cuenta.fecha_vencimiento),
      }));
    const vencidas = filas.filter(
      (cuenta) => cuenta.estado === 'VENCIDA'
        || (
          cuenta.fecha_vencimiento
          && FechaUtil.normalizarFin(cuenta.fecha_vencimiento)
            < FechaUtil.hoyInicio()
        ),
    );
    const deudaPorCliente = new Map();
    filas.forEach((cuenta) => {
      const cliente = cuenta.tercero_nombre ?? 'Sin cliente';
      deudaPorCliente.set(
        cliente,
        DecimalUtil.sumar(deudaPorCliente.get(cliente) ?? 0, cuenta.saldo),
      );
    });
    const clienteMayor = [...deudaPorCliente.entries()]
      .sort((a, b) => DecimalUtil.restar(b[1], a[1]))[0] ?? null;
    const respuesta = ReporteRespuesta.ok(
      'cuentas-cobrar',
      'Estado de Cuentas por Cobrar',
      'Por cobrar',
      {
        total_pendiente: DecimalUtil.sumar(
          resumenOrigen.total_pendiente
          ?? DecimalUtil.sumar(...filas.map((cuenta) => cuenta.saldo)),
        ),
        total_vencido: DecimalUtil.sumar(
          resumenOrigen.total_vencido
          ?? DecimalUtil.sumar(...vencidas.map((cuenta) => cuenta.saldo)),
        ),
        cantidad_cuentas: Number(
          resumenOrigen.cantidad ?? payload.totalRows ?? filas.length,
        ),
        cliente_mayor_deuda: resumenOrigen.tercero_mayor_deuda
          ? {
            cliente: resumenOrigen.tercero_mayor_deuda.tercero_nombre,
            monto: DecimalUtil.sumar(
              resumenOrigen.tercero_mayor_deuda.monto,
            ),
          }
          : (
            clienteMayor
              ? { cliente: clienteMayor[0], monto: clienteMayor[1] }
              : null
          ),
      },
      [
        { key: 'referencia_codigo', label: 'Referencia', type: 'text' },
        { key: 'tercero_nombre', label: 'Cliente', type: 'text' },
        { key: 'fecha_emision', label: 'Emisión', type: 'date' },
        { key: 'fecha_vencimiento', label: 'Vencimiento', type: 'date' },
        { key: 'saldo', label: 'Saldo', type: 'currency' },
        { key: 'estado', label: 'Estado', type: 'badge' },
        { key: 'antiguedad', label: 'Antigüedad', type: 'text' },
      ],
      filas,
      this.construirPaginacion(payload, contexto.page, contexto.limit, filas.length),
      contexto.filtros,
    );
    return this.guardarCache(contexto.clave, respuesta, contexto.ttl);
  }
}
