import { Router } from 'express';
import { usuarioControlador } from '../contenedor/UsuarioContenedor.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = Router();

router.post('/login', usuarioControlador.login.bind(usuarioControlador));
router.post('/', authMiddleware('ADMINISTRADOR'), usuarioControlador.crear.bind(usuarioControlador));
// Catálogo de nombres: cualquier usuario autenticado puede resolver quién emitió
// un documento. Va antes de '/:id' para que la ruta genérica no lo capture.
router.get('/catalogo', authMiddleware(), usuarioControlador.catalogo.bind(usuarioControlador));
router.get('/', authMiddleware('ADMINISTRADOR'), usuarioControlador.lista.bind(usuarioControlador));
router.get('/:id', authMiddleware('ADMINISTRADOR'), usuarioControlador.buscarPorId.bind(usuarioControlador));
router.put('/:id', authMiddleware('ADMINISTRADOR'), usuarioControlador.editar.bind(usuarioControlador));
router.delete('/:id', authMiddleware('ADMINISTRADOR'), usuarioControlador.eliminar.bind(usuarioControlador));
router.put('/:id/password', authMiddleware(), usuarioControlador.cambiarPassword.bind(usuarioControlador));

export default router;
