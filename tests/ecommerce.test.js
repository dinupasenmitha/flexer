// ============================================================
// FLEXER EYEWEAR — Comprehensive Automated Test Suite
// Testing Catalogue, Server Pricing, Bank Transfer, COD,
// Koko Fallback, Slip Privacy, Admin Auth, and Audit Trails
// ============================================================

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Keep test orders and stock mutations out of the production-like local database.
process.env.FLEXER_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'flexer-test-'));
const app = require('../server/server');
const { db } = require('../server/db');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Server] Running at ${baseUrl}`);
      resolve();
    });
  });
});

test.after(() => {
  if (server) server.close();
});

// Helper for unique test phone
const adminToken = require('../server/auth').generateToken({ id: 1, username: 'admin', role: 'admin' });
const adminHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminToken };

test('Product photography upload rejects unauthenticated and disguised files', async () => {
  const image = 'data:image/png;base64,' + Buffer.from('not an image').toString('base64');
  const denied = await fetch(baseUrl + '/api/products/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) });
  assert.strictEqual(denied.status, 401);
  const invalid = await fetch(baseUrl + '/api/products/images', { method: 'POST', headers: adminHeaders, body: JSON.stringify({ image }) });
  assert.strictEqual(invalid.status, 400);
});

test('Merchant content requires authentication and drafts remain private', async () => {
  const draft = { kind: 'review', title: 'Test customer', body: 'Test feedback', rating: 4, published: false };
  const denied = await fetch(baseUrl + '/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
  assert.strictEqual(denied.status, 401);
  const saved = await fetch(baseUrl + '/api/content', { method: 'POST', headers: adminHeaders, body: JSON.stringify(draft) });
  assert.strictEqual(saved.status, 200);
  const publicList = await (await fetch(baseUrl + '/api/content?kind=review')).json();
  assert.strictEqual(publicList.length, 0);
});

test('Stock zero and unavailable variants survive updates; failed updates roll back', async () => {
  const product = db.prepare('SELECT * FROM products WHERE id = 1').get();
  const variant = db.prepare('SELECT * FROM product_variants WHERE product_id = 1 LIMIT 1').get();
  const response = await fetch(baseUrl + '/api/products/1', {
    method: 'PUT', headers: adminHeaders, body: JSON.stringify({ variants: [{ ...variant, stock_quantity: 0, is_available: false }] })
  });
  assert.strictEqual(response.status, 200);
  const updated = await response.json();
  assert.strictEqual(updated.variants[0].stock_quantity, 0);
  assert.strictEqual(updated.variants[0].is_available, false);
  const foreign = db.prepare('SELECT sku FROM product_variants WHERE product_id != 1 LIMIT 1').get();
  const failed = await fetch(baseUrl + '/api/products/1', {
    method: 'PUT', headers: adminHeaders, body: JSON.stringify({ name: 'Should roll back', variants: [{ ...variant, sku: foreign.sku }] })
  });
  assert.strictEqual(failed.status, 500);
  assert.strictEqual(db.prepare('SELECT name FROM products WHERE id = 1').get().name, product.name);
  assert.strictEqual(db.prepare('SELECT stock_quantity FROM product_variants WHERE product_id = 1').get().stock_quantity, 0);
  // Restore the fixture needed by the checkout tests.
  db.prepare('UPDATE product_variants SET stock_quantity = ?, is_available = 1 WHERE product_id = 1').run(variant.stock_quantity);
});

function uniquePhone() {
  return '07' + Math.floor(10000000 + Math.random() * 90000000);
}

// 1. Health Check
test('GET /api/health should return healthy status and brand info', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'healthy');
  assert.strictEqual(data.brand, 'FLEXER');
});

test('public routes serve built pages with security headers and no public admin link', async () => {
  const publicRoutes = ['/', '/shop', '/budget', '/premium', '/branded', '/cart', '/tracking', '/product/thinner-flex', '/checkout', '/about', '/contact', '/shipping', '/returns', '/warranty', '/privacy', '/terms', '/faq', '/testimonials', '/newsletter'];
  for (const route of publicRoutes) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.strictEqual(response.status, 200, `${route} should be available`);
    assert.match(response.headers.get('content-security-policy') || '', /default-src 'self'/);
  }

  const home = await (await fetch(`${baseUrl}/`)).text();
  assert.doesNotMatch(home, /href=["']\/?admin/i, 'Admin must not appear in public navigation');

  const admin = await (await fetch(`${baseUrl}/admin`)).text();
  assert.match(admin, /noindex,nofollow/i, 'Admin must be excluded from search indexing');
});

// 2. Product Catalogue
test('GET /api/products should return active products with variants', async () => {
  const res = await fetch(`${baseUrl}/api/products`);
  assert.strictEqual(res.status, 200);
  const products = await res.json();
  assert.ok(products.length >= 5, 'Should have at least 5 products seeded');

  // Verify Thinner Flex (from live site) exists
  const thinnerFlex = products.find(p => p.sku === 'FLX-B-001');
  assert.ok(thinnerFlex, 'Thinner Flex should be in catalogue');
  assert.strictEqual(thinnerFlex.price, 1690);
  assert.strictEqual(thinnerFlex.category, 'budget');
  assert.ok(Array.isArray(thinnerFlex.variants), 'Product should have variants array');
  assert.ok(thinnerFlex.variants.length > 0, 'Should have color variants');
});

test('GET /api/products with category filter should filter accurately', async () => {
  const res = await fetch(`${baseUrl}/api/products?category=premium`);
  assert.strictEqual(res.status, 200);
  const products = await res.json();
  assert.ok(products.length > 0);
  products.forEach(p => assert.strictEqual(p.category, 'premium'));
});

test('GET /api/settings exposes only storefront-safe settings', async () => {
  const res = await fetch(`${baseUrl}/api/settings`);
  assert.strictEqual(res.status, 200);
  const settings = await res.json();
  assert.ok(settings.whatsapp_number);
  assert.strictEqual(settings.bank_account_number, undefined);
  assert.strictEqual(settings.koko_merchant_id, undefined);
});

test('POST /api/orders rejects Koko before merchant credentials are enabled', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Disabled Koko Test',
      phone: uniquePhone(),
      address: '1 Test Lane',
      city: 'Colombo',
      district: 'Colombo',
      payment_method: 'koko',
      items: [{ id: 1, qty: 1 }]
    })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /not available yet/i);
});

// 3. Price Integrity & Tampering Protection
test('POST /api/orders should reject tampered client prices and use authoritative DB price', async () => {
  const phone = uniquePhone();
  const tamperedPayload = {
    customer_name: 'Security Test Customer',
    phone,
    whatsapp_number: phone,
    address: '10 Galle Road',
    city: 'Colombo 03',
    district: 'Colombo',
    payment_method: 'cod',
    items: [
      {
        id: 1,
        qty: 2,
        price: 100 // Tampered price attempt!
      }
    ]
  };

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tamperedPayload)
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();

  // Authoritative subtotal must be 1690 * 2 = 3380 LKR, NOT 200 LKR!
  assert.strictEqual(data.subtotal, 3380, 'Server must enforce authoritative database price!');
  assert.strictEqual(data.total_payable, 3380);
});

// 4. District Validation
test('POST /api/orders should reject invalid non-Sri Lankan district', async () => {
  const invalidPayload = {
    customer_name: 'District Test Customer',
    phone: uniquePhone(),
    address: '10 Fake St',
    city: 'Nowhere',
    district: 'California', // Invalid district
    payment_method: 'cod',
    items: [{ id: 1, qty: 1 }]
  };

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidPayload)
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('25 administrative districts'));
});

test('POST /api/orders rejects unavailable quantities and invalid colorways', async () => {
  const basePayload = {
    customer_name: 'Stock Validation Customer',
    phone: uniquePhone(),
    address: '10 Stock Lane',
    city: 'Colombo',
    district: 'Colombo',
    payment_method: 'cod'
  };

  const overStock = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...basePayload, items: [{ id: 5, variant_sku: 'FLX-BR-001-TI', qty: 6 }] })
  });
  assert.strictEqual(overStock.status, 400);

  const badVariant = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...basePayload, phone: uniquePhone(), items: [{ id: 1, variant_sku: 'NOT-A-REAL-VARIANT', qty: 1 }] })
  });
  assert.strictEqual(badVariant.status, 400);
});

// 5. Order Creation & Bank Transfer Flow (With Privacy Assurance)
test('POST /api/orders with bank_transfer should create order before WhatsApp with collision-safe ref', async () => {
  const phone = uniquePhone();
  const orderPayload = {
    customer_name: 'Bank Customer ' + Date.now().toString(36),
    phone,
    whatsapp_number: phone,
    address: '45 Peradeniya Road',
    city: 'Kandy',
    district: 'Kandy',
    payment_method: 'bank_transfer',
    items: [{ id: 3, qty: 1 }] // S1 Obsidian (7950 LKR)
  };

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();

  // Verify human-readable daily reference format FLX-YYYYMMDD-0001
  assert.match(data.order_ref, /^FLX-\d{8}-\d{4}$/);
  assert.strictEqual(data.order_status, 'pending');
  assert.strictEqual(data.payment_status, 'awaiting_transfer');
  assert.strictEqual(data.total_payable, 7950);
  assert.ok(data.bank_details, 'Bank details should be returned to customer');
  assert.ok(data.bank_details.account_number);

  // Verify database record exists
  const orderRow = db.prepare('SELECT * FROM orders WHERE order_ref = ?').get(data.order_ref);
  assert.ok(orderRow, 'Order record must be permanently created in SQLite database!');
  assert.strictEqual(orderRow.payment_status, 'awaiting_transfer');

  // Verify audit log exists
  const auditRow = db.prepare('SELECT * FROM order_audit_logs WHERE order_id = ?').get(orderRow.id);
  assert.ok(auditRow, 'Audit log entry must be created');
});

// 6. Cash on Delivery Flow
test('POST /api/orders with cod should set payment_status to due_on_delivery', async () => {
  const phone = uniquePhone();
  const codPayload = {
    customer_name: 'COD Customer ' + Date.now().toString(36),
    phone,
    address: '78 Main St',
    city: 'Galle',
    district: 'Galle',
    payment_method: 'cod',
    items: [{ id: 2, qty: 1 }] // Aero Slim (2850 LKR)
  };

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(codPayload)
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.payment_status, 'due_on_delivery');
  assert.strictEqual(data.order_status, 'pending');
});

// 7. Koko Payment Boundary
test('Koko remains unavailable even with credentials until a verified adapter exists', async () => {
  // Koko is intentionally unavailable by default. Simulate the admin having
  // enabled merchant credentials before testing the supported checkout path.
  const now = new Date().toISOString();
  const set = db.prepare(`
    INSERT INTO settings (key, value, description, updated_at)
    VALUES (?, ?, '', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  set.run('koko_enabled', '1', now);
  set.run('koko_merchant_id', 'TEST_MERCHANT', now);
  set.run('koko_api_key', 'test_api_key', now);
  const phone = uniquePhone();
  const kokoPayload = {
    customer_name: 'Koko Customer ' + Date.now().toString(36),
    phone,
    address: '15 Sea Avenue',
    city: 'Colombo 03',
    district: 'Colombo',
    payment_method: 'koko',
    items: [{ id: 4, qty: 1 }] // S2 Phantom (8650 LKR)
  };

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kokoPayload)
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /approved merchant integration/);

  // Initiate Koko workflow
  const initRes = await fetch(`${baseUrl}/api/koko/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_ref: 'UNVERIFIED' })
  });

  assert.strictEqual(initRes.status, 503);
  const order = db.prepare('SELECT * FROM orders LIMIT 1').get();
  const callback = await fetch(baseUrl + '/api/koko/webhook', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: order.order_ref, status: 'SUCCESS' })
  });
  assert.strictEqual(callback.status, 503);
  assert.strictEqual(db.prepare('SELECT payment_status FROM orders WHERE id = ?').get(order.id).payment_status, order.payment_status);
});

// 8. Admin Security & Payment Verification
test('GET /api/orders without auth token must return 401 Unauthorized', async () => {
  const res = await fetch(`${baseUrl}/api/orders`);
  assert.strictEqual(res.status, 401);
});

test('POST /api/auth/login and payment verification workflow', async () => {
  // Login with seeded admin credentials
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'flexer2026!admin' })
  });

  assert.strictEqual(loginRes.status, 200);
  const auth = await loginRes.json();
  assert.ok(auth.token, 'Must return JWT token');

  // Fetch admin orders list with token
  const ordersRes = await fetch(`${baseUrl}/api/orders`, {
    headers: { 'Authorization': `Bearer ${auth.token}` }
  });
  assert.strictEqual(ordersRes.status, 200);
  const orders = await ordersRes.json();
  assert.ok(orders.length > 0);

  // Find an awaiting_transfer order and verify payment
  const pendingOrder = orders.find(o => o.payment_status === 'awaiting_transfer');
  assert.ok(pendingOrder, 'Should have a pending order to verify');

  const verifyRes = await fetch(`${baseUrl}/api/orders/${pendingOrder.id}/payment-verify`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    },
    body: JSON.stringify({
      verified: true,
      transaction_ref: 'TXN-COMBANK-98214',
      notes: 'Slip matched against bank statement'
    })
  });

  assert.strictEqual(verifyRes.status, 200);
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyData.payment_status, 'verified_paid');
  assert.strictEqual(verifyData.verified_by, 'admin');

  const paidOrder = db.prepare('SELECT order_status FROM orders WHERE id = ?').get(pendingOrder.id);
  assert.strictEqual(paidOrder.order_status, 'paid');

  const invalidDecision = await fetch(`${baseUrl}/api/orders/${pendingOrder.id}/payment-verify`, {
    method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ verified: 'false' })
  });
  assert.strictEqual(invalidDecision.status, 400);
  const statusUpdate = await fetch(`${baseUrl}/api/orders/${pendingOrder.id}/status`, {
    method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ status: 'processing', note: 'Ready for packing' })
  });
  assert.strictEqual(statusUpdate.status, 200);
  const privateHistory = await fetch(`${baseUrl}/api/orders/${pendingOrder.id}/history`);
  assert.strictEqual(privateHistory.status, 401);
  const history = await (await fetch(`${baseUrl}/api/orders/${pendingOrder.id}/history`, { headers: adminHeaders })).json();
  assert.ok(history.some(entry => entry.action === 'status_updated' && JSON.parse(entry.details).note === 'Ready for packing'));

  const unauthenticatedExport = await fetch(`${baseUrl}/api/orders/export.csv`);
  assert.strictEqual(unauthenticatedExport.status, 401);

  const exportRes = await fetch(`${baseUrl}/api/orders/export.csv`, {
    headers: { 'Authorization': `Bearer ${auth.token}` }
  });
  assert.strictEqual(exportRes.status, 200);
  assert.match(exportRes.headers.get('content-type') || '', /text\/csv/);
  assert.match(await exportRes.text(), /order_ref,customer_name/);

  // Check audit log recorded verifying user and timestamp
  const paymentRecord = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(pendingOrder.id);
  assert.ok(paymentRecord);
  assert.strictEqual(paymentRecord.transaction_ref, 'TXN-COMBANK-98214');
  assert.strictEqual(paymentRecord.verified_by, 'admin');

  // Check that admin stats now reflect this verified revenue
  const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { 'Authorization': `Bearer ${auth.token}` }
  });
  const stats = await statsRes.json();
  assert.ok(stats.verified_revenue >= pendingOrder.total_payable);
});

// 9. WhatsApp Event Tracking
test('POST /api/orders/:ref/whatsapp-click should record event without changing payment status', async () => {
  const order = db.prepare('SELECT * FROM orders LIMIT 1').get();
  assert.ok(order);

  const res = await fetch(`${baseUrl}/api/orders/${order.order_ref}/whatsapp-click`, {
    method: 'POST'
  });
  assert.strictEqual(res.status, 200);

  const updatedOrder = db.prepare('SELECT whatsapp_opened, whatsapp_opened_at FROM orders WHERE id = ?').get(order.id);
  assert.strictEqual(updatedOrder.whatsapp_opened, 1);
  assert.ok(updatedOrder.whatsapp_opened_at);
});

test('Order tracking requires matching phone and exposes only status fields', async () => {
  const order = db.prepare('SELECT * FROM orders LIMIT 1').get();
  const request = phone => fetch(baseUrl + '/api/orders/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_ref: order.order_ref, phone })
  });
  const denied = await request('0700000000');
  assert.strictEqual(denied.status, 404);
  const allowed = await request(order.phone);
  assert.strictEqual(allowed.status, 200);
  const result = await allowed.json();
  assert.deepStrictEqual(Object.keys(result).sort(), ['order_ref', 'order_status', 'payment_status']);
  assert.strictEqual(result.order_ref, order.order_ref);
});

// 10. Duplicate Prevention Test
test('Duplicate order submission within 60s window should be blocked with 429', async () => {
  const dupPhone = uniquePhone();
  const dupPayload = {
    customer_name: 'Repeat Customer',
    phone: dupPhone,
    address: '10 Duplicate Lane',
    city: 'Colombo',
    district: 'Colombo',
    payment_method: 'cod',
    items: [{ id: 1, qty: 1 }]
  };

  // First submission -> 201
  const res1 = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dupPayload)
  });
  assert.strictEqual(res1.status, 201);

  // Immediate retry with identical customer details -> 429
  const res2 = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dupPayload)
  });
  assert.strictEqual(res2.status, 429, 'Immediate duplicate order must be blocked');
});

test('Removing a product hides it publicly and preserves past order items', async () => {
  const before = db.prepare('SELECT COUNT(*) AS count FROM order_items WHERE product_id = 1').get().count;
  assert.ok(before > 0);
  const removed = await fetch(baseUrl + '/api/products/1', { method: 'DELETE', headers: adminHeaders });
  assert.strictEqual(removed.status, 200);
  assert.strictEqual(db.prepare('SELECT active FROM products WHERE id = 1').get().active, 0);
  assert.strictEqual(db.prepare('SELECT COUNT(*) AS count FROM order_items WHERE product_id = 1').get().count, before);
  const publicProduct = await fetch(baseUrl + '/api/products/1');
  assert.strictEqual(publicProduct.status, 404);
  const restored = await fetch(baseUrl + '/api/products/1', { method: 'PUT', headers: adminHeaders, body: JSON.stringify({ active: true }) });
  assert.strictEqual(restored.status, 200);
  assert.strictEqual(db.prepare('SELECT active FROM products WHERE id = 1').get().active, 1);
});
