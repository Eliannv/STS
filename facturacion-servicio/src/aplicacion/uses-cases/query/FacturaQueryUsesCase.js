export default class FacturaQueryUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  listaPorCliente(clienteId, sucursalId = null) { return clienteId ? this.adaptador.listaPorCliente(clienteId, sucursalId) : Promise.resolve({ estado: 'error', resultado: 'clienteId requerido' }); }
  buscarPorId(id) { return id ? this.adaptador.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: 'id requerido' }); }
  resumenPorCliente(clienteId, sucursalId = null) { return clienteId ? this.adaptador.resumenPorCliente(clienteId, sucursalId) : Promise.resolve({ estado: 'error', resultado: 'clienteId requerido' }); }
  listaGeneral(filtros = {}) { return this.adaptador.listaGeneral(filtros); }
}
