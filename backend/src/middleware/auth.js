const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: verify access token from cookie (HTTP-only) or Authorization header.
 * Cookies are PRIMARY (secure). Header is FALLBACK for mobile only.
 * Attaches req.user on success.
 */
const protect = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    
    // Fallback: SOLO si no hay cookie, intenta header (para móvil)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
        console.log('🔐 Token obtenido del header Authorization (fallback móvil)');
      }
    } else {
      console.log('🔐 Token obtenido de cookie HTTP-only (seguro)');
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No autorizado. Token requerido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo.' });
    }

    req.user = user;
    console.log('✅ Usuario autenticado:', user.email);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.', code: 'TOKEN_EXPIRED' });
    }
    console.error('❌ Error en protect:', error.message);
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
 * Middleware: optionally attach user if token present in cookie or Authorization header (non-blocking).
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    
    // Fallback: intenta obtener del header Authorization
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
        console.log('🔑 optionalAuth: ✅ Token en Authorization header');
      }
    } else {
      console.log('🔑 optionalAuth: ✅ Token en cookie');
    }
    
    if (!token) {
      console.log('⚠️  optionalAuth: Sin token, continuando como guest');
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    console.log('👤 Usuario encontrado:', user ? user.email : 'NO ENCONTRADO');
    
    if (user && user.isActive) {
      req.user = user;
      console.log('✅ req.user asignado:', user.email);
    } else {
      console.log('❌ Usuario no activo o no encontrado');
    }
  } catch (err) {
    console.error('❌ Error en optionalAuth:', err.message);
    // token invalid/expired - continue as guest
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
