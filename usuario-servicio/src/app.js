import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import sequelize from './infraestructura/base-dato/Postgresql.js';
import usuarioRutas from './infraestructura/rutas/moduloUsuarioRutas.js';
import sucursalRutas from './infraestructura/rutas/moduloSucursalRutas.js';
import { traceMiddleware } from './infraestructura/middleware/TraceMiddleware.js';
import { loggerMiddleware } from './infraestructura/middleware/LoggerMiddleware.js';
import { timeMiddleware } from './infraestructura/middleware/TimeMiddleware.js';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());
app.use(traceMiddleware);
app.use(loggerMiddleware);
app.use(timeMiddleware);

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ estado: 'ok', servicio: 'usuario-servicio', baseDatos: 'ok', traceId: req.traceId });
  } catch {
    res.status(503).json({ estado: 'error', servicio: 'usuario-servicio', baseDatos: 'error', traceId: req.traceId });
  }
});

app.use('/api/v1/usuarios', usuarioRutas);
app.use('/api/v1/sucursales', sucursalRutas);
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ estado: 'error', mensaje: 'Error interno del servicio', traceId: req.traceId });
});

const iniciar = async () => {
  await sequelize.authenticate();
  app.listen(port, () => console.log(`usuario-servicio escuchando en ${port}`));
};

iniciar().catch((error) => {
  console.error('No se pudo iniciar usuario-servicio:', error.message);
  process.exit(1);
});
