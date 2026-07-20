import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rutas from './infraestructura/rutas/Rutas.js';
import { reportesSalida } from './infraestructura/contenedor/ReportesContenedor.js';
import { traceMiddleware } from './infraestructura/middleware/TraceMiddleware.js';
import { loggerMiddleware } from './infraestructura/middleware/LoggerMiddleware.js';

const app = express();
const port = Number(process.env.PORT || 3006);
app.use(cors());
app.use(express.json());
app.use(traceMiddleware, loggerMiddleware);
app.get('/health', async (req, res) => res.json({ estado: 'ok', servicio: 'reportes-servicio', baseDatos: 'no requerida', servicios: await reportesSalida.salud(), traceId: req.traceId }));
app.use('/api/v1/reportes', rutas);
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ success: false, report: null, error: { message: 'Error interno del servicio de reportes' }, traceId: req.traceId }); });
app.listen(port, () => console.log(`reportes-servicio escuchando en ${port}`));
