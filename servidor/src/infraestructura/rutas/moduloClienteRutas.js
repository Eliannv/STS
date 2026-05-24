// src/infraestructura/rutas/moduloClienteRutas.js
import { Router } from 'express';
import { clienteControlador } from '../contenedor/ClienteContenedor.js';
import { authMiddleware }     from '../middleware/AuthMiddleware.js';

const router = Router();

// Rutas protegidas â€” cualquier usuario autenticado
router.post('/crear',      authMiddleware(), clienteControlador.crear);
router.get('/lista',       authMiddleware(), clienteControlador.lista);       // ?buscar=texto
router.get('/buscar/:id',  authMiddleware(), clienteControlador.buscarPorId);
router.put('/editar',      authMiddleware(), clienteControlador.editar);

// Ruta protegida â€” solo ADMINISTRADOR (soft delete)
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), clienteControlador.eliminar);

export default router;

