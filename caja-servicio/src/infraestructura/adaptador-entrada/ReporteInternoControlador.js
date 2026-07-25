// caja-servicio/src/infraestructura/adaptador-entrada/ReporteInternoControlador.js
export default class ReporteInternoControlador {
  constructor(useCase) {
    this.useCase = useCase;
  }

  movimientos(req, res) { return this._ejecutar('movimientos', req, res); }
  flujo(req, res) { return this._ejecutar('flujo', req, res); }
  saldoActual(req, res) { return this._ejecutar('saldoActual', req, res); }
  cuentasCobrar(req, res) {
    return this._ejecutar('cuentasCobrar', req, res);
  }
  cuentasPagar(req, res) {
    return this._ejecutar('cuentasPagar', req, res);
  }

  // Todos los reportes internos reciben el scope resuelto: la sucursal no es un
  // parámetro opcional que cada método pueda olvidar, sino parte del contrato.
  async _ejecutar(metodo, req, res) {
    try {
      const resultado = await this.useCase[metodo]({
        ...(req.query ?? {}),
        sucursalId: req.sucursalScope?.filtroLectura ?? null,
      });
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
