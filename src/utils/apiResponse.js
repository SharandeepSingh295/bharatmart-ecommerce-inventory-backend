class ApiResponse {
  static success(res, statusCode = 200, message = 'Success', data = null, pagination = null) {
    const responsePayload = {
      success: true,
      statusCode,
      message,
      data
    };

    if (pagination) {
      responsePayload.pagination = pagination;
    }

    return res.status(statusCode).json(responsePayload);
  }

  static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
    const responsePayload = {
      success: false,
      statusCode,
      message
    };

    if (errors) {
      responsePayload.errors = errors;
    }

    return res.status(statusCode).json(responsePayload);
  }
}

module.exports = ApiResponse;
