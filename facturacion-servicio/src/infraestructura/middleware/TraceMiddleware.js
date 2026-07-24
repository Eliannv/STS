// facturacion-servicio/src/infraestructura/middleware/TraceMiddleware.js
import { randomUUID } from 'node:crypto';

export const traceMiddleware = (req, res, next) => {
  req.traceId = req.get('X-Trace-Id') || randomUUID();
  res.setHeader('X-Trace-Id', req.traceId);
  next();
};
