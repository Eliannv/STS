// caja-servicio/src/infraestructura/rutas/moduloReporteInternoRutas.js
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

router.get('/movimientos', authMiddleware(), (req, res) => controlador.movimientos(req, res));
router.get('/flujo', authMiddleware(), (req, res) => controlador.flujo(req, res));
router.get('/saldo-actual', authMiddleware(), (req, res) => controlador.saldoActual(req, res));
router.get('/cuentas-cobrar', authMiddleware(), (req, res) => controlador.cuentasCobrar(req, res),
);
router.get('/cuentas-pagar', authMiddleware(), (req, res) => controlador.cuentasPagar(req, res),
);

export default router;
