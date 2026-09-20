const categoryRepository = require('../repositories/category.repository');
const ApiResponse = require('../utils/apiResponse');

class CategoryController {
  getAllCategories(req, res, next) {
    try {
      const categories = categoryRepository.findAll();
      return ApiResponse.success(res, 200, 'Categories retrieved successfully', categories);
    } catch (err) {
      next(err);
    }
  }

  getCategoryById(req, res, next) {
    try {
      const category = categoryRepository.findById(req.params.id);
      if (!category) {
        return ApiResponse.error(res, 404, `Category with ID '${req.params.id}' not found`);
      }
      return ApiResponse.success(res, 200, 'Category details retrieved', category);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoryController();
