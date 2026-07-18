import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { ingresoControlador } from '../contenedor/IngresoContenedor.js';

const router = Router();

router.get('/', authMiddleware(), (req, res) => ingresoControlador.lista(req, res));
router.post('/', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.crear(req, res));
router.get('/lista', authMiddleware(), (req, res) => ingresoControlador.lista(req, res));
router.get('/buscar/:id', authMiddleware(), (req, res) => ingresoControlador.buscarPorId(req, res));
router.post('/crear', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.crear(req, res));
router.put('/editar', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.editar(req, res));
router.put('/finalizar', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.finalizar(req, res));
router.delete('/eliminar', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.eliminar(req, res));
router.post('/detalle/agregar', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.agregarDetalle(req, res));
router.put('/detalle/editar', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.editarDetalle(req, res));
router.delete('/detalle/eliminar', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.eliminarDetalle(req, res));
router.delete('/detalle/:id', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.eliminarDetalle(req, res));
router.put('/:id/finalizar', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.finalizar(req, res));
router.put('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.editar(req, res));
router.delete('/:id', authMiddleware('ADMINISTRADOR'), (req, res) => ingresoControlador.eliminar(req, res));
router.get('/:id', authMiddleware(), (req, res) => ingresoControlador.buscarPorId(req, res));

export default router;
