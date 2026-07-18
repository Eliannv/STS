export const timeMiddleware = (req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => console.log(`${req.traceId} ${Date.now() - inicio}ms`));
  next();
};
