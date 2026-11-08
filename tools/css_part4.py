# -*- coding: utf-8 -*-

PART4 = """/* ============================================================
   FAQ ACCORDION
   ============================================================ */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.faq-item {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.faq-item.active {
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-md);
}

.faq-question {
  width: 100%;
  padding: 22px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.02rem;
  font-weight: 500;
  color: var(--text-main);
  text-align: left;
  transition: color var(--transition-fast);
}

.faq-question:hover {
  color: var(--accent-gold-dark);
}

.faq-icon-cross {
  font-size: 1.3rem;
  transition: transform var(--transition-smooth);
  color: var(--accent-gold);
  font-weight: 300;
}

.faq-item.active .faq-icon-cross {
  transform: rotate(45deg);
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--transition-smooth), padding var(--transition-smooth);
  padding: 0 28px;
  font-size: 0.92rem;
  color: var(--text-muted);
  line-height: 1.65;
}

.faq-item.active .faq-answer {
  max-height: 280px;
  padding-bottom: 24px;
}

/* ============================================================
   WHATSAPP COMMUNITY STRIP (EMERALD & GOLD LUXURY)
   ============================================================ */
.whatsapp-strip {
  background: linear-gradient(135deg, #0e1e17 0%, #08120e 100%);
  border-top: 1px solid rgba(197, 160, 89, 0.35);
  border-bottom: 1px solid rgba(197, 160, 89, 0.35);
  padding: 56px 0;
  box-shadow: 0 10px 40px rgba(10, 24, 18, 0.4);
}

.wa-strip-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 36px;
  flex-wrap: wrap;
}

.wa-strip-content {
  max-width: 680px;
}

.wa-strip-title {
  font-family: var(--font-serif);
  font-size: 2.2rem;
  font-weight: 300;
  margin-bottom: 10px;
  color: #ffffff;
}

.wa-strip-text {
  font-size: 0.96rem;
  color: #b3d7c5;
  line-height: 1.6;
}

/* ============================================================
   NEWSLETTER
   ============================================================ */
.newsletter-section {
  padding: 90px 0;
  text-align: center;
  background-color: var(--bg-surface-raised);
}

.newsletter-form {
  display: flex;
  max-width: 500px;
  margin: 32px auto 14px;
  gap: 10px;
}

.input-field {
  flex: 1;
  height: 50px;
  padding: 0 18px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  color: var(--text-main);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-field:focus {
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
}

/* ============================================================
   FOOTER (GROUNDING CHARCOAL & WARM IVORY/GOLD CONTRAST)
   ============================================================ */
.footer {
  background-color: var(--bg-dark);
  color: var(--text-white);
  border-top: 1px solid rgba(197, 160, 89, 0.25);
  padding: 80px 0 36px;
  margin-top: auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 52px;
  margin-bottom: 60px;
}

.footer-brand-title {
  font-family: var(--font-mono);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  margin-bottom: 14px;
  color: #ffffff;
}

.footer-tagline {
  font-size: 0.9rem;
  color: var(--text-muted-on-dark);
  max-width: 340px;
  line-height: 1.6;
  margin-bottom: 22px;
}

.footer-col-title {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-gold-light);
  margin-bottom: 20px;
  font-weight: 700;
}

.footer-links-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-link {
  font-size: 0.85rem;
  color: var(--text-muted-on-dark);
  transition: color var(--transition-fast), transform var(--transition-fast);
  display: inline-block;
}

.footer-link:hover {
  color: var(--accent-gold);
  transform: translateX(3px);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.8rem;
  color: var(--text-subtle-on-dark);
  flex-wrap: wrap;
  gap: 16px;
}

/* ============================================================
   CART DRAWER (WHITE & GOLD LUXURY INTERFACE)
   ============================================================ */
.cart-drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(14, 15, 18, 0.65);
  backdrop-filter: blur(8px);
  z-index: 200;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-smooth), visibility var(--transition-smooth);
}

.cart-drawer-backdrop.open {
  opacity: 1;
  visibility: visible;
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(94vw, 450px);
  height: 100vh;
  background-color: var(--bg-surface);
  border-left: 1px solid var(--accent-gold-border);
  z-index: 210;
  transform: translateX(100%);
  transition: transform var(--transition-smooth);
  display: flex;
  flex-direction: column;
  box-shadow: -15px 0 50px rgba(18, 19, 22, 0.16);
}

.cart-drawer.open {
  transform: translateX(0);
}

.cart-drawer-header {
  padding: 26px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background-color: var(--bg-surface);
}

.cart-drawer-title {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-main);
}

.cart-close-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-fast);
}

.cart-close-btn:hover {
  color: var(--text-main);
  background-color: var(--bg-surface-raised);
  border-color: var(--accent-gold);
}

.cart-drawer-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cart-empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.cart-empty-state svg {
  margin: 0 auto 18px;
  opacity: 0.35;
  color: var(--accent-gold);
}

.cart-item-row {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.cart-item-img {
  width: 84px;
  height: 84px;
  object-fit: cover;
  background-color: var(--bg-surface-raised);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.cart-item-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.cart-item-name {
  font-size: 0.92rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-main);
}

.cart-item-variant {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.cart-item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.cart-qty-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  height: 30px;
  background-color: var(--bg-surface);
}

.cart-qty-btn {
  width: 30px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: var(--text-main);
}

.cart-qty-btn:hover {
  background-color: var(--bg-surface-raised);
  color: var(--accent-gold-dark);
}

.cart-qty-val {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  padding: 0 10px;
  font-weight: 600;
}

.cart-item-price {
  font-family: var(--font-mono);
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-main);
}

.cart-item-remove {
  font-size: 0.74rem;
  color: var(--text-subtle);
  text-decoration: underline;
  cursor: pointer;
  margin-top: 6px;
}

.cart-item-remove:hover {
  color: #dc3545;
}

.cart-drawer-footer {
  padding: 26px 28px;
  background-color: var(--bg-surface-raised);
  border-top: 1px solid var(--border-medium);
}

.cart-summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.cart-summary-line.total {
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--text-main);
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--border-medium);
  margin-bottom: 20px;
}

/* ============================================================
   QUICK VIEW MODAL
   ============================================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(14, 15, 18, 0.7);
  backdrop-filter: blur(8px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-smooth), visibility var(--transition-smooth);
}

.modal-backdrop.open {
  opacity: 1;
  visibility: visible;
}

.modal-card {
  width: 100%;
  max-width: 920px;
  max-height: 90vh;
  background-color: var(--bg-surface);
  border: 1px solid var(--accent-gold-border);
  border-radius: var(--radius-xs);
  overflow-y: auto;
  position: relative;
  box-shadow: 0 30px 80px rgba(18, 19, 22, 0.25);
  animation: modalIn 0.3s var(--ease-smooth);
}

.modal-close-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 40px;
  height: 40px;
  background-color: var(--bg-surface-raised);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
  z-index: 10;
  transition: all var(--transition-fast);
}

.modal-close-btn:hover {
  background-color: var(--accent-gold);
  color: #121315;
  border-color: var(--accent-gold);
}

.quickview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  padding: 36px;
}

.quickview-gallery {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.quickview-main-img-box {
  aspect-ratio: 1/1;
  background-color: var(--bg-surface-raised);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.quickview-main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quickview-thumbs-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.quickview-thumb {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-medium);
  object-fit: cover;
  cursor: pointer;
  opacity: 0.65;
  transition: all var(--transition-fast);
}

.quickview-thumb.active, .quickview-thumb:hover {
  opacity: 1;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px rgba(197, 160, 89, 0.35);
}

.quickview-info {
  display: flex;
  flex-direction: column;
}

/* ============================================================
   FLOATING WHATSAPP BUTTON
   ============================================================ */
.floating-whatsapp {
  position: fixed;
  bottom: 26px;
  right: 26px;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(37, 211, 102, 0.45);
  z-index: 90;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  border: 2px solid rgba(255, 255, 255, 0.35);
}

.floating-whatsapp:hover {
  transform: scale(1.1);
  box-shadow: 0 14px 38px rgba(37, 211, 102, 0.65);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 400;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  background-color: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--accent-gold-border);
  padding: 14px 26px;
  border-radius: var(--radius-xs);
  font-size: 0.88rem;
  box-shadow: 0 14px 36px rgba(18, 19, 22, 0.16);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: toastIn 200ms ease forwards;
  font-weight: 500;
}

.toast.success {
  border-left: 4px solid var(--accent-gold);
}

.toast.error {
  border-left: 4px solid #dc3545;
}
"""
