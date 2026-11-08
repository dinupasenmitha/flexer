// ============================================================
// FLEXER EYEWEAR — Checkout Flow & Payment Engine
// ============================================================

let checkoutData = {
  customer_name: '',
  phone: '',
  whatsapp_number: '',
  email: '',
  address: '',
  city: '',
  district: '',
  postal_code: '',
  notes: '',
  payment_method: 'bank_transfer',
  customization_option: 'none'
};

let createdOrder = null;
let selectedLocalSlipFile = null;

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();
  initStepNavigation();
  initSameAsPhoneToggle();
  initPaymentOptionToggles();
  initSlipSelection();
});

// Render Cart Summary inside Checkout Sidebar
function renderCheckoutSummary() {
  const itemsContainer = document.getElementById('co-summary-items');
  const subtotalEl = document.getElementById('co-summary-subtotal');
  const deliveryEl = document.getElementById('co-summary-delivery');
  const totalEl = document.getElementById('co-summary-total');

  const cart = FLEXER.getCart();

  if (!cart.length) {
    if (itemsContainer) {
      itemsContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">Your shopping bag is empty.</p>';
    }
    const placeBtn = document.getElementById('btn-place-order');
    if (placeBtn) placeBtn.disabled = true;
    return;
  }

  if (itemsContainer) {
    itemsContainer.innerHTML = cart.map(item => `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border-subtle)">
        <img src="${item.image}" alt="${item.name}" style="width:54px;height:54px;object-fit:cover;border-radius:2px;background:#121315" />
        <div style="flex-grow:1">
          <div style="font-size:0.85rem;font-weight:600">${item.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${item.color_name ? item.color_name : ''} · Qty: ${item.qty}</div>
          <div style="font-family:var(--font-mono);font-size:0.8rem;margin-top:2px">${FLEXER.formatLKR(item.price * item.qty)}</div>
        </div>
      </div>
    `).join('');
  }

  const subtotal = FLEXER.getSubtotal();
  const delivery = 0; // Islandwide free promotion
  const total = subtotal + delivery;

  if (subtotalEl) subtotalEl.textContent = FLEXER.formatLKR(subtotal);
  if (deliveryEl) deliveryEl.textContent = 'FREE';
  if (totalEl) totalEl.textContent = FLEXER.formatLKR(total);
}

// "Same as Phone" WhatsApp toggle checkbox
function initSameAsPhoneToggle() {
  const checkbox = document.getElementById('same-as-phone');
  const phoneInput = document.getElementById('f-phone');
  const waInput = document.getElementById('f-whatsapp');

  if (checkbox && phoneInput && waInput) {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        waInput.value = phoneInput.value;
        waInput.disabled = true;
      } else {
        waInput.disabled = false;
      }
    });

    phoneInput.addEventListener('input', () => {
      if (checkbox.checked) {
        waInput.value = phoneInput.value;
      }
    });
  }
}

// Payment Option Toggles & Dynamic Details Display
function initPaymentOptionToggles() {
  document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-card').forEach(card => card.classList.remove('active'));
      radio.closest('.payment-card').classList.add('active');
      checkoutData.payment_method = radio.value;

      // Toggle method info panels
      document.getElementById('bank-details-panel').classList.toggle('hidden', radio.value !== 'bank_transfer');
      document.getElementById('cod-info-panel').classList.toggle('hidden', radio.value !== 'cod');
      document.getElementById('koko-info-panel').classList.toggle('hidden', radio.value !== 'koko');
    });
  });
}

// Browser-Local Slip Selection (STRICT PRIVACY: Never sent to server)
function initSlipSelection() {
  const fileInput = document.getElementById('local-slip-input');
  const slipStatus = document.getElementById('local-slip-status');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type (Image or PDF)
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        FLEXER.showToast('Please select a valid image (JPG, PNG) or PDF payment slip', 'error');
        fileInput.value = '';
        return;
      }

      // Max size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        FLEXER.showToast('File size must be under 10MB', 'error');
        fileInput.value = '';
        return;
      }

      selectedLocalSlipFile = file;
      if (slipStatus) {
        slipStatus.textContent = `✓ Slip selected locally: ${file.name} (${(file.size / 1024).toFixed(0)} KB). Privacy protected: this file remains on your device until you share it.`;
        slipStatus.style.cssText = 'color:#73b397;font-size:0.8rem;line-height:1.5';
      }
    });
  }
}

