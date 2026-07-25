// facturacion-servicio/src/infraestructura/rutas/moduloReporteInternoRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import ReporteInternoPgsQueryAdaptador from '../adaptador-salida/ReporteInternoPgsQueryAdaptador.js';
import ReporteInternoQueryUsesCase from '../../aplicacion/uses-cases/query/ReporteInternoQueryUsesCase.js';
import ReporteInternoControlador from '../adaptador-entrada/ReporteInternoControlador.js';

// Endpoints internos: los consume reportes-servicio reenviando el token del usuario
// final. Exigen autenticación (antes estaban abiertos en el puerto del servicio) y
// resuelven el SucursalScope, de modo que el reporte hereda exactamente los mismos
// permisos que tendría el usuario consultando el módulo directamente.
const router = Router();
const controlador = new ReporteInternoControlador(
  new ReporteInternoQueryUsesCase(
    new ReporteInternoPgsQueryAdaptador(),
  ),
);

router.get('/ventas', authMiddleware(), (req, res) => controlador.ventas(req, res));
router.get('/ventas-hoy', authMiddleware(), (req, res) => controlador.ventasHoy(req, res));
router.get('/cobros', authMiddleware(), (req, res) => controlador.cobros(req, res));
router.get('/tarjetas', authMiddleware(), (req, res) => controlador.tarjetas(req, res));
router.get('/dashboard-snapshot', authMiddleware(), (req, res) => controlador.dashboardSnapshot(req, res),
);

export default router;
