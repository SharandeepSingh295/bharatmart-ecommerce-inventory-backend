const productService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');

class ProductController {
  listProducts(req, res, next) {
    try {
      const { items, total, page, limit, totalPages } = productService.listProducts(req.query);
      return ApiResponse.success(
        res,
        200,
        `Retrieved ${items.length} product(s)`,
        items,
        { page, limit, total, totalPages }
      );
    } catch (err) {
      next(err);
    }
  }

  getProductById(req, res, next) {
    try {
      const product = productService.getProductById(req.params.id);
      return ApiResponse.success(res, 200, 'Product details retrieved', product);
    } catch (err) {
      next(err);
    }
  }

  createProduct(req, res, next) {
    try {
      const product = productService.createProduct(req.body);
      return ApiResponse.success(res, 201, 'Product created successfully in inventory', product);
    } catch (err) {
      next(err);
    }
  }

  updateProduct(req, res, next) {
    try {
      const updated = productService.updateProduct(req.params.id, req.body);
      return ApiResponse.success(res, 200, 'Product inventory updated successfully', updated);
    } catch (err) {
      next(err);
    }
  }

  deleteProduct(req, res, next) {
    try {
      productService.deleteProduct(req.params.id);
      return ApiResponse.success(res, 200, 'Product removed from catalog');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
