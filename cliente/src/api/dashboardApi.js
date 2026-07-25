import { generarReporte } from './reportesApi';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export async function cargarDashboardResumen(sucursalIdOverride) {
  try {
    let response;
    if (sucursalIdOverride !== undefined) {
      const headers = { Accept: 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const sucursal = sucursalIdOverride || '';
      if (sucursal) headers['X-Sucursal-Id'] = sucursal;
      const res = await fetch(`${BASE_URL}/reportes/dashboard/indicadores?page=1&pageSize=5`, { headers });
      if (!res.ok) throw new Error('No se pudo cargar el resumen ejecutivo.');
      response = await res.json();
    } else {
      response = await generarReporte({
        endpoint: 'dashboard/indicadores',
        paginacion: { page: 1, pageSize: 5 },
      });
    }
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
