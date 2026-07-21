import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { movimientoStockControlador } from '../contenedor/MovimientoStockContenedor.js';

const router = Router();

router.get('/', authMiddleware(), (req, res) => movimientoStockControlador.listar(req, res));
router.get('/:id', authMiddleware(), (req, res) => movimientoStockControlador.buscar(req, res));
router.post('/aplicar', authMiddleware(), (req, res) => movimientoStockControlador.aplicar(req, res));
router.post('/revertir-referencia', authMiddleware('ADMINISTRADOR'), (req, res) => movimientoStockControlador.revertirReferencia(req, res));
router.post('/:id/revertir', authMiddleware('ADMINISTRADOR'), (req, res) => movimientoStockControlador.revertirMovimiento(req, res));

export default router;
