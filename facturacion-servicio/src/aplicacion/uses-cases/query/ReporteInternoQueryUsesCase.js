// facturacion-servicio/src/aplicacion/uses-cases/query/ReporteInternoQueryUsesCase.js
export default class ReporteInternoQueryUsesCase {
  constructor(salidaQuery) {
    this.salidaQuery = salidaQuery;
  }

  ventas(filtros) {
    return this.salidaQuery.ventas(filtros);
  }

  ventasHoy(filtros) {
    return this.salidaQuery.ventasHoy(filtros);
  }

  cobros(filtros) {
    return this.salidaQuery.cobros(filtros);
  }

  tarjetas(filtros) {
    return this.salidaQuery.tarjetas(filtros);
  }

  dashboardSnapshot(filtros) {
    return this.salidaQuery.dashboardSnapshot(filtros);
  }
}
