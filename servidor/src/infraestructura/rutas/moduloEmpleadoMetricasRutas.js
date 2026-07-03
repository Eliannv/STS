// src/infraestructura/rutas/moduloEmpleadoMetricasRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { empleadoMetricasControlador as c } from '../contenedor/EmpleadoMetricasContenedor.js';

const router = Router();

// GET /api/empleado-metricas/resumen?mes=7&anio=2026
router.get('/resumen', authMiddleware('ADMINISTRADOR'), c.resumen);

// GET /api/empleado-metricas/detalle/:usuarioId?mes=7&anio=2026
router.get('/detalle/:usuarioId', authMiddleware('ADMINISTRADOR'), c.detalle);

// GET /api/empleado-metricas/historial/:usuarioId?meses=6
router.get('/historial/:usuarioId', authMiddleware('ADMINISTRADOR'), c.historial);

export default router;