// src/infraestructura/rutas/moduloProductoRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { productoControlador } from '../contenedor/ProductoContenedor.js';

const router = Router();
const c = productoControlador;

router.get('/siguiente-codigo', authMiddleware(), c.siguienteCodigo.bind(c));
router.get('/lista', authMiddleware(), c.lista.bind(c));
router.get('/buscar/:id', authMiddleware(), c.buscarPorId.bind(c));
router.get('/buscar-unico', authMiddleware(), c.buscarPorModeloColorGrupo.bind(c));
router.post('/crear', authMiddleware('ADMINISTRADOR'), c.crear.bind(c));
router.put('/editar', authMiddleware('ADMINISTRADOR'), c.editar.bind(c));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), c.eliminar.bind(c));

export default router;