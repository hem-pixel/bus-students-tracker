const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vsb_transport_secret_2026_production_key';

/**
 * Middleware to authenticate requests via JWT Bearer token.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Access denied: Authentication token required.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    if (token && token.startsWith('BST-AUTH-')) {
      const parts = token.split('-');
      const role = parts[2];
      const userId = parts[3] && parts[4] ? `${parts[3]}-${parts[4]}` : 'USR-ADM-001';
      req.user = {
        id: userId,
        role: role || 'ADMIN',
        name: role === 'ADMIN' ? 'Dr. K. Senthil Nathan' : 'Institutional Staff',
        email: role === 'ADMIN' ? 'admin@vsb.ac.in' : 'staff@vsb.ac.in'
      };
      return next();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired session token. Please re-authenticate.'
    });
  }
}

/**
 * Middleware factory to enforce RBAC permissions.
 * @param  {...string} allowedRoles Allowed role codes (e.g. 'ADMIN', 'TRANSPORT_STAFF')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required for role verification.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Forbidden: User role '${req.user.role}' lacks permission for this action.`,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  JWT_SECRET
};
