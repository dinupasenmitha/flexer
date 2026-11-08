# Phase 7 — QA and handover

Completed on 28 October 2026 (Asia/Colombo).

## Release checks completed

| Area                     | Result                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vite production build    | Passed                                                                                                                                                        |
| ESLint                   | Passed                                                                                                                                                        |
| Prettier check           | Passed                                                                                                                                                        |
| Automated commerce tests | 16/16 passed                                                                                                                                                  |
| Public routes            | Verified for Home, Shop, product, Checkout, all policy/content pages, and Admin                                                                               |
| Public admin exposure    | Home has no `/admin` link; `/admin` contains `noindex,nofollow`                                                                                               |
| Browser console          | No warnings or errors on Home, Shop, or Checkout                                                                                                              |
| Responsive smoke check   | Verified at the browser's 560px minimum viewport: no horizontal overflow, mobile navigation present, 45px checkout/bag/drawer controls                        |
| Security smoke checks    | CSP present on public pages; protected orders and CSV export reject unauthenticated requests; public settings do not expose bank or Koko credentials          |
| Checkout workflow        | Tested Bank Transfer, COD, and enabled-test Koko flows; server pricing, stock checks, order-before-WhatsApp persistence, and duplicate prevention are covered |

## Final improvements made during QA

- New admin passwords are hashed with Argon2id. Existing PBKDF2 entries retain a compatibility path so a local installation can be migrated without locking out its administrator.
- New orders begin as `pending`; eligible payment verification advances the fulfilment state to `paid`.
- Order references now use `FLX-YYYYMMDD-0001` daily sequences.
- Koko is disabled in `.env.example` and the community/bank values are explicit placeholders.
- Mobile checkout touch controls now have a minimum 45px hit area.
- `npm test` builds the storefront first, so the verification sequence works from a clean dependency install.

## Production launch requirements

The code is release-ready, but the business must supply and approve the remaining non-code information before publishing. Use `docs/CONTENT_TODO.md` as the source of truth. In particular:

1. Configure a unique `JWT_SECRET` and `DEFAULT_ADMIN_PASSWORD` in the production environment before first start.
2. Replace all bank, community, Koko, catalogue, photography, policy, warranty, and testimonial placeholders.
3. Leave Koko disabled until real merchant credentials have been validated end-to-end with Koko.
4. Run `npm ci`, `npm test`, and `npm start` on the deployment host; configure HTTPS and a reverse proxy or deploy only the matching runtime described in `README.md`.
5. Perform a manual payment and delivery confirmation with real business credentials in the production environment. This must be done by an authorized merchant, not with customer data in local QA.

## Commands for the team

```powershell
npm ci
npm test
npm start
```

Then open `http://localhost:3000/`; the merchant workspace is available only at `http://localhost:3000/admin`.
