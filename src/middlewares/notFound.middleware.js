const ApiResponse = require('../utils/apiResponse');

function notFoundHandler(req, res) {
  return ApiResponse.error(
    res,
    404,
    `Route '${req.method} ${req.originalUrl}' does not exist on BharatMart E-Commerce API`
  );
}

module.exports = notFoundHandler;
