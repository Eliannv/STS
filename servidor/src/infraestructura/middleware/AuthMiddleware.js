// src/infraestructura/middleware/AuthMiddleware.js
import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación JWT.
 * @param {string|null} rolRequerido - 'ADMINISTRADOR' | 'OPERADOR' | null (cualquier rol válido)
 */
export const authMiddleware = (rolRequerido = null) => (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      estado: 'error',
      mensaje: 'Token de acceso no proporcionado'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;

    if (rolRequerido && decoded.rol !== rolRequerido) {
      return res.status(403).json({
        estado: 'error',
        mensaje: 'No tiene permisos suficientes para esta operación'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      estado: 'error',
      mensaje: 'Token inválido o expirado'
    });
  }
};
