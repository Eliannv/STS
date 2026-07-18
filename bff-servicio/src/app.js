import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import bffRutas from './infraestructura/rutas/BffRutas.js';
import { bffControlador } from './infraestructura/contenedor/BffContenedor.js';
import { traceMiddleware } from './infraestructura/middleware/TraceMiddleware.js';
import { loggerMiddleware } from './infraestructura/middleware/LoggerMiddleware.js';

const app = express();
const port = Number(process.env.PORT || 3000);
app.use(cors());
app.use(express.json());
app.use(traceMiddleware, loggerMiddleware);
app.get('/health', bffControlador.health.bind(bffControlador));
app.use('/api/v1', bffRutas);
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ estado: 'error', mensaje: 'Error interno del gateway', traceId: req.traceId }); });
app.listen(port, () => console.log(`bff-servicio escuchando en ${port}`));
