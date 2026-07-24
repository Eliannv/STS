// caja-servicio/src/infraestructura/rutas/moduloCajaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import {
  cajaBancoControlador,
  cajaChicaControlador,
  movimientoControlador,
} from '../contenedor/CajaContenedor.js';

const router = Router();

router.get('/cajas-banco', authMiddleware(), (req, res) => cajaBancoControlador.lista(req, res));
router.get('/cajas-banco/lista', authMiddleware(), (req, res) => cajaBancoControlador.lista(req, res));
router.get('/cajas-banco/abierta', authMiddleware(), (req, res) => cajaBancoControlador.cajaAbierta(req, res));
router.post('/cajas-banco/abrir', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.abrir(req, res));
router.post('/cajas-banco/movimiento', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.movimiento(req, res));
router.delete('/cajas-banco/movimiento/:id', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.eliminarMovimiento(req, res));
router.put('/cajas-banco/cerrar', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.cerrar(req, res));
router.get('/cajas-banco/buscar/:id', authMiddleware(), (req, res) => cajaBancoControlador.buscarPorId(req, res));
router.post('/cajas-banco/:id/cerrar', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.cerrar(req, res));
router.put('/cajas-banco/:id/cerrar', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.cerrar(req, res));
router.post('/cajas-banco/:id/movimientos', authMiddleware('ADMINISTRADOR'), (req, res) => cajaBancoControlador.movimiento(req, res));
router.get('/cajas-banco/:id/movimientos', authMiddleware(), (req, res) => cajaBancoControlador.listarMovimientos(req, res));
router.get('/cajas-banco/:id', authMiddleware(), (req, res) => cajaBancoControlador.buscarPorId(req, res));

router.get('/cajas-chicas', authMiddleware(), (req, res) => cajaChicaControlador.lista(req, res));
router.get('/cajas-chicas/lista', authMiddleware(), (req, res) => cajaChicaControlador.lista(req, res));
router.get('/cajas-chicas/abierta', authMiddleware(), (req, res) => cajaChicaControlador.cajaAbierta(req, res));
router.post('/cajas-chicas/abrir', authMiddleware(), (req, res) => cajaChicaControlador.abrir(req, res));
router.post('/cajas-chicas/movimiento', authMiddleware(), (req, res) => cajaChicaControlador.movimiento(req, res));
router.delete('/cajas-chicas/movimiento/:id', authMiddleware('ADMINISTRADOR'), (req, res) => cajaChicaControlador.eliminarMovimiento(req, res));
router.put('/cajas-chicas/cerrar', authMiddleware(), (req, res) => cajaChicaControlador.cerrar(req, res));
router.get('/cajas-chicas/buscar/:id', authMiddleware(), (req, res) => cajaChicaControlador.buscarPorId(req, res));
router.post('/cajas-chicas/:id/cerrar', authMiddleware(), (req, res) => cajaChicaControlador.cerrar(req, res));
router.put('/cajas-chicas/:id/cerrar', authMiddleware(), (req, res) => cajaChicaControlador.cerrar(req, res));
router.post('/cajas-chicas/:id/reponer', authMiddleware(), (req, res) => cajaChicaControlador.reponer(req, res));
router.post('/cajas-chicas/:id/devolver', authMiddleware(), (req, res) => cajaChicaControlador.devolver(req, res));
router.post('/cajas-chicas/:id/movimientos', authMiddleware(), (req, res) => cajaChicaControlador.movimiento(req, res));
router.get('/cajas-chicas/:id/movimientos', authMiddleware(), (req, res) => cajaChicaControlador.listarMovimientos(req, res));
router.get('/cajas-chicas/:id', authMiddleware(), (req, res) => cajaChicaControlador.buscarPorId(req, res));

router.get('/movimientos-financieros', authMiddleware(), (req, res) => movimientoControlador.listar(req, res));
router.post('/movimientos/:id/revertir', authMiddleware('ADMINISTRADOR'), (req, res) => movimientoControlador.revertir(req, res));

export default router;
