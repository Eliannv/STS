import { generarReporte } from './reportesApi';

export async function cargarDashboardResumen() {
  try {
    const response = await generarReporte({
      endpoint: 'dashboard/indicadores',
      paginacion: { page: 1, pageSize: 5 },
    });
    return {
      ok: true,
      data: {
        resultado: {
          ...(response.report.data || {}),
          ventasRecientes: response.report.rows || [],
          generatedAt: response.report.generatedAt,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'No se pudo cargar el resumen ejecutivo.',
    };
  }
}
