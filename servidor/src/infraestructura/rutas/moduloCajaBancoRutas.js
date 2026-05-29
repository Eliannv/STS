// src/infraestructura/rutas/moduloCajaBancoRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { cajaBancoControlador } from '../contenedor/CajaBancoContenedor.js';

const router = Router();

// ── Caja Banco ────────────────────────────────────────────────────────────

router.post('/abrir',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => cajaBancoControlador.abrir(req, res));

router.put('/cerrar',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => cajaBancoControlador.cerrar(req, res));

router.get('/lista',
  authMiddleware(),
  (req, res) => cajaBancoControlador.lista(req, res));

router.get('/abierta',
  authMiddleware(),
  (req, res) => cajaBancoControlador.cajaAbierta(req, res));

router.get('/buscar/:id',
  authMiddleware(),
  (req, res) => cajaBancoControlador.buscarPorId(req, res));

// ── Movimientos ───────────────────────────────────────────────────────────

router.post('/movimiento',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => cajaBancoControlador.registrarMovimiento(req, res));

router.delete('/movimiento/:id',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => cajaBancoControlador.eliminarMovimiento(req, res));

router.get('/:id/movimientos',
  authMiddleware(),
  (req, res) => cajaBancoControlador.listarMovimientos(req, res));

export default router;
