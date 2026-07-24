// reportes-servicio/src/aplicacion/uses-cases/ReporteComprasUseCase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import DecimalUtil from '../../infraestructura/util/DecimalUtil.js';
import ReporteUseCaseBase from './ReporteUseCaseBase.js';

export default class ReporteComprasUseCase extends ReporteUseCaseBase {
  async ejecutar(filtro, traceId) {
    const contexto = this.preparar('compras', filtro);
    const cache = this.obtenerCache(contexto.clave);
    if (cache) return cache;
    const respuestaServicio = await this.servicios.getCompras(
      contexto.filtros,
      traceId,
    );
    if (!respuestaServicio.ok) {
      return this.errorServicio('el reporte de compras', respuestaServicio, traceId);
    }
    const payload = this.extraerPayload(respuestaServicio);
    const resumenOrigen = payload.summary ?? payload.resumen ?? {};
    const filas = this.extraerItems(payload)
      .filter((ingreso) => ingreso.estado !== 'ANULADO')
      .map((ingreso) => ({
        ...ingreso,
        total: DecimalUtil.sumar(ingreso.total ?? 0),
        iva: DecimalUtil.sumar(ingreso.iva ?? 0),
        flete: DecimalUtil.sumar(ingreso.flete ?? 0),
      }));
    const porProveedor = new Map();
    filas.forEach((ingreso) => {
      const proveedor = ingreso.proveedor_nombre ?? 'Sin proveedor';
      porProveedor.set(
        proveedor,
        DecimalUtil.sumar(porProveedor.get(proveedor) ?? 0, ingreso.total),
      );
    });
    const proveedorTop = [...porProveedor.entries()]
      .sort((a, b) => DecimalUtil.restar(b[1], a[1]))[0] ?? null;
    const respuesta = ReporteRespuesta.ok(
      'compras',
      'Compras de Mercadería',
      'Compras',
      {
        total_comprado: DecimalUtil.sumar(
          resumenOrigen.total_comprado
          ?? DecimalUtil.sumar(...filas.map((ingreso) => ingreso.total)),
        ),
        total_iva: DecimalUtil.sumar(
          resumenOrigen.total_iva
          ?? DecimalUtil.sumar(...filas.map((ingreso) => ingreso.iva)),
        ),
        total_flete: DecimalUtil.sumar(
          resumenOrigen.total_flete
          ?? DecimalUtil.sumar(...filas.map((ingreso) => ingreso.flete)),
        ),
        cantidad_ingresos: Number(
          resumenOrigen.cantidad_ingresos ?? payload.totalRows ?? filas.length,
        ),
        proveedor_top: resumenOrigen.proveedor_top
          ? {
            proveedor: resumenOrigen.proveedor_top.proveedor,
            monto: DecimalUtil.sumar(resumenOrigen.proveedor_top.monto),
          }
          : (
            proveedorTop
              ? { proveedor: proveedorTop[0], monto: proveedorTop[1] }
              : null
          ),
      },
      [
        { key: 'id_personalizado', label: 'Ingreso', type: 'text' },
        { key: 'numero_factura', label: 'Factura proveedor', type: 'text' },
        { key: 'proveedor_nombre', label: 'Proveedor', type: 'text' },
        { key: 'fecha', label: 'Fecha', type: 'date' },
        { key: 'tipo_compra', label: 'Tipo', type: 'text' },
        { key: 'iva', label: 'IVA', type: 'currency' },
        { key: 'flete', label: 'Flete', type: 'currency' },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'estado', label: 'Estado', type: 'badge' },
      ],
      filas,
      this.construirPaginacion(payload, contexto.page, contexto.limit, filas.length),
      contexto.filtros,
    );
    return this.guardarCache(contexto.clave, respuesta, contexto.ttl);
  }
}
