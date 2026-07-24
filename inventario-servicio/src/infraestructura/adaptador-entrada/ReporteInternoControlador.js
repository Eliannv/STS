// inventario-servicio/src/infraestructura/adaptador-entrada/ReporteInternoControlador.js
export default class ReporteInternoControlador {
  constructor(useCase) {
    this.useCase = useCase;
  }

  kardex(req, res) { return this._ejecutar('kardex', req, res); }
  compras(req, res) { return this._ejecutar('compras', req, res); }
  alertasStock(req, res) {
    return this._ejecutar('alertasStock', req, res, false);
  }
  valorInventario(req, res) {
    return this._ejecutar('valorInventario', req, res, false);
  }

  async _ejecutar(metodo, req, res, usaQuery = true) {
    try {
      const resultado = await this.useCase[metodo](
        ...(usaQuery ? [req.query ?? {}] : []),
      );
      return res.status(200).json({
        estado: 'ok',
        resultado,
        traceId: req.traceId,
      });
    } catch (error) {
      return res.status(500).json({
        estado: 'error',
        mensaje: error.message,
        traceId: req.traceId,
      });
    }
  }
}
