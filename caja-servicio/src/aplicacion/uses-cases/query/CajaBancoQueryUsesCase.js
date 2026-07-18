export default class CajaBancoQueryUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  lista(filtros) { return this.adaptador.lista(filtros); }
  buscarPorId(id) { return id ? this.adaptador.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
  cajaAbierta() { return this.adaptador.cajaAbierta(); }
  buscarPorMes(mes) { return this.adaptador.buscarPorMes(mes); }
  listarMovimientos(id) { return id ? this.adaptador.listarMovimientos(id) : Promise.resolve({ estado: 'error', resultado: 'cajaId es requerido' }); }
  buscarMovimientoPorVentaId(id) { return id ? this.adaptador.buscarMovimientoPorVentaId(id) : Promise.resolve({ estado: 'error', resultado: 'ventaId es requerido' }); }
}
