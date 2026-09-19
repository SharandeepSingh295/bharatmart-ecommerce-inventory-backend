const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { UnauthorizedError, ForbiddenError } = require('../utils/apiError');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access denied: Missing or malformed Authorization header (Expected: Bearer <token>)'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { id, email, name, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Authentication token has expired. Please login again.'));
    }
    return next(new UnauthorizedError('Invalid authentication token.'));
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
