# Phase 0 audit

## Current application

The current repository is an Express application with SQLite, a static storefront, and a separate admin page. It provides server-authoritative pricing, variant stock checks, order records, payments, order audit records, newsletter signups, and customer messages.

The current order route creates an order and its item snapshots within a transaction before returning the data needed for the customer WhatsApp hand-off. It recalculates product totals from the database and rejects invalid districts, unavailable variants, and duplicate submissions. The checkout UI communicates that payment slips are shared directly through WhatsApp instead of uploaded to the server.

## Strengths carried into the rebuild

- Server-side order total calculation and stock decrementing.
- Persisted orders, item snapshots, payment states, and audit trail.
- Local Sri Lankan delivery fields and three payment methods.
- Existing settings concept for WhatsApp, bank transfer, delivery, and Koko configuration.
- Existing test coverage for key commerce paths.

## Gaps the rebuild addresses

- Target production architecture is Node/SQLite rather than requested PHP/MySQL.
- Current static-page structure is not a maintainable Vite build pipeline.
- Current font loading uses remote Google Fonts rather than bundled self-hosted assets.
- The remote public site could not be inspected from this environment.
- Existing product data and several operational details cannot be verified as business-approved catalogue content.
- The full database model lacks dedicated collections, categories, product images, customers, testimonials, FAQs, and audit-log tables in the requested target form.
- A full accessibility, SEO, image optimisation, animation, and content-page QA pass remains for later phases.

## Phase 0 deliverables

- Target architecture and non-negotiable business rules documented in `docs/DECISIONS.md`.
- Placeholder and business-supplied content catalogued in `docs/CONTENT_TODO.md`.
- MySQL schema and a deliberately marked placeholder product seed established under `database/`.
- Vite, GSAP, Lenis, local font packages, and foundation source files added without disrupting the current storefront.
