const { authenticate, requireRole } = require('./authMiddleware');

module.exports = {
  authenticateJWT: authenticate,
  authorize: requireRole,
  authenticate,
  requireRole
};
