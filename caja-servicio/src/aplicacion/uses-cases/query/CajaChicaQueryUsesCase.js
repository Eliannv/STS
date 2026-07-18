export default class CajaChicaQueryUsesCase {
  constructor(adaptador) { this.adaptador = adaptador; }
  lista(filtros) { return this.adaptador.lista(filtros); }
  buscarPorId(id) { return id ? this.adaptador.buscarPorId(id) : Promise.resolve({ estado: 'error', resultado: null }); }
  cajaAbierta() { return this.adaptador.cajaAbierta(); }
  buscarPorFecha(fecha) { return this.adaptador.buscarPorFecha(fecha); }
  listarMovimientos(id) { return id ? this.adaptador.listarMovimientos(id) : Promise.resolve({ estado: 'error', resultado: 'cajaId es requerido' }); }
}
