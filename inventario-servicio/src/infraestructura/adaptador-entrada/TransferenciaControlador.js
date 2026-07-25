// inventario-servicio/src/infraestructura/adaptador-entrada/TransferenciaControlador.js
import { randomUUID } from 'node:crypto';
import TransferenciaEntradaPuerto from '../../aplicacion/puertos/entrada/TransferenciaEntradaPuerto.js';

const contexto = (req) => ({
  usuarioId: req.usuario?.id ?? null,
  usuarioNombre: req.usuario ? `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() : null,
  traceId: req.traceId,
});

export default class TransferenciaControlador extends TransferenciaEntradaPuerto {
  constructor(commandUC, queryUC) {
    super();
    this.commandUC = commandUC;
    this.queryUC = queryUC;
  }

  async crear(req, res) {
    // El origen es la sucursal en la que se está operando: no se acepta por body,
    // así un operador no puede sacar mercadería de otra sucursal.
    const respuesta = await this.commandUC.crear({
      ...req.body,
      ...contexto(req),
      sucursalOrigenId: req.sucursalScope?.sucursalId ?? null,
      sucursalOrigenNombre: req.sucursalScope?.sucursalNombre ?? null,
      operacionId: req.body.operacionId ?? req.body.operacion_id ?? randomUUID(),
      idempotencyKey: req.body.idempotencyKey ?? req.body.idempotency_key ?? req.headers['x-idempotency-key'] ?? null,
    });
    return res.status(respuesta.estado === 'ok' ? 201 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async anular(req, res) {
    const respuesta = await this.commandUC.anular(Number(req.params.id), {
      ...contexto(req),
      motivo: req.body?.motivo,
      operacionId: req.body?.operacionId ?? req.body?.operacion_id ?? randomUUID(),
      idempotencyKey: req.body?.idempotencyKey ?? req.body?.idempotency_key ?? `ANULAR_TRANSFERENCIA:${req.params.id}`,
    });
    return res.status(respuesta.estado === 'ok' ? 200 : 400).json({ ...respuesta, traceId: req.traceId });
  }

  async lista(req, res) {
    const respuesta = await this.queryUC.lista({
      sucursalId: req.sucursalScope?.filtroLectura ?? null,
      estado: req.query.estado || null,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return res.status(200).json({ ...respuesta, traceId: req.traceId });
  }

  async buscarPorId(req, res) {
    const respuesta = await this.queryUC.buscarPorId(Number(req.params.id));
    return res.status(respuesta.estado === 'ok' ? 200 : 404).json({ ...respuesta, traceId: req.traceId });
  }
}
