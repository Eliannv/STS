// facturacion-servicio/src/aplicacion/uses-cases/query/ReporteInternoQueryUsesCase.js
export default class ReporteInternoQueryUsesCase {
  constructor(salidaQuery) {
    this.salidaQuery = salidaQuery;
  }

  ventas(filtros) {
    return this.salidaQuery.ventas(filtros);
  }

  ventasHoy() {
    return this.salidaQuery.ventasHoy();
  }

  cobros(filtros) {
    return this.salidaQuery.cobros(filtros);
  }

  tarjetas(filtros) {
    return this.salidaQuery.tarjetas(filtros);
  }

  dashboardSnapshot() {
    return this.salidaQuery.dashboardSnapshot();
  }
}
