# Phase 1 and 2 — Design shell and homepage

## Completed

- Built a responsive white, warm-ivory, deep-ink, and restrained-gold design system using local Cormorant Garamond and Manrope font files.
- Built the public shell: skip link, transparent-to-solid scroll header, desktop mega-menu, mobile navigation drawer, keyboard-closeable search overlay, global scroll-progress hairline, footer, focus states, and desktop-only custom cursor.
- Added a reduced-motion path that disables Lenis, deferred video, split reveals, parallax, scrubbed effects, and the ticker animation.
- Added preloader and local page-transition treatments, magnetic buttons, image-reveal/parallax effects, FAQ accordions, animated counters, and Lenis + GSAP/ScrollTrigger smooth-scroll wiring.
- Rebuilt the homepage with the cinematic hero, deferred video/poster fallback, brand ticker, three collection routes, live featured catalogue rail, optical-confidence story, editorial lookbook, brand story, deliberately empty testimonial state, community CTA, FAQ, newsletter sign-up, and social/support footer.
- Served the Vite-built homepage from `/` whenever the build is present, while leaving the existing commerce API and legacy checkout flow intact for later phases.

## Verification completed

- `npm run lint` passes.
- `npm run design:build` passes.
- `npm run format:check` passes.
- `npm test` passes: 14/14 existing commerce regression tests.
- An isolated `PORT=3100 npm start` preview returned HTTP 200 for the rebuilt root page, its compiled CSS asset, and `/api/products`.

## Still intentionally pending

- Replace interim hero video and uploaded catalogue/editorial images with FLEXER-owned final media.
- Replace unverified current catalogue data with approved product data.
- Configure the WhatsApp community link in Settings; the homepage currently safely routes that CTA to Contact & Support.
- Add approved customer testimonials before a carousel is published.
- Catalogue, cart, checkout, admin, content/SEO, and final QA are later delivery phases.
