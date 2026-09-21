const cartService = require('../services/cart.service');
const ApiResponse = require('../utils/apiResponse');

class CartController {
  getCart(req, res, next) {
    try {
      const cart = cartService.getCart(req.user.id);
      return ApiResponse.success(res, 200, 'User cart retrieved', cart);
    } catch (err) {
      next(err);
    }
  }

  addItem(req, res, next) {
    try {
      const { productId, quantity = 1 } = req.body;
      const cart = cartService.addItem(req.user.id, productId, quantity);
      return ApiResponse.success(res, 200, 'Product added to cart successfully', cart);
    } catch (err) {
      next(err);
    }
  }

  updateItem(req, res, next) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const cart = cartService.updateItem(req.user.id, productId, quantity);
      return ApiResponse.success(res, 200, 'Cart item quantity updated', cart);
    } catch (err) {
      next(err);
    }
  }

  removeItem(req, res, next) {
    try {
      const { productId } = req.params;
      const cart = cartService.removeItem(req.user.id, productId);
      return ApiResponse.success(res, 200, 'Item removed from cart', cart);
    } catch (err) {
      next(err);
    }
  }

  clearCart(req, res, next) {
    try {
      const result = cartService.clearCart(req.user.id);
      return ApiResponse.success(res, 200, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CartController();
