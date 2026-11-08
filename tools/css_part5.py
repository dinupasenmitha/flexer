# -*- coding: utf-8 -*-

PART5 = """/* ============================================================
   SHOP CATALOG & FILTER SYSTEM
   ============================================================ */
.shop-header {
  padding: 60px 0 36px;
  background-color: var(--bg-surface-raised);
  border-bottom: 1px solid var(--border-subtle);
}

.filter-bar-wrap {
  position: sticky;
  top: var(--header-height);
  z-index: 95;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border-medium);
  box-shadow: 0 4px 16px rgba(20, 20, 22, 0.04);
}

.filter-bar {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-pills-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-pill {
  padding: 7px 16px;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-medium);
  background-color: var(--bg-surface);
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.filter-pill:hover {
  border-color: var(--accent-gold);
  color: var(--text-main);
}

.filter-pill.active {
  background: var(--accent-gold-gradient);
  color: #121315;
  border-color: var(--accent-gold);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(197, 160, 89, 0.3);
}

.shop-search-box {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  padding: 0 14px;
  gap: 8px;
  width: 260px;
}

.shop-search-input {
  border: none;
  background: transparent;
  padding: 8px 0;
  font-size: 0.82rem;
  color: var(--text-main);
  outline: none;
  width: 100%;
}

.shop-sort-select {
  padding: 8px 14px;
  font-size: 0.8rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  background-color: var(--bg-surface);
  color: var(--text-main);
  outline: none;
  cursor: pointer;
}

.shop-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* ============================================================
   PRODUCT DETAIL PAGE (PDP)
   ============================================================ */
.pdp-section {
  padding: 50px 0 100px;
}

.pdp-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 64px;
}

.pdp-main-image-wrap {
  position: relative;
  aspect-ratio: 1/1;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.pdp-main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pdp-thumbs-row {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  overflow-x: auto;
}

.pdp-thumb {
  width: 76px;
  height: 76px;
  object-fit: cover;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-medium);
  background-color: var(--bg-surface);
  cursor: pointer;
  opacity: 0.65;
  transition: all var(--transition-fast);
}

.pdp-thumb.active, .pdp-thumb:hover {
  opacity: 1;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px rgba(197, 160, 89, 0.35);
}

.pdp-breadcrumbs {
  font-size: 0.78rem;
  color: var(--text-subtle);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.pdp-breadcrumbs a:hover {
  color: var(--accent-gold-dark);
}

.pdp-title {
  font-family: var(--font-serif);
  font-size: clamp(2.2rem, 3.8vw, 3rem);
  font-weight: 400;
  line-height: 1.15;
  margin-bottom: 8px;
  color: var(--text-main);
}

.pdp-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin: 18px 0 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.pdp-description {
  font-size: 0.96rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 28px;
}

.pdp-variants-section {
  margin-bottom: 28px;
}

.pdp-option-label {
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.pdp-swatches-strip {
  display: flex;
  gap: 12px;
}

.pdp-swatch-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pdp-swatch-btn.active, .pdp-swatch-btn:hover {
  transform: scale(1.15);
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.4);
}

.pdp-qty-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
}

.pdp-actions-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 32px 0;
}

.pdp-specs-block {
  margin-top: 36px;
  border-top: 1px solid var(--border-medium);
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pdp-spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.9rem;
}

.pdp-spec-label {
  color: var(--text-muted);
  font-weight: 500;
}

.pdp-spec-value {
  color: var(--text-main);
  font-weight: 600;
  text-align: right;
  max-width: 60%;
}

.pdp-inclusions-card {
  padding: 24px;
  background-color: var(--bg-surface-raised);
  border: 1px solid var(--accent-gold-border);
  border-radius: var(--radius-xs);
  margin-top: 36px;
}

.pdp-spec-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.pdp-spec-table tr {
  border-bottom: 1px solid var(--border-subtle);
}

.pdp-spec-table td {
  padding: 12px 0;
}

.pdp-spec-table td:first-child {
  color: var(--text-muted);
  font-weight: 500;
}

.pdp-spec-table td:last-child {
  text-align: right;
  font-weight: 600;
  color: var(--text-main);
  font-family: var(--font-mono);
}

/* ============================================================
   RESPONSIVE MEDIA QUERIES (FULL RESPONSIVENESS)
   ============================================================ */
@media (max-width: 1024px) {
  .benefit-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .ranges-grid {
    grid-template-columns: 1fr;
  }
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .story-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .packaging-grid {
    grid-template-columns: 1fr;
  }
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
  .pdp-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .nav-links-desktop {
    display: none;
  }
  .mobile-menu-btn {
    display: flex;
  }
  .hero-section {
    min-height: 85vh;
  }
  .hero-headline {
    font-size: clamp(2.6rem, 8vw, 3.8rem);
  }
  .hero-badges-row {
    gap: 16px;
  }
  .benefit-grid {
    grid-template-columns: 1fr;
  }
  .products-grid {
    grid-template-columns: 1fr;
  }
  .quickview-grid {
    grid-template-columns: 1fr;
    padding: 24px;
  }
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .wa-strip-inner {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .container {
    padding-left: 18px;
    padding-right: 18px;
  }
  .btn {
    width: 100%;
  }
  .hero-cta-group {
    flex-direction: column;
    width: 100%;
  }
  .newsletter-form {
    flex-direction: column;
  }
  .hero-headline {
    font-size: 2.4rem;
  }
  .range-card-body {
    padding: 24px 18px;
  }
  .cart-drawer {
    width: 100vw;
  }
}
"""
