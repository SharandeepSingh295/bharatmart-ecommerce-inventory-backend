const db = require('../config/database');

class CategoryRepository {
  findAll() {
    return db.allCategories();
  }

  findById(id) {
    return db.getCategoryById(id);
  }

  create(categoryData) {
    return db.insertCategory(categoryData);
  }
}

module.exports = new CategoryRepository();
