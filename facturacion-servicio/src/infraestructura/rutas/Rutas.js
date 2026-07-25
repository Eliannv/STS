// facturacion-servicio/src/infraestructura/rutas/Rutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { guardaSucursal } from '../middleware/SucursalScopeMiddleware.js';
import { sucursalDeDetalleFactura, sucursalDeAbonoTarjeta } from '../middleware/resolversSucursal.js';
import { facturacionControlador } from '../contenedor/FacturacionContenedor.js';
import moduloFacturaRutas from './moduloFacturaRutas.js';
import moduloCobroDeudaRutas from './moduloCobroDeudaRutas.js';
import moduloVentaTarjetaRutas from './moduloVentaTarjetaRutas.js';
import moduloReporteInternoRutas from './moduloReporteInternoRutas.js';
const router = Router();
router.use('/facturacion/reportes', moduloReporteInternoRutas);
router.use('/facturas', moduloFacturaRutas);
router.use('/cobro-deuda', moduloCobroDeudaRutas);
router.use('/ventas-tarjeta', moduloVentaTarjetaRutas);
const recursos = ['detalle-facturas','deudas','abonos-tarjeta'];
for (const recurso of recursos) {
  router.get(`/${recurso}`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return facturacionControlador.lista(req, res); });
  // 'deudas' lleva sucursal_id propio; los otros dos la heredan de su documento padre.
  const guardaRecurso = recurso === 'detalle-facturas'
    ? guardaSucursal({ resolverPadre: sucursalDeDetalleFactura })
    : recurso === 'abonos-tarjeta'
      ? guardaSucursal({ resolverPadre: sucursalDeAbonoTarjeta })
      : guardaSucursal();
  router.get(`/${recurso}/:id`, authMiddleware(), guardaRecurso, (req, res) => { req.params.recurso = recurso; return facturacionControlador.buscar(req, res); });
  if (recurso === 'deudas') continue;
  router.post(`/${recurso}`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return facturacionControlador.crear(req, res); });
  router.put(`/${recurso}/:id`, authMiddleware(), (req, res) => { req.params.recurso = recurso; return facturacionControlador.editar(req, res); });
  router.delete(`/${recurso}/:id`, authMiddleware('ADMINISTRADOR'), (req, res) => { req.params.recurso = recurso; return facturacionControlador.eliminar(req, res); });
}
export default router;
