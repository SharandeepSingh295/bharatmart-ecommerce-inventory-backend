const { ApiError } = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.statusCode, err.message, err.errors);
  }

  // Handle JSON parse errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ApiResponse.error(res, 400, 'Malformed JSON payload received');
  }

  console.error('[Unhandled Server Error]', err);

  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'Internal Server Error' : err.message;
  return ApiResponse.error(res, 500, message);
}

module.exports = errorHandler;
