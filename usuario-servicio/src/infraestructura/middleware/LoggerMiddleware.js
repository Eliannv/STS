export const loggerMiddleware = (req, res, next) => {
  console.log(`${req.traceId} ${req.method} ${req.originalUrl}`);
  next();
};
