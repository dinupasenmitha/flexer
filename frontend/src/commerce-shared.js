import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600-italic.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "./styles/foundation.css";
import "./styles/commerce.css";
import "./styles/rebuild.css";
import { mountBrandChrome } from "./brand-shell.js";
import { mountMotion } from "./motion.js";
import { mountTheme } from "./theme.js";

export const CART_KEY = "FLEXER_cart_v2";
export const formatLKR = (value) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK")}`;
export const normalizeImage = (value) => {
  // These inherited filenames contain unrelated imagery, confirmed by visual audit.
  // Preserve merchant records while showing an honest placeholder until replaced.
  const rejected = new Set([
    "sunglasses_premium_dark.jpg",
    "sunglasses_editorial_1.jpg",
    "sunglasses_luxury_gold.jpg",
    "sunglasses_display_row.jpg",
    "sunglasses_hero_model.jpg",
    "sunglasses_titanium_grey.jpg",
    "optical_frame_clear.jpg",
  ]);
  if (!value || rejected.has(String(value).split("/").pop()?.split("?")[0])) {
    return "/assets/product-photo-pending.svg";
  }
  return /^(https?:)?\//.test(value) ? value : `/${value}`;
};
export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );

export function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("flexer:cart-updated"));
}

export function addToCart(product, variant, quantity = 1) {
  if (
    variant &&
    (!variant.is_available || Number(variant.stock_quantity) < 1)
  ) {
    showToast("That colourway is currently unavailable.", "error");
    return false;
  }
  const cart = getCart();
  const existing = cart.find(
    (item) =>
      item.id === product.id && item.variant_sku === (variant?.sku || null),
  );
  const limit = Math.min(20, Number(variant?.stock_quantity || 20));
  if (existing) {
    existing.qty = Math.min(limit, existing.qty + quantity);
  } else {
    cart.push({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: Number(product.price),
      image: normalizeImage(
        variant?.image || product.primary_image || product.images?.[0],
      ),
      color_name: variant?.color_name || "Standard",
      color_hex: variant?.color_hex || "#121212",
      variant_sku: variant?.sku || null,
      qty: Math.min(limit, quantity),
    });
  }
  setCart(cart);
  showToast(`${product.name} added to your bag.`, "success");
  return true;
}

export function updateCartItem(index, quantity) {
  const cart = getCart();
  if (!cart[index]) {
    return;
  }
  if (quantity < 1) {
    cart.splice(index, 1);
  } else {
    cart[index].qty = Math.min(20, quantity);
  }
  setCart(cart);
}

export function cartSubtotal() {
  return getCart().reduce(
    (total, item) => total + Number(item.price) * Number(item.qty),
    0,
  );
}

export function showToast(message, type = "") {
  let host = document.querySelector(".toast-container");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-container";
    document.body.append(host);
  }
  const toast = document.createElement("p");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  host.append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function renderCartDrawer() {
  const body = document.querySelector("[data-cart-items]");
  const total = document.querySelector("[data-cart-total]");
  const count = document.querySelector("[data-cart-count]");
  const cart = getCart();
  if (count) {
    count.textContent = cart.reduce((sum, item) => sum + Number(item.qty), 0);
  }
  if (total) {
    total.textContent = formatLKR(cartSubtotal());
  }
  if (!body) {
    return;
  }
  if (!cart.length) {
    body.innerHTML =
      '<p class="cart-empty">Your bag is waiting for its first frame. <a href="/shop">Explore collection</a></p>';
    return;
  }
  body.innerHTML = cart
    .map(
      (item, index) =>
        `<article class="drawer-item"><img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" width="88" height="100"><div><p>${escapeHTML(item.name)}</p><small>${escapeHTML(item.color_name)}</small><strong>${formatLKR(item.price)}</strong><div class="drawer-quantity"><button type="button" data-cart-decrease="${index}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-cart-increase="${index}" aria-label="Increase quantity">+</button><button type="button" data-cart-remove="${index}">Remove</button></div></div></article>`,
    )
    .join("");
  body
    .querySelectorAll("[data-cart-decrease]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        updateCartItem(
          Number(button.dataset.cartDecrease),
          getCart()[Number(button.dataset.cartDecrease)].qty - 1,
        ),
      ),
    );
  body
    .querySelectorAll("[data-cart-increase]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        updateCartItem(
          Number(button.dataset.cartIncrease),
          getCart()[Number(button.dataset.cartIncrease)].qty + 1,
        ),
      ),
    );
  body
    .querySelectorAll("[data-cart-remove]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        updateCartItem(Number(button.dataset.cartRemove), 0),
      ),
    );
}

export function mountCommerceShell() {
  const root = document.querySelector("#commerce-shell");
  if (!root) {
    return;
  }
  root.innerHTML = `<header class="commerce-header"><div class="commerce-header__inner"><a class="brand-logo" href="/" aria-label="FLEXER home"><span class="brand-logo__text">FLEXER</span><span class="brand-logo__tag">EYEWEAR</span></a><nav class="commerce-nav" aria-label="Primary"><a href="/shop" class="commerce-nav__link">Shop all</a><a href="/budget" class="commerce-nav__link">Budget</a><a href="/premium" class="commerce-nav__link">Premium</a><a href="/branded" class="commerce-nav__link">Branded</a><a href="/about" class="commerce-nav__link">Our story</a><a href="/contact" class="commerce-nav__link">Contact</a></nav><div class="commerce-header__actions"><a class="header-search" href="/shop?search=" aria-label="Search frames"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></a><button class="commerce-bag" type="button" data-cart-open aria-label="Shopping bag"><svg class="bag-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><span class="commerce-bag__count" data-cart-count>0</span></button><button class="commerce-menu-toggle" type="button" aria-expanded="false" aria-controls="commerce-mobile-nav" data-commerce-menu aria-label="Toggle navigation menu"><span class="menu-icon" aria-hidden="true"><span></span><span></span></span><span class="menu-label">Menu</span></button></div></div><nav class="commerce-mobile-nav" id="commerce-mobile-nav" aria-label="Mobile" hidden><a href="/shop">Shop all</a><a href="/budget">Budget</a><a href="/premium">Premium</a><a href="/branded">Branded</a><a href="/about">Our story</a><a href="/contact">Support</a></nav></header><div class="drawer-backdrop" data-cart-close></div><aside class="commerce-cart" data-cart-drawer aria-hidden="true"><div class="drawer-head"><p>Your bag</p><button type="button" data-cart-close>Close</button></div><div data-cart-items></div><div class="drawer-total"><span>Total</span><strong data-cart-total>LKR 0</strong><a class="button button--dark" href="/checkout"><span>Checkout</span><i aria-hidden="true">&rarr;</i></a></div></aside>`;
  mountBrandChrome(root);
  mountTheme(root);
  mountMotion();
  const menuButton = root.querySelector("[data-commerce-menu]");
  const mobileNav = root.querySelector("#commerce-mobile-nav");
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  };
  menuButton.addEventListener("click", () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    menuButton.setAttribute("aria-expanded", String(opening));
  });
  const drawer = root.querySelector("[data-cart-drawer]");
  const close = () => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-overlay");
  };
  root.querySelector("[data-cart-open]").addEventListener("click", () => {
    renderCartDrawer();
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-overlay");
  });
  root
    .querySelectorAll("[data-cart-close]")
    .forEach((button) => button.addEventListener("click", close));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      closeMenu();
    }
  });
  window.addEventListener("flexer:cart-updated", renderCartDrawer);
  renderCartDrawer();
}
