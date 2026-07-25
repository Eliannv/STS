import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { exigirSucursal } from '../middleware/SucursalScopeMiddleware.js';
import { transferenciaControlador } from '../contenedor/TransferenciaContenedor.js';

const router = Router();

router.get('/', authMiddleware(), (req, res) => transferenciaControlador.lista(req, res));
router.post('/', authMiddleware(), exigirSucursal, (req, res) => transferenciaControlador.crear(req, res));
router.get('/:id', authMiddleware(), (req, res) => transferenciaControlador.buscarPorId(req, res));
router.post('/:id/anular', authMiddleware('ADMINISTRADOR'), (req, res) => transferenciaControlador.anular(req, res));

export default router;
