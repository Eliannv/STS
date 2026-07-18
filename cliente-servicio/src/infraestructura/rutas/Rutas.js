import { Router } from 'express';
import moduloClienteRutas from './moduloClienteRutas.js';
import moduloHistorialClinicoRutas from './moduloHistorialClinicoRutas.js';

const router = Router();

router.use('/clientes', moduloClienteRutas);
router.use('/historial-clinico', moduloHistorialClinicoRutas);

export default router;
