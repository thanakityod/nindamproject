require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  bcrypt = require('bcrypt');
}
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3108;
const JWT_SECRET = process.env.JWT_SECRET || 'digital_watch_jwt_secret_std6730251468_2026';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Database connection pool
let pool = null;
let isMySqlAvailable = false;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'std6730251468',
    password: process.env.DB_PASSWORD || 'H7^b0Ami',
    database: process.env.DB_NAME || 'ip_std6730251468',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: false,
    connectTimeout: 3000,
    connectionLimit: 10,
    timezone: '+07:00'
  });
} catch (e) {
  console.log('MySQL init warning:', e.message);
}

// Local fallback DB
const LOCAL_DB_PATH = path.join(__dirname, 'local_db.json');
function readLocalDb() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
  } catch (e) {
    return { users: [], products: [], clusters: [] };
  }
}
function writeLocalDb(data) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

async function testConnection() {
  if (!pool) return;
  try {
    const conn = await pool.getConnection();
    console.log(`✅ Connected to MySQL: ${process.env.DB_NAME || 'ip_std6730251468'}`);
    isMySqlAvailable = true;
    conn.release();
  } catch (err) {
    console.log(`ℹ️ MySQL connection warning: ${err.message}. Using fallback if needed.`);
    isMySqlAvailable = false;
  }
}
testConnection();

function getComputedStatus(stock) {
  const numericStock = Number(stock ?? 0);
  if (numericStock <= 0) return 'Out of Stock';
  if (numericStock < 10) return 'Low Stock';
  return 'In Stock';
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Access Token Required (401)' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or Expired Token (403)' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden: Admin access required' });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Digital Watch API is running!',
    database: isMySqlAvailable ? `MySQL (${process.env.DB_NAME || 'ip_std6730251468'})` : 'Local Fallback',
    status: 'online',
    port: PORT
  });
});

app.get('/api', (req, res) => {
  res.send('API is running');
});

