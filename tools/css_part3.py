# -*- coding: utf-8 -*-

PART3 = """/* ============================================================
   CURATED RANGES SECTION
   ============================================================ */
.section {
  padding: 100px 0;
  position: relative;
}

.section-header {
  margin-bottom: 58px;
  text-align: center;
}

.ranges-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.range-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  overflow: hidden;
  transition: transform var(--transition-smooth), border-color var(--transition-smooth), box-shadow var(--transition-smooth);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card);
}

.range-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-hover);
}

.range-card-img-wrap {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
  background-color: #f5f1e8;
}

.range-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.65s var(--ease-smooth);
}

.range-card:hover .range-card-img {
  transform: scale(1.06);
}

.range-pill {
  position: absolute;
  top: 16px;
  left: 16px;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: var(--radius-xs);
  background-color: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-medium);
  color: var(--text-main);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.range-card-body {
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.range-card-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.range-name {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-main);
}

.range-price-span {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-gold-dark);
  letter-spacing: 0.04em;
}

.range-description {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 22px;
  flex-grow: 1;
}

.range-inclusions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 26px;
  padding-top: 18px;
  border-top: 1px solid var(--border-subtle);
}

.range-tag {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  background-color: var(--bg-surface-raised);
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

/* ============================================================
   PRODUCT CARDS & BESTSELLERS GRID
   ============================================================ */
.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.product-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: transform var(--transition-smooth), border-color var(--transition-smooth), box-shadow var(--transition-smooth);
  box-shadow: var(--shadow-card);
}

.product-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-hover);
}

.product-media {
  position: relative;
  aspect-ratio: 1/1;
  background-color: #f5f1e8;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.65s var(--ease-smooth);
}

.product-card:hover .product-img {
  transform: scale(1.06);
}

.product-badge-pill {
  position: absolute;
  top: 14px;
  left: 14px;
  background: var(--bg-surface);
  border: 1px solid var(--accent-gold-border);
  color: var(--accent-gold-dark);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  text-transform: uppercase;
  box-shadow: var(--shadow-sm);
  z-index: 2;
}

.product-card-actions {
  position: absolute;
  bottom: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity var(--transition-smooth), transform var(--transition-smooth);
  z-index: 3;
}

.product-card:hover .product-card-actions {
  opacity: 1;
  transform: translateY(0);
}

.btn-card-action {
  flex: 1;
  padding: 10px 12px;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: var(--radius-xs);
  background-color: rgba(255, 255, 255, 0.94);
  color: var(--text-main);
  border: 1px solid var(--border-medium);
  backdrop-filter: blur(6px);
  text-align: center;
  transition: all var(--transition-fast);
}

.btn-card-action:hover {
  background-color: var(--accent-gold);
  color: #121315;
  border-color: var(--accent-gold);
}

.product-info {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.product-tier-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-gold-dark);
  font-weight: 600;
}

.product-title {
  font-family: var(--font-serif);
  font-size: 1.45rem;
  font-weight: 400;
  letter-spacing: 0.01em;
  margin-bottom: 8px;
  line-height: 1.25;
  color: var(--text-main);
}

.product-title a:hover {
  color: var(--accent-gold-dark);
}

.product-price-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.price-current {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
}

.price-original {
  font-family: var(--font-mono);
  font-size: 0.88rem;
  color: var(--text-subtle);
  text-decoration: line-through;
}

.product-colors-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.color-swatch-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.color-swatch-dot.active, .color-swatch-dot:hover {
  transform: scale(1.3);
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px rgba(197, 160, 89, 0.35);
}

/* ============================================================
   BRAND STORY & ATELIER PHILOSOPHY
   ============================================================ */
.story-section {
  background-color: var(--bg-surface-raised);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.story-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 72px;
  align-items: center;
}

.story-media {
  position: relative;
  aspect-ratio: 4/5;
  border-radius: var(--radius-xs);
  overflow: hidden;
  background-color: #f0ebe0;
  box-shadow: var(--shadow-lg);
}

.story-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-badge-card {
  position: absolute;
  bottom: 24px;
  left: 24px;
  right: 24px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid var(--accent-gold-border);
  padding: 20px 24px;
  border-radius: var(--radius-xs);
  display: flex;
  justify-content: space-around;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.story-stat-num {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 600;
  color: var(--accent-gold-dark);
  line-height: 1;
}

.story-stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 4px;
  font-weight: 500;
}

.story-content {
  padding-right: 20px;
}

.story-quote {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.32;
  margin-bottom: 24px;
  color: var(--text-main);
}

.story-quote em {
  color: var(--accent-gold-dark);
  font-style: italic;
  font-weight: 600;
}

.story-body {
  font-size: 0.98rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 18px;
}

.story-pillars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 34px 0;
}

.story-pillar-item {
  padding: 18px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.story-pillar-item:hover {
  transform: translateY(-2px);
  border-color: var(--accent-gold);
}

.story-pillar-title {
  font-size: 0.88rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.story-pillar-title::before {
  content: '✦';
  color: var(--accent-gold);
  font-size: 0.75rem;
}

.story-pillar-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ============================================================
   PACKAGING & CRAFTSMANSHIP
   ============================================================ */
.packaging-section {
  background-color: var(--bg-main);
}

.packaging-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.packaging-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  padding: 36px 28px;
  border-radius: var(--radius-xs);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-smooth), border-color var(--transition-smooth), box-shadow var(--transition-smooth);
}

.packaging-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-md);
}

.packaging-icon {
  font-size: 2rem;
  color: var(--accent-gold);
  margin-bottom: 18px;
}

.packaging-title {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
  color: var(--text-main);
}

.packaging-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.6;
}
"""
