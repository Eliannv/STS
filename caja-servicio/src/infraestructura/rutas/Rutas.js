import { Router } from 'express';
import moduloCajaBancoRutas from './moduloCajaBancoRutas.js';
import moduloCajaChicaRutas from './moduloCajaChicaRutas.js';
import moduloCuentaRutas from './moduloCuentaRutas.js';
const router = Router();
router.use('/cajas-banco', moduloCajaBancoRutas);
router.use('/cajas-chicas', moduloCajaChicaRutas);
router.use('/cuentas', moduloCuentaRutas);
export default router;
