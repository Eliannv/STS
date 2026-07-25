// inventario-servicio/src/infraestructura/adaptador-entrada/ReporteInternoControlador.js
export default class ReporteInternoControlador {
  constructor(useCase) {
    this.useCase = useCase;
  }

  kardex(req, res) { return this._ejecutar('kardex', req, res); }
  compras(req, res) { return this._ejecutar('compras', req, res); }
  alertasStock(req, res) { return this._ejecutar('alertasStock', req, res); }
  valorInventario(req, res) { return this._ejecutar('valorInventario', req, res); }

  // El scope de sucursal es parte del contrato, no un parámetro opcional.
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
