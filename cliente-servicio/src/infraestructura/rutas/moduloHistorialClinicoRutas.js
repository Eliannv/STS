import { Router } from 'express';
import { historialClinicoControlador } from '../contenedor/HistorialClinicoContenedor.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = Router();

router.post('/', authMiddleware(), (req, res) => historialClinicoControlador.crear(req, res));
router.get('/cliente/:clienteId', authMiddleware(), (req, res) => historialClinicoControlador.listaPorCliente(req, res));
router.post('/crear', authMiddleware(), (req, res) => historialClinicoControlador.crear(req, res));
router.get('/buscar/:id', authMiddleware(), (req, res) => historialClinicoControlador.buscarPorId(req, res));
router.put('/editar', authMiddleware(), (req, res) => historialClinicoControlador.editar(req, res));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), (req, res) => historialClinicoControlador.eliminar(req, res));
router.get('/:id', authMiddleware(), (req, res) => historialClinicoControlador.buscarPorId(req, res));
router.put('/:id', authMiddleware(), (req, res) => historialClinicoControlador.editar(req, res));
router.delete('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => historialClinicoControlador.eliminar(req, res));

export default router;
