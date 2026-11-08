# Phase 3 and 4 — Catalogue, cart, checkout, and orders

## Completed

- Rebuilt Shop, Product Detail, and Checkout as responsive Vite pages using the Phase 1–2 visual system.
- Added URL-synchronised catalogue search, sort, collection/type filters, price filtering, active filter indicators, quick view, responsive product grid, and empty/loading states.
- Added a product gallery, thumbnail switching, variants with stock-aware selection, quantity controls, product specifications, related products, WhatsApp enquiry, and add-to-bag behavior.
- Added a persistent `localStorage` bag, accessible slide-in cart drawer, quantity controls, totals, and checkout hand-off.
- Rebuilt checkout with Sri Lanka district selection, mobile-number and email validation, bank transfer, COD, conditionally enabled Koko, authoritative order submission, and an in-brand confirmation state.
- Orders are saved and stock is decremented transactionally before the customer is offered a WhatsApp continuation. The WhatsApp message contains the reference, items, total, delivery details, and payment method.
- Bank-transfer confirmation explicitly states that payment slips are sent directly in WhatsApp and never uploaded to or stored by the website.
- Koko is now rejected by the server as well as hidden in the interface until enabled with merchant credentials. The public order lookup endpoint now requires administration authentication to avoid exposing customer details by guessed reference.

## Verification completed

- `npm run lint` passes.
- `npm run design:build` passes for Home, Shop, Product, and Checkout.
- `npm run format:check` passes.
- `npm test` passes with 15/15 checks, including disabled-Koko enforcement, server-authoritative prices, stock protection, saved-before-WhatsApp order creation, and payment workflows.
- Isolated local preview checks returned HTTP 200 for `/shop`, `/product/thinner-flex`, `/checkout`, `/api/products`, and `/api/settings`; public Koko availability was `0` without configured credentials.

## Remaining work

- The existing SQLite catalogue is still unverified content and must be replaced with approved FLEXER catalogue data before launch.
- Koko must receive genuine merchant credentials in the future admin Settings implementation before its public option can be enabled.
- The PHP/MySQL target implementation, separate admin refresh, content/SEO/accessibility/performance pass, and final QA remain in later phases.
