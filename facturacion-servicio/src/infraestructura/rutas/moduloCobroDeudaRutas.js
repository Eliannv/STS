// facturacion-servicio/src/infraestructura/rutas/moduloCobroDeudaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { guardaSucursal } from '../middleware/SucursalScopeMiddleware.js';
import { sucursalDeFactura } from '../middleware/resolversSucursal.js';
import { cobroDeudaControlador } from '../contenedor/CobroDeudaContenedor.js';

const router = Router();
router.use(authMiddleware(), (req, res) => res.status(410).json({
  estado: 'error',
  resultado: 'Módulo obsoleto. Utilice Cuentas por Cobrar.',
  traceId: req.traceId,
}));
router.post('/registrar-abono', authMiddleware(), (req, res) => res.status(410).json({
  estado: 'error',
  resultado: 'Ruta obsoleta. Utilice /api/v1/operaciones/cobros en caja-servicio.',
  traceId: req.traceId,
}));
router.get('/facturas-pendientes', authMiddleware(), (req, res) => cobroDeudaControlador.facturasPendientes(req, res));
router.get('/facturas/:facturaId/abonos', authMiddleware(), guardaSucursal({ resolverPadre: sucursalDeFactura }), (req, res) => cobroDeudaControlador.abonosPorFactura(req, res));
router.get('/abonos/:abonoId', authMiddleware(), guardaSucursal(), (req, res) => cobroDeudaControlador.obtenerAbono(req, res));
router.get('/cliente/:clienteId/resumen', authMiddleware(), (req, res) => cobroDeudaControlador.resumenDeuda(req, res));
router.get('/lista-abonos', authMiddleware(), (req, res) => cobroDeudaControlador.listaAbonos(req, res));
router.get('/deudas-pagina', authMiddleware(), (req, res) => cobroDeudaControlador.deudasPaginadas(req, res));
export default router;
