import { randomUUID } from 'node:crypto';

export const traceMiddleware = (req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || randomUUID();
  res.setHeader('X-Trace-Id', req.traceId);
  next();
};
