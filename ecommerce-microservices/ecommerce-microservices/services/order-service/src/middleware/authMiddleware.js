const jwt = require('jsonwebtoken');

/**
 * authenticate: verifies the JWT access token issued by auth-service.
 * Every downstream microservice can verify tokens locally (stateless)
 * since they share JWT_SECRET, avoiding a network call per request.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing access token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email, roles: decoded.roles || [] };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * authorize: role-based authorization guard.
 * Usage: authorize('admin', 'seller')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) return res.status(403).json({ message: 'Insufficient permissions' });
    next();
  };
}

module.exports = { authenticate, authorize };
