const { Router } = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
  productIdParamSchema
} = require('../validators/product.validator');

const router = Router();

// GET /api/v1/products - Search & filter products (Public)
router.get('/', validate(queryProductsSchema, 'query'), productController.listProducts);

// GET /api/v1/products/:id - Get product details by ID (Public)
router.get('/:id', validate(productIdParamSchema, 'params'), productController.getProductById);

// POST /api/v1/products - Create new product in inventory (Admin Only)
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN'),
  validate(createProductSchema, 'body'),
  productController.createProduct
);

// PATCH /api/v1/products/:id - Update product details or stock (Admin Only)
router.patch(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema, 'body'),
  productController.updateProduct
);

// DELETE /api/v1/products/:id - Delete product from inventory (Admin Only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validate(productIdParamSchema, 'params'),
  productController.deleteProduct
);

module.exports = router;
