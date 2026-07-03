// src/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import pool from './infraestructura/base-dato/Postgresql.js';

/* ── Migraciones automáticas ── */
async function ejecutarMigraciones() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Migración 1: historial_clinico_id
        try {
            await client.query(`ALTER TABLE facturas ADD COLUMN IF NOT EXISTS historial_clinico_id INTEGER`);
        } catch (e) {
            console.warn('Columna historial_clinico_id:', e.message);
        }

        // Migración 2: fecha_pago
        try {
            await client.query(`ALTER TABLE facturas ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMPTZ`);
        } catch (e) {
            console.warn('Columna fecha_pago:', e.message);
        }

        // Migración 3: items
        try {
            await client.query(`ALTER TABLE facturas ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'`);
        } catch (e) {
            console.warn('Columna items:', e.message);
        }

        // Migración 4: venta_id en movimientos_cajas_banco
        try {
            await client.query(`
        ALTER TABLE movimientos_cajas_banco 
        ADD COLUMN IF NOT EXISTS venta_id INTEGER 
        REFERENCES facturas(id) ON DELETE SET NULL
      `);
        } catch (e) {
            console.warn('Columna venta_id:', e.message);
        }

        await client.query('COMMIT');
        console.log('Todas las migraciones completadas');
    } catch (e) {
        await client.query('ROLLBACK');
        console.warn('Error en migraciones:', e.message);
    } finally {
        client.release();
    }
}

// Ejecutar migraciones con manejo de errores
ejecutarMigraciones().catch(err => {
    console.error('Fallo crítico en migraciones:', err.message);
    // No hacer crash, continuar
});

import { traceMiddleWare } from './infraestructura/middleware/TraceMiddleware.js';
import { timeMiddleware } from './infraestructura/middleware/TimeMiddleware.js';
import { loggerMiddleware } from './infraestructura/middleware/LoggerMiddleware.js';

// ── Rutas por módulo (se agregan aquí a medida que se implementan) ──
import usuarioRutas from './infraestructura/rutas/moduloUsuarioRutas.js';
import sucursalRutas from './infraestructura/rutas/moduloSucursalRutas.js';
import clienteRutas from './infraestructura/rutas/moduloClienteRutas.js';
import historialClinicoRutas from './infraestructura/rutas/moduloHistorialClinicoRutas.js';
import proveedorRutas from './infraestructura/rutas/moduloProveedorRutas.js';
import productoRutas from './infraestructura/rutas/moduloProductoRutas.js';
import ingresoRutas from './infraestructura/rutas/moduloIngresoRutas.js';
import facturaRutas from './infraestructura/rutas/moduloFacturaRutas.js';
import cobroDeudaRutas from './infraestructura/rutas/moduloCobroDeudaRutas.js';
import cajaChicaRutas from './infraestructura/rutas/moduloCajaChicaRutas.js';
import cajaBancoRutas from './infraestructura/rutas/moduloCajaBancoRutas.js';
import empleadoMetricasRutas from './infraestructura/rutas/moduloEmpleadoMetricasRutas.js';
import dashboardRutas from './infraestructura/rutas/moduloDashboardRutas.js';

const app = express();
app.use(cors());
app.use(express.json());

// ── Contrato OpenAPI — Swagger UI ────────────────────────────────────────
const contratoPath = './src/infraestructura/contrato-api/api-v1.yaml';
const swaggerDoc = YAML.load(contratoPath);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customSiteTitle: 'STS API — Óptica Macías',
    swaggerOptions: { persistAuthorization: true },
}));

// ── Middlewares globales ──────────────────────────────────────────────────
app.use(traceMiddleWare);
app.use(timeMiddleware);
app.use(loggerMiddleware);


// ── Módulos de la API ────────────────────────────────────────────────────
app.use('/api/usuario', usuarioRutas);
app.use('/api/sucursal', sucursalRutas);
app.use('/api/cliente', clienteRutas);
app.use('/api/historial-clinico', historialClinicoRutas);
app.use('/api/proveedor', proveedorRutas);
app.use('/api/producto', productoRutas);
app.use('/api/ingreso', ingresoRutas);
app.use('/api/factura', facturaRutas);
app.use('/api/cobro-deuda', cobroDeudaRutas);
app.use('/api/caja-chica', cajaChicaRutas);
app.use('/api/caja-banco', cajaBancoRutas);
app.use('/api/empleado-metricas', empleadoMetricasRutas);
app.use('/api/dashboard', dashboardRutas);

// Health check
app.get('/api/health', (_req, res) => {
    res.status(200).json({ estado: 'ok', mensaje: 'API Óptica Macías funcionando' });
});

// ── Manejador de errores de validación OpenAPI ───────────────────────────
app.use((err, req, res, next) => {
    if (err.status && err.errors) {
        return res.status(err.status).json({
            estado: 'error',
            mensaje: err.message,
            errores: err.errors,
            traceId: req.traceId,
        });
    }
    next(err);
});

// ── Manejador de errores general ─────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('Error no controlado:', err.message);
    res.status(500).json({
        estado: 'error',
        mensaje: 'Error interno del servidor',
        traceId: req.traceId,
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Óptica Macías corriendo en puerto ${PORT}`);
    console.log(`Documentación API: http://localhost:${PORT}/api/docs`);
});