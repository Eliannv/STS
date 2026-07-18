import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { cajaBancoControlador } from '../contenedor/CajaBancoContenedor.js';

const router = Router();
router.get('/', authMiddleware(), (req, res) => cajaBancoControlador.lista(req, res));
router.post('/abrir', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.abrir(req, res));
router.put('/cerrar', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.cerrar(req, res));
router.put('/:id/cerrar', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.cerrar(req, res));
router.get('/lista', authMiddleware(), (req, res) => cajaBancoControlador.lista(req, res));
router.get('/abierta', authMiddleware(), async (req, res) => { const r = await cajaBancoControlador.queryUC.cajaAbierta(); return res.status(200).json({ ...r, traceId: req.traceId }); });
router.get('/buscar/:id', authMiddleware(), (req, res) => cajaBancoControlador.buscarPorId(req, res));
router.post('/movimiento', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.movimiento(req, res));
router.post('/:id/movimientos', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.movimiento(req, res));
router.delete('/movimiento/:id', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.eliminarMovimiento(req, res));
router.get('/:id/movimientos', authMiddleware(), (req, res) => cajaBancoControlador.listarMovimientos(req, res));
router.get('/:id', authMiddleware(), (req, res) => cajaBancoControlador.buscarPorId(req, res));

export default router;
