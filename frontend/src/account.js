import {
  mountCommerceShell,
  getCart,
  updateCartItem,
  cartSubtotal,
  escapeHTML,
  formatLKR,
  normalizeImage,
} from "./commerce-shared.js";
mountCommerceShell();
const main = document.querySelector("[data-account-page]");
function renderBag() {
  const items = getCart();
  document.title = "Your bag — FLEXER";
  main.className = "shell section bag-page";
  main.innerHTML =
    '<p class="kicker">Your selection</p><h1>Your bag</h1>' +
    (items.length
      ? items
          .map(
            (p, i) =>
              '<article class="checkout-item"><img src="' +
              escapeHTML(normalizeImage(p.image)) +
              '" alt="' +
              escapeHTML(p.name) +
              '" width="72" height="72"><div><h3>' +
              escapeHTML(p.name) +
              "</h3><p>" +
              escapeHTML(p.color_name) +
              '</p><label>Quantity <input type="number" min="1" max="20" value="' +
              Number(p.qty) +
              '" data-quantity="' +
              i +
              '" aria-label="Quantity for ' +
              escapeHTML(p.name) +
              '"></label><button data-remove="' +
              i +
              '">Remove</button></div><strong>' +
              formatLKR(p.price * p.qty) +
              "</strong></article>",
          )
          .join("") +
        '<p class="bag-total">Subtotal ' +
        formatLKR(cartSubtotal()) +
        '</p><p>Delivery is calculated at checkout. Prices and availability are confirmed when you place your order.</p><a class="new-button" href="/checkout">Continue to checkout ↗</a>'
      : '<p>Your bag is waiting for its first frame.</p><a class="new-button" href="/shop">Explore the collection ↗</a>');
  main
    .querySelectorAll("[data-remove]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        updateCartItem(Number(b.dataset.remove), 0),
      ),
    );
  main
    .querySelectorAll("[data-quantity]")
    .forEach((b) =>
      b.addEventListener("change", () =>
        updateCartItem(
          Number(b.dataset.quantity),
          Math.max(1, Math.min(20, Number(b.value) || 1)),
        ),
      ),
    );
}
if (location.pathname === "/cart") {
  renderBag();
  window.addEventListener("flexer:cart-updated", renderBag);
} else {
  document.title = "Track your order — FLEXER";
  main.innerHTML =
    '<section class="tracking-card"><p class="kicker">From us to you</p><h1>Track your order</h1><p>Use your order reference and the phone number you entered at checkout.</p><form data-track><label>Order reference<input name="order_ref" required placeholder="FLX-…" autocomplete="off"></label><label>Phone number<input name="phone" type="tel" required autocomplete="tel"></label><button class="new-button" type="submit">Find my order ↗</button></form><div role="status" data-track-result></div></section>';
  main.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const result = main.querySelector("[data-track-result]");
    const button = form.querySelector("button");
    button.disabled = true;
    result.textContent = "Finding your order…";
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      result.className = "tracking-result";
      result.innerHTML =
        "<strong>" +
        escapeHTML(data.order_ref) +
        "</strong><p>Order: " +
        escapeHTML(data.order_status.replaceAll("_", " ")) +
        "</p><p>Payment: " +
        escapeHTML(data.payment_status.replaceAll("_", " ")) +
        '</p><a href="/contact">Need help with this order?</a>';
    } catch (error) {
      result.textContent =
        error.message || "We couldn't look up your order. Please try again.";
    } finally {
      button.disabled = false;
    }
  });
}
