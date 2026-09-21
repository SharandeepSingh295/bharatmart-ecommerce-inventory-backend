const { Router } = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const ApiResponse = require('../utils/apiResponse');

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  return ApiResponse.success(res, 200, 'BharatMart E-Commerce API is healthy and operational', {
    status: 'UP',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'BharatMart E-Commerce & Inventory Management REST API',
    version: '1.0.0'
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
