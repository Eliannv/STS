// src/aplicacion/uses-cases/query/IngresoQueryUsesCase.js
export default class IngresoQueryUsesCase {
  constructor(adaptadorBDSalidaQuery) {
    this.adaptadorBDSalida = adaptadorBDSalidaQuery;
  }

  async lista(dtoIngreso) {
    return await this.adaptadorBDSalida.lista(
      dtoIngreso.getBuscar(),
      dtoIngreso.getEstado(),
      dtoIngreso.getFechaDesde(),
      dtoIngreso.getFechaHasta()
    );
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: null };
    return await this.adaptadorBDSalida.buscarPorId(id);
  }
}
