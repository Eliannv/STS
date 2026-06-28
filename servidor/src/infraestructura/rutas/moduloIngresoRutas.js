// src/infraestructura/rutas/moduloIngresoRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { ingresoControlador } from '../contenedor/IngresoContenedor.js';

const router = Router();
const c = ingresoControlador;

router.get('/lista', authMiddleware(), c.lista.bind(c));
router.get('/buscar/:id', authMiddleware(), c.buscarPorId.bind(c));
router.post('/crear', authMiddleware('ADMINISTRADOR'), c.crear.bind(c));
router.put('/editar', authMiddleware('ADMINISTRADOR'), c.editar.bind(c));
router.put('/finalizar', authMiddleware('ADMINISTRADOR'), c.finalizar.bind(c));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), c.eliminar.bind(c));
router.post('/detalle/agregar', authMiddleware('ADMINISTRADOR'), c.agregarDetalle.bind(c));
router.put('/detalle/editar', authMiddleware('ADMINISTRADOR'), c.editarDetalle.bind(c));
router.delete('/detalle/eliminar', authMiddleware('ADMINISTRADOR'), c.eliminarDetalle.bind(c));

export default router;