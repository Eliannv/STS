import { api } from './api';

const REPORTES_PATH = '/reportes';

function resolverEndpoint(endpoint, filtros) {
  const pathParams = new Set();
  const ruta = endpoint.replace(/:([A-Za-z0-9_]+)/g, (_, clave) => {
    pathParams.add(clave);
    const valor = filtros[clave];
    if (valor === undefined || valor === null || valor === '') {
      throw new Error(`El filtro ${clave} es requerido para este reporte.`);
    }
    return encodeURIComponent(String(valor));
  });
  return { ruta, pathParams };
}

function crearQuery(filtros, paginacion, pathParams) {
  const params = new URLSearchParams();
  Object.entries({ ...filtros, ...paginacion }).forEach(([clave, valor]) => {
    if (pathParams.has(clave)) return;
    if (valor !== undefined && valor !== null && valor !== '') params.set(clave, String(valor));
  });
  return params.toString();
}

export async function generarReporte({ endpoint, filtros = {}, paginacion = {} }) {
  const { ruta, pathParams } = resolverEndpoint(endpoint, filtros);
  const query = crearQuery(filtros, paginacion, pathParams);
  const respuesta = await api.get(`${REPORTES_PATH}/${ruta}${query ? `?${query}` : ''}`);

  if (!respuesta.ok) {
    const mensaje = respuesta.data?.error?.message || respuesta.data?.mensaje || 'No se pudo generar el reporte.';
    const error = new Error(mensaje);
    error.status = respuesta.status;
    throw error;
  }

  if (!respuesta.data?.success || !respuesta.data?.report) {
    throw new Error('El servicio devolvió una respuesta de reporte inválida.');
  }

  return respuesta.data;
}

const reportesApi = { generarReporte };

export default reportesApi;
