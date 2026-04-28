const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: verify access token from Authorization header.
 * Attaches req.user on success.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado. Token requerido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

/**
 * Middleware: protect + admin role required.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
};

/**
 * Middleware: optionally attach user if token present (non-blocking).
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) req.user = user;
  } catch (_) {
    // token invalid/expired - continue as guest
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
