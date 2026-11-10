// ============================================================
// FLEXER EYEWEAR — Orders API & Authoritative Pricing
// ============================================================

const express = require('express');
const router = express.Router();
const { db, generateOrderReference } = require('../db');
const { requireAdmin } = require('../auth');

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const CUSTOMER_FIELD_LIMITS = {
  customer_name: 120,
  phone: 32,
  whatsapp_number: 32,
  email: 254,
  address: 500,
  city: 120,
  district: 80,
  postal_code: 20,
  notes: 2000
};

function validateCustomerFields(values) {
  for (const [field, maxLength] of Object.entries(CUSTOMER_FIELD_LIMITS)) {
    const value = values[field];
    if (value !== undefined && value !== null && typeof value !== 'string') {
      return `${field.replaceAll('_', ' ')} must be text`;
    }
    if (typeof value === 'string' && value.length > maxLength) {
      return `${field.replaceAll('_', ' ')} is too long`;
    }
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return 'Enter a valid email address';
  }
  const phoneDigits = String(values.phone || '').replace(/\D/g, '');
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    return 'Enter a valid contact phone number';
  }
  const whatsappDigits = String(values.whatsapp_number || values.phone || '').replace(/\D/g, '');
  if (whatsappDigits.length < 9 || whatsappDigits.length > 15) {
    return 'Enter a valid WhatsApp number';
  }
  return null;
}

// Return only status information after matching BOTH customer credentials.
// This route is covered by the orders rate limiter and never returns addresses.
router.post('/track', (req, res) => {
  const reference = typeof req.body.order_ref === 'string' ? req.body.order_ref.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone : '';
  const normalizePhone = value => String(value).replace(/\D/g, '').replace(/^94/, '0');
  if (!reference || !phone || reference.length > 64 || phone.length > 32) {
    return res.status(400).json({ error: 'Enter your order reference and checkout phone number.' });
  }
  const order = db.prepare('SELECT order_ref, phone, order_status, payment_status FROM orders WHERE order_ref = ?').get(reference);
  if (!order || normalizePhone(order.phone) !== normalizePhone(phone)) {
    return res.status(404).json({ error: 'No matching order. Check your reference and phone number.' });
  }
  return res.json({ order_ref: order.order_ref, order_status: order.order_status, payment_status: order.payment_status });
});

/**
 * POST /api/orders
 * Public order creation with authoritative pricing & duplicate prevention
 */
