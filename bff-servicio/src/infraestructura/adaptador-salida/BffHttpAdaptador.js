export default class BffHttpAdaptador {
  constructor(servicios) { this.servicios = servicios; }

  async proxy(req, res, baseUrl) {
    if (!baseUrl) return res.status(503).json({ estado: 'error', mensaje: 'Servicio interno no configurado', traceId: req.traceId });
    const suffix = req.url || '/';
    const target = `${baseUrl.replace(/\/$/, '')}${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
    const headers = { 'X-Trace-Id': req.traceId };
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    if (req.headers.accept) headers.accept = req.headers.accept;
    if (req.headers['accept-language']) headers['accept-language'] = req.headers['accept-language'];
    const options = { method: req.method, headers };
    if (!['GET', 'HEAD'].includes(req.method)) {
      headers['Content-Type'] = req.headers['content-type'] || 'application/json';
      options.body = JSON.stringify(req.body ?? {});
    }
    try {
      const response = await fetch(target, options);
      const contentType = response.headers.get('content-type');
      if (contentType) res.setHeader('Content-Type', contentType);
      return res.status(response.status).send(await response.text());
    } catch (error) {
      return res.status(502).json({ estado: 'error', mensaje: 'Servicio interno no disponible', detalle: error.message, traceId: req.traceId });
    }
  }

  async health() {
    const resultados = await Promise.all(Object.entries(this.servicios).map(async ([nombre, url]) => {
      try { const response = await fetch(`${url}/health`); return [nombre, response.ok ? 'ok' : 'error']; } catch { return [nombre, 'error']; }
    }));
    return Object.fromEntries(resultados);
  }
}
