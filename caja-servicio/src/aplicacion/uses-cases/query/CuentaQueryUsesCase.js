export default class CuentaQueryUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  lista(filtros) { return this.adaptador.lista(filtros); }
  buscarPorId(id) { return id ? this.adaptador.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
}
