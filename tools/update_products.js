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
  },

  // ==========================================
  // REAL PRODUCT PHOTOGRAPHY REPERTOIRE (15 ITEMS)
  // ==========================================

  // BUDGET COLLECTION (4 Items)
  {
    sku: 'FLX-BDG-001',
    name: 'Dior CD Hinge Black Rectangular Sunglasses',
    slug: 'dior-cd-hinge-black-rectangular-sunglasses',
    product_type: 'sunglasses',
    category: 'budget',
    brand: 'Dior',
    price: 3850,
    original_price: 4500,
    badge: 'POPULAR',
    description: 'Iconic CD gold hinge detailing on high-gloss obsidian black rectangular acetate frames. UV400 dark smoke protective lenses engineered for sharp, modern style.',
    materials: 'High-density impact-resistant gloss acetate with gold-tone CD temple hinges.',
    lens_spec: 'UV400 Category 3 Dark Smoke Optical lenses blocking 100% UVA/UVB rays.',
    dimensions: 'Lens Width: 54mm | Bridge: 18mm | Temple: 145mm | Frame Width: 142mm',
    inclusions: JSON.stringify(['FLEXER Protective Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee']),
    warranty_months: 6,
    care_instructions: 'Rinse with clean lukewarm water before wiping with microfibre cloth. Store in protective pouch.',
    primary_image: 'uploads/product_budget_dior_cd_black_front.jpg',
    images: JSON.stringify([
      'uploads/product_budget_dior_cd_black_front.jpg',
      'uploads/product_budget_dior_cd_black_angle.jpg'
    ]),
    active: 1,
    featured: 1,
    variants: [
      { sku: 'FLX-BDG-001-BLK', color_name: 'Obsidian Black / Gold CD', color_hex: '#0c0d0e', image: 'uploads/product_budget_dior_cd_black_front.jpg', stock: 20 }
    ]
  },
  {
    sku: 'FLX-BDG-002',
    name: 'Off-White Square Yellow Tinted Sunglasses',
    slug: 'off-white-square-yellow-tinted-sunglasses',
    product_type: 'sunglasses',
    category: 'budget',
    brand: 'Off-White',
    price: 4200,
    original_price: 4950,
    badge: 'TRENDING',
    description: 'Bold chunky square silhouette featuring signature Off-White arrow accents and high-contrast yellow tint optics for a street-luxury aesthetic day or night.',
    materials: 'Reinforced architectural polycarbonate frame with custom barrel hinges.',
    lens_spec: 'UV400 High-Contrast Amber-Yellow Optical lenses for sharp depth perception.',
    dimensions: 'Lens Width: 53mm | Bridge: 20mm | Temple: 146mm | Frame Width: 144mm',
    inclusions: JSON.stringify(['FLEXER Protective Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee']),
    warranty_months: 6,
    care_instructions: 'Clean with the supplied microfibre cloth. Avoid harsh chemical solvents.',
    primary_image: 'uploads/product_budget_offwhite_yellow_front.jpg',
    images: JSON.stringify([
      'uploads/product_budget_offwhite_yellow_front.jpg',
      'uploads/product_budget_offwhite_yellow_angle.jpg'
    ]),
    active: 1,
    featured: 1,
    variants: [
      { sku: 'FLX-BDG-002-YEL', color_name: 'Gloss Black / Amber Yellow', color_hex: '#e5a93b', image: 'uploads/product_budget_offwhite_yellow_front.jpg', stock: 18 }
    ]
  },
  {
    sku: 'FLX-BDG-003',
    name: 'Arrow Rivet Classic Square Acetate Sunglasses',
    slug: 'arrow-rivet-classic-square-acetate-sunglasses',
    product_type: 'sunglasses',
    category: 'budget',
    brand: 'FLEXER',
    price: 2450,
    original_price: 2950,
    badge: 'BEST VALUE',
    description: 'Timeless square proportions adorned with dual silver arrow rivets. Featherlight construction for effortlessly cool daily wear with total UV400 eye comfort.',
    materials: 'Featherlight TR90 polymer with dual silver precision rivet pins.',
    lens_spec: 'UV400 Category 3 Neutral Smoke lenses with scratch-resistant hard coat.',
    dimensions: 'Lens Width: 52mm | Bridge: 19mm | Temple: 142mm | Frame Width: 140mm',
    inclusions: JSON.stringify(['FLEXER Protective Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee']),
    warranty_months: 6,
    care_instructions: 'Keep in protective pouch when not in use. Wipe clean with microfibre cloth.',
    primary_image: 'uploads/product_budget_arrow_rivet_black_front.jpg',
    images: JSON.stringify([
      'uploads/product_budget_arrow_rivet_black_front.jpg',
      'uploads/product_budget_arrow_rivet_black_angle.jpg'
    ]),
    active: 1,
    featured: 0,
    variants: [
      { sku: 'FLX-BDG-003-BLK', color_name: 'Classic Black Gloss', color_hex: '#151515', image: 'uploads/product_budget_arrow_rivet_black_front.jpg', stock: 25 }
    ]
  },
  {
    sku: 'FLX-BDG-004',
    name: 'Louis Vuitton Square Gradient Smoke Sunglasses',
    slug: 'louis-vuitton-square-gradient-smoke-sunglasses',
    product_type: 'sunglasses',
    category: 'budget',
    brand: 'Louis Vuitton',
    price: 3650,
    original_price: 4400,
    badge: 'NEW DROP',
    description: 'Subtle bevelled edges with signature temple plaques and smooth gradient smoke optics. Contemporary styling meets everyday wearability.',
    materials: 'Moulded high-grade acetate frame with stainless steel temple cores.',
    lens_spec: 'UV400 Category 3 Smooth Gradient Smoke lenses.',
    dimensions: 'Lens Width: 53mm | Bridge: 19mm | Temple: 145mm | Frame Width: 142mm',
    inclusions: JSON.stringify(['FLEXER Protective Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee']),
    warranty_months: 6,
    care_instructions: 'Clean lenses with microfibre cloth. Store safely in zip pouch.',
    primary_image: 'uploads/product_budget_lv_square_smoke_front.jpg',
    images: JSON.stringify([
      'uploads/product_budget_lv_square_smoke_front.jpg',
      'uploads/product_budget_lv_square_smoke_angle.jpg'
    ]),
    active: 1,
    featured: 0,
    variants: [
      { sku: 'FLX-BDG-004-SMK', color_name: 'Deep Obsidian / Gradient Smoke', color_hex: '#202022', image: 'uploads/product_budget_lv_square_smoke_front.jpg', stock: 16 }
    ]
  },

  // PREMIUM COLLECTION (6 Items)
  {
    sku: 'FLX-PRM-001',
    name: 'Louis Vuitton 1.1 Millionaires Black & Gold Sunglasses',
    slug: 'louis-vuitton-1-1-millionaires-black-gold-sunglasses',
    product_type: 'sunglasses',
    category: 'premium',
    brand: 'Louis Vuitton',
    price: 9450,
    original_price: 11500,
    badge: 'SIGNATURE',
    description: 'The legendary deep-beveled square frame reimagined. Crafted with luxurious gold-metal top bar detailing, engraved monogram S-lock hinges, and deep black polarized optics.',
    materials: 'Hand-polished Italian Mazzucchelli acetate with 24k gold-plated bridge metalwork and 5-barrel hinges.',
    lens_spec: 'TAC 1.1mm Polarized UV400 lenses with anti-reflective internal coating.',
    dimensions: 'Lens Width: 55mm | Bridge: 17mm | Temple: 145mm | Frame Width: 147mm',
    inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
    warranty_months: 6,
    care_instructions: 'Always store in the magnetic hard case. Clean using the anti-fog cleaner and included microfibre cloth.',
    primary_image: 'uploads/product_premium_lv_millionaire_gold_front.jpg',
    images: JSON.stringify([
      'uploads/product_premium_lv_millionaire_gold_front.jpg',
      'uploads/product_premium_lv_millionaire_gold_angle.jpg'
    ]),
    active: 1,
    featured: 1,
    variants: [
      { sku: 'FLX-PRM-001-BG', color_name: 'Onyx Black / Polished Gold', color_hex: '#c5a059', image: 'uploads/product_premium_lv_millionaire_gold_front.jpg', stock: 14 }
    ]
  },
  {
    sku: 'FLX-PRM-002',
    name: 'Louis Vuitton Millionaire All-Black Sunglasses',
    slug: 'louis-vuitton-millionaire-all-black-sunglasses',
    product_type: 'sunglasses',
    category: 'premium',
    brand: 'Louis Vuitton',
    price: 8950,
    original_price: 10800,
    badge: 'LIMITED',
    description: 'Monochromatic stealth execution of the iconic silhouette. Deep bevel fronts with tonal matte-black metal inserts and ultra-clear polarized Category 3 lenses.',
    materials: 'Heavyweight Italian acetate with midnight black PVD-coated metal top bridge.',
    lens_spec: 'UV400 Polarized Jet Black lenses with oleophobic dirt and smudge guard.',
    dimensions: 'Lens Width: 55mm | Bridge: 17mm | Temple: 145mm | Frame Width: 147mm',
    inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
    warranty_months: 6,
    care_instructions: 'Keep in hard case when not worn. Use anti-fog cleaner and microfibre cloth.',
    primary_image: 'uploads/product_premium_lv_millionaire_black_front.jpg',
    images: JSON.stringify([
      'uploads/product_premium_lv_millionaire_black_front.jpg',
      'uploads/product_premium_lv_millionaire_black_angle.jpg'
    ]),
    active: 1,
    featured: 1,
    variants: [
      { sku: 'FLX-PRM-002-BLK', color_name: 'Triple Stealth Black', color_hex: '#101010', image: 'uploads/product_premium_lv_millionaire_black_front.jpg', stock: 12 }
    ]
  },
  {
    sku: 'FLX-PRM-003',
    name: 'Louis Vuitton Square Black Acetate Sunglasses',
    slug: 'louis-vuitton-square-black-acetate-sunglasses',
    product_type: 'sunglasses',
    category: 'premium',
    brand: 'Louis Vuitton',
    price: 8250,
    original_price: 9800,
    badge: 'PREMIUM',
    description: 'Structured architecture with clean beveled profiles and discreet metallic hinge rivets. Engineered for substantial presence and uncompromising comfort.',
    materials: 'Multi-layered premium acetate with custom wire temple cores.',
    lens_spec: 'UV400 Polarized Category 3 lenses with anti-scratch diamond coating.',
    dimensions: 'Lens Width: 54mm | Bridge: 18mm | Temple: 145mm | Frame Width: 143mm',
    inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
    warranty_months: 6,
    care_instructions: 'Clean with the supplied microfibre cloth and store inside magnetic hard case.',
    primary_image: 'uploads/product_premium_lv_square_acetate_front.jpg',
    images: JSON.stringify([
      'uploads/product_premium_lv_square_acetate_front.jpg',
      'uploads/product_premium_lv_square_acetate_angle.jpg'
    ]),
    active: 1,
    featured: 0,
    variants: [
      { sku: 'FLX-PRM-003-BLK', color_name: 'Piano Black Gloss', color_hex: '#0e0e10', image: 'uploads/product_premium_lv_square_acetate_front.jpg', stock: 15 }
    ]
  },
  {
    sku: 'FLX-PRM-004',
    name: 'Moscot Amber Wayfarer Sunglasses',
    slug: 'moscot-amber-wayfarer-sunglasses',
    product_type: 'sunglasses',
    category: 'premium',
    brand: 'Moscot',
    price: 7950,
    original_price: 9500,
    badge: 'HERITAGE',
    description: 'Vintage New York heritage styling sculpted in warm amber crystal acetate. Classic keyhole bridge, diamond-shaped rivets, and calming green-grey lenses.',
    materials: 'Handcrafted translucent amber cellulose acetate with real pinned hinges.',
    lens_spec: 'UV400 Category 3 G-15 Calibar Green-Grey lenses for true color fidelity.',
    dimensions: 'Lens Width: 49mm | Bridge: 22mm | Temple: 145mm | Frame Width: 139mm',
    inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
    warranty_months: 6,
    care_instructions: 'Wipe gently with microfibre cloth. Avoid direct contact with high heat.',
    primary_image: 'uploads/product_premium_moscot_amber_wayfarer_front.jpg',
    images: JSON.stringify([
      'uploads/product_premium_moscot_amber_wayfarer_front.jpg',
      'uploads/product_premium_moscot_amber_wayfarer_angle.jpg'
    ]),
    active: 1,
    featured: 1,
    variants: [
      { sku: 'FLX-PRM-004-AMB', color_name: 'Vintage Amber Tortoise', color_hex: '#8a4f1d', image: 'uploads/product_premium_moscot_amber_wayfarer_front.jpg', stock: 12 }
    ]
  },
  {
    sku: 'FLX-PRM-005',
    name: 'Prada Milano Oval Cat-Eye Acetate Sunglasses',
    slug: 'prada-milano-oval-cat-eye-acetate-sunglasses',
    product_type: 'sunglasses',
    category: 'premium',
    brand: 'Prada',
    price: 8850,
    original_price: 10500,
    badge: 'RUNWAY',
    description: 'Sculptural oval cat-eye geometry with faceted temples bearing the distinctive Prada Milano insignia. High-fashion statement eyewear at its finest.',
    materials: 'Precision CNC-carved thick Italian acetate with geometric beveled facets.',
    lens_spec: 'UV400 Category 3 Dark Charcoal optics blocking 100% harmful UV.',
    dimensions: 'Lens Width: 52mm | Bridge: 19mm | Temple: 140mm | Frame Width: 142mm',
    inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
    warranty_months: 6,
    care_instructions: 'Store safely in the hard case. Clean using anti-fog solution and soft cloth.',
    primary_image: 'uploads/product_premium_prada_milano_oval_front.jpg',
    images: JSON.stringify([
      'uploads/product_premium_prada_milano_oval_front.jpg',
      'uploads/product_premium_prada_milano_oval_angle.jpg'
    ]),
    active: 1,
    featured: 0,
    variants: [
      { sku: 'FLX-PRM-005-BLK', color_name: 'Obsidian Black Faceted', color_hex: '#121214', image: 'uploads/product_premium_prada_milano_oval_front.jpg', stock: 10 }
    ]
  },
  {
    sku: 'FLX-PRM-006',
    name: 'Gucci Round Acetate & Gold Bar Sunglasses',
    slug: 'gucci-round-acetate-gold-bar-sunglasses',
    product_type: 'sunglasses',
    category: 'premium',
    brand: 'Gucci',
    price: 9200,
    original_price: 10900,
    badge: 'ICON',
    description: 'Bold circular silhouette accented with an architectural gold-tone brow bridge and signature temple branding. An undeniable luxury statement piece.',
    materials: 'Hand-finished gloss black acetate with stainless steel gold-plated brow bar.',
    lens_spec: 'UV400 Polarized Category 3 Solid Grey lenses with anti-glare coating.',
    dimensions: 'Lens Width: 51mm | Bridge: 21mm | Temple: 145mm | Frame Width: 141mm',
    inclusions: JSON.stringify(['FLEXER Magnetic Matte Hard Case', 'Anti-Fog Cleaner', 'Luxury Presentation Box', '3 Month Warranty']),
    warranty_months: 6,
    care_instructions: 'Handle with care. Store in protective hard case to safeguard brow bar.',
    primary_image: 'uploads/product_premium_gucci_round_gold_front.jpg',
    images: JSON.stringify([
      'uploads/product_premium_gucci_round_gold_front.jpg',
      'uploads/product_premium_gucci_round_gold_angle.jpg'
    ]),
    active: 1,
    featured: 1,
    variants: [
      { sku: 'FLX-PRM-006-GLD', color_name: 'Black / Brushed Gold Bar', color_hex: '#cca355', image: 'uploads/product_premium_gucci_round_gold_front.jpg', stock: 11 }
    ]
  },

  // BRANDED COLLECTION (5 Items)
  {
    sku: 'FLX-BRD-001',
    name: 'Vogue Geometric Metal Sunglasses',
    slug: 'vogue-geometric-metal-sunglasses',
    product_type: 'sunglasses',
    category: 'branded',
    brand: 'Vogue Eyewear',
    price: 24500,
    original_price: 27500,
    badge: 'ORIGINAL',
    description: 'Authentic Vogue Eyewear polygon geometric metal frame with ultra-fine wire temples, adjustable hypoallergenic silicone nose pads, and crystal clear UV400 lenses.',
    materials: 'Monel and stainless alloy with gold-tone electroplate finish.',
    lens_spec: 'UV400 Category 3 Optical lenses with anti-reflective coating.',
    dimensions: 'Lens Width: 53mm | Bridge: 18mm | Temple: 140mm | Frame Width: 138mm',
    inclusions: JSON.stringify(['Handcrafted Solid Wooden Box', 'Numbered Certificate of Craft', 'Original Leather Case', '1 Year Full Warranty']),
    warranty_months: 12,
    care_instructions: 'Clean with the supplied atelier cleaning solution and microfibre cloth. Store in original case.',
    primary_image: 'uploads/product_branded_vogue_geometric_front.jpg',
    images: JSON.stringify([
      'uploads/product_branded_vogue_geometric_front.jpg',
      'uploads/product_branded_vogue_geometric_angle.jpg'
    ]),
    active: 1,
    featured: 1,
    variants: [
      { sku: 'FLX-BRD-001-GLD', color_name: 'Polished Gold Metal', color_hex: '#dfb76c', image: 'uploads/product_branded_vogue_geometric_front.jpg', stock: 6 }
    ]
  },
  {
    sku: 'FLX-BRD-002',
    name: 'Polaroid Navigator Flat-Top Black Sunglasses',
    slug: 'polaroid-navigator-flat-top-black-sunglasses',
    product_type: 'sunglasses',
    category: 'branded',
    brand: 'Polaroid',
    price: 26000,
    original_price: 29500,
    badge: 'POLARIZED',
    description: 'Genuine Polaroid Eyewear flat-top navigator silhouette. Features Polaroid\'s original UltraSight polarized lenses delivering 100% glare-free visual clarity.',
    materials: 'Lightweight impact-resistant polymer with reinforced steel hinge joints.',
    lens_spec: 'Polaroid UltraSight 9-layer Polarized UV400 lenses.',
    dimensions: 'Lens Width: 57mm | Bridge: 16mm | Temple: 145mm | Frame Width: 145mm',
    inclusions: JSON.stringify(['Handcrafted Solid Wooden Box', 'Numbered Certificate of Craft', 'Original Leather Case', '1 Year Full Warranty']),
    warranty_months: 12,
    care_instructions: 'Rinse with clean water before wiping with microfibre cloth. Store in original leather case.',
    primary_image: 'uploads/product_branded_polaroid_navigator_front.jpg',
    images: JSON.stringify([
      'uploads/product_branded_polaroid_navigator_front.jpg',
      'uploads/product_branded_polaroid_navigator_angle.jpg'
    ]),
    active: 1,
    featured: 1,
    variants: [
      { sku: 'FLX-BRD-002-BLK', color_name: 'Matte Onyx Black', color_hex: '#181818', image: 'uploads/product_branded_polaroid_navigator_front.jpg', stock: 7 }
    ]
  },
  {
    sku: 'FLX-BRD-003',
    name: 'Polaroid Round Metal Wireframe Sunglasses',
    slug: 'polaroid-round-metal-wireframe-sunglasses',
    product_type: 'sunglasses',
    category: 'branded',
    brand: 'Polaroid',
    price: 23000,
    original_price: 26000,
    badge: 'POLARIZED',
    description: 'Original Polaroid round metal silhouette featuring delicate wire rims and genuine polarized lenses. A vintage-inspired essential for timeless sun protection.',
    materials: 'Surgical-grade stainless wire with laser-etched Polaroid logo on temple tips.',
    lens_spec: 'Polaroid UltraSight Polarized UV400 Grey lenses.',
    dimensions: 'Lens Width: 50mm | Bridge: 20mm | Temple: 145mm | Frame Width: 136mm',
    inclusions: JSON.stringify(['Handcrafted Solid Wooden Box', 'Numbered Certificate of Craft', 'Original Leather Case', '1 Year Full Warranty']),
    warranty_months: 12,
    care_instructions: 'Clean carefully around wire rims with microfibre cloth. Store in protective case.',
    primary_image: 'uploads/product_branded_polaroid_round_wire_front.jpg',
    images: JSON.stringify([
      'uploads/product_branded_polaroid_round_wire_front.jpg',
      'uploads/product_branded_polaroid_round_wire_angle.jpg'
    ]),
    active: 1,
    featured: 0,
    variants: [
      { sku: 'FLX-BRD-003-GUN', color_name: 'Gunmetal Silver Wire', color_hex: '#5a6065', image: 'uploads/product_branded_polaroid_round_wire_front.jpg', stock: 8 }
    ]
  },
  {
    sku: 'FLX-BRD-004',
    name: 'Polaroid Ultrapolar Sport Wrap Sunglasses',
    slug: 'polaroid-ultrapolar-sport-wrap-sunglasses',
    product_type: 'sunglasses',
    category: 'branded',
    brand: 'Polaroid',
    price: 25500,
    original_price: 28500,
    badge: 'SPORT',
    description: 'High-performance aerodynamic wrap frame engineered by Polaroid. Delivers panoramic peripheral vision, non-slip rubber grip temples, and high-contrast polarized optics.',
    materials: 'TR90 high-flex memory polymer with rubberized temple grips.',
    lens_spec: 'Polaroid High-Definition Polarized UV400 Hydrophobic lenses.',
    dimensions: 'Lens Width: 62mm | Bridge: 15mm | Temple: 135mm | Frame Width: 146mm',
    inclusions: JSON.stringify(['Handcrafted Solid Wooden Box', 'Numbered Certificate of Craft', 'Original Leather Case', '1 Year Full Warranty']),
    warranty_months: 12,
    care_instructions: 'Rinse off sweat and dust with fresh water after sports activity. Dry with clean cloth.',
    primary_image: 'uploads/product_branded_polaroid_sport_wrap_front.jpg',
    images: JSON.stringify([
      'uploads/product_branded_polaroid_sport_wrap_front.jpg',
      'uploads/product_branded_polaroid_sport_wrap_angle.jpg'
    ]),
    active: 1,
    featured: 0,
    variants: [
      { sku: 'FLX-BRD-004-BLK', color_name: 'Gloss Black Sport', color_hex: '#0d0e10', image: 'uploads/product_branded_polaroid_sport_wrap_front.jpg', stock: 6 }
    ]
  },
  {
    sku: 'FLX-BRD-005',
    name: 'Polaroid Rectangular Acetate Black Sunglasses',
    slug: 'polaroid-rectangular-acetate-black-sunglasses',
    product_type: 'sunglasses',
    category: 'branded',
    brand: 'Polaroid',
    price: 24000,
    original_price: 27000,
    badge: 'ORIGINAL',
    description: 'Modern rectangular profile with signature Polaroid rainbow pixel detailing on inner temple tips. Premium polarized lenses prevent glare in all outdoor environments.',
    materials: 'Lightweight biological acetate with integrated 3-barrel hinges.',
    lens_spec: 'Polaroid UltraSight Polarized UV400 Category 3 Smoke lenses.',
    dimensions: 'Lens Width: 54mm | Bridge: 18mm | Temple: 145mm | Frame Width: 142mm',
    inclusions: JSON.stringify(['Handcrafted Solid Wooden Box', 'Numbered Certificate of Craft', 'Original Leather Case', '1 Year Full Warranty']),
    warranty_months: 12,
    care_instructions: 'Keep inside protective case. Wipe with microfibre care cloth.',
    primary_image: 'uploads/product_branded_polaroid_acetate_black_front.jpg',
    images: JSON.stringify([
      'uploads/product_branded_polaroid_acetate_black_front.jpg',
      'uploads/product_branded_polaroid_acetate_black_angle.jpg'
    ]),
    active: 1,
    featured: 0,
    variants: [
      { sku: 'FLX-BRD-005-BLK', color_name: 'Classic Black Gloss', color_hex: '#111214', image: 'uploads/product_branded_polaroid_acetate_black_front.jpg', stock: 9 }
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
