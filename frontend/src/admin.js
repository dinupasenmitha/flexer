import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600-italic.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "./styles/foundation.css";
import "./styles/admin.css";
import "./styles/admin-rebuild.css";
import { mountProductEditor } from "./product-editor.js";
import { mountContentEditor } from "./content-editor.js";
import { mountTheme } from "./theme.js";

mountTheme(document.body);

const TOKEN_KEY = "FLEXER_admin_token";
const USER_KEY = "FLEXER_admin_user";
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];
const formatLKR = (value) =>
  "LKR " + Number(value || 0).toLocaleString("en-LK");
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
let token = localStorage.getItem(TOKEN_KEY) || "";
let activeTab = "dashboard";
let products = [];
let orders = [];

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}

function logout() {
  token = "";
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  $("[data-admin-app]").hidden = true;
  $("[data-admin-login]").hidden = false;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...headers(), ...options.headers },
  });
  if (response.status === 401) {
    logout();
    throw new Error("Your session has expired.");
  }
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function setPanel(content) {
  $("[data-admin-panel]").innerHTML = content;
}

function setTitle(title, eyebrow = "Command center") {
  $("[data-admin-title]").textContent = title;
  $("[data-admin-eyebrow]").textContent = eyebrow;
  $$("[data-admin-tab]").forEach((button) =>
    button.classList.toggle("is-active", button.dataset.adminTab === activeTab),
  );
}

function modal(content) {
  $("[data-admin-modal-content]").innerHTML = content;
  $("[data-admin-modal]").hidden = false;
}

function closeModal() {
  $("[data-admin-modal]").hidden = true;
}

async function renderDashboard() {
  const stats = await request("/api/admin/stats");
  setPanel(
    '<div class="admin-stats"><article class="admin-stat"><p>Verified revenue</p><strong>' +
      formatLKR(stats.verified_revenue) +
      '</strong></article><article class="admin-stat"><p>Orders received</p><strong>' +
      stats.total_orders +
      '</strong></article><article class="admin-stat"><p>Awaiting payment</p><strong>' +
      stats.awaiting_payment_verification_count +
      '</strong></article><article class="admin-stat"><p>COD due</p><strong>' +
      stats.cod_due_count +
      '</strong></article><article class="admin-stat"><p>Live frames</p><strong>' +
      stats.active_products +
      '</strong></article><article class="admin-stat"><p>Subscribers</p><strong>' +
      stats.subscribers_count +
      '</strong></article><article class="admin-stat"><p>Unread enquiries</p><strong>' +
      stats.unread_messages_count +
      '</strong></article><article class="admin-stat"><p>Order value</p><strong>' +
      formatLKR(stats.gross_order_value) +
      '</strong></article></div><section class="admin-card"><h2>Operational view</h2><p>Revenue counts only verified payments. Unpaid COD and unverified transfer orders remain excluded until the appropriate workflow is completed.</p></section>',
  );
}

function orderRows(rows) {
  return rows
    .map(
      (order) =>
        "<tr><td><strong>" +
        escapeHTML(order.order_ref) +
        "</strong><small>" +
        new Date(order.created_at).toLocaleDateString("en-LK") +
        "</small></td><td>" +
        escapeHTML(order.customer_name) +
        "<small>" +
        escapeHTML(order.district) +
        "</small></td><td>" +
        formatLKR(order.total_payable) +
        '</td><td><span class="admin-status">' +
        escapeHTML(order.payment_method.replace("_", " ")) +
        '</span></td><td><span class="admin-status">' +
        escapeHTML(order.order_status) +
        '</span></td><td><button data-order-detail="' +
        order.id +
        '">Open</button></td></tr>',
    )
    .join("");
}

