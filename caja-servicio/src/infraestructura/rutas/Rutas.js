// caja-servicio/src/infraestructura/rutas/Rutas.js
// caja-servicio/src/infraestructura/rutas/Rutas.js
import { Router } from 'express';
import moduloCajaRutas from './moduloCajaRutas.js';
import moduloCuentaRutas from './moduloCuentaRutas.js';
import moduloOperacionRutas from './moduloOperacionRutas.js';
import moduloReporteInternoRutas from './moduloReporteInternoRutas.js';

const router = Router();

router.use('/', moduloCajaRutas);
router.use('/cuentas', moduloCuentaRutas);
router.use('/operaciones', moduloOperacionRutas);
router.use('/caja/reportes', moduloReporteInternoRutas);

export default router;
