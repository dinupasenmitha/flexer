/* ============================================
   FLEXER — Admin Panel JS
   ============================================ */

const API = window.location.origin;
let token = localStorage.getItem('FLEXER_admin_token') || '';
let adminUser = localStorage.getItem('FLEXER_admin_user') || 'Admin';
let pendingDeleteAction = null;

// ---- TOAST ----
const toast = document.getElementById('admin-toast');
let toastTimeout;
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ---- AUTH HEADER ----
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ---- LOGIN ----
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  errEl.classList.add('hidden');

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('login-username').value,
        password: document.getElementById('login-password').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    token = data.token;
    adminUser = data.username;
    localStorage.setItem('FLEXER_admin_token', token);
    localStorage.setItem('FLEXER_admin_user', adminUser);
    enterDashboard();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
  btn.textContent = 'Sign In';
  btn.disabled = false;
});

function enterDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('sidebar-user').textContent = adminUser;
  loadStats();
  loadRecentOrders();
}

// Auto-login if token exists
if (token) {
  enterDashboard();
}

// ---- LOGOUT ----
document.getElementById('logout-btn').addEventListener('click', () => {
  token = '';
  adminUser = 'Admin';
  localStorage.removeItem('FLEXER_admin_token');
  localStorage.removeItem('FLEXER_admin_user');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-form').reset();
});

// ---- TABS ----
const tabTitles = {
  'tab-dashboard': 'Dashboard',
  'tab-products':  'Products',
  'tab-orders':    'Orders',
  'tab-messages':  'Messages'
};
const topbarActions = {
  'tab-products': `<button class="btn btn-primary" id="topbar-add-product" onclick="openProductModal()">+ Add Product</button>`
};

document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById('topbar-title').textContent = tabTitles[tabId] || '';
    document.getElementById('topbar-actions').innerHTML = topbarActions[tabId] || '';
    if (tabId === 'tab-dashboard') { loadStats(); loadRecentOrders(); }
    if (tabId === 'tab-products')  loadProducts();
    if (tabId === 'tab-orders')    loadOrders();
    if (tabId === 'tab-messages')  loadMessages();
  });
});

// ============================================
//  STATS
// ============================================
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/admin/stats`, { headers: authHeaders() });
    const s = await res.json();
    document.getElementById('stat-products').textContent   = s.totalProducts;
    document.getElementById('stat-orders').textContent     = s.totalOrders;
    document.getElementById('stat-revenue').textContent    = `LKR ${(s.revenue || 0).toLocaleString()}`;
    document.getElementById('stat-pending').textContent    = s.pendingOrders;
    document.getElementById('stat-messages').textContent   = s.newMessages;
    document.getElementById('stat-subscribers').textContent= s.subscribers;

    // Update badges
    const pendingBadge = document.getElementById('pending-badge');
    if (s.pendingOrders > 0) { pendingBadge.textContent = s.pendingOrders; pendingBadge.style.display = 'flex'; }
    else pendingBadge.style.display = 'none';

    const msgBadge = document.getElementById('msg-badge');
    if (s.newMessages > 0) { msgBadge.textContent = s.newMessages; msgBadge.style.display = 'flex'; }
    else msgBadge.style.display = 'none';

  } catch (err) { console.error('Stats error:', err); }
}

// ============================================
//  RECENT ORDERS (dashboard)
// ============================================
async function loadRecentOrders() {
  const el = document.getElementById('recent-orders-table');
  try {
    const res = await fetch(`${API}/api/orders`, { headers: authHeaders() });
    const orders = await res.json();
    const recent = orders.slice(0, 5);
    if (!recent.length) { el.innerHTML = '<div class="empty-state">No orders yet.</div>'; return; }
    el.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>#</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th>
          </tr></thead>
          <tbody>
            ${recent.map(o => `
              <tr>
                <td><strong>#${o.id}</strong></td>
                <td>${o.customer_name}<br><small style="color:var(--muted)">${o.email}</small></td>
                <td><strong>LKR ${o.total.toLocaleString()}</strong></td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                <td style="color:var(--muted);font-size:12px">${new Date(o.created_at).toLocaleDateString()}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { el.innerHTML = '<div class="empty-state">Failed to load orders.</div>'; }
}

