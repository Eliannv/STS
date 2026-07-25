// inventario-servicio/src/aplicacion/uses-cases/query/ReporteInternoQueryUsesCase.js
export default class ReporteInternoQueryUsesCase {
  constructor(salidaQuery) {
    this.salidaQuery = salidaQuery;
  }

  kardex(filtros) { return this.salidaQuery.kardex(filtros); }
  compras(filtros) { return this.salidaQuery.compras(filtros); }
  alertasStock(filtros) { return this.salidaQuery.alertasStock(filtros); }
  valorInventario(filtros) { return this.salidaQuery.valorInventario(filtros); }
}
