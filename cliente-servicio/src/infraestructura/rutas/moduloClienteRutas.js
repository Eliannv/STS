import { Router } from 'express';
import { clienteControlador } from '../contenedor/ClienteContenedor.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = Router();

router.post('/', authMiddleware(), (req, res) => clienteControlador.crear(req, res));
router.get('/', authMiddleware(), (req, res) => clienteControlador.lista(req, res));
router.post('/crear', authMiddleware(), (req, res) => clienteControlador.crear(req, res));
router.get('/lista', authMiddleware(), (req, res) => clienteControlador.lista(req, res));
router.get('/buscar/:id', authMiddleware(), (req, res) => clienteControlador.buscarPorId(req, res));
router.put('/editar', authMiddleware(), (req, res) => clienteControlador.editar(req, res));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), (req, res) => clienteControlador.eliminar(req, res));
router.get('/:id', authMiddleware(), (req, res) => clienteControlador.buscarPorId(req, res));
router.put('/:id', authMiddleware(), (req, res) => clienteControlador.editar(req, res));
router.delete('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => clienteControlador.eliminar(req, res));

export default router;
