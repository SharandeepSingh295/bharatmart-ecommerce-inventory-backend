const { Router } = require('express');
const categoryController = require('../controllers/category.controller');

const router = Router();

// GET /api/v1/categories - List all product categories (Public)
router.get('/', categoryController.getAllCategories);

// GET /api/v1/categories/:id - Get category details by ID (Public)
router.get('/:id', categoryController.getCategoryById);

module.exports = router;
