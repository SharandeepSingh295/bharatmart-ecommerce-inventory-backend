const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/apiError');

class ProductService {
  listProducts(queryParams) {
    return productRepository.find(queryParams);
  }

  getProductById(id) {
    const product = productRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }
    return product;
  }

  createProduct(productData) {
    const { sku, categoryId, title, description, price, stockQuantity = 0 } = productData;

    // 1. Verify category exists
    const category = categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError(`Product category with ID '${categoryId}' does not exist`);
    }

    // 2. Check SKU uniqueness
    const existingSku = productRepository.findBySku(sku);
    if (existingSku) {
      throw new ConflictError(`Product with SKU '${sku.toUpperCase()}' already exists`);
    }

    const id = `prod_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newProduct = {
      id,
      sku: sku.toUpperCase(),
      title,
      description,
      price: Number(price),
      stockQuantity: parseInt(stockQuantity, 10),
      categoryId,
      createdAt: now,
      updatedAt: now
    };

    productRepository.create(newProduct);

    return {
      ...newProduct,
      categoryName: category.name
    };
  }

  updateProduct(id, updateData) {
    const existing = this.getProductById(id);

    if (updateData.categoryId) {
      const category = categoryRepository.findById(updateData.categoryId);
      if (!category) {
        throw new NotFoundError(`Target category '${updateData.categoryId}' does not exist`);
      }
    }

    if (updateData.stockQuantity !== undefined && updateData.stockQuantity < 0) {
      throw new BadRequestError('Stock quantity cannot be negative');
    }

    const updated = productRepository.update(id, updateData);
    return updated;
  }

  adjustStock(id, delta) {
    const product = this.getProductById(id);
    const newStock = product.stockQuantity + delta;
    if (newStock < 0) {
      throw new BadRequestError(`Cannot deduct ${Math.abs(delta)} units. Available stock is only ${product.stockQuantity}`);
    }

    return productRepository.adjustStock(id, delta);
  }

  deleteProduct(id) {
    this.getProductById(id);
    return productRepository.delete(id);
  }
}

module.exports = new ProductService();
