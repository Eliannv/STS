export default class MovimientoStockCommandUsesCase {
  constructor(servicioDominio) {
    this.servicioDominio = servicioDominio;
  }

  aplicar(dto) { return this.servicioDominio.aplicar(dto); }
  revertirMovimiento(dto) { return this.servicioDominio.revertirMovimiento(dto); }
  revertirReferencia(dto) { return this.servicioDominio.revertirReferencia(dto); }
}
