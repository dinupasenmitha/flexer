import {
  addToCart,
  escapeHTML,
  formatLKR,
  mountCommerceShell,
  normalizeImage,
} from "./commerce-shared.js";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];
let product;
let variant;
let quantity = 1;
let gallery = [];

function getIdentifier() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return new URLSearchParams(window.location.search).get("id") || parts[1];
}

function selectedImage() {
  return normalizeImage(variant?.image || gallery[0]);
}

function renderProduct() {
  document.title = product.name + " — FLEXER";
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      "content",
      product.description || `Explore ${product.name} from FLEXER.`,
    );
  document.querySelector('link[rel="canonical"]')?.remove();
  document.querySelector("script[data-product-schema]")?.remove();
  const canonical = document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = `${location.origin}/product/${encodeURIComponent(product.slug)}`;
  document.head.append(canonical);
  const productSchema = document.createElement("script");
  productSchema.type = "application/ld+json";
  productSchema.dataset.productSchema = "";
  productSchema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: (product.images || [product.primary_image]).map(normalizeImage),
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: Number(product.price),
      availability: "https://schema.org/InStock",
      url: canonical.href,
    },
  });
  document.head.append(productSchema);
  gallery = [
    ...new Set(
      (product.images?.length ? product.images : [product.primary_image]).map(
        normalizeImage,
      ),
    ),
  ];
  const image = selectedImage();
  const hasVariants = Boolean(product.variants?.length);
  const available =
    !hasVariants ||
    (variant && variant.is_available && Number(variant.stock_quantity) > 0);
  const maxQuantity = Math.min(20, Number(variant?.stock_quantity || 20));
  if (quantity > maxQuantity) {
    quantity = maxQuantity;
  }
  const variants = (product.variants || [])
    .map(
      (item, index) =>
        '<button type="button" data-variant="' +
        index +
        '" class="' +
        (item.sku === variant?.sku ? "is-active" : "") +
        '" ' +
        (!item.is_available || Number(item.stock_quantity) < 1
          ? "disabled"
          : "") +
        '><i class="variant-dot" style="--swatch:' +
        escapeHTML(item.color_hex) +
        '"></i>' +
        escapeHTML(item.color_name) +
        "</button>",
    )
    .join("");
  const specification = (label, value) =>
    value
      ? "<details><summary>" +
        label +
        "<span>+</span></summary><p>" +
        escapeHTML(value) +
        "</p></details>"
      : "";
  const related = product.related?.length
    ? '<section class="related-products"><p class="eyebrow">More to explore</p><h2>Frames you may <em>like next.</em></h2><div class="catalogue-grid">' +
      product.related
        .map(
          (item) =>
            '<article class="catalogue-card"><div class="catalogue-card__media"><a class="catalogue-card__image" href="/product/' +
            encodeURIComponent(item.slug) +
            '"><img src="' +
            escapeHTML(normalizeImage(item.primary_image)) +
            '" alt="' +
            escapeHTML(item.name) +
            '" width="800" height="1000" loading="lazy"></a></div><div class="catalogue-card__body"><p>' +
            escapeHTML(item.category) +
            '</p><h2><a href="/product/' +
            encodeURIComponent(item.slug) +
            '">' +
            escapeHTML(item.name) +
            "</a></h2><strong>" +
            formatLKR(item.price) +
            "</strong></div></article>",
        )
        .join("") +
      "</div></section>"
    : "";
  $("[data-product-page]").innerHTML =
    '<div class="product-layout"><section class="product-gallery"><div class="product-main-image"><img data-main-product-image src="' +
    escapeHTML(image) +
    '" alt="' +
    escapeHTML(product.name) +
    '" width="1000" height="1200"></div><div class="product-thumbnails">' +
    gallery
      .map(
        (item) =>
          '<button type="button" data-gallery-image="' +
          escapeHTML(item) +
          '" class="' +
          (item === image ? "is-active" : "") +
          '"><img src="' +
          escapeHTML(item) +
          '" alt="View ' +
          escapeHTML(product.name) +
          '"></button>',
      )
      .join("") +
    '</div></section><section class="product-info"><p class="breadcrumbs"><a href="/">Home</a> / <a href="/shop">Collection</a> / ' +
    escapeHTML(product.category) +
    '</p><p class="product-info__range">' +
    escapeHTML(product.category) +
    " collection / " +
    escapeHTML(product.brand) +
    "</p><h1>" +
    escapeHTML(product.name) +
    '</h1><div class="product-info__price"><span>' +
    formatLKR(product.price) +
    '</span><span>Delivery calculated at checkout</span></div><p class="product-info__description">' +
    escapeHTML(product.description) +
    '</p><div class="product-options"><p>Colourway' +
    (variant ? ": " + escapeHTML(variant.color_name) : "") +
    '</p><div class="variant-buttons">' +
    variants +
    '</div></div><div class="product-actions"><div class="quantity-control"><button type="button" data-quantity-minus aria-label="Reduce quantity">−</button><span data-product-quantity>' +
    quantity +
    '</span><button type="button" data-quantity-plus aria-label="Increase quantity">+</button></div><button class="button button--dark" type="button" data-add-product ' +
    (!available ? "disabled" : "") +
    "><span>" +
    (available ? "Add to bag" : "Out of stock") +
    '</span><i>↗</i></button></div><a class="product-whatsapp" target="_blank" rel="noreferrer" href="' +
    whatsappLink() +
    '">Ask about this frame on WhatsApp ↗</a><div class="product-accordions">' +
    specification("Frame material", product.materials) +
    specification("Lens specification", product.lens_spec) +
    specification("Frame dimensions", product.dimensions) +
    (() => {
      const cat = (product.category || "budget").toLowerCase();
      const packagingMap = {
        budget: {
          image: "/uploads/packaging_budget.webp",
          title: "Budget Range Care Set",
          items: [
            "Protective Zip Pouch",
            "Soft Drawstring Travel Pouch",
            "Microfibre Lens Cleaning Cloth",
            "UV400 Certified Eye Protection",
          ],
        },
        premium: {
          image: "/uploads/packaging_premium.webp",
          title: "Premium Atelier Presentation Set",
          items: [
            "Matte Presentation Gift Box",
            "Textured Leatherette Hard Case",
            "Lens Cleaner Spray Bottle",
            "High-Density Microfibre Cloth",
            "Soft Drawstring Dust Pouch",
            "Care & Warranty Card",
          ],
        },
        branded: {
          image: "/uploads/packaging_branded.webp",
          title: "Branded Collector's Presentation Suite",
          items: [
            "Handcrafted Solid Walnut Box",
            "Designer Hard Leather Case",
            "Branded Gift Box with Ribbon",
            "Certificate of Authenticity Card",
            "Signature Branded Cleaning Cloth",
          ],
        },
      };
      const pack = packagingMap[cat] || packagingMap.budget;
      const items =
        Array.isArray(product.inclusions) && product.inclusions.length
          ? product.inclusions
          : pack.items;
      return (
        '<details class="product-inclusions-accordion" open><summary>What is included with your order<span>+</span></summary><div class="product-inclusions-wrapper"><div class="product-inclusions-image"><img src="' +
        pack.image +
        '" alt="' +
        pack.title +
        '" width="600" height="600" loading="lazy"><span class="product-inclusions-tag">' +
        escapeHTML(product.category) +
        ' packaging</span></div><div class="product-inclusions-info"><h4>' +
        pack.title +
        '</h4><ul class="product-inclusions-items">' +
        items
          .map((item) => "<li><i>✓</i>" + escapeHTML(item) + "</li>")
          .join("") +
        "</ul></div></div></details>"
      );
    })() +
    specification(
      "Warranty",
      product.warranty_months
        ? product.warranty_months + " month manufacturing warranty"
        : "",
    ) +
    specification("Care", product.care_instructions) +
    "</div></section></div>" +
    related;
  $$(".product-thumbnails button").forEach((button) =>
    button.addEventListener("click", () => {
      const main = $("[data-main-product-image]");
      main.style.opacity = "0";
      window.setTimeout(() => {
        main.src = button.dataset.galleryImage;
        main.style.opacity = "1";
      }, 160);
      $$(".product-thumbnails button").forEach((other) =>
        other.classList.toggle("is-active", other === button),
      );
    }),
  );
  $$(".variant-buttons button").forEach((button) =>
    button.addEventListener("click", () => {
      variant = product.variants[Number(button.dataset.variant)];
      quantity = 1;
      renderProduct();
    }),
  );
  $("[data-quantity-minus]").addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    $("[data-product-quantity]").textContent = quantity;
  });
  $("[data-quantity-plus]").addEventListener("click", () => {
    quantity = Math.min(maxQuantity, quantity + 1);
    $("[data-product-quantity]").textContent = quantity;
  });
  $("[data-add-product]")?.addEventListener("click", () =>
    addToCart(product, variant, quantity),
  );
}

