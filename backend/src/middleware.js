// Wraps async route handlers so errors flow into Express error middleware
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Standard error middleware
export function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const isMysqlError = err.sqlState !== undefined;

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(isMysqlError && { sqlState: err.sqlState, code: err.code }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

// 404 handler
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
