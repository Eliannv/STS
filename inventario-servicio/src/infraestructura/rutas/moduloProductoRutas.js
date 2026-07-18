import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { productoControlador } from '../contenedor/ProductoContenedor.js';

const router = Router();

router.get('/', authMiddleware(), (req, res) => productoControlador.lista(req, res));
router.post('/', authMiddleware('ADMINISTRADOR'), (req, res) => productoControlador.crear(req, res));
router.get('/lista', authMiddleware(), (req, res) => productoControlador.lista(req, res));
router.get('/buscar-unico', authMiddleware(), (req, res) => productoControlador.buscarPorModeloColorGrupo(req, res));
router.get('/buscar/:id', authMiddleware(), (req, res) => productoControlador.buscarPorId(req, res));
router.post('/crear', authMiddleware('ADMINISTRADOR'), (req, res) => productoControlador.crear(req, res));
router.put('/editar', authMiddleware('ADMINISTRADOR'), (req, res) => productoControlador.editar(req, res));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), (req, res) => productoControlador.eliminar(req, res));
router.get('/:id', authMiddleware(), (req, res) => productoControlador.buscarPorId(req, res));
router.put('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => productoControlador.editar(req, res));
router.delete('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => productoControlador.eliminar(req, res));

export default router;
