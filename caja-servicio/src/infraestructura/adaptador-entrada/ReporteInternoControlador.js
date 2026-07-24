// caja-servicio/src/infraestructura/adaptador-entrada/ReporteInternoControlador.js
export default class ReporteInternoControlador {
  constructor(useCase) {
    this.useCase = useCase;
  }

  movimientos(req, res) { return this._ejecutar('movimientos', req, res); }
  flujo(req, res) { return this._ejecutar('flujo', req, res); }
  saldoActual(req, res) {
    return this._ejecutar('saldoActual', req, res, false);
  }
  cuentasCobrar(req, res) {
    return this._ejecutar('cuentasCobrar', req, res);
  }
  cuentasPagar(req, res) {
    return this._ejecutar('cuentasPagar', req, res);
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
