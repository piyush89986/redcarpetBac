// ==============================================================================
// Service-to-Service Machine Authentication Middleware — RedCarpet Backend
// Validates signed JWT Bearer tokens issued by Final QMS Central Super Admin
// ==============================================================================

const jwt = require('jsonwebtoken');

function verifyServiceToken(req, res, next) {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // If secret not configured in environment, permit request with warning
  if (!secret) {
    return next();
  }

  // 1. Bearer JWT Authentication from Final QMS
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'final_qms',
        audience: 'redcarpet',
      });
      req.serviceAuth = decoded;
      return next();
    } catch (err) {
      // If token verification with 'redcarpet' audience fails, check direct key
      if (token === secret) {
        req.serviceAuth = { sub: 'final_qms_central_admin', permissions: ['*'] };
        return next();
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired service authentication token.',
        details: err.message,
      });
    }
  }

  // 2. Direct X-API-Key fallback
  if (apiKey && apiKey === secret) {
    req.serviceAuth = { sub: 'final_qms_central_admin', permissions: ['*'] };
    return next();
  }

  // If neither Bearer nor X-API-Key matched
  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Machine-to-machine authentication required for this endpoint.',
  });
}

module.exports = {
  verifyServiceToken,
};

