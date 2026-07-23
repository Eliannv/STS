export default class ReporteDTO {
  constructor({
    codigo,
    id = codigo,
    titulo,
    title = titulo,
    shortTitle = title,
    generatedAt = new Date().toISOString(),
    filtros = {},
    filters = filtros,
    columnas = [],
    columns = columnas,
    filas = [],
    rows = filas,
    resumen = {},
    summary = resumen,
    pagination,
    datos = null,
  }) {
    this.id = id;
    this.title = title;
    this.shortTitle = shortTitle;
    this.generatedAt = generatedAt;
    this.filters = filters;
    this.columns = columns;
    this.rows = rows;
    this.summary = summary;
    this.pagination = pagination || this.crearPaginacion(rows.length);
    this.datos = datos;

    this.codigo = this.id;
    this.titulo = this.title;
    this.generado_en = this.generatedAt;
    this.filtros = this.filters;
    this.columnas = this.columns;
    this.filas = this.rows;
    this.resumen = this.summary;
  }

  crearPaginacion(totalRows) {
    return { page: 1, pageSize: totalRows || 1, totalRows, totalPages: totalRows ? 1 : 0 };
  }

  toStandardResponse() {
    const standardIds = {
      'productos-mas-vendidos': 'ventas-mas-vendidos',
      'productos-menos-vendidos': 'ventas-menos-vendidos',
      'estado-cuentas-cobrar': 'cuentas-cobrar',
    };
    const reportId = standardIds[this.id] || this.id;
    const columns = this.columns.map(column => ({
      key: column.key ?? column.clave,
      label: column.label ?? column.etiqueta,
      type: column.type || this.inferirTipoColumna(column.key ?? column.clave),
      ...(column.align ? { align: column.align } : {}),
    }));

    return {
      success: true,
      report: {
        id: reportId,
        title: this.title,
        shortTitle: this.shortTitle,
        generatedAt: this.generatedAt,
        summary: this.summary,
        filters: this.filters,
        columns,
        rows: this.rows,
        pagination: this.pagination,
        ...(this.datos ? { data: this.datos } : {}),
      },
    };
  }

  inferirTipoColumna(key = '') {
    const normalizedKey = String(key).toLowerCase();
    if (normalizedKey.includes('fecha') || normalizedKey.includes('created_at')) return 'date';
    if (normalizedKey.includes('total') || normalizedKey.includes('costo') || normalizedKey.includes('precio') || normalizedKey.includes('monto') || normalizedKey.includes('venta') || normalizedKey.includes('utilidad') || normalizedKey.includes('abonado') || normalizedKey.includes('saldo')) return 'currency';
    if (normalizedKey.includes('cantidad') || normalizedKey.includes('stock') || normalizedKey === 'compras' || normalizedKey === 'ventas' || normalizedKey === 'movimientos' || normalizedKey === 'unidades') return 'number';
    return 'text';
  }

  toLegacyResponse() {
    return {
      codigo: this.codigo,
      titulo: this.titulo,
      generado_en: this.generado_en,
      filtros: this.filtros,
      columnas: this.columnas,
      filas: this.filas,
      resumen: this.resumen,
      datos: this.datos,
      exportacion: { pdf: false, excel: false },
    };
  }
}