// ============================================
//  PRODUCTS
// ============================================
let allAdminProducts = [];

async function loadProducts() {
  const el = document.getElementById('products-table-wrap');
  el.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const res = await fetch(`${API}/api/admin/products`, { headers: authHeaders() });
    const products = await res.json();
    allAdminProducts = products;
    if (!products.length) { el.innerHTML = '<div class="empty-state">No products yet. Add one!</div>'; return; }
    el.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>Image</th><th>Name</th><th>Price</th><th>Badge</th><th>Active</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${products.map(p => {
              const imgSrc = p.image
                ? (p.image.startsWith('uploads/') ? `${API}/${p.image}` : p.image) : '';
              return `<tr>
                <td><div class="table-img">${imgSrc ? `<img src="${imgSrc}" alt="${p.name}" />` : '—'}</div></td>
                <td><strong>${p.name}</strong><br><small style="color:var(--muted)">${p.description?.slice(0,50) || ''}</small></td>
                <td>LKR ${p.price.toLocaleString()}${p.original_price ? `<br><small style="color:var(--muted);text-decoration:line-through">LKR ${p.original_price.toLocaleString()}</small>` : ''}</td>
                <td>${p.badge ? `<span class="status-badge" style="background:rgba(201,168,76,0.15);color:var(--gold)">${p.badge}</span>` : '—'}</td>
                <td><span class="${p.active ? 'product-active' : 'product-inactive'}">${p.active ? '●' : '○'}</span></td>
                <td><div class="table-actions">
                  <button class="btn btn-ghost btn-sm" onclick="editProductById(${p.id})">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="confirmDelete('product', ${p.id})">Delete</button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { el.innerHTML = '<div class="empty-state">Failed to load products.</div>'; }
}

function editProductById(id) {
  const product = allAdminProducts.find(p => p.id === id);
  if (product) openProductModal(product);
}

// ============================================
//  PRODUCT MODAL
// ============================================

// Tracks the current list of image paths (server paths or URLs) for the modal
let productImages = [];

function renderImageStrip() {
  const strip = document.getElementById('multi-img-strip');
  if (!strip) return;

  if (!productImages.length) {
    strip.innerHTML = `
      <div class="multi-img-empty" id="multi-img-empty" style="display:flex">
        <span style="font-size:28px">🖼️</span>
        <div>No images yet</div>
      </div>`;
    return;
  }

  strip.innerHTML = '';
  productImages.forEach((src, idx) => {
    const fullSrc = src.startsWith('uploads/') ? `${API}/${src}` : src;
    const thumb = document.createElement('div');
    thumb.className = 'multi-img-thumb' + (idx === 0 ? ' primary' : '');
    thumb.innerHTML = `
      <img src="${fullSrc}" alt="Image ${idx+1}" />
      ${idx === 0 ? '<span class="img-primary-badge">Primary</span>' : ''}
      <button type="button" class="img-remove-btn" title="Remove" data-idx="${idx}">✕</button>
    `;
    thumb.querySelector('.img-remove-btn').addEventListener('click', () => {
      productImages.splice(idx, 1);
      renderImageStrip();
    });
    strip.appendChild(thumb);
  });
}

let productColors = [];

function renderColorSwatches(updateInput = true) {
  const strip = document.getElementById('selected-swatches-strip');
  const input = document.getElementById('p-colors');
  if (!strip) return;

  if (!productColors.length) {
    strip.innerHTML = '<span style="font-size:12px;color:var(--muted);font-style:italic">No colors added yet. Pick a color or tap a preset below!</span>';
    if (updateInput && input) input.value = '';
    return;
  }

  strip.innerHTML = '';
  productColors.forEach((hex, idx) => {
    const chip = document.createElement('div');
    chip.className = 'selected-swatch-chip';
    chip.innerHTML = `
      <span class="swatch-circle" style="background:${hex}"></span>
      <span>${hex}</span>
      <button type="button" class="swatch-remove-btn" title="Remove color">✕</button>
    `;
    chip.querySelector('.swatch-remove-btn').addEventListener('click', () => {
      productColors.splice(idx, 1);
      renderColorSwatches(true);
    });
    strip.appendChild(chip);
  });

  if (updateInput && input) input.value = productColors.join(', ');
}

function addProductColor(hex) {
  const clean = hex.trim().toLowerCase();
  if (!clean) return;
  if (!productColors.includes(clean)) {
    productColors.push(clean);
  }
  renderColorSwatches(true);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : '';
}

function openProductModal(product = null) {
  const modal = document.getElementById('product-modal-backdrop');
  const title = document.getElementById('modal-title');
  const form  = document.getElementById('product-form');

  if (form) form.reset();
  productImages = [];
  setVal('p-image-url', '');

  if (product) {
    if (title) title.textContent = 'Edit Product';
    setVal('product-id', product.id);
    setVal('p-name', product.name);
    setVal('p-description', product.description);
    setVal('p-category', product.category || 'budget');
    setVal('p-price', product.price);
    setVal('p-original-price', product.original_price);
    setVal('p-badge', product.badge);
    const activeEl = document.getElementById('p-active');
    if (activeEl) activeEl.checked = !!product.active;

    const colors = Array.isArray(product.colors) ? product.colors : [];
    productColors = [...colors];

    const imgs = Array.isArray(product.images) && product.images.length
      ? product.images
      : (product.image ? [product.image] : []);
    productImages = [...imgs];
  } else {
    if (title) title.textContent = 'Add Product';
    setVal('product-id', '');
    productColors = [];
  }

  renderImageStrip();
  renderColorSwatches(true);
  if (modal) modal.classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal-backdrop').classList.add('hidden');
}
document.getElementById('modal-close').addEventListener('click',  closeProductModal);
document.getElementById('modal-cancel').addEventListener('click', closeProductModal);
document.getElementById('product-modal-backdrop').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeProductModal();
});

// Color picker add button
document.getElementById('btn-add-color-picker')?.addEventListener('click', () => {
  const picker = document.getElementById('p-color-picker');
  if (picker) addProductColor(picker.value);
});

// Preset dots
document.querySelectorAll('.preset-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    const hex = dot.getAttribute('data-color');
    if (hex) addProductColor(hex);
  });
});

// Live parse if user types in text field
document.getElementById('p-colors')?.addEventListener('input', e => {
  const typed = e.target.value.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
  productColors = typed;
  renderColorSwatches(false);
});

// ---- Multi-image: "Add Images" button ----
document.getElementById('multi-img-add-btn').addEventListener('click', () => {
  document.getElementById('p-image').value = ''; // reset so same files can be re-picked
  document.getElementById('p-image').click();
});

// ---- Multi-image: handle file selection ----
document.getElementById('p-image').addEventListener('change', async e => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  const addBtn = document.getElementById('multi-img-add-btn');
  addBtn.textContent = 'Uploading...';
  addBtn.disabled = true;

  for (const file of files) {
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch(`${API}/api/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        const data = await res.json();
        if (!productImages.includes(data.path)) {
          productImages.push(data.path);
        }
      } else {
        showToast('Failed to upload one image', 'error');
      }
    } catch {
      showToast('Upload error', 'error');
    }
  }

  renderImageStrip();
  addBtn.textContent = '+ Add Images';
  addBtn.disabled = false;
});

