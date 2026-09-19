const db = require('../config/database');

class UserRepository {
  findById(id) {
    return db.getUserById(id);
  }

  findByEmail(email) {
    return db.getUserByEmail(email);
  }

  create(userData) {
    return db.insertUser(userData);
  }

  findAll() {
    return db.allUsers();
  }
}

module.exports = new UserRepository();
