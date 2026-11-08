# FLEXER — Full Redesign & Build Prompt (for Codex)

You are a senior full-stack engineer and award-level front-end designer. Redesign and rebuild the FLEXER eyewear store (currently at https://flexer.mrteches.com/) into a premium, cinematic, industry-grade ecommerce website, at the level of a big international eyewear/fashion brand (think Gentle Monster, Warby Parker, Ace & Tate, Apple-style product storytelling). Work in the phases defined in section 12. Finish and verify each phase before starting the next. Do not ask me questions unless something is truly blocking; make sensible decisions, list your assumptions in `docs/DECISIONS.md`, and keep going.

---

## 1. Brand & business context

- **Brand:** FLEXER — sunglasses, optical frames and eyewear accessories. Tagline direction: **"DON'T JUST WEAR, FLEX."**
- **Market:** Sri Lanka. Currency: **LKR** (format `LKR 7,560`). Sales channels: the website + WhatsApp.
- **Collections (3 ranges):**
  - **Budget** — LKR 1,690–4,690. Contemporary everyday frames, UV400, practical care essentials.
  - **Premium** — LKR 7,560–9,990. Italian-acetate styling, polarized optics, elevated presentation.
  - **Branded** — LKR 23,000+. Collector-level designs, premium materials, extended presentation and warranty.
- **Trust points to feature everywhere:** UV400 protection, optometry-informed frame selection, local customer care, WhatsApp support **+94 77 558 0968**, official WhatsApp community for drop announcements.
- **Social:** TikTok @flexer737 (https://www.tiktok.com/@flexer737) · Facebook (https://www.facebook.com/profile.php?id=61564498420449).
- **Existing pages to keep (and redesign):** Home · Shop all · Sunglasses · Optical frames · Budget / Premium / Branded collection pages · Product details · Bag & Checkout · About · Contact & Support · Shipping · Returns & Exchanges · Warranty · Privacy · Terms · FAQ · Testimonials · Newsletter sign-up. Merchant admin is NOT in the public navigation; it lives at a separate direct URL.

## 2. Non-negotiable business rules

1. **Payments:** Bank Transfer, Cash on Delivery, and Koko instalments — all three.
2. **Order flow:** the order MUST be saved to the database (status `pending`, with a unique reference like `FLX-20261027-0001`) **before** the customer is redirected to WhatsApp. The WhatsApp message is pre-filled with the order reference, items, totals, and delivery details.
3. **Bank payment slips are never uploaded to or stored by the site.** For bank transfer, the customer shares the slip directly with the business on WhatsApp (browser-side only; use the Web Share API where available, otherwise a clear instruction + `wa.me` link). State this plainly on the checkout page.
4. **Prices are recalculated on the server** at order time. Never trust client-side totals.
5. **Configurable placeholders** (never hard-code, never invent): bank account details, WhatsApp community/group link, Koko merchant credentials. They live in an admin-editable Settings table, with clearly marked placeholder values. Koko stays disabled until credentials are entered.
6. **Do not invent product data, reviews, or press claims.** Use real catalogue data (see section 9) or clearly marked placeholders.

## 3. Tech stack (decide, then document)

Use a stack that deploys on common Sri Lankan shared/VPS hosting (cPanel-friendly) unless I say otherwise:

- **Backend:** PHP 8.2+, MySQL/MariaDB, PDO prepared statements only. Clean structure (`/public`, `/src`, `/admin`, `/database`, `/config`), simple router, `.env` for secrets.
- **Front-end:** modern vanilla JS (ES modules) bundled with **Vite**; **GSAP + ScrollTrigger** for animation; **Lenis** for smooth scrolling. No heavy framework needed. Tailwind or hand-written CSS with a token system (CSS custom properties) — pick one and be consistent.
- If you judge another stack (e.g. Next.js) to be clearly better, you may switch, but explain why in `docs/DECISIONS.md` and keep every business rule above intact.
- Provide a one-command local setup (`README.md`), DB schema + seed scripts, and deployment notes.

## 4. Design system

**Direction:** "Quiet luxury meets cinematic." White and warm-ivory surfaces, restrained gold accents, huge editorial typography, generous whitespace, razor-sharp product photography, subtle depth. It must look expensive, not busy.

**Colour tokens (adjust slightly if needed, but keep white + gold identity):**
- `--ivory: #FAF7F0`, `--white: #FFFFFF`, `--ink: #121212`, `--ink-soft: #3A3A3A`, `--line: #E8E2D5`
- `--gold: #B8924A`, `--gold-light: #D9BC7E`, `--gold-deep: #8A6A2E`
- Gold is an accent (lines, hovers, small labels, buttons on dark). Never large flat gold backgrounds. A deep-ink section is allowed for contrast moments (hero overlay, footer, Branded range).
- All text/background pairs must meet WCAG AA.

**Typography (self-hosted woff2, `font-display: swap`, preloaded, subsetted):**
- **Display / headings:** Cormorant Garamond (or Playfair Display) — large, light weight, tight tracking, used for hero and section titles.
- **UI / body:** Manrope (or Inter) — 400/500/600.
- **Labels / eyebrows:** Manrope, uppercase, 0.18em tracking, 11–12px, in gold or ink-soft.
- Fluid type scale with `clamp()`; hero headline up to ~9–10vw on desktop. Never use system-default fonts as the visible face.

**Components to build as a coherent kit:** header (transparent → solid on scroll, hide on scroll down / show on scroll up), mega-menu, search overlay, product card (hover image swap, colour swatches, quick-view button), quick-view modal, filters drawer, cart drawer, buttons (magnetic hover), inputs, accordions (FAQ), toasts, badges, breadcrumbs, footer, custom cursor (desktop only, subtle).

## 5. Motion & interaction system

Goal: very smooth, very premium, never gimmicky, never janky.

- **Global:** Lenis smooth scroll synced with GSAP ScrollTrigger. Page-load **preloader** (FLEXER wordmark draws in, gold line sweep, then curtain reveal). Smooth **page transitions** between routes (curtain or fade-slide).
- **Easing/timing standards:** primary ease `power3.out` / `expo.out`; durations 0.6–1.2s; stagger 0.06–0.12s. Define these as shared constants.
- **Scroll effects to implement:**
  - Split-text headline reveals (line/word masks sliding up)
  - Image reveal with clip-path + slight scale-down (1.15 → 1)
  - Parallax on hero, lookbook and story images
  - Pinned storytelling sections (scrub-driven)
  - Horizontal scroll rail for featured products
  - Animated number counters / trust stats
  - Marquee ticker (brand values, "UV400 · POLARIZED · ITALIAN ACETATE")
  - Header colour/blur change on scroll; scroll-progress hairline in gold
- **Micro-interactions:** magnetic buttons, product-card hover (second image crossfade + lift), underline-draw links, swatch change animates image, add-to-bag "fly to bag" animation + cart drawer slide-in, skeleton loaders, smooth accordion height.
- **Rules:** respect `prefers-reduced-motion` (replace motion with simple fades, disable Lenis smooth scroll and parallax); only animate `transform`/`opacity`; use `will-change` sparingly; lazy-init ScrollTriggers; kill/refresh them on route change; no layout shift; keep 60fps on mid-range Android phones. On touch devices, simplify pinned/scrub effects.

## 6. Homepage — section by section

1. **Preloader** (see above) → hero entrance timeline.
2. **Cinematic hero:** full-viewport muted, looping, `playsinline` video with a high-quality **poster image** (shows instantly; video loads after). Dark gradient overlay for legibility. Giant headline **"DON'T JUST WEAR, FLEX."** with split-text reveal, a one-line sub-copy, two CTAs (**Shop Sunglasses** / **Explore Optical**), a scroll cue, and subtle scroll-driven zoom/fade as the user leaves the hero. Video path is configurable (`/assets/video/hero.mp4` + `.webm`); if absent, fall back to the poster with a slow Ken-Burns effect. Do not autoplay video when `prefers-reduced-motion` or data-saver is on. Document the ideal video spec (1080p, ≤6 MB, 8–12s seamless loop, H.264 + WebM).
3. **Brand marquee** ticker.
4. **Three Ways to Find Your Frame:** Budget / Premium / Branded as three large editorial cards with image parallax, price range, one-line positioning, and a hover reveal. Branded card uses the deep-ink treatment.
5. **Featured products:** pinned horizontal-scroll rail with product cards (quick view, swatches, price in LKR).
6. **Optical confidence (pinned scrollytelling):** UV400, polarized lenses, Italian acetate, optometry-informed selection — each beat reveals as the user scrolls, with large frame imagery changing in sync.
7. **Lookbook / editorial gallery:** staggered image grid with parallax and clip-path reveals; links into collections.
8. **Brand story teaser** → About page.
9. **Testimonials** carousel (drag/swipe, smooth).
10. **WhatsApp community CTA:** "Get drop announcements first" (link from Settings).
11. **FAQ** accordion (top 5 questions).
12. **Newsletter** sign-up (stored in DB, validated, honeypot + rate limit).
13. **Footer:** large wordmark, link groups, payment methods (Bank Transfer / COD / Koko), social links, WhatsApp support, legal links.

## 7. Other pages

- **Shop / category pages:** sticky filter bar + drawer (collection, type, range, colour, price), search, sort, active-filter chips, URL-synced state, infinite scroll or pagination, animated grid reflow, skeletons, empty state.
- **Product page:** large gallery (swipe on mobile, zoom on desktop), sticky buy panel, colour/variant selector that swaps images smoothly, price, UV400/polarized badges, frame details accordion, shipping/returns/warranty summary, WhatsApp "Ask about this frame" button, add-to-bag, related products, recently viewed.
- **Cart drawer + Bag page:** persistent (localStorage + server validation), quantity controls, subtotal, free-of-surprise delivery note.
- **Checkout:** single clean form (customer + delivery details, Sri Lanka–aware: district/city, phone validation), payment method selector with inline instructions for each method, order summary, clear slip-sharing notice, validation with friendly inline errors, success page with order reference and "Continue on WhatsApp" fallback button.
- **Content pages** (About, Contact & Support, Shipping, Returns & Exchanges, Warranty, Privacy, Terms): consistent editorial layout with sticky table of contents where long. Copy should stay faithful to the existing site; improve wording lightly, do not invent policies — flag anything missing in `docs/CONTENT_TODO.md`.
- **404 / error pages** designed in-brand.

## 8. Responsive, performance, accessibility, SEO

- **Mobile-first**, tested at 360, 390, 768, 1024, 1280, 1536, 1920 px. Touch targets ≥ 44px. Bottom-friendly cart/CTA on mobile. No horizontal overflow anywhere.
- **Performance targets:** Lighthouse mobile ≥ 90 Performance, ≥ 95 Accessibility/Best Practices/SEO. LCP < 2.5s, CLS < 0.05, INP < 200ms. Use responsive `srcset`, AVIF/WebP, lazy loading, explicit image dimensions, font preloading, code-splitting, critical CSS, gzip/brotli + cache headers (provide `.htaccess`).
- **Accessibility:** semantic HTML, skip link, visible focus states, full keyboard support for menus/drawers/modals (focus trap, Esc to close), ARIA where needed, alt text, reduced-motion support, AA contrast.
- **SEO:** unique titles/meta, Open Graph/Twitter cards, canonical URLs, `Product` + `Organization` + `BreadcrumbList` JSON-LD, `sitemap.xml`, `robots.txt`, clean URLs.

## 9. Data & content

- If https://flexer.mrteches.com/ is reachable from your environment, extract the real catalogue (names, prices, variants, colours, images, descriptions) into `database/seed/products.json` and write an importer. If not reachable, create a clearly marked **placeholder seed** that matches the three price ranges above, and note in `docs/CONTENT_TODO.md` that real data must replace it.
- Image handling: provide a build script that converts/resizes product images into responsive AVIF/WebP sets. Use neutral placeholders where real photography is missing; never use copyrighted brand imagery.
- All copy centralised so it can be edited without touching templates.

## 10. Backend & admin dashboard

**Database (MySQL):** `products`, `product_variants`, `product_images`, `collections`, `categories`, `orders`, `order_items`, `customers`, `testimonials`, `faqs`, `newsletter_subscribers`, `settings`, `admin_users`, `audit_log`. Provide migrations + seed.

**Admin (separate, unlinked URL, e.g. `/admin`):**
- Secure login (Argon2id password hash, session hardening, CSRF tokens, login rate limiting, optional IP allowlist setting).
- Dashboard: orders today/week, revenue by payment method, pending orders, low-stock alerts, simple charts.
- **Orders:** list, search, filter by status/payment method, detail view, status workflow (`pending → confirmed → paid → shipped → delivered / cancelled`), internal notes, one-click "message customer on WhatsApp" link, CSV export, printable invoice/packing slip.
- **Products & collections:** full CRUD, variants, stock, image upload and ordering, featured flags, publish/draft.
- **Content:** testimonials, FAQs, newsletter subscribers (export).
- **Settings:** WhatsApp number, WhatsApp community link, bank account details, Koko credentials/enable toggle, delivery fees, store info. Everything editable without code changes.
- Admin UI should feel as polished as the storefront (clean, fast, responsive).

**Security baseline:** prepared statements everywhere, output escaping, CSRF on every state-changing request, validation + sanitisation server-side, rate limiting on checkout/newsletter/login, secure headers (CSP, X-Frame-Options, Referrer-Policy), no secrets in the repo, no customer data in logs.

## 11. Quality bar — "industry level" checklist

- Pixel-consistent spacing on a 4/8px grid; one design-token source of truth.
- No placeholder lorem ipsum in shipped UI; no console errors; no layout jank.
- Every interactive element has hover, focus, active, disabled and loading states.
- Graceful degradation: the site is fully usable without JS for core browsing and content pages; animations are enhancement only.
- Code is typed/linted/formatted (ESLint + Prettier, PHPStan or Psalm at a sensible level), commented where non-obvious, and organised for a small team to maintain.

## 12. Phased delivery plan (stop and verify after each phase)

**Phase 0 — Audit & foundation:** inspect the current site (if reachable), write `docs/DECISIONS.md`, set up repo structure, tooling, design tokens, font loading, base layout, DB schema.
**Phase 1 — Design system & shell:** tokens, typography, buttons/inputs/cards, header/footer/mega-menu, preloader, page transitions, Lenis + GSAP wiring, reduced-motion handling.
**Phase 2 — Homepage:** all sections in section 6 with the full animation set; mobile and desktop polish.
**Phase 3 — Catalogue:** shop/category pages, filters/search/sort, product page, quick view, cart drawer.
**Phase 4 — Checkout & orders:** checkout form, three payment methods, order saved before WhatsApp redirect, server-side price validation, success page, Koko placeholder integration.
**Phase 5 — Admin dashboard:** auth, orders, products, content, settings, exports.
**Phase 6 — Content pages, SEO, accessibility, performance:** content pages, structured data, sitemap, Lighthouse/axe fixes, image pipeline, caching.
**Phase 7 — QA & handover:** cross-browser (Chrome, Safari/iOS, Firefox, Samsung Internet), device testing, end-to-end checkout test, security review, `README.md`, deployment guide, `docs/CONTENT_TODO.md` listing every placeholder I must replace (hero video, bank details, Koko credentials, community link, real product data).

**After every phase:** run the app, run lint/tests, fix errors, and give me a short summary: what was built, how to run/test it, what is still placeholder.

## 13. Definition of done

- Every page in section 1 exists, is responsive, and matches the design system.
- Homepage has the cinematic video hero, smooth scrolling, scroll-driven storytelling, and polished micro-interactions, all respecting reduced-motion.
- A test order can be placed with each payment method; it appears in the admin as `pending` before WhatsApp opens; totals match server-side pricing.
- No payment slip is ever uploaded or stored.
- Lighthouse and accessibility targets met; no console errors; setup works from a clean clone with the README.
- All placeholders are listed in `docs/CONTENT_TODO.md`.

Begin with Phase 0 now.
