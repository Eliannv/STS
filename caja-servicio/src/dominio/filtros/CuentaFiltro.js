// caja-servicio/src/dominio/filtros/CuentaFiltro.js
export default class CuentaFiltro {
  constructor(datos = {}) {
    this.tipo = datos.tipo ?? null;
    this.estado = datos.estado ?? null;
    this.terceroId = datos.terceroId ?? datos.tercero_id ?? null;
    this.terceroTipo = datos.terceroTipo ?? datos.tercero_tipo ?? null;
    this.fechaDesde = datos.fechaDesde ?? datos.fecha_desde ?? null;
    this.fechaHasta = datos.fechaHasta ?? datos.fecha_hasta ?? null;
    this.sucursalId = datos.sucursalId ?? datos.sucursal_id ?? null;
    this.page = this.normalizarEntero(datos.page, 0);
    this.limit = this.normalizarEntero(datos.limit, 50);

    Object.freeze(this);
  }

  normalizarEntero(valor, valorDefault) {
    if (valor === null || valor === undefined || valor === '') {
      return valorDefault;
    }

    const numero = Number(valor);
    return Number.isInteger(numero) ? numero : valorDefault;
  }

  getTipo() {
    return this.tipo;
  }

  getEstado() {
    return this.estado;
  }

  getTerceroId() {
    return this.terceroId;
  }

  getTerceroTipo() {
    return this.terceroTipo;
  }

  getFechaDesde() {
    return this.fechaDesde;
  }

  getFechaHasta() {
    return this.fechaHasta;
  }

  getSucursalId() {
    return this.sucursalId;
  }

  getPage() {
    return this.page;
  }

  getLimit() {
    return this.limit;
  }
}
