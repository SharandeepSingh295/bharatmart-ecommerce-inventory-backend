const path = require('path');
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '5002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbFilePath: path.resolve(process.cwd(), process.env.DB_PATH || './data/bharatmart.db'),
  jwtSecret: process.env.JWT_SECRET || 'bharatmart_super_secret_jwt_key_2026_intermediate',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
