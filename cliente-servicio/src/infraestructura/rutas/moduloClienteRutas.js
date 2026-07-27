import { Router } from 'express';
import { clienteControlador } from '../contenedor/ClienteContenedor.js';
import { fichaClienteControlador } from '../contenedor/FichaClienteContenedor.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = Router();

// Ficha del Cliente: una sola petición para todo el Centro de Atención.
// Se declara antes de '/:id' para que no la capture la ruta genérica.
router.get('/:id/ficha', authMiddleware(), (req, res) => fichaClienteControlador.ficha(req, res));

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
