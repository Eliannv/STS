// src/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './infraestructura/base-dato/Postgresql.js';

/* ── Migraciones automáticas ── */
async function ejecutarMigraciones() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE facturas ADD COLUMN IF NOT EXISTS historial_clinico_id INTEGER`);
    await client.query(`ALTER TABLE facturas ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMPTZ`);
    console.log('✅ Migraciones de facturas OK');
  } catch (e) {
    console.warn('⚠ Migración facturas omitida:', e.message);
  } finally {
    client.release();
  }
}
ejecutarMigraciones();

import { traceMiddleWare } from './infraestructura/middleware/TraceMiddleware.js';
import { timeMiddleware }  from './infraestructura/middleware/TimeMiddleware.js';
import { loggerMiddleware } from './infraestructura/middleware/LoggerMiddleware.js';

// ── Rutas por módulo (se agregan aquí a medida que se implementan) ──
import usuarioRutas  from './infraestructura/rutas/moduloUsuarioRutas.js';
import sucursalRutas from './infraestructura/rutas/moduloSucursalRutas.js';
import clienteRutas          from './infraestructura/rutas/moduloClienteRutas.js';
import historialClinicoRutas from './infraestructura/rutas/moduloHistorialClinicoRutas.js';
import proveedorRutas        from './infraestructura/rutas/moduloProveedorRutas.js';
import productoRutas         from './infraestructura/rutas/moduloProductoRutas.js';
import ingresoRutas          from './infraestructura/rutas/moduloIngresoRutas.js';
import facturaRutas          from './infraestructura/rutas/moduloFacturaRutas.js';
import cajaChicaRutas        from './infraestructura/rutas/moduloCajaChicaRutas.js';
import cajaBancoRutas        from './infraestructura/rutas/moduloCajaBancoRutas.js';

const app = express();
app.use(cors());
app.use(express.json());

// Middlewares globales
app.use(traceMiddleWare);
app.use(timeMiddleware);
app.use(loggerMiddleware);

// ── Módulos de la API ──
app.use('/api/usuario',  usuarioRutas);
app.use('/api/sucursal', sucursalRutas);
app.use('/api/cliente',          clienteRutas);
app.use('/api/historial-clinico', historialClinicoRutas);
app.use('/api/proveedor',         proveedorRutas);
app.use('/api/producto',          productoRutas);
app.use('/api/ingreso',           ingresoRutas);
app.use('/api/factura',            facturaRutas);
app.use('/api/caja-chica',        cajaChicaRutas);
app.use('/api/caja-banco',        cajaBancoRutas);

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ estado: 'ok', mensaje: 'API Óptica Macías funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Óptica Macías corriendo en puerto ${PORT}`);
});
