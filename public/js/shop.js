// ============================================================
// FLEXER EYEWEAR — Shop & Catalogue Dynamic Engine
// ============================================================

let allProducts = [];
let activeFilters = {
  category: 'all',
  type: 'all',
  search: '',
  sort: 'featured',
  color: 'all',
  maxPrice: 30000
};

document.addEventListener('DOMContentLoaded', () => {
  parseUrlParams();
  setupFilterEventListeners();
  loadCatalogue();
});

// Read initial filters from URL query parameters
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();

  if (['budget', 'premium', 'branded'].includes(path)) {
    activeFilters.category = path;
  } else if (params.has('category')) {
    activeFilters.category = params.get('category').toLowerCase();
  }

  if (params.has('type')) {
    activeFilters.type = params.get('type').toLowerCase();
  }
  if (params.has('search')) {
    activeFilters.search = params.get('search').trim();
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = activeFilters.search;
  }
  if (params.has('sort')) {
    activeFilters.sort = params.get('sort');
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = activeFilters.sort;
  }

  // Update UI toggles to reflect active filters
  updateActiveFilterPills();
}

// Fetch products from server with current filters
async function loadCatalogue() {
  const grid = document.getElementById('shop-products-grid');
  const countEl = document.getElementById('shop-product-count');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">Loading collection...</div>';

  try {
    let url = `/api/products?sort=${activeFilters.sort}`;
    if (activeFilters.category !== 'all') url += `&category=${encodeURIComponent(activeFilters.category)}`;
    if (activeFilters.type !== 'all') url += `&product_type=${encodeURIComponent(activeFilters.type)}`;
    if (activeFilters.search) url += `&search=${encodeURIComponent(activeFilters.search)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    allProducts = await res.json();

    // Client-side color and price filter
    let filtered = allProducts.filter(p => {
      if (p.price > activeFilters.maxPrice) return false;
      if (activeFilters.color !== 'all') {
        const hasColor = p.colors && p.colors.some(c => c.toLowerCase() === activeFilters.color.toLowerCase());
        if (!hasColor) return false;
      }
      return true;
    });

    if (countEl) {
      countEl.textContent = `${filtered.length} piece${filtered.length === 1 ? '' : 's'} available`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--text-muted)">
          <p style="font-size:1.1rem;margin-bottom:12px">No eyewear matching your selected filters.</p>
          <button class="btn btn-secondary" onclick="resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const img = p.primary_image || (p.images && p.images[0]) || '/favicon.png';
      const original = p.original_price ? `<span class="price-original">${FLEXER.formatLKR(p.original_price)}</span>` : '';
      const badge = p.badge ? `<span class="product-badge-pill">${p.badge}</span>` : '';
      const colors = p.colors || [];

      return `
        <article class="product-card" id="card-${p.id}">
          <div class="product-media">
            <img src="${img}" alt="${p.name}" class="product-img" loading="lazy" />
            ${badge}
            <div class="product-card-actions">
              <button class="btn-card-action" onclick="FLEXER.openQuickView(${p.id})">Quick View</button>
              <button class="btn-card-action" style="background:var(--accent-gold);color:var(--text-dark);border-color:var(--accent-gold)" onclick="window.__addShopToCart(${p.id})">+ Add</button>
            </div>
          </div>
          <div class="product-info">
            <div class="product-category-row">
              <span class="product-tier-label">${p.category.toUpperCase()} RANGE</span>
              <span style="font-size:0.7rem;color:var(--text-subtle)">${p.product_type === 'optical' ? 'Optical' : 'UV400'}</span>
            </div>
            <h3 class="product-title"><a href="/product/${p.slug}">${p.name}</a></h3>
            <div class="product-price-row">
              <span class="price-current">${FLEXER.formatLKR(p.price)}</span>
              ${original}
            </div>
            ${colors.length ? `
              <div class="product-colors-strip">
                ${colors.map((c, i) => `
                  <button class="color-swatch-dot${i === 0 ? ' active' : ''}" style="background:${c}" title="Color variant" onclick="filterByColor('${c}')"></button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">Unable to load collection.</div>';
  }
}

// Filter Event Listeners
function setupFilterEventListeners() {
  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        activeFilters.search = e.target.value.trim();
        loadCatalogue();
      }, 250);
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeFilters.sort = e.target.value;
      loadCatalogue();
    });
  }

  // Price range slider
  const priceRange = document.getElementById('price-range-slider');
  const priceDisplay = document.getElementById('price-range-val');
  if (priceRange && priceDisplay) {
    priceRange.addEventListener('input', (e) => {
      activeFilters.maxPrice = Number(e.target.value);
      priceDisplay.textContent = FLEXER.formatLKR(activeFilters.maxPrice);
      loadCatalogue();
    });
  }
}

// Filter by Range / Category
function filterByCategory(cat) {
  activeFilters.category = cat;
  updateActiveFilterPills();
  loadCatalogue();
}

// Filter by Type (Sunglasses vs Optical)
function filterByType(type) {
  activeFilters.type = type;
  updateActiveFilterPills();
  loadCatalogue();
}

// Filter by Color
function filterByColor(hex) {
  activeFilters.color = hex;
  updateActiveFilterPills();
  loadCatalogue();
}

// Reset All Filters
function resetFilters() {
  activeFilters = {
    category: 'all',
    type: 'all',
    search: '',
    sort: 'featured',
    color: 'all',
    maxPrice: 30000
  };

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'featured';

  const priceRange = document.getElementById('price-range-slider');
  const priceDisplay = document.getElementById('price-range-val');
  if (priceRange && priceDisplay) {
    priceRange.value = 30000;
    priceDisplay.textContent = 'LKR 30,000';
  }

  updateActiveFilterPills();
  loadCatalogue();
}

function updateActiveFilterPills() {
  document.querySelectorAll('.filter-pill[data-category]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === activeFilters.category);
  });
  document.querySelectorAll('.filter-pill[data-type]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === activeFilters.type);
  });
}
