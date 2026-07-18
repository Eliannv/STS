import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { proveedorControlador } from '../contenedor/ProveedorContenedor.js';

const router = Router();

router.get('/', authMiddleware(), (req, res) => proveedorControlador.lista(req, res));
router.post('/', authMiddleware('ADMINISTRADOR'), (req, res) => proveedorControlador.crear(req, res));
router.get('/lista', authMiddleware(), (req, res) => proveedorControlador.lista(req, res));
router.get('/buscar/:id', authMiddleware(), (req, res) => proveedorControlador.buscarPorId(req, res));
router.post('/crear', authMiddleware('ADMINISTRADOR'), (req, res) => proveedorControlador.crear(req, res));
router.put('/editar', authMiddleware('ADMINISTRADOR'), (req, res) => proveedorControlador.editar(req, res));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), (req, res) => proveedorControlador.eliminar(req, res));
router.get('/:id', authMiddleware(), (req, res) => proveedorControlador.buscarPorId(req, res));
router.put('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => proveedorControlador.editar(req, res));
router.delete('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => proveedorControlador.eliminar(req, res));

export default router;
