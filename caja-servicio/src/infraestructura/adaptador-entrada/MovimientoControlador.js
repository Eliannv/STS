// caja-servicio/src/infraestructura/adaptador-entrada/MovimientoControlador.js
import { serializarRespuesta } from './serializarRespuesta.js';

export default class MovimientoControlador {
  constructor(queryUC, cajaBancoCommandUC, cajaChicaCommandUC) {
    this.queryUC = queryUC;
    this.cajaBancoCommandUC = cajaBancoCommandUC;
    this.cajaChicaCommandUC = cajaChicaCommandUC;
  }

  async listar(req, res) {
    try {
      const cajaId = Number(req.query.cajaId ?? req.query.caja_id);
      const cajaTipo = String(
        req.query.cajaTipo
        ?? req.query.caja_tipo
        ?? 'BANCO',
      ).toUpperCase();
      const resultado = await this.queryUC.listarPorCaja(cajaId, {
        ...req.query,
        cajaTipo,
      });
      return res.status(200).json(serializarRespuesta({
        estado: 'ok',
        resultado,
        traceId: req.traceId,
      }));
    } catch (error) {
      return res.status(400).json(serializarRespuesta({
        estado: 'error',
        resultado: error.message,
        traceId: req.traceId,
      }));
    }
  }

  async revertir(req, res) {
    try {
      const cajaTipo = String(
        req.body.cajaTipo
        ?? req.body.caja_tipo
        ?? req.query.cajaTipo
        ?? req.query.caja_tipo
        ?? 'BANCO',
      ).toUpperCase();
      const useCase = cajaTipo === 'CHICA'
        ? this.cajaChicaCommandUC
        : this.cajaBancoCommandUC;
      const resultado = await useCase.revertirMovimiento(
        Number(req.params.id),
        {
          ...req.body,
          usuarioId: req.usuario?.id,
          usuarioNombre: req.usuario?.nombre,
          traceId: req.traceId,
        },
      );
      return res
        .status(201)
        .json(serializarRespuesta({ ...resultado, traceId: req.traceId }));
    } catch (error) {
      return res.status(400).json(serializarRespuesta({
        estado: 'error',
        resultado: error.message,
        traceId: req.traceId,
      }));
    }
  }
}
