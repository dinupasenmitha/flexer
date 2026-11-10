// ============================================================
// FLEXER EYEWEAR — Full-Stack Production HTTP Server
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Custom Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; media-src 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  next();
});

// Basic In-Memory Rate Limiter for Orders & Auth
function rateLimiter(maxRequests = 30, windowMs = 60000) {
  const map = new Map();
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = map.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
    } else {
      record.count++;
      if (record.count > maxRequests) {
        return res.status(429).json({ error: 'Too many requests. Please slow down.' });
      }
    }
    map.set(ip, record);
    next();
  };
}

// Ensure Uploads Directory exists
const UPLOADS_DIR = process.env.FLEXER_UPLOADS_DIR || path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// API Routes
app.use('/api/products', require('./routes/products'));
// Keep public checkout protection independent of merchant browsing and tracking.
app.post('/api/orders', rateLimiter(20, 60000));
app.post('/api/orders/track', rateLimiter(20, 60000));
app.post('/api/orders/:ref/whatsapp-click', rateLimiter(20, 60000));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/content', require('./routes/content'));
app.use('/api/koko', require('./routes/koko'));
app.use('/api/auth', rateLimiter(15, 60000), require('./routes/auth'));
app.use('/api/admin/stats', require('./routes/stats'));
// Public forms are deliberately throttled separately from catalogue browsing.
app.use('/api/newsletter', rateLimiter(8, 60000));
app.use('/api/contacts', rateLimiter(8, 60000));
app.use('/api', require('./routes/leads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    brand: 'FLEXER',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Static Assets
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
// Merchant-uploaded product photos can live on a persistent disk while bundled
// catalogue assets continue to fall through to the public directory.
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '1h', index: false }));
// Never serve legacy server-side source as a downloadable static file.
app.get('/api.php', (_req, res) => res.status(404).type('text').send('Not found'));
app.use(express.static(PUBLIC_DIR, {
  maxAge: '1h',
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.includes(`${path.sep}build${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Clean HTML Route Rewrites
app.get('/', (req, res) => {
  const redesignedHomepage = path.join(PUBLIC_DIR, 'build', 'home.html');
  res.sendFile(fs.existsSync(redesignedHomepage) ? redesignedHomepage : path.join(PUBLIC_DIR, 'index.html'));
});
function storefrontPage(name, legacyName) {
  const redesignedPage = path.join(PUBLIC_DIR, 'build', name);
  return fs.existsSync(redesignedPage)
    ? redesignedPage
    : path.join(PUBLIC_DIR, legacyName);
}

app.get('/shop', (req, res) => res.sendFile(storefrontPage('shop.html', 'shop.html')));
app.get('/product', (req, res) => res.sendFile(storefrontPage('product.html', 'product.html')));
app.get('/product/:slug', (req, res) => res.sendFile(storefrontPage('product.html', 'product.html')));
app.get('/budget', (req, res) => res.sendFile(storefrontPage('shop.html', 'shop.html')));
app.get('/premium', (req, res) => res.sendFile(storefrontPage('shop.html', 'shop.html')));
app.get('/branded', (req, res) => res.sendFile(storefrontPage('shop.html', 'shop.html')));
app.get('/checkout', (req, res) => res.sendFile(storefrontPage('checkout.html', 'checkout.html')));
app.get(['/cart', '/tracking'], (req, res) => res.sendFile(storefrontPage('account.html', 'checkout.html')));
app.get('/admin', (req, res) => res.sendFile(storefrontPage('admin.html', path.join('admin', 'index.html'))));

// Informational & Policy Pages
const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');
const contentPage = () => {
  const redesignedPage = path.join(PUBLIC_DIR, 'build', 'content.html');
  return fs.existsSync(redesignedPage) ? redesignedPage : path.join(PAGES_DIR, 'about.html');
};
app.get(['/about', '/contact', '/shipping', '/returns', '/warranty', '/privacy', '/terms'], (req, res) => res.sendFile(contentPage()));
app.get(['/faq', '/testimonials', '/newsletter'], (req, res) => res.sendFile(contentPage()));

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(storefrontPage('not-found.html', '404.html'));
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FLEXER Server] Running on port ${PORT}`);
    console.log(`[FLEXER Server] Admin URL: http://localhost:${PORT}/admin`);
  });
}

module.exports = app;
