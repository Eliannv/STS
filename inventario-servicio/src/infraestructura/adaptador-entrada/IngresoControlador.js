import IngresoEntradaPuerto from '../../aplicacion/puertos/entrada/IngresoEntradaPuerto.js';
import { IngresoDTO, DetalleIngresoDTO } from '../../aplicacion/dto/IngresoDTO.js';

export default class IngresoControlador extends IngresoEntradaPuerto {
  constructor(commandUC, queryUC) {
    super();
    this.commandUC = commandUC;
    this.queryUC = queryUC;
  }

  async crear(req, res) {
    const respuesta = await this.commandUC.crear(new IngresoDTO({ ...req.body, usuarioId: req.usuario?.id }));
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async lista(req, res) {
    const respuesta = await this.queryUC.lista(new IngresoDTO(req.query), { limit: Number(req.query.limit) || 10, offset: Number(req.query.offset) || 0 });
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const respuesta = await this.queryUC.buscarPorId(Number(req.params.id));
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }

  async editar(req, res) {
    const respuesta = await this.commandUC.editar(new IngresoDTO({ ...req.body, id: req.params.id ?? req.body.id, usuarioId: req.usuario?.id }));
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async finalizar(req, res) {
    const respuesta = await this.commandUC.finalizar(new IngresoDTO({
      ...req.body,
      id: req.params.id ?? req.body.id,
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null,
      sucursalId: req.usuario?.sucursalId ?? req.body.sucursalId,
      operacionId: req.body.operacionId || `INGRESO-${req.params.id ?? req.body.id}`,
      idempotencyKey: req.body.idempotencyKey || `INGRESO-${req.params.id ?? req.body.id}`,
      traceId: req.traceId,
    }));
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async eliminar(req, res) {
    const respuesta = await this.commandUC.eliminar(new IngresoDTO({
      id: req.params.id ?? req.body.id,
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null,
      sucursalId: req.usuario?.sucursalId,
      motivo: req.body.motivo,
      traceId: req.traceId,
    }));
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async agregarDetalle(req, res) {
    const respuesta = await this.commandUC.agregarDetalle(new DetalleIngresoDTO(req.body));
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async editarDetalle(req, res) {
    const respuesta = await this.commandUC.editarDetalle(new DetalleIngresoDTO(req.body));
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async eliminarDetalle(req, res) {
    const respuesta = await this.commandUC.eliminarDetalle(new DetalleIngresoDTO({ id: req.params.id ?? req.body.id }));
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }
}
