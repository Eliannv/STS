// facturacion-servicio/src/infraestructura/adaptador-entrada/ReporteInternoControlador.js
export default class ReporteInternoControlador {
  constructor(useCase) {
    this.useCase = useCase;
  }

  ventas(req, res) { return this._ejecutar('ventas', req, res); }
  ventasHoy(req, res) { return this._ejecutar('ventasHoy', req, res, false); }
  cobros(req, res) { return this._ejecutar('cobros', req, res); }
  tarjetas(req, res) { return this._ejecutar('tarjetas', req, res); }
  dashboardSnapshot(req, res) {
    return this._ejecutar('dashboardSnapshot', req, res, false);
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
