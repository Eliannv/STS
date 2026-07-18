export default class BffUsesCases {
  constructor(adaptador) { this.adaptador = adaptador; }
  proxy(req, res, baseUrl) { return this.adaptador.proxy(req, res, baseUrl); }
  health() { return this.adaptador.health(); }
}
