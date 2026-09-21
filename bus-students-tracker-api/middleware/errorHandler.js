/**
 * Global API Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error encountered in Transport Data Engine.';

  res.status(status).json({
    error: err.code || 'SERVER_ERROR',
    message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
