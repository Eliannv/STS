// inventario-servicio/src/infraestructura/rutas/moduloReporteInternoRutas.js
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

router.get('/kardex', (req, res) => controlador.kardex(req, res));
router.get('/compras', (req, res) => controlador.compras(req, res));
router.get(
  '/alertas-stock',
  (req, res) => controlador.alertasStock(req, res),
);
router.get('/valor', (req, res) => controlador.valorInventario(req, res));

export default router;