// Save product
document.getElementById('product-form').addEventListener('submit', async e => {
  e.preventDefault();
  const saveBtn = document.getElementById('modal-save');
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled    = true;

  const id     = document.getElementById('product-id').value;
  const imgUrl = document.getElementById('p-image-url').value.trim();

  // If there's a URL/filename typed but not yet in the strip, add it
  if (imgUrl && !productImages.includes(imgUrl)) {
    productImages.unshift(imgUrl);
  }

  const colors = document.getElementById('p-colors').value
    .split(',').map(c => c.trim()).filter(Boolean);

  const formData = new FormData();
  formData.append('name',           document.getElementById('p-name').value);
  formData.append('description',    document.getElementById('p-description').value);
  formData.append('price',          document.getElementById('p-price').value);
  formData.append('original_price', document.getElementById('p-original-price').value);
  formData.append('category',       document.getElementById('p-category').value);
  formData.append('badge',          document.getElementById('p-badge').value);
  formData.append('colors',         JSON.stringify(colors));
  formData.append('active',         document.getElementById('p-active').checked ? '1' : '0');
  // Send the full images array
  formData.append('images',         JSON.stringify(productImages));

  try {
    const method = id ? 'PUT' : 'POST';
    const url    = id ? `${API}/api/products/${id}` : `${API}/api/products`;
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Save failed');
    }
    showToast(id ? 'Product updated! ✓' : 'Product added! ✓', 'success');
    closeProductModal();
    loadProducts();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
  saveBtn.textContent = 'Save Product';
  saveBtn.disabled    = false;
});

