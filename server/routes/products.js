// ============================================================
// FLEXER EYEWEAR — Product Catalogue API Routes
// ============================================================

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin, verifyToken } = require('../auth');

const PRODUCT_CATEGORIES = new Set(['budget', 'premium', 'branded']);
const PRODUCT_TYPES = new Set(['sunglasses', 'optical']);

function isAdminRequest(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return Boolean(verifyToken(token)?.username);
}

function validateProductInput(input, isNew = false) {
  const { sku, name, category, product_type, price, original_price } = input;
  if (isNew && (!sku || !sku.trim() || !name || !name.trim())) {
    return 'SKU and name are required';
  }
  if (category !== undefined && !PRODUCT_CATEGORIES.has(category)) {
    return 'Invalid product category';
  }
  if (product_type !== undefined && !PRODUCT_TYPES.has(product_type)) {
    return 'Invalid product type';
  }
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
    return 'Price must be a non-negative number';
  }
  if (original_price !== undefined && original_price !== null && original_price !== '' &&
      (!Number.isFinite(Number(original_price)) || Number(original_price) < 0)) {
    return 'Original price must be a non-negative number';
  }
  if (input.variants !== undefined) {
    if (!Array.isArray(input.variants) || input.variants.length > 50) return 'Provide up to 50 colour variants';
    const seen = new Set();
    for (const variant of input.variants) {
      if (!variant || typeof variant.color_name !== 'string' || !variant.color_name.trim()) return 'Each colour needs a name';
      if (!/^#[0-9a-f]{6}$/i.test(variant.color_hex || '')) return 'Each colour needs a six-digit hex value';
      if (!Number.isInteger(Number(variant.stock_quantity)) || Number(variant.stock_quantity) < 0) return 'Stock must be a non-negative integer';
      const normalizedSku = String(variant.sku || '').trim().toUpperCase();
      if (normalizedSku && seen.has(normalizedSku)) return 'Variant SKUs must be unique';
      if (normalizedSku) seen.add(normalizedSku);
    }
  }
  return null;
}

// Product photography only; this authenticated endpoint never accepts payment slips.
router.post('/images', requireAdmin, (req, res) => {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(req.body.image || '');
  if (!match) return res.status(400).json({ error: 'Use a JPEG, PNG or WebP product image' });
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 1400000) return res.status(400).json({ error: 'Image must be smaller than 1.4 MB' });
  const valid = match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : match[1] === 'png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  if (!valid) return res.status(400).json({ error: 'Image contents do not match its type' });
  const fs = require('node:fs');
  const path = require('node:path');
  const filename = 'frame-' + require('node:crypto').randomUUID() + '.' + match[1];
  const destination = process.env.FLEXER_UPLOADS_DIR || path.join(__dirname, '../../public/uploads');
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, filename), bytes, { flag: 'wx' });
  return res.status(201).json({ path: '/uploads/' + filename });
});

/**
 * Helper to ensure absolute leading slash for asset paths
 */
function normalizeImgPath(p) {
  if (!p) return '/favicon.png';
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) return p;
  return '/' + p;
}

/**
 * Format product object with parsed JSON arrays and variants
 */
function formatProduct(p, includeVariants = true) {
  let images = [];
  try { images = JSON.parse(p.images || '[]'); } catch { images = [p.primary_image]; }
  if (!images.length && p.primary_image) images = [p.primary_image];

  let inclusions = [];
  try { inclusions = JSON.parse(p.inclusions || '[]'); } catch { inclusions = []; }

  const result = {
    ...p,
    price: Number(p.price),
    original_price: p.original_price ? Number(p.original_price) : null,
    active: Boolean(p.active),
    featured: Boolean(p.featured),
    primary_image: normalizeImgPath(p.primary_image),
    images: images.map(normalizeImgPath),
    inclusions
  };

  if (includeVariants) {
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);
    result.variants = variants.map(v => ({
      ...v,
      image: normalizeImgPath(v.image),
      is_available: Boolean(v.is_available)
    }));
    result.colors = variants.map(v => v.color_hex);
  }

  return result;
}

/**
 * GET /api/products
 * Public catalogue list with filtering, search, and sorting
 */
