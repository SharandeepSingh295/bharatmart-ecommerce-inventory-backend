process.env.NODE_ENV = 'test';

const http = require('http');
const app = require('../src/app');

let server;
let baseUrl;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passed++;
  }
}

async function request(method, path, body = null, token = null) {
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting BharatMart E-Commerce API Integration Tests');
  console.log('   (ShadowFox Intermediate Track Evaluation)');
  console.log('======================================================\n');

  // Start ephemeral test server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  try {
    // -----------------------------------------------------------
    // SUITE 1: System Health & Info
    // -----------------------------------------------------------
    console.log('[Suite 1: System Health & Root Pipeline]');
    {
      const res = await request('GET', '/api/v1/health');
      assert(res.status === 200, 'GET /api/v1/health returns 200 OK');
      assert(res.data.success === true, 'Health check returns success: true');
      assert(res.data.data.status === 'UP', 'Service status is UP');
    }

    // -----------------------------------------------------------
    // SUITE 2: Authentication & Authorization (JWT + Bcrypt)
    // -----------------------------------------------------------
    console.log('\n[Suite 2: Authentication & Authorization (JWT + Bcrypt)]');
    let customerToken;
    let adminToken;
    const testTimestamp = Date.now();
    const customerEmail = `rahul.verma.${testTimestamp}@example.in`;
    const adminEmail = `admin.lead.${testTimestamp}@bharatmart.in`;

    // 1. Register Customer
    {
      const res = await request('POST', '/api/v1/auth/register', {
        name: 'Rahul Verma',
        email: customerEmail,
        password: 'Password@123',
        phone: '+91 98101 23456',
        role: 'CUSTOMER',
        address: 'Flat 302, Shanti Kunj, Sector 21, Noida 201301'
      });
      assert(res.status === 201, 'Customer registration returns 201 Created');
      assert(res.data.success === true, 'Response success is true');
      assert(res.data.data.user.role === 'CUSTOMER', 'Assigned role is CUSTOMER');
      assert(typeof res.data.data.token === 'string', 'JWT token generated and returned');
      customerToken = res.data.data.token;
    }

    // 2. Register Admin
    {
      const res = await request('POST', '/api/v1/auth/register', {
        name: 'Siddharth Roy',
        email: adminEmail,
        password: 'AdminPassword@123',
        phone: '+91 98202 34567',
        role: 'ADMIN',
        address: 'Bandra Kurla Complex, Mumbai 400051'
      });
      assert(res.status === 201, 'Admin registration returns 201 Created');
      assert(res.data.data.user.role === 'ADMIN', 'Assigned role is ADMIN');
      adminToken = res.data.data.token;
    }

    // 3. Duplicate Email Rejection (409 Conflict)
    {
      const res = await request('POST', '/api/v1/auth/register', {
        name: 'Duplicate User',
        email: customerEmail,
        password: 'Password@123',
        phone: '+91 98101 23456'
      });
      assert(res.status === 409, 'Duplicate email registration returns 409 Conflict');
      assert(res.data.success === false, 'Error response success is false');
    }

    // 4. Login with Valid Credentials
    {
      const res = await request('POST', '/api/v1/auth/login', {
        email: customerEmail,
        password: 'Password@123'
      });
      assert(res.status === 200, 'Login with correct credentials returns 200 OK');
      assert(typeof res.data.data.token === 'string', 'Login returns valid JWT Bearer token');
    }

    // 5. Login with Invalid Password
    {
      const res = await request('POST', '/api/v1/auth/login', {
        email: customerEmail,
        password: 'WrongPassword'
      });
      assert(res.status === 401, 'Login with wrong password returns 401 Unauthorized');
      assert(res.data.message.includes('Invalid'), 'Friendly invalid credentials message');
    }

    // 6. Access Protected Profile with Token
    {
      const res = await request('GET', '/api/v1/auth/me', null, customerToken);
      assert(res.status === 200, 'GET /auth/me with Bearer token returns 200 OK');
      assert(res.data.data.email === customerEmail, 'Returns correct user profile');
      assert(res.data.data.password === undefined, 'Password hash is strictly omitted');
    }

    // 7. Access Protected Profile without Token (401)
    {
      const res = await request('GET', '/api/v1/auth/me');
      assert(res.status === 401, 'GET /auth/me without token returns 401 Unauthorized');
    }

    // -----------------------------------------------------------
    // SUITE 3: Role-Based Access Control (RBAC)
    // -----------------------------------------------------------
    console.log('\n[Suite 3: Role-Based Access Control (RBAC)]');
    // Customer attempting admin action -> 403 Forbidden
    {
      const res = await request('POST', '/api/v1/products', {
        sku: 'TEST-SKU-001',
        title: 'Unauthorized Product',
        description: 'Customer should not be able to create products',
        price: 999,
        stockQuantity: 10,
        categoryId: 'cat_electronics'
      }, customerToken);
      assert(res.status === 403, 'Customer attempting Admin action returns 403 Forbidden');
      assert(res.data.message.includes('Forbidden'), 'Explains missing ADMIN privileges');
    }

    // Admin successfully creates product -> 201 Created
    let createdProductId;
    const testSku = `PROD-${Date.now()}`;
    {
      const res = await request('POST', '/api/v1/products', {
        sku: testSku,
        title: 'Noise ColorFit Pulse Grand Smartwatch',
        description: '1.69 inch LCD display, 60 sports modes, 150 cloud watch faces, IP68 water resistance.',
        price: 1299.0,
        stockQuantity: 20,
        categoryId: 'cat_electronics'
      }, adminToken);
      assert(res.status === 201, 'Admin creating product returns 201 Created');
      assert(res.data.data.sku === testSku, 'Product saved with correct SKU');
      createdProductId = res.data.data.id;
    }

    // -----------------------------------------------------------
    // SUITE 4: Product & Inventory Catalog
    // -----------------------------------------------------------
    console.log('\n[Suite 4: Product & Inventory Catalog]');
    // 1. List Products (Public)
    {
      const res = await request('GET', '/api/v1/products');
      assert(res.status === 200, 'GET /api/v1/products returns 200 OK');
      assert(Array.isArray(res.data.data), 'Products data is an array');
      assert(res.data.data.length >= 8, 'Pre-seeded Indian products exist');
    }

    // 2. Filter Products by Category
    {
      const res = await request('GET', '/api/v1/products?categoryId=cat_electronics');
      assert(res.status === 200, 'Filter by category returns 200 OK');
      assert(res.data.data.every(p => p.categoryId === 'cat_electronics'), 'All returned products match category');
    }

    // 3. Search Products by Keyword
    {
      const res = await request('GET', '/api/v1/products?search=boAt');
      assert(res.status === 200, 'Search by keyword returns 200 OK');
      assert(res.data.data.some(p => p.title.includes('boAt')), 'Search found matching product');
    }

    // 4. Get Product Details by ID
    {
      const res = await request('GET', `/api/v1/products/${createdProductId}`);
      assert(res.status === 200, 'GET /products/:id returns 200 OK');
      assert(res.data.data.id === createdProductId, 'Returns exact product record');
    }

    // 5. Admin updates stock quantity
    {
      const res = await request('PATCH', `/api/v1/products/${createdProductId}`, {
        stockQuantity: 25
      }, adminToken);
      assert(res.status === 200, 'Admin stock update returns 200 OK');
      assert(res.data.data.stockQuantity === 25, 'Stock quantity successfully updated to 25');
    }

    // 6. Public Category Listing
    {
      const res = await request('GET', '/api/v1/categories');
      assert(res.status === 200, 'GET /categories returns 200 OK');
      assert(Array.isArray(res.data.data), 'Categories data is an array');
      assert(res.data.data.length >= 4, 'Includes predefined product categories');
    }

    // 7. Get Category by ID
    {
      const res = await request('GET', '/api/v1/categories/cat_electronics');
      assert(res.status === 200, 'GET /categories/:id returns 200 OK');
      assert(res.data.data.id === 'cat_electronics', 'Returns category with id cat_electronics');
    }

    // -----------------------------------------------------------
    // SUITE 5: Shopping Cart Management
    // -----------------------------------------------------------
    console.log('\n[Suite 5: Shopping Cart Workflows]');
    // 1. View Cart
    {
      const res = await request('GET', '/api/v1/cart', null, customerToken);
      assert(res.status === 200, 'GET /cart returns 200 OK');
      assert(res.data.data.currency === 'INR', 'Currency is INR');
      assert(res.data.data.gstRate === '18%', 'Applies standard 18% GST calculation');
    }

    // 2. Add Item to Cart (Stock Verified)
    {
      const res = await request('POST', '/api/v1/cart/items', {
        productId: createdProductId,
        quantity: 2
      }, customerToken);
      assert(res.status === 200, 'POST /cart/items returns 200 OK');
      assert(res.data.data.items.length > 0, 'Item successfully added to cart');
      assert(res.data.data.totalAmount > 0, 'Cart total calculated with GST');
    }

    // 3. Reject Adding Quantity Greater than Available Stock
    {
      const res = await request('POST', '/api/v1/cart/items', {
        productId: createdProductId,
        quantity: 30 // Passes Joi (<= 50) but exceeds available stock of 25
      }, customerToken);
      assert(res.status === 400, 'Adding quantity exceeding stock returns 400 Bad Request');
      assert(res.data.message.includes('available stock'), 'Explains stock limit constraint');
    }

    // 4. Update Item Quantity in Cart
    {
      const res = await request('PATCH', `/api/v1/cart/items/${createdProductId}`, {
        quantity: 3
      }, customerToken);
      assert(res.status === 200, 'PATCH /cart/items/:productId returns 200 OK');
      const item = res.data.data.items.find(i => i.productId === createdProductId);
      assert(item.quantity === 3, 'Cart quantity updated to 3');
    }

    // -----------------------------------------------------------
    // SUITE 6: Atomic Checkout & Inventory Deductions
    // -----------------------------------------------------------
    console.log('\n[Suite 6: Checkout & Inventory Deductions (Transactions)]');
    // Check initial stock
    let initialStock;
    {
      const res = await request('GET', `/api/v1/products/${createdProductId}`);
      initialStock = res.data.data.stockQuantity;
    }

    // Place Order via Checkout
    let placedOrderId;
    {
      const res = await request('POST', '/api/v1/orders/checkout', {
        shippingAddress: 'B-402, Surya Enclave, Sector 14, Rohini, New Delhi 110085',
        paymentMethod: 'UPI'
      }, customerToken);
      assert(res.status === 201, 'POST /orders/checkout returns 201 Created');
      assert(res.data.data.id.startsWith('ord_'), 'Generated order ID with ord_ prefix');
      assert(res.data.data.status === 'PROCESSING', 'Initial order status is PROCESSING');
      assert(res.data.data.items.length > 0, 'Order contains line items');
      placedOrderId = res.data.data.id;
    }

    // Verify Inventory was Atomically Deducted!
    {
      const res = await request('GET', `/api/v1/products/${createdProductId}`);
      const expectedStock = initialStock - 3;
      assert(res.data.data.stockQuantity === expectedStock, `Stock atomically decremented from ${initialStock} to ${expectedStock}`);
    }

    // Verify User Cart is now empty!
    {
      const res = await request('GET', '/api/v1/cart', null, customerToken);
      assert(res.data.data.items.length === 0, 'User cart is automatically emptied after checkout');
    }

    // -----------------------------------------------------------
    // SUITE 7: Order Tracking, Admin Status & Stock Restoration
    // -----------------------------------------------------------
    console.log('\n[Suite 7: Order Tracking, Status Updates & Stock Restoration]');
    // 1. Customer Views Own Orders
    {
      const res = await request('GET', '/api/v1/orders/my-orders', null, customerToken);
      assert(res.status === 200, 'GET /orders/my-orders returns 200 OK');
      assert(res.data.data.some(o => o.id === placedOrderId), 'Customer order history includes placed order');
    }

    // 2. Admin Views All Orders Across All Users
    {
      const res = await request('GET', '/api/v1/orders/admin/all', null, adminToken);
      assert(res.status === 200, 'Admin GET /orders/admin/all returns 200 OK');
      assert(res.data.data.length >= 1, 'Admin can view all orders');
    }

    // 3. Admin Advances Status to SHIPPED
    {
      const res = await request('PATCH', `/api/v1/orders/${placedOrderId}/status`, {
        status: 'SHIPPED'
      }, adminToken);
      assert(res.status === 200, 'Admin status update to SHIPPED returns 200 OK');
      assert(res.data.data.status === 'SHIPPED', 'Order status changed to SHIPPED');
    }

    // 4. Admin Cancels Order -> Triggers Automatic Stock Restoration!
    {
      const res = await request('PATCH', `/api/v1/orders/${placedOrderId}/status`, {
        status: 'CANCELLED'
      }, adminToken);
      assert(res.status === 200, 'Cancelling order returns 200 OK');
      assert(res.data.data.status === 'CANCELLED', 'Order status marked as CANCELLED');
    }

    // 5. Verify Stock was Restored back into Inventory!
    {
      const res = await request('GET', `/api/v1/products/${createdProductId}`);
      assert(res.data.data.stockQuantity === initialStock, `Stock was automatically restored to ${initialStock} upon cancellation`);
    }

    // 6. Customer Cancels Order directly via POST /orders/:id/cancel
    {
      // Add item to cart again
      await request('POST', '/api/v1/cart/items', {
        productId: createdProductId,
        quantity: 2
      }, customerToken);

      // Checkout to create a second order
      const checkoutRes = await request('POST', '/api/v1/orders/checkout', {
        shippingAddress: '42, Brigade Road, Bengaluru, Karnataka 560025',
        paymentMethod: 'UPI'
      }, customerToken);
      const secondOrderId = checkoutRes.data.data.id;
      assert(checkoutRes.status === 201, 'Customer placed second order for cancellation test');

      // Verify stock deducted by 2
      const stockAfterCheckout = await request('GET', `/api/v1/products/${createdProductId}`);
      assert(stockAfterCheckout.data.data.stockQuantity === initialStock - 2, 'Stock deducted by 2 for second order');

      // Customer cancels order via POST /api/v1/orders/:id/cancel
      const cancelRes = await request('POST', `/api/v1/orders/${secondOrderId}/cancel`, null, customerToken);
      assert(cancelRes.status === 200, 'Customer successfully cancelled order via POST /orders/:id/cancel');
      assert(cancelRes.data.data.status === 'CANCELLED', 'Order marked CANCELLED');

      // Verify stock restored back to initialStock
      const stockAfterCancel = await request('GET', `/api/v1/products/${createdProductId}`);
      assert(stockAfterCancel.data.data.stockQuantity === initialStock, 'Stock restored back to initial stock after customer cancellation');
    }

    // -----------------------------------------------------------
    // SUITE 8: Unmatched Route & Error Handling
    // -----------------------------------------------------------
    console.log('\n[Suite 8: Unmatched Route & Error Handling]');
    {
      const res = await request('GET', '/api/v1/unknown-endpoint-xyz');
      assert(res.status === 404, 'Unknown route returns 404 Not Found');
    }

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test Suite encountered an error:', err);
  process.exit(1);
});