// Dr. Somsawut endpoint
app.get('/nindam_pro_api', async (req, res) => {
  try {
    if (isMySqlAvailable) {
      const [rows] = await pool.query('SELECT * FROM `Products` ORDER BY Product_ID ASC');
      return res.status(200).json({ success: true, total: rows.length, data: rows });
    }
    const db = readLocalDb();
    res.status(200).json({ success: true, total: db.products.length, data: db.products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================================
// PRODUCTS API (Queries MySQL directly!)
// ==============================================================
app.get('/api/products', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const categoryFilter = String(req.query.category || '').trim();

    if (isMySqlAvailable) {
      let sql = 'SELECT * FROM `Products`';
      let where = [];
      let params = [];

      if (query) {
        where.push('(Name LIKE ? OR details LIKE ? OR Productcode LIKE ? OR Category LIKE ?)');
        const wild = `%${query}%`;
        params.push(wild, wild, wild, wild);
      }

      if (categoryFilter && categoryFilter !== 'All') {
        where.push('Category = ?');
        params.push(categoryFilter);
      }

      if (where.length > 0) {
        sql += ' WHERE ' + where.join(' AND ');
      }

      sql += ' ORDER BY Product_ID ASC';

      const [rows] = await pool.query(sql, params);
      const mapped = rows.map((r) => ({
        id: String(r.Productcode || r.Product_ID),
        Productcode: r.Productcode,
        name: r.Name,
        Name: r.Name,
        details: r.details || '',
        price: Number(r.price || 0),
        monthly_sales: Number(r.monthly_sales || 0),
        color: r.color || '',
        size: r.size || '',
        stock: Number(r.Stock ?? 0),
        Stock: Number(r.Stock ?? 0),
        category: r.Category || 'Casual LED',
        Category: r.Category || 'Casual LED',
        location_text: r.Location || 'Warehouse Sriracha',
        Location: r.Location || 'Warehouse Sriracha',
        image_url: r.image || '',
        image: r.image || '',
        stock_text: `${r.Stock ?? 0} in stock`,
        status: getComputedStatus(r.Stock)
      }));

      return res.json({
        items: mapped,
        total: mapped.length,
        page: 1,
        limit: 100
      });
    }

    // Local DB fallback
    const db = readLocalDb();
    res.json({ items: db.products || [], total: (db.products || []).length, page: 1, limit: 100 });
  } catch (error) {
    console.error('Products error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

function getProductLookup(id) {
  const idStr = String(id || '').trim();
  const isNumeric = /^\d+$/.test(idStr);
  if (isNumeric) {
    return { clause: '(Product_ID = ? OR Productcode = ?)', params: [Number(idStr), idStr] };
  }
  return { clause: 'Productcode = ?', params: [idStr] };
}

// Single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMySqlAvailable) {
      const lookup = getProductLookup(id);
      const [rows] = await pool.query(`SELECT * FROM \`Products\` WHERE ${lookup.clause} LIMIT 1`, lookup.params);
      if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
      const r = rows[0];
      return res.json({
        id: String(r.Productcode),
        name: r.Name,
        details: r.details,
        price: Number(r.price),
        monthly_sales: Number(r.monthly_sales),
        color: r.color,
        size: r.size,
        stock: Number(r.Stock),
        category: r.Category,
        location_text: r.Location,
        image_url: r.image,
        status: getComputedStatus(r.Stock)
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add Product (into MySQL)
app.post('/api/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, name, details = '', price = 0, stock = 0, category = 'Casual LED', location_text = 'Warehouse Sriracha', image_url = '', color = '', size = '' } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const code = String(id || `DW-${Date.now().toString().slice(-4)}`).trim();

    if (isMySqlAvailable) {
      await pool.query(
        `INSERT INTO \`Products\` 
          (Productcode, Name, details, price, monthly_sales, color, size, Stock, Category, Location, image, LastUpdate)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, NOW())`,
        [code, name, details, Number(price) || 0, color, size, Number(stock) || 0, category, location_text, image_url]
      );
      return res.status(201).json({ success: true, productId: code });
    }

    const db = readLocalDb();
    db.products.unshift({ id: code, Productcode: code, name, details, price, stock, category, location_text, image_url, color, size });
    writeLocalDb(db);
    res.status(201).json({ success: true, productId: code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit Product (in MySQL)
app.put('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (isMySqlAvailable) {
      const lookup = getProductLookup(id);
      const [result] = await pool.query(
        `UPDATE \`Products\` SET
          Name = ?, details = ?, price = ?, color = ?, size = ?, Stock = ?, Category = ?, Location = ?, image = ?, LastUpdate = NOW()
         WHERE ${lookup.clause}`,
        [
          body.name, body.details || '', Number(body.price) || 0, body.color || '', body.size || '',
          Number(body.stock) || 0, body.category || 'Casual LED', body.location_text || 'Warehouse Sriracha',
          body.image_url || '', ...lookup.params
        ]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Product (from MySQL)
app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (isMySqlAvailable) {
      const lookup = getProductLookup(id);
      const [result] = await pool.query(`DELETE FROM \`Products\` WHERE ${lookup.clause}`, lookup.params);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json({ success: true, message: 'Product deleted' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Categories (from MySQL)
app.get('/api/categories', async (req, res) => {
  try {
    if (isMySqlAvailable) {
      const [rows] = await pool.query(`
        SELECT 
          COALESCE(Category, 'Uncategorized') as name,
          COALESCE(Category, 'Uncategorized') as id,
          COUNT(*) as count,
          SUM(COALESCE(Stock, 0)) as stock_total
        FROM \`Products\`
        GROUP BY Category
        ORDER BY count DESC
      `);
      return res.json(rows);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==============================================================
// ORDERS / CHECKOUT API (GUWATCH888 E-Commerce)
// ==============================================================
app.post('/api/orders', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      shipping_address,
      payment_method = 'promptpay',
      items = [],
      user_id = null
    } = req.body || {};

    if (!customer_name || !customer_phone || !shipping_address) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อ, เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'ไม่มีสินค้าในตะกร้า' });
    }

    let calculatedTotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const pCode = String(item.product_code || item.id || item.Productcode || '');
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.price) || 0;
      const subtotal = price * qty;
      calculatedTotal += subtotal;
      orderItemsData.push({
        product_code: pCode,
        product_name: String(item.name || item.Name || 'Digital Watch'),
        price,
        quantity: qty,
        subtotal
      });
    }

    const orderNo = `GU888-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    if (isMySqlAvailable) {
      // 1. Create order
      const [orderResult] = await pool.query(
        `INSERT INTO \`Orders\` 
          (order_no, user_id, customer_name, customer_phone, shipping_address, payment_method, total_amount, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', NOW())`,
        [orderNo, user_id, customer_name, customer_phone, shipping_address, payment_method, calculatedTotal]
      );
      const insertedOrderId = orderResult.insertId;

      // 2. Insert items and deduct stock
      for (const it of orderItemsData) {
        await pool.query(
          `INSERT INTO \`OrderItems\` (order_id, product_code, product_name, price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [insertedOrderId, it.product_code, it.product_name, it.price, it.quantity, it.subtotal]
        );

        // Deduct stock in Products table
        await pool.query(
          `UPDATE \`Products\` SET Stock = GREATEST(0, Stock - ?), monthly_sales = monthly_sales + ? WHERE Productcode = ?`,
          [it.quantity, it.quantity, it.product_code]
        );
      }

      console.log(`🛒 New Order placed: ${orderNo} Total: ฿${calculatedTotal} by ${customer_name}`);

      return res.status(201).json({
        success: true,
        order_no: orderNo,
        order_id: insertedOrderId,
        total_amount: calculatedTotal,
        payment_method,
        status: 'paid',
        customer_name,
        created_at: new Date().toISOString(),
        items: orderItemsData
      });
    }

    // Fallback if local
    const db = readLocalDb();
    if (!db.orders) db.orders = [];
    const newOrder = {
      order_id: Date.now(),
      order_no: orderNo,
      user_id,
      customer_name,
      customer_phone,
      shipping_address,
      payment_method,
      total_amount: calculatedTotal,
      status: 'paid',
      created_at: new Date().toISOString(),
      items: orderItemsData
    };
    db.orders.unshift(newOrder);
    writeLocalDb(db);
    res.status(201).json({ success: true, ...newOrder });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all orders
app.get('/api/orders', async (req, res) => {
  try {
    if (isMySqlAvailable) {
      const [rows] = await pool.query(`
        SELECT 
          o.*,
          (SELECT COUNT(*) FROM \`OrderItems\` oi WHERE oi.order_id = o.order_id) as item_count
        FROM \`Orders\` o
        ORDER BY o.created_at DESC
        LIMIT 50
      `);
      return res.json({ success: true, orders: rows });
    }
    const db = readLocalDb();
    res.json({ success: true, orders: db.orders || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single order detail
app.get('/api/orders/:order_no', async (req, res) => {
  try {
    const { order_no } = req.params;
    if (isMySqlAvailable) {
      const [orders] = await pool.query('SELECT * FROM `Orders` WHERE order_no = ? LIMIT 1', [order_no]);
      if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
      const order = orders[0];
      const [items] = await pool.query('SELECT * FROM `OrderItems` WHERE order_id = ?', [order.order_id]);
      return res.json({ success: true, order: { ...order, items } });
    }
    const db = readLocalDb();
    const order = (db.orders || []).find((o) => o.order_no === order_no);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================================
// AUTHENTICATION (Directly in MySQL table `user`)
// ==============================================================
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sign Up: Saves ID, Username, Email, Bcrypt Password into MySQL
app.post('/api/auth/register', async (req, res) => {
  try {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');
    const email = String(req.body?.email ?? '').trim();
    const role = req.body?.role === 'admin' ? 'admin' : 'user';

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 chars' });
    if (password.length < 5) return res.status(400).json({ error: 'Password must be at least 5 chars' });
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Invalid email address' });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isMySqlAvailable) {
      const [existingUser] = await pool.query('SELECT user_id FROM `user` WHERE username = ? LIMIT 1', [username]);
      if (existingUser.length > 0) return res.status(409).json({ error: 'Username already exists' });

      const [existingEmail] = await pool.query('SELECT user_id FROM `user` WHERE email = ? LIMIT 1', [email]);
      if (existingEmail.length > 0) return res.status(409).json({ error: 'Email already registered' });

      const [result] = await pool.query(
        'INSERT INTO `user` (username, password, email, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        [username, hashedPassword, email, role]
      );
      const newUser = { user_id: result.insertId, username, email, role };
      console.log(`✅ New user registered in MySQL DB ip_std6730251468: ID=${result.insertId}, User=${username}`);
      return res.status(201).json({
        success: true,
        message: 'Account saved to MySQL Database',
        token: createToken(newUser),
        user: newUser
      });
    }
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    if (isMySqlAvailable) {
      const [rows] = await pool.query('SELECT * FROM `user` WHERE username = ? LIMIT 1', [username]);
      if (rows.length > 0 && (await bcrypt.compare(password, rows[0].password))) {
        const u = rows[0];
        const safe = { user_id: u.user_id, username: u.username, email: u.email, role: u.role };
        return res.json({ success: true, token: createToken(safe), user: safe });
      }
    }
    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Clusters (K-Means)
app.get('/api/clusters', async (req, res) => {
  try {
    if (isMySqlAvailable) {
      const [products] = await pool.query('SELECT Productcode, price, monthly_sales FROM `Products`');
      if (products.length === 0) return res.json({ generated_at: null, clusters: [], products: [] });

      const prices = products.map((p) => Number(p.price || 0));
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const t1 = minP + (maxP - minP) / 3;
      const t2 = minP + (2 * (maxP - minP)) / 3;

      const clustered = products.map((p) => {
        const pr = Number(p.price || 0);
        const cluster = pr <= t1 ? 'low' : pr <= t2 ? 'medium' : 'high';
        return {
          id: p.Productcode,
          cluster,
          price: pr,
          monthly_sales: Number(p.monthly_sales || 30)
        };
      });

      const summaries = ['low', 'medium', 'high'].map((label) => {
        const items = clustered.filter((x) => x.cluster === label);
        const prs = items.map((x) => x.price);
        const sales = items.map((x) => x.monthly_sales);
        return {
          cluster: label,
          product_count: items.length,
          average_price: prs.length ? Math.round(prs.reduce((a, b) => a + b, 0) / prs.length) : 0,
          min_price: prs.length ? Math.min(...prs) : 0,
          max_price: prs.length ? Math.max(...prs) : 0,
          average_monthly_sales: sales.length ? Math.round(sales.reduce((a, b) => a + b, 0) / sales.length) : 0,
          total_monthly_sales: sales.reduce((a, b) => a + b, 0)
        };
      });

      return res.json({
        generated_at: new Date().toISOString(),
        clusters: summaries,
        products: clustered
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Digital Watch API server is running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints: http://localhost:${PORT}/api/products`);
  console.log(`🏷️ Nindam endpoint: http://localhost:${PORT}/nindam_pro_api`);
});
