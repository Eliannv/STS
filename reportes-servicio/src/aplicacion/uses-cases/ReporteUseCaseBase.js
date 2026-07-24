// reportes-servicio/src/aplicacion/uses-cases/ReporteUseCaseBase.js
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';
import FechaUtil from '../../infraestructura/util/FechaUtil.js';
import ClaveCacheUtil from '../../infraestructura/util/ClaveCacheUtil.js';

const normalizarValor = (valor) => {
  if (valor instanceof Date) return FechaUtil.formatearISO(valor);
  if (Array.isArray(valor)) return valor.map(normalizarValor);
  return valor;
};

export default class ReporteUseCaseBase {
  constructor(serviciosCliente, cache, reporteDominioServicio) {
    this.servicios = serviciosCliente;
    this.cache = cache;
    this.dominio = reporteDominioServicio;
  }

  preparar(reporte, filtro = {}) {
    this.dominio.validarFiltros(filtro);
    const origen = typeof filtro?.toObject === 'function'
      ? filtro.toObject()
      : { ...filtro };
    const filtros = Object.entries(origen).reduce(
      (resultado, [clave, valor]) => {
        if (valor !== null && valor !== undefined && valor !== '') {
          resultado[clave] = normalizarValor(valor);
        }
        return resultado;
      },
      {},
    );
    const page = Number(filtros.page ?? 0);
    const limit = Number(filtros.limit ?? 50);
    return {
      filtros,
      page,
      limit,
      clave: ClaveCacheUtil.construir(reporte, filtros, page, limit),
      ttl: this.dominio.determinarTTL(filtro),
    };
  }

  obtenerCache(clave) {
    return this.cache.get(clave);
  }

  guardarCache(clave, respuesta, ttl, parcial = false) {
    if (!parcial) this.cache.set(clave, respuesta, ttl);
    return respuesta;
  }

  extraerPayload(respuesta) {
    return respuesta?.data?.data
      ?? respuesta?.data?.resultado
      ?? respuesta?.data
      ?? {};
  }

  extraerItems(payload) {
    if (Array.isArray(payload)) return payload;
    return payload.items ?? payload.rows ?? [];
  }

  construirPaginacion(payload, page, limit, cantidad) {
    const origen = payload.pagination ?? payload.paginacion ?? {};
    const totalRows =
      origen.totalRows
      ?? origen.total_rows
      ?? origen.total_items
      ?? payload.totalRows
      ?? payload.total_rows
      ?? payload.total
      ?? cantidad;
    return this.dominio.construirPaginacion(
      origen.page ?? page,
      origen.pageSize ?? origen.page_size ?? origen.limit ?? limit,
      totalRows,
    );
  }

  errorServicio(reporte, respuesta, traceId) {
    return ReporteRespuesta.error(
      'SERVICIO_NO_DISPONIBLE',
      `No fue posible generar ${reporte}: ${respuesta?.error ?? 'servicio no disponible'}`,
      traceId,
    );
  }
}
