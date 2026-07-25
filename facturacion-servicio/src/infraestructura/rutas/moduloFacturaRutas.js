// facturacion-servicio/src/infraestructura/rutas/moduloFacturaRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { guardaSucursal } from '../middleware/SucursalScopeMiddleware.js';
import { facturaControlador } from '../contenedor/FacturaContenedor.js';

const router = Router();
router.get('/', authMiddleware(), (req, res) => facturaControlador.listaGeneral(req, res));
router.post('/', authMiddleware(), (req, res) => facturaControlador.crear(req, res));
router.get('/lista', authMiddleware(), (req, res) => facturaControlador.listaGeneral(req, res));
router.get('/cliente/:clienteId', authMiddleware(), guardaSucursal(), (req, res) => facturaControlador.listaPorCliente(req, res));
router.get('/resumen/:clienteId', authMiddleware(), (req, res) => facturaControlador.resumenPorCliente(req, res));
router.get('/buscar/:id', authMiddleware(), guardaSucursal(), (req, res) => facturaControlador.buscarPorId(req, res));
router.post('/crear', authMiddleware(), (req, res) => facturaControlador.crear(req, res));
router.put('/editar', authMiddleware(), (req, res) => facturaControlador.editar(req, res));
router.put('/cobrar/:id', authMiddleware(), (req, res) => res.status(410).json({
  estado: 'error',
  resultado: 'Ruta obsoleta. Utilice Cuentas por Cobrar.',
  traceId: req.traceId,
}));
router.put('/anular/:id', authMiddleware('ADMINISTRADOR'), (req, res) => facturaControlador.anular(req, res));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), (req, res) => facturaControlador.eliminar(req, res));
router.get('/:id', authMiddleware(), guardaSucursal(), (req, res) => facturaControlador.buscarPorId(req, res));
router.put('/:id', authMiddleware(), (req, res) => facturaControlador.editar(req, res));
export default router;
