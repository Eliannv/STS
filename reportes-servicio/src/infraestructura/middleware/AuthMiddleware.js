import jwt from 'jsonwebtoken';

export const authMiddleware = () => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, report: null, error: { message: 'Token no proporcionado' }, traceId: req.traceId });
  }

  try {
    req.usuario = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, report: null, error: { message: 'Token inválido o expirado' }, traceId: req.traceId });
  }
};
