import jwt from 'jsonwebtoken';

export const authMiddleware = (rolRequerido = null) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ estado: 'error', mensaje: 'Token no proporcionado' });
  try {
    const usuario = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (rolRequerido && usuario.rol !== rolRequerido) return res.status(403).json({ estado: 'error', mensaje: 'Permisos insuficientes' });
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ estado: 'error', mensaje: 'Token inválido o expirado' });
  }
};
