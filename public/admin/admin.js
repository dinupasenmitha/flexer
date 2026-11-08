// ============================================================
// FLEXER EYEWEAR — Administrative Dashboard & Operations Engine
// ============================================================

const API = window.location.origin;
let authToken = localStorage.getItem('FLEXER_admin_token') || '';
let currentAdminUser = localStorage.getItem('FLEXER_admin_user') || 'Admin';
let allOrders = [];
let allProducts = [];
let activeOrderFilter = 'All';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabs();
  initModals();
});

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

// ---- Authentication & Session ----
function initAuth() {
  const loginForm = document.getElementById('admin-login-form');
  const logoutBtn = document.getElementById('admin-logout-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uInput = document.getElementById('login-username');
      const pInput = document.getElementById('login-password');
      const errBox = document.getElementById('login-error');
      const submitBtn = document.getElementById('login-submit-btn');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';
      if (errBox) errBox.classList.add('hidden');

      try {
        const res = await fetch(`${API}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: uInput.value.trim(), password: pInput.value })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');

        authToken = data.token;
        currentAdminUser = data.username;
        localStorage.setItem('FLEXER_admin_token', authToken);
        localStorage.setItem('FLEXER_admin_user', currentAdminUser);

        showDashboard();
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authToken = '';
      localStorage.removeItem('FLEXER_admin_token');
      localStorage.removeItem('FLEXER_admin_user');
      document.getElementById('admin-dashboard').classList.add('hidden');
      document.getElementById('admin-login-screen').classList.remove('hidden');
    });
  }

  // Auto-login if token exists
  if (authToken) {
    showDashboard();
  }
}

function showDashboard() {
  document.getElementById('admin-login-screen').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.remove('hidden');
  document.getElementById('admin-username-display').textContent = currentAdminUser;

  loadStats();
  loadOrders();
  loadProducts();
  loadSettings();
  loadMessages();
}

// ---- Tab Switching ----
function initTabs() {
  document.querySelectorAll('.admin-nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tabId = btn.dataset.tab;
      document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(tabId);
      if (activePane) activePane.classList.add('active');

      const titleEl = document.getElementById('admin-topbar-title');
      if (titleEl) titleEl.textContent = btn.textContent.trim();
    });
  });
}

// ---- 1. Verified Analytics & Metrics ----
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/admin/stats`, { headers: authHeaders() });
    if (!res.ok) {
      if (res.status === 401) { logout(); return; }
      throw new Error();
    }
    const stats = await res.json();

    document.getElementById('stat-total-orders').textContent = stats.total_orders;
    document.getElementById('stat-verified-revenue').textContent = `LKR ${stats.verified_revenue.toLocaleString()}`;
    document.getElementById('stat-awaiting-payment').textContent = stats.awaiting_payment_verification_count;
    document.getElementById('stat-cod-due').textContent = `${stats.cod_due_count} (LKR ${stats.cod_due_value.toLocaleString()})`;
    document.getElementById('stat-active-products').textContent = stats.active_products;
    document.getElementById('stat-subscribers').textContent = stats.subscribers_count;

    // Badges
    const pBadge = document.getElementById('pending-verification-badge');
    if (pBadge) {
      pBadge.textContent = stats.awaiting_payment_verification_count;
      pBadge.style.display = stats.awaiting_payment_verification_count > 0 ? 'inline-block' : 'none';
    }
  } catch (err) {
    console.error('Stats load error:', err);
  }
}

// ---- 2. Order Management ----
async function loadOrders() {
  const tableWrap = document.getElementById('orders-table-wrap');
  if (!tableWrap) return;

  tableWrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading orders...</div>';

  try {
    let url = `${API}/api/orders?limit=100`;
    if (activeOrderFilter !== 'All') url += `&status=${encodeURIComponent(activeOrderFilter)}`;

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    allOrders = await res.json();

    renderOrdersTable(allOrders);
  } catch (err) {
    tableWrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Failed to load orders.</div>';
  }
}

function renderOrdersTable(orders) {
  const tableWrap = document.getElementById('orders-table-wrap');
  if (!tableWrap) return;

  if (!orders.length) {
    tableWrap.innerHTML = '<div style="padding:60px;text-align:center;color:var(--text-muted)">No orders matching current filter.</div>';
    return;
  }

  tableWrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Order Ref</th>
          <th>Date</th>
          <th>Customer</th>
          <th>District</th>
          <th>Method</th>
          <th>Payment</th>
          <th>Status</th>
          <th>Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(o => {
          const isPaid = o.payment_status === 'verified_paid';
          const payBadge = isPaid
            ? `<span class="badge-status badge-success">Verified Paid</span>`
            : `<span class="badge-status badge-warning">${o.payment_status.replace('_', ' ')}</span>`;

          const waStatus = o.whatsapp_opened
            ? `<span title="Opened at ${o.whatsapp_opened_at}" style="color:#25d366;font-size:0.75rem;margin-left:4px">💬 Opened</span>`
            : '';

          return `
            <tr>
              <td><strong style="font-family:var(--font-mono);color:var(--accent-gold)">${o.order_ref}</strong></td>
              <td style="font-size:0.78rem;color:var(--text-subtle)">${new Date(o.created_at).toLocaleDateString()}</td>
              <td>
                <div style="font-weight:600">${o.customer_name}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${o.phone} ${waStatus}</div>
              </td>
              <td>${o.district}</td>
              <td style="text-transform:uppercase;font-size:0.78rem">${o.payment_method.replace('_', ' ')}</td>
              <td>${payBadge}</td>
              <td>
                <select class="admin-status-select" onchange="updateOrderStatus(${o.id}, this.value)">
                  ${['new', 'awaiting_confirmation', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'].map(s => `
                    <option value="${s}"${o.order_status === s ? ' selected' : ''}>${s}</option>
                  `).join('')}
                </select>
              </td>
              <td><strong>LKR ${o.total_payable.toLocaleString()}</strong></td>
              <td>
                <button class="btn-card-action" style="padding:4px 8px;font-size:0.7rem" onclick="openOrderModal(${o.id})">Details</button>
                ${!isPaid && (o.payment_method === 'bank_transfer' || o.payment_method === 'koko') ? `
                  <button class="btn-card-action" style="padding:4px 8px;font-size:0.7rem;background:#73b397;color:#0c0d0e;border-color:#73b397" onclick="verifyPayment(${o.id})">Verify Paid</button>
                ` : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Filter orders by status
function filterOrdersByStatus(status) {
  activeOrderFilter = status;
  document.querySelectorAll('.admin-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.status === status);
  });
  loadOrders();
}

// Update Order Status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error();
    showAdminToast(`Order #${orderId} status set to ${newStatus}`, 'success');
    loadStats();
  } catch {
    showAdminToast('Failed to update status', 'error');
  }
}

// Payment Verification with Audit Log
async function verifyPayment(orderId) {
  const transactionRef = prompt('Enter bank transaction reference / transfer remarks (optional):');
  try {
    const res = await fetch(`${API}/api/orders/${orderId}/payment-verify`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        verified: true,
        transaction_ref: transactionRef || 'Verified by admin',
        notes: `Verified manually by ${currentAdminUser}`
      })
    });
    if (!res.ok) throw new Error();
    showAdminToast(`Payment for Order #${orderId} verified as PAID!`, 'success');
    loadOrders();
    loadStats();
  } catch {
    showAdminToast('Payment verification failed', 'error');
  }
}

