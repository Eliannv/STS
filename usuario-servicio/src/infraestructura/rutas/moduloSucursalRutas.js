import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { sucursalControlador } from '../contenedor/SucursalContenedor.js';

const router = Router();
router.post('/', authMiddleware('ADMINISTRADOR'), sucursalControlador.crear.bind(sucursalControlador));
router.get('/', authMiddleware(), sucursalControlador.lista.bind(sucursalControlador));
router.get('/:id', authMiddleware(), sucursalControlador.buscarPorId.bind(sucursalControlador));
router.put('/:id', authMiddleware('ADMINISTRADOR'), sucursalControlador.editar.bind(sucursalControlador));
router.delete('/:id', authMiddleware('ADMINISTRADOR'), sucursalControlador.eliminar.bind(sucursalControlador));
export default router;
