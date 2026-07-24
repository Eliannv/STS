// caja-servicio/src/infraestructura/rutas/moduloReporteInternoRutas.js
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

router.get('/movimientos', (req, res) => controlador.movimientos(req, res));
router.get('/flujo', (req, res) => controlador.flujo(req, res));
router.get('/saldo-actual', (req, res) => controlador.saldoActual(req, res));
router.get(
  '/cuentas-cobrar',
  (req, res) => controlador.cuentasCobrar(req, res),
);
router.get(
  '/cuentas-pagar',
  (req, res) => controlador.cuentasPagar(req, res),
);

export default router;
