// src/infraestructura/adaptador-entrada/IngresoControlador.js
import IngresoEntradaPuerto from '../../aplicacion/puertos/entrada/IngresoEntradaPuerto.js';
import { IngresoDTO, DetalleIngresoDTO } from '../../aplicacion/dto/IngresoDTO.js';

export default class IngresoControlador extends IngresoEntradaPuerto {
  constructor(ingresoCommandUsesCase, ingresoQueryUsesCase) {
    super();
    this.commandUC = ingresoCommandUsesCase;
    this.queryUC   = ingresoQueryUsesCase;
  }

  // ── Ingreso ──────────────────────────────────────────────────────────────

  async crear(req, res) {
    const dto = new IngresoDTO({ ...req.body, usuarioId: req.user?.id });
    const respuesta = await this.commandUC.crear(dto);
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async lista(req, res) {
    const dto = new IngresoDTO({
      buscar:     req.query.buscar,
      estado:     req.query.estado,
      fechaDesde: req.query.fechaDesde,
      fechaHasta: req.query.fechaHasta,
    });
    const respuesta = await this.queryUC.lista(dto);
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const respuesta = await this.queryUC.buscarPorId(req.params.id);
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async editar(req, res) {
    const dto = new IngresoDTO({ ...req.body, usuarioId: req.user?.id });
    const respuesta = await this.commandUC.editar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async finalizar(req, res) {
    const dto = new IngresoDTO({ id: req.body.id });
    const respuesta = await this.commandUC.finalizar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async eliminar(req, res) {
    const dto = new IngresoDTO({ id: req.body.id });
    const respuesta = await this.commandUC.eliminar(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  // ── Detalle ───────────────────────────────────────────────────────────────

  async agregarDetalle(req, res) {
    const dto = new DetalleIngresoDTO({ ...req.body });
    const respuesta = await this.commandUC.agregarDetalle(dto);
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async editarDetalle(req, res) {
    const dto = new DetalleIngresoDTO({ ...req.body });
    const respuesta = await this.commandUC.editarDetalle(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }

  async eliminarDetalle(req, res) {
    const dto = new DetalleIngresoDTO({ id: req.body.id });
    const respuesta = await this.commandUC.eliminarDetalle(dto);
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({
      ...respuesta, traceId: req.traceId,
    });
  }
}
