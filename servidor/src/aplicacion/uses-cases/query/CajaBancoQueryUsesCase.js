// src/aplicacion/uses-cases/query/CajaBancoQueryUsesCase.js
export default class CajaBancoQueryUsesCase {
  constructor(adaptador) {
    this._adaptador = adaptador;
  }

  async lista(filtros = {}) {
    return this._adaptador.lista(filtros);
  }

  async buscarPorId(id) {
    if (!id) return { estado: 'error', resultado: null };
    return this._adaptador.buscarPorId(id);
  }

  async cajaAbierta() {
    return this._adaptador.cajaAbierta();
  }

  async listarMovimientos(cajaId) {
    if (!cajaId) return { estado: 'error', resultado: 'cajaId es requerido' };
    return this._adaptador.listarMovimientos(cajaId);
  }

  async buscarMovimientoPorVentaId(ventaId) {
    if (!ventaId) return { estado: 'error', resultado: 'ventaId es requerido' };
    return this._adaptador.buscarMovimientoPorVentaId(ventaId);
  }
}
