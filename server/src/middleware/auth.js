const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware - verifies JWT and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('+passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

/**
 * Authorization middleware - checks if user has required permission
 */
const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const hasPermission = permissions.some(p => req.user.hasPermission(p));
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

/**
 * Role-based middleware - checks if user has one of the required roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role privileges.' });
    }

    next();
  };
};

module.exports = { authenticate, authorize, requireRole };
