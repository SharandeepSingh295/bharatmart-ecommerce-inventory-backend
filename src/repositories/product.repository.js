const db = require('../config/database');

class ProductRepository {
  findAll() {
    return db.allProducts();
  }

  findById(id) {
    return db.getProductById(id);
  }

  findBySku(sku) {
    return db.getProductBySku(sku);
  }

  find(filterParams) {
    return db.findProducts(filterParams);
  }

  create(productData) {
    return db.insertProduct(productData);
  }

  update(id, updateData) {
    return db.updateProduct(id, updateData);
  }

  adjustStock(id, delta) {
    return db.adjustProductStock(id, delta);
  }

  delete(id) {
    return db.deleteProduct(id);
  }
}

module.exports = new ProductRepository();
