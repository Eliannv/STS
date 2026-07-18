import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { facturaControlador } from '../contenedor/FacturaContenedor.js';

const router = Router();
router.get('/', authMiddleware(), (req, res) => facturaControlador.listaGeneral(req, res));
router.post('/', authMiddleware(), (req, res) => facturaControlador.crear(req, res));
router.get('/lista', authMiddleware(), (req, res) => facturaControlador.listaGeneral(req, res));
router.get('/cliente/:clienteId', authMiddleware(), (req, res) => facturaControlador.listaPorCliente(req, res));
router.get('/resumen/:clienteId', authMiddleware(), (req, res) => facturaControlador.resumenPorCliente(req, res));
router.get('/buscar/:id', authMiddleware(), (req, res) => facturaControlador.buscarPorId(req, res));
router.post('/crear', authMiddleware(), (req, res) => facturaControlador.crear(req, res));
router.put('/editar', authMiddleware(), (req, res) => facturaControlador.editar(req, res));
router.put('/cobrar/:id', authMiddleware(), (req, res) => facturaControlador.cobrar(req, res));
router.put('/anular/:id', authMiddleware('ADMINISTRADOR'), (req, res) => facturaControlador.anular(req, res));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), (req, res) => facturaControlador.eliminar(req, res));
router.get('/:id', authMiddleware(), (req, res) => facturaControlador.buscarPorId(req, res));
router.put('/:id', authMiddleware(), (req, res) => facturaControlador.editar(req, res));
export default router;