async function renderOrders(query = "") {
  orders = await request("/api/orders?" + query);
  setPanel(
    '<section class="admin-card"><div class="admin-toolbar"><h2>Orders</h2><div class="admin-toolbar__controls"><input class="admin-control" data-order-search placeholder="Search reference or customer"><select class="admin-control" data-order-status><option value="">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="paid">Paid</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select><button class="admin-button" data-export-orders>Export CSV</button></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th></th></tr></thead><tbody>' +
      (orders.length
        ? orderRows(orders)
        : '<tr><td colspan="6">No orders match this view.</td></tr>') +
      "</tbody></table></div></section>",
  );
  $("[data-order-search]").addEventListener(
    "input",
    debounce(
      (event) =>
        renderOrders("search=" + encodeURIComponent(event.target.value.trim())),
      250,
    ),
  );
  for (const status of [
    "new",
    "awaiting_confirmation",
    "processing",
    "dispatched",
  ]) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status.replaceAll("_", " ");
    $("[data-order-status]").append(option);
  }
  $("[data-order-status]").value =
    new URLSearchParams(query).get("status") || "";
  $("[data-order-status]").addEventListener("change", (event) =>
    renderOrders(event.target.value ? "status=" + event.target.value : ""),
  );
  $$("[data-order-detail]").forEach((button) =>
    button.addEventListener("click", () =>
      openOrder(Number(button.dataset.orderDetail)),
    ),
  );
  $("[data-export-orders]").addEventListener("click", exportOrders);
}

async function openOrder(id) {
  const order = orders.find((item) => item.id === id);
  if (!order) {
    return;
  }
  const history = await request("/api/orders/" + id + "/history");
  modal(
    "<h2>" +
      escapeHTML(order.order_ref) +
      '</h2><div class="admin-order-detail"><p><strong>' +
      escapeHTML(order.customer_name) +
      "</strong><br>" +
      escapeHTML(order.phone) +
      "<br>" +
      escapeHTML(order.address) +
      ", " +
      escapeHTML(order.city) +
      ", " +
      escapeHTML(order.district) +
      "</p><p><strong>Items</strong><br>" +
      order.items
        .map(
          (item) =>
            escapeHTML(item.product_name) +
            " · " +
            escapeHTML(item.color_name || "Standard") +
            " × " +
            item.quantity,
        )
        .join("<br>") +
      "</p><p><strong>Total</strong><br>" +
      formatLKR(order.total_payable) +
      " · " +
      escapeHTML(order.payment_method.replace("_", " ")) +
      " · " +
      escapeHTML(order.payment_status) +
      '</p><div class="admin-order-actions"><select class="admin-control" aria-label="Order status" data-new-order-status>' +
      [
        "pending",
        "new",
        "awaiting_confirmation",
        "confirmed",
        "processing",
        "paid",
        "shipped",
        "dispatched",
        "delivered",
        "cancelled",
      ]
        .map(
          (status) =>
            '<option value="' +
            status +
            '"' +
            (status === order.order_status ? " selected" : "") +
            ">" +
            status.replace("_", " ") +
            "</option>",
        )
        .join("") +
      '</select><label>Internal note<input class="admin-control" data-order-note placeholder="Optional note for this update"></label><button class="admin-button" data-save-order-status>Save status</button>' +
      (["awaiting_transfer", "due_on_delivery", "payment_issue"].includes(
        order.payment_status,
      )
        ? '<button class="admin-button" data-verify-payment>Record payment received</button>'
        : "") +
      '<a class="admin-link-button" target="_blank" rel="noreferrer" href="https://wa.me/' +
      escapeHTML(order.whatsapp_number.replace(/\D/g, "")) +
      "?text=" +
      encodeURIComponent(
        "Hello " +
          order.customer_name +
          ", regarding FLEXER order " +
          order.order_ref,
      ) +
      '">Message on WhatsApp ↗</a></div></div>',
  );
  const historyPanel = document.createElement("section");
  const historyTitle = document.createElement("h3");
  historyTitle.textContent = "Order history";
  historyPanel.append(historyTitle);
  history.forEach((entry) => {
    const row = document.createElement("p");
    let detail = {};
    try {
      detail = JSON.parse(entry.details || "{}");
    } catch {
      /* Older free-text events remain readable through their action. */
    }
    row.textContent =
      entry.created_at +
      " · " +
      entry.performed_by +
      " · " +
      entry.action.replaceAll("_", " ") +
      (detail.to ? " → " + detail.to : "") +
      (detail.note ? " · " + detail.note : "");
    historyPanel.append(row);
  });
  $(".admin-order-detail").append(historyPanel);
  $("[data-save-order-status]").addEventListener("click", async () => {
    await request("/api/orders/" + id + "/status", {
      method: "PATCH",
      body: JSON.stringify({
        status: $("[data-new-order-status]").value,
        note: $("[data-order-note]").value,
      }),
    });
    closeModal();
    renderOrders();
  });
  $("[data-verify-payment]")?.addEventListener("click", async () => {
    await request("/api/orders/" + id + "/payment-verify", {
      method: "PATCH",
      body: JSON.stringify({
        verified: true,
        notes: "Verified in merchant operations dashboard",
      }),
    });
    closeModal();
    renderOrders();
  });
}

