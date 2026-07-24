// reportes-servicio/src/dominio/servicios/ReporteDominioServicio.js
import FechaUtil from '../../infraestructura/util/FechaUtil.js';

const obtenerFiltro = (filtro, getter, propiedad) => {
  if (typeof filtro?.[getter] === 'function') {
    return filtro[getter]();
  }
  return filtro?.[propiedad] ?? null;
};

const describirFallo = (resultado, indice) => {
  if (resultado.status === 'rejected') {
    return {
      indice,
      error: resultado.reason instanceof Error
        ? resultado.reason.message
        : String(resultado.reason ?? 'Error desconocido'),
      status: 0,
    };
  }

  return {
    indice,
    error:
      resultado.value?.error
      ?? resultado.value?.message
      ?? 'El servicio respondió con error',
    status: resultado.value?.status ?? 0,
  };
};

export default class ReporteDominioServicio {
  construirPaginacion(page, limit, totalRows) {
    const pagina = Math.max(0, Number.parseInt(page, 10) || 0);
    const tamano = Math.max(1, Number.parseInt(limit, 10) || 50);
    const total = Math.max(0, Number.parseInt(totalRows, 10) || 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / tamano);

    return {
      page: pagina,
      pageSize: tamano,
      totalRows: total,
      totalPages,
      hasNext: pagina + 1 < totalPages,
      hasPrevious: pagina > 0 && totalPages > 0,
    };
  }

  validarFiltros(filtro) {
    const fechaDesde = obtenerFiltro(
      filtro,
      'getFechaDesde',
      'fechaDesde',
    );
    const fechaHasta = obtenerFiltro(
      filtro,
      'getFechaHasta',
      'fechaHasta',
    );

    if (
      fechaDesde
      && fechaHasta
      && new Date(fechaHasta).getTime() < new Date(fechaDesde).getTime()
    ) {
      throw new Error('fechaHasta no puede ser anterior a fechaDesde');
    }

    return filtro;
  }

  determinarTTL(filtro) {
    const fechaDesde = obtenerFiltro(
      filtro,
      'getFechaDesde',
      'fechaDesde',
    );
    const fechaHasta = obtenerFiltro(
      filtro,
      'getFechaHasta',
      'fechaHasta',
    );

    if (fechaHasta && FechaUtil.esPeriodoHistorico(fechaHasta)) {
      return 300;
    }

    const hoy = FechaUtil.hoyInicio().getTime();
    const desdeEsHoy = fechaDesde
      ? FechaUtil.normalizarInicio(fechaDesde).getTime() === hoy
      : false;
    const hastaEsHoy = fechaHasta
      ? FechaUtil.normalizarInicio(fechaHasta).getTime() === hoy
      : false;

    if ((!fechaDesde && !fechaHasta) || desdeEsHoy || hastaEsHoy) {
      return 30;
    }

    return 60;
  }

  async aplicarParalelo(promesas = []) {
    if (!Array.isArray(promesas)) {
      return {
        resultados: [],
        fallidos: [{
          indice: -1,
          error: 'Las operaciones paralelas deben ser un arreglo',
          status: 0,
        }],
      };
    }

    const establecidos = await Promise.allSettled(promesas);
    const resultados = [];
    const fallidos = [];

    establecidos.forEach((resultado, indice) => {
      if (
        resultado.status === 'fulfilled'
        && resultado.value?.ok !== false
      ) {
        resultados.push({ indice, valor: resultado.value });
        return;
      }

      fallidos.push(describirFallo(resultado, indice));
    });

    return { resultados, fallidos };
  }
}
