// src/infraestructura/rutas/moduloCajaChicaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { cajaChicaControlador } from '../contenedor/CajaChicaContenedor.js';

const router = Router();

// ── Caja Chica ────────────────────────────────────────────────────────────

router.post('/abrir',
  authMiddleware(),
  (req, res) => cajaChicaControlador.abrir(req, res));

router.put('/cerrar',
  authMiddleware(),
  (req, res) => cajaChicaControlador.cerrar(req, res));

router.get('/lista',
  authMiddleware(),
  (req, res) => cajaChicaControlador.lista(req, res));

router.get('/abierta',
  authMiddleware(),
  (req, res) => cajaChicaControlador.cajaAbierta(req, res));

router.get('/buscar/:id',
  authMiddleware(),
  (req, res) => cajaChicaControlador.buscarPorId(req, res));

// ── Movimientos ───────────────────────────────────────────────────────────

router.post('/movimiento',
  authMiddleware(),
  (req, res) => cajaChicaControlador.registrarMovimiento(req, res));

router.delete('/movimiento/:id',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => cajaChicaControlador.eliminarMovimiento(req, res));

router.get('/:id/movimientos',
  authMiddleware(),
  (req, res) => cajaChicaControlador.listarMovimientos(req, res));

export default router;
