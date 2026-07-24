// caja-servicio/src/infraestructura/adaptador-entrada/CajaBancoControlador.js
import CajaBancoEntradaPuerto from '../../aplicacion/puertos/entrada/CajaBancoEntradaPuerto.js';
import { serializarRespuesta } from './serializarRespuesta.js';

const responder = async (res, traceId, status, operacion) => {
  try {
    const resultado = await operacion();
    return res.status(status).json(serializarRespuesta({ ...resultado, traceId }));
  } catch (error) {
    return res.status(400).json(serializarRespuesta({
      estado: 'error',
      resultado: error.message,
      traceId,
    }));
  }
};

export default class CajaBancoControlador extends CajaBancoEntradaPuerto {
  constructor(commandUC, queryUC, movimientoQueryUC) {
    super();
    this.commandUC = commandUC;
    this.queryUC = queryUC;
    this.movimientoQueryUC = movimientoQueryUC;
  }

  abrirCajaBanco(req, res) {
    return this.abrir(req, res);
  }

  cerrarCajaBanco(req, res) {
    return this.cerrar(req, res);
  }

  abrir(req, res) {
    return responder(res, req.traceId, 201, () => this.commandUC.abrirCajaBanco({
      ...req.body,
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario?.nombre,
    }));
  }

  cerrar(req, res) {
    return responder(res, req.traceId, 200, () => this.commandUC.cerrarCajaBanco({
      ...req.body,
      id: Number(req.params.id ?? req.body.id),
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario?.nombre,
    }));
  }

  async lista(req, res) {
    const resultado = await this.queryUC.lista(req.query);
    return res
      .status(200)
      .json(serializarRespuesta({ ...resultado, traceId: req.traceId }));
  }

  async buscarPorId(req, res) {
    const resultado = await this.queryUC.buscarPorId(Number(req.params.id));
    return res
      .status(resultado.estado === 'ok' ? 200 : 404)
      .json(serializarRespuesta({ ...resultado, traceId: req.traceId }));
  }

  async cajaAbierta(req, res) {
    const resultado = await this.queryUC.cajaAbierta();
    return res
      .status(200)
      .json(serializarRespuesta({ ...resultado, traceId: req.traceId }));
  }

  movimiento(req, res) {
    return responder(res, req.traceId, 201, () => this.commandUC.registrarMovimiento({
      ...req.body,
      cajaBancoId: Number(req.params.id ?? req.body.cajaBancoId),
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario?.nombre,
      traceId: req.traceId,
    }));
  }

  listarMovimientos(req, res) {
    return responder(res, req.traceId, 200, async () => ({
      estado: 'ok',
      resultado: await this.movimientoQueryUC.listarPorCaja(
        Number(req.params.id),
        { ...req.query, cajaTipo: 'BANCO' },
      ),
    }));
  }

  eliminarMovimiento(req, res) {
    return res.status(405).json(serializarRespuesta({
      estado: 'error',
      resultado: 'Los movimientos son inmutables y no pueden eliminarse',
      traceId: req.traceId,
    }));
  }
}
