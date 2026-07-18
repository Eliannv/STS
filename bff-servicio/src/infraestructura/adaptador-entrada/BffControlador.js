export default class BffControlador {
  constructor(usesCases) { this.usesCases = usesCases; }
  proxy(baseUrl) { return (req, res) => this.usesCases.proxy(req, res, baseUrl); }
  async health(req, res) { const servicios = await this.usesCases.health(); const ok = Object.values(servicios).every((estado) => estado === 'ok'); return res.status(ok ? 200 : 503).json({ estado: ok ? 'ok' : 'degradado', servicio: 'bff-servicio', servicios, traceId: req.traceId }); }
}
