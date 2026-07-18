export default class UsuarioFiltro {
  constructor({ buscar = null, activo = null } = {}) {
    this.buscar = buscar;
    this.activo = activo;
  }
}
