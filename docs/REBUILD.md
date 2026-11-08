# FLEXER — fresh build from the new brand brief

The pasted Complete Brand Profile & E-Commerce Website Development Brief is the source of truth. Earlier visual directions are superseded.

## Design and implementation

A light editorial storefront: warm white, charcoal, olive-grey neutrals and antique gold. Bold Manrope headings replace the previous dramatic serif treatment. The homepage is a new document and entry point: frontend/home.html and frontend/src/new-home.js. Branding, responsive navigation, footer, commerce styling and a light merchant dashboard are newly implemented.

Existing database records and tested order/authentication services are preserved. Rebuilding the customer experience does not require destroying order history.

## Connected features

- Database catalogue and featured products; colour/quantity selection; persistent cart and new bag page.
- Server-priced orders saved before WhatsApp. Payment and order statuses remain separate.
- Bank slips remain File objects in browser memory. Native Web Share uses capability detection; the fallback opens WhatsApp with manual attachment instructions. No upload, storage, analytics or paid-status update.
- Order tracking requires reference and checkout phone number. Only statuses are returned, without address, items or other personal information.
- Merchant-managed announcement, support number, community URL and delivery fees.
- Newsletter and contact forms use the backend.
- Motion update: a brief FLEXER wordmark and gold-line curtain entrance, viewport-triggered content reveals, subtle desktop hero drift, image/arrow hover treatments and a gold reading-progress line. Native scrolling remains responsive; reduced-motion preference disables entrance and scroll effects.
- The hero uses the existing 2.8 MB `/hero-video.mp4` eyewear film, muted and inline, with a poster beneath it and a pause/play control. It loads only near the viewport, pauses offscreen or in a background tab, and does not autoplay with reduced motion or data saver. Existing footage rights still require owner approval before launch.
- Contact fields use equal desktop columns and a single mobile column, consistent panel padding and a full-width mobile submit button. The duplicate floating support button is hidden on this page.
- Merchant product editing includes photo upload, gallery ordering, brand, warranty, packaging, colour variants, stock and availability. Updates are transactional; zero stock stays zero.
- Product Delete archives a frame from the public catalogue while preserving old order references. The admin Products table retains an explicit Restore action.
- Storefront and merchant dashboard default to a charcoal and antique-gold dark theme. The header/sidebar theme switch saves each visitor's light or dark preference locally.
- FAQs and reviews have an admin editor with draft/published control. Only approved published entries appear publicly.
- Order management supports processing and dispatch stages, internal notes and authenticated order history. Bank-transfer and COD receipts can be recorded separately from fulfilment status.

## Verification on 8 November 2026

The isolated API suite covers pricing, order creation, authentication, tracking privacy, stock rollback, draft visibility, image-upload validation, payment decisions and order history. It does not create orders in the working store database. The production bundle and frontend lint checks pass.

Browser checks covered mobile navigation, catalogue, product colour selection, bag and checkout summary at a narrow mobile viewport and desktop. A missing product-page selector helper was repaired. Physical-device and payment-provider acceptance testing remain outstanding; no Lighthouse score or cross-browser certification is claimed.

## Required before public launch

1. Confirm actual product names, prices, stock, colours, specifications and image rights. Preserved catalogue records are not certified as real inventory.
   Seven inherited image files were visually confirmed to show unrelated subjects (cosmetics, a watch, clothing, a cap, movie posters and tea). The storefront substitutes a clearly labelled neutral placeholder for these files without altering database records. Replace them through the product editor: sunglasses_premium_dark.jpg, sunglasses_editorial_1.jpg, sunglasses_luxury_gold.jpg, sunglasses_display_row.jpg, sunglasses_hero_model.jpg, sunglasses_titanium_grey.jpg and optical_frame_clear.jpg.
2. Supply an approved campaign photograph showing models in actual FLEXER products. Existing product/lifestyle images are temporary art direction and require owner approval.
3. Confirm packaging per product. Range inclusion lists come from the new brief.
4. Supply bank details, approved community invitation, support hours and official business contact details.
5. Approve returns, warranty, delivery coverage and timing. Earlier conflicting static policy pages are no longer routed publicly.
6. Confirm or clear the existing announcement in Admin Settings.
7. Koko requires merchant documentation, approved credentials and successful sandbox verification. Website integration is offered at https://www.paykoko.com/business . The inherited unverified callback and initiation handlers are disabled. Checkout rejects Koko even if credentials are entered until a verified provider adapter replaces this boundary.
8. Approved reviews and customer photo consent are required. No invented testimonials were added.
9. Production requires HTTPS, database backups and real-device acceptance testing.

## Run

Run npm run design:build, npm run lint, and npm test. Start with npm start.
The homepage is served from public/build/home.html. Restart Node after route changes.

Koko onboarding, approved campaign photography, verified catalogue/reviews and final policies are launch dependencies.
