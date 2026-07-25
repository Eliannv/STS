import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { guardaSucursal } from '../middleware/SucursalScopeMiddleware.js';
import { sucursalDeCajaChica } from '../middleware/resolversSucursal.js';
import { cajaChicaControlador } from '../contenedor/CajaChicaContenedor.js';

const router = Router();
router.get('/', authMiddleware(), (req, res) => cajaChicaControlador.lista(req, res));
router.post('/abrir', authMiddleware(), (req, res) => cajaChicaControlador.abrir(req, res));
router.put('/cerrar', authMiddleware(), (req, res) => cajaChicaControlador.cerrar(req, res));
router.put('/:id/cerrar', authMiddleware(), (req, res) => cajaChicaControlador.cerrar(req, res));
router.get('/lista', authMiddleware(), (req, res) => cajaChicaControlador.lista(req, res));
router.get('/abierta', authMiddleware(), (req, res) => cajaChicaControlador.cajaAbierta(req, res));
router.get('/buscar/:id', authMiddleware(), guardaSucursal(), (req, res) => cajaChicaControlador.buscarPorId(req, res));
router.post('/movimiento', authMiddleware(), (req, res) => cajaChicaControlador.movimiento(req, res));
router.post('/:id/movimientos', authMiddleware(), (req, res) => cajaChicaControlador.movimiento(req, res));
router.delete('/movimiento/:id', authMiddleware('ADMINISTRADOR'), (req, res) => cajaChicaControlador.eliminarMovimiento(req, res));
router.get('/:id/movimientos', authMiddleware(), guardaSucursal({ resolverPadre: sucursalDeCajaChica }), (req, res) => cajaChicaControlador.listarMovimientos(req, res));
router.get('/:id', authMiddleware(), guardaSucursal(), (req, res) => cajaChicaControlador.buscarPorId(req, res));

export default router;
