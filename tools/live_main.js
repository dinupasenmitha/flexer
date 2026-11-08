/* ============================================
   FLEXER EYEWEAR — JavaScript (API-connected)
   ============================================ */

const API = window.location.origin;

// ---- MOBILE CACHE BUSTER ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
  });
}

// ---- STATE ----
let cart = JSON.parse(localStorage.getItem('FLEXER_cart') || '[]');

// ---- DOM REFS ----
const navbar       = document.getElementById('navbar');
const cartBtn      = document.getElementById('cart-btn');
const cartDrawer   = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const cartCount    = document.getElementById('cart-count');
const cartBody     = document.getElementById('cart-body');
const cartEmpty    = document.getElementById('cart-empty');
const cartFooter   = document.getElementById('cart-footer');
const cartTotalDisplay = document.getElementById('cart-total-display');
const toast        = document.getElementById('toast');
const heroImg      = document.getElementById('hero-img');
const mobileToggle = document.getElementById('mobile-menu-toggle');
const mobileNav    = document.getElementById('mobile-nav');
let cartOpen       = false;

// ---- HERO IMAGE LOAD ----
if (heroImg) {
  heroImg.addEventListener('load', () => heroImg.classList.add('loaded'));
  if (heroImg.complete) heroImg.classList.add('loaded');
}

// ---- NAVBAR SCROLL ----
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const announceH = document.getElementById('announcement-bar')?.offsetHeight || 0;
  navbar.classList.toggle('scrolled', y > announceH);
}, { passive: true });

// ---- MOBILE MENU ----
const mobileBackdrop = document.getElementById('mobile-nav-backdrop');

