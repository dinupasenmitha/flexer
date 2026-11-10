import {
  CART_KEY,
  cartSubtotal,
  escapeHTML,
  formatLKR,
  getCart,
  mountCommerceShell,
  normalizeImage,
} from "./commerce-shared.js";

const DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];
import { mountSlipShare } from "./slip-share.js";
const $ = (selector, scope = document) => scope.querySelector(selector);

let islandwideDeliveryFee = 0;

function getDeliveryFee(district, _subtotal) {
  if (!district) {
    return { fee: 0, text: "Select district", eta: "" };
  }
  const eta = "Delivery timing confirmed by FLEXER";
  if (islandwideDeliveryFee === 0) {
    return { fee: 0, text: "FREE Islandwide", eta };
  }
  return {
    fee: islandwideDeliveryFee,
    text: formatLKR(islandwideDeliveryFee),
    eta,
  };
}

function updateTotals() {
  const cart = getCart();
  const submitBtn = $(".checkout-submit");
  const host = $("[data-checkout-items]");
  if (!cart.length) {
    host.innerHTML =
      '<div class="checkout-empty-state"><p>Your shopping bag is currently empty.</p><a class="button button--dark" href="/shop"><span>Explore Collection</span><i>&rarr;</i></a></div>';
    $("[data-checkout-subtotal]").textContent = formatLKR(0);
    $("[data-checkout-delivery]").textContent = "—";
    $("[data-checkout-total]").textContent = formatLKR(0);
    if (submitBtn) {
      submitBtn.disabled = true;
    }
    return false;
  }
  if (submitBtn) {
    submitBtn.disabled = false;
  }
  const subtotal = cartSubtotal();
  const districtSelect = $("[data-districts]");
  const selectedDistrict = districtSelect ? districtSelect.value : "";
  const delivery = getDeliveryFee(selectedDistrict, subtotal);
  $("[data-checkout-subtotal]").textContent = formatLKR(subtotal);
  $("[data-checkout-delivery]").textContent = delivery.text;
  const etaEl = $("[data-delivery-eta]");
  if (etaEl) {
    etaEl.textContent = delivery.eta
      ? "(" + delivery.eta + ")"
      : "(Select your delivery district)";
  }
  $("[data-checkout-total]").textContent = formatLKR(subtotal + delivery.fee);
  return true;
}

function renderSummary() {
  const cart = getCart();
  const host = $("[data-checkout-items]");
  if (!cart.length) {
    return updateTotals();
  }
  host.innerHTML = cart
    .map(
      (item) =>
        '<article class="checkout-item"><img src="' +
        escapeHTML(normalizeImage(item.image)) +
        '" alt="' +
        escapeHTML(item.name) +
        '" width="60" height="74"><div><p>' +
        escapeHTML(item.name) +
        "</p><small>" +
        escapeHTML(item.color_name || "Standard") +
        " · Qty " +
        Number(item.qty) +
        "</small></div><strong>" +
        formatLKR(Number(item.price) * Number(item.qty)) +
        "</strong></article>",
    )
    .join("");
  return updateTotals();
}

async function loadPaymentAvailability() {
  try {
    let response;
    try {
      response = await fetch("/api/settings");
    } catch {
      // ignore
    }
    if (!response || !response.ok) {
      response = await fetch("/api/settings.json");
    }
    const settings = await response.json();
    const kokoEnabled = settings.koko_enabled === "1";
    $("[data-koko-choice]").hidden = !kokoEnabled;
    $("[data-koko-unavailable]").hidden = kokoEnabled;
    if (settings.delivery_fee_islandwide !== undefined) {
      islandwideDeliveryFee = Number(settings.delivery_fee_islandwide) || 0;
      updateTotals();
    }
  } catch {
    $("[data-koko-choice]").hidden = true;
  }
}

function orderWhatsAppLink(order) {
  const lines = [
    "🕶️ *FLEXER EYEWEAR — NEW ORDER*",
    "Order Reference: *" + order.order_ref + "*",
    "",
    "👤 *Customer Details:*",
    "Name: " + order.customer.name,
    "Phone: " + order.customer.phone,
    "WhatsApp: " + order.customer.whatsapp_number,
    "Delivery Address: " + order.customer.address,
    "",
    "🛍️ *Items:*",
    order.items
      .map(
        (item) =>
          "• " +
          item.product_name +
          " (" +
          (item.color_name || "Standard") +
          ") × " +
          item.quantity +
          " = " +
          formatLKR(
            item.item_total || Number(item.unit_price) * Number(item.quantity),
          ),
      )
      .join("\n"),
    "",
    "💵 *Payment & Total:*",
    "Subtotal: " + formatLKR(order.subtotal),
    "Delivery: " +
      (order.delivery_fee ? formatLKR(order.delivery_fee) : "FREE Islandwide"),
    "Total Payable: *" + formatLKR(order.total_payable) + "*",
    "Payment Method: *" +
      (order.payment_method === "cod" ? "Cash on Delivery" : "Bank Transfer") +
      "*",
    "",
    "Please confirm my order. Thank you!",
  ];
  return (
    "https://wa.me/" +
    (order.whatsapp_number || "94775580968") +
    "?text=" +
    encodeURIComponent(lines.join("\n"))
  );
}