// Open Order Details Modal
function openOrderModal(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById('order-modal');
  const body = document.getElementById('order-modal-body');

  const items = order.items || [];

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--border-subtle)">
      <h3 style="font-family:var(--font-mono);font-size:1.2rem;color:var(--accent-gold)">${order.order_ref}</h3>
      <span style="font-size:0.8rem;color:var(--text-muted)">Created: ${new Date(order.created_at).toLocaleString()}</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;font-size:0.85rem">
      <div>
        <h4 style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">Customer Information</h4>
        <div><strong>${order.customer_name}</strong></div>
        <div>Phone: ${order.phone}</div>
        <div>WhatsApp: ${order.whatsapp_number}</div>
        <div>Email: ${order.email || '—'}</div>
      </div>
      <div>
        <h4 style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">Delivery Address</h4>
        <div>${order.address}</div>
        <div>${order.city}, ${order.district}</div>
        ${order.postal_code ? `<div>Postal Code: ${order.postal_code}</div>` : ''}
        ${order.notes ? `<div style="margin-top:6px;color:var(--accent-gold);font-style:italic">Notes: "${order.notes}"</div>` : ''}
      </div>
    </div>

    <h4 style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px">Purchased Items</h4>
    <div style="border:1px solid var(--border-subtle);border-radius:4px;overflow:hidden;margin-bottom:20px">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Frame</th>
            <th>Colorway</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Item Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td><strong>${i.product_name}</strong> (${i.product_sku})</td>
              <td>${i.color_name || 'Standard'}</td>
              <td>LKR ${i.unit_price.toLocaleString()}</td>
              <td>× ${i.quantity}</td>
              <td><strong>LKR ${i.item_total.toLocaleString()}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:32px;font-size:0.9rem;padding-top:12px;border-top:1px solid var(--border-subtle)">
      <div>Subtotal: <strong>LKR ${order.subtotal.toLocaleString()}</strong></div>
      <div>Delivery: <strong>${order.delivery_fee === 0 ? 'FREE' : `LKR ${order.delivery_fee}`}</strong></div>
      <div style="font-size:1.15rem;color:var(--accent-gold)">Total Payable: <strong>LKR ${order.total_payable.toLocaleString()}</strong></div>
    </div>
  `;

  modal.classList.remove('hidden');
}

// ---- 3. Product Management ----
async function loadProducts() {
  const tableWrap = document.getElementById('products-table-wrap');
  if (!tableWrap) return;

  try {
    const res = await fetch(`${API}/api/products?all=true`);
    allProducts = await res.json();

    tableWrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Range</th>
            <th>Type</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${allProducts.map(p => `
            <tr>
              <td style="font-family:var(--font-mono);font-size:0.8rem">${p.sku}</td>
              <td><strong>${p.name}</strong></td>
              <td style="text-transform:uppercase;font-size:0.75rem">${p.category}</td>
              <td style="text-transform:uppercase;font-size:0.75rem">${p.product_type}</td>
              <td>LKR ${p.price.toLocaleString()}</td>
              <td>${p.active ? '<span class="badge-status badge-success">Active</span>' : '<span class="badge-status badge-warning">Inactive</span>'}</td>
              <td>
                <button class="btn-card-action" style="padding:4px 8px;font-size:0.7rem" onclick="editProduct(${p.id})">Edit</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    tableWrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Failed to load products.</div>';
  }
}

