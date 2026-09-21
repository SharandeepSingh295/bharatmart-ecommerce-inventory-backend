const Joi = require('joi');

const checkoutSchema = Joi.object({
  shippingAddress: Joi.string().trim().min(5).max(255).optional().messages({
    'string.min': 'Shipping address must be at least 5 characters'
  }),
  paymentMethod: Joi.string().valid('UPI', 'CARD', 'NETBANKING', 'COD').default('UPI').messages({
    'any.only': 'Payment method must be one of: UPI, CARD, NETBANKING, COD'
  })
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED').required().messages({
    'any.only': 'Status must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED',
    'any.required': 'Order status is required'
  })
});

const queryOrdersSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const orderIdParamSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    'string.empty': 'Order ID is required in URL path',
    'any.required': 'Order ID is required'
  })
});

module.exports = {
  checkoutSchema,
  updateOrderStatusSchema,
  queryOrdersSchema,
  orderIdParamSchema
};
