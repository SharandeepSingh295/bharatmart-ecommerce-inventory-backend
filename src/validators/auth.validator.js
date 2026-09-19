const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Full name is required'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'A valid email address is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().trim().pattern(/^[\d\s+\-()]{7,20}$/).required().messages({
    'string.pattern.base': 'Please provide a valid Indian phone number (7-20 digits)',
    'any.required': 'Phone number is required'
  }),
  role: Joi.string().valid('CUSTOMER', 'ADMIN').default('CUSTOMER').messages({
    'any.only': 'Role must be either CUSTOMER or ADMIN'
  }),
  address: Joi.string().trim().min(5).max(255).default('Connaught Place, New Delhi, Delhi 110001').messages({
    'string.min': 'Address must be at least 5 characters'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Valid email is required to login',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required'
  })
});

module.exports = {
  registerSchema,
  loginSchema
};
