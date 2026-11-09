import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600-italic.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/foundation.css";

export const motion = Object.freeze({
  easePrimary: "power3.out",
  easeReveal: "expo.out",
  durationShort: 0.6,
  durationBase: 0.9,
  durationLong: 1.2,
  stagger: 0.08,
});

export const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];
const canAnimate = !prefersReducedMotion.matches;
const usesFinePointer = window.matchMedia("(pointer: fine)").matches;
const usesCompactViewport = window.matchMedia("(max-width: 760px)").matches;
let lenis;

function trapFocus(event, container) {
  if (event.key !== "Tab") {
    return;
  }
  const focusable = $$(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    container,
  ).filter((element) => !element.hidden);
  if (!focusable.length) {
    return;
  }
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setupPreloader() {
  const preloader = $(".preloader");
  if (!preloader) {
    return;
  }
  const finish = () => {
    document.documentElement.classList.add("is-loaded");
    if (!canAnimate) {
      preloader.remove();
      return;
    }
    gsap
      .timeline({ onComplete: () => preloader.remove() })
      .to(".preloader__line span", {
        scaleX: 1,
        duration: 0.7,
        ease: motion.easeReveal,
      })
      .to(
        ".preloader__wordmark",
        {
          yPercent: -110,
          opacity: 0,
          duration: 0.45,
          ease: motion.easePrimary,
        },
        "+=0.12",
      )
      .to(
        preloader,
        { yPercent: -100, duration: 0.8, ease: motion.easeReveal },
        "<0.08",
      );
  };
  if (document.readyState === "complete") {
    finish();
  } else {
    window.addEventListener("load", finish, { once: true });
  }
}

function setupVideo() {
  const video = $("[data-hero-video]");
  if (
    !video ||
    !canAnimate ||
    usesCompactViewport ||
    navigator.connection?.saveData
  ) {
    return;
  }
  const loadVideo = () => {
    const source = $("source[data-src]", video);
    if (!source) {
      return;
    }
    source.src = source.dataset.src;
    source.removeAttribute("data-src");
    video.preload = "metadata";
    video.load();
    video.play().catch(() => undefined);
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadVideo, { timeout: 2000 });
  } else {
    window.setTimeout(loadVideo, 500);
  }
}

function setupOverlay({ root, opener, closer, activeClass }) {
  if (!root || !opener) {
    return undefined;
  }
  let restoreFocus = null;
  const close = () => {
    root.classList.remove(activeClass);
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-overlay");
    restoreFocus?.focus();
  };
  opener.addEventListener("click", () => {
    restoreFocus = document.activeElement;
    root.classList.add(activeClass);
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-overlay");
    window.setTimeout(() => $("input, button, a", root)?.focus(), 80);
  });
  closer?.addEventListener("click", close);
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
    trapFocus(event, root);
  });
  return close;
}

function setupNavigation() {
  const header = $("[data-header]");
  let previousY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const currentY = window.scrollY;
      header?.classList.toggle("is-scrolled", currentY > 40);
      header?.classList.toggle(
        "is-hidden",
        currentY > 160 && currentY > previousY,
      );
      previousY = currentY;
    },
    { passive: true },
  );
  $$("[data-menu]").forEach((item) => {
    const button = $("button", item);
    const menu = $(".mega-menu", item);
    const toggle = (show) => {
      item.classList.toggle("is-open", show);
      button.setAttribute("aria-expanded", String(show));
      menu.setAttribute("aria-hidden", String(!show));
    };
    button.addEventListener("click", () =>
      toggle(!item.classList.contains("is-open")),
    );
    item.addEventListener("mouseleave", () => toggle(false));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        toggle(false);
        button.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!item.contains(event.target)) {
        toggle(false);
      }
    });
  });
  const search = $("[data-search]");
  setupOverlay({
    root: search,
    opener: $("[data-search-open]"),
    closer: $("[data-search-close]"),
    activeClass: "is-open",
  });
  const mobilePanel = $(".mobile-panel");
  const mobileToggle = $("[data-mobile-menu]");
  const closeMobile = setupOverlay({
    root: mobilePanel,
    opener: mobileToggle,
    closer: $("[data-mobile-close]"),
    activeClass: "is-open",
  });
  mobileToggle?.addEventListener("click", () =>
    mobileToggle.setAttribute(
      "aria-expanded",
      String(mobilePanel?.classList.contains("is-open")),
    ),
  );
  $$("a", mobilePanel).forEach((link) =>
    link.addEventListener("click", closeMobile),
  );
}

