# PHP application source

This directory is reserved for the production PHP 8.2 application introduced during the rebuild.

Planned namespaces:

- `Http` for routing, controllers, requests, responses, and middleware.
- `Domain` for catalogue, checkout, order, payment, content, and admin services.
- `Infrastructure` for PDO repositories, settings, sessions, CSRF, rate limiting, mail, and storage.
- `View` for server-rendered templates and shared layout partials.

All database access must use PDO prepared statements. The PHP application will replace the legacy Node/SQLite application only after Phase 4 order-flow parity and regression checks pass.
