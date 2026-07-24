// caja-servicio/src/aplicacion/uses-cases/query/ReporteInternoQueryUsesCase.js
export default class ReporteInternoQueryUsesCase {
  constructor(salidaQuery) {
    this.salidaQuery = salidaQuery;
  }

  movimientos(filtros) { return this.salidaQuery.movimientos(filtros); }
  flujo(filtros) { return this.salidaQuery.flujo(filtros); }
  saldoActual() { return this.salidaQuery.saldoActual(); }
  cuentasCobrar(filtros) {
    return this.salidaQuery.cuentasCobrar(filtros);
  }
  cuentasPagar(filtros) {
    return this.salidaQuery.cuentasPagar(filtros);
  }
}
