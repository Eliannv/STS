export default class CobroDeudaQueryUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  facturasPendientes(clienteId, filtros) { return this.adaptador.facturasPendientes(clienteId, filtros); }
  abonosPorFactura(facturaId) { return facturaId ? this.adaptador.abonosPorFactura(facturaId) : Promise.resolve({ estado: 'error', resultado: 'facturaId es requerido' }); }
  abonoPorId(id) { return id ? this.adaptador.abonoPorId(id) : Promise.resolve({ estado: 'error', resultado: 'id es requerido' }); }
  resumenClienteDeuda(clienteId) { return clienteId ? this.adaptador.resumenClienteDeuda(clienteId) : Promise.resolve({ estado: 'error', resultado: 'clienteId es requerido' }); }
  listaAbonos(filtros) { return this.adaptador.listaAbonos(filtros); }
  deudasPaginadas(offset, limite) { return this.adaptador.deudasPaginadas(offset, limite); }
}