// ============================================
//  ORDERS
// ============================================
let allOrders = [];
let ordersFilter = 'All';

const WA_NUMBER = '94775580968';

function buildOrderWhatsAppURL(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  const payLabel = o.payment_method === 'whatsapp' ? 'Online Payment (WhatsApp)'
                 : o.payment_method === 'cod'      ? 'Cash on Delivery'
                 : 'Card';
  const lines = items.map(i => `  • ${i.name} × ${i.qty}  —  LKR ${(i.price * i.qty).toLocaleString()}`).join('\n');
  const msg = [
    `🕶️ *FLEXER Eyewear — Order #${o.id}*`,
    ``,
    `*Customer:* ${o.customer_name}`,
    `*Phone:*    ${o.phone || '—'}`,
    `*Address:*  ${o.address || ''}, ${o.city || ''}`,
    ``,
    `*Items:*`,
    lines,
    ``,
    `*Total: LKR ${o.total.toLocaleString()}*`,
    `*Payment:* ${payLabel}`,
    `*Status:*  ${o.status}`
  ].join('\n');
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function getStatusStyle(status) {
  const map = {
    Pending:    { bg: 'rgba(243,156,18,0.12)',  color: '#f39c12', dot: '#f39c12' },
    Processing: { bg: 'rgba(52,152,219,0.12)',  color: '#3498db', dot: '#3498db' },
    Shipped:    { bg: 'rgba(155,89,182,0.12)',  color: '#9b59b6', dot: '#9b59b6' },
    Delivered:  { bg: 'rgba(39,174,96,0.12)',   color: '#27ae60', dot: '#27ae60' },
    Cancelled:  { bg: 'rgba(231,76,60,0.12)',   color: '#e74c3c', dot: '#e74c3c' },
  };
  return map[status] || map.Pending;
}

function getPaymentBadge(method) {
  if (method === 'whatsapp') return `<span class="pay-badge pay-badge-wa">💬 WhatsApp</span>`;
  if (method === 'cod')      return `<span class="pay-badge pay-badge-cod">🏠 Cash on Delivery</span>`;
  return                            `<span class="pay-badge pay-badge-card">💳 Card</span>`;
}

function renderOrders() {
  const el = document.getElementById('orders-table-wrap');
  const filtered = ordersFilter === 'All' ? allOrders : allOrders.filter(o => o.status === ordersFilter);

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state">No ${ordersFilter === 'All' ? '' : ordersFilter + ' '}orders yet.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="orders-cards">
      ${filtered.map(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        const ss = getStatusStyle(o.status);
        const date = new Date(o.created_at);
        const dateStr = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        const timeStr = date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
        const waUrl = buildOrderWhatsAppURL(o);

        return `
        <div class="order-card" id="order-card-${o.id}">
          <!-- Card Header -->
          <div class="order-card-header">
            <div class="order-card-id">
              <span class="order-id-pill">#${o.id}</span>
              <span class="order-date">${dateStr} · ${timeStr}</span>
            </div>
            <div class="order-card-actions">
              <a href="${waUrl}" target="_blank" class="btn-wa-order" title="Quick reply on WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.127 1.533 5.861L.057 23.985l6.284-1.648A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.947 0-3.775-.502-5.363-1.382l-.383-.225-3.732.979.994-3.627-.249-.396A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              </a>
              <button class="btn btn-danger btn-sm" onclick="confirmDelete('order', ${o.id})">Delete</button>
            </div>
          </div>

          <!-- Card Body -->
          <div class="order-card-body">
            <!-- Customer -->
            <div class="order-section">
              <div class="order-section-label">Customer</div>
              <div class="order-customer-name">${o.customer_name}</div>
              <div class="order-customer-meta">
                ${o.email ? `<span>✉ ${o.email}</span>` : ''}
                ${o.phone ? `<span>📱 ${o.phone}</span>` : ''}
              </div>
              ${(o.address || o.city) ? `<div class="order-address">📍 ${[o.address, o.city].filter(Boolean).join(', ')}</div>` : ''}
              ${o.notes ? `<div class="order-notes">💬 "${o.notes}"</div>` : ''}
            </div>

            <!-- Items -->
            <div class="order-section">
              <div class="order-section-label">Items · ${items.length} line${items.length !== 1 ? 's' : ''}</div>
              <div class="order-items-list">
                ${items.map(i => `
                  <div class="order-item-row">
                    <span class="order-item-name">${i.name}</span>
                    <span class="order-item-qty">× ${i.qty}</span>
                    <span class="order-item-price">LKR ${(i.price * i.qty).toLocaleString()}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Payment + Total -->
            <div class="order-section">
              <div class="order-section-label">Payment</div>
              ${getPaymentBadge(o.payment_method)}
              <div class="order-total">LKR ${o.total.toLocaleString()}</div>
            </div>

            <!-- Status -->
            <div class="order-section">
              <div class="order-section-label">Status</div>
              <div class="order-status-wrap" id="order-status-wrap-${o.id}">
                <div class="order-status-dot" style="background:${ss.dot}"></div>
                <select class="order-status-select" id="order-status-select-${o.id}"
                        style="color:${ss.color};border-color:${ss.color}30;background:${ss.bg}"
                        onchange="updateOrderStatus(${o.id}, this.value)">
                  ${['Pending','Processing','Shipped','Delivered','Cancelled'].map(s =>
                    `<option value="${s}"${o.status === s ? ' selected' : ''}>${s}</option>`
                  ).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

async function loadOrders() {
  const el = document.getElementById('orders-table-wrap');
  el.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const res = await fetch(`${API}/api/orders`, { headers: authHeaders() });
    allOrders = await res.json();
    allOrders.forEach(o => { try { o.items = JSON.parse(o.items); } catch { o.items = []; } });

    // Build filter bar
    const statusCounts = { All: allOrders.length };
    ['Pending','Processing','Shipped','Delivered','Cancelled'].forEach(s => {
      statusCounts[s] = allOrders.filter(o => o.status === s).length;
    });

    document.getElementById('orders-filter-bar').innerHTML = ['All','Pending','Processing','Shipped','Delivered','Cancelled'].map(s => `
      <button class="order-filter-btn${ordersFilter === s ? ' active' : ''}" onclick="setOrdersFilter('${s}')">
        ${s}
        ${statusCounts[s] > 0 ? `<span class="order-filter-count">${statusCounts[s]}</span>` : ''}
      </button>
    `).join('');

    renderOrders();
  } catch (err) { el.innerHTML = '<div class="empty-state">Failed to load orders.</div>'; }
}

function setOrdersFilter(filter) {
  ordersFilter = filter;
  document.querySelectorAll('.order-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim().startsWith(filter));
  });
  renderOrders();
}


async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error();
    // Live-update select color without full reload
    const ss = getStatusStyle(status);
    const sel = document.getElementById(`order-status-select-${orderId}`);
    if (sel) {
      sel.style.color = ss.color;
      sel.style.borderColor = ss.color + '30';
      sel.style.background  = ss.bg;
    }
    const dot = sel?.parentElement?.querySelector('.order-status-dot');
    if (dot) dot.style.background = ss.dot;
    // Update in-memory
    const order = allOrders.find(o => o.id === orderId);
    if (order) order.status = status;
    showToast(`Order #${orderId} → ${status}`, 'success');
    loadStats();
  } catch {
    showToast('Failed to update status', 'error');
  }
}


// ============================================
//  MESSAGES
// ============================================
async function loadMessages() {
  // Subscribers
  const subEl = document.getElementById('subscribers-list');
  // Contacts
  const conEl = document.getElementById('contacts-list');

  subEl.innerHTML = '<div class="empty-state">Loading...</div>';
  conEl.innerHTML = '<div class="empty-state">Loading...</div>';

  try {
    const [subRes, conRes] = await Promise.all([
      fetch(`${API}/api/newsletter`, { headers: authHeaders() }),
      fetch(`${API}/api/contacts`,   { headers: authHeaders() })
    ]);
    const subs = await subRes.json();
    const cons = await conRes.json();

    subEl.innerHTML = subs.length
      ? subs.map(s => `
          <div class="subscriber-item">
            <div class="contact-avatar">${s.email[0].toUpperCase()}</div>
            <div class="contact-info-block">
              <div class="contact-name">${s.email}</div>
              <div class="contact-time">Joined ${new Date(s.created_at).toLocaleDateString()}</div>
            </div>
          </div>`).join('')
      : '<div class="empty-state">No subscribers yet.</div>';

    conEl.innerHTML = cons.length
      ? cons.map(c => `
          <div class="contact-item${c.read ? '' : ' unread'}" id="contact-${c.id}">
            <div class="contact-avatar">${c.name[0].toUpperCase()}</div>
            <div class="contact-info-block">
              <div class="contact-name">${c.name} ${!c.read ? '<span style="color:var(--gold);font-size:10px;letter-spacing:.1em;text-transform:uppercase">NEW</span>' : ''}</div>
              <div class="contact-email-label">${c.email}</div>
              <div class="contact-msg">${c.message}</div>
              <div class="contact-time">${new Date(c.created_at).toLocaleString()}</div>
            </div>
            ${!c.read ? `<button class="btn btn-ghost btn-sm" onclick="markRead(${c.id})">Mark Read</button>` : ''}
          </div>`).join('')
      : '<div class="empty-state">No messages yet.</div>';
  } catch (err) {
    subEl.innerHTML = '<div class="empty-state">Failed to load.</div>';
    conEl.innerHTML = '<div class="empty-state">Failed to load.</div>';
  }
}

async function markRead(id) {
  try {
    await fetch(`${API}/api/contacts/${id}/read`, { method: 'PATCH', headers: authHeaders() });
    const el = document.getElementById(`contact-${id}`);
    if (el) { el.classList.remove('unread'); el.querySelector('button')?.remove(); }
    loadStats();
    showToast('Marked as read', 'success');
  } catch { showToast('Error', 'error'); }
}

// ============================================
//  DELETE CONFIRM MODAL
// ============================================
function confirmDelete(type, id) {
  const modal = document.getElementById('delete-modal-backdrop');
  document.getElementById('delete-modal-msg').textContent =
    `Are you sure you want to delete this ${type}? This cannot be undone.`;
  pendingDeleteAction = { type, id };
  modal.classList.remove('hidden');
}

document.getElementById('delete-cancel').addEventListener('click', () => {
  document.getElementById('delete-modal-backdrop').classList.add('hidden');
  pendingDeleteAction = null;
});
document.getElementById('delete-modal-close').addEventListener('click', () => {
  document.getElementById('delete-modal-backdrop').classList.add('hidden');
  pendingDeleteAction = null;
});

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!pendingDeleteAction) return;
  const { type, id } = pendingDeleteAction;
  document.getElementById('delete-modal-backdrop').classList.add('hidden');

  try {
    const url = type === 'product' ? `${API}/api/products/${id}` : `${API}/api/orders/${id}`;
    const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) throw new Error();
    showToast(`${type === 'product' ? 'Product' : 'Order'} deleted`, 'success');
    if (type === 'product') loadProducts();
    else loadOrders();
    loadStats();
  } catch {
    showToast('Delete failed', 'error');
  }
  pendingDeleteAction = null;
});
