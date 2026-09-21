const orderRepository = require('../repositories/order.repository');
const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const userRepository = require('../repositories/user.repository');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/apiError');

class OrderService {
  checkout(userId, checkoutData = {}) {
    // 1. Fetch user & cart
    const user = userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found');
    }

    const cartItems = cartRepository.findByUser(userId);
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestError('Cannot proceed to checkout: Your shopping cart is empty');
    }

    const shippingAddress = checkoutData.shippingAddress || user.address;
    const paymentMethod = checkoutData.paymentMethod || 'UPI';

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // 2. Execute Atomic Transaction (Stock Deduction + Order Creation + Cart Clearing)
    const createdOrder = orderRepository.runTransaction(() => {
      // Step A: Re-verify and deduct inventory stock for each product
      for (const item of cartItems) {
        const product = productRepository.findById(item.productId);
        if (!product) {
          throw new NotFoundError(`Product '${item.productTitle}' (ID: ${item.productId}) no longer exists`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for '${product.title}'. Requested: ${item.quantity}, Available: ${product.stockQuantity}`
          );
        }

        // Deduct inventory
        productRepository.adjustStock(item.productId, -item.quantity);
      }

      // Step B: Insert Master Order
      const newOrder = {
        id: orderId,
        userId,
        totalAmount,
        shippingAddress,
        status: 'PROCESSING',
        paymentMethod,
        paymentStatus: 'PAID',
        createdAt: now,
        updatedAt: now
      };
      orderRepository.createOrder(newOrder);

      // Step C: Insert Line Items
      for (const item of cartItems) {
        const orderItem = {
          id: `item_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          orderId,
          productId: item.productId,
          productTitle: item.productTitle,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.itemTotal
        };
        orderRepository.createOrderItem(orderItem);
      }

      // Step D: Empty User Cart
      cartRepository.clearCart(userId);

      return newOrder;
    });

    return orderRepository.findById(createdOrder.id);
  }

  getUserOrders(userId) {
    return orderRepository.findByUser(userId);
  }

  getOrderById(orderId, requestUser) {
    const order = orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    if (requestUser.role !== 'ADMIN' && order.userId !== requestUser.id) {
      throw new ForbiddenError('You do not have permission to view this order');
    }

    return order;
  }

  listAllOrders(filters) {
    return orderRepository.findAll(filters);
  }

  updateOrderStatus(orderId, newStatus) {
    const order = orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    if (order.status === 'DELIVERED') {
      throw new BadRequestError('Cannot modify status of an already DELIVERED order');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestError('Cannot modify status of a CANCELLED order');
    }

    // State machine transitions
    const validTransitions = {
      PENDING: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: []
    };

    const allowedNext = validTransitions[order.status] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from '${order.status}' to '${newStatus}'. Allowed: [${allowedNext.join(', ')}]`
      );
    }

    // If order is being cancelled, restore inventory stock inside transaction!
    if (newStatus === 'CANCELLED') {
      orderRepository.runTransaction(() => {
        for (const item of order.items) {
          productRepository.adjustStock(item.productId, item.quantity);
        }
        orderRepository.updateStatus(orderId, 'CANCELLED');
      });
    } else {
      orderRepository.updateStatus(orderId, newStatus);
    }

    return orderRepository.findById(orderId);
  }

  cancelOrder(orderId, requestUser) {
    const order = this.getOrderById(orderId, requestUser);

    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      throw new BadRequestError(`Cannot cancel order '${orderId}' because its status is already ${order.status}`);
    }

    if (requestUser.role !== 'ADMIN' && order.status !== 'PENDING' && order.status !== 'PROCESSING') {
      throw new BadRequestError(`Customers can only cancel orders in PENDING or PROCESSING status. Current status: ${order.status}`);
    }

    orderRepository.runTransaction(() => {
      for (const item of order.items) {
        productRepository.adjustStock(item.productId, item.quantity);
      }
      orderRepository.updateStatus(orderId, 'CANCELLED');
    });

    return orderRepository.findById(orderId);
  }
}

module.exports = new OrderService();
