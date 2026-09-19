const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  register(req, res, next) {
    try {
      const result = authService.register(req.body);
      return ApiResponse.success(res, 201, 'User account registered successfully', result);
    } catch (err) {
      next(err);
    }
  }

  login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = authService.login(email, password);
      return ApiResponse.success(res, 200, 'Authentication successful', result);
    } catch (err) {
      next(err);
    }
  }

  getProfile(req, res, next) {
    try {
      const profile = authService.getProfile(req.user.id);
      return ApiResponse.success(res, 200, 'User profile retrieved', profile);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
