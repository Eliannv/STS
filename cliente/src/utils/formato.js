// cliente/src/utils/formato.js
export const HOY = new Date().toISOString().slice(0, 10);

export const NUMERO = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

export const FMT = (valor) => `$${NUMERO(valor).toLocaleString('es-EC', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

export const FECHA = (valor) => {
  if (!valor) return '—';
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(String(valor));
  const fecha = new Date(soloFecha ? `${valor}T00:00:00` : valor);
  return Number.isNaN(fecha.getTime())
    ? String(valor)
    : fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
};

export const FECHAHORA = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? String(valor)
    : fecha.toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
};

export const PORCENTAJE = (parte, total) => (
  NUMERO(total) > 0 ? (NUMERO(parte) / NUMERO(total)) * 100 : 0
);

export const CAMPO = (objeto, camel, snake, fallback = null) => (
  objeto?.[camel] ?? objeto?.[snake] ?? fallback
);

export const RESULTADO_LISTA = (respuesta) => {
  const resultado = respuesta?.data?.resultado;
  if (Array.isArray(resultado)) return resultado;
  if (Array.isArray(resultado?.rows)) return resultado.rows;
  if (Array.isArray(resultado?.items)) return resultado.items;
  return [];
};

export const PAGINACION_RESULTADO = (respuesta) => {
  const resultado = respuesta?.data?.resultado || {};
  const totalRows = Number(resultado.count ?? resultado.totalRows ?? resultado.total_rows ?? 0);
  const pageSize = Number(resultado.limit ?? resultado.pageSize ?? resultado.page_size ?? 20);
  const page = Number(resultado.page ?? 0);
  return {
    page,
    pageSize,
    totalRows,
    hasNext: (page + 1) * pageSize < totalRows,
  };
};

export const DIAS_ANTIGUEDAD = (fechaVencimiento) => {
  if (!fechaVencimiento) return 0;
  const vencimiento = new Date(`${String(fechaVencimiento).slice(0, 10)}T00:00:00`);
  const hoy = new Date(`${HOY}T00:00:00`);
  return Math.max(0, Math.floor((hoy - vencimiento) / 86400000));
};
