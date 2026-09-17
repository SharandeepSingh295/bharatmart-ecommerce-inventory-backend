const ApiResponse = require('../utils/apiResponse');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const formattedErrors = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message.replace(/['"]/g, '')
      }));

      return ApiResponse.error(res, 400, 'Validation Failed: Please review the submitted fields', formattedErrors);
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;
