class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', errors = null) {
    super(400, message, errors);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized access: Authentication token required or invalid') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden: You do not have permission to perform this action') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource Not Found') {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource Conflict') {
    super(409, message);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};
