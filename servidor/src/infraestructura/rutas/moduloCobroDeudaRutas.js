// src/infraestructura/rutas/moduloCobroDeudaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { cobroDeudaControlador } from '../contenedor/CobroDeudaContenedor.js';

const router = Router();

/**
 * POST /registrar-abono
 * Registra un nuevo abono/pago parcial a una factura
 */
router.post('/registrar-abono',
  authMiddleware(),
  (req, res) => cobroDeudaControlador.registrarAbono(req, res)
);

/**
 * GET /facturas-pendientes
 * Lista facturas pendientes con filtros opcionales
 * Query params: clienteId, buscar, fechaDesde, fechaHasta
 */
router.get('/facturas-pendientes',
  authMiddleware(),
  (req, res) => cobroDeudaControlador.facturasPendientes(req, res)
);

/**
 * GET /facturas/:facturaId/abonos
 * Lista todos los abonos de una factura específica
 */
router.get('/facturas/:facturaId/abonos',
  authMiddleware(),
  (req, res) => cobroDeudaControlador.abonosPorFactura(req, res)
);

/**
 * GET /abonos/:abonoId
 * Obtiene detalles de un abono específico
 */
router.get('/abonos/:abonoId',
  authMiddleware(),
  (req, res) => cobroDeudaControlador.obtenerAbono(req, res)
);

/**
 * GET /cliente/:clienteId/resumen
 * Obtiene resumen de deuda de un cliente
 */
router.get('/cliente/:clienteId/resumen',
  authMiddleware(),
  (req, res) => cobroDeudaControlador.resumenDeuda(req, res)
);

/**
 * GET /lista-abonos
 * Lista general de abonos con filtros
 * Query params: clienteId, fechaDesde, fechaHasta, metodoPago, buscar
 */
router.get('/lista-abonos',
  authMiddleware(),
  (req, res) => cobroDeudaControlador.listaAbonos(req, res)
);

/**
 * GET /deudas-pagina
 * Lista deudas pendientes paginadas (para carga inicial)
 * Query params: pagina (default 0), limite (default 5)
 */
router.get('/deudas-pagina',
  authMiddleware(),
  (req, res) => cobroDeudaControlador.deudasPaginadas(req, res)
);

export default router;
