# Phases 5 and 6 — Admin, content, quality and launch hardening

## What was delivered

- A dedicated, unlinked `/admin` operations workspace with sign-in, dashboard metrics, searchable order handling, payment verification, WhatsApp customer follow-up, CSV order export, product editing, content inbox, newsletter export, and editable store/Koko settings.
- A public editorial content template for About, Contact & Support, Shipping, Returns & Exchanges, Warranty, Privacy, Terms, FAQ, Testimonials, and Newsletter pages. It is responsive, keyboard-accessible, uses the storefront bag shell, and stores contact/newsletter submissions through the API.
- Public SEO basics: unique dynamic page titles/descriptions, canonical URLs, Organization and Product JSON-LD, Open Graph metadata, `robots.txt`, and an expanded sitemap. The admin and API are excluded from crawling.
- Hardening for server responses: CSP, frame/content/referrer/permissions headers, throttling for public lead forms, and long-lived immutable cache headers for fingerprinted Vite assets.
- Apache clean routes now serve the production Vite pages, while the generated assets remain cacheable.

## Verification

Ran successfully on 28 October 2026:

```powershell
npm run lint
npm run design:build
npm run format:check
npm test
```

The integration suite passes 15/15 checks, including server-side totals, all three payment paths, Koko disabled-by-default protection, order persistence before WhatsApp, admin authorization, payment verification, and duplicate-order protection.

## Before launch

The project intentionally avoids fabricating real-world business data. Complete every item in `docs/CONTENT_TODO.md`, particularly the bank details, Koko credentials, delivery/returns/warranty terms, customer testimonials, product catalogue, photo rights, and social-card image. Run `npm run design:build` immediately before deploying so `public/build/` contains the current storefront.
