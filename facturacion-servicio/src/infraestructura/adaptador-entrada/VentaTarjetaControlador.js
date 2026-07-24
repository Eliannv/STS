// facturacion-servicio/src/infraestructura/adaptador-entrada/VentaTarjetaControlador.js
import VentaTarjetaEntradaPuerto from '../../aplicacion/puertos/entrada/VentaTarjetaEntradaPuerto.js';

export default class VentaTarjetaControlador extends VentaTarjetaEntradaPuerto {
  constructor(commandUC, queryUC) {
    super();
    this.commandUC = commandUC;
    this.queryUC = queryUC;
  }

  listarVentasTarjeta(req, res) {
    return this.responderConsulta(
      res,
      this.queryUC.listarVentasTarjeta(req.query),
    );
  }

  obtenerVentaTarjeta(req, res) {
    return this.responderConsulta(
      res,
      this.queryUC.obtenerVentaTarjeta(Number(req.params.id)),
      404,
    );
  }

  async registrarAcreditacion(req, res) {
    try {
      const resultado = await this.commandUC.registrarAcreditacion({
        ...req.body,
        ventaTarjetaId: Number(req.params.ventaTarjetaId),
        autorizarExceso:
          (
            req.body?.autorizarExceso === true
            || req.body?.autorizar_exceso === true
          )
          && req.usuario?.rol === 'ADMINISTRADOR',
        usuarioId: req.usuario?.id ?? null,
        usuarioNombre: req.usuario
          ? `${req.usuario.nombre ?? ''} ${req.usuario.apellido ?? ''}`.trim()
          : null,
        traceId: req.traceId,
      });
      return res.status(201).json({
        ...resultado,
        traceId: req.traceId,
      });
    } catch (error) {
      return res.status(400).json({
        estado: 'error',
        resultado: error.message,
        traceId: req.traceId,
      });
    }
  }

  registrarAbono(req, res) {
    return this.registrarAcreditacion(req, res);
  }

  obtenerHistorialAbonos(req, res) {
    return this.responderConsulta(
      res,
      this.queryUC.historialAbonos(Number(req.params.ventaTarjetaId)),
    );
  }

  resumenVentasTarjeta(req, res) {
    return this.responderConsulta(
      res,
      this.queryUC.resumenVentasTarjeta(),
    );
  }

  async responderConsulta(res, promesa, estadoError = 400) {
    const resultado = await promesa;
    return res.status(resultado.estado === 'ok' ? 200 : estadoError).json(
      resultado,
    );
  }
}
