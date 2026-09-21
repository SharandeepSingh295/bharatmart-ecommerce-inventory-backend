const { Router } = require('express');
const cartController = require('../controllers/cart.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  addCartItemSchema,
  updateCartItemSchema,
  cartProductIdParamSchema
} = require('../validators/cart.validator');

const router = Router();

// All cart operations require logged-in user
router.use(authenticateToken);

// GET /api/v1/cart - View active shopping cart
router.get('/', cartController.getCart);

// POST /api/v1/cart/items - Add item to cart with stock validation
router.post('/items', validate(addCartItemSchema, 'body'), cartController.addItem);

// PATCH /api/v1/cart/items/:productId - Update item quantity
router.patch(
  '/items/:productId',
  validate(cartProductIdParamSchema, 'params'),
  validate(updateCartItemSchema, 'body'),
  cartController.updateItem
);

// DELETE /api/v1/cart/items/:productId - Remove specific item from cart
router.delete(
  '/items/:productId',
  validate(cartProductIdParamSchema, 'params'),
  cartController.removeItem
);

// DELETE /api/v1/cart - Clear entire cart
router.delete('/', cartController.clearCart);

module.exports = router;
