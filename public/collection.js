/* ============================================
   FLEXER — Collection Page JS
   ============================================ */

const API = window.location.origin;

// ---- MOBILE CACHE BUSTER ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
  });
}

// ---- Determine which tier we're on ----
const path = window.location.pathname.replace(/^\//, '').toLowerCase();
const urlParams = new URLSearchParams(window.location.search);
const tierParam = urlParams.get('tier');
const hashParam = window.location.hash.replace('#', '').toLowerCase();

let TIER = 'budget';
if (['budget', 'premium', 'branded'].includes(path)) {
  TIER = path;
} else if (['budget', 'premium', 'branded'].includes(tierParam)) {
  TIER = tierParam;
} else if (['budget', 'premium', 'branded'].includes(hashParam)) {
  TIER = hashParam;
}

const TIER_CONFIG = {
  budget: {
    color: '#6ee7b7',
    num: '01',
    label: 'BUDGET RANGE',
    title: 'Everyday <em>Essentials</em>',
    desc: 'Everyday style, solid UV400 protection. Exceptional value crafted for daily wear.',
    packages: ['Zip Pouch', 'Cloth Pouch', 'Microfibre Care Cloth', '48h Return Guarantee'],
  },
  premium: {
    color: '#c9a84c',
    num: '02',
    label: 'PREMIUM RANGE',
    title: 'Precision <em>Crafted</em>',
    desc: 'Italian acetate, polarized optics & spring hinges. For those who demand more.',
    packages: ['Hard Case', 'Anti-Fog Cleaner', 'Package Box', '3 Month Warranty'],
  },
  branded: {
    color: '#a78bfa',
    num: '03',
    label: 'BRANDED RANGE',
    title: 'Collector\'s <em>Edition</em>',
    desc: 'Aircraft-grade materials, hand-finished silhouettes. Collector pieces built to perfection.',
    packages: ['Branded Box', 'Handcrafted Wooden Box', 'Original Case', '1 Year Warranty'],
  }
};

const cfg = TIER_CONFIG[TIER];

// ---- Apply tier to body + meta ----
document.body.classList.add(`tier-${TIER}`);
document.getElementById('page-title').textContent = `FLEXER — ${cfg.label}`;
document.getElementById('page-desc').setAttribute('content', cfg.desc);

document.getElementById('col-badge').textContent = `${cfg.num} / ${cfg.label}`;
document.getElementById('col-hero-title').innerHTML = cfg.title;
document.getElementById('col-hero-desc').textContent = cfg.desc;

// Inclusions strip inside hero
document.getElementById('col-inclusions-strip').innerHTML = `
  <span class="inc-label">INCLUDES:</span>
  <div class="inc-tags">
    ${cfg.packages.map((p, idx) => `
      <span class="inc-tag">${p}</span>
      ${idx < cfg.packages.length - 1 ? '<span class="inc-dot">·</span>' : ''}
    `).join('')}
  </div>
`;

// ---- Products state ----
let allProducts = [];

// ---- Load products ----
async function loadCollection() {
  try {
    const res = await fetch(`${API}/api/products`);
    const products = await res.json();
    allProducts = products.filter(p => (p.category || 'budget').toLowerCase() === TIER);

    const DISPLAY_PRICE_RANGES = {
      budget: 'LKR 1,690 – LKR 4,690',
      premium: 'LKR 7,560 – LKR 9,990',
      branded: 'LKR 23,000+'
    };
    const colPriceRangeEl = document.getElementById('col-price-range');
    if (colPriceRangeEl) {
      colPriceRangeEl.textContent = DISPLAY_PRICE_RANGES[TIER] || '';
    }

    renderGrid(allProducts);
  } catch (err) {
    document.getElementById('col-grid').innerHTML =
      '<p style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">Failed to load products. Please try again.</p>';
  }
}


function renderGrid(products) {
  const grid = document.getElementById('col-grid');
  document.getElementById('col-count').textContent =
    `${products.length} style${products.length !== 1 ? 's' : ''} in ${cfg.name}`;

  if (!products.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--muted);font-family:var(--font-display)">No products in this range yet.</p>';
    return;
  }

  grid.innerHTML = products.map(p => renderCard(p)).join('');

  // Observe for reveal animation
  grid.querySelectorAll('.product-card').forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('reveal-delay-1');
    if (i % 3 === 2) el.classList.add('reveal-delay-2');
    revealObserver.observe(el);
  });

  // Color dot interaction
  grid.querySelectorAll('.product-colors').forEach(group => {
    group.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        group.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });
  });
}

