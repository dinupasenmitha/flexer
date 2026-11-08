// ============================================================
// FLEXER EYEWEAR — Persistent SQLite Database Engine
// Uses Node 22+ built-in node:sqlite with WAL mode & indexes
// ============================================================

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DATA_DIR = process.env.FLEXER_DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'flexer.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high concurrency & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Run Schema Migrations
 */
function initDatabase() {
  db.exec(`
    -- 1. Business Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL
    );

    -- 2. Admin Users
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    -- 3. Products
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      product_type TEXT NOT NULL DEFAULT 'sunglasses', -- 'sunglasses' | 'optical'
      category TEXT NOT NULL DEFAULT 'budget',         -- 'budget' | 'premium' | 'branded'
      brand TEXT NOT NULL DEFAULT 'FLEXER',
      price INTEGER NOT NULL,                         -- Authoritative integer LKR
      original_price INTEGER,                         -- Original price if discounted
      badge TEXT,                                     -- 'BESTSELLER' | 'NEW DROP' | 'SIGNATURE'
      description TEXT NOT NULL,
      materials TEXT,
      lens_spec TEXT,
      dimensions TEXT,
      inclusions TEXT,                                -- JSON array
      warranty_months INTEGER DEFAULT 6,
      care_instructions TEXT,
      primary_image TEXT NOT NULL,
      images TEXT,                                    -- JSON array
      active INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 4. Product Variants (Colorways & Stock)
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sku TEXT UNIQUE NOT NULL,
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      image TEXT,
      stock_quantity INTEGER DEFAULT 15,
      is_available INTEGER DEFAULT 1
    );

    -- 5. Orders (Server-Authoritative Price & Reference)
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_ref TEXT UNIQUE NOT NULL,                 -- Collision-safe: FLX-2026-XXXXXX
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      postal_code TEXT,
      notes TEXT,
      payment_method TEXT NOT NULL,                   -- 'bank_transfer' | 'cod' | 'koko'
      payment_status TEXT NOT NULL DEFAULT 'awaiting_payment',
      order_status TEXT NOT NULL DEFAULT 'new',
      subtotal INTEGER NOT NULL,
      customization_fee INTEGER NOT NULL DEFAULT 0,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      discount INTEGER NOT NULL DEFAULT 0,
      total_payable INTEGER NOT NULL,
      whatsapp_opened INTEGER DEFAULT 0,
      whatsapp_opened_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 6. Order Items (Snapshot at time of purchase)
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_sku TEXT NOT NULL,
      product_name TEXT NOT NULL,
      variant_sku TEXT,
      color_name TEXT,
      color_hex TEXT,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      item_total INTEGER NOT NULL,
      image_snapshot TEXT
    );

    -- 7. Payment Verification Records (Audit Trail - NEVER stores slips)
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      payment_method TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      transaction_ref TEXT,
      verified_by TEXT,
      verified_at TEXT,
      verification_notes TEXT,
      created_at TEXT NOT NULL
    );

    -- 8. Order Audit Logs
    CREATE TABLE IF NOT EXISTS order_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL DEFAULT 'system',
      details TEXT,
      created_at TEXT NOT NULL
    );

    -- 9. Newsletter Subscribers
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'homepage',
      created_at TEXT NOT NULL
    );

    -- 10. Contact Messages
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK(kind IN ('faq','review')),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      product_name TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 5,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
    CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(order_ref);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  `);

  seedDefaultData();
}

/**
 * Password hashing
 *
 * New administrator passwords use Argon2id, the memory-hard password hash
 * recommended for new credentials. The PBKDF2 branch exists only so an
 * existing local installation can still log in once and be migrated safely.
 */
function hashPassword(password) {
  const nonce = crypto.randomBytes(16);
  const hash = crypto.argon2Sync('argon2id', {
    message: password,
    nonce,
    parallelism: 1,
    memory: 65536,
    passes: 3,
    tagLength: 32
  }).toString('hex');
  return { hash, salt: `argon2id:${nonce.toString('hex')}` };
}

