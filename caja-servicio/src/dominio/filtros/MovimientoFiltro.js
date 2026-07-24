// caja-servicio/src/dominio/filtros/MovimientoFiltro.js
export default class MovimientoFiltro {
  constructor(datos = {}) {
    this.cajaId = datos.cajaId ?? datos.caja_id ?? null;
    this.cajaTipo = datos.cajaTipo ?? datos.caja_tipo ?? null;
    this.tipo = datos.tipo ?? null;
    this.categoria = datos.categoria ?? null;
    this.origen = datos.origen ?? null;
    this.fechaDesde = datos.fechaDesde ?? datos.fecha_desde ?? null;
    this.fechaHasta = datos.fechaHasta ?? datos.fecha_hasta ?? null;
    this.referenciaId = datos.referenciaId ?? datos.referencia_id ?? null;
    this.referenciaTipo = datos.referenciaTipo ?? datos.referencia_tipo ?? null;
    this.afectaFlujoOperativo =
      datos.afectaFlujoOperativo
      ?? datos.afecta_flujo_operativo
      ?? null;
    this.operacionId = datos.operacionId ?? datos.operacion_id ?? null;
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

  getCajaId() {
    return this.cajaId;
  }

  getCajaTipo() {
    return this.cajaTipo;
  }

  getTipo() {
    return this.tipo;
  }

  getCategoria() {
    return this.categoria;
  }

  getOrigen() {
    return this.origen;
  }

  getFechaDesde() {
    return this.fechaDesde;
  }

  getFechaHasta() {
    return this.fechaHasta;
  }

  getReferenciaId() {
    return this.referenciaId;
  }

  getReferenciaTipo() {
    return this.referenciaTipo;
  }

  getAfectaFlujoOperativo() {
    return this.afectaFlujoOperativo;
  }

  getOperacionId() {
    return this.operacionId;
  }

  getPage() {
    return this.page;
  }

  getLimit() {
    return this.limit;
  }
}
