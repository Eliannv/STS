// reportes-servicio/src/infraestructura/rutas/moduloReportesRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { ctrl } from '../contenedor/ReportesContenedor.js';

const router = Router();
const lectura = authMiddleware();

router.get('/ventas', lectura, (req, res) => ctrl.ventas(req, res));
router.get('/cobros', lectura, (req, res) => ctrl.cobros(req, res));
router.get('/flujo-caja', lectura, (req, res) => ctrl.flujoCaja(req, res));
router.get('/cuentas-cobrar', lectura, (req, res) => ctrl.cuentasCobrar(req, res));
router.get('/cuentas-pagar', lectura, (req, res) => ctrl.cuentasPagar(req, res));
router.get('/tarjetas', lectura, (req, res) => ctrl.tarjetas(req, res));
router.get(
  '/inventario-movimientos',
  lectura,
  (req, res) => ctrl.inventarioMovimientos(req, res),
);
router.get('/compras', lectura, (req, res) => ctrl.compras(req, res));
router.get(
  '/dashboard/indicadores',
  lectura,
  (req, res) => ctrl.dashboard(req, res),
);

export default router;
