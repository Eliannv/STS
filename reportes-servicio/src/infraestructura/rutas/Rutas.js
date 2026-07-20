import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { reportesControlador } from '../contenedor/ReportesContenedor.js';

const router = Router();
const lectura = authMiddleware();
const ejecutar = (nombre, transformar = (req) => req.query, contrato = 'estandar') => (req, res) => reportesControlador.ejecutar(req, res, nombre, transformar(req), contrato);

router.get('/kardex/producto/:codigo', lectura, ejecutar('kardexProducto', (req) => ({ ...req.query, codigo: req.params.codigo })));
router.get('/kardex/fecha', lectura, ejecutar('kardexFecha'));
router.get('/inventario/actual', lectura, ejecutar('inventarioActual'));
router.get('/inventario/valorizado', lectura, ejecutar('inventarioValorizado'));
router.get('/inventario/sin-stock', lectura, ejecutar('productosSinStock'));
router.get('/inventario/stock-minimo', lectura, ejecutar('productosStockMinimo'));
router.get('/ventas/mas-vendidos', lectura, ejecutar('productosMasVendidos'));
router.get('/ventas/menos-vendidos', lectura, ejecutar('productosMenosVendidos'));
router.get('/compras/proveedor', lectura, ejecutar('comprasPorProveedor'));
router.get('/ingresos/mercaderia', lectura, ejecutar('ingresosMercaderia'));
router.get('/egresos/mercaderia', lectura, ejecutar('egresosMercaderia'));
router.get('/ventas/general', lectura, ejecutar('ventasGenerales', (req) => req.query, 'estandar'));
router.get('/ventas/fecha', lectura, ejecutar('ventasPorFecha'));
router.get('/ventas/sucursal', lectura, ejecutar('ventasPorSucursal'));
router.get('/ventas/usuario', lectura, ejecutar('ventasPorUsuario'));
router.get('/ventas/cliente', lectura, ejecutar('ventasPorCliente'));
router.get('/utilidad/ventas', lectura, ejecutar('utilidadVentas'));
router.get('/caja/flujo', lectura, ejecutar('flujoCaja'));
router.get('/cuentas-cobrar/estado', lectura, ejecutar('estadoCuentasCobrar'));
router.get('/dashboard/indicadores', lectura, ejecutar('dashboardIndicadores'));

export default router;
