import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { ventaTarjetaControlador } from '../contenedor/VentaTarjetaContenedor.js';

const router = Router();
router.get('/listar', authMiddleware(), (req, res) => ventaTarjetaControlador.listarVentasTarjeta(req, res));
router.get('/resumen/ventas', authMiddleware(), (req, res) => ventaTarjetaControlador.resumenVentasTarjeta(req, res));
router.get('/:ventaTarjetaId/historial', authMiddleware(), (req, res) => ventaTarjetaControlador.obtenerHistorialAbonos(req, res));
router.post('/:ventaTarjetaId/registrar-abono', authMiddleware(), (req, res) => ventaTarjetaControlador.registrarAbono(req, res));
router.get('/:id', authMiddleware(), (req, res) => ventaTarjetaControlador.obtenerVentaTarjeta(req, res));
export default router;