function whatsappLink() {
  const message =
    "Hello FLEXER, I would like to ask about " +
    product.name +
    (variant ? " in " + variant.color_name : "") +
    ".";
  return "https://wa.me/94775580968?text=" + encodeURIComponent(message);
}

async function init() {
  const identifier = getIdentifier();
  if (!identifier) {
    $("[data-product-page]").innerHTML =
      '<p class="product-loading">Choose a frame from the <a href="/shop">collection</a>.</p>';
    return;
  }
  try {
    let response;
    try {
      response = await fetch("/api/products/" + encodeURIComponent(identifier));
    } catch {
      // ignore
    }
    if (response && response.ok) {
      product = await response.json();
    } else {
      // Fallback: load from static products.json
      const staticRes = await fetch("/api/products.json");
      if (!staticRes.ok) throw new Error("Could not load catalogue");
      const allProducts = await staticRes.json();
      product = allProducts.find(
        (p) => p.slug === identifier || String(p.id) === String(identifier)
      );
      if (!product) throw new Error("Frame not found");
      product.related = allProducts
        .filter(
          (p) =>
            p.id !== product.id &&
            (p.category === product.category || p.product_type === product.product_type)
        )
        .slice(0, 3);
    }
    variant =
      product.variants?.find(
        (item) => item.is_available && Number(item.stock_quantity) > 0,
      ) || null;
    renderProduct();
  } catch {
    $("[data-product-page]").innerHTML =
      '<div class="product-not-found"><p class="eyebrow">Frame unavailable</p><h1>We could not find this frame</h1><p>It may have been removed or its link may have changed.</p><a class="button button--dark" href="/shop"><span>Browse all frames</span></a></div>';
  }
}

mountCommerceShell();
init();