function renderCard(p) {
  const images = Array.isArray(p.images) && p.images.length
    ? p.images.map(img => img.startsWith('uploads/') ? `${API}/${img}` : img)
    : [(p.image && p.image.startsWith('uploads/') ? `${API}/${p.image}` : p.image || '/favicon.png')];

  const mainImg = images[0];
  const colors = Array.isArray(p.colors) ? p.colors : [];
  const features = Array.isArray(p.features) ? p.features : [];

  const colorDots = colors.map((c, i) =>
    `<span class="color-dot${i===0?' active':''}" style="background:${c}" title="${c}"></span>`
  ).join('');

  const angleSwitchers = images.length > 1 ? `
    <div class="angle-switchers">
      ${images.map((img, idx) => `
        <button class="angle-dot${idx===0?' active':''}"
                onclick="switchAngle(event, ${p.id}, '${img}')"
                title="Angle ${idx+1}">${idx+1}</button>
      `).join('')}
    </div>` : '';

  const featuresList = features.length
    ? `<ul class="product-features">${features.map(f => `<li><span class="feat-check">✓</span>${f}</li>`).join('')}</ul>`
    : '';

  const discount = p.original_price
    ? `<span class="price-original">LKR ${p.original_price.toLocaleString()}</span>` : '';

  return `
    <article class="product-card product-card-${TIER}" id="product-${p.id}">
      <div class="product-img-wrap">
        <img src="${mainImg}" alt="${p.name}" class="product-img" id="card-img-${p.id}" loading="lazy" />
        <div class="product-overlay">
          <button class="quick-add-btn" onclick="openQuickView(${p.id})">Quick View 👁️</button>
          <button class="quick-add-btn primary-add" onclick="addToCart(${p.id},'${p.name}',${p.price},'${mainImg}')">Add to Cart</button>
        </div>
        <span class="tier-pill tier-pill-${TIER} product-tier-badge">${cfg.label}</span>
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
        <button class="btn btn-primary btn-full btn-tier-${TIER}" onclick="addToCart(${p.id},'${p.name}',${p.price},'${mainImg}')">
          Add to Cart
        </button>
      </div>
    </article>`;
}

function switchAngle(event, productId, newSrc) {
  event.stopPropagation();
  const img = document.getElementById(`card-img-${productId}`);
  if (img) img.src = newSrc;
  const parent = event.currentTarget.parentElement;
  if (parent) {
    parent.querySelectorAll('.angle-dot').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
  }
}

function sortProducts(mode) {
  let sorted = [...allProducts];
  if (mode === 'price-asc')  sorted.sort((a, b) => a.price - b.price);
  if (mode === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  if (mode === 'name')       sorted.sort((a, b) => a.name.localeCompare(b.name));
  renderGrid(sorted);
}

// ============================================
//  REVEAL OBSERVER
// ============================================
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.1 });

// ============================================
//  CART (mirrors main.js cart logic)
// ============================================
let cart = JSON.parse(localStorage.getItem('FLEXER_cart') || '[]');

function saveCart() { localStorage.setItem('FLEXER_cart', JSON.stringify(cart)); updateCartUI(); }

