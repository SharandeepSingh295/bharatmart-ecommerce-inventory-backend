const app = require('./src/app');
const config = require('./src/config/env');

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🛍️  BharatMart E-Commerce API running at: http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔐 Auth API:     http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`📦 Products:     http://localhost:${PORT}/api/v1/products`);
  console.log(`🛒 Cart API:     http://localhost:${PORT}/api/v1/cart`);
  console.log(`📑 Orders API:   http://localhost:${PORT}/api/v1/orders/checkout`);
  console.log('====================================================');
});

// Clean graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Closing HTTP connections...`);
  server.close(() => {
    console.log('[Server] Connections closed. Clean process termination.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`💡 Tip: Set a different PORT in .env or stop any process occupying port ${PORT}.`);
    process.exit(1);
  } else {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
});
