const db = require('../config/database');

class CartRepository {
  findByUser(userId) {
    return db.getCartByUser(userId);
  }

  findItem(userId, productId) {
    return db.getCartItem(userId, productId);
  }

  upsertItem(userId, productId, quantity) {
    return db.upsertCartItem(userId, productId, quantity);
  }

  removeItem(userId, productId) {
    return db.removeCartItem(userId, productId);
  }

  clearCart(userId) {
    return db.clearUserCart(userId);
  }
}

module.exports = new CartRepository();
