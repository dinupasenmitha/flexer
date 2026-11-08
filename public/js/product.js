
function normalizeImg(src) {
  if (!src) return '/favicon.png';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src;
  return '/' + src;
}
// ============================================================
// FLEXER EYEWEAR — Product Detail Page (PDP) Interactive Logic
// ============================================================

let currentProduct = null;
let currentVariant = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
  loadProductDetails();
});

async function loadProductDetails() {
  const container = document.getElementById('pdp-container');
  if (!container) return;

  // Determine slug or ID from URL path or search query
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const urlParams = new URLSearchParams(window.location.search);
  let identifier = urlParams.get('id') || urlParams.get('slug');

  if (!identifier && pathParts.length > 1 && pathParts[0] === 'product') {
    identifier = pathParts[1];
  }

  if (!identifier) {
    // Default fallback to first product
    identifier = 'thinner-flex';
  }

  try {
    const res = await fetch(`/api/products/${encodeURIComponent(identifier)}`);
    if (!res.ok) throw new Error('Product not found');
    currentProduct = await res.json();
    currentVariant = (currentProduct.variants && currentProduct.variants.find(v => v.is_available !== false && Number(v.stock_quantity) > 0)) || null;
    currentQuantity = 1;

    renderProductPage(currentProduct);
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div style="text-align:center;padding:100px 20px">
        <h2 style="font-family:var(--font-serif);font-size:2rem;margin-bottom:12px">Product Not Found</h2>
        <p style="color:var(--text-muted);margin-bottom:24px">The requested frame could not be located in our catalogue.</p>
        <a href="/shop" class="btn btn-primary">Return to Collection</a>
      </div>
    `;
  }
}

function renderProductPage(p) {
  document.title = `${p.name} — FLEXER Eyewear`;

  const images = (p.images && p.images.length ? p.images : [p.primary_image]).map(normalizeImg);
  const activeImage = normalizeImg(currentVariant?.image || images[0]);
  const original = p.original_price ? `<span class="price-original">${FLEXER.formatLKR(p.original_price)}</span>` : '';
  const inclusions = Array.isArray(p.inclusions) ? p.inclusions : [];
  const variants = p.variants || [];
  const variantInStock = !variants.length || (currentVariant && currentVariant.is_available !== false && Number(currentVariant.stock_quantity) > 0);
  const availableQuantity = currentVariant ? Math.min(20, Number(currentVariant.stock_quantity)) : 20;
  if (currentQuantity > availableQuantity) currentQuantity = Math.max(1, availableQuantity);

  const html = `
    <div class="pdp-grid">
      <!-- Media Gallery -->
      <div class="pdp-gallery-col">
        <div class="pdp-main-image-wrap">
          <img src="${activeImage}" alt="${p.name}" class="pdp-main-image" id="pdp-main-img" />
          ${p.badge ? `<span class="product-badge-pill" style="top:20px;left:20px">${p.badge}</span>` : ''}
        </div>
        ${images.length > 1 ? `
          <div class="pdp-thumbs-row">
            ${images.map((img, idx) => `
              <img src="${img}" alt="${p.name} angle ${idx + 1}" class="pdp-thumb${img === activeImage ? ' active' : ''}" onclick="setPdpImage('${img}', this)" />
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Info & Ordering -->
      <div class="pdp-info-col">
        <div class="pdp-breadcrumbs">
          <a href="/">Home</a> / <a href="/shop">Collection</a> / <a href="/shop?category=${p.category}">${p.category.toUpperCase()}</a> / <span>${p.name}</span>
        </div>

        <div class="hero-eyebrow" style="margin-bottom:8px">${p.category.toUpperCase()} RANGE · ${p.brand}</div>
        <h1 class="pdp-title">${p.name}</h1>
        <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-subtle);margin-bottom:16px">SKU: ${p.sku}</div>

        <div class="pdp-price-wrap">
          <span class="price-current" style="font-size:1.6rem">${FLEXER.formatLKR(p.price)}</span>
          ${original}
          <span style="font-size:0.75rem;color:var(--accent-gold);margin-left:auto;letter-spacing:0.06em">Free Islandwide Delivery</span>
        </div>

        <p class="pdp-description">${p.description}</p>

        <!-- Variants / Colors -->
        ${variants.length ? `
          <div class="pdp-variants-section">
            <div class="pdp-option-label">
              Selected Colorway: <strong id="pdp-selected-color-label" style="color:var(--text-main)">${currentVariant ? currentVariant.color_name : 'Standard'}</strong>
            </div>
            <div class="pdp-swatches-strip">
              ${variants.map((v, idx) => `
                <button class="pdp-swatch-btn${v.sku === currentVariant?.sku ? ' active' : ''}" style="background:${v.color_hex};${v.is_available === false || Number(v.stock_quantity) < 1 ? 'opacity:.35;cursor:not-allowed' : ''}" title="${v.color_name}${v.is_available === false || Number(v.stock_quantity) < 1 ? ' — Out of stock' : ''}" ${v.is_available === false || Number(v.stock_quantity) < 1 ? 'disabled aria-disabled="true"' : ''} onclick="selectPdpVariant(${idx}, this)"></button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Quantity & Stock Status -->
        <div class="pdp-qty-row">
          <div class="pdp-option-label" style="margin-bottom:0">Quantity:</div>
          <div class="cart-qty-control" style="height:38px">
            <button class="cart-qty-btn" style="width:38px" onclick="updatePdpQuantity(-1)" ${variantInStock ? '' : 'disabled'}>−</button>
            <span class="cart-qty-val" id="pdp-qty-display" style="font-size:0.95rem;padding:0 14px">1</span>
            <button class="cart-qty-btn" style="width:38px" onclick="updatePdpQuantity(1)" ${variantInStock ? '' : 'disabled'}>+</button>
          </div>
          <span style="font-size:0.78rem;color:${variantInStock ? '#73b397' : '#d68a8a'};margin-left:auto">${variantInStock ? `● ${availableQuantity} in stock` : '● Out of stock'}</span>
        </div>

        <!-- 3 Product Actions Required -->
        <div class="pdp-actions-group">
          <button class="btn btn-primary" onclick="addCurrentPdpToCart()" style="flex:1" ${variantInStock ? '' : 'disabled'}>
            ${variantInStock ? 'ADD TO BAG' : 'OUT OF STOCK'}
          </button>
          <button class="btn btn-secondary" onclick="buyNowCurrentPdp()" style="flex:1" ${variantInStock ? '' : 'disabled'}>
            BUY NOW
          </button>
          <button class="btn btn-whatsapp" onclick="orderCurrentViaWhatsApp()" style="width:100%">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:6px"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            ORDER VIA WHATSAPP
          </button>
        </div>

        <!-- Specifications & Inclusions Accordion -->
        <div class="pdp-specs-block">
          ${p.materials ? `
            <div class="pdp-spec-row">
              <span class="pdp-spec-label">Frame Material</span>
              <span class="pdp-spec-value">${p.materials}</span>
            </div>
          ` : ''}
          ${p.lens_spec ? `
            <div class="pdp-spec-row">
              <span class="pdp-spec-label">Lens Specification</span>
              <span class="pdp-spec-value">${p.lens_spec}</span>
            </div>
          ` : ''}
          ${p.dimensions ? `
            <div class="pdp-spec-row">
              <span class="pdp-spec-label">Dimensions</span>
              <span class="pdp-spec-value">${p.dimensions}</span>
            </div>
          ` : ''}
          ${p.warranty_months ? `
            <div class="pdp-spec-row">
              <span class="pdp-spec-label">Warranty</span>
              <span class="pdp-spec-value">${p.warranty_months} Months Manufacturing Defect Guarantee</span>
            </div>
          ` : ''}
          ${inclusions.length ? `
            <div class="pdp-spec-row">
              <span class="pdp-spec-label">Inclusions</span>
              <span class="pdp-spec-value">${inclusions.join(' · ')}</span>
            </div>
          ` : ''}
          ${p.care_instructions ? `
            <div class="pdp-spec-row">
              <span class="pdp-spec-label">Care Instructions</span>
              <span class="pdp-spec-value">${p.care_instructions}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Related Products -->
    ${p.related && p.related.length ? `
      <div style="margin-top:96px;padding-top:48px;border-top:1px solid var(--border-subtle)">
        <div class="section-header" style="text-align:left;margin-bottom:32px">
          <span class="section-eyebrow">Complementary Silhouettes</span>
          <h2 class="section-title" style="font-size:2rem">YOU MAY ALSO LIKE</h2>
        </div>
        <div class="products-grid">
          ${p.related.map(r => `
            <article class="product-card">
              <div class="product-media">
                <img src="${normalizeImg(r.primary_image || (r.images && r.images[0]))}" alt="${r.name}" class="product-img" loading="lazy" />
                <div class="product-card-actions">
                  <a href="/product/${r.slug}" class="btn-card-action">View Frame</a>
                </div>
              </div>
              <div class="product-info">
                <span class="product-tier-label">${r.category.toUpperCase()} RANGE</span>
                <h3 class="product-title"><a href="/product/${r.slug}">${r.name}</a></h3>
                <div class="product-price-row">
                  <span class="price-current">${FLEXER.formatLKR(r.price)}</span>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  document.getElementById('pdp-container').innerHTML = html;
}

function setPdpImage(src, thumbEl) {
  const mainImg = document.getElementById('pdp-main-img');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

function selectPdpVariant(index, swatchEl) {
  if (!currentProduct || !currentProduct.variants) return;
  const variant = currentProduct.variants[index];
  if (!variant || variant.is_available === false || Number(variant.stock_quantity) < 1) return;
  currentVariant = variant;

  currentQuantity = 1;
  renderProductPage(currentProduct);
}

function updatePdpQuantity(delta) {
  const stockLimit = currentVariant ? Math.min(20, Number(currentVariant.stock_quantity)) : 20;
  currentQuantity = Math.max(1, Math.min(stockLimit, currentQuantity + delta));
  const el = document.getElementById('pdp-qty-display');
  if (el) el.textContent = currentQuantity;
}

function addCurrentPdpToCart() {
  if (!currentProduct || (currentProduct.variants?.length && (!currentVariant || currentVariant.is_available === false || Number(currentVariant.stock_quantity) < currentQuantity))) return;
  FLEXER.addToCart(currentProduct, currentVariant, currentQuantity);
}

function buyNowCurrentPdp() {
  if (!currentProduct || (currentProduct.variants?.length && (!currentVariant || currentVariant.is_available === false || Number(currentVariant.stock_quantity) < currentQuantity))) return;
  FLEXER.addToCart(currentProduct, currentVariant, currentQuantity);
  window.location.href = '/checkout';
}

function orderCurrentViaWhatsApp() {
  if (!currentProduct) return;
  const colorName = currentVariant ? currentVariant.color_name : 'Standard';
  const totalPrice = FLEXER.formatLKR(currentProduct.price * currentQuantity);

  const msg = [
    `🕶️ *FLEXER Eyewear — Direct WhatsApp Order*`,
    ``,
    `Hello! I would like to order:`,
    `• *Product:* ${currentProduct.name} (${currentProduct.sku})`,
    `• *Range:* ${currentProduct.category.toUpperCase()}`,
    `• *Colorway:* ${colorName}`,
    `• *Quantity:* ${currentQuantity}`,
    `• *Unit Price:* ${FLEXER.formatLKR(currentProduct.price)}`,
    `• *Total Price:* ${totalPrice}`,
    ``,
    `Please confirm stock availability and share payment/delivery instructions.`
  ].join('\n');

  const waUrl = `https://wa.me/94775580968?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank', 'noopener');
}
