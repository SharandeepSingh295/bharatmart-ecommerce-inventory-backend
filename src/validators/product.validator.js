const Joi = require('joi');

const createProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().min(3).max(50).required().messages({
    'string.empty': 'Product SKU is required',
    'any.required': 'Product SKU is required'
  }),
  title: Joi.string().trim().min(3).max(200).required().messages({
    'string.empty': 'Product title is required',
    'string.min': 'Title must be at least 3 characters',
    'any.required': 'Product title is required'
  }),
  description: Joi.string().trim().min(10).max(2000).required().messages({
    'string.empty': 'Product description is required',
    'string.min': 'Description must be at least 10 characters',
    'any.required': 'Product description is required'
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a valid number',
    'number.positive': 'Price must be greater than zero',
    'any.required': 'Price is required'
  }),
  stockQuantity: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Stock quantity cannot be negative'
  }),
  categoryId: Joi.string().trim().required().messages({
    'string.empty': 'Category ID is required',
    'any.required': 'Category ID is required'
  })
});

const updateProductSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().min(10).max(2000).optional(),
  price: Joi.number().positive().precision(2).optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  categoryId: Joi.string().trim().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided to update the product'
});

const queryProductsSchema = Joi.object({
  search: Joi.string().trim().optional(),
  categoryId: Joi.string().trim().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStockOnly: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const productIdParamSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    'string.empty': 'Product ID is required in URL path',
    'any.required': 'Product ID is required'
  })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
  productIdParamSchema
};
