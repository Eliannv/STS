// reportes-servicio/src/infraestructura/adaptador-entrada/ReporteControlador.js
import ReporteFiltro from '../../dominio/ReporteFiltro.js';
import ReporteRespuesta from '../../dominio/ReporteRespuesta.js';

const codigoHttp = (code) => (
  ['FILTROS_INVALIDOS', 'SOLICITUD_INVALIDA'].includes(code) ? 400 : 500
);

export default class ReporteControlador {
  constructor(useCases) {
    this.useCases = useCases;
  }

  ventas(req, res) {
    return this._ejecutar('ventasUC', req, res);
  }

  cobros(req, res) {
    return this._ejecutar('cobrosUC', req, res);
  }

  flujoCaja(req, res) {
    return this._ejecutar('flujoCajaUC', req, res);
  }

  cuentasCobrar(req, res) {
    return this._ejecutar('cuentasCobrarUC', req, res);
  }

  cuentasPagar(req, res) {
    return this._ejecutar('cuentasPagarUC', req, res);
  }

  tarjetas(req, res) {
    return this._ejecutar('tarjetasUC', req, res);
  }

  inventarioMovimientos(req, res) {
    return this._ejecutar('inventarioUC', req, res);
  }

  compras(req, res) {
    return this._ejecutar('comprasUC', req, res);
  }

  dashboard(req, res) {
    return this._ejecutar('dashboardUC', req, res);
  }

  async _ejecutar(nombre, req, res) {
    const traceId = req.get?.('X-Trace-Id') ?? req.traceId ?? null;

    try {
      const filtro = new ReporteFiltro(req.query ?? {});
      const resultado = await this.useCases[nombre].ejecutar(
        filtro,
        traceId,
      );
      if (resultado.success === false) {
        return res.status(codigoHttp(resultado.error?.code)).json(resultado);
      }
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json(
        ReporteRespuesta.error(
          'ERROR_INTERNO',
          error.message,
          traceId,
        ),
      );
    }
  }
}
