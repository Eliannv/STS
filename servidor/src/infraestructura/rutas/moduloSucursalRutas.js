// src/infraestructura/rutas/moduloSucursalRutas.js
import { Router } from 'express';
import { sucursalControlador } from '../contenedor/SucursalContenedor.js';
import { authMiddleware }      from '../middleware/AuthMiddleware.js';

const router = Router();

// Rutas protegidas â€” solo ADMINISTRADOR
router.post('/crear',      authMiddleware('ADMINISTRADOR'), sucursalControlador.crear);
router.put('/editar',      authMiddleware('ADMINISTRADOR'), sucursalControlador.editar);
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), sucursalControlador.eliminar);

// Rutas protegidas â€” cualquier usuario autenticado
router.get('/lista',       authMiddleware(), sucursalControlador.lista);
router.get('/buscar/:id',  authMiddleware(), sucursalControlador.buscarPorId);

export default router;

