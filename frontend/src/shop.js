import {
  addToCart,
  escapeHTML,
  formatLKR,
  mountCommerceShell,
  normalizeImage,
} from "./commerce-shared.js";

const state = {
  category: "all",
  type: "all",
  search: "",
  sort: "featured",
  maxPrice: 30000,
  products: [],
};
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];

function safe(value, choices) {
  return choices.includes(value) ? value : "all";
}

function updateURL() {
  const params = new URLSearchParams();
  if (state.category !== "all") {
    params.set("category", state.category);
  }
  if (state.type !== "all") {
    params.set("type", state.type);
  }
  if (state.search) {
    params.set("search", state.search);
  }
  if (state.sort !== "featured") {
    params.set("sort", state.sort);
  }
  if (state.maxPrice < 30000) {
    params.set("max_price", state.maxPrice);
  }
  window.history.replaceState(
    {},
    "",
    window.location.pathname + (params.size ? "?" + params : ""),
  );
}

function makeCard(product) {
  const primary = normalizeImage(product.images?.[0] || product.primary_image);
  const secondary = normalizeImage(product.images?.[1] || primary);
  const slug = encodeURIComponent(product.slug || product.id);
  const colours = (product.colors || [])
    .filter((color) => /^#[0-9a-f]{3,8}$/i.test(color))
    .slice(0, 4);
  return (
    '<article class="catalogue-card"><div class="catalogue-card__media"><a class="catalogue-card__image" href="/product/' +
    slug +
    '"><img src="' +
    escapeHTML(primary) +
    '" alt="' +
    escapeHTML(product.name) +
    '" width="900" height="1100" loading="lazy"><img class="catalogue-card__hover" src="' +
    escapeHTML(secondary) +
    '" alt="" width="900" height="1100" loading="lazy"></a><div class="catalogue-card__actions"><button type="button" data-quick-view="' +
    product.id +
    '">Quick view</button><button type="button" data-add-item="' +
    product.id +
    '">Add to bag</button></div></div><div class="catalogue-card__body"><p>' +
    escapeHTML(product.category) +
    " / " +
    (product.product_type === "optical" ? "optical" : "UV400") +
    '</p><h2><a href="/product/' +
    slug +
    '">' +
    escapeHTML(product.name) +
    '</a></h2><div class="catalogue-card__swatches">' +
    colours.map((color) => '<i style="--swatch:' + color + '"></i>').join("") +
    "</div><strong>" +
    formatLKR(product.price) +
    "</strong></div></article>"
  );
}

function render() {
  const grid = $("[data-catalogue-grid]");
  const filtered = state.products.filter((product) => {
    if (state.category !== "all" && product.category !== state.category) return false;
    if (state.type !== "all" && product.product_type !== state.type) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      const match = (product.name || "").toLowerCase().includes(q) ||
                    (product.description || "").toLowerCase().includes(q) ||
                    (product.brand || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return Number(product.price) <= state.maxPrice;
  }).sort((a, b) => {
    if (state.sort === "price-asc") return Number(a.price) - Number(b.price);
    if (state.sort === "price-desc") return Number(b.price) - Number(a.price);
    if (state.sort === "name") return (a.name || "").localeCompare(b.name || "");
    return 0;
  });
  $("[data-product-count]").textContent =
    filtered.length +
    " frame" +
    (filtered.length === 1 ? "" : "s") +
    " available";
  $("[data-filter-count]").textContent =
    [
      state.category !== "all",
      state.type !== "all",
      state.maxPrice < 30000,
    ].filter(Boolean).length || "";
  const chips = [];
  if (state.category !== "all") {
    chips.push("Range: " + state.category);
  }
  if (state.type !== "all") {
    chips.push("Type: " + state.type);
  }
  if (state.search) {
    chips.push("Search: " + state.search);
  }
  if (state.maxPrice < 30000) {
    chips.push("Up to " + formatLKR(state.maxPrice));
  }
  $("[data-active-filters]").innerHTML = chips
    .map((chip) => '<span class="filter-chip">' + escapeHTML(chip) + "</span>")
    .join("");
  grid.innerHTML = filtered.length
    ? filtered.map(makeCard).join("")
    : '<p class="catalogue-empty">No frames match those filters. <button type="button" data-reset-filters>Clear filters</button></p>';
  $$("[data-add-item]").forEach((button) =>
    button.addEventListener("click", () => {
      const product = state.products.find(
        (item) => item.id === Number(button.dataset.addItem),
      );
      const variant = product?.variants?.find(
        (item) => item.is_available && Number(item.stock_quantity) > 0,
      );
      if (product) {
        addToCart(product, variant);
      }
    }),
  );
  $$("[data-quick-view]").forEach((button) =>
    button.addEventListener("click", () =>
      openQuickView(Number(button.dataset.quickView)),
    ),
  );
  $$("[data-reset-filters]").forEach((button) =>
    button.addEventListener("click", reset),
  );
}

async function load() {
  const grid = $("[data-catalogue-grid]");
  grid.innerHTML = '<p class="catalogue-empty">Loading collection</p>';
  const params = new URLSearchParams({ sort: state.sort });
  if (state.category !== "all") {
    params.set("category", state.category);
  }
  if (state.type !== "all") {
    params.set("product_type", state.type);
  }
  if (state.search) {
    params.set("search", state.search);
  }
  try {
    let response = await fetch("/api/products?" + params);
    if (!response.ok) {
      response = await fetch("/api/products.json");
    }
    if (!response.ok) {
      throw new Error();
    }
    state.products = await response.json();
    updateURL();
    render();
  } catch {
    grid.innerHTML =
      '<p class="catalogue-empty">The collection is unavailable right now. Please try again shortly.</p>';
  }
}

function closeFilters() {
  const drawer = $("[data-filter-drawer]");
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
}

function reset() {
  Object.assign(state, {
    category: "all",
    type: "all",
    search: "",
    sort: "featured",
    maxPrice: 30000,
  });
  $("[data-catalogue-search]").value = "";
  $("[data-catalogue-sort]").value = "featured";
  $("[data-filter-form]").reset();
  $("[data-price-output]").textContent = formatLKR(30000);
  load();
}

async function openQuickView(id) {
  const modal = $("[data-quick-view]");
  const content = $("[data-quick-content]");
  content.innerHTML = '<p class="catalogue-empty">Loading frame</p>';
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  try {
    let product;
    try {
      const response = await fetch("/api/products/" + id);
      if (response.ok) {
        product = await response.json();
      }
    } catch {
      // ignore
    }
    if (!product) {
      product = state.products.find((item) => item.id === Number(id));
    }
    if (!product) {
      throw new Error();
    }
    const variant = product.variants?.find(
      (item) => item.is_available && Number(item.stock_quantity) > 0,
    );
    content.innerHTML =
      '<article class="quick-view"><img src="' +
      escapeHTML(normalizeImage(variant?.image || product.primary_image)) +
      '" alt="' +
      escapeHTML(product.name) +
      '" width="800" height="900"><div class="quick-view__content"><p class="eyebrow">' +
      escapeHTML(product.category) +
      " collection</p><h2>" +
      escapeHTML(product.name) +
      '</h2><span class="quick-view__price">' +
      formatLKR(product.price) +
      "</span><p>" +
      escapeHTML(product.description) +
      '</p><a class="text-link" href="/product/' +
      encodeURIComponent(product.slug) +
      '">View full details <span>↗</span></a><button class="button button--dark" type="button" data-quick-add><span>Add to bag</span><i>↗</i></button></div></article>';
    $("[data-quick-add]", content).addEventListener("click", () => {
      if (addToCart(product, variant)) {
        modal.classList.remove("is-open");
      }
    });
  } catch {
    content.innerHTML =
      '<p class="catalogue-empty">Could not load this frame.</p>';
  }
}

function setup() {
  const params = new URLSearchParams(window.location.search);
  state.category = safe(params.get("category"), [
    "all",
    "budget",
    "premium",
    "branded",
  ]);
  state.type = safe(params.get("type"), ["all", "sunglasses", "optical"]);
  state.search = params.get("search") || "";
  state.sort = [
    "featured",
    "price-asc",
    "price-desc",
    "newest",
    "name",
  ].includes(params.get("sort"))
    ? params.get("sort")
    : "featured";
  state.maxPrice = Math.min(
    30000,
    Math.max(2000, Number(params.get("max_price")) || 30000),
  );
  $("[name=category][value=" + state.category + "]").checked = true;
  $("[name=type][value=" + state.type + "]").checked = true;
  $("[data-catalogue-search]").value = state.search;
  $("[data-catalogue-sort]").value = state.sort;
  $("[data-price-range]").value = state.maxPrice;
  $("[data-price-output]").textContent = formatLKR(state.maxPrice);
  let searchTimeout;
  $("[data-catalogue-search]").addEventListener("input", (event) => {
    window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      state.search = event.target.value.trim();
      load();
    }, 250);
  });
  $("[data-catalogue-sort]").addEventListener("change", (event) => {
    state.sort = event.target.value;
    load();
  });
  $("[data-filter-open]").addEventListener("click", () => {
    const drawer = $("[data-filter-drawer]");
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  });
  $("[data-filter-close]").addEventListener("click", closeFilters);
  $("[data-filter-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.category = data.get("category");
    state.type = data.get("type");
    closeFilters();
    load();
  });
  $("[data-price-range]").addEventListener("input", (event) => {
    state.maxPrice = Number(event.target.value);
    $("[data-price-output]").textContent = formatLKR(state.maxPrice);
  });
  $("[data-quick-close]").addEventListener("click", () =>
    $("[data-quick-view]").classList.remove("is-open"),
  );
  $("[data-quick-view]").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      event.currentTarget.classList.remove("is-open");
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeFilters();
      $("[data-quick-view]").classList.remove("is-open");
    }
  });
  load();
}

mountCommerceShell();
setup();
