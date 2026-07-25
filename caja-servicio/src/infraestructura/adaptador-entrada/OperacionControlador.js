// caja-servicio/src/infraestructura/adaptador-entrada/OperacionControlador.js
import OperacionEntradaPuerto from '../../aplicacion/puertos/entrada/OperacionEntradaPuerto.js';

const prepararParametros = (req) => {
  const {
    trace_id: traceIdIgnorado,
    traceId: traceIdBodyIgnorado,
    ...body
  } = req.body ?? {};
  void traceIdIgnorado;
  void traceIdBodyIgnorado;

  return {
    ...body,
    usuario_id: req.usuario?.id ?? body.usuario_id ?? body.usuarioId,
    usuario_nombre: req.usuario
      ? `${req.usuario.nombre ?? ''} ${req.usuario.apellido ?? ''}`.trim()
      : body.usuario_nombre ?? body.usuarioNombre,
    traceId: req.get('X-Trace-Id') ?? req.traceId ?? null,
  };
};

const validarIdempotencia = (req, res) => {
  if (!req.body?.idempotency_key && !req.body?.idempotencyKey) {
    res.status(400).json({
      ok: false,
      mensaje: 'idempotency_key es requerido',
    });
    return false;
  }
  return true;
};

export default class OperacionControlador extends OperacionEntradaPuerto {
  constructor(operacionCommandUsesCase) {
    super();
    this.operacionCommandUsesCase = operacionCommandUsesCase;
  }

  async procesarVenta(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.operacionCommandUsesCase.procesarVenta(
        prepararParametros(req),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async procesarCobro(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.operacionCommandUsesCase.procesarCobro(
        prepararParametros(req),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async procesarAnulacion(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.operacionCommandUsesCase.procesarAnulacion(
        prepararParametros(req),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async procesarAcreditacionTarjeta(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data =
        await this.operacionCommandUsesCase.procesarAcreditacionTarjeta(
          prepararParametros(req),
        );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async procesarCompra(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.operacionCommandUsesCase.procesarCompra(
        prepararParametros(req),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async crearCuentaPagar(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.operacionCommandUsesCase.crearCuentaPagar(
        prepararParametros(req),
      );
      return res.status(201).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async procesarPagoProveedor(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.operacionCommandUsesCase.procesarPagoProveedor({
        ...prepararParametros(req),
        cuenta_pagar_id: Number(req.params.id),
      });
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async procesarAnulacionCompra(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.operacionCommandUsesCase.procesarAnulacionCompra(
        prepararParametros(req),
      );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async procesarDevolucionProveedor(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data =
        await this.operacionCommandUsesCase.procesarDevolucionProveedor(
          prepararParametros(req),
        );
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }

  async procesarAjuste(req, res) {
    if (!validarIdempotencia(req, res)) return null;
    try {
      const data = await this.operacionCommandUsesCase.procesarAjuste(
        prepararParametros(req),
      );
      return res.status(201).json({ ok: true, data });
    } catch (error) {
      return res.status(400).json({ ok: false, mensaje: error.message });
    }
  }
}
