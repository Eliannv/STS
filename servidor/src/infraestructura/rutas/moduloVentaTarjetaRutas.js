// src/infraestructura/rutas/moduloVentaTarjetaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { ventaTarjetaControlador } from '../contenedor/VentaTarjetaContenedor.js';

const router = Router();

/**
 * GET /listar
 * Lista todas las ventas con tarjeta
 * Query params: estado, clienteId, buscar, banco, fechaDesde, fechaHasta, orden
 */
router.get('/listar',
  authMiddleware(),
  (req, res) => ventaTarjetaControlador.listarVentasTarjeta(req, res)
);

/**
 * GET /:id
 * Obtiene detalle de una venta tarjeta específica
 */
router.get('/:id',
  authMiddleware(),
  (req, res) => ventaTarjetaControlador.obtenerVentaTarjeta(req, res)
);

/**
 * POST /:ventaTarjetaId/registrar-abono
 * Registra un abono del banco a una venta tarjeta
 * Body: { monto, fecha (opcional), observacion (opcional) }
 */
router.post('/:ventaTarjetaId/registrar-abono',
  authMiddleware(),
  (req, res) => ventaTarjetaControlador.registrarAbono(req, res)
);

/**
 * GET /:ventaTarjetaId/historial
 * Obtiene historial de abonos de una venta tarjeta
 */
router.get('/:ventaTarjetaId/historial',
  authMiddleware(),
  (req, res) => ventaTarjetaControlador.obtenerHistorialAbonos(req, res)
);

/**
 * GET /resumen/ventas
 * Obtiene resumen general de ventas tarjeta
 */
router.get('/resumen/ventas',
  authMiddleware(),
  (req, res) => ventaTarjetaControlador.resumenVentasTarjeta(req, res)
);

export default router;