function debounce(callback, delay) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), delay);
  };
}

async function exportOrders() {
  const response = await fetch("/api/orders/export.csv", {
    headers: headers(),
  });
  if (!response.ok) {
    throw new Error("Could not export orders.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "flexer-orders.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function productRows() {
  return products
    .map(
      (product) =>
        "<tr><td><strong>" +
        escapeHTML(product.name) +
        "</strong><small>" +
        escapeHTML(product.sku) +
        "</small></td><td>" +
        escapeHTML(product.category) +
        "</td><td>" +
        formatLKR(product.price) +
        '</td><td><span class="admin-status">' +
        (product.active ? "Live" : "Archived") +
        '</span></td><td><button data-edit-product="' +
        product.id +
        '">Edit</button> <button data-remove-product="' +
        product.id +
        '" class="admin-link-button admin-danger">' +
        (product.active ? "Delete" : "Restore") +
        "</button></td></tr>",
    )
    .join("");
}

async function renderProducts() {
  products = await request("/api/products?all=true");
  setPanel(
    '<section class="admin-card"><div class="admin-toolbar"><div><h2>Products</h2><p>Choose a frame to edit it. Delete hides it from the shop and archives it here; Restore publishes it again.</p></div><button class="admin-button" data-add-product>Add product</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Frame</th><th>Range</th><th>Price</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>' +
      productRows() +
      "</tbody></table></div></section>",
  );
  $("[data-add-product]").addEventListener("click", () => openProductForm());
  $$("[data-edit-product]").forEach((button) =>
    button.addEventListener("click", () =>
      openProductForm(
        products.find(
          (product) => product.id === Number(button.dataset.editProduct),
        ),
      ),
    ),
  );
  $$("[data-remove-product]").forEach((button) =>
    button.addEventListener("click", async () => {
      const product = products.find(
        (item) => item.id === Number(button.dataset.removeProduct),
      );
      if (!product) {
        return;
      }
      const restoring = !product.active;
      const message = restoring
        ? `Restore ${product.name} to the storefront?`
        : `Delete ${product.name} from the storefront? It will be archived here and past orders will remain available.`;
      if (!window.confirm(message)) {
        return;
      }
      button.disabled = true;
      try {
        await request(
          "/api/products/" + product.id,
          restoring
            ? { method: "PUT", body: JSON.stringify({ active: true }) }
            : { method: "DELETE" },
        );
        await renderProducts();
      } catch (error) {
        window.alert(error.message);
        button.disabled = false;
      }
    }),
  );
}

function openProductForm(product = {}) {
  const isEditing = Boolean(product.id);
  modal(
    "<h2>" +
      (isEditing ? "Edit frame" : "New frame") +
      '</h2><form class="admin-form" data-product-form><div class="admin-form__grid"><label>SKU<input required name="sku" value="' +
      escapeHTML(product.sku || "") +
      '"' +
      (isEditing ? " readonly" : "") +
      '></label><label>Frame name<input required name="name" value="' +
      escapeHTML(product.name || "") +
      '"></label><label>Range<select name="category">' +
      ["budget", "premium", "branded"]
        .map(
          (value) =>
            '<option value="' +
            value +
            '"' +
            (product.category === value ? " selected" : "") +
            ">" +
            value +
            "</option>",
        )
        .join("") +
      '</select></label><label>Type<select name="product_type">' +
      ["sunglasses", "optical"]
        .map(
          (value) =>
            '<option value="' +
            value +
            '"' +
            (product.product_type === value ? " selected" : "") +
            ">" +
            value +
            "</option>",
        )
        .join("") +
      '</select></label><label>Price LKR<input required name="price" type="number" min="0" value="' +
      (product.price || "") +
      '"></label><label>Original price<input name="original_price" type="number" min="0" value="' +
      (product.original_price || "") +
      '"></label><label class="full">Description<textarea required name="description">' +
      escapeHTML(product.description || "") +
      '</textarea></label><label>Primary image path<input name="primary_image" value="' +
      escapeHTML(product.primary_image || "uploads/sunglasses_hero.jpg") +
      '"></label><label>Badge<input name="badge" value="' +
      escapeHTML(product.badge || "") +
      '"></label><label>Materials<input name="materials" value="' +
      escapeHTML(product.materials || "") +
      '"></label><label>Lens specification<input name="lens_spec" value="' +
      escapeHTML(product.lens_spec || "") +
      '"></label><label class="full">Dimensions<input name="dimensions" value="' +
      escapeHTML(product.dimensions || "") +
      '"></label><label class="admin-form__check full"><input name="active" type="checkbox"' +
      (product.active !== false ? " checked" : "") +
      '> Visible on storefront</label><label class="admin-form__check full"><input name="featured" type="checkbox"' +
      (product.featured ? " checked" : "") +
      '> Featured on homepage</label></div><button class="admin-button" type="submit">Save product</button></form>',
  );
  const readProductExtras = mountProductEditor(
    $("[data-product-form]"),
    product,
    request,
  );
  $("[data-product-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const productForm = event.currentTarget;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    fields.active = event.currentTarget.active.checked;
    fields.featured = event.currentTarget.featured.checked;
    fields.price = Number(fields.price);
    fields.original_price = fields.original_price
      ? Number(fields.original_price)
      : null;
    Object.assign(fields, readProductExtras());
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await request(
        isEditing ? "/api/products/" + product.id : "/api/products",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(fields),
        },
      );
      closeModal();
      renderProducts();
    } catch (error) {
      let message = productForm.querySelector("[data-product-error]");
      if (!message) {
        message = document.createElement("p");
        message.dataset.productError = "";
        message.setAttribute("role", "alert");
        productForm.append(message);
      }
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
}

async function renderContent() {
  const [subscribers, contacts] = await Promise.all([
    request("/api/newsletter"),
    request("/api/contacts"),
  ]);
  setPanel(
    '<div class="admin-form__grid"><section class="admin-card"><div class="admin-toolbar"><h2>Newsletter</h2><button class="admin-link-button" data-export-subs>Export emails</button></div>' +
      (subscribers.length
        ? subscribers
            .map(
              (item) =>
                '<p class="admin-message"><strong>' +
                escapeHTML(item.email) +
                "</strong><time>" +
                new Date(item.created_at).toLocaleDateString("en-LK") +
                "</time></p>",
            )
            .join("")
        : "<p>No subscribers yet.</p>") +
      '</section><section class="admin-card"><h2>Customer enquiries</h2>' +
      (contacts.length
        ? contacts
            .map(
              (item) =>
                '<article class="admin-message"><strong>' +
                escapeHTML(item.name) +
                " · " +
                escapeHTML(item.phone) +
                "</strong><time>" +
                new Date(item.created_at).toLocaleDateString("en-LK") +
                "</time><p>" +
                escapeHTML(item.message) +
                "</p></article>",
            )
            .join("")
        : "<p>No enquiries yet.</p>") +
      "</section></div>",
  );
  await mountContentEditor($("[data-admin-panel]"), request);
  $("[data-export-subs]").addEventListener("click", () => {
    const blob = new Blob([subscribers.map((item) => item.email).join("\n")], {
      type: "text/plain",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "flexer-newsletter.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

async function renderSettings() {
  const settings = await request("/api/settings/admin");
  const text = (key) => escapeHTML(settings[key] || "");
  setPanel(
    '<section class="admin-card"><h2>Store settings</h2><form class="admin-form" data-settings-form><fieldset><legend>Bank transfer</legend><div class="admin-form__grid"><label>Bank name<input name="bank_name" value="' +
      text("bank_name") +
      '"></label><label>Branch<input name="bank_branch" value="' +
      text("bank_branch") +
      '"></label><label>Account holder<input name="bank_account_holder" value="' +
      text("bank_account_holder") +
      '"></label><label>Account number<input name="bank_account_number" value="' +
      text("bank_account_number") +
      '"></label><label class="full">Transfer instructions<textarea name="bank_payment_instructions">' +
      text("bank_payment_instructions") +
      '</textarea></label></div></fieldset><fieldset><legend>Customer channels</legend><div class="admin-form__grid"><label>WhatsApp number<input name="whatsapp_number" value="' +
      text("whatsapp_number") +
      '"></label><label>Community URL<input name="whatsapp_community_url" value="' +
      text("whatsapp_community_url") +
      '"></label><label>Delivery fee LKR<input name="delivery_fee_islandwide" type="number" min="0" value="' +
      text("delivery_fee_islandwide") +
      '"></label><label>Announcement<input name="announcement_text" value="' +
      text("announcement_text") +
      '"></label></div></fieldset><fieldset><legend>Koko merchant connection</legend><div class="admin-form__grid"><label class="admin-form__check"><input name="koko_enabled" type="checkbox"' +
      (settings.koko_enabled === "1" ? " checked" : "") +
      '> Enable Koko</label><label>Merchant ID<input name="koko_merchant_id" value="' +
      text("koko_merchant_id") +
      '"></label><label>API key<input name="koko_api_key" type="password" value="' +
      text("koko_api_key") +
      '"></label><label>Webhook secret<input name="koko_webhook_secret" type="password" value="' +
      text("koko_webhook_secret") +
      '"></label><label>Mode<select name="koko_mode"><option value="manual_request"' +
      (settings.koko_mode !== "direct_api" ? " selected" : "") +
      '>Manual request</option><option value="direct_api"' +
      (settings.koko_mode === "direct_api" ? " selected" : "") +
      '>Direct API</option></select></label></div></fieldset><button class="admin-button" type="submit">Save settings</button></form></section>',
  );
  $("[data-settings-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.koko_enabled = event.currentTarget.koko_enabled.checked ? "1" : "0";
    await request("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    renderSettings();
  });
}

async function renderTab() {
  try {
    if (activeTab === "dashboard") {
      await renderDashboard();
    }
    if (activeTab === "orders") {
      await renderOrders();
    }
    if (activeTab === "products") {
      await renderProducts();
    }
    if (activeTab === "content") {
      await renderContent();
    }
    if (activeTab === "settings") {
      await renderSettings();
    }
  } catch (error) {
    setPanel(
      '<section class="admin-card"><p class="admin-error">' +
        escapeHTML(error.message) +
        "</p></section>",
    );
  }
}

async function enterApp() {
  try {
    const auth = await request("/api/auth/me");
    localStorage.setItem(USER_KEY, auth.user.username);
    $("[data-admin-login]").hidden = true;
    $("[data-admin-app]").hidden = false;
    setTitle("Overview");
    await renderTab();
  } catch (err) {
    logout();
    const error = $("[data-login-error]");
    if (error) {
      error.textContent = err.message || "Failed to enter dashboard.";
    }
  }
}

function setup() {
  $("[data-login-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const error = $("[data-login-error]");
    const button = $("button", form);
    button.disabled = true;
    error.textContent = "";
    try {
      const data = Object.fromEntries(new FormData(form));
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Sign in failed.");
      }
      token = result.token;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, result.username);
      await enterApp();
    } catch (errorResult) {
      error.textContent = errorResult.message;
    } finally {
      button.disabled = false;
    }
  });
  $$("[data-admin-tab]").forEach((button) =>
    button.addEventListener("click", () => {
      activeTab = button.dataset.adminTab;
      setTitle(button.textContent.trim());
      renderTab();
    }),
  );
  $("[data-admin-logout]").addEventListener("click", logout);
  $("[data-new-product]").addEventListener("click", () => {
    activeTab = "products";
    openProductForm();
  });
  $("[data-modal-close]").addEventListener("click", closeModal);
  $("[data-admin-modal]").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
  if (token) {
    enterApp();
  }
}

setup();
