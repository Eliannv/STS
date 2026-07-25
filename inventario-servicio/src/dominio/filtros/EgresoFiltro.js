// inventario-servicio/src/dominio/filtros/EgresoFiltro.js
export default class EgresoFiltro {
  constructor(datos = {}) {
    this.tipoEgreso = datos.tipoEgreso ?? datos.tipo_egreso ?? null;
    this.estado = datos.estado ?? null;
    this.estadoFinanciero =
      datos.estadoFinanciero
      ?? datos.estado_financiero
      ?? null;
    this.proveedorId = datos.proveedorId ?? datos.proveedor_id ?? null;
    this.ingresoOrigenId =
      datos.ingresoOrigenId
      ?? datos.ingreso_origen_id
      ?? null;
    this.usuarioId = datos.usuarioId ?? datos.usuario_id ?? null;
    this.sucursalId = datos.sucursalId ?? datos.sucursal_id ?? null;
    this.fechaDesde = datos.fechaDesde ?? datos.fecha_desde ?? null;
    this.fechaHasta = datos.fechaHasta ?? datos.fecha_hasta ?? null;
    this.limit = Math.min(Math.max(Number(datos.limit ?? 50), 1), 100);
    this.page = Math.max(
      Number(
        datos.page
        ?? Math.floor(Number(datos.offset ?? 0) / this.limit),
      ),
      0,
    );
  }

  getTipoEgreso() { return this.tipoEgreso; }
  getEstado() { return this.estado; }
  getEstadoFinanciero() { return this.estadoFinanciero; }
  getProveedorId() { return this.proveedorId; }
  getIngresoOrigenId() { return this.ingresoOrigenId; }
  getUsuarioId() { return this.usuarioId; }
  getSucursalId() { return this.sucursalId; }
  getFechaDesde() { return this.fechaDesde; }
  getFechaHasta() { return this.fechaHasta; }
  getPage() { return this.page; }
  getLimit() { return this.limit; }
}
