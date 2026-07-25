// bff-servicio/src/infraestructura/rutas/BffRutas.js
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { bffControlador } from '../contenedor/BffContenedor.js';

const router = Router();
const buildBaseUrl = (service, prefix) => service ? `${service.replace(/\/$/, '')}${prefix}` : null;
const forward = (path, service, prefix) => router.use(path, bffControlador.proxy(buildBaseUrl(service, prefix)));
const usuario = process.env.USUARIO_SERVICIO_URL;
const cliente = process.env.CLIENTE_SERVICIO_URL;
const inventario = process.env.INVENTARIO_SERVICIO_URL;
const facturacion = process.env.FACTURACION_SERVICIO_URL;
const caja = process.env.CAJA_SERVICIO_URL;
const reportes = process.env.REPORTES_SERVICIO_URL;

const usuarioIdDesdeToken = (req) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    );
    return payload.id ?? payload.usuarioId ?? payload.usuario_id ?? null;
  } catch {
    return null;
  }
};

const prepararOperacionEgreso = (tipo) => (req, res, next) => {
  const usuarioId =
    usuarioIdDesdeToken(req)
    ?? req.body?.usuarioId
    ?? req.body?.usuario_id;
  if (!usuarioId) {
    return res.status(400).json({
      estado: 'error',
      mensaje: 'No fue posible identificar al usuario',
      traceId: req.traceId,
    });
  }
  req.body = {
    ...req.body,
    operacion_id: randomUUID(),
    idempotency_key: `${tipo}_EGRESO:${req.params.id}:${usuarioId}`,
  };
  return next();
};

forward('/usuarios', usuario, '/api/v1/usuarios');
forward('/sucursales', usuario, '/api/v1/sucursales');
forward('/clientes', cliente, '/api/v1/clientes');
forward('/historial-clinico', cliente, '/api/v1/historial-clinico');
router.post(
  '/egresos/:id/confirmar',
  prepararOperacionEgreso('CONFIRMAR'),
);
router.post(
  '/egresos/:id/anular',
  prepararOperacionEgreso('ANULAR'),
);
forward('/egresos', inventario, '/api/v1/egresos');
for (const recurso of ['proveedores','productos','catalogo','ingresos','detalle-ingresos','movimientos','transferencias']) forward(`/${recurso}`, inventario, `/api/v1/${recurso}`);
for (const recurso of ['facturas','detalle-facturas','deudas','ventas-tarjeta','abonos-tarjeta']) forward(`/${recurso}`, facturacion, `/api/v1/${recurso}`);
forward('/cobro-deuda', facturacion, '/api/v1/cobro-deuda');
for (const recurso of ['cajas-banco','cajas-chicas','cuentas']) forward(`/${recurso}`, caja, `/api/v1/${recurso}`);
forward('/operaciones', caja, '/api/v1/operaciones');
forward('/reportes', reportes, '/api/v1/reportes');

export default router;
