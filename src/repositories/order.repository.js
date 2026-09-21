const db = require('../config/database');

class OrderRepository {
  findById(orderId) {
    return db.getOrderById(orderId);
  }

  findByUser(userId) {
    return db.getOrdersByUser(userId);
  }

  findAll(filters) {
    return db.findOrders(filters);
  }

  createOrder(orderData) {
    return db.insertOrder(orderData);
  }

  createOrderItem(itemData) {
    return db.insertOrderItem(itemData);
  }

  updateStatus(orderId, status) {
    return db.updateOrderStatus(orderId, status);
  }

  runTransaction(callback) {
    return db.runTransaction(callback);
  }
}

module.exports = new OrderRepository();
