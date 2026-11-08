# -*- coding: utf-8 -*-

PART2 = """/* ============================================================
   BUTTONS (PRIMARY WITH GOLD SHIMMER, SECONDARY, WHATSAPP)
   ============================================================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 12px 28px;
  font-family: var(--font-sans);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: var(--radius-xs);
  transition: all var(--transition-smooth);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.btn-primary {
  background: var(--accent-gold-gradient);
  color: #121315;
  border: 1px solid var(--accent-gold);
  box-shadow: 0 4px 16px rgba(197, 160, 89, 0.22);
  font-weight: 700;
}

/* Luxury Light Beam Sweeping Effect on Hover */
.btn-primary::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -60%;
  width: 40%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: rotate(25deg);
  pointer-events: none;
}

.btn-primary:hover::before {
  animation: goldGleam 0.85s var(--ease-out);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-gold);
  border-color: var(--accent-gold-hover);
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-main);
  border: 1px solid var(--border-strong);
}

.btn-secondary:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold-dark);
  background-color: var(--accent-gold-subtle);
  transform: translateY(-2px);
}

.btn-whatsapp {
  background: linear-gradient(135deg, #198056 0%, #0f593b 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 16px rgba(25, 128, 86, 0.25);
}

.btn-whatsapp:hover {
  background: linear-gradient(135deg, #209968 0%, #15734d 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(25, 128, 86, 0.35);
}

.btn-magnetic {
  transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1);
}

/* ============================================================
   ANNOUNCEMENT BAR (ELEGANT DEEP CHARCOAL & GOLD)
   ============================================================ */
.announcement-bar {
  background-color: var(--bg-dark);
  color: #e5e0d4;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  height: var(--announcement-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(197, 160, 89, 0.2);
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  z-index: 101;
  transition: transform var(--transition-smooth), opacity var(--transition-smooth);
}

.announcement-content {
  display: flex;
  align-items: center;
  gap: 18px;
}

.announcement-dot {
  color: var(--accent-gold);
  font-size: 0.65rem;
  opacity: 0.85;
}

/* ============================================================
   NAVIGATION (WHITE FROSTED GLASS & GOLD HAILINES)
   ============================================================ */
.navbar {
  position: sticky;
  top: 0;
  width: 100%;
  height: var(--header-height);
  background-color: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 100;
  transition: background-color var(--transition-smooth), border-color var(--transition-smooth), box-shadow var(--transition-smooth);
}

.navbar.scrolled {
  background-color: rgba(255, 255, 255, 0.98);
  border-bottom-color: var(--accent-gold-border);
  box-shadow: 0 4px 20px rgba(20, 20, 22, 0.05);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.nav-logo {
  font-family: var(--font-mono);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--text-main);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  transition: color var(--transition-fast);
}

.nav-logo:hover {
  color: var(--accent-gold-dark);
}

.nav-links-desktop {
  display: flex;
  align-items: center;
  gap: 30px;
}

.nav-link {
  font-size: 0.82rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-weight: 500;
  color: var(--text-muted);
  position: relative;
  padding: 8px 0;
}

.nav-link:hover, .nav-link.active {
  color: var(--text-main);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0%;
  height: 2px;
  background: var(--accent-gold-gradient);
  transition: width var(--transition-fast);
}

.nav-link:hover::after, .nav-link.active::after {
  width: 100%;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-xs);
  color: var(--text-main);
  transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  position: relative;
  border: 1px solid transparent;
}

.nav-btn-icon:hover {
  background-color: var(--bg-surface-raised);
  border-color: var(--border-subtle);
  color: var(--accent-gold-dark);
}

.cart-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--accent-gold-gradient);
  color: #121315;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(197, 160, 89, 0.4);
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.mobile-menu-btn span {
  display: block;
  height: 1.5px;
  width: 22px;
  background-color: var(--text-main);
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

.mobile-menu-btn.open span:nth-child(1) {
  transform: translateY(6.5px) rotate(45deg);
}
.mobile-menu-btn.open span:nth-child(2) {
  opacity: 0;
}
.mobile-menu-btn.open span:nth-child(3) {
  transform: translateY(-6.5px) rotate(-45deg);
}

/* ============================================================
   MOBILE DRAWER
   ============================================================ */
.mobile-drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(14, 15, 18, 0.55);
  backdrop-filter: blur(6px);
  z-index: 150;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-smooth), visibility var(--transition-smooth);
}

.mobile-drawer-backdrop.open {
  opacity: 1;
  visibility: visible;
}

.mobile-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(88vw, 380px);
  height: 100vh;
  background-color: var(--bg-surface);
  border-left: 1px solid var(--accent-gold-border);
  z-index: 160;
  transform: translateX(100%);
  transition: transform var(--transition-smooth);
  display: flex;
  flex-direction: column;
  padding: 32px 24px;
  overflow-y: auto;
  box-shadow: -10px 0 40px rgba(20, 20, 22, 0.12);
}

.mobile-drawer.open {
  transform: translateX(0);
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.mobile-drawer-title {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-main);
  font-weight: 700;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-nav-link {
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-main);
  font-weight: 500;
}

.mobile-nav-link:hover {
  color: var(--accent-gold-dark);
}

.mobile-range-card {
  padding: 14px 16px;
  background-color: var(--bg-surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.mobile-range-card:hover {
  border-color: var(--accent-gold);
  background-color: var(--accent-gold-subtle);
}

.mobile-range-num {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--accent-gold-dark);
  font-weight: 600;
}

.mobile-range-title {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-main);
}

/* ============================================================
   HERO VIDEO SECTION (EDITORIAL WHITE & GOLD)
   ============================================================ */
.hero-section {
  position: relative;
  min-height: calc(100vh - var(--header-height) - var(--announcement-height));
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: #f7f4ec;
}

.hero-media-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  opacity: 0.85;
  filter: contrast(1.05) brightness(1.0);
  transition: transform 0.2s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .hero-video { display: none; }
  .hero-static-fallback { display: block !important; }
}

.hero-static-fallback {
  display: none;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  opacity: 0.88;
}

.hero-gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(252, 251, 249, 0.96) 0%,
    rgba(252, 251, 249, 0.90) 38%,
    rgba(252, 251, 249, 0.40) 65%,
    rgba(252, 251, 249, 0.20) 100%
  );
  z-index: 2;
}

.hero-bottom-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 140px;
  background: linear-gradient(to top, var(--bg-main) 0%, transparent 100%);
  z-index: 2;
}

@media (max-width: 768px) {
  .hero-gradient-overlay {
    background: linear-gradient(
      to bottom,
      rgba(252, 251, 249, 0.93) 0%,
      rgba(252, 251, 249, 0.82) 55%,
      rgba(252, 251, 249, 0.95) 100%
    );
  }
}

.hero-content {
  position: relative;
  z-index: 3;
  max-width: 760px;
  padding-top: 50px;
  padding-bottom: 70px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent-gold-dark);
  margin-bottom: 18px;
  font-weight: 600;
}

.hero-eyebrow::before {
  content: '';
  width: 32px;
  height: 1.5px;
  background: var(--accent-gold-gradient);
}

.hero-headline {
  font-family: var(--font-serif);
  font-size: clamp(3.2rem, 7vw, 5.8rem);
  line-height: 1.02;
  font-weight: 300;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  margin-bottom: 24px;
  color: var(--text-main);
}

.hero-headline strong {
  font-weight: 600;
  color: var(--accent-gold-dark);
  font-style: italic;
  font-family: var(--font-serif);
}

.hero-subtitle {
  font-size: clamp(1.05rem, 1.8vw, 1.25rem);
  color: var(--text-muted);
  font-weight: 300;
  max-width: 600px;
  margin-bottom: 38px;
  line-height: 1.65;
}

.hero-cta-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-badges-row {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-top: 52px;
  padding-top: 24px;
  border-top: 1px solid var(--border-medium);
  flex-wrap: wrap;
}

.hero-badge-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 500;
}

.hero-badge-icon {
  color: var(--accent-gold);
  font-size: 0.95rem;
}

/* ============================================================
   TICKER / MARQUEE RIBBON
   ============================================================ */
.marquee-strip {
  background: var(--accent-gold-gradient);
  color: #121315;
  padding: 14px 0;
  overflow: hidden;
  white-space: nowrap;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 18px rgba(197, 160, 89, 0.2);
}

.marquee-track {
  display: inline-flex;
  gap: 40px;
  animation: marqueeScroll 24s linear infinite;
  will-change: transform;
}

.marquee-content {
  display: inline-flex;
  align-items: center;
  gap: 32px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.marquee-star {
  color: #ffffff;
  font-size: 0.85rem;
}

/* ============================================================
   BRAND BENEFIT STRIP
   ============================================================ */
.benefit-strip {
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  padding: 44px 0;
}

.benefit-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: var(--radius-xs);
  transition: transform var(--transition-fast), background-color var(--transition-fast);
}

.benefit-item:hover {
  transform: translateY(-2px);
  background-color: var(--bg-surface-raised);
}

.benefit-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-xs);
  background: var(--accent-gold-subtle);
  border: 1px solid var(--accent-gold-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-gold-dark);
  flex-shrink: 0;
  transition: transform var(--transition-fast), background-color var(--transition-fast);
}

.benefit-item:hover .benefit-icon-box {
  transform: scale(1.08);
  background: var(--accent-gold-gradient);
  color: #121315;
}

.benefit-title {
  font-size: 0.88rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
  color: var(--text-main);
}

.benefit-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.5;
}
"""
