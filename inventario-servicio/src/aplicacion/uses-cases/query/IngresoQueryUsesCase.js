export default class IngresoQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  lista(dto, pag = {}) { return this.adaptadorBDSalida.lista(dto.buscar, dto.estado, dto.fechaDesde, dto.fechaHasta, pag); }
  buscarPorId(id) { return id ? this.adaptadorBDSalida.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
}
