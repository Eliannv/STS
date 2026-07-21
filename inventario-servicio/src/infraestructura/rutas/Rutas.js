import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { inventarioControlador } from '../contenedor/InventarioContenedor.js';
import moduloProductoRutas from './moduloProductoRutas.js';
import moduloProveedorRutas from './moduloProveedorRutas.js';
import moduloIngresoRutas from './moduloIngresoRutas.js';
import moduloMovimientoStockRutas from './moduloMovimientoStockRutas.js';

const router = Router();
const lectura = ['catalogo', 'detalle-ingresos', 'egresos', 'detalle-egresos'];
const escritura = ['catalogo', 'detalle-ingresos', 'egresos', 'detalle-egresos'];

router.use('/productos', moduloProductoRutas);
router.use('/proveedores', moduloProveedorRutas);
router.use('/ingresos', moduloIngresoRutas);
router.use('/movimientos', moduloMovimientoStockRutas);

for (const recurso of lectura) {
  router.get(`/${recurso}`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return inventarioControlador.lista(req, res); });
  router.get(`/${recurso}/:id`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return inventarioControlador.buscar(req, res); });
}
for (const recurso of escritura) {
  router.post(`/${recurso}`, authMiddleware('ADMINISTRADOR'), (req, res) => { req.params.recurso = recurso; return inventarioControlador.crear(req, res); });
  router.put(`/${recurso}/:id`, authMiddleware('ADMINISTRADOR'), (req, res) => { req.params.recurso = recurso; return inventarioControlador.editar(req, res); });
  router.delete(`/${recurso}/:id`, authMiddleware('ADMINISTRADOR'), (req, res) => { req.params.recurso = recurso; return inventarioControlador.eliminar(req, res); });
}
export default router;
