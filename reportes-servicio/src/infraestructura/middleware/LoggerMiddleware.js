export const loggerMiddleware = (req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => console.log(`${req.traceId} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - inicio}ms`));
  next();
};
