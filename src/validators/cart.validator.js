const Joi = require('joi');

const addCartItemSchema = Joi.object({
  productId: Joi.string().trim().required().messages({
    'string.empty': 'Product ID is required',
    'any.required': 'Product ID is required'
  }),
  quantity: Joi.number().integer().min(1).max(50).default(1).messages({
    'number.base': 'Quantity must be a valid integer',
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Cannot add more than 50 units in a single cart addition'
  })
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(50).required().messages({
    'number.base': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Cannot exceed 50 units',
    'any.required': 'Quantity is required'
  })
});

const cartProductIdParamSchema = Joi.object({
  productId: Joi.string().trim().required().messages({
    'string.empty': 'Product ID is required in URL path',
    'any.required': 'Product ID is required'
  })
});

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  cartProductIdParamSchema
};
