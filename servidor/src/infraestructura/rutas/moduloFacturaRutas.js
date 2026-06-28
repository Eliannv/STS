// src/infraestructura/rutas/moduloFacturaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { facturaControlador } from '../contenedor/FacturaContenedor.js';

const router = Router();
const c = facturaControlador;

router.get('/lista', authMiddleware(), c.listaGeneral.bind(c));
router.get('/cliente/:clienteId', authMiddleware(), c.listaPorCliente.bind(c));
router.get('/resumen/:clienteId', authMiddleware(), c.resumenPorCliente.bind(c));
router.get('/buscar/:id', authMiddleware(), c.buscarPorId.bind(c));
router.post('/crear', authMiddleware(), c.crear.bind(c));
router.put('/editar', authMiddleware(), c.editar.bind(c));
router.put('/cobrar/:id', authMiddleware(), c.cobrar.bind(c));
router.put('/anular/:id', authMiddleware('ADMINISTRADOR'), c.anular.bind(c));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), c.eliminar.bind(c));

export default router;