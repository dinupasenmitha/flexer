// ============================================================
// FLEXER EYEWEAR — Client-Side Store & State Engine
// ============================================================

const FLEXER = (() => {
  const API_BASE = window.location.origin;
  const CART_KEY = 'FLEXER_cart_v2';

  // State
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    cart = [];
  }

  // Currency Formatter
  function formatLKR(amount) {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    return `LKR ${amount.toLocaleString('en-US')}`;
  }

  // Save Cart
  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
  }

  function normalizeUrl(url) {
    if (!url) return '/favicon.png';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
    return '/' + url;
  }

  function isVariantAvailable(variant) {
    return !variant || (variant.is_available !== false && Number(variant.stock_quantity) > 0);
  }

  // Add Item to Cart
  function addToCart(product, selectedVariant = null, quantity = 1) {
    if (!isVariantAvailable(selectedVariant)) {
      showToast('This colorway is currently out of stock.', 'error');
      return;
    }
    const existingIndex = cart.findIndex(i =>
      i.id === product.id &&
      (selectedVariant ? i.variant_sku === selectedVariant.sku : !i.variant_sku)
    );

    const price = Number(product.price);
    const image = normalizeUrl(selectedVariant?.image || product.primary_image || (product.images && product.images[0]));
    const colorName = selectedVariant?.color_name || 'Standard';
    const colorHex = selectedVariant?.color_hex || '#000000';
    const variantSku = selectedVariant?.sku || null;

    const maxQuantity = selectedVariant ? Math.min(20, Number(selectedVariant.stock_quantity)) : 20;
    if (existingIndex > -1) {
      cart[existingIndex].qty = Math.min(maxQuantity, cart[existingIndex].qty + quantity);
    } else {
      cart.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price,
        image,
        color_name: colorName,
        color_hex: colorHex,
        variant_sku: variantSku,
        qty: quantity
      });
    }

    saveCart();
    showToast(`Added ${product.name} to bag`, 'success');
    openCartDrawer();
  }

  // Update Item Quantity
  function updateQty(index, newQty) {
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].qty = Math.min(20, Math.max(1, newQty));
    }
    saveCart();
  }

  // Remove Item
  function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
  }

  // Clear Cart
  function clearCart() {
    cart = [];
    saveCart();
  }

  // Calculate Client Subtotal
  function getSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  // Toast System
  function showToast(message, type = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const toastText = document.createElement('span');
    toastText.textContent = message;
    toast.appendChild(toastText);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  // Update Cart Count and Drawer UI
  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = getSubtotal();

    // Badges
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    // Drawer Body
    const drawerBody = document.getElementById('cart-drawer-body');
    const drawerSubtotal = document.getElementById('cart-drawer-subtotal');
    const drawerCheckoutBtn = document.getElementById('cart-drawer-checkout-btn');

    if (drawerSubtotal) {
      drawerSubtotal.textContent = formatLKR(subtotal);
    }

    if (drawerCheckoutBtn) {
      drawerCheckoutBtn.disabled = cart.length === 0;
    }

    if (drawerBody) {
      if (cart.length === 0) {
        drawerBody.innerHTML = `
          <div class="cart-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <p>Your shopping bag is empty.</p>
            <a href="/shop" class="btn btn-secondary" style="margin-top:16px" onclick="FLEXER.closeCartDrawer()">Explore Collection</a>
          </div>
        `;
      } else {
        drawerBody.innerHTML = cart.map((item, index) => `
          <div class="cart-item-row">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-variant">${item.color_name ? `Color: ${item.color_name}` : ''}</div>
              <div class="cart-item-price">${formatLKR(item.price)} each</div>
              <div class="cart-item-bottom">
                <div class="cart-qty-control">
                  <button class="cart-qty-btn" onclick="FLEXER.updateQty(${index}, ${item.qty - 1})">−</button>
                  <span class="cart-qty-val">${item.qty}</span>
                  <button class="cart-qty-btn" onclick="FLEXER.updateQty(${index}, ${item.qty + 1})">+</button>
                </div>
                <button class="cart-item-remove" onclick="FLEXER.removeItem(${index})">Remove</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // Drawer Controls
  function openCartDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const drawer = document.getElementById('cart-drawer');
    if (backdrop && drawer) {
      backdrop.classList.add('open');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      window.location.href = cart.length ? '/checkout' : '/shop';
    }
  }

  function closeCartDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const drawer = document.getElementById('cart-drawer');
    if (backdrop && drawer) {
      backdrop.classList.remove('open');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  // Quick View Modal
  let activeQuickViewProduct = null;
  let activeQuickViewVariant = null;

  async function openQuickView(productId) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`);
      if (!res.ok) throw new Error('Product not found');
      const product = await res.json();
      activeQuickViewProduct = product;
      activeQuickViewVariant = (product.variants && product.variants.find(isVariantAvailable)) || null;

      const modalBackdrop = document.getElementById('quickview-modal-backdrop');
      const modalBody = document.getElementById('quickview-modal-body');
      if (!modalBackdrop || !modalBody) return;

      const images = (product.images && product.images.length ? product.images : [product.primary_image]).map(normalizeUrl);
      const initialImg = normalizeUrl(activeQuickViewVariant?.image || images[0]);

      modalBody.innerHTML = `
        <div class="quickview-grid">
          <div class="quickview-gallery">
            <div class="quickview-main-img-box">
              <img src="${initialImg}" alt="${product.name}" class="quickview-main-img" id="qv-main-img" />
            </div>
            ${images.length > 1 ? `
              <div class="quickview-thumbs-strip">
                ${images.map((img, idx) => `
                  <img src="${img}" alt="" class="quickview-thumb${idx === 0 ? ' active' : ''}" onclick="FLEXER.setQuickViewImage('${img}', this)" />
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="quickview-info">
            <div class="hero-eyebrow" style="margin-bottom:8px">${product.category.toUpperCase()} RANGE · ${product.brand}</div>
            <h2 class="section-title" style="font-size:1.8rem;text-align:left;margin-bottom:12px">${product.name}</h2>
            <div class="product-price-row" style="margin-bottom:16px">
              <span class="price-current" style="font-size:1.35rem">${formatLKR(product.price)}</span>
              ${product.original_price ? `<span class="price-original">${formatLKR(product.original_price)}</span>` : ''}
            </div>
            <p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:20px;line-height:1.6">${product.description}</p>

            ${product.variants && product.variants.length ? `
              <div style="margin-bottom:20px">
                <label style="font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:8px">
                  Select Color: <strong id="qv-color-name" style="color:var(--text-main)">${activeQuickViewVariant.color_name}</strong>
                </label>
                <div style="display:flex;gap:10px">
                  ${product.variants.map((v, idx) => `
                  <button class="color-swatch-dot${v.sku === activeQuickViewVariant?.sku ? ' active' : ''}" style="background:${v.color_hex};width:24px;height:24px" title="${v.color_name}${isVariantAvailable(v) ? '' : ' — Out of stock'}" ${isVariantAvailable(v) ? '' : 'disabled aria-disabled="true"'} onclick="FLEXER.selectQuickViewVariant(${idx}, this)"></button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div style="display:flex;gap:12px;margin-top:auto;padding-top:20px;border-top:1px solid var(--border-subtle);flex-wrap:wrap">
              <button class="btn btn-primary" style="flex:1" onclick="FLEXER.addCurrentQuickViewToCart()">
                Add to Bag
              </button>
              <button class="btn btn-whatsapp" style="flex:1" onclick="FLEXER.orderProductViaWhatsApp(${product.id})">
                Order via WhatsApp
              </button>
            </div>
          </div>
        </div>
      `;

      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error(err);
      showToast('Could not load product preview', 'error');
    }
  }

  function setQuickViewImage(src, thumbEl) {
    const mainImg = document.getElementById('qv-main-img');
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('.quickview-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  }

  function selectQuickViewVariant(variantIndex, swatchEl) {
    if (!activeQuickViewProduct || !activeQuickViewProduct.variants) return;
    const variant = activeQuickViewProduct.variants[variantIndex];
    if (!isVariantAvailable(variant)) {
      showToast('This colorway is currently out of stock.', 'error');
      return;
    }
    activeQuickViewVariant = variant;

    const colorNameEl = document.getElementById('qv-color-name');
    if (colorNameEl) colorNameEl.textContent = activeQuickViewVariant.color_name;

    if (activeQuickViewVariant.image) {
      setQuickViewImage(activeQuickViewVariant.image, null);
    }

    document.querySelectorAll('.color-swatch-dot').forEach(s => s.classList.remove('active'));
    if (swatchEl) swatchEl.classList.add('active');
  }

  function addCurrentQuickViewToCart() {
    if (!activeQuickViewProduct || (activeQuickViewProduct.variants?.length && !activeQuickViewVariant)) {
      showToast('This product is currently out of stock.', 'error');
      return;
    }
    addToCart(activeQuickViewProduct, activeQuickViewVariant, 1);
    closeQuickView();
  }

  function closeQuickView() {
    const modalBackdrop = document.getElementById('quickview-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  // WhatsApp Product Direct Order Prefill
  function orderProductViaWhatsApp(productId) {
    const prod = activeQuickViewProduct && activeQuickViewProduct.id === productId
      ? activeQuickViewProduct
      : null;

    const variant = activeQuickViewVariant;
    const prodName = prod ? prod.name : 'FLEXER Eyewear';
    const prodPrice = prod ? formatLKR(prod.price) : '';
    const color = variant ? variant.color_name : 'Standard';

    const msg = [
      `🕶️ *FLEXER Eyewear — Direct Inquiry / Order*`,
      ``,
      `Hello! I would like to order:`,
      `• *Product:* ${prodName}`,
      `• *Color:* ${color}`,
      `• *Price:* ${prodPrice}`,
      `• *Quantity:* 1`,
      ``,
      `Please let me know how to proceed with payment and delivery. Thank you!`
    ].join('\n');

    const waUrl = `https://wa.me/94775580968?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener');
  }

  // Initialize UI on load
  document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    // Close drawers when clicking backdrop
    const cartBackdrop = document.getElementById('cart-drawer-backdrop');
    if (cartBackdrop) {
      cartBackdrop.addEventListener('click', closeCartDrawer);
    }

    const qvBackdrop = document.getElementById('quickview-modal-backdrop');
    if (qvBackdrop) {
      qvBackdrop.addEventListener('click', (e) => {
        if (e.target === qvBackdrop) closeQuickView();
      });
    }
  });

  return {
    getCart: () => cart,
    formatLKR,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    getSubtotal,
    showToast,
    openCartDrawer,
    closeCartDrawer,
    openQuickView,
    closeQuickView,
    setQuickViewImage,
    selectQuickViewVariant,
    addCurrentQuickViewToCart,
    orderProductViaWhatsApp
  };
})();
