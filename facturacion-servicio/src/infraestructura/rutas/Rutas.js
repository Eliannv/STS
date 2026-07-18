import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { facturacionControlador } from '../contenedor/FacturacionContenedor.js';
import moduloFacturaRutas from './moduloFacturaRutas.js';
import moduloCobroDeudaRutas from './moduloCobroDeudaRutas.js';
import moduloVentaTarjetaRutas from './moduloVentaTarjetaRutas.js';
const router = Router();
router.use('/facturas', moduloFacturaRutas);
router.use('/cobro-deuda', moduloCobroDeudaRutas);
router.use('/ventas-tarjeta', moduloVentaTarjetaRutas);
const recursos = ['detalle-facturas','deudas','abonos-tarjeta'];
for (const recurso of recursos) {
  router.get(`/${recurso}`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return facturacionControlador.lista(req, res); });
  router.get(`/${recurso}/:id`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return facturacionControlador.buscar(req, res); });
  router.post(`/${recurso}`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return facturacionControlador.crear(req, res); });
  router.put(`/${recurso}/:id`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return facturacionControlador.editar(req, res); });
  router.delete(`/${recurso}/:id`, authMiddleware('ADMINISTRADOR'), (req, res) => { req.params.recurso = recurso; return facturacionControlador.eliminar(req, res); });
}
export default router;
