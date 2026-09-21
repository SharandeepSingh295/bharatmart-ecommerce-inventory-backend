const orderService = require('../services/order.service');
const ApiResponse = require('../utils/apiResponse');

class OrderController {
  checkout(req, res, next) {
    try {
      const order = orderService.checkout(req.user.id, req.body);
      return ApiResponse.success(res, 201, 'Order placed successfully! Inventory deducted.', order);
    } catch (err) {
      next(err);
    }
  }

  getUserOrders(req, res, next) {
    try {
      const orders = orderService.getUserOrders(req.user.id);
      return ApiResponse.success(res, 200, `Retrieved ${orders.length} past order(s)`, orders);
    } catch (err) {
      next(err);
    }
  }

  getOrderById(req, res, next) {
    try {
      const order = orderService.getOrderById(req.params.id, req.user);
      return ApiResponse.success(res, 200, 'Order details retrieved', order);
    } catch (err) {
      next(err);
    }
  }

  listAllOrders(req, res, next) {
    try {
      const { items, total, page, limit, totalPages } = orderService.listAllOrders(req.query);
      return ApiResponse.success(
        res,
        200,
        `Retrieved ${items.length} order(s) for administrator review`,
        items,
        { page, limit, total, totalPages }
      );
    } catch (err) {
      next(err);
    }
  }

  updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      const order = orderService.updateOrderStatus(req.params.id, status);
      return ApiResponse.success(res, 200, `Order status updated to ${status}`, order);
    } catch (err) {
      next(err);
    }
  }

  cancelOrder(req, res, next) {
    try {
      const order = orderService.cancelOrder(req.params.id, req.user);
      return ApiResponse.success(res, 200, 'Order successfully cancelled. Product stock has been restored.', order);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
