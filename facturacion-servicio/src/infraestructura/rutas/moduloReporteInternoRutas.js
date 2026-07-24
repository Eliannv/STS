// facturacion-servicio/src/infraestructura/rutas/moduloReporteInternoRutas.js
import { Router } from 'express';
import ReporteInternoPgsQueryAdaptador from '../adaptador-salida/ReporteInternoPgsQueryAdaptador.js';
import ReporteInternoQueryUsesCase from '../../aplicacion/uses-cases/query/ReporteInternoQueryUsesCase.js';
import ReporteInternoControlador from '../adaptador-entrada/ReporteInternoControlador.js';

const router = Router();
const controlador = new ReporteInternoControlador(
  new ReporteInternoQueryUsesCase(
    new ReporteInternoPgsQueryAdaptador(),
  ),
);

router.get('/ventas', (req, res) => controlador.ventas(req, res));
router.get('/ventas-hoy', (req, res) => controlador.ventasHoy(req, res));
router.get('/cobros', (req, res) => controlador.cobros(req, res));
router.get('/tarjetas', (req, res) => controlador.tarjetas(req, res));
router.get(
  '/dashboard-snapshot',
  (req, res) => controlador.dashboardSnapshot(req, res),
);

export default router;
