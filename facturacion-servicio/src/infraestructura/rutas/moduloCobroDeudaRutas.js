import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { cobroDeudaControlador } from '../contenedor/CobroDeudaContenedor.js';

const router = Router();
router.post('/registrar-abono', authMiddleware(), (req, res) => cobroDeudaControlador.registrarAbono(req, res));
router.get('/facturas-pendientes', authMiddleware(), (req, res) => cobroDeudaControlador.facturasPendientes(req, res));
router.get('/facturas/:facturaId/abonos', authMiddleware(), (req, res) => cobroDeudaControlador.abonosPorFactura(req, res));
router.get('/abonos/:abonoId', authMiddleware(), (req, res) => cobroDeudaControlador.obtenerAbono(req, res));
router.get('/cliente/:clienteId/resumen', authMiddleware(), (req, res) => cobroDeudaControlador.resumenDeuda(req, res));
router.get('/lista-abonos', authMiddleware(), (req, res) => cobroDeudaControlador.listaAbonos(req, res));
router.get('/deudas-pagina', authMiddleware(), (req, res) => cobroDeudaControlador.deudasPaginadas(req, res));
export default router;
