// src/infraestructura/rutas/moduloProveedorRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { proveedorControlador } from '../contenedor/ProveedorContenedor.js';

const router = Router();
const c = proveedorControlador;

router.get('/lista', authMiddleware(), c.lista.bind(c));
router.get('/buscar/:id', authMiddleware(), c.buscarPorId.bind(c));
router.post('/crear', authMiddleware('ADMINISTRADOR'), c.crear.bind(c));
router.put('/editar', authMiddleware('ADMINISTRADOR'), c.editar.bind(c));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), c.eliminar.bind(c));

export default router;