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

forward('/usuarios', usuario, '/api/v1/usuarios');
forward('/sucursales', usuario, '/api/v1/sucursales');
forward('/clientes', cliente, '/api/v1/clientes');
forward('/historial-clinico', cliente, '/api/v1/historial-clinico');
for (const recurso of ['proveedores','productos','catalogo','ingresos','detalle-ingresos','egresos','detalle-egresos','movimientos']) forward(`/${recurso}`, inventario, `/api/v1/${recurso}`);
for (const recurso of ['facturas','detalle-facturas','deudas','ventas-tarjeta','abonos-tarjeta']) forward(`/${recurso}`, facturacion, `/api/v1/${recurso}`);
forward('/cobro-deuda', facturacion, '/api/v1/cobro-deuda');
for (const recurso of ['cajas-banco','cajas-chicas','cuentas']) forward(`/${recurso}`, caja, `/api/v1/${recurso}`);
forward('/reportes', reportes, '/api/v1/reportes');

export default router;
