/* ============================================
   FLEXER — Checkout JS
   ============================================ */

const API = window.location.origin;
let cart = JSON.parse(localStorage.getItem('FLEXER_cart') || '[]');
let customerData = {};
let currentStep  = 'details';

// WhatsApp business number (Sri Lanka +94 77 558 0968)
const WA_NUMBER = '94775580968';

// ---- Build WhatsApp message ----
function buildWhatsAppMessage(orderId, payMethod) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const payLabel = payMethod === 'whatsapp' ? 'Online Payment (WhatsApp)' : 'Cash on Delivery';

  const itemLines = cart.map(i =>
    `  • ${i.name} × ${i.qty}  —  LKR ${(i.price * i.qty).toLocaleString()}`
  ).join('\n');

  const msg = [
    `🕶️ *FLEXER Eyewear — New Order*`,
    ``,
    `*Order ID:* #${orderId}`,
    `*Payment:* ${payLabel}`,
    ``,
    `*Customer Details:*`,
    `  Name:    ${customerData.customer_name}`,
    `  Phone:   ${customerData.phone || '—'}`,
    `  Email:   ${customerData.email}`,
    `  Address: ${customerData.address}, ${customerData.city}`,
    ``,
    `*Items Ordered:*`,
    itemLines,
    ``,
    `*Total: LKR ${subtotal.toLocaleString()}*`,
    customerData.notes ? `\n*Notes:* ${customerData.notes}` : '',
    ``,
    payMethod === 'whatsapp'
      ? `💳 Please share your payment receipt to confirm this order.`
      : `🏠 This order is Cash on Delivery.`
  ].filter(l => l !== undefined).join('\n');

  return msg;
}

function buildWhatsAppURL(orderId, payMethod) {
  const msg = buildWhatsAppMessage(orderId, payMethod);
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ---- Render summary ----
function renderSummary() {
  const itemsEl = document.getElementById('summary-items');
  const subtotalEl = document.getElementById('summary-subtotal');
  const totalEl   = document.getElementById('summary-total');

  if (!cart.length) {
    itemsEl.innerHTML = '<p style="color:var(--muted);font-size:13px">Your cart is empty.</p>';
    subtotalEl.textContent = 'LKR 0';
    totalEl.textContent   = 'LKR 0';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="summary-item">
      <div class="summary-item-img">
        <img src="${item.image}" alt="${item.name}" />
        <div class="summary-item-qty">${item.qty}</div>
      </div>
      <div class="summary-item-info">
        <div class="summary-item-name">${item.name}</div>
        <div class="summary-item-price">LKR ${item.price.toLocaleString()} each</div>
      </div>
      <div style="font-family:var(--font-display);font-weight:700;font-size:14px">
        LKR ${(item.price * item.qty).toLocaleString()}
      </div>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  subtotalEl.textContent = `LKR ${subtotal.toLocaleString()}`;
  totalEl.textContent   = `LKR ${subtotal.toLocaleString()}`;
}

// ---- Step navigation ----
function showStep(step) {
  ['details', 'payment', 'processing', 'confirm'].forEach(s => {
    const el = document.getElementById(`step-${s}`);
    if (el) el.classList.toggle('hidden', s !== step);
  });
  currentStep = step;

  // Update nav steps
  const steps = ['cart', 'details', 'payment', 'confirm'];
  const current = steps.indexOf(step === 'processing' ? 'payment' : step);
  steps.forEach((s, i) => {
    const el = document.getElementById(`step-indicator-${s}`);
    if (el) el.classList.toggle('active', i <= current);
  });
}

// ---- STEP 1: Details form ----
const detailsForm = document.getElementById('details-form');
if (detailsForm) {
  detailsForm.addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('f-name').value.trim();
    const email   = document.getElementById('f-email').value.trim();
    const city    = document.getElementById('f-city').value.trim();
    const address = document.getElementById('f-address').value.trim();

    let valid = true;
    [['f-name', name], ['f-email', email], ['f-city', city], ['f-address', address]].forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (!val) { el.classList.add('error'); valid = false; }
      else el.classList.remove('error');
    });
    if (!valid) return;

    customerData = {
      customer_name: name,
      email,
      phone:   document.getElementById('f-phone').value.trim(),
      city,
      address,
      notes:   document.getElementById('f-notes').value.trim()
    };
    showStep('payment');
  });
}

// ---- STEP 2: Payment method toggle ----
document.querySelectorAll('input[name="payment"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.classList.remove('active');
    });
    radio.closest('.payment-option').classList.add('active');

    // Show/hide WhatsApp info banner
    const waInfo = document.getElementById('whatsapp-info');
    if (waInfo) waInfo.classList.toggle('hidden', radio.value !== 'whatsapp');

    // Update button label
    const placeBtn = document.getElementById('btn-place-order');
    if (placeBtn) {
      placeBtn.textContent = radio.value === 'whatsapp'
        ? 'Continue to WhatsApp →'
        : 'Place Order →';
    }
  });
});

// Back button
const btnBack = document.getElementById('btn-back-details');
if (btnBack) btnBack.addEventListener('click', () => showStep('details'));

// ---- Place order ----
const btnPlaceOrder = document.getElementById('btn-place-order');
if (btnPlaceOrder) {
  btnPlaceOrder.addEventListener('click', async () => {
    if (!cart.length) { alert('Your cart is empty!'); return; }

    const payMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cod';

    showStep('processing');

    // Brief processing delay
    await new Promise(r => setTimeout(r, 900));

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
          payment_method: payMethod
        })
      });

      if (!res.ok) throw new Error('Order failed');
      const data = await res.json();

      // Build WhatsApp URL before clearing cart
      const waUrl = buildWhatsAppURL(data.order_id, payMethod);

      // Clear cart
      localStorage.removeItem('FLEXER_cart');

      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const payLabel = payMethod === 'whatsapp' ? 'Online Payment (WhatsApp)' : 'Cash on Delivery';

      document.getElementById('confirm-order-id').textContent = `Order #${data.order_id}`;
      document.getElementById('confirm-details').innerHTML = `
        <strong>${customerData.customer_name}</strong><br>
        ${customerData.email}<br>
        ${customerData.address}, ${customerData.city}<br><br>
        <strong>Payment:</strong> ${payLabel}<br>
        <strong>Total:</strong> LKR ${subtotal.toLocaleString()}
      `;

      // Show WhatsApp button on confirmation screen
      const waBtnWrap = document.getElementById('confirm-wa-btn-wrap');
      const waBtn     = document.getElementById('confirm-wa-btn');
      if (waBtnWrap && waBtn) {
        waBtn.href = waUrl;
        waBtnWrap.style.display = 'block';
      }

      showStep('confirm');

      // For Online Payment: auto-open WhatsApp after a brief delay
      if (payMethod === 'whatsapp') {
        setTimeout(() => {
          window.open(waUrl, '_blank');
        }, 600);
      }

    } catch (err) {
      console.error(err);
      showStep('payment');
      alert('Something went wrong placing your order. Please try again.');
    }
  });
}

// ---- INIT ----
if (!cart.length) {
  // Redirect if empty cart
  const confirmStep = document.getElementById('step-confirm');
  if (!confirmStep || confirmStep.classList.contains('hidden')) {
    document.querySelector('.co-form-area').innerHTML = `
      <div style="text-align:center;padding:80px 0">
        <p style="font-family:var(--font-display);font-size:18px;color:var(--muted);margin-bottom:24px">
          Your cart is empty.
        </p>
        <a href="/" class="btn btn-primary">← Back to Shop</a>
      </div>`;
  }
}

renderSummary();
showStep('details');