function verifyPassword(password, hash, salt) {
  try {
    let verifyHash;
    if (salt.startsWith('argon2id:')) {
      const nonce = Buffer.from(salt.slice('argon2id:'.length), 'hex');
      verifyHash = crypto.argon2Sync('argon2id', {
        message: password,
        nonce,
        parallelism: 1,
        memory: 65536,
        passes: 3,
        tagLength: 32
      }).toString('hex');
    } else {
      verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    }
    const expected = Buffer.from(hash, 'hex');
    const actual = Buffer.from(verifyHash, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/**
 * Seed Initial Real Brand Settings, Admin, and Product Catalogue
 */
function seedDefaultData() {
  const now = new Date().toISOString();

  // 1. Business Settings
  const defaultSettings = [
    { key: 'store_name', value: 'FLEXER', description: 'Brand Name' },
    { key: 'store_tagline', value: 'Don’t just wear, FLEX.', description: 'Brand Tagline' },
    { key: 'domain', value: 'https://flexer.mrteches.com', description: 'Store Domain' },
    { key: 'currency', value: 'LKR', description: 'Currency Code' },
    { key: 'whatsapp_number', value: '94775580968', description: 'Official WhatsApp Business Number' },
    { key: 'whatsapp_community_url', value: 'https://chat.whatsapp.com/Bj1jp9x5n4QDovZsfiMCr9?s=cl&p=i&ilr=2&amv=0', description: 'Official WhatsApp Group Invitation' },
    { key: 'bank_account_holder', value: 'FLEXER (PVT) LTD [To be confirmed by FLEXER]', description: 'Bank Account Holder Name' },
    { key: 'bank_name', value: 'Commercial Bank of Ceylon [To be confirmed by FLEXER]', description: 'Bank Name' },
    { key: 'bank_branch', value: 'Kollupitiya Branch [To be confirmed by FLEXER]', description: 'Branch Name' },
    { key: 'bank_account_number', value: '8000XXXXXX [To be confirmed by FLEXER]', description: 'Bank Account Number' },
    { key: 'bank_payment_instructions', value: 'Please transfer the exact order amount using your bank app. Put your Order Reference in the narration. Share your payment slip via WhatsApp or the direct share button below.', description: 'Bank Transfer Instructions' },
    { key: 'delivery_fee_islandwide', value: '0', description: 'Current Islandwide Delivery Fee (LKR) - Free Promotion' },
    { key: 'delivery_fee_policy', value: 'Free Islandwide Delivery on all eyewear drops. Delivered within 2-4 business days.', description: 'Delivery Policy Text' },
    { key: 'announcement_text', value: 'DROP 01 LIVE · UV400 PROTECTION ON ALL FRAMES · FREE ISLANDWIDE DELIVERY · BANK TRANSFER / COD / KOKO', description: 'Top Announcement Bar' },
    { key: 'koko_enabled', value: '0', description: 'Koko Payment Method Enabled (1 = Yes, 0 = No)' },
    { key: 'koko_mode', value: 'manual_request', description: 'Koko Mode: manual_request (pending merchant credentials) or direct_api' },
    { key: 'koko_merchant_id', value: 'PENDING_MERCHANT_CREDENTIALS', description: 'Koko Merchant Identifier' }
  ];

  const stmtSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value, description, updated_at) VALUES (?, ?, ?, ?)');
  for (const s of defaultSettings) {
    stmtSetting.run(s.key, s.value, s.description, now);
  }

  // 2. Initial admin. Production must supply a private password rather than
  // shipping a login that is known to the public.
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  const initialAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD ||
    (process.env.NODE_ENV === 'production' ? null : 'flexer2026!admin');
  if (!existingAdmin) {
    if (!initialAdminPassword) {
      throw new Error('DEFAULT_ADMIN_PASSWORD must be configured before starting in production');
    }
    const { hash, salt } = hashPassword(initialAdminPassword);
    db.prepare('INSERT INTO admin_users (username, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?)').run(
      'admin', hash, salt, 'superadmin', now
    );
  } else if (process.env.DEFAULT_ADMIN_PASSWORD) {
    const currentAdmin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get('admin');
    // Safely rotate only the documented legacy development password.
    if (verifyPassword('flexer2026!admin', currentAdmin.password_hash, currentAdmin.salt)) {
      const { hash, salt } = hashPassword(process.env.DEFAULT_ADMIN_PASSWORD);
      db.prepare('UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, currentAdmin.id);
    }
  }

  // 3. Genuine Product Catalogue (Preserving live "Thinner Flex" and enriching catalogue)
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM products');
  const countResult = countStmt.get();
  if (countResult && countResult.count === 0) {
    const seedProducts = [
      // BUDGET RANGE
      {
        sku: 'FLX-B-001',
        name: 'Thinner Flex',
        slug: 'thinner-flex',
        product_type: 'sunglasses',
        category: 'budget',
        brand: 'FLEXER',
        price: 1690,
        original_price: 1990,
        badge: 'BESTSELLER',
        description: 'Fresh look, clean style, and crafted to turn heads wherever you go. Engineered with ultra-light polymer temples and UV400 clarity.',
        materials: 'Ultra-lightweight Flexible Polycarbonate Frame with reinforced alloy screw hinges.',
        lens_spec: 'UV400 Category 3 Optical lenses blocking 99.9% UVA/UVB rays.',
        dimensions: 'Lens Width: 51mm | Bridge: 19mm | Temple Length: 142mm | Total Width: 140mm',
        inclusions: JSON.stringify(['FLEXER Protective Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee']),
        warranty_months: 6,
        care_instructions: 'Rinse with clean lukewarm water before wiping with the microfibre cloth. Store in the protective zip pouch.',
        primary_image: 'uploads/sunglasses_hero.jpg',
        images: JSON.stringify([
          'uploads/sunglasses_hero.jpg',
          'uploads/sunglasses_wayfarer_black.jpg',
          'uploads/sunglasses_display_row.jpg'
        ]),
        active: 1,
        featured: 1,
        variants: [
          { sku: 'FLX-B-001-BLK', color_name: 'Gloss Onyx Black', color_hex: '#0c0d0e', image: 'uploads/sunglasses_hero.jpg', stock: 25 },
          { sku: 'FLX-B-001-MAT', color_name: 'Matte Charcoal', color_hex: '#2b2c2e', image: 'uploads/sunglasses_wayfarer_black.jpg', stock: 20 },
          { sku: 'FLX-B-001-GLD', color_name: 'Amber Tortoise', color_hex: '#8b5a2b', image: 'uploads/sunglasses_round_tortoise.jpg', stock: 15 }
        ]
      },
      {
        sku: 'FLX-B-002',
        name: 'Aero Slim Classic',
        slug: 'aero-slim-classic',
        product_type: 'sunglasses',
        category: 'budget',
        brand: 'FLEXER',
        price: 2850,
        original_price: 3450,
        badge: 'POPULAR',
        description: 'Understated elegance crafted for everyday city life. Sleek rounded contours that complement all facial profiles with supreme comfort.',
        materials: 'Resilient TR90 thermoplastic memory frame with featherweight comfort.',
        lens_spec: 'UV400 Gradient Smoke lenses with anti-scratch coating.',
        dimensions: 'Lens Width: 50mm | Bridge: 20mm | Temple Length: 145mm | Total Width: 138mm',
        inclusions: JSON.stringify(['FLEXER Protective Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee']),
        warranty_months: 6,
        care_instructions: 'Clean with the supplied microfibre cloth. Avoid harsh chemical cleaners.',
        primary_image: 'uploads/sunglasses_round_tortoise.jpg',
        images: JSON.stringify(['uploads/sunglasses_round_tortoise.jpg', 'uploads/sunglasses_lifestyle_1.jpg']),
        active: 1,
        featured: 1,
        variants: [
          { sku: 'FLX-B-002-BLK', color_name: 'Midnight Black', color_hex: '#111111', image: 'uploads/sunglasses_round_tortoise.jpg', stock: 18 },
          { sku: 'FLX-B-002-GUN', color_name: 'Gunmetal Smoke', color_hex: '#4a4f54', image: 'uploads/sunglasses_lifestyle_1.jpg', stock: 12 }
        ]
      },

      // PREMIUM RANGE
      {
        sku: 'FLX-P-001',
        name: 'S1 OBSIDIAN',
        slug: 's1-obsidian',
        product_type: 'sunglasses',
        category: 'premium',
        brand: 'FLEXER',
        price: 7950,
        original_price: 9500,
        badge: 'SIGNATURE',
        description: 'Sculpted from hand-finished Italian Mazzucchelli acetate with custom gold core-wire detailing and polarized precision optics.',
        materials: 'Italian Hand-Polished Cellulose Acetate with 5-barrel custom barrel hinges.',
        lens_spec: 'TAC 1.1mm Polarized UV400 lenses with hydrophobic coating.',
        dimensions: 'Lens Width: 53mm | Bridge: 19mm | Temple Length: 145mm | Total Width: 144mm',
        inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
        warranty_months: 6,
        care_instructions: 'Keep in hard case when not worn. Use the included anti-fog cleaner and microfibre cloth.',
        primary_image: 'uploads/sunglasses_aviator_gold.jpg',
        images: JSON.stringify(['uploads/sunglasses_aviator_gold.jpg', 'uploads/sunglasses_premium_dark.jpg', 'uploads/sunglasses_editorial_1.jpg']),
        active: 1,
        featured: 1,
        variants: [
          { sku: 'FLX-P-001-BG', color_name: 'Black / Brushed Gold', color_hex: '#c5a059', image: 'uploads/sunglasses_aviator_gold.jpg', stock: 14 },
          { sku: 'FLX-P-001-TOR', color_name: 'Vintage Havana Tortoise', color_hex: '#693e1b', image: 'uploads/sunglasses_premium_dark.jpg', stock: 10 }
        ]
      },
      {
        sku: 'FLX-P-002',
        name: 'S2 PHANTOM',
        slug: 's2-phantom',
        product_type: 'sunglasses',
        category: 'premium',
        brand: 'FLEXER',
        price: 8650,
        original_price: 10200,
        badge: 'DROP 01',
        description: 'Weightless architectural lines engineered with high-tensile stainless steel, precision silicone nose bridges, and deep warm brown tint.',
        materials: 'Surgical-Grade 316L Stainless Steel with micro-etched temple accents.',
        lens_spec: 'UV400 Polarized lenses with anti-reflective back coating.',
        dimensions: 'Lens Width: 54mm | Bridge: 18mm | Temple Length: 145mm | Total Width: 143mm',
        inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
        warranty_months: 6,
        care_instructions: 'Wipe with microfibre cloth. Store in magnetic hard case.',
        primary_image: 'uploads/sunglasses_cat_eye.jpg',
        images: JSON.stringify(['uploads/sunglasses_cat_eye.jpg', 'uploads/sunglasses_lifestyle_2.jpg']),
        active: 1,
        featured: 1,
        variants: [
          { sku: 'FLX-P-002-GB', color_name: 'Gold / Warm Brown', color_hex: '#d4af37', image: 'uploads/sunglasses_cat_eye.jpg', stock: 12 },
          { sku: 'FLX-P-002-SLV', color_name: 'Silver / Glacier Grey', color_hex: '#b0b5b9', image: 'uploads/sunglasses_lifestyle_2.jpg', stock: 9 }
        ]
      },

      // BRANDED RANGE
      {
        sku: 'FLX-BR-001',
        name: 'S3 SPECTRE \u2014 Collector\u2019s Edition',
        slug: 's3-spectre-collectors-edition',
        product_type: 'sunglasses',
        category: 'branded',
        brand: 'FLEXER Atelier',
        price: 24500,
        original_price: 28000,
        badge: 'COLLECTOR',
        description: 'Aircraft-grade titanium core, Japanese titanium rimlock screws, and serialized engraved temples. Delivered in a handcrafted solid wooden presentation box.',
        materials: 'Pure Japanese Grade 2 Titanium with hand-bevelled acetate rims.',
        lens_spec: 'Polarized Diamond-Hard Multi-Coated UV400 lenses with Oleophobic shield.',
        dimensions: 'Lens Width: 55mm | Bridge: 17mm | Temple Length: 148mm | Total Width: 146mm',
        inclusions: JSON.stringify(['Handcrafted Solid Wooden Box', 'Numbered Certificate of Craft', 'Original Leather Case', '1 Year Full Warranty']),
        warranty_months: 12,
        care_instructions: 'Specially treated titanium. Use the supplied atelier cleaning solution and lambskin cloth.',
        primary_image: 'uploads/sunglasses_luxury_gold.jpg',
        images: JSON.stringify(['uploads/sunglasses_luxury_gold.jpg', 'uploads/sunglasses_titanium_grey.jpg']),
        active: 1,
        featured: 1,
        variants: [
          { sku: 'FLX-BR-001-TI', color_name: 'Titanium Gunmetal / Blue Reflection', color_hex: '#2b3a4a', image: 'uploads/sunglasses_titanium_grey.jpg', stock: 5 },
          { sku: 'FLX-BR-001-OBS', color_name: 'Obsidian Matte / Deep Black', color_hex: '#141416', image: 'uploads/sunglasses_luxury_gold.jpg', stock: 4 }
        ]
      },

      // OPTICAL FRAMES
      {
        sku: 'FLX-OPT-001',
        name: 'Lumen Geometric Optical Frame',
        slug: 'lumen-geometric-optical-frame',
        product_type: 'optical',
        category: 'premium',
        brand: 'FLEXER Optical',
        price: 7800,
        original_price: 9200,
        badge: 'OPTOMETRY TESTED',
        description: 'Refined architectural optical frame designed by optometry practitioners. Built for comfortable all-day wear with prescription-ready demo lenses.',
        materials: 'High-density Cellulose Acetate with flex spring temples.',
        lens_spec: 'Clear prescription-ready demo lenses with Blue Light protection filter.',
        dimensions: 'Lens Width: 51mm | Bridge: 19mm | Temple Length: 142mm | Total Width: 139mm',
        inclusions: JSON.stringify(['FLEXER Hard Shell Optical Case', 'Microfibre Optical Cloth', 'Fit Certificate', '6 Month Frame Warranty']),
        warranty_months: 6,
        care_instructions: 'Take to your certified optometrist to fit custom prescription lenses.',
        primary_image: 'uploads/optical_frame_clear.jpg',
        images: JSON.stringify(['uploads/optical_frame_clear.jpg', 'uploads/eyeglasses_optical_clear.jpg']),
        active: 1,
        featured: 1,
        variants: [
          { sku: 'FLX-OPT-001-CLR', color_name: 'Crystal Champagne Clear', color_hex: '#e8dec8', image: 'uploads/optical_frame_clear.jpg', stock: 10 },
          { sku: 'FLX-OPT-001-BLK', color_name: 'Classic Black Gloss', color_hex: '#0a0a0a', image: 'uploads/eyeglasses_optical_clear.jpg', stock: 15 }
        ]
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (
        sku, name, slug, product_type, category, brand, price, original_price,
        badge, description, materials, lens_spec, dimensions, inclusions,
        warranty_months, care_instructions, primary_image, images, active, featured,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertVariant = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, color_name, color_hex, image, stock_quantity, is_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of seedProducts) {
      insertProd.run(
        p.sku, p.name, p.slug, p.product_type, p.category, p.brand, p.price, p.original_price,
        p.badge, p.description, p.materials, p.lens_spec, p.dimensions, p.inclusions,
        p.warranty_months, p.care_instructions, p.primary_image, p.images, p.active, p.featured,
        now, now
      );

      // Get last inserted product ID
      const prodRow = db.prepare('SELECT id FROM products WHERE sku = ?').get(p.sku);
      if (prodRow && p.variants) {
        for (const v of p.variants) {
          insertVariant.run(prodRow.id, v.sku, v.color_name, v.color_hex, v.image, v.stock, 1);
        }
      }
    }
  }
}

/**
 * Generate a unique collision-safe Order Reference
 * Format: FLX-YYYYMMDD-0001. The daily sequence makes order references easy
 * for customers and merchant operations to quote, while the unique database
 * constraint remains the final collision guard.
 */
function generateOrderReference() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const value = type => parts.find(part => part.type === type).value;
  const date = `${value('year')}${value('month')}${value('day')}`;
  for (let sequence = 1; sequence <= 9999; sequence += 1) {
    const ref = `FLX-${date}-${String(sequence).padStart(4, '0')}`;
    if (!db.prepare('SELECT id FROM orders WHERE order_ref = ?').get(ref)) {
      return ref;
    }
  }
  throw new Error('Daily order reference limit reached');
}

// Initialize tables on import
initDatabase();

module.exports = {
  db,
  generateOrderReference,
  hashPassword,
  verifyPassword
};