// Edit or Add Product
function editProduct(productId) {
  const p = allProducts.find(item => item.id === productId);
  if (!p) return;

  document.getElementById('p-id').value = p.id;
  document.getElementById('p-sku').value = p.sku;
  document.getElementById('p-sku').disabled = true; // Sku is immutable
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-category').value = p.category;
  document.getElementById('p-type').value = p.product_type;
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-original-price').value = p.original_price || '';
  document.getElementById('p-description').value = p.description || '';
  document.getElementById('p-materials').value = p.materials || '';
  document.getElementById('p-lens').value = p.lens_spec || '';
  document.getElementById('p-dimensions').value = p.dimensions || '';
  document.getElementById('p-active').checked = p.active;

  document.getElementById('product-modal-title').textContent = `Edit Product — ${p.name}`;
  document.getElementById('product-modal').classList.remove('hidden');
}

function openAddProductModal() {
  document.getElementById('p-id').value = '';
  document.getElementById('p-sku').value = '';
  document.getElementById('p-sku').disabled = false;
  document.getElementById('p-name').value = '';
  document.getElementById('p-price').value = '';
  document.getElementById('p-original-price').value = '';
  document.getElementById('p-description').value = '';
  document.getElementById('p-materials').value = '';
  document.getElementById('p-lens').value = '';
  document.getElementById('p-dimensions').value = '';
  document.getElementById('p-active').checked = true;

  document.getElementById('product-modal-title').textContent = 'Add New Eyewear Frame';
  document.getElementById('product-modal').classList.remove('hidden');
}

// Save Product Form
const productForm = document.getElementById('product-form');
if (productForm) {
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const sku = document.getElementById('p-sku').value.trim();
    const name = document.getElementById('p-name').value.trim();
    const category = document.getElementById('p-category').value;
    const product_type = document.getElementById('p-type').value;
    const price = Number(document.getElementById('p-price').value);
    const original_price = document.getElementById('p-original-price').value ? Number(document.getElementById('p-original-price').value) : null;
    const description = document.getElementById('p-description').value.trim();
    const materials = document.getElementById('p-materials').value.trim();
    const lens_spec = document.getElementById('p-lens').value.trim();
    const dimensions = document.getElementById('p-dimensions').value.trim();
    const active = document.getElementById('p-active').checked;

    const payload = {
      sku, name, category, product_type, price, original_price,
      description, materials, lens_spec, dimensions, active
    };

    try {
      const url = id ? `${API}/api/products/${id}` : `${API}/api/products`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();
      showAdminToast(`Product ${id ? 'updated' : 'created'} successfully!`, 'success');
      document.getElementById('product-modal').classList.add('hidden');
      loadProducts();
      loadStats();
    } catch {
      showAdminToast('Failed to save product', 'error');
    }
  });
}

