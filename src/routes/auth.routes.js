const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = Router();

// POST /api/v1/auth/register - Register new customer or admin account
router.post('/register', validate(registerSchema, 'body'), authController.register);

// POST /api/v1/auth/login - Login and receive JWT token
router.post('/login', validate(loginSchema, 'body'), authController.login);

// GET /api/v1/auth/me - Get current logged-in user profile (Protected)
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
