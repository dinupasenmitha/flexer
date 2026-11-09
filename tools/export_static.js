const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const db = new Database(path.join(__dirname, '..', 'data', 'flexer.db'));

function normalizeImgPath(p) {
  if (!p) return '/favicon.png';
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) return p;
  return '/' + p;
}

const rawProducts = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY featured DESC, id ASC').all();
const products = rawProducts.map(p => {
  let images = [];
  try { images = JSON.parse(p.images || '[]'); } catch { images = [p.primary_image]; }
  if (!images.length && p.primary_image) images = [p.primary_image];

  let inclusions = [];
  try { inclusions = JSON.parse(p.inclusions || '[]'); } catch { inclusions = []; }

  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);
  const formattedVariants = variants.map(v => ({
    ...v,
    image: normalizeImgPath(v.image),
    is_available: Boolean(v.is_available)
  }));

  return {
    ...p,
    price: Number(p.price),
    original_price: p.original_price ? Number(p.original_price) : null,
    active: Boolean(p.active),
    featured: Boolean(p.featured),
    primary_image: normalizeImgPath(p.primary_image),
    images: images.map(normalizeImgPath),
    inclusions,
    variants: formattedVariants,
    colors: formattedVariants.map(v => v.color_hex)
  };
});

// Settings
const settingsRows = db.prepare('SELECT key, value FROM settings').all();
const settings = {};
settingsRows.forEach(r => { settings[r.key] = r.value; });
delete settings.bank_account_number;
delete settings.bank_account_name;
delete settings.bank_branch;
delete settings.koko_merchant_id;
delete settings.koko_merchant_secret;
settings.koko_enabled = '0';

// FAQs & Reviews
const faqs = db.prepare("SELECT id,kind,title,body,product_name,rating,created_at FROM content_entries WHERE kind = 'faq' AND published = 1 ORDER BY id DESC").all();
const reviews = db.prepare("SELECT id,kind,title,body,product_name,rating,created_at FROM content_entries WHERE kind = 'review' AND published = 1 ORDER BY id DESC").all();

const deployDir = path.join(__dirname, '..', 'deploy', 'api');
fs.mkdirSync(path.join(deployDir, 'content'), { recursive: true });
fs.mkdirSync(path.join(deployDir, 'products'), { recursive: true });

// 1. All products list
const productsJson = JSON.stringify(products);
fs.writeFileSync(path.join(deployDir, 'products.json'), productsJson);
fs.writeFileSync(path.join(deployDir, 'products', 'index.json'), productsJson);

// 2. Settings
const settingsJson = JSON.stringify(settings);
fs.writeFileSync(path.join(deployDir, 'settings.json'), settingsJson);
fs.writeFileSync(path.join(deployDir, 'settings'), settingsJson);

// 3. Health
const healthJson = JSON.stringify({ status: 'healthy', brand: 'FLEXER', version: '2.0.0' });
fs.writeFileSync(path.join(deployDir, 'health.json'), healthJson);
fs.writeFileSync(path.join(deployDir, 'health'), healthJson);

// 4. Individual products by ID and by SLUG
products.forEach(p => {
  const related = products
    .filter(r => r.id !== p.id && (r.category === p.category || r.product_type === p.product_type))
    .slice(0, 3);
  const detail = JSON.stringify({ ...p, related });

  // by ID
  fs.writeFileSync(path.join(deployDir, 'products', p.id + '.json'), detail);
  fs.writeFileSync(path.join(deployDir, 'products', String(p.id)), detail);

  // by SLUG
  if (p.slug) {
    fs.writeFileSync(path.join(deployDir, 'products', p.slug + '.json'), detail);
    fs.writeFileSync(path.join(deployDir, 'products', p.slug), detail);
  }
});

// 5. Content
fs.writeFileSync(path.join(deployDir, 'content', 'faq.json'), JSON.stringify(faqs));
fs.writeFileSync(path.join(deployDir, 'content', 'review.json'), JSON.stringify(reviews));

console.log('Successfully exported ' + products.length + ' products with variants, images, and slugs!');