// ---- 4. Business Settings Management ----
async function loadSettings() {
  try {
    const res = await fetch(`${API}/api/settings/admin`, { headers: authHeaders() });
    const settings = await res.json();

    document.getElementById('s-bank-name').value = settings.bank_name || '';
    document.getElementById('s-bank-branch').value = settings.bank_branch || '';
    document.getElementById('s-bank-holder').value = settings.bank_account_holder || '';
    document.getElementById('s-bank-acc').value = settings.bank_account_number || '';
    document.getElementById('s-bank-instr').value = settings.bank_payment_instructions || '';

    document.getElementById('s-wa-number').value = settings.whatsapp_number || '';
    document.getElementById('s-wa-community').value = settings.whatsapp_community_url || '';
    document.getElementById('s-delivery-fee').value = settings.delivery_fee_islandwide || '0';
    document.getElementById('s-announcement').value = settings.announcement_text || '';
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updates = {
      bank_name: document.getElementById('s-bank-name').value.trim(),
      bank_branch: document.getElementById('s-bank-branch').value.trim(),
      bank_account_holder: document.getElementById('s-bank-holder').value.trim(),
      bank_account_number: document.getElementById('s-bank-acc').value.trim(),
      bank_payment_instructions: document.getElementById('s-bank-instr').value.trim(),
      whatsapp_number: document.getElementById('s-wa-number').value.trim(),
      whatsapp_community_url: document.getElementById('s-wa-community').value.trim(),
      delivery_fee_islandwide: document.getElementById('s-delivery-fee').value.trim(),
      announcement_text: document.getElementById('s-announcement').value.trim()
    };

    try {
      const res = await fetch(`${API}/api/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error();
      showAdminToast('Settings updated successfully!', 'success');
    } catch {
      showAdminToast('Failed to update settings', 'error');
    }
  });
}

// ---- 5. Messages & Subscribers ----
async function loadMessages() {
  const subWrap = document.getElementById('subscribers-list-wrap');
  const msgWrap = document.getElementById('contacts-list-wrap');

  try {
    const [subRes, conRes] = await Promise.all([
      fetch(`${API}/api/newsletter`, { headers: authHeaders() }),
      fetch(`${API}/api/contacts`, { headers: authHeaders() })
    ]);
    const subs = await subRes.json();
    const cons = await conRes.json();

    if (subWrap) {
      subWrap.innerHTML = subs.length
        ? subs.map(s => `
            <div style="padding:10px 14px;background:var(--bg-main);border:1px solid var(--border-subtle);border-radius:4px;display:flex;justify-content:space-between;font-size:0.85rem">
              <span>${s.email}</span>
              <span style="color:var(--text-subtle);font-size:0.75rem">${new Date(s.created_at).toLocaleDateString()}</span>
            </div>
          `).join('')
        : '<p style="color:var(--text-muted);font-size:0.85rem">No newsletter subscribers yet.</p>';
    }

    if (msgWrap) {
      msgWrap.innerHTML = cons.length
        ? cons.map(c => `
            <div style="padding:16px;background:var(--bg-main);border:1px solid var(--border-subtle);border-radius:4px;margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <strong>${c.name} (${c.phone})</strong>
                <span style="font-size:0.75rem;color:var(--text-subtle)">${new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p style="font-size:0.85rem;color:var(--text-muted)">${c.message}</p>
            </div>
          `).join('')
        : '<p style="color:var(--text-muted);font-size:0.85rem">No contact messages received.</p>';
    }
  } catch (err) {
    console.error('Messages load error:', err);
  }
}

// Toast helper
function showAdminToast(msg, type = '') {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// Modal Listeners
function initModals() {
  document.querySelectorAll('.modal-close-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-modal-backdrop').forEach(m => m.classList.add('hidden'));
    });
  });
}
