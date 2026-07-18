export default class FacturacionUsesCases {
  constructor(adaptador) { this.adaptador = adaptador; }
  listar(recurso, query) { return this.adaptador.listar(recurso, query); }
  obtener(recurso, id) { return this.adaptador.obtener(recurso, id); }
  crear(recurso, datos) { return this.adaptador.crear(recurso, datos); }
  actualizar(recurso, id, datos) { return this.adaptador.actualizar(recurso, id, datos); }
  eliminar(recurso, id) { return this.adaptador.eliminar(recurso, id); }
}
