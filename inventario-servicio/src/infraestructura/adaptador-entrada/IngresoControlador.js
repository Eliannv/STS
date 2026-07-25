// inventario-servicio/src/infraestructura/adaptador-entrada/IngresoControlador.js
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
      sucursalId: req.sucursalScope?.sucursalId ?? null,
      sucursalNombre: req.sucursalScope?.sucursalNombre ?? null,
      operacionId: req.body.operacionId ?? req.body.operacion_id,
      idempotencyKey: req.body.idempotencyKey ?? req.body.idempotency_key,
      metodoPago: req.body.metodoPago ?? req.body.metodo_pago,
      cajaTipo: req.body.cajaTipo ?? req.body.caja_tipo,
      cajaId: req.body.cajaId ?? req.body.caja_id,
      fechaVencimiento:
        req.body.fechaVencimiento
        ?? req.body.fecha_vencimiento,
      traceId: req.traceId,
    }));
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async eliminar(req, res) {
    const respuesta = await this.commandUC.eliminar(new IngresoDTO({
      id: req.params.id ?? req.body.id,
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null,
      sucursalId: req.sucursalScope?.sucursalId ?? null,
      sucursalNombre: req.sucursalScope?.sucursalNombre ?? null,
      motivo: req.body.motivo,
      operacionId: req.body.operacionId ?? req.body.operacion_id,
      idempotencyKey: req.body.idempotencyKey ?? req.body.idempotency_key,
      operacionIdOriginal:
        req.body.operacionIdOriginal
        ?? req.body.operacion_id_original,
      conReembolso:
        req.body.conReembolso
        ?? req.body.con_reembolso
        ?? false,
      cajaTipo: req.body.cajaTipo ?? req.body.caja_tipo,
      cajaId: req.body.cajaId ?? req.body.caja_id,
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
