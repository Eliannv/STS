// inventario-servicio/src/infraestructura/rutas/moduloReporteInternoRutas.js
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

router.get('/kardex', authMiddleware(), (req, res) => controlador.kardex(req, res));
router.get('/compras', authMiddleware(), (req, res) => controlador.compras(req, res));
router.get('/alertas-stock', authMiddleware(), (req, res) => controlador.alertasStock(req, res),
);
router.get('/valor', authMiddleware(), (req, res) => controlador.valorInventario(req, res));

export default router;
