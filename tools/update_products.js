#!/usr/bin/env node
/**
 * Reset product catalogue with real Unsplash images.
 * Run: node tools/update_products.js
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, '..', 'data', 'flexer.db');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

// Clear existing products and variants
db.exec('DELETE FROM product_variants;');
db.exec('DELETE FROM products;');

const now = new Date().toISOString();

const seedProducts = [
  // BUDGET RANGE
  {
    sku: 'FLX-B-001', name: 'Thinner Flex', slug: 'thinner-flex',
    product_type: 'sunglasses', category: 'budget', brand: 'FLEXER',
    price: 1690, original_price: 1990, badge: 'BESTSELLER',
    description: 'Fresh look, clean style, and crafted to turn heads wherever you go. Engineered with ultra-light polymer temples and UV400 clarity.',
    materials: 'Ultra-lightweight Flexible Polycarbonate Frame with reinforced alloy screw hinges.',
    lens_spec: 'UV400 Category 3 Optical lenses blocking 99.9% UVA/UVB rays.',
    dimensions: 'Lens Width: 51mm | Bridge: 19mm | Temple Length: 142mm | Total Width: 140mm',
    inclusions: JSON.stringify(['FLEXER Protective Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee']),
    warranty_months: 6,
    care_instructions: 'Rinse with clean lukewarm water before wiping with the microfibre cloth. Store in the protective zip pouch.',
    primary_image: 'uploads/sunglasses_hero.jpg',
    images: JSON.stringify(['uploads/sunglasses_hero.jpg', 'uploads/sunglasses_wayfarer_black.jpg', 'uploads/sunglasses_display_row.jpg']),
    active: 1, featured: 1,
    variants: [
      { sku: 'FLX-B-001-BLK', color_name: 'Gloss Onyx Black', color_hex: '#0c0d0e', image: 'uploads/sunglasses_hero.jpg', stock: 25 },
      { sku: 'FLX-B-001-MAT', color_name: 'Matte Charcoal', color_hex: '#2b2c2e', image: 'uploads/sunglasses_wayfarer_black.jpg', stock: 20 },
      { sku: 'FLX-B-001-GLD', color_name: 'Amber Tortoise', color_hex: '#8b5a2b', image: 'uploads/sunglasses_round_tortoise.jpg', stock: 15 }
    ]
  },
  {
    sku: 'FLX-B-002', name: 'Aero Slim Classic', slug: 'aero-slim-classic',
    product_type: 'sunglasses', category: 'budget', brand: 'FLEXER',
    price: 2850, original_price: 3450, badge: 'POPULAR',
    description: 'Understated elegance crafted for everyday city life. Sleek rounded contours that complement all facial profiles with supreme comfort.',
    materials: 'Resilient TR90 thermoplastic memory frame with featherweight comfort.',
    lens_spec: 'UV400 Gradient Smoke lenses with anti-scratch coating.',
    dimensions: 'Lens Width: 50mm | Bridge: 20mm | Temple Length: 145mm | Total Width: 138mm',
    inclusions: JSON.stringify(['FLEXER Protective Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee']),
    warranty_months: 6,
    care_instructions: 'Clean with the supplied microfibre cloth. Avoid harsh chemical cleaners.',
    primary_image: 'uploads/sunglasses_round_tortoise.jpg',
    images: JSON.stringify(['uploads/sunglasses_round_tortoise.jpg', 'uploads/sunglasses_lifestyle_1.jpg']),
    active: 1, featured: 1,
    variants: [
      { sku: 'FLX-B-002-BLK', color_name: 'Midnight Black', color_hex: '#111111', image: 'uploads/sunglasses_round_tortoise.jpg', stock: 18 },
      { sku: 'FLX-B-002-GUN', color_name: 'Gunmetal Smoke', color_hex: '#4a4f54', image: 'uploads/sunglasses_lifestyle_1.jpg', stock: 12 }
    ]
  },

  // PREMIUM RANGE
  {
    sku: 'FLX-P-001', name: 'S1 OBSIDIAN', slug: 's1-obsidian',
    product_type: 'sunglasses', category: 'premium', brand: 'FLEXER',
    price: 7950, original_price: 9500, badge: 'SIGNATURE',
    description: 'Sculpted from hand-finished Italian Mazzucchelli acetate with custom gold core-wire detailing and polarized precision optics.',
    materials: 'Italian Hand-Polished Cellulose Acetate with 5-barrel custom barrel hinges.',
    lens_spec: 'TAC 1.1mm Polarized UV400 lenses with hydrophobic coating.',
    dimensions: 'Lens Width: 53mm | Bridge: 19mm | Temple Length: 145mm | Total Width: 144mm',
    inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
    warranty_months: 6,
    care_instructions: 'Keep in hard case when not worn. Use the included anti-fog cleaner and microfibre cloth.',
    primary_image: 'uploads/sunglasses_aviator_gold.jpg',
    images: JSON.stringify(['uploads/sunglasses_aviator_gold.jpg', 'uploads/sunglasses_premium_dark.jpg', 'uploads/sunglasses_editorial_1.jpg']),
    active: 1, featured: 1,
    variants: [
      { sku: 'FLX-P-001-BG', color_name: 'Black / Brushed Gold', color_hex: '#c5a059', image: 'uploads/sunglasses_aviator_gold.jpg', stock: 14 },
      { sku: 'FLX-P-001-TOR', color_name: 'Vintage Havana Tortoise', color_hex: '#693e1b', image: 'uploads/sunglasses_premium_dark.jpg', stock: 10 }
    ]
  },
  {
    sku: 'FLX-P-002', name: 'S2 PHANTOM', slug: 's2-phantom',
    product_type: 'sunglasses', category: 'premium', brand: 'FLEXER',
    price: 8650, original_price: 10200, badge: 'DROP 01',
    description: 'Weightless architectural lines engineered with high-tensile stainless steel, precision silicone nose bridges, and deep warm brown tint.',
    materials: 'Surgical-Grade 316L Stainless Steel with micro-etched temple accents.',
    lens_spec: 'UV400 Polarized lenses with anti-reflective back coating.',
    dimensions: 'Lens Width: 54mm | Bridge: 18mm | Temple Length: 145mm | Total Width: 143mm',
    inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
    warranty_months: 6,
    care_instructions: 'Wipe with microfibre cloth. Store in magnetic hard case.',
    primary_image: 'uploads/sunglasses_cat_eye.jpg',
    images: JSON.stringify(['uploads/sunglasses_cat_eye.jpg', 'uploads/sunglasses_lifestyle_2.jpg']),
    active: 1, featured: 1,
    variants: [
      { sku: 'FLX-P-002-GB', color_name: 'Gold / Warm Brown', color_hex: '#d4af37', image: 'uploads/sunglasses_cat_eye.jpg', stock: 12 },
      { sku: 'FLX-P-002-SLV', color_name: 'Silver / Glacier Grey', color_hex: '#b0b5b9', image: 'uploads/sunglasses_lifestyle_2.jpg', stock: 9 }
    ]
  },

  // BRANDED RANGE
  {
    sku: 'FLX-BR-001', name: "S3 SPECTRE \u2014 Collector\u2019s Edition", slug: 's3-spectre-collectors-edition',
    product_type: 'sunglasses', category: 'branded', brand: 'FLEXER Atelier',
    price: 24500, original_price: 28000, badge: 'COLLECTOR',
    description: 'Aircraft-grade titanium core, Japanese titanium rimlock screws, and serialized engraved temples. Delivered in a handcrafted solid wooden presentation box.',
    materials: 'Pure Japanese Grade 2 Titanium with hand-bevelled acetate rims.',
    lens_spec: 'Polarized Diamond-Hard Multi-Coated UV400 lenses with Oleophobic shield.',
    dimensions: 'Lens Width: 55mm | Bridge: 17mm | Temple Length: 148mm | Total Width: 146mm',
    inclusions: JSON.stringify(['Handcrafted Solid Wooden Box', 'Numbered Certificate of Craft', 'Original Leather Case', '1 Year Full Warranty']),
    warranty_months: 12,
    care_instructions: 'Specially treated titanium. Use the supplied atelier cleaning solution and lambskin cloth.',
    primary_image: 'uploads/sunglasses_luxury_gold.jpg',
    images: JSON.stringify(['uploads/sunglasses_luxury_gold.jpg', 'uploads/sunglasses_titanium_grey.jpg']),
    active: 1, featured: 1,
    variants: [
      { sku: 'FLX-BR-001-TI', color_name: 'Titanium Gunmetal / Blue Reflection', color_hex: '#2b3a4a', image: 'uploads/sunglasses_titanium_grey.jpg', stock: 5 },
      { sku: 'FLX-BR-001-OBS', color_name: 'Obsidian Matte / Deep Black', color_hex: '#141416', image: 'uploads/sunglasses_luxury_gold.jpg', stock: 4 }
    ]
  },

  // OPTICAL FRAMES
  {
    sku: 'FLX-OPT-001', name: 'Lumen Geometric Optical Frame', slug: 'lumen-geometric-optical-frame',
    product_type: 'optical', category: 'premium', brand: 'FLEXER Optical',
    price: 7800, original_price: 9200, badge: 'OPTOMETRY TESTED',
    description: 'Refined architectural optical frame designed by optometry practitioners. Built for comfortable all-day wear with prescription-ready demo lenses.',
    materials: 'High-density Cellulose Acetate with flex spring temples.',
    lens_spec: 'Clear prescription-ready demo lenses with Blue Light protection filter.',
    dimensions: 'Lens Width: 51mm | Bridge: 19mm | Temple Length: 142mm | Total Width: 139mm',
    inclusions: JSON.stringify(['FLEXER Hard Shell Optical Case', 'Microfibre Optical Cloth', 'Fit Certificate', '6 Month Frame Warranty']),
    warranty_months: 6,
    care_instructions: 'Take to your certified optometrist to fit custom prescription lenses.',
    primary_image: 'uploads/optical_frame_clear.jpg',
    images: JSON.stringify(['uploads/optical_frame_clear.jpg', 'uploads/eyeglasses_optical_clear.jpg']),
    active: 1, featured: 1,
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
  const prodRow = db.prepare('SELECT id FROM products WHERE sku = ?').get(p.sku);
  if (prodRow && p.variants) {
    for (const v of p.variants) {
      insertVariant.run(prodRow.id, v.sku, v.color_name, v.color_hex, v.image, v.stock, 1);
    }
  }
}

// Verify
const products = db.prepare('SELECT id, name, primary_image, category FROM products').all();
console.log(`\nInserted ${products.length} products:`);
for (const p of products) {
  const variants = db.prepare('SELECT COUNT(*) as c FROM product_variants WHERE product_id = ?').get(p.id);
  console.log(`  [${p.category}] ${p.name} — ${variants.c} variants — ${p.primary_image}`);
}
console.log('\nProduct catalogue updated successfully.');
