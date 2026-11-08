# FLEXER rebuild decisions

## Phase 0 architecture decision

The production rebuild will use PHP 8.2+, MySQL or MariaDB, PDO prepared statements, Vite, vanilla ES modules, GSAP, ScrollTrigger, Lenis, and hand-authored CSS tokens.

This choice follows the stated cPanel and VPS deployment requirement. PHP and MySQL are available on common Sri Lankan hosting plans without a persistent Node process, while Vite produces static browser assets that can be deployed into `public/build`.

The existing Express and SQLite implementation remains in place during the rebuild. It is treated as a working legacy application, not as the target architecture. This avoids interrupting the current order flow while the PHP/MySQL replacement is built and tested phase by phase.

## Application structure

- `public/` is the web root and will contain PHP entry points, static assets, and compiled Vite files.
- `src/` is the PHP application source: routing, domain services, repositories, views, security helpers, and validation.
- `config/` contains environment configuration and framework-neutral application settings.
- `database/` holds versioned MySQL migrations, placeholder seeds, and import tooling.
- `frontend/` holds Vite entry points and source styles. It compiles into `public/build/`.
- `admin/` will remain a direct, authenticated URL and will not be linked in public navigation.

## Data and content assumptions

- The public URL `https://flexer.mrteches.com/` was not reachable from this environment during Phase 0. No remote catalogue extraction was performed.
- The existing SQLite product data is not treated as verified catalogue data. `database/seed/products.json` is intentionally marked placeholder-only and must be replaced with approved catalogue data before launch.
- Bank details, the WhatsApp community URL, and Koko credentials are settings. They must retain visibly marked placeholders until supplied by the business.
- Koko remains disabled until valid merchant credentials are configured.
- Existing policy text is the starting point for content pages. Any unsupported policy claim will be flagged rather than invented.

## Design and motion decisions

- The token system uses warm ivory, white, deep ink, and restrained gold accents. Gold is not used as a large background colour.
- Cormorant Garamond and Manrope are installed as local, self-hosted font assets through `@fontsource`; no visible UI relies on system fonts.
- GSAP and ScrollTrigger power editorial motion; Lenis is an enhancement only. Reduced-motion mode disables Lenis, parallax, scrub effects, and text splitting.
- Motion is limited to opacity and transform, uses shared timing constants, and is simplified on touch devices.

## Security and commerce decisions

- The order is created in a database transaction before any WhatsApp hand-off. The server calculates every price and delivery total.
- Payment slips are never uploaded or stored. Bank-transfer customers share a chosen file directly with FLEXER through the Web Share API where available or attach it in WhatsApp.
- Admin authentication will use Argon2id, hardened sessions, CSRF protection, server-side validation, rate limiting, audit logs, and PDO prepared statements.
- The MySQL schema stores no payment-slip path, MIME type, blob, or other receipt data.

## Phase 0 verification

- Existing Node commerce integration tests remain the regression safety net while the replacement is scaffolded.
- The MySQL migration is syntax-oriented source infrastructure; it requires a MySQL 8 or MariaDB test database to execute, which is not available in this workspace.

## Phase 1 and 2 implementation decisions

- The Vite homepage is served at `/` whenever `public/build/index.html` is present; the proven legacy Node API and existing checkout endpoints remain in place while their PHP/MySQL equivalents are built in later phases.
- The cinematic hero currently uses the existing local `public/hero-video.mp4` only as an interim technical asset. It is deferred until browser idle time, suppressed for reduced-motion and data-saver users, and always has an instant poster fallback. It must be replaced with FLEXER-owned final editorial media before launch.
- Editorial imagery currently reuses the locally available uploaded catalogue images. No stock or third-party brand imagery was introduced.
- The featured rail reads the existing public catalogue API at runtime, so the visible names, prices, and images come from the active data source rather than invented homepage content. The data itself still awaits catalogue approval.
- Testimonials are deliberately held as an empty, transparent state until permissioned customer feedback is supplied. The WhatsApp community CTA resolves to Contact & Support until its configurable invitation URL exists.

## Phase 3 and 4 implementation decisions

- Shop, product, and checkout are Vite entries served from the existing Express routes whenever their compiled files exist. They share a single browser-side bag key, while the server remains the authority for price, variants, stock, delivery, and final totals.
- The public Koko option is displayed only when the configured enabled flag and non-placeholder merchant credentials are both present. The order API enforces the same condition, so a crafted browser request cannot bypass the storefront state.
- An unauthenticated order-reference lookup exposed customer delivery data. It is now administration-only; the customer confirmation is rendered from the immediate, authenticated-in-context order-creation response instead.

## Phase 7 QA decisions

- New Node-runtime administrator credentials use Argon2id with a 16-byte nonce, 64 MiB memory cost, three passes, and a 32-byte tag. The existing PBKDF2 verifier remains solely for local upgrade compatibility; any newly created or rotated password uses Argon2id.
- Public orders start at `pending` and use an operational progression of `pending → confirmed → paid → shipped → delivered` (or `cancelled`). Payment state remains distinct, so COD and manual-payment reporting stay accurate.
- Customer order references use a Sri Lanka-local daily sequence (`FLX-YYYYMMDD-0001`). This is generated against the unique order-reference column, retaining a collision guard.
- `npm test` invokes the Vite production build first because `public/build/` is intentionally ignored from source control. This makes clean-install regression testing representative of the real server routes.