router.post('/', (req, res) => {
  try {
    const {
      customer_name,
      phone,
      whatsapp_number,
      email,
      address,
      city,
      district,
      postal_code,
      notes,
      payment_method,
      items,
      customization_option
    } = req.body;

    // 1. Validation
    const customerValidationError = validateCustomerFields({
      customer_name, phone, whatsapp_number, email, address, city, district,
      postal_code, notes
    });
    if (customerValidationError) {
      return res.status(400).json({ error: customerValidationError });
    }
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: 'Customer full name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Contact phone number is required' });
    }
    const finalWhatsApp = (whatsapp_number && whatsapp_number.trim()) || phone.trim();

    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City / Town is required' });
    }
    if (!district || !district.trim()) {
      return res.status(400).json({ error: 'Sri Lankan district is required' });
    }

    const matchedDistrict = SRI_LANKA_DISTRICTS.find(
      d => d.toLowerCase() === district.trim().toLowerCase()
    );
    if (!matchedDistrict) {
      return res.status(400).json({
        error: `Invalid district '${district}'. Must be one of Sri Lanka's 25 administrative districts.`
      });
    }

    const validPaymentMethods = ['bank_transfer', 'cod', 'koko'];
    if (!payment_method || !validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        error: 'Invalid payment method. Choose Bank Transfer, Cash on Delivery (COD), or Koko.'
      });
    }

    if (payment_method === 'koko') {
      const getSetting = key => db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value || '';
      const kokoEnabled = getSetting('koko_enabled') === '1';
      const merchantId = getSetting('koko_merchant_id');
      const hasCredentials = merchantId && merchantId !== 'PENDING_MERCHANT_CREDENTIALS' && getSetting('koko_api_key');
      if (!kokoEnabled || !hasCredentials) {
        return res.status(400).json({
          error: 'Koko instalments are not available yet. Please choose Bank Transfer or Cash on Delivery.'
        });
      }
      return res.status(400).json({
        error: 'Koko is awaiting approved merchant integration. Please choose Bank Transfer or Cash on Delivery.'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Shopping cart cannot be empty' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'Shopping cart contains too many line items' });
    }

    // 2. Duplicate Submission Protection (60-second window on same customer & phone)
    const recentDuplicate = db.prepare(`
      SELECT order_ref, created_at FROM orders
      WHERE phone = ? AND customer_name = ?
        AND created_at >= datetime('now', '-60 seconds')
      LIMIT 1
    `).get(phone.trim(), customer_name.trim());

    if (recentDuplicate) {
      return res.status(429).json({
        error: 'A duplicate order was recently submitted. Please wait a moment.',
        order_ref: recentDuplicate.order_ref
      });
    }

    // 3. Authoritative Server-Side Price Calculation
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const productId = Number(item.id || item.product_id);
      if (!productId || isNaN(productId)) {
        return res.status(400).json({ error: `Invalid product ID in cart item: ${JSON.stringify(item)}` });
      }

      const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(productId);
      if (!product) {
        return res.status(400).json({ error: `Product ID ${productId} is not available in our catalogue.` });
      }

      const requestedQuantity = Number(item.quantity ?? item.qty ?? 1);
      if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 20) {
        return res.status(400).json({ error: 'Each item quantity must be a whole number between 1 and 20.' });
      }
      const quantity = requestedQuantity;
      const authoritativeUnitPrice = Number(product.price);
      const itemSubtotal = authoritativeUnitPrice * quantity;

      // Resolve the selected variant. If no colorway is submitted, use the first
      // sellable one so direct API orders receive the same stock protection as
      // storefront orders.
      let selectedVariant = null;
      if (item.variant_sku || item.variant_id) {
        selectedVariant = db.prepare(`
          SELECT * FROM product_variants
          WHERE product_id = ? AND (sku = ? OR id = ?)
        `).get(productId, item.variant_sku || '', item.variant_id || 0);
        if (!selectedVariant) {
          return res.status(400).json({ error: `The selected colorway for ${product.name} is not available.` });
        }
      } else {
        selectedVariant = db.prepare(`
          SELECT * FROM product_variants
          WHERE product_id = ? AND is_available = 1 AND stock_quantity > 0
          ORDER BY id ASC LIMIT 1
        `).get(productId);
      }

      if (selectedVariant && (!selectedVariant.is_available || selectedVariant.stock_quantity < quantity)) {
        return res.status(400).json({ error: `Only ${Math.max(0, selectedVariant.stock_quantity)} of ${product.name} in this colorway are currently available.` });
      }

      const colorName = selectedVariant ? selectedVariant.color_name : (item.color_name || 'Standard');
      const colorHex  = selectedVariant ? selectedVariant.color_hex  : (item.color_hex  || '#000000');
      const imageSnap = selectedVariant?.image || product.primary_image;

      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        product_id: product.id,
        variant_id: selectedVariant ? selectedVariant.id : null,
        product_sku: product.sku,
        product_name: product.name,
        variant_sku: selectedVariant ? selectedVariant.sku : null,
        color_name: colorName,
        color_hex: colorHex,
        unit_price: authoritativeUnitPrice,
        quantity,
        item_total: itemSubtotal,
        image_snapshot: imageSnap
      });
    }

    // 4. Calculate Delivery and Additional Charges
    const deliverySetting = db.prepare("SELECT value FROM settings WHERE key = 'delivery_fee_islandwide'").get();
    const deliveryFee = deliverySetting ? Number(deliverySetting.value) : 0;

    let customizationFee = 0;
    if (customization_option === 'gift_packaging') {
      customizationFee = 500; // Configured gift packaging upgrade in LKR
    }

    const discount = 0;
    const totalPayable = calculatedSubtotal + deliveryFee + customizationFee - discount;

    // 5. Generate Collision-Safe Order Reference
    const orderRef = generateOrderReference();
    const now = new Date().toISOString();

    // 6. Set initial payment status according to method
    let initialPaymentStatus = 'awaiting_transfer';
    if (payment_method === 'cod') {
      initialPaymentStatus = 'due_on_delivery';
    } else if (payment_method === 'koko') {
      initialPaymentStatus = 'koko_pending';
    }

    // 7. Insert Order & Order Items within Transaction
    db.exec('BEGIN TRANSACTION;');

    try {
      const orderStmt = db.prepare(`
        INSERT INTO orders (
          order_ref, customer_name, phone, whatsapp_number, email,
          address, city, district, postal_code, notes,
          payment_method, payment_status, order_status,
          subtotal, customization_fee, delivery_fee, discount, total_payable,
          whatsapp_opened, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `);

      orderStmt.run(
        orderRef,
        customer_name.trim(),
        phone.trim(),
        finalWhatsApp,
        email ? email.trim() : null,
        address.trim(),
        city.trim(),
        matchedDistrict,
        postal_code ? postal_code.trim() : null,
        notes ? notes.trim() : null,
        payment_method,
        initialPaymentStatus,
        'pending',
        calculatedSubtotal,
        customizationFee,
        deliveryFee,
        discount,
        totalPayable,
        now,
        now
      );

      const insertedOrder = db.prepare('SELECT id FROM orders WHERE order_ref = ?').get(orderRef);

      const itemStmt = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_sku, product_name, variant_sku,
          color_name, color_hex, unit_price, quantity, item_total, image_snapshot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const decrementStockStmt = db.prepare(`
        UPDATE product_variants
        SET stock_quantity = stock_quantity - ?
        WHERE id = ? AND product_id = ? AND is_available = 1 AND stock_quantity >= ?
      `);

      for (const vi of validatedItems) {
        if (vi.variant_id) {
          const stockUpdate = decrementStockStmt.run(vi.quantity, vi.variant_id, vi.product_id, vi.quantity);
          if (stockUpdate.changes !== 1) {
            const stockError = new Error(`The selected colorway for ${vi.product_name} just sold out. Please refresh your bag and try again.`);
            stockError.statusCode = 409;
            throw stockError;
          }
        }
        itemStmt.run(
          insertedOrder.id,
          vi.product_id,
          vi.product_sku,
          vi.product_name,
          vi.variant_sku,
          vi.color_name,
          vi.color_hex,
          vi.unit_price,
          vi.quantity,
          vi.item_total,
          vi.image_snapshot
        );
      }

      // Initial audit log
      db.prepare(`
        INSERT INTO order_audit_logs (order_id, action, performed_by, details, created_at)
        VALUES (?, 'order_created', 'customer', ?, ?)
      `).run(
        insertedOrder.id,
        JSON.stringify({ payment_method, total_payable: totalPayable, items_count: validatedItems.length }),
        now
      );

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    // 8. Fetch Bank Details for bank_transfer response
    let bankDetails = null;
    if (payment_method === 'bank_transfer') {
      const getSet = k => db.prepare('SELECT value FROM settings WHERE key = ?').get(k)?.value || '';
      bankDetails = {
        account_holder: getSet('bank_account_holder'),
        bank_name: getSet('bank_name'),
        branch_name: getSet('bank_branch'),
        account_number: getSet('bank_account_number'),
        instructions: getSet('bank_payment_instructions')
      };
    }

    // 9. Fetch WhatsApp Number for WhatsApp prefilled link
    const waNumber = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_number'").get()?.value || '94775580968';

    // 10. Return Authoritative Order Summary
    res.status(201).json({
      success: true,
      order_ref: orderRef,
      payment_method,
      payment_status: initialPaymentStatus,
      order_status: 'pending',
      subtotal: calculatedSubtotal,
      delivery_fee: deliveryFee,
      customization_fee: customizationFee,
      discount,
      total_payable: totalPayable,
      customer: {
        name: customer_name.trim(),
        phone: phone.trim(),
        whatsapp_number: finalWhatsApp,
        address: `${address.trim()}, ${city.trim()}, ${matchedDistrict}`
      },
      items: validatedItems,
      bank_details: bankDetails,
      whatsapp_number: waNumber
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Failed to create order. Please try again.' });
  }
});

