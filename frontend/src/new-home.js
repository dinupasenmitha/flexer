import {
  mountCommerceShell,
  escapeHTML,
  formatLKR,
  normalizeImage,
} from "./commerce-shared.js";
import { loadPublishedContent } from "./published-content.js";
loadPublishedContent("review", document.querySelector("[data-review-list]"));
mountCommerceShell();
const host = document.querySelector("[data-home-products]");
async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error();
    }
    const products = await response.json();
    const featured = products.filter((p) => p.featured);
    const edit = (featured.length ? featured : products).slice(0, 4);
    host.innerHTML = edit.length
      ? edit
          .map(
            (p) =>
              '<a class="edit-card" href="/product/' +
              encodeURIComponent(p.slug || p.id) +
              '"><div class="edit-image"><img src="' +
              escapeHTML(normalizeImage(p.primary_image || p.images?.[0])) +
              '" alt="' +
              escapeHTML(p.name) +
              '" width="800" height="800" loading="lazy"><span aria-hidden="true">↗</span></div><p>' +
              escapeHTML(p.category) +
              "</p><h3>" +
              escapeHTML(p.name) +
              "</h3><strong>" +
              formatLKR(p.price) +
              "</strong></a>",
          )
          .join("")
      : '<p>The next collection is being prepared. <a href="/contact">Ask our team about available frames.</a></p>';
  } catch {
    host.innerHTML =
      '<p>We could not load the collection. <a href="/shop">Try the shop</a> or contact our team.</p>';
  }
}
loadProducts();
document
  .querySelector("[data-home-newsletter]")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = form.querySelector("[data-newsletter-message]");
    const button = form.querySelector("button");
    if (form.elements.website.value) {
      return;
    }
    button.disabled = true;
    message.textContent = "Adding you to the list…";
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.elements.email.value }),
      });
      if (!response.ok) {
        throw new Error();
      }
      form.reset();
      message.textContent = "You're on the list. See you in your inbox.";
    } catch {
      message.textContent = "We couldn't subscribe you. Please try again.";
    } finally {
      button.disabled = false;
    }
  });
