// reportes-servicio/src/aplicacion/uses-cases/ReporteCuentasPagarUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import FechaUtil from '../../infraestructura/util/FechaUtil.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

const antiguedad = (fecha) => {
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

export default class ReporteCuentasPagarUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('cuentas-pagar', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;
    const respuestaServicio = await this.servicios.getCuentasPagar(
      contexto.filtros,
      traceId,
    );
    if (!respuestaServicio.ok) {
      return this.errorServicio('las cuentas por pagar', respuestaServicio, traceId);
    }
    const payload = this.extraerPayload(respuestaServicio);
    const resumenOrigen = payload.summary ?? payload.resumen ?? {};
    const filas = this.extraerItems(payload)
      .filter((cuenta) => ['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(cuenta.estado))
      .map((cuenta) => ({
        ...cuenta,
        saldo: DecimalUtil.sumar(cuenta.saldo ?? 0),
        antiguedad: antiguedad(cuenta.fecha_vencimiento),
      }));
    const porProveedor = new Map();
    filas.forEach((cuenta) => {
      const proveedor = cuenta.tercero_nombre ?? 'Sin proveedor';
      porProveedor.set(
        proveedor,
        DecimalUtil.sumar(porProveedor.get(proveedor) ?? 0, cuenta.saldo),
      );
    });
    const proveedorMayor = [...porProveedor.entries()]
      .sort((a, b) => DecimalUtil.restar(b[1], a[1]))[0] ?? null;
    const vencimientoProximo = resumenOrigen.vencimiento_proximo ?? filas
      .map((cuenta) => cuenta.fecha_vencimiento)
      .filter(Boolean)
      .sort()[0] ?? null;
    const respuesta = ReporteRespuesta.ok(
      'cuentas-pagar',
      'Estado de Cuentas por Pagar',
      'Por pagar',
      {
        total_por_pagar: DecimalUtil.sumar(
          resumenOrigen.total_pendiente
          ?? DecimalUtil.sumar(...filas.map((cuenta) => cuenta.saldo)),
        ),
        vencimiento_proximo: vencimientoProximo,
        proveedor_mayor_deuda: resumenOrigen.tercero_mayor_deuda
          ? {
            proveedor: resumenOrigen.tercero_mayor_deuda.tercero_nombre,
            monto: DecimalUtil.sumar(
              resumenOrigen.tercero_mayor_deuda.monto,
            ),
          }
          : (
            proveedorMayor
              ? { proveedor: proveedorMayor[0], monto: proveedorMayor[1] }
              : null
          ),
      },
      [
        { key: 'referencia_codigo', label: 'Referencia', type: 'text' },
        { key: 'tercero_nombre', label: 'Proveedor', type: 'text' },
        { key: 'tipo_cuenta_por_pagar', label: 'Tipo', type: 'text' },
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
