export default class MovimientoStockQueryUsesCase {
  constructor(salidaQuery) {
    this.salidaQuery = salidaQuery;
  }

  listar(filtros) { return this.salidaQuery.listar(filtros); }
  buscarPorId(id) { return id ? this.salidaQuery.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: 'id es requerido' }); }
}
