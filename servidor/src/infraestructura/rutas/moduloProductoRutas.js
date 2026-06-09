// src/infraestructura/rutas/moduloProductoRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { productoControlador } from '../contenedor/ProductoContenedor.js';

const router = Router();

router.post('/crear',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => productoControlador.crear(req, res));

router.get('/lista',
  authMiddleware(),
  (req, res) => productoControlador.lista(req, res));

router.get('/buscar/:id',
  authMiddleware(),
  (req, res) => productoControlador.buscarPorId(req, res));

router.put('/editar',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => productoControlador.editar(req, res));

router.delete('/eliminar',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => productoControlador.eliminar(req, res));

router.get('/buscar-unico',
  authMiddleware(),
  (req, res) => productoControlador.buscarPorModeloColorGrupo(req, res));

export default router;

