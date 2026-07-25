// inventario-servicio/src/infraestructura/adaptador-entrada/EgresoMercaderiaControlador.js
import EgresoEntradaPuerto from '../../aplicacion/puertos/entrada/EgresoEntradaPuerto.js';
import EgresoFiltro from '../../dominio/filtros/EgresoFiltro.js';

const usuario = (req) => ({
  usuarioId: req.usuario?.id ?? null,
  usuarioNombre: req.usuario
    ? `${req.usuario.nombre ?? ''} ${req.usuario.apellido ?? ''}`.trim()
    : null,
  sucursalId: req.sucursalScope?.sucursalId ?? null,
  sucursalNombre: req.sucursalScope?.sucursalNombre ?? null,
  traceId: req.get('X-Trace-Id') ?? req.traceId ?? null,
});

const responderError = (res, error) => res.status(400).json({
  ok: false,
  mensaje: error.message,
});

const validarIdempotencia = (req, res) => {
  const idempotencyKey =
    req.body?.idempotency_key
    ?? req.body?.idempotencyKey;
  const operacionId = req.body?.operacion_id ?? req.body?.operacionId;
  if (!idempotencyKey || !operacionId) {
    res.status(400).json({
      ok: false,
      mensaje: 'operacion_id e idempotency_key son requeridos',
    });
    return false;
  }
  return true;
};

export default class EgresoMercaderiaControlador extends EgresoEntradaPuerto {
  constructor(commandUseCase, queryUseCase) {
    super();
    this.commandUseCase = commandUseCase;
    this.queryUseCase = queryUseCase;
  }

  async crearEgreso(req, res) {
    try {
      const contexto = usuario(req);
      const data = await this.commandUseCase.crearEgreso(
        { ...req.body, ...contexto },
        contexto.usuarioId,
        contexto.usuarioNombre,
      );
      return res.status(201).json({ ok: true, data });
    } catch (error) {
      return responderError(res, error);
    }
  }

  async obtenerEgresos(req, res) {
    try {
      const data = await this.queryUseCase.obtenerEgresos(
        new EgresoFiltro({ ...req.query, sucursalId: req.sucursalScope?.filtroLectura ?? null }),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return responderError(res, error);
    }
  }

  async obtenerEgresoPorId(req, res) {
    try {
      const data = await this.queryUseCase.obtenerEgresoPorId(
        Number(req.params.id),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return responderError(res, error);
    }
  }

  async agregarDetalle(req, res) {
    try {
      const data = await this.commandUseCase.agregarDetalle(
        Number(req.params.id),
        req.body,
      );
      return res.status(201).json({ ok: true, data });
    } catch (error) {
      return responderError(res, error);
    }
  }

  async eliminarDetalle(req, res) {
    try {
      await this.commandUseCase.eliminarDetalle(
        Number(req.params.id),
        Number(req.params.detalleId),
      );
      return res.status(200).json({ ok: true, data: true });
    } catch (error) {
      return responderError(res, error);
    }
  }

  async confirmarEgreso(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.commandUseCase.confirmarEgreso(
        Number(req.params.id),
        { ...req.body, ...usuario(req) },
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return responderError(res, error);
    }
  }

  async anularEgreso(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.commandUseCase.anularEgreso(
        Number(req.params.id),
        { ...req.body, ...usuario(req) },
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return responderError(res, error);
    }
  }

  async descartarEgreso(req, res) {
    try {
      const data = await this.commandUseCase.descartarEgreso(
        Number(req.params.id),
        usuario(req),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return responderError(res, error);
    }
  }

  async obtenerMovimientos(req, res) {
    try {
      const data = await this.queryUseCase.obtenerMovimientosDeEgreso(
        Number(req.params.id),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return responderError(res, error);
    }
  }
}
