import ProductoEntradaPuerto from '../../aplicacion/puertos/entrada/ProductoEntradaPuerto.js';
import { ProductoDTO } from '../../aplicacion/dto/ProductoDTO.js';

export default class ProductoControlador extends ProductoEntradaPuerto {
  constructor(productoCommandUsesCase, productoQueryUsesCase) {
    super();
    this.commandUC = productoCommandUsesCase;
    this.queryUC = productoQueryUsesCase;
  }

  async crear(req, res) {
    const respuesta = await this.commandUC.crear(new ProductoDTO({
      ...req.body,
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null,
      sucursalId: req.usuario?.sucursalId ?? req.body.sucursalId,
      operacionId: req.body.operacionId || req.traceId,
      idempotencyKey: req.body.idempotencyKey || req.headers['x-idempotency-key'] || req.traceId,
      traceId: req.traceId,
    }));
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async lista(req, res) {
    const dto = new ProductoDTO({ buscar: req.query.buscar, sucursalId: req.query.sucursalId });
    const pag = { limit: Number(req.query.limit) || 20, offset: Number(req.query.offset) || 0, estado: req.query.estado || 'activos' };
    const respuesta = await this.queryUC.lista(dto, pag);
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const respuesta = await this.queryUC.buscarPorId(Number(req.params.id));
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }

  async editar(req, res) {
    const respuesta = await this.commandUC.editar(new ProductoDTO({
      ...req.body,
      id: req.params.id ?? req.body.id,
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null,
      sucursalId: req.usuario?.sucursalId ?? req.body.sucursalId,
      operacionId: req.body.operacionId || req.traceId,
      idempotencyKey: req.body.idempotencyKey || req.headers['x-idempotency-key'] || req.traceId,
      traceId: req.traceId,
    }));
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async eliminar(req, res) {
    const respuesta = await this.commandUC.eliminar(new ProductoDTO({ id: req.params.id ?? req.body.id }));
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorModeloColorGrupo(req, res) {
    const respuesta = await this.queryUC.buscarPorModeloColorGrupo(req.query.modelo, req.query.color, req.query.grupo);
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }

  async reducirStock(req, res) {
    const respuesta = await this.commandUC.reducirStock(req.body.items || [], {
      usuarioId: req.usuario?.id,
      usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null,
      sucursalId: req.usuario?.sucursalId,
      referenciaId: req.body.referenciaId,
      referenciaCodigo: req.body.referenciaCodigo,
      operacionId: req.body.operacionId || req.traceId,
      idempotencyKey: req.body.idempotencyKey || req.headers['x-idempotency-key'] || req.traceId,
      traceId: req.traceId,
    });
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }
}