// Multi-Step Navigation
function initStepNavigation() {
  const detailsForm = document.getElementById('details-form');
  const btnBack = document.getElementById('btn-back-details');
  const btnPlaceOrder = document.getElementById('btn-place-order');

  if (detailsForm) {
    detailsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateCustomerDetails()) return;
      showStep('payment');
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => showStep('details'));
  }

  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener('click', submitOrderToServer);
  }
}

function showStep(step) {
  ['details', 'payment', 'confirm'].forEach(s => {
    const el = document.getElementById(`step-${s}`);
    if (el) el.classList.toggle('hidden', s !== step);
  });

  document.querySelectorAll('.step-indicator').forEach(ind => {
    const s = ind.dataset.step;
    ind.classList.toggle('active', s === step);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Client-Side Validation of Sri Lankan Customer Information
function validateCustomerDetails() {
  const name = document.getElementById('f-name').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const wa = document.getElementById('f-whatsapp').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const address = document.getElementById('f-address').value.trim();
  const city = document.getElementById('f-city').value.trim();
  const district = document.getElementById('f-district').value;
  const notes = document.getElementById('f-notes').value.trim();

  let valid = true;

  function markError(id, errId, msg) {
    const input = document.getElementById(id);
    const err = document.getElementById(errId);
    if (msg) {
      input.classList.add('error');
      if (err) { err.textContent = msg; err.classList.remove('hidden'); }
      valid = false;
    } else {
      input.classList.remove('error');
      if (err) { err.classList.add('hidden'); }
    }
  }

  if (!name) markError('f-name', 'err-name', 'Full name is required');
  else markError('f-name', 'err-name', '');

  if (!phone || phone.length < 9) markError('f-phone', 'err-phone', 'Valid Sri Lankan phone number is required');
  else markError('f-phone', 'err-phone', '');

  if (!address) markError('f-address', 'err-address', 'Delivery street address is required');
  else markError('f-address', 'err-address', '');

  if (!city) markError('f-city', 'err-city', 'City / Town is required');
  else markError('f-city', 'err-city', '');

  if (!district) markError('f-district', 'err-district', 'Please select your Sri Lankan district');
  else markError('f-district', 'err-district', '');

  if (!valid) return false;

  checkoutData.customer_name = name;
  checkoutData.phone = phone;
  checkoutData.whatsapp_number = wa || phone;
  checkoutData.email = email;
  checkoutData.address = address;
  checkoutData.city = city;
  checkoutData.district = district;
  checkoutData.postal_code = document.getElementById('f-postal').value.trim();
  checkoutData.notes = notes;

  return true;
}

// Authoritative Order Submission to Server
async function submitOrderToServer() {
  const cart = FLEXER.getCart();
  if (!cart.length) {
    FLEXER.showToast('Your shopping bag is empty!', 'error');
    return;
  }

  const placeBtn = document.getElementById('btn-place-order');
  placeBtn.disabled = true;
  placeBtn.innerHTML = `<span>Processing Order...</span>`;

  try {
    const payload = {
      ...checkoutData,
      items: cart.map(i => ({
        id: i.id,
        variant_sku: i.variant_sku,
        quantity: i.qty,
        color_name: i.color_name,
        color_hex: i.color_hex
      }))
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Order creation failed. Please check your information.');
    }

    // SUCCESS: Order is safely persisted in database!
    createdOrder = data;

    // Clear cart locally now that database snapshot is saved
    FLEXER.clearCart();

    renderConfirmationScreen(createdOrder);
    showStep('confirm');

  } catch (err) {
    console.error('Order error:', err);
    FLEXER.showToast(err.message, 'error');
    placeBtn.disabled = false;
    placeBtn.innerHTML = `<span>Place Order →</span>`;
  }
}

// Render Order Confirmation Screen
function renderConfirmationScreen(order) {
  const refEl = document.getElementById('conf-order-ref');
  const detailsEl = document.getElementById('conf-details');
  const actionArea = document.getElementById('conf-action-area');

  if (refEl) refEl.textContent = order.order_ref;

  if (detailsEl) {
    detailsEl.innerHTML = `
      <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:4px;padding:20px;margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border-subtle)">
          <span style="color:var(--text-muted);font-size:0.85rem">Customer:</span>
          <strong>${escapeHTML(order.customer.name)} (${escapeHTML(order.customer.phone)})</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border-subtle)">
          <span style="color:var(--text-muted);font-size:0.85rem">Delivery Address:</span>
          <span style="text-align:right">${escapeHTML(order.customer.address)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border-subtle)">
          <span style="color:var(--text-muted);font-size:0.85rem">Payment Method:</span>
          <strong style="text-transform:uppercase">${escapeHTML(order.payment_method.replace('_', ' '))}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:700">
          <span>Total Payable:</span>
          <span style="color:var(--accent-gold)">${FLEXER.formatLKR(order.total_payable)}</span>
        </div>
      </div>
    `;
  }

  // Method-Specific Next Actions
  if (actionArea) {
    if (order.payment_method === 'bank_transfer') {
      const b = order.bank_details || {};
      actionArea.innerHTML = `
        <div style="background:var(--bg-surface-raised);border:1px solid var(--accent-gold-border);border-radius:4px;padding:24px;margin-bottom:24px;text-align:left">
          <h4 style="font-family:var(--font-mono);font-size:0.95rem;color:var(--accent-gold);margin-bottom:12px;letter-spacing:0.1em;text-transform:uppercase">
            Official Bank Account Details
          </h4>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px">${escapeHTML(b.instructions || 'Please transfer the exact amount.')}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.85rem;margin-bottom:16px">
            <div><span style="color:var(--text-subtle)">Bank Name:</span> <strong>${escapeHTML(b.bank_name || 'Commercial Bank')}</strong></div>
            <div><span style="color:var(--text-subtle)">Branch:</span> <strong>${escapeHTML(b.branch_name || 'Kollupitiya')}</strong></div>
            <div><span style="color:var(--text-subtle)">Account Holder:</span> <strong>${escapeHTML(b.account_holder || 'FLEXER (PVT) LTD')}</strong></div>
            <div><span style="color:var(--text-subtle)">Account Number:</span> <strong>${escapeHTML(b.account_number || '8000XXXXXX')}</strong></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-secondary" style="font-size:0.75rem;padding:8px 14px" onclick="copyBankDetailsFromOrder()">
              Copy Account Details
            </button>
            <button class="btn btn-secondary" style="font-size:0.75rem;padding:8px 14px" onclick="copyText('${order.order_ref}')">
              Copy Order Ref (${order.order_ref})
            </button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px">
          <button class="btn btn-whatsapp" style="width:100%" onclick="shareSlipOrOpenWhatsApp()">
            Share / Send Slip via WhatsApp →
          </button>
          <p style="font-size:0.75rem;color:var(--text-subtle);text-align:center">
            Your order record is permanently saved. Once you complete the transfer, send your slip so we can verify and dispatch.
          </p>
        </div>
      `;
    } else if (order.payment_method === 'cod') {
      actionArea.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:16px">
          <button class="btn btn-whatsapp" style="width:100%" onclick="openCodWhatsAppConfirmation()">
            Confirm Order on WhatsApp →
          </button>
          <button class="btn btn-secondary" style="width:100%" onclick="copyOrderSummary()">
            Copy Order Summary
          </button>
          <p style="font-size:0.75rem;color:var(--text-subtle);text-align:center">
            Your Cash on Delivery order is saved (#${order.order_ref}). Our team will confirm and arrange prompt courier dispatch.
          </p>
        </div>
      `;
    } else if (order.payment_method === 'koko') {
      actionArea.innerHTML = `
        <div style="background:var(--bg-surface-raised);border:1px solid rgba(110,231,183,0.3);border-radius:4px;padding:24px;margin-bottom:24px;text-align:left">
          <h4 style="font-family:var(--font-mono);font-size:0.95rem;color:#6ee7b7;margin-bottom:8px;letter-spacing:0.1em;text-transform:uppercase">
            Koko 3-Installment Request Pending
          </h4>
          <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;margin-bottom:12px">
            Your order has been recorded in our system (#${order.order_ref}). Our customer support team will initiate your official Koko payment link and deliver it directly to your mobile (${order.customer.phone}) / WhatsApp within business hours.
          </p>
          <div style="font-size:0.78rem;color:var(--text-subtle)">
            ● 3 Installments: 3 × LKR ${(order.total_payable / 3).toFixed(0)}<br>
            ● 0% Interest with supported debit/credit cards.
          </div>
        </div>
        <button class="btn btn-whatsapp" style="width:100%" onclick="openWhatsAppChat()">
          Chat with Support on WhatsApp →
        </button>
      `;
    }
  }
}

// Copy Bank Details
function copyBankDetails(bank, holder, acc, ref) {
  const text = `FLEXER Payment Details:\nBank: ${bank}\nAccount Name: ${holder}\nAccount No: ${acc}\nOrder Ref: ${ref}`;
  copyText(text, 'Bank details copied to clipboard');
}

function copyBankDetailsFromOrder() {
  if (!createdOrder) return;
  const b = createdOrder.bank_details || {};
  copyBankDetails(b.bank_name || '', b.account_holder || '', b.account_number || '', createdOrder.order_ref);
}

// Generic Copy to Clipboard
function copyText(str, msg = 'Copied to clipboard') {
  navigator.clipboard.writeText(str).then(() => {
    FLEXER.showToast(msg, 'success');
  }).catch(() => {
    FLEXER.showToast('Please manually select and copy the text', 'error');
  });
}

// Web Share API with Local File OR Manual Fallback (STRICT PRIVACY: Never sends to server)
async function shareSlipOrOpenWhatsApp() {
  if (!createdOrder) return;

  // Track WhatsApp link click event
  fetch(`/api/orders/${createdOrder.order_ref}/whatsapp-click`, { method: 'POST' }).catch(() => {});

  const msg = [
    `🕶️ *FLEXER Eyewear — Bank Transfer Payment Slip*`,
    ``,
    `*Order Reference:* ${createdOrder.order_ref}`,
    `*Customer:* ${createdOrder.customer.name}`,
    `*Phone:* ${createdOrder.customer.phone}`,
    `*Payable Amount:* ${FLEXER.formatLKR(createdOrder.total_payable)}`,
    ``,
    `I have transferred the exact amount to the FLEXER bank account. Please find my payment slip attached.`
  ].join('\n');

  // If native file sharing is supported AND a local slip file was picked
  if (selectedLocalSlipFile && navigator.canShare && navigator.canShare({ files: [selectedLocalSlipFile] })) {
    try {
      await navigator.share({
        files: [selectedLocalSlipFile],
        title: `FLEXER Slip — ${createdOrder.order_ref}`,
        text: msg
      });
      FLEXER.showToast('Shared successfully!', 'success');
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed, falling back to WhatsApp link:', err);
      }
    }
  }

  // Fallback: Open official WhatsApp conversation with prefilled message
  const waUrl = `https://wa.me/94775580968?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank', 'noopener');
  FLEXER.showToast('WhatsApp opened. Please attach your payment slip directly in the chat.', 'success');
}

// COD WhatsApp Confirmation
function openCodWhatsAppConfirmation() {
  if (!createdOrder) return;

  fetch(`/api/orders/${createdOrder.order_ref}/whatsapp-click`, { method: 'POST' }).catch(() => {});

  const itemLines = createdOrder.items.map(i =>
    `  • ${i.product_name} (${i.color_name || 'Standard'}) × ${i.quantity} — ${FLEXER.formatLKR(i.item_total)}`
  ).join('\n');

  const msg = [
    `🕶️ *FLEXER Eyewear — COD Order Confirmation*`,
    ``,
    `*Order Reference:* ${createdOrder.order_ref}`,
    `*Payment Method:* Cash on Delivery (COD)`,
    ``,
    `*Customer Details:*`,
    `  Name:    ${createdOrder.customer.name}`,
    `  Phone:   ${createdOrder.customer.phone}`,
    `  WhatsApp: ${createdOrder.customer.whatsapp_number}`,
    `  Address: ${createdOrder.customer.address}`,
    ``,
    `*Items Ordered:*`,
    itemLines,
    ``,
    `*Total Payable on Delivery: ${FLEXER.formatLKR(createdOrder.total_payable)}*`,
    ``,
    `Please confirm dispatch of this order. Thank you!`
  ].join('\n');

  const waUrl = `https://wa.me/94775580968?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank', 'noopener');
}

function copyOrderSummary() {
  if (!createdOrder) return;
  const summary = `FLEXER Order #${createdOrder.order_ref}\nTotal: ${FLEXER.formatLKR(createdOrder.total_payable)}\nCustomer: ${createdOrder.customer.name}\nAddress: ${createdOrder.customer.address}`;
  copyText(summary, 'Order summary copied to clipboard');
}

function openWhatsAppChat() {
  if (createdOrder) {
    fetch(`/api/orders/${createdOrder.order_ref}/whatsapp-click`, { method: 'POST' }).catch(() => {});
  }
  const waUrl = `https://wa.me/94775580968?text=${encodeURIComponent(`Hello FLEXER, regarding Order #${createdOrder ? createdOrder.order_ref : ''}`)}`;
  window.open(waUrl, '_blank', 'noopener');
}
