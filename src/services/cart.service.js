const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const { NotFoundError, BadRequestError } = require('../utils/apiError');

class CartService {
  getCart(userId) {
    const items = cartRepository.findByUser(userId);

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const gstRate = 0.18; // 18% GST standard Indian rate
    const taxAmount = Math.round(subtotal * gstRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      itemCount: items.length,
      totalUnits: totalItems,
      subtotal,
      currency: 'INR',
      currencySymbol: '₹',
      gstRate: '18%',
      taxAmount,
      totalAmount
    };
  }

  addItem(userId, productId, quantity = 1) {
    const product = productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID '${productId}' not found`);
    }

    if (product.stockQuantity <= 0) {
      throw new BadRequestError(`Product '${product.title}' is currently out of stock`);
    }

    const existingItem = cartRepository.findItem(userId, productId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > product.stockQuantity) {
      throw new BadRequestError(
        `Cannot add ${quantity} unit(s). You already have ${currentQty} in cart, and available stock is ${product.stockQuantity}`
      );
    }

    cartRepository.upsertItem(userId, productId, newQty);
    return this.getCart(userId);
  }

  updateItem(userId, productId, quantity) {
    const product = productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID '${productId}' not found`);
    }

    if (quantity > product.stockQuantity) {
      throw new BadRequestError(
        `Requested quantity (${quantity}) exceeds available inventory stock (${product.stockQuantity})`
      );
    }

    cartRepository.upsertItem(userId, productId, quantity);
    return this.getCart(userId);
  }

  removeItem(userId, productId) {
    cartRepository.removeItem(userId, productId);
    return this.getCart(userId);
  }

  clearCart(userId) {
    cartRepository.clearCart(userId);
    return { message: 'Cart successfully emptied' };
  }
}

module.exports = new CartService();