router.get('/', (req, res) => {
  try {
    const { category, product_type, search, sort, min_price, max_price, all } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Filter by active status unless admin explicitly requests all
    if (all && !isAdminRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!all) {
      query += ' AND active = 1';
    }

    if (category && ['budget', 'premium', 'branded'].includes(category.toLowerCase())) {
      query += ' AND category = ?';
      params.push(category.toLowerCase());
    }

    if (product_type && ['sunglasses', 'optical'].includes(product_type.toLowerCase())) {
      query += ' AND product_type = ?';
      params.push(product_type.toLowerCase());
    }

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ? OR brand LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (min_price && !isNaN(min_price)) {
      query += ' AND price >= ?';
      params.push(Number(min_price));
    }

    if (max_price && !isNaN(max_price)) {
      query += ' AND price <= ?';
      params.push(Number(max_price));
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        query += ' ORDER BY price ASC';
        break;
      case 'price-desc':
        query += ' ORDER BY price DESC';
        break;
      case 'name':
        query += ' ORDER BY name ASC';
        break;
      case 'newest':
        query += ' ORDER BY created_at DESC';
        break;
      case 'featured':
      default:
        query += ' ORDER BY featured DESC, id ASC';
        break;
    }

    const rows = db.prepare(query).all(...params);
    const products = rows.map(p => formatProduct(p, true));

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

/**
 * GET /api/products/:slugOrId
 * Single product with full specifications, variants, and related items
 */
router.get('/:slugOrId', (req, res) => {
  try {
    const { slugOrId } = req.params;
    let product;

    const productQuery = isAdminRequest(req)
      ? 'SELECT * FROM products WHERE '
      : 'SELECT * FROM products WHERE active = 1 AND ';
    if (/^\d+$/.test(slugOrId)) {
      product = db.prepare(`${productQuery}id = ?`).get(Number(slugOrId));
    } else {
      product = db.prepare(`${productQuery}slug = ?`).get(slugOrId);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const formatted = formatProduct(product, true);

    // Fetch related products in the same category or brand
    const relatedRows = db.prepare(`
      SELECT * FROM products
      WHERE id != ? AND (category = ? OR product_type = ?) AND active = 1
      LIMIT 3
    `).all(product.id, product.category, product.product_type);

    formatted.related = relatedRows.map(r => formatProduct(r, true));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ error: 'Failed to retrieve product details' });
  }
});

/**
 * POST /api/products (Admin Only)
 */
router.post('/', requireAdmin, (req, res) => {
  let transactionOpen = false;
  try {
    const {
      sku, name, category, product_type, brand, price, original_price,
      badge, description, materials, lens_spec, dimensions, inclusions,
      warranty_months, care_instructions, primary_image, images, active, featured,
      variants
    } = req.body;

    const validationError = validateProductInput(req.body, true);
    if (validationError) return res.status(400).json({ error: validationError });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
    const now = new Date().toISOString();

    db.exec('BEGIN');
    transactionOpen = true;
    const stmt = db.prepare(`
      INSERT INTO products (
        sku, name, slug, product_type, category, brand, price, original_price,
        badge, description, materials, lens_spec, dimensions, inclusions,
        warranty_months, care_instructions, primary_image, images, active, featured,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      sku.trim().toUpperCase(),
      name.trim(),
      slug,
      product_type || 'sunglasses',
      category || 'budget',
      brand || 'FLEXER',
      Math.round(Number(price)),
      original_price ? Math.round(Number(original_price)) : null,
      badge || null,
      description || '',
      materials || null,
      lens_spec || null,
      dimensions || null,
      JSON.stringify(Array.isArray(inclusions) ? inclusions : []),
      Number(warranty_months ?? 0),
      care_instructions || null,
      primary_image || 'uploads/product_1788183240_3699.jpg',
      JSON.stringify(Array.isArray(images) ? images : [primary_image]),
      active === false || active === 0 ? 0 : 1,
      featured ? 1 : 0,
      now,
      now
    );

    const inserted = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku.trim().toUpperCase());

    // Insert variants if provided
    if (Array.isArray(variants) && variants.length && inserted) {
      const vStmt = db.prepare(`
        INSERT INTO product_variants (product_id, sku, color_name, color_hex, image, stock_quantity, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      variants.forEach((v, idx) => {
        const vSku = String(v.sku || `${sku}-V${idx + 1}`).trim().toUpperCase();
        vStmt.run(inserted.id, vSku, v.color_name || 'Standard', v.color_hex || '#000000', v.image || primary_image, v.stock_quantity ?? 0, v.is_available === false || v.is_available === 0 ? 0 : 1);
      });
    }

    const newProd = db.prepare('SELECT * FROM products WHERE id = ?').get(inserted.id);
    db.exec('COMMIT');
    transactionOpen = false;
    res.status(201).json(formatProduct(newProd, true));
  } catch (err) {
    if (transactionOpen) db.exec('ROLLBACK');
    const conflict = err.code?.startsWith('SQLITE_CONSTRAINT');
    if (!conflict) console.error('Error creating product:', err);
    res.status(conflict ? 409 : 500).json({
      error: conflict ? 'A product or variant with that SKU already exists' : 'Failed to create product'
    });
  }
});

/**
 * PUT /api/products/:id (Admin Only)
 */
router.put('/:id', requireAdmin, (req, res) => {
  let transactionOpen = false;
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const {
      name, category, product_type, brand, price, original_price,
      badge, description, materials, lens_spec, dimensions, inclusions,
      warranty_months, care_instructions, primary_image, images, active, featured,
      variants
    } = req.body;

    const validationError = validateProductInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const now = new Date().toISOString();

    db.exec('BEGIN');
    transactionOpen = true;
    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        product_type = COALESCE(?, product_type),
        brand = COALESCE(?, brand),
        price = COALESCE(?, price),
        original_price = ?,
        badge = ?,
        description = COALESCE(?, description),
        materials = COALESCE(?, materials),
        lens_spec = COALESCE(?, lens_spec),
        dimensions = COALESCE(?, dimensions),
        inclusions = COALESCE(?, inclusions),
        warranty_months = COALESCE(?, warranty_months),
        care_instructions = COALESCE(?, care_instructions),
        primary_image = COALESCE(?, primary_image),
        images = COALESCE(?, images),
        active = COALESCE(?, active),
        featured = COALESCE(?, featured),
        updated_at = ?
      WHERE id = ?
    `).run(
      name ?? null, category ?? null, product_type ?? null, brand ?? null,
      price !== undefined ? Math.round(Number(price)) : null,
      original_price === undefined ? existing.original_price : (original_price === null || original_price === '' ? null : Math.round(Number(original_price))),
      badge === undefined ? existing.badge : badge,
      description ?? null, materials ?? null, lens_spec ?? null, dimensions ?? null,
      inclusions ? JSON.stringify(inclusions) : null,
      warranty_months ?? null, care_instructions ?? null, primary_image ?? null,
      images ? JSON.stringify(images) : null,
      active !== undefined ? (active ? 1 : 0) : null,
      featured !== undefined ? (featured ? 1 : 0) : null,
      now,
      Number(id)
    );

    // Update variants if provided
    if (Array.isArray(variants)) {
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(Number(id));
      const vStmt = db.prepare(`
        INSERT INTO product_variants (product_id, sku, color_name, color_hex, image, stock_quantity, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      variants.forEach((v, idx) => {
        const vSku = String(v.sku || `${existing.sku}-V${idx + 1}`).trim().toUpperCase();
        // Check for SKU collision with other products
        const conflict = db.prepare('SELECT product_id FROM product_variants WHERE sku = ?').get(vSku);
        if (conflict && conflict.product_id !== Number(id)) {
          const skuError = new Error('A variant with that SKU already belongs to another product');
          skuError.statusCode = 409;
          throw skuError;
        }
        vStmt.run(
          Number(id),
          vSku,
          v.color_name || 'Standard',
          v.color_hex || '#000000',
          v.image || primary_image || existing.primary_image,
          v.stock_quantity ?? 0,
          v.is_available === false || v.is_available === 0 ? 0 : 1
        );
      });
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
    db.exec('COMMIT');
    transactionOpen = false;
    res.json(formatProduct(updated, true));
  } catch (err) {
    if (transactionOpen) db.exec('ROLLBACK');
    const statusCode = err.statusCode || (err.code?.startsWith('SQLITE_CONSTRAINT') ? 409 : 500);
    if (statusCode >= 500) console.error('Error updating product:', err);
    res.status(statusCode).json({
      error: statusCode === 409 ? (err.message || 'A product or variant with that SKU already exists') : 'Failed to update product'
    });
  }
});

/**
 * DELETE /api/products/:id (Admin Only)
 */
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(Number(id));
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    // Keep catalogue identity and order snapshots available for merchant history.
    db.prepare('UPDATE products SET active = 0, featured = 0 WHERE id = ?').run(Number(id));
    res.json({ success: true, message: 'Product archived and removed from storefront. You can restore it from Products.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
