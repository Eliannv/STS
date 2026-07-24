// reportes-servicio/src/dominio/ReporteRespuesta.js
import FechaUtil from '../infraestructura/util/FechaUtil.js';

export default class ReporteRespuesta {
  static ok(
    id,
    title,
    shortTitle,
    summary = {},
    columns = [],
    rows = [],
    pagination = {},
    filters = {},
  ) {
    return {
      success: true,
      report: {
        id,
        title,
        shortTitle,
        generatedAt: FechaUtil.formatearISO(new Date()),
        summary,
        filters,
        columns,
        rows,
        pagination,
      },
    };
  }

  static error(code, message, traceId = null) {
    return {
      success: false,
      error: {
        code,
        message,
        traceId,
      },
    };
  }
}
