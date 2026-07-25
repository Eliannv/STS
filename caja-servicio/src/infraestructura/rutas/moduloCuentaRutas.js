// caja-servicio/src/infraestructura/rutas/moduloCuentaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { guardaSucursal } from '../middleware/SucursalScopeMiddleware.js';
import { sucursalDeCuenta } from '../middleware/resolversSucursal.js';
import { cuentaControlador } from '../contenedor/CuentaContenedor.js';
import { operacionControlador } from '../contenedor/CajaContenedor.js';

const router = Router();
router.get('/', authMiddleware(), (req, res) => cuentaControlador.lista(req, res));
router.get('/:id', authMiddleware(), guardaSucursal(), (req, res) => cuentaControlador.buscarPorId(req, res));
router.get('/:id/movimientos', authMiddleware(), guardaSucursal({ resolverPadre: sucursalDeCuenta }), (req, res) => cuentaControlador.movimientos(req, res));
router.post('/pagar', authMiddleware('ADMINISTRADOR'), (req, res) => operacionControlador.crearCuentaPagar(req, res));
router.post('/:id/pagos', authMiddleware('ADMINISTRADOR'), (req, res) => operacionControlador.procesarPagoProveedor(req, res));
router.post('/', authMiddleware('ADMINISTRADOR'), (req, res) => cuentaControlador.crear(req, res));
router.put('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => cuentaControlador.editar(req, res));
router.put('/:id/cancelar', authMiddleware('ADMINISTRADOR'), (req, res) => cuentaControlador.cancelar(req, res));
export default router;
