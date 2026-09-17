const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const apiRoutes = require('./routes/index');
const notFoundHandler = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors({ origin: config.corsOrigin }));

// HTTP logging (skip during automated testing)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Root welcome & sitemap
app.get('/', (req, res) => {
  res.json({
    name: 'BharatMart E-Commerce & Inventory Management REST API',
    level: 'ShadowFox Intermediate Track',
    version: '1.0.0',
    documentation: '/api/v1/health',
    modules: {
      health: 'GET /api/v1/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        profile: 'GET /api/v1/auth/me (Bearer Token required)'
      },
      products: {
        list: 'GET /api/v1/products (Search, Category & Price filters)',
        single: 'GET /api/v1/products/:id',
        create: 'POST /api/v1/products (Admin Only)',
        update: 'PATCH /api/v1/products/:id (Admin Only)',
        delete: 'DELETE /api/v1/products/:id (Admin Only)'
      },
      cart: {
        view: 'GET /api/v1/cart',
        addItem: 'POST /api/v1/cart/items',
        updateQty: 'PATCH /api/v1/cart/items/:productId',
        removeItem: 'DELETE /api/v1/cart/items/:productId',
        clear: 'DELETE /api/v1/cart'
      },
      orders: {
        checkout: 'POST /api/v1/orders/checkout (Atomic Transaction & Inventory Deduction)',
        myOrders: 'GET /api/v1/orders/my-orders',
        orderDetails: 'GET /api/v1/orders/:id',
        adminAllOrders: 'GET /api/v1/orders/admin/all (Admin Only)',
        updateStatus: 'PATCH /api/v1/orders/:id/status (Admin Only, Restores stock if cancelled)'
      }
    }
  });
});

// Mount API v1
app.use('/api/v1', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
