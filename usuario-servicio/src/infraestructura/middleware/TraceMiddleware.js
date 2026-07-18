import { randomUUID } from 'crypto';

export const traceMiddleware = (req, res, next) => {
  req.traceId = randomUUID();
  res.setHeader('X-Trace-Id', req.traceId);
  next();
};
