// inventario-servicio/src/infraestructura/rutas/moduloEgresoRutas.js
import { Router } from 'express';
import { egresoMercaderiaControlador } from '../contenedor/InventarioContenedor.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = Router();
const admin = authMiddleware('ADMINISTRADOR');

router.post('/', admin, (req, res) =>
  egresoMercaderiaControlador.crearEgreso(req, res));
router.get('/', authMiddleware(), (req, res) =>
  egresoMercaderiaControlador.obtenerEgresos(req, res));
router.get('/:id/movimientos', authMiddleware(), (req, res) =>
  egresoMercaderiaControlador.obtenerMovimientos(req, res));
router.post('/:id/detalles', admin, (req, res) =>
  egresoMercaderiaControlador.agregarDetalle(req, res));
router.delete('/:id/detalles/:detalleId', admin, (req, res) =>
  egresoMercaderiaControlador.eliminarDetalle(req, res));
router.post('/:id/confirmar', admin, (req, res) =>
  egresoMercaderiaControlador.confirmarEgreso(req, res));
router.post('/:id/anular', admin, (req, res) =>
  egresoMercaderiaControlador.anularEgreso(req, res));
router.post('/:id/descartar', admin, (req, res) =>
  egresoMercaderiaControlador.descartarEgreso(req, res));
router.get('/:id', authMiddleware(), (req, res) =>
  egresoMercaderiaControlador.obtenerEgresoPorId(req, res));

export default router;
