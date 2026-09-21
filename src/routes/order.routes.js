const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const {
  checkoutSchema,
  updateOrderStatusSchema,
  queryOrdersSchema,
  orderIdParamSchema
} = require('../validators/order.validator');

const router = Router();

// All order routes require authentication
router.use(authenticateToken);

// POST /api/v1/orders/checkout - Place order from cart (Atomic Transaction)
router.post(
  '/checkout',
  validate(checkoutSchema, 'body'),
  orderController.checkout
);

// GET /api/v1/orders/my-orders - View logged-in customer's order history
router.get('/my-orders', orderController.getUserOrders);

// GET /api/v1/orders/admin/all - View all orders across system (Admin Only)
router.get(
  '/admin/all',
  requireRole('ADMIN'),
  validate(queryOrdersSchema, 'query'),
  orderController.listAllOrders
);

// GET /api/v1/orders/:id - View order details by ID
router.get(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  orderController.getOrderById
);

// PATCH /api/v1/orders/:id/status - Update order status (Admin Only, restores stock on CANCELLED)
router.patch(
  '/:id/status',
  requireRole('ADMIN'),
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderStatusSchema, 'body'),
  orderController.updateOrderStatus
);

// POST /api/v1/orders/:id/cancel - Customer or Admin cancels order (restores stock)
router.post(
  '/:id/cancel',
  validate(orderIdParamSchema, 'params'),
  orderController.cancelOrder
);

module.exports = router;
