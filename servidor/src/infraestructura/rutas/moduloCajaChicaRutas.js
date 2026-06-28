// src/infraestructura/rutas/moduloCajaChicaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { cajaChicaControlador } from '../contenedor/CajaChicaContenedor.js';

const router = Router();
const c = cajaChicaControlador;

router.get('/lista', authMiddleware(), c.lista.bind(c));
router.get('/abierta', authMiddleware(), c.cajaAbierta.bind(c));
router.get('/buscar/:id', authMiddleware(), c.buscarPorId.bind(c));
router.post('/abrir', authMiddleware(), c.abrir.bind(c));
router.put('/cerrar', authMiddleware(), c.cerrar.bind(c));
router.post('/movimiento', authMiddleware(), c.registrarMovimiento.bind(c));
router.delete('/movimiento/:id', authMiddleware('ADMINISTRADOR'), c.eliminarMovimiento.bind(c));
router.get('/:id/movimientos', authMiddleware(), c.listarMovimientos.bind(c));

export default router;