function addToCart(id, name, price, image) {
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, name, price, image, qty: 1 });
  saveCart();
  openCart();
  showToast(`${name} added to cart ✓`);
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = count;

  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!itemsEl) return;

  if (!cart.length) {
    itemsEl.innerHTML = `<div class="cart-empty"><p>Your bag is empty.</p></div>`;
    if (totalEl) totalEl.textContent = 'LKR 0';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" id="cart-item-${item.id}">
      <div class="cart-item-img"><img src="${item.image}" alt="${item.name}" /></div>
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">LKR ${item.price.toLocaleString()}</p>
        <div class="cart-item-controls">
          <button onclick="changeQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id}, 1)">+</button>
          <button onclick="removeFromCart(${item.id})" style="margin-left:auto;color:var(--muted)">✕</button>
        </div>
      </div>
    </div>`).join('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (totalEl) totalEl.textContent = `LKR ${subtotal.toLocaleString()}`;
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(0, item.qty + delta);
  if (item.qty === 0) cart = cart.filter(i => i.id !== id);
  saveCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function openCart()  { document.getElementById('cart-drawer')?.classList.add('open'); document.getElementById('cart-overlay')?.classList.add('show'); }
function closeCart() { document.getElementById('cart-drawer')?.classList.remove('open'); document.getElementById('cart-overlay')?.classList.remove('show'); }

document.getElementById('cart-btn')?.addEventListener('click', () =>
  document.getElementById('cart-drawer')?.classList.contains('open') ? closeCart() : openCart()
);
document.getElementById('cart-close')?.addEventListener('click', closeCart);
document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
document.getElementById('checkout-btn')?.addEventListener('click', () => {
  if (!cart.length) { showToast('Your cart is empty!'); return; }
  window.location.href = '/checkout';
});

// Toast
function showToast(msg) {
  let t = document.getElementById('toast-msg');
  if (!t) { t = document.createElement('div'); t.id = 'toast-msg'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show', 'success');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show', 'success'), 2800);
}

// ============================================
//  QUICK VIEW
// ============================================
function openQuickView(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;

  const images = Array.isArray(p.images) && p.images.length
    ? p.images.map(img => img.startsWith('uploads/') ? `${API}/${img}` : img)
    : [(p.image && p.image.startsWith('uploads/') ? `${API}/${p.image}` : p.image || '/favicon.png')];

  const mainImg = images[0];
  const features = Array.isArray(p.features) ? p.features : [];
  const colors = Array.isArray(p.colors) ? p.colors : [];
  const discount = p.original_price ? `<span class="price-original">LKR ${p.original_price.toLocaleString()}</span>` : '';

  document.getElementById('quickview-body').innerHTML = `
    <div class="qv-grid">
      <div class="qv-left">
        <div class="qv-main-img-wrap">
          <img src="${mainImg}" alt="${p.name}" id="qv-main-img" />
          <span class="tier-pill tier-pill-${TIER}">${cfg.label}</span>
        </div>
        ${images.length > 1 ? `<div class="qv-thumbs">${images.map((img, i) => `
          <div class="qv-thumb${i===0?' active':''}" onclick="switchQV('${img}', this)">
            <img src="${img}" alt="View ${i+1}" loading="lazy" />
          </div>`).join('')}</div>` : ''}
      </div>
      <div class="qv-right">
        <span class="qv-category">${cfg.label} COLLECTION</span>
        <h2 class="qv-title">${p.name}</h2>
        <div class="qv-price">
          <span class="price-sale" style="font-size:22px">LKR ${p.price.toLocaleString()}</span>
          ${discount}
        </div>
        <p class="qv-desc">${p.description || ''}</p>
        ${features.length ? `<div class="qv-features"><h4>What's Included</h4><ul>${features.map(f => `<li><span style="color:var(--gold)">✓</span> ${f}</li>`).join('')}</ul></div>` : ''}
        ${colors.length ? `<div class="qv-colors"><span>Available Colours:</span><div class="product-colors">${colors.map((c, i) => `<span class="color-dot${i===0?' active':''}" style="background:${c}" title="${c}"></span>`).join('')}</div></div>` : ''}
        <div class="qv-actions">
          <button class="btn btn-primary btn-full btn-tier-${TIER}" onclick="addToCart(${p.id},'${p.name}',${p.price},'${mainImg}');closeQuickView()">Add to Cart</button>
          <button type="button" class="btn btn-ghost btn-full qv-close-bottom-btn" onclick="closeQuickView()">← Close &amp; Continue Browsing</button>
        </div>
      </div>
    </div>`;

  document.getElementById('quickview-backdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  quickViewActive = true;

  if (window.history && window.history.pushState) {
    window.history.pushState({ modal: 'quickview' }, '');
  }
}

function switchQV(src, el) {
  document.getElementById('qv-main-img').src = src;
  document.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
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

document.getElementById('quickview-close')?.addEventListener('click', closeQuickView);
document.getElementById('quickview-backdrop')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeQuickView();
});

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
    closeMobileNav();
  }
});

// ---- MOBILE MENU LOGIC FOR COLLECTION PAGE ----
const mobileToggle = document.getElementById('mobile-menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
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
//  INIT
// ============================================
updateCartUI();
loadCollection();
