# FLEXER EYEWEAR — Premium Eyewear Ecommerce Platform

> **Live Website:** [https://flexer.mrteches.com/](https://flexer.mrteches.com/)  
> **Brand:** FLEXER  
> **Tagline:** _Don't just wear, FLEX._
> **Primary Market:** Sri Lanka (LKR)  
> **Primary Channels:** Web Storefront + WhatsApp Official Channel  
> **Payment Methods:** Bank Transfer (Manual), Cash on Delivery (COD), and Koko (3-Installments)

---

## Rebuild status

The current operational runtime is Node and SQLite. The visual storefront is a Vite build using GSAP and Lenis; it now includes completed catalogue, checkout, separate administration, content, SEO, accessibility, and performance phases. The PHP/MySQL structure remains deployment infrastructure for the future shared-hosting migration.

Phase decisions, verified gaps, and launch constraints are documented in:

- `docs/DECISIONS.md`
- `docs/PHASE_0_AUDIT.md`
- `docs/CONTENT_TODO.md`
- `docs/PHASE_5_6_SUMMARY.md`
- `docs/PHASE_7_QA_HANDOVER.md`

### Frontend foundation commands

```bash
# Install the current dependencies
npm install

# Build the Vite design foundation into public/build
npm run design:build

# Open the standalone Vite foundation preview during development
npm run design:dev

# Verify formatting and the legacy commerce regression suite
npm run format:check
npm test
```

The new PHP runtime is not installed in this local workspace, so the MySQL migration is supplied as versioned deployment infrastructure and will be executed against the target PHP/MySQL environment in a later phase. The existing Node test suite continues to protect the live order flow while migration work is in progress.

---

## 1. Executive Summary & Architectural Overview

This repository houses the full-stack redesign and production-ready implementation of the **FLEXER** eyewear ecommerce system. Designed as a fashion-led, contemporary luxury eyewear brand, it replaces generic templates and simulated front-end prototypes with a persistent, secure, server-authoritative architecture.

### Key Architectural Pillars:

1. **Server-Authoritative Price Validation:** Shopping cart prices submitted by the browser are strictly discarded; all item subtotals, packaging upgrades, delivery fees, and discounts are computed from the persistent database on the server.
2. **Persistent Database & Audit Trail:** Powered by SQLite with Write-Ahead Logging (WAL) and foreign keys, maintaining transactional integrity across products, variants, orders, item snapshots, payments, and administrative audit logs.
3. **Collision-Safe Order References:** Generates human-readable daily references formatted as `FLX-YYYYMMDD-0001` (for example, `FLX-20261028-0001`).
4. **Strict Payment-Slip Privacy:** Complies with privacy requirements: customer bank transfer receipts are **NEVER uploaded to or stored on the server**, and are shared strictly via browser-local file selection and Web Share API / WhatsApp.
5. **Real Administrative Command Center:** Protected by HMAC-SHA256 token authentication, featuring real-time verified revenue metrics (distinguished from unpaid COD), order status pipelines, audit-trailed payment verification, product catalogue controls, and business settings.
6. **Persistent Node Deployment:** Runs as a Node.js full-stack service with SQLite and persistent product-upload storage. The legacy PHP bridge is blocked because it does not implement the current authentication and admin contracts.

---

## 2. Directory Structure

```
├── data/
│   └── flexer.db                 # Persistent SQLite database (WAL mode, indexed)
├── server/
│   ├── db.js                     # Schema migrations, seed data, and query engine
│   ├── auth.js                   # HMAC JWT generation, PBKDF2 hashing, admin middleware
│   ├── server.js                 # Express HTTP server with security headers & rate limiting
│   └── routes/
│       ├── products.js           # Catalogue API with search, filtering, and sorting
│       ├── orders.js             # Server-authoritative order creation & management
│       ├── settings.js           # Editable store settings (bank details, WhatsApp, etc.)
│       ├── koko.js               # Koko installment integration boundary & webhook
│       ├── stats.js              # Verified revenue & operational dashboard analytics
│       ├── auth.js               # Admin authentication & session verification
│       └── leads.js              # Newsletter subscribers & contact messages
├── public/
│   ├── css/
│   │   └── style.css             # Luxury editorial design system (responsive 320px–1440px+)
│   ├── js/
│   │   ├── store.js              # Client state, shopping bag, toast alerts, QuickView
│   │   ├── main.js               # Homepage interactions, video fallback, FAQ
│   │   ├── shop.js               # Dynamic catalogue filtering, search, and sorting
│   │   ├── product.js            # Product detail page (PDP) gallery, swatches, specs
│   │   └── checkout.js           # Checkout validation, district selection, slip privacy
│   ├── admin/
│   │   ├── index.html            # Protected Admin Dashboard
│   │   ├── admin.css             # Administration dark editorial styling
│   │   └── admin.js              # Admin metrics, orders, payment verify, settings
│   ├── pages/
│   │   ├── about.html            # Brand story (optometry scholar founder background)
│   │   ├── contact.html          # Contact details & direct WhatsApp Care
│   │   ├── shipping.html         # Delivery policy across all 25 Sri Lankan districts
│   │   ├── returns.html          # 48h / 30-day return & exchange policy
│   │   ├── warranty.html         # 6-month & 1-year manufacturing defect guarantee
│   │   ├── privacy.html          # Privacy policy with payment slip privacy guarantee
│   │   └── terms.html            # Terms of service
│   ├── uploads/                  # High-resolution product photography
│   ├── api.php                   # Hostinger PHP 8.2 native bridge
│   ├── .htaccess                 # Clean URL rewrites & security headers for Apache
│   ├── index.html                # Editorial Homepage with cinematic video hero
│   ├── shop.html                 # Full catalogue page
│   ├── product.html              # Dedicated Product Detail Page
│   ├── checkout.html             # Multi-step checkout with district selector
│   ├── 404.html                  # Custom luxury 404 error page
│   ├── robots.txt                # Search engine crawler configuration
│   └── sitemap.xml               # Full XML sitemap
├── tests/
│   └── ecommerce.test.js         # Automated test suite (12/12 passing tests)
├── .env.example                  # Environment configuration template
├── package.json                  # Node dependencies & npm scripts
└── README.md                     # Documentation
```

---

## 3. Getting Started & Running Locally

### Prerequisites

- Node.js 24.7.0 or higher in the Node 24 release line (Node's built-in Argon2 support is required).
- npm 10 or higher.

### Installation

```bash
# Clone or navigate to the project directory
cd flexer

# Install dependencies
npm install
```

### Running the Application

```bash
# Start production server
npm start

# Or run in development watch mode
npm run dev
```

The application will launch at:

- **Storefront:** [http://localhost:3000](http://localhost:3000)
- **Catalogue:** [http://localhost:3000/shop](http://localhost:3000/shop)
- **Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)

Run `npm run design:build` once after installing dependencies and whenever storefront source files change; the Node server serves the built pages from `public/build`.

### Running Automated Tests

```bash
npm test
```

The test suite executes 15 automated integration and unit tests using Node's native test runner (`node:test` and `node:assert`), covering:

- Health checks
- Catalogue queries with variant trees
- Filter and search accuracy
- Server-side price tampering rejection
- 25 Sri Lankan administrative districts validation
- Bank Transfer order persistence & collision-safe reference format
- COD status handling
- Koko boundary and safe pending fallback
- Unauthorized endpoint rejection (401)
- Admin authentication and payment verification audit logging
- WhatsApp event tracking
- Duplicate order submission rate-limiting (429)

---

## 4. Admin credentials

On a production installation, set `DEFAULT_ADMIN_PASSWORD` and `JWT_SECRET` in the environment before the first start. The initial administrator username is `admin`; its password is the private value you configured. A production server will refuse to initialize a new database without `DEFAULT_ADMIN_PASSWORD`.

For an existing database that still has the legacy development password, set `DEFAULT_ADMIN_PASSWORD` once and restart the application; startup rotates that legacy password to your configured value.

---

## 5. Payment Methods & Workflow Implementation

### 1. Bank Transfer (Manual Payment)

1. Customer enters delivery details (with Sri Lankan district selector).
2. Server validates details and creates the persistent order in `orders` and `order_items` with status `awaiting_transfer`.
3. Customer receives the unique `FLX-YYYYMMDD-0001` reference, official bank account information, and copy controls.
4. **Strict Privacy Requirement:** Customer selects their payment slip file locally. The file is **never uploaded to the server**.
5. When supported, the Web Share API is invoked with the slip and prefilled order details.
6. As a manual fallback, WhatsApp opens with prefilled order details and instructions for the customer to attach their slip directly in the chat.
7. Admin verifies the bank transfer against bank statements and triggers "Verify Paid", which logs the admin's username and verification timestamp in `payments` and `order_audit_logs`.

### 2. Cash on Delivery (COD)

1. Customer selects COD during checkout.
2. Server validates and saves the order with payment status `due_on_delivery` and order status `new`.
3. Customer is presented with the confirmation screen and clicks "Confirm Order on WhatsApp".
4. WhatsApp opens with prefilled customer delivery address, items, and total payable amount.
5. Payment remains `due_on_delivery` until courier collection. Unpaid COD orders are never counted as collected revenue in admin metrics.

### 3. Koko (3-Installment Buy Now Pay Later)

1. Displayed as a payment choice alongside Bank Transfer and COD.
2. Server creates the persistent order with payment status `koko_pending`.
3. **Pending Merchant Credentials Fallback:** Clearly explains that FLEXER will generate the official Koko payment link upon order review.
4. Direct API integration boundary (`POST /api/koko/initiate` and `POST /api/koko/webhook`) is ready for production credentials once merchant agreement is finalized.

---

## 6. Deployment Guides

### Node.js Full-Stack Deployment (Hostinger Node, VPS, Render, Railway, Docker)

1. Set environment variables from `.env.example`.
2. Point `FLEXER_DATA_DIR` and `FLEXER_UPLOADS_DIR` at durable storage that survives deploys and restarts. The included Render Blueprint provisions these paths on a persistent disk.
3. Start using `npm start` with process managers such as `pm2` or Docker:
   ```bash
   pm2 start server/server.js --name "flexer"
   ```
4. Set up reverse proxy in Nginx or Apache pointing port `3000` to your domain.

Netlify and Vercel function adapters are suitable for previews only while this project uses SQLite: their ephemeral filesystems do not provide durable order, admin, or upload storage. Do not use a static Drop/FTP upload for production commerce.

---

## 7. Business Configuration Values

To update store configuration, log into the Admin Dashboard (`/admin`) and navigate to **Business Settings**:

- **Official WhatsApp Number:** e.g., `94775580968`
- **WhatsApp Community URL:** e.g., `https://chat.whatsapp.com/Bj1jp9x5n4QDovZsfiMCr9...`
- **Bank Account Details:** Bank Name, Branch, Account Holder, Account Number, Transfer Instructions
- **Islandwide Delivery Fee:** Currently `0` (Free Promotion)
- **Top Announcement Bar:** Live promotional banner text
- **Koko Merchant Settings:** Merchant ID and API keys when supplied by Koko
