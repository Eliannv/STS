// src/infraestructura/rutas/moduloHistorialClinicoRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { historialClinicoControlador } from '../contenedor/HistorialClinicoContenedor.js';

const router = Router();

router.post('/crear',
  authMiddleware(),
  (req, res) => historialClinicoControlador.crear(req, res));

router.get('/cliente/:clienteId',
  authMiddleware(),
  (req, res) => historialClinicoControlador.listaPorCliente(req, res));

router.get('/buscar/:id',
  authMiddleware(),
  (req, res) => historialClinicoControlador.buscarPorId(req, res));

router.put('/editar',
  authMiddleware(),
  (req, res) => historialClinicoControlador.editar(req, res));

router.delete('/eliminar',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => historialClinicoControlador.eliminar(req, res));

export default router;

