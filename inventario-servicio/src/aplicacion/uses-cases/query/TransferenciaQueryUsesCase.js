export default class TransferenciaQueryUsesCase {
  constructor(transferenciaQuery) {
    this.transferenciaQuery = transferenciaQuery;
  }

  lista(filtros = {}) { return this.transferenciaQuery.lista(filtros); }
  buscarPorId(id) { return id ? this.transferenciaQuery.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
}