function bankDetails(order) {
  const details = order.bank_details || {};
  return (
    '<div class="payment-notice"><strong>Complete your transfer, then send the slip directly in WhatsApp.</strong><p>Bank: ' +
    escapeHTML(details.bank_name || "Commercial Bank of Ceylon") +
    "<br>Account: " +
    escapeHTML(details.account_holder || "FLEXER Eyewear") +
    "<br>Number: " +
    escapeHTML(details.account_number || "Contact via WhatsApp") +
    "<br>Branch: " +
    escapeHTML(details.branch_name || "Colombo") +
    "</p><p>Payment slips are never uploaded to or stored by this website.</p></div>"
  );
}

function showSuccess(order) {
  const form = $("[data-checkout-form]");
  const summary = $(".checkout-summary");
  const success = $("[data-order-success]");
  form.hidden = true;
  summary.hidden = true;
  const paymentCopy =
    order.payment_method === "bank_transfer"
      ? bankDetails(order)
      : order.payment_method === "cod"
        ? "<p>Your Cash on Delivery order is saved. FLEXER will confirm delivery with you on WhatsApp.</p>"
        : "<p>Your Koko request is saved. FLEXER will send the official instalment link after merchant confirmation.</p>";
  success.innerHTML =
    '<p class="eyebrow">Order confirmed</p><h2>Thank you for choosing <em>FLEXER.</em></h2><p>Your order reference has been created. Click below to confirm directly with our team on WhatsApp.</p><span class="order-reference">' +
    escapeHTML(order.order_ref) +
    "</span><p>Total: <strong>" +
    formatLKR(order.total_payable) +
    "</strong></p>" +
    paymentCopy +
    '<a class="button button--dark" target="_blank" rel="noreferrer" href="' +
    orderWhatsAppLink(order) +
    '" data-whatsapp-order><span>Continue on WhatsApp</span><i>↗</i></a><p><a class="text-link" href="/shop">Continue shopping <span>↗</span></a></p>';
  success.hidden = false;
  if (order.payment_method === "bank_transfer") {
    mountSlipShare(success, order, orderWhatsAppLink(order));
  }
  success.scrollIntoView({ behavior: "auto", block: "start" });
  $("[data-whatsapp-order]", success).addEventListener("click", () => {
    fetch(
      "/api/orders/" + encodeURIComponent(order.order_ref) + "/whatsapp-click",
      { method: "POST" },
    ).catch(() => undefined);
  });
}

function cleanSriLankanPhone(phone) {
  return String(phone || "")
    .replace(/[\s\-\(\)\.]/g, "")
    .replace(/^\+94/, "0")
    .replace(/^94/, "0");
}

function readForm(form) {
  const data = Object.fromEntries(new FormData(form));
  data.phone = cleanSriLankanPhone(data.phone);
  data.whatsapp_number = cleanSriLankanPhone(
    data.whatsapp_number || data.phone,
  );
  return data;
}

function validate(data) {
  if (
    !data.customer_name?.trim() ||
    !data.phone?.trim() ||
    !data.address?.trim() ||
    !data.city?.trim() ||
    !data.district
  ) {
    return "Please complete each required delivery field.";
  }
  if (!/^0?7\d{8}$/.test(data.phone)) {
    return "Enter a valid Sri Lankan mobile number (e.g. 077 123 4567 or +94 77 123 4567).";
  }
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    return "Enter a valid email address, or leave it blank.";
  }
  return "";
}

function setupCheckout() {
  const form = $("[data-checkout-form]");
  const district = $("[data-districts]");
  district.insertAdjacentHTML(
    "beforeend",
    DISTRICTS.map(
      (item) => '<option value="' + item + '">' + item + "</option>",
    ).join(""),
  );
  district.addEventListener("change", updateTotals);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = $("[data-checkout-error]");
    const cart = getCart();
    const data = readForm(form);
    const validation = validate(data);
    if (!cart.length) {
      error.textContent = "Your bag is empty.";
      return;
    }
    if (validation) {
      error.textContent = validation;
      return;
    }
    const submit = $("button[type=submit]", form);
    submit.disabled = true;
    submit.querySelector("span").textContent = "Saving your order";
    error.textContent = "";
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: cart.map((item) => ({
            id: item.id,
            variant_sku: item.variant_sku,
            quantity: item.qty,
          })),
        }),
      }).catch(() => {
        throw new Error(
          "We could not reach the order service. Your bag is safe—please check your connection and try again.",
        );
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          result.error ||
            "We could not save your order. Your bag is safe—please try again.",
        );
      }
      if (!result.order_ref || !result.success) {
        throw new Error(
          "The order service returned an incomplete confirmation. Your bag is safe—please try again.",
        );
      }
      const order = result;

      localStorage.removeItem(CART_KEY);
      window.dispatchEvent(new Event("flexer:cart-updated"));
      showSuccess(order);
    } catch (requestError) {
      error.textContent = requestError.message;
      submit.disabled = false;
      submit.querySelector("span").textContent = "Place secure order";
    }
  });
}

mountCommerceShell();
renderSummary();
loadPaymentAvailability();
setupCheckout();
