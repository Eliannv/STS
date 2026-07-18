import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { cuentaControlador } from '../contenedor/CuentaContenedor.js';

const router = Router();
router.get('/', authMiddleware(), (req, res) => cuentaControlador.lista(req, res));
router.get('/:id', authMiddleware(), (req, res) => cuentaControlador.buscarPorId(req, res));
router.post('/', authMiddleware('ADMINISTRADOR'), (req, res) => cuentaControlador.crear(req, res));
router.put('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => cuentaControlador.editar(req, res));
router.put('/:id/cancelar', authMiddleware('ADMINISTRADOR'), (req, res) => cuentaControlador.cancelar(req, res));
export default router;