function closeMobileNav() {
  if (mobileNav) {
    mobileNav.classList.remove('open');
    mobileNav.style.display = '';
  }
  if (mobileToggle) {
    mobileToggle.classList.remove('open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  }
  if (mobileBackdrop) {
    mobileBackdrop.classList.remove('open');
  }
}

function toggleMobileNav() {
  if (!mobileNav) return;
  const isOpen = mobileNav.classList.contains('open');
  if (isOpen) {
    closeMobileNav();
  } else {
    mobileNav.classList.add('open');
    if (mobileToggle) {
      mobileToggle.classList.add('open');
      mobileToggle.setAttribute('aria-expanded', 'true');
    }
    if (mobileBackdrop) {
      mobileBackdrop.classList.add('open');
    }
  }
}

if (mobileToggle) {
  mobileToggle.addEventListener('click', toggleMobileNav);
}
if (mobileBackdrop) {
  mobileBackdrop.addEventListener('click', closeMobileNav);
}

document.querySelectorAll('.mobile-nav-main-link, .mobile-range-card, .mobile-nav-sub-link, .mobile-nav-link').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

// ============================================
//  PRODUCTS — Load from API, split into tiers
// ============================================
const TIER_CONFIG = {
  budget:  { color: '#6ee7b7', label: 'BUDGET',  accentVar: '--tier-budget-color' },
  premium: { color: '#c9a84c', label: 'PREMIUM', accentVar: '--tier-premium-color' },
  branded: { color: '#a78bfa', label: 'BRANDED', accentVar: '--tier-branded-color' }
};

let allLoadedProducts = [];

async function loadProducts() {
  try {
    const res = await fetch(`${API}/api/products`);
    const products = await res.json();
    allLoadedProducts = products;

    const byTier = { budget: [], premium: [], branded: [] };
    products.forEach(p => {
      const cat = (p.category || 'budget').toLowerCase();
      if (byTier[cat]) byTier[cat].push(p);
      else byTier.budget.push(p);
    });    const DISPLAY_PRICE_RANGES = {
      budget: 'LKR 1,690 – LKR 4,690',
      premium: 'LKR 7,560 – LKR 9,990',
      branded: 'LKR 23,000+'
    };

    ['budget', 'premium', 'branded'].forEach(tier => {
      const rangeEl = document.getElementById(`tier-${tier}-range`);
      if (rangeEl) {
        rangeEl.textContent = DISPLAY_PRICE_RANGES[tier] || '';
      }
    });

    // Populate Bestsellers Grid
    const bestSellersGrid = document.getElementById('bestsellers-grid');
    if (bestSellersGrid && products.length) {
      // Sort products: BESTSELLER badge first, then by sales_count or ID
      const sorted = [...products].sort((a, b) => {
        const aIsBest = (a.badge || '').toUpperCase() === 'BESTSELLER' ? 1 : 0;
        const bIsBest = (b.badge || '').toUpperCase() === 'BESTSELLER' ? 1 : 0;
        if (aIsBest !== bIsBest) return bIsBest - aIsBest;
        return (b.sales_count || 0) - (a.sales_count || 0) || a.id - b.id;
      });

      const topItems = sorted.slice(0, 6);
      bestSellersGrid.innerHTML = topItems.map(p => renderProductCard(p, (p.category || 'budget').toLowerCase())).join('');

      bestSellersGrid.querySelectorAll('.product-card').forEach((el, i) => {
        el.classList.add('reveal');
        if (i % 3 === 1) el.classList.add('reveal-delay-1');
        if (i % 3 === 2) el.classList.add('reveal-delay-2');
        revealObserver.observe(el);
      });
    }
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function renderProductCard(p, tier) {
  const images = Array.isArray(p.images) && p.images.length
    ? p.images.map(img => img.startsWith('uploads/') ? `${API}/${img}` : img)
    : [(p.image && p.image.startsWith('uploads/') ? `${API}/${p.image}` : p.image || 'hero.png')];

  const mainImageSrc = images[0];

  const colors   = Array.isArray(p.colors)   ? p.colors   : [];
  const features = Array.isArray(p.features) ? p.features : [];

  const colorDots = colors.map((c, i) =>
    `<span class="color-dot${i===0?' active':''}" style="background:${c}" title="${c}"></span>`
  ).join('');

  // Angle thumbnails for multi-angle glasses
  const angleSwitchers = images.length > 1
    ? `<div class="angle-switchers">
        ${images.map((img, idx) => `
          <button class="angle-dot${idx===0?' active':''}"
                  onclick="switchCardAngle(event, ${p.id}, '${img}')"
                  title="Angle ${idx+1}">
            ${idx+1}
          </button>
        `).join('')}
       </div>`
    : '';

  const featuresList = features.length
    ? `<ul class="product-features">${features.map(f => `<li><span class="feat-check">✓</span>${f}</li>`).join('')}</ul>`
    : '';

  const discount = p.original_price
    ? `<span class="price-original">LKR ${p.original_price.toLocaleString()}</span>` : '';

  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.budget;

  return `
    <article class="product-card product-card-${tier}" id="product-${p.id}">
      <div class="product-img-wrap">
        <img src="${mainImageSrc}" alt="${p.name}" class="product-img" id="card-img-${p.id}" loading="lazy" />
        <div class="product-overlay">
          <button class="quick-add-btn" onclick="openQuickView(${p.id})">Quick View 👁️</button>
          <button class="quick-add-btn primary-add" onclick="addToCart(${p.id},'${p.name}',${p.price},'${mainImageSrc}')">Add to Cart</button>
        </div>
        <span class="tier-pill tier-pill-${tier} product-tier-badge">${tierCfg.label}</span>
        ${angleSwitchers}
      </div>
      <div class="product-info">
        <div class="product-header">
          <h3 class="product-name" onclick="openQuickView(${p.id})">${p.name}</h3>
          <div class="product-price">
            <span class="price-sale">LKR ${p.price.toLocaleString()}</span>
            ${discount}
          </div>
        </div>
        <p class="product-desc">${p.description || ''}</p>
        ${featuresList}
        <div class="product-colors">${colorDots}</div>
        <button class="btn btn-primary btn-full btn-tier-${tier}" onclick="addToCart(${p.id},'${p.name}',${p.price},'${mainImageSrc}')">
          Shop Now
        </button>
      </div>
    </article>`;
}

function switchCardAngle(event, productId, newSrc) {
  event.stopPropagation();
  const cardImg = document.getElementById(`card-img-${productId}`);
  if (cardImg) {
    cardImg.src = newSrc;
  }
  const parent = event.currentTarget.parentElement;
  if (parent) {
    parent.querySelectorAll('.angle-dot').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
  }
}

// ============================================
//  QUICK VIEW MODAL
// ============================================
function openQuickView(productId) {
  const p = allLoadedProducts.find(item => item.id === productId);
  if (!p) return;

  const images = Array.isArray(p.images) && p.images.length
    ? p.images.map(img => img.startsWith('uploads/') ? `${API}/${img}` : img)
    : [(p.image && p.image.startsWith('uploads/') ? `${API}/${p.image}` : p.image || 'hero.png')];

  const colors   = Array.isArray(p.colors)   ? p.colors   : [];
  const features = Array.isArray(p.features) ? p.features : [];

  const tier = (p.category || 'budget').toLowerCase();
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.budget;

  const thumbsHtml = images.length > 1
    ? `<div class="qv-thumbs">
        ${images.map((img, idx) => `
          <div class="qv-thumb${idx===0?' active':''}" onclick="setQuickViewMainImg('${img}', this)">
            <img src="${img}" alt="Angle ${idx+1}" />
          </div>
        `).join('')}
       </div>`
    : '';

  const featuresHtml = features.length
    ? `<div class="qv-features">
        <h4>Package & Product Features</h4>
        <ul>${features.map(f => `<li><span class="feat-check">✓</span>${f}</li>`).join('')}</ul>
       </div>`
    : '';

  const colorsHtml = colors.length
    ? `<div class="qv-colors">
        <span>Available Colors:</span>
        <div class="product-colors">
          ${colors.map((c, i) => `<span class="color-dot${i===0?' active':''}" style="background:${c}" title="${c}"></span>`).join('')}
        </div>
       </div>`
    : '';

  const modalBody = document.getElementById('quickview-body');
  modalBody.innerHTML = `
    <div class="qv-grid">
      <div class="qv-gallery">
        <div class="qv-main-img-wrap">
          <img src="${images[0]}" alt="${p.name}" id="qv-main-img" />
          <span class="tier-pill tier-pill-${tier}">${tierCfg.label}</span>
        </div>
        ${thumbsHtml}
      </div>
      <div class="qv-info">
        <span class="qv-category">${tier.toUpperCase()} RANGE</span>
        <h2 class="qv-title">${p.name}</h2>
        <div class="qv-price">
          <span class="price-sale">LKR ${p.price.toLocaleString()}</span>
          ${p.original_price ? `<span class="price-original">LKR ${p.original_price.toLocaleString()}</span>` : ''}
        </div>
        <p class="qv-desc">${p.description || ''}</p>
        ${colorsHtml}
        ${featuresHtml}
        <div class="qv-actions">
          <button class="btn btn-primary btn-full btn-tier-${tier}" onclick="addToCart(${p.id},'${p.name}',${p.price},'${images[0]}'); closeQuickView();">
            Add to Cart — LKR ${p.price.toLocaleString()}
          </button>
          <button type="button" class="btn btn-ghost btn-full qv-close-bottom-btn" onclick="closeQuickView()">
            ← Close &amp; Continue Browsing
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('quickview-backdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  quickViewActive = true;

  if (window.history && window.history.pushState) {
    window.history.pushState({ modal: 'quickview' }, '');
  }
}

function setQuickViewMainImg(src, thumbEl) {
  const mainImg = document.getElementById('qv-main-img');
  if (mainImg) mainImg.src = src;
  if (thumbEl) {
    thumbEl.parentElement.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
    thumbEl.classList.add('active');
  }
}

let quickViewActive = false;

function closeQuickView() {
  const backdrop = document.getElementById('quickview-backdrop');
  if (backdrop) backdrop.classList.add('hidden');
  document.body.style.overflow = '';
  if (quickViewActive && window.history && window.history.state && window.history.state.modal === 'quickview') {
    window.history.back();
  }
  quickViewActive = false;
}

window.addEventListener('popstate', () => {
  if (quickViewActive) {
    const backdrop = document.getElementById('quickview-backdrop');
    if (backdrop && !backdrop.classList.contains('hidden')) {
      backdrop.classList.add('hidden');
      document.body.style.overflow = '';
      quickViewActive = false;
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeQuickView();
    if (typeof closeCart === 'function') closeCart();
    if (typeof closeMobileNav === 'function') closeMobileNav();
  }
});


// ============================================
//  CART
// ============================================
function saveCart() {
  localStorage.setItem('FLEXER_cart', JSON.stringify(cart));
}

function openCart() {
  cartOpen = true;
  cartDrawer.classList.add('open');
  cartBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartOpen = false;
  cartDrawer.classList.remove('open');
  cartBackdrop.classList.remove('open');
  document.body.style.overflow = '';
}

function addToCart(id, name, price, image) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(`${name} added to cart ✦`);
  if (!cartOpen) openCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { saveCart(); updateCartUI(); }
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  cartCount.textContent = total;
  cartCount.style.display = total > 0 ? 'flex' : 'none';

  if (cart.length === 0) {
    cartBody.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    cartFooter.style.display = 'none';
    return;
  }

  cartBody.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">LKR ${(item.price * item.qty).toLocaleString()}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="updateQty(${item.id}, -1)" aria-label="Decrease">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="updateQty(${item.id}, 1)" aria-label="Increase">+</button>
      </div>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  cartTotalDisplay.innerHTML = `<span>Subtotal</span><span>LKR ${subtotal.toLocaleString()}</span>`;
  cartFooter.style.display = 'block';
}

function goToCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty!'); return; }
  window.location.href = '/checkout';
}

if (cartBtn) cartBtn.addEventListener('click', () => cartOpen ? closeCart() : openCart());
document.addEventListener('keydown', e => { if (e.key === 'Escape' && cartOpen) closeCart(); });

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) checkoutBtn.addEventListener('click', goToCheckout);

// ============================================
//  TOAST
// ============================================
let toastTimeout;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================================
//  FAQ ACCORDION
// ============================================
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq-question').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      answer.classList.add('open');
    }
  });
});

// ============================================
//  NEWSLETTER FORM
// ============================================
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    const btn = document.getElementById('newsletter-submit');
    btn.textContent = 'Joining...';
    btn.disabled = true;
    try {
      const res = await fetch(`${API}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showToast(data.message || "You're on the list! ✦");
      newsletterForm.reset();
    } catch {
      showToast("Couldn't subscribe. Try again.");
    }
    btn.textContent = 'Notify Me';
    btn.disabled = false;
  });
}

// ============================================
//  CONTACT FORM
// ============================================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('contact-submit');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    document.getElementById('contact-name').value,
          email:   document.getElementById('contact-email-field').value,
          message: document.getElementById('contact-message').value
        })
      });
      const data = await res.json();
      showToast(data.message || 'Message sent! ✦');
      contactForm.reset();
    } catch {
      showToast("Couldn't send. Try again.");
    }
    btn.textContent = 'Send Message';
    btn.disabled = false;
  });
}

// ============================================
//  INTERSECTION OBSERVER (scroll reveal)
// ============================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll(`
  .testimonial-card, .faq-item, .section-header, .split-content,
  .feature-item, .contact-info, .contact-form, .footer-brand,
  .footer-links-cols, .newsletter-inner
`).forEach((el, i) => {
  el.classList.add('reveal');
  if (i % 3 === 1) el.classList.add('reveal-delay-1');
  if (i % 3 === 2) el.classList.add('reveal-delay-2');
  revealObserver.observe(el);
});

// ============================================
//  SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (mobileNav) mobileNav.style.display = 'none';
    }
  });
});

// ============================================
//  PARALLAX HERO
// ============================================
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero-bg img');
  if (!hero) return;
  hero.style.transform = `scale(1) translateY(${window.scrollY * 0.25}px)`;
}, { passive: true });

// ============================================
//  INIT
// ============================================
updateCartUI();
loadProducts();
