// caja-servicio/src/infraestructura/rutas/moduloOperacionRutas.js
import { Router } from 'express';
import {
  movimientoControlador,
  operacionControlador,
} from '../contenedor/CajaContenedor.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = Router();

router.post('/ventas', (req, res) => operacionControlador.procesarVenta(req, res));
router.post('/cobros', (req, res) => operacionControlador.procesarCobro(req, res));
router.post('/anulaciones', (req, res) => operacionControlador.procesarAnulacion(req, res));
router.post('/acreditaciones-tarjeta', (req, res) => (
  operacionControlador.procesarAcreditacionTarjeta(req, res)
));
router.post('/compras', (req, res) => (
  operacionControlador.procesarCompra(req, res)
));
router.post('/anulaciones-compras', (req, res) => (
  operacionControlador.procesarAnulacionCompra(req, res)
));
router.post(
  '/ajustes',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => operacionControlador.procesarAjuste(req, res),
);
router.post(
  '/movimientos/:id/revertir',
  authMiddleware('ADMINISTRADOR'),
  (req, res) => movimientoControlador.revertir(req, res),
);

export default router;