function setupCursorAndMagnets() {
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  if (usesFinePointer && dot && ring && canAnimate) {
    window.addEventListener("pointermove", (event) => {
      gsap.to(dot, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.12,
        ease: "none",
      });
      gsap.to(ring, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.4,
        ease: motion.easePrimary,
      });
    });
    document.documentElement.classList.add("has-custom-cursor");
  }
  if (!usesFinePointer || !canAnimate) {
    return;
  }
  $$(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const box = button.getBoundingClientRect();
      gsap.to(button, {
        x: (event.clientX - box.left - box.width / 2) * 0.14,
        y: (event.clientY - box.top - box.height / 2) * 0.16,
        duration: 0.35,
        ease: motion.easePrimary,
      });
    });
    button.addEventListener("pointerleave", () =>
      gsap.to(button, { x: 0, y: 0, duration: 0.55, ease: motion.easePrimary }),
    );
  });
}

function makeBestSellerCard(product) {
  const normalizeImg = (value) => {
    if (!value) {
      return "/uploads/sunglasses_hero.jpg";
    }
    return /^(https?:)?\//.test(value) ? value : `/${value}`;
  };
  const image = normalizeImg(product.images?.[0] || product.primary_image);
  const hoverImage = normalizeImg(product.images?.[1] || image);
  const price = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  })
    .format(product.price)
    .replace("LKR", "LKR ");

  const originalPriceHtml = product.original_price
    ? `<s class="bestseller-card__original-price">${new Intl.NumberFormat(
        "en-LK",
        {
          style: "currency",
          currency: "LKR",
          maximumFractionDigits: 0,
        },
      )
        .format(product.original_price)
        .replace("LKR", "LKR ")}</s>`
    : "";

  const savingsHtml =
    product.original_price && product.original_price > product.price
      ? `<span class="bestseller-card__discount-pill">SAVE LKR ${(
          product.original_price - product.price
        ).toLocaleString()}</span>`
      : "";

  const slug = encodeURIComponent(product.slug || product.id);
  const escapeHTML = (value) =>
    String(value).replace(
      /[&<>'"]/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[character],
    );
  const safeImage = (value) => escapeHTML(String(value).trim());
  const name = escapeHTML(product.name || "FLEXER frame");
  const categoryRaw = (product.category || "budget").toLowerCase();
  const categoryLabel = escapeHTML(categoryRaw.toUpperCase() + " RANGE");
  const badgeLabel = escapeHTML(product.badge || "FEATURED");

  let tierBadgeText = "BUDGET • RS 1,690+";
  let tierBadgeClass = "tier-badge--budget";
  if (categoryRaw === "premium") {
    tierBadgeText = "PREMIUM • POLARIZED";
    tierBadgeClass = "tier-badge--premium";
  } else if (categoryRaw === "branded") {
    tierBadgeText = "BRANDED • ARCHIVE";
    tierBadgeClass = "tier-badge--branded";
  }

  // Curate 3 high-impact selling points
  const features = [];
  features.push("UV400 Optical Shield (99.9% UVA/UVB)");
  if (
    categoryRaw === "premium" ||
    (product.lens_spec && product.lens_spec.includes("Polarized"))
  ) {
    features.push("Precision Polarized Anti-Glare Optics");
  } else if (categoryRaw === "branded") {
    features.push("Aircraft-Grade Collector Silhouette");
  } else {
    features.push("Ultra-Lightweight TR90 Memory Frame");
  }

  if (Array.isArray(product.inclusions) && product.inclusions.length > 0) {
    features.push(escapeHTML(product.inclusions[0]));
  } else {
    features.push("Custom Protective Pouch & Care Cloth");
  }

  const featuresHtml = features
    .map((f) => `<li><span>✓</span> ${escapeHTML(f)}</li>`)
    .join("");

  const swatches = (
    product.colors || (product.variants || []).map((v) => v.color_hex)
  )
    .filter((c) => /^#[0-9a-f]{3,8}$/i.test(c))
    .slice(0, 4);

  const swatchesHtml = swatches.length
    ? swatches
        .map(
          (c) =>
            `<span class="swatch-dot" style="background-color:${c}" title="Available shade"></span>`,
        )
        .join("")
    : `<span style="font-size: 0.72rem; color: var(--ink-soft); font-weight: 600;">Standard Finish</span>`;

  const card = document.createElement("article");
  card.className = "bestseller-card reveal-up";
  card.innerHTML = `
    <div class="bestseller-card__media">
      <a href="/product/${slug}" aria-label="View details for ${name}">
        <img class="bestseller-card__img" src="${safeImage(image)}" alt="${name}" width="600" height="600" loading="lazy">
        <img class="bestseller-card__hover-img" src="${safeImage(hoverImage)}" alt="" width="600" height="600" loading="lazy">
      </a>
      <span class="bestseller-card__tier ${tierBadgeClass}">${tierBadgeText}</span>
    </div>
    <div class="bestseller-card__body">
      <div class="bestseller-card__top">
        <div class="bestseller-card__meta-bar">
          <span class="bestseller-card__category">${categoryLabel}</span>
          <span class="bestseller-card__badge">${badgeLabel}</span>
        </div>
        <h3 class="bestseller-card__name"><a href="/product/${slug}">${name}</a></h3>
        <div class="bestseller-card__price-row">
          <span class="bestseller-card__price">${price}</span>
          ${originalPriceHtml}
          ${savingsHtml}
        </div>
        <ul class="bestseller-card__features">
          ${featuresHtml}
        </ul>
      </div>
      <div class="bestseller-card__bottom">
        <div class="bestseller-card__swatches" title="Available colorways">
          ${swatchesHtml}
        </div>
        <a class="bestseller-card__cta" href="/product/${slug}">
          <span>View Frame</span> <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </div>
  `;
  return card;
}

async function loadFeaturedProducts() {
  const container = $("[data-bestsellers-grid]") || $("[data-featured-rail]");
  if (!container) {
    return;
  }
  try {
    let response;
    try {
      response = await fetch("/api/products", {
        headers: { Accept: "application/json" },
      });
    } catch {
      // ignore
    }
    if (!response || !response.ok) {
      response = await fetch("/api/products.json");
    }
    if (!response.ok) {
      throw new Error("Catalogue unavailable");
    }
    const products = await response.json();
    const selected = products.filter((product) => product.featured).slice(0, 6);
    const displayProducts = selected.length ? selected : products.slice(0, 6);
    if (!displayProducts.length) {
      throw new Error("No published frames");
    }
    container.replaceChildren(...displayProducts.map(makeBestSellerCard));
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  } catch {
    container.innerHTML =
      '<p class="product-loading">The selected collection is being prepared. <a href="/shop">Explore all frames</a></p>';
  }
}

function setupAnimations() {
  if (!canAnimate) {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const hero = $("[data-hero]");
  gsap.set(".hero__title .split-line > span", { yPercent: 115 });
  gsap.set("[data-hero-reveal], .hero__lower, .scroll-cue, .hero__badges", {
    y: 22,
    opacity: 0,
  });
  gsap
    .timeline({ delay: 0.1 })
    .to(".hero__title .split-line > span", {
      yPercent: 0,
      duration: 1.05,
      ease: motion.easeReveal,
      stagger: 0.1,
    })
    .to(
      "[data-hero-reveal], .hero__lower, .scroll-cue, .hero__badges",
      {
        y: 0,
        opacity: 1,
        duration: 0.75,
        ease: motion.easePrimary,
        stagger: 0.08,
      },
      "<0.3",
    );
  if (!usesCompactViewport) {
    gsap.to(".hero__media", {
      scale: 1.08,
      opacity: 0.5,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
  $$(".reveal-up").forEach((element) =>
    gsap.from(element, {
      y: 45,
      opacity: 0,
      duration: 0.9,
      ease: motion.easePrimary,
      scrollTrigger: { trigger: element, start: "top 86%", once: true },
    }),
  );
  $$(".reveal-image").forEach((element) =>
    gsap.from(element, {
      clipPath: "inset(0 0 100% 0)",
      duration: 1.05,
      ease: motion.easeReveal,
      scrollTrigger: { trigger: element, start: "top 82%", once: true },
    }),
  );
  if (!usesCompactViewport) {
    $$("[data-parallax-card] img").forEach((image) =>
      gsap.to(image, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: image.closest("a"),
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }),
    );
  }
  $$("[data-confidence-beat]").forEach((beat) =>
    gsap.from(beat, {
      opacity: 0.25,
      y: 32,
      duration: 0.7,
      ease: motion.easePrimary,
      scrollTrigger: {
        trigger: beat,
        start: "top 80%",
        end: "bottom 58%",
        toggleActions: "play reverse play reverse",
      },
    }),
  );
  const counterGroup = $("[data-counter-group]");
  if (counterGroup) {
    ScrollTrigger.create({
      trigger: counterGroup,
      start: "top 76%",
      once: true,
      onEnter: () =>
        $$("[data-counter]", counterGroup).forEach((counter) => {
          const target = Number(counter.dataset.counter);
          const value = { number: 0 };
          gsap.to(value, {
            number: target,
            duration: 1.35,
            ease: motion.easePrimary,
            onUpdate: () => {
              const suffix = counter.dataset.suffix || "";
              counter.textContent = `${Math.round(value.number)}${suffix}`;
            },
          });
        }),
    });
  }
}

function setupLenis() {
  if (!canAnimate) {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener("pagehide", () => lenis?.destroy(), { once: true });
}

function setupProgressAndAccordions() {
  const progress = $(".scroll-progress span");
  window.addEventListener(
    "scroll",
    () => {
      if (!progress) {
        return;
      }
      const available =
        document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${available > 0 ? window.scrollY / available : 0})`;
    },
    { passive: true },
  );
  $$("[data-accordion] .faq__item").forEach((item) => {
    const button = $("button", item);
    button.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      $$("[data-accordion] .faq__item").forEach((other) => {
        other.classList.remove("is-open");
        $("button", other).setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
    });
  });
}

function setupNewsletter() {
  const form = $("[data-newsletter]");
  if (!form) {
    return;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = $("[data-form-message]", form);
    const data = new FormData(form);
    if (data.get("company")) {
      return;
    }
    const button = $("button[type=submit]", form);
    button.disabled = true;
    message.textContent = "Adding you to the list…";
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not subscribe right now.");
      }
      message.textContent = result.message;
      form.reset();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

function setupPageTransitions() {
  const transition = $(".page-transition");
  if (!transition || !canAnimate) {
    return;
  }
  $$("a[href]").forEach((link) =>
    link.addEventListener("click", (event) => {
      const url = new URL(link.href, window.location.href);
      const samePage = url.pathname === window.location.pathname && url.hash;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        link.target ||
        link.hasAttribute("download") ||
        url.origin !== window.location.origin ||
        samePage
      ) {
        return;
      }
      event.preventDefault();
      gsap.to(transition, {
        yPercent: 0,
        duration: 0.55,
        ease: motion.easeReveal,
        onComplete: () => {
          window.location.href = url.href;
        },
      });
    }),
  );
}

function updateCartCount() {
  const keys = ["FLEXER_cart_v2", "flexer_cart", "cart", "flexerCart"];
  const raw = keys.map((key) => localStorage.getItem(key)).find(Boolean);
  let count = 0;
  try {
    const items = JSON.parse(raw || "[]");
    count = Array.isArray(items)
      ? items.reduce((total, item) => total + Number(item.quantity || 1), 0)
      : 0;
  } catch {
    count = 0;
  }
  $$("[data-cart-count]").forEach((element) => {
    element.textContent = count;
  });
}

setupPreloader();
setupVideo();
setupNavigation();
setupCursorAndMagnets();
setupLenis();
setupAnimations();
setupProgressAndAccordions();
setupNewsletter();
setupPageTransitions();
updateCartCount();
loadFeaturedProducts();
