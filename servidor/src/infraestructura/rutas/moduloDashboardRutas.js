// src/infraestructura/rutas/moduloDashboardRutas.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { dashboardControlador as c } from '../contenedor/DashboardContenedor.js';

const router = Router();

// GET /api/dashboard/resumen — KPIs consolidados para el dashboard
router.get('/resumen', authMiddleware(), c.resumen);

export default router;