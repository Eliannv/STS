// cliente/src/api/egresosApi.js
import { api } from './api';

const agregarParametros = (params, filtros = {}) => {
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) {
      params.set(clave, String(valor));
    }
  });
  return params;
};

export const extraerDatosEgreso = (respuesta) => (
  respuesta?.data?.data
  ?? respuesta?.data?.resultado
  ?? null
);

export const extraerFilasEgreso = (respuesta) => {
  const datos = extraerDatosEgreso(respuesta);
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.rows)) return datos.rows;
  if (Array.isArray(datos?.items)) return datos.items;
  return [];
};

export const extraerPaginacionEgreso = (respuesta) => {
  const datos = extraerDatosEgreso(respuesta);
  return datos?.pagination || {
    page: 0,
    pageSize: 20,
    totalRows: extraerFilasEgreso(respuesta).length,
    totalPages: 1,
  };
};

export function listarEgresos(filtros = {}) {
  const params = agregarParametros(new URLSearchParams(), filtros);
  return api.get(`/egresos?${params}`);
}

export async function listarTodosEgresos(filtros = {}) {
  const limit = 100;
  let page = 0;
  let totalPages = 1;
  const rows = [];

  do {
    const respuesta = await listarEgresos({ ...filtros, page, limit });
    if (!respuesta.ok) return { respuesta, rows: [] };
    rows.push(...extraerFilasEgreso(respuesta));
    totalPages = Math.max(1, Number(extraerPaginacionEgreso(respuesta).totalPages || 1));
    page += 1;
  } while (page < totalPages);

  return { respuesta: { ok: true }, rows };
}

export function obtenerEgreso(id) {
  return api.get(`/egresos/${id}`);
}

export function crearEgreso(payload) {
  return api.post('/egresos', payload);
}

export function agregarDetalleEgreso(id, payload) {
  return api.post(`/egresos/${id}/detalles`, payload);
}

export function eliminarDetalleEgreso(id, detalleId) {
  return api.delete(`/egresos/${id}/detalles/${detalleId}`);
}

export function confirmarEgreso(id, payload) {
  return api.post(`/egresos/${id}/confirmar`, payload);
}

export function anularEgreso(id, payload) {
  return api.post(`/egresos/${id}/anular`, payload);
}

export function descartarEgreso(id) {
  return api.post(`/egresos/${id}/descartar`, {});
}

export function obtenerMovimientosEgreso(id) {
  return api.get(`/egresos/${id}/movimientos`);
}

export function obtenerIngreso(id) {
  return api.get(`/ingresos/${id}`);
}

export async function listarIngresosFinalizadosProveedor(proveedorId) {
  const respuesta = await api.get('/ingresos?estado=FINALIZADO&limit=100&offset=0');
  if (!respuesta.ok) return { respuesta, rows: [] };
  const rows = Array.isArray(respuesta.data?.resultado) ? respuesta.data.resultado : [];
  return {
    respuesta,
    rows: rows.filter((ingreso) => (
      !proveedorId || Number(ingreso.proveedor_id) === Number(proveedorId)
    )),
  };
}

export function listarCajasBancoAbiertas() {
  return api.get('/caja-banco/lista?estado=ABIERTA&limit=100');
}

export function listarCajasChicasAbiertas() {
  return api.get('/caja-chica/lista?estado=ABIERTA&limit=100');
}

export function obtenerProducto(id) {
  return api.get(`/productos/${id}`);
}
