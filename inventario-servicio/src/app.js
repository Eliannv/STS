import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import sequelize from './infraestructura/base-dato/Postgresql.js';
import rutas from './infraestructura/rutas/Rutas.js';
import { traceMiddleware } from './infraestructura/middleware/TraceMiddleware.js';
import { loggerMiddleware } from './infraestructura/middleware/LoggerMiddleware.js';

const app = express();
const port = Number(process.env.PORT || 3003);
app.use(cors());
app.use(express.json());
app.use(traceMiddleware, loggerMiddleware);
app.get('/health', async (req, res) => { try { await sequelize.authenticate(); res.json({ estado: 'ok', servicio: 'inventario-servicio', baseDatos: 'ok', traceId: req.traceId }); } catch { res.status(503).json({ estado: 'error', servicio: 'inventario-servicio', baseDatos: 'error', traceId: req.traceId }); } });
app.use('/api/v1', rutas);
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ estado: 'error', mensaje: 'Error interno del servicio', traceId: req.traceId }); });
sequelize.authenticate().then(() => app.listen(port, () => console.log(`inventario-servicio escuchando en ${port}`))).catch((error) => { console.error('No se pudo iniciar inventario-servicio:', error.message); process.exit(1); });
