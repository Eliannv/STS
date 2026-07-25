import ReportesEntradaPuerto from '../../aplicacion/puertos/entrada/ReportesEntradaPuerto.js';

export default class ReportesControlador extends ReportesEntradaPuerto {
  constructor(usesCases) { super(); this.usesCases = usesCases; }

  async ejecutar(req, res, nombre, parametros = {}, contrato = 'legacy') {
    try {
      // El contexto lleva la sucursal en curso para que el adaptador HTTP la
      // reenvíe a los servicios de origen; null significa consolidado de todas.
      const resultado = await this.usesCases[nombre](parametros, {
        authorization: req.headers.authorization,
        traceId: req.traceId,
        sucursalId: req.sucursalScope?.filtroLectura ?? null,
        puedeVerTodas: req.sucursalScope?.puedeVerTodas ?? false,
      });
      if (contrato === 'estandar' && typeof resultado.toStandardResponse === 'function') {
        return res.status(200).json(resultado.toStandardResponse());
      }
      const respuestaLegacy = typeof resultado.toLegacyResponse === 'function' ? resultado.toLegacyResponse() : resultado;
      return res.status(200).json({ estado: 'ok', resultado: respuestaLegacy, traceId: req.traceId });
    } catch (error) {
      const status = error.status || 502;
      if (contrato === 'estandar') {
        return res.status(status).json({ success: false, report: null, error: { message: error.message }, traceId: req.traceId });
      }
      return res.status(status).json({ estado: 'error', mensaje: error.message, traceId: req.traceId });
    }
  }
}
