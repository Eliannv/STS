// src/infraestructura/rutas/moduloUsuarioRutas.js
import { Router } from 'express';
import { usuarioControlador } from '../contenedor/UsuarioContenedor.js';
import { authMiddleware }     from '../middleware/AuthMiddleware.js';

const router = Router();

// Ruta pÃºblica
router.post('/login',            usuarioControlador.login);

// Rutas protegidas â€” solo ADMINISTRADOR
router.post('/crear',            authMiddleware('ADMINISTRADOR'), usuarioControlador.crear);
router.get('/lista',             authMiddleware('ADMINISTRADOR'), usuarioControlador.lista);
router.get('/buscar/:id',        authMiddleware('ADMINISTRADOR'), usuarioControlador.buscarPorId);
router.put('/editar',            authMiddleware('ADMINISTRADOR'), usuarioControlador.editar);
router.delete('/eliminar',       authMiddleware('ADMINISTRADOR'), usuarioControlador.eliminar);

// Ruta protegida â€” cualquier usuario autenticado puede cambiar su propia contraseÃ±a
router.put('/cambiar-password',  authMiddleware(), usuarioControlador.cambiarPassword);

export default router;

