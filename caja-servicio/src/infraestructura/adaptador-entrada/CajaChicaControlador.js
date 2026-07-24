// caja-servicio/src/infraestructura/adaptador-entrada/CajaChicaControlador.js
import CajaChicaEntradaPuerto from '../../aplicacion/puertos/entrada/CajaChicaEntradaPuerto.js';
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

export default class CajaChicaControlador extends CajaChicaEntradaPuerto {
  constructor(commandUC, queryUC, movimientoQueryUC) {
    super();
    this.commandUC = commandUC;
    this.queryUC = queryUC;
    this.movimientoQueryUC = movimientoQueryUC;
  }

  abrirCajaChica(req, res) {
    return this.abrir(req, res);
  }

  cerrarCajaChica(req, res) {
    return this.cerrar(req, res);
  }

  reponerCajaChica(req, res) {
    return this.reponer(req, res);
  }

  devolverCajaChica(req, res) {
    return this.devolver(req, res);
  }

  abrir(req, res) {
    return responder(res, req.traceId, 201, () => this.commandUC.abrirCajaChica({
      ...req.body,
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario?.nombre,
    }));
  }

  cerrar(req, res) {
    return responder(res, req.traceId, 200, () => this.commandUC.cerrarCajaChica({
      ...req.body,
      id: Number(req.params.id ?? req.body.id),
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario?.nombre,
    }));
  }

  reponer(req, res) {
    return responder(res, req.traceId, 201, () => this.commandUC.reponerCajaChica({
      ...req.body,
      id: Number(req.params.id),
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario?.nombre,
    }));
  }

  devolver(req, res) {
    return responder(res, req.traceId, 201, () => this.commandUC.devolverCajaChica({
      ...req.body,
      id: Number(req.params.id),
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
      cajaChicaId: Number(req.params.id ?? req.body.cajaChicaId),
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
        { ...req.query, cajaTipo: 'CHICA' },
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