/**
 * GET /api/orders
 * Admin: List and filter all orders
 */
router.get('/', requireAdmin, (req, res) => {
  try {
    const { status, payment_method, payment_status, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      query += ' AND order_status = ?';
      params.push(status);
    }
    if (payment_method && payment_method !== 'All') {
      query += ' AND payment_method = ?';
      params.push(payment_method);
    }
    if (payment_status && payment_status !== 'All') {
      query += ' AND payment_status = ?';
      params.push(payment_status);
    }
    if (search && search.trim()) {
      query += ' AND (order_ref LIKE ? OR customer_name LIKE ? OR phone LIKE ? OR city LIKE ?)';
      const t = `%${search.trim()}%`;
      params.push(t, t, t, t);
    }

    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
    const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, safeOffset);

    const orders = db.prepare(query).all(...params);

    // Attach items to each order
    const itemStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    for (const o of orders) {
      o.items = itemStmt.all(o.id);
    }

    res.json(orders);
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

/**
 * GET /api/orders/export.csv
 * Administrative CSV export for fulfilment and accounting.
 */
router.get('/export.csv', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT order_ref, customer_name, phone, email, address, city, district,
        payment_method, payment_status, order_status, total_payable, created_at
      FROM orders ORDER BY id DESC
    `).all();
    const columns = ['order_ref', 'customer_name', 'phone', 'email', 'address', 'city', 'district', 'payment_method', 'payment_status', 'order_status', 'total_payable', 'created_at'];
    const quote = value => {
      const text = String(value ?? '');
      const spreadsheetSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${spreadsheetSafe.replace(/"/g, '""')}"`;
    };
    const csv = [columns.join(','), ...rows.map(row => columns.map(key => quote(row[key])).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="flexer-orders.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export orders' });
  }
});

/**
 * GET /api/orders/:ref
 * Customer safe order view
 */
router.get('/:ref', requireAdmin, (req, res) => {
  try {
    const { ref } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_ref = ?').get(ref);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    // Only expose customer-safe fields
    res.json({
      order_ref: order.order_ref,
      customer_name: order.customer_name,
      phone: order.phone,
      whatsapp_number: order.whatsapp_number,
      address: order.address,
      city: order.city,
      district: order.district,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      order_status: order.order_status,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      customization_fee: order.customization_fee,
      total_payable: order.total_payable,
      created_at: order.created_at,
      items
    });
  } catch (err) {
    console.error('Error retrieving order:', err);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

/**
 * PATCH /api/orders/:id/status (Admin Only)
 */
router.patch('/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'new', 'awaiting_confirmation', 'confirmed', 'processing', 'paid', 'shipped', 'dispatched', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?').run(status, now, Number(id));

    // Audit log
    db.prepare(`
      INSERT INTO order_audit_logs (order_id, action, performed_by, details, created_at)
      VALUES (?, 'status_updated', ?, ?, ?)
    `).run(Number(id), req.adminUser.username, JSON.stringify({ from: order.order_status, to: status, note }), now);

    res.json({ success: true, message: `Order #${id} status updated to ${status}`, order_status: status });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * PATCH /api/orders/:id/payment-verify (Admin Only)
 * Records an administrator's bank-transfer or COD payment decision.
 */
router.patch('/:id/payment-verify', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { verified, transaction_ref, notes } = req.body;
    if (typeof verified !== 'boolean') return res.status(400).json({ error: 'Choose a valid payment decision' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.payment_method === 'koko') return res.status(400).json({ error: 'Koko payments require official provider verification' });

    const now = new Date().toISOString();
    const newPaymentStatus = verified ? 'verified_paid' : 'payment_issue';

    db.exec('BEGIN TRANSACTION;');
    try {
      const nextOrderStatus = verified && ['pending', 'confirmed'].includes(order.order_status)
        ? 'paid'
        : order.order_status;
      db.prepare('UPDATE orders SET payment_status = ?, order_status = ?, updated_at = ? WHERE id = ?').run(
        newPaymentStatus, nextOrderStatus, now, Number(id)
      );

      // Record in payments table
      db.prepare(`
        INSERT INTO payments (
          order_id, payment_method, amount, status, transaction_ref,
          verified_by, verified_at, verification_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(id),
        order.payment_method,
        order.total_payable,
        newPaymentStatus,
        transaction_ref || null,
        req.adminUser.username,
        now,
        notes || (verified ? 'Payment receipt confirmed by admin' : 'Payment discrepancy flagged by admin'),
        now
      );

      // Audit log
      db.prepare(`
        INSERT INTO order_audit_logs (order_id, action, performed_by, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        Number(id),
        verified ? 'payment_verified' : 'payment_rejected',
        req.adminUser.username,
        JSON.stringify({ transaction_ref, notes, amount: order.total_payable, order_status: nextOrderStatus }),
        now
      );

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    res.json({
      success: true,
      order_id: Number(id),
      payment_status: newPaymentStatus,
      verified_by: req.adminUser.username,
      verified_at: now
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: 'Failed to record payment verification' });
  }
});

/**
 * POST /api/orders/:ref/whatsapp-click
 * Event tracking: records WhatsApp link opened event
 */
router.post('/:ref/whatsapp-click', (req, res) => {
  try {
    const { ref } = req.params;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT id FROM orders WHERE order_ref = ?').get(ref);
    if (order) {
      db.prepare('UPDATE orders SET whatsapp_opened = 1, whatsapp_opened_at = ? WHERE id = ?').run(now, order.id);
      db.prepare(`
        INSERT INTO order_audit_logs (order_id, action, performed_by, details, created_at)
        VALUES (?, 'whatsapp_opened', 'customer', 'Customer clicked WhatsApp link', ?)
      `).run(order.id, now);
    }

    res.json({ success: true, recorded_at: now });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record event' });
  }
});

router.get('/:id/history', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT action,performed_by,details,created_at FROM order_audit_logs WHERE order_id = ? ORDER BY id DESC').all(Number(req.params.id)));
});

module.exports = router;
