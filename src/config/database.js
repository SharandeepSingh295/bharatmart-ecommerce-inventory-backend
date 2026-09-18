const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('./env');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isNativeSqlite = false;
    this.inMemoryData = {
      users: [],
      categories: [],
      products: [],
      cart_items: [],
      orders: [],
      order_items: []
    };
  }

  init() {
    const dataDir = path.dirname(config.dbFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(config.dbFilePath);
      this.isNativeSqlite = true;
      this.initSqliteSchema();
      console.log(`[Database] Connected to SQLite database at: ${config.dbFilePath}`);
    } catch (err) {
      console.warn('[Database] Native SQLite unavailable or failed, falling back to persistent JSON storage:', err.message);
      this.isNativeSqlite = false;
      this.initJsonStorage(config.dbFilePath + '.json');
    }

    this.seedInitialData();
  }

  initSqliteSchema() {
    this.db.exec('PRAGMA foreign_keys = ON;');

    // 1. Users Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'CUSTOMER',
        address TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // 2. Categories Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      );
    `);

    // 3. Products Table (Inventory)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        stockQuantity INTEGER NOT NULL DEFAULT 0,
        categoryId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
      );
    `);

    // 4. Cart Items Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        productId TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(userId, productId)
      );
    `);

    // 5. Orders Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        shippingAddress TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        paymentMethod TEXT NOT NULL DEFAULT 'UPI',
        paymentStatus TEXT NOT NULL DEFAULT 'PAID',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT
      );
    `);

    // 6. Order Items Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productTitle TEXT NOT NULL,
        unitPrice REAL NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
      );
    `);

    // Performance Indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(categoryId);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(userId);
      CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(userId);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(orderId);
    `);
  }

  initJsonStorage(jsonPath) {
    this.jsonPath = jsonPath;
    if (fs.existsSync(this.jsonPath)) {
      try {
        const raw = fs.readFileSync(this.jsonPath, 'utf8');
        this.inMemoryData = JSON.parse(raw);
      } catch {
        this.inMemoryData = { users: [], categories: [], products: [], cart_items: [], orders: [], order_items: [] };
      }
    } else {
      this.saveJson();
    }
  }

  saveJson() {
    if (!this.isNativeSqlite && this.jsonPath) {
      fs.writeFileSync(this.jsonPath, JSON.stringify(this.inMemoryData, null, 2), 'utf8');
    }
  }

  seedInitialData() {
    // 1. Seed Users (Admin & Customer)
    const existingUsers = this.allUsers();
    if (existingUsers.length === 0) {
      console.log('[Database] Seeding initial Admin and Customer accounts with Indian profiles...');
      const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
      const customerPasswordHash = bcrypt.hashSync('Customer@123', 10);

      const seedUsers = [
        {
          id: 'usr_admin_01',
          name: 'Rajesh Sharma',
          email: 'admin@bharatmart.in',
          password: adminPasswordHash,
          phone: '+91 98201 23456',
          role: 'ADMIN',
          address: 'Suite 401, Cyber City, Gurugram, Haryana 122002',
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr_cust_01',
          name: 'Aarav Sharma',
          email: 'aarav.sharma@gmail.com',
          password: customerPasswordHash,
          phone: '+91 98765 11223',
          role: 'CUSTOMER',
          address: 'B-402, Surya Enclave, Sector 14, Rohini, New Delhi 110085',
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr_cust_02',
          name: 'Pooja Gupta',
          email: 'pooja.gupta@yahoo.co.in',
          password: customerPasswordHash,
          phone: '+91 98451 22334',
          role: 'CUSTOMER',
          address: 'Flat 12, Krishna Apartments, Malleshwaram, Bengaluru 560003',
          createdAt: new Date().toISOString()
        }
      ];

      for (const u of seedUsers) {
        this.insertUser(u);
      }
      console.log(`[Database] Successfully seeded ${seedUsers.length} users.`);
    }

    // 2. Seed Categories
    const existingCats = this.allCategories();
    if (existingCats.length === 0) {
      console.log('[Database] Seeding product categories...');
      const seedCats = [
        {
          id: 'cat_electronics',
          name: 'Electronics & Audio',
          slug: 'electronics-audio',
          description: 'Headphones, smartwatches, speakers, and mobile accessories',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat_fashion',
          name: 'Indian Apparel & Fashion',
          slug: 'indian-apparel-fashion',
          description: 'Kurtas, ethnic sets, cotton apparel, and Indian wear',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat_home',
          name: 'Home & Kitchen Appliances',
          slug: 'home-kitchen-appliances',
          description: 'Induction cooktops, flasks, and modern cookware',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat_wellness',
          name: 'Health & Ayurvedic Wellness',
          slug: 'health-ayurvedic-wellness',
          description: 'Immunity boosters, herbal care, and wellness essentials',
          createdAt: new Date().toISOString()
        }
      ];

      for (const cat of seedCats) {
        this.insertCategory(cat);
      }
      console.log(`[Database] Successfully seeded ${seedCats.length} categories.`);
    }

    // 3. Seed Products with Inventory Stock & INR pricing
    const existingProds = this.allProducts();
    if (existingProds.length === 0) {
      console.log('[Database] Seeding 8 Indian market products with inventory stock...');
      const seedProducts = [
        {
          id: 'prod_boat_450',
          sku: 'ELEC-BOAT-450',
          title: 'boAt Rockerz 450 Bluetooth On-Ear Headphones',
          description: 'Up to 15 hours battery playback, 40mm dynamic drivers, padded ear cushions, matte black finish.',
          price: 1499.0,
          stockQuantity: 45,
          categoryId: 'cat_electronics',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_fireboltt_watch',
          sku: 'ELEC-FB-NINJA',
          title: 'Fire-Boltt Ninja Call Pro Plus Smartwatch',
          description: '1.83 inch HD display, Bluetooth calling, 100+ sports modes, AI voice assistant, water resistant.',
          price: 1999.0,
          stockQuantity: 30,
          categoryId: 'cat_electronics',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_fabindia_kurta',
          sku: 'FASH-FAB-KHADI',
          title: 'FabIndia Pure Cotton Long Kurta (Mustard)',
          description: 'Breathable pure handspun cotton fabric, mandarin collar, side pockets, knee-length ethnic fit.',
          price: 1890.0,
          stockQuantity: 25,
          categoryId: 'cat_fashion',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_biba_suit',
          sku: 'FASH-BIBA-SET',
          title: 'Biba Printed Anarkali Kurta and Pant Set',
          description: 'Floral printed Anarkali silhouette with matching straight trousers and chiffon dupatta.',
          price: 2499.0,
          stockQuantity: 20,
          categoryId: 'cat_fashion',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_prestige_cooktop',
          sku: 'HOME-PRES-PIC20',
          title: 'Prestige Induction Cooktop PIC 20.0 (1200W)',
          description: 'Push-button Indian menu options, automatic voltage regulator, anti-magnetic wall design.',
          price: 2750.0,
          stockQuantity: 15,
          categoryId: 'cat_home',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_milton_flask',
          sku: 'HOME-MILT-FLASK',
          title: 'Milton Thermosteel Duo Deluxe Flask (1000ml)',
          description: 'Double walled vacuum insulated 304 stainless steel flask. Keeps beverages hot or cold for 24 hours.',
          price: 899.0,
          stockQuantity: 50,
          categoryId: 'cat_home',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_dabur_chyawan',
          sku: 'WELL-DAB-CHYW1',
          title: 'Dabur Chyawanprash 2X Immunity Booster (1 kg)',
          description: 'Formulated with 40+ Ayurvedic herbs including Amla, Ashwagandha, and Pippali for daily immunity.',
          price: 395.0,
          stockQuantity: 80,
          categoryId: 'cat_wellness',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod_patanjali_aloe',
          sku: 'WELL-PAT-ALOE',
          title: 'Patanjali Pure Kesh Kanti & Aloe Vera Care Kit',
          description: 'Natural herbal haircare and skincare combination pack with 90% natural active herbal extracts.',
          price: 249.0,
          stockQuantity: 60,
          categoryId: 'cat_wellness',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const p of seedProducts) {
        this.insertProduct(p);
      }
      console.log(`[Database] Successfully seeded ${seedProducts.length} products.`);
    }

    // 4. Seed a Sample Order for Aarav Sharma
    const existingOrders = this.allOrders();
    if (existingOrders.length === 0) {
      console.log('[Database] Seeding sample order history...');
      const sampleOrder = {
        id: 'ord_seed_001',
        userId: 'usr_cust_01',
        totalAmount: 2398.0,
        shippingAddress: 'B-402, Surya Enclave, Sector 14, Rohini, New Delhi 110085',
        status: 'PROCESSING',
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.insertOrder(sampleOrder);

      this.insertOrderItem({
        id: 'item_seed_001',
        orderId: 'ord_seed_001',
        productId: 'prod_boat_450',
        productTitle: 'boAt Rockerz 450 Bluetooth On-Ear Headphones',
        unitPrice: 1499.0,
        quantity: 1,
        subtotal: 1499.0
      });

      this.insertOrderItem({
        id: 'item_seed_002',
        orderId: 'ord_seed_001',
        productId: 'prod_milton_flask',
        productTitle: 'Milton Thermosteel Duo Deluxe Flask (1000ml)',
        unitPrice: 899.0,
        quantity: 1,
        subtotal: 899.0
      });
      console.log('[Database] Successfully seeded sample order with 2 line items.');
    }
  }

  // --- Users Queries ---
  allUsers() {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT id, name, email, phone, role, address, createdAt FROM users');
      return stmt.all();
    }
    return this.inMemoryData.users.map(({ password, ...rest }) => rest);
  }

  getUserById(id) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
      return stmt.get(id) || null;
    }
    return this.inMemoryData.users.find(u => u.id === id) || null;
  }

  getUserByEmail(email) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      return stmt.get(email.toLowerCase()) || null;
    }
    return this.inMemoryData.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  insertUser(user) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        INSERT INTO users (id, name, email, password, phone, role, address, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        user.id,
        user.name,
        user.email.toLowerCase(),
        user.password,
        user.phone,
        user.role || 'CUSTOMER',
        user.address,
        user.createdAt
      );
      return user;
    }
    this.inMemoryData.users.push({ ...user, email: user.email.toLowerCase() });
    this.saveJson();
    return user;
  }

  // --- Categories Queries ---
  allCategories() {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM categories ORDER BY name ASC');
      return stmt.all();
    }
    return [...this.inMemoryData.categories];
  }

  getCategoryById(id) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM categories WHERE id = ?');
      return stmt.get(id) || null;
    }
    return this.inMemoryData.categories.find(c => c.id === id) || null;
  }

  insertCategory(category) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        INSERT INTO categories (id, name, slug, description, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(category.id, category.name, category.slug, category.description || null, category.createdAt);
      return category;
    }
    this.inMemoryData.categories.push(category);
    this.saveJson();
    return category;
  }

  // --- Products & Inventory Queries ---
  allProducts() {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM products ORDER BY createdAt DESC');
      return stmt.all();
    }
    return [...this.inMemoryData.products];
  }

  getProductById(id) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        SELECT p.*, c.name as categoryName, c.slug as categorySlug
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        WHERE p.id = ?
      `);
      return stmt.get(id) || null;
    }
    const p = this.inMemoryData.products.find(x => x.id === id);
    if (!p) return null;
    const cat = this.inMemoryData.categories.find(c => c.id === p.categoryId);
    return { ...p, categoryName: cat ? cat.name : null, categorySlug: cat ? cat.slug : null };
  }

  getProductBySku(sku) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM products WHERE sku = ?');
      return stmt.get(sku.toUpperCase()) || null;
    }
    return this.inMemoryData.products.find(p => p.sku.toUpperCase() === sku.toUpperCase()) || null;
  }

  findProducts({ search, categoryId, minPrice, maxPrice, inStockOnly, page = 1, limit = 10 }) {
    if (this.isNativeSqlite) {
      const conditions = [];
      const params = [];

      if (search) {
        conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
        const s = `%${search}%`;
        params.push(s, s, s);
      }
      if (categoryId) {
        conditions.push('p.categoryId = ?');
        params.push(categoryId);
      }
      if (minPrice !== undefined) {
        conditions.push('p.price >= ?');
        params.push(Number(minPrice));
      }
      if (maxPrice !== undefined) {
        conditions.push('p.price <= ?');
        params.push(Number(maxPrice));
      }
      if (inStockOnly) {
        conditions.push('p.stockQuantity > 0');
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM products p ${whereClause}`);
      const countResult = countStmt.get(...params);
      const total = countResult ? Number(countResult.total) : 0;

      const offset = (page - 1) * limit;
      const dataStmt = this.db.prepare(`
        SELECT p.*, c.name as categoryName
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        ${whereClause}
        ORDER BY p.createdAt DESC
        LIMIT ? OFFSET ?
      `);
      const items = dataStmt.all(...params, limit, offset);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      };
    }

    let filtered = [...this.inMemoryData.products];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    if (categoryId) filtered = filtered.filter(p => p.categoryId === categoryId);
    if (minPrice !== undefined) filtered = filtered.filter(p => p.price >= Number(minPrice));
    if (maxPrice !== undefined) filtered = filtered.filter(p => p.price <= Number(maxPrice));
    if (inStockOnly) filtered = filtered.filter(p => p.stockQuantity > 0);

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    const items = paged.map(p => {
      const cat = this.inMemoryData.categories.find(c => c.id === p.categoryId);
      return { ...p, categoryName: cat ? cat.name : null };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  insertProduct(product) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        INSERT INTO products (id, sku, title, description, price, stockQuantity, categoryId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        product.id,
        product.sku.toUpperCase(),
        product.title,
        product.description,
        product.price,
        product.stockQuantity || 0,
        product.categoryId,
        product.createdAt,
        product.updatedAt
      );
      return product;
    }
    this.inMemoryData.products.push({ ...product, sku: product.sku.toUpperCase() });
    this.saveJson();
    return product;
  }

  updateProduct(id, updateData) {
    const updatedAt = new Date().toISOString();
    if (this.isNativeSqlite) {
      const current = this.getProductById(id);
      if (!current) return null;

      const title = updateData.title !== undefined ? updateData.title : current.title;
      const description = updateData.description !== undefined ? updateData.description : current.description;
      const price = updateData.price !== undefined ? updateData.price : current.price;
      const stockQuantity = updateData.stockQuantity !== undefined ? updateData.stockQuantity : current.stockQuantity;
      const categoryId = updateData.categoryId !== undefined ? updateData.categoryId : current.categoryId;

      const stmt = this.db.prepare(`
        UPDATE products
        SET title = ?, description = ?, price = ?, stockQuantity = ?, categoryId = ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(title, description, price, stockQuantity, categoryId, updatedAt, id);
      return this.getProductById(id);
    }

    const idx = this.inMemoryData.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.inMemoryData.products[idx] = { ...this.inMemoryData.products[idx], ...updateData, updatedAt };
      this.saveJson();
      return this.getProductById(id);
    }
    return null;
  }

  adjustProductStock(productId, delta) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        UPDATE products
        SET stockQuantity = stockQuantity + ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(delta, new Date().toISOString(), productId);
      return this.getProductById(productId);
    }
    const p = this.inMemoryData.products.find(x => x.id === productId);
    if (p) {
      p.stockQuantity += delta;
      p.updatedAt = new Date().toISOString();
      this.saveJson();
      return p;
    }
    return null;
  }

  deleteProduct(id) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
      stmt.run(id);
      return true;
    }
    const idx = this.inMemoryData.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.inMemoryData.products.splice(idx, 1);
      this.saveJson();
      return true;
    }
    return false;
  }

  // --- Cart Queries ---
  getCartByUser(userId) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        SELECT c.id, c.userId, c.productId, c.quantity, c.updatedAt,
               p.title as productTitle, p.sku, p.price as unitPrice, p.stockQuantity as availableStock,
               (c.quantity * p.price) as itemTotal
        FROM cart_items c
        JOIN products p ON c.productId = p.id
        WHERE c.userId = ?
        ORDER BY c.updatedAt DESC
      `);
      return stmt.all(userId);
    }
    return this.inMemoryData.cart_items
      .filter(c => c.userId === userId)
      .map(c => {
        const p = this.inMemoryData.products.find(x => x.id === c.productId);
        return {
          ...c,
          productTitle: p ? p.title : null,
          sku: p ? p.sku : null,
          unitPrice: p ? p.price : 0,
          availableStock: p ? p.stockQuantity : 0,
          itemTotal: p ? c.quantity * p.price : 0
        };
      });
  }

  getCartItem(userId, productId) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM cart_items WHERE userId = ? AND productId = ?');
      return stmt.get(userId, productId) || null;
    }
    return this.inMemoryData.cart_items.find(c => c.userId === userId && c.productId === productId) || null;
  }

  upsertCartItem(userId, productId, quantity) {
    const updatedAt = new Date().toISOString();
    if (this.isNativeSqlite) {
      const existing = this.getCartItem(userId, productId);
      if (existing) {
        const stmt = this.db.prepare('UPDATE cart_items SET quantity = ?, updatedAt = ? WHERE id = ?');
        stmt.run(quantity, updatedAt, existing.id);
      } else {
        const id = `cart_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        const stmt = this.db.prepare('INSERT INTO cart_items (id, userId, productId, quantity, updatedAt) VALUES (?, ?, ?, ?, ?)');
        stmt.run(id, userId, productId, quantity, updatedAt);
      }
      return this.getCartItem(userId, productId);
    }

    const item = this.inMemoryData.cart_items.find(c => c.userId === userId && c.productId === productId);
    if (item) {
      item.quantity = quantity;
      item.updatedAt = updatedAt;
    } else {
      const id = `cart_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      this.inMemoryData.cart_items.push({ id, userId, productId, quantity, updatedAt });
    }
    this.saveJson();
    return this.getCartItem(userId, productId);
  }

  removeCartItem(userId, productId) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('DELETE FROM cart_items WHERE userId = ? AND productId = ?');
      stmt.run(userId, productId);
      return true;
    }
    const idx = this.inMemoryData.cart_items.findIndex(c => c.userId === userId && c.productId === productId);
    if (idx !== -1) {
      this.inMemoryData.cart_items.splice(idx, 1);
      this.saveJson();
      return true;
    }
    return false;
  }

  clearUserCart(userId) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('DELETE FROM cart_items WHERE userId = ?');
      stmt.run(userId);
      return true;
    }
    this.inMemoryData.cart_items = this.inMemoryData.cart_items.filter(c => c.userId !== userId);
    this.saveJson();
    return true;
  }

  // --- Orders Queries ---
  allOrders() {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM orders ORDER BY createdAt DESC');
      return stmt.all();
    }
    return [...this.inMemoryData.orders];
  }

  getOrderById(orderId) {
    if (this.isNativeSqlite) {
      const orderStmt = this.db.prepare(`
        SELECT o.*, u.name as customerName, u.email as customerEmail, u.phone as customerPhone
        FROM orders o
        JOIN users u ON o.userId = u.id
        WHERE o.id = ?
      `);
      const order = orderStmt.get(orderId);
      if (!order) return null;

      const itemsStmt = this.db.prepare('SELECT * FROM order_items WHERE orderId = ?');
      const items = itemsStmt.all(orderId);

      return { ...order, items };
    }

    const order = this.inMemoryData.orders.find(o => o.id === orderId);
    if (!order) return null;
    const user = this.inMemoryData.users.find(u => u.id === order.userId);
    const items = this.inMemoryData.order_items.filter(i => i.orderId === orderId);
    return {
      ...order,
      customerName: user ? user.name : null,
      customerEmail: user ? user.email : null,
      customerPhone: user ? user.phone : null,
      items
    };
  }

  getOrdersByUser(userId) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC');
      const orders = stmt.all(userId);
      return orders.map(o => {
        const itemsStmt = this.db.prepare('SELECT * FROM order_items WHERE orderId = ?');
        return { ...o, items: itemsStmt.all(o.id) };
      });
    }

    return this.inMemoryData.orders
      .filter(o => o.userId === userId)
      .map(o => ({
        ...o,
        items: this.inMemoryData.order_items.filter(i => i.orderId === o.id)
      }));
  }

  findOrders({ status, page = 1, limit = 10 }) {
    if (this.isNativeSqlite) {
      const conditions = [];
      const params = [];

      if (status) {
        conditions.push('o.status = ?');
        params.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM orders o ${whereClause}`);
      const countResult = countStmt.get(...params);
      const total = countResult ? Number(countResult.total) : 0;

      const offset = (page - 1) * limit;
      const dataStmt = this.db.prepare(`
        SELECT o.*, u.name as customerName, u.email as customerEmail
        FROM orders o
        JOIN users u ON o.userId = u.id
        ${whereClause}
        ORDER BY o.createdAt DESC
        LIMIT ? OFFSET ?
      `);
      const items = dataStmt.all(...params, limit, offset);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      };
    }

    let filtered = [...this.inMemoryData.orders];
    if (status) filtered = filtered.filter(o => o.status === status);
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    const items = paged.map(o => {
      const u = this.inMemoryData.users.find(x => x.id === o.userId);
      return { ...o, customerName: u ? u.name : null, customerEmail: u ? u.email : null };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  insertOrder(order) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        INSERT INTO orders (id, userId, totalAmount, shippingAddress, status, paymentMethod, paymentStatus, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        order.id,
        order.userId,
        order.totalAmount,
        order.shippingAddress,
        order.status || 'PENDING',
        order.paymentMethod || 'UPI',
        order.paymentStatus || 'PAID',
        order.createdAt,
        order.updatedAt
      );
      return order;
    }
    this.inMemoryData.orders.push(order);
    this.saveJson();
    return order;
  }

  insertOrderItem(item) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        INSERT INTO order_items (id, orderId, productId, productTitle, unitPrice, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(item.id, item.orderId, item.productId, item.productTitle, item.unitPrice, item.quantity, item.subtotal);
      return item;
    }
    this.inMemoryData.order_items.push(item);
    this.saveJson();
    return item;
  }

  updateOrderStatus(orderId, status) {
    const updatedAt = new Date().toISOString();
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?');
      stmt.run(status, updatedAt, orderId);
      return this.getOrderById(orderId);
    }
    const o = this.inMemoryData.orders.find(x => x.id === orderId);
    if (o) {
      o.status = status;
      o.updatedAt = updatedAt;
      this.saveJson();
      return this.getOrderById(orderId);
    }
    return null;
  }

  // --- Atomic Transaction Runner for Checkout ---
  runTransaction(callback) {
    if (this.isNativeSqlite) {
      this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
      try {
        const result = callback();
        this.db.exec('COMMIT;');
        return result;
      } catch (err) {
        this.db.exec('ROLLBACK;');
        throw err;
      }
    }
    return callback();
  }
}

const databaseManager = new DatabaseManager();
databaseManager.init();

module.exports = databaseManager;
