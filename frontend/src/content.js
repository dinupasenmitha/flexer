import {
  escapeHTML,
  mountCommerceShell,
  showToast,
} from "./commerce-shared.js";
import { loadPublishedContent } from "./published-content.js";

const pages = {
  about: {
    label: "Our story",
    title: "Your point of view. Your frame.",
    intro:
      "FLEXER was created with a simple vision: to redefine the way people experience eyewear. We believe a frame should represent personality, confidence and individuality.",
    sections: [
      [
        "A considered edit",
        "Our three ranges make it easier to find the right frame: practical everyday options, elevated premium pieces, and collector-led branded designs.",
      ],
      [
        "The details matter",
        "We carefully select our collections to bring together modern designs, quality-focused products and thoughtful presentation at different price points. See each product for its confirmed materials, lens specifications and packaging.",
      ],
      [
        "Here when you need us",
        "Talk to the FLEXER team on WhatsApp for help choosing a frame, understanding an order, or hearing about the next drop.",
      ],
    ],
  },
  contact: {
    label: "Contact & support",
    title: "A real conversation starts here.",
    intro:
      "For frame advice, order support, or an update on a drop, send the FLEXER team a message. Leave your name and WhatsApp number so we can get back to you.",
    contact: true,
  },
  shipping: {
    label: "Shipping",
    title: "Delivery, without the guesswork.",
    intro:
      "Delivery fees and delivery timing are confirmed during checkout. Your order reference is created before the WhatsApp handover so the FLEXER team can follow up clearly.",
    sections: [
      [
        "Before checkout",
        "Please confirm the delivery address, city, district and phone number. Any delivery fee shown at checkout comes from the store settings.",
      ],
      [
        "After ordering",
        "Keep your order reference. It is included in your WhatsApp message and is the fastest way for the team to locate your order.",
      ],
    ],
  },
  returns: {
    label: "Returns & exchanges",
    title: "Support when a frame is not quite right.",
    intro:
      "The final returns and exchange policy must be confirmed by FLEXER before public launch. Until then, contact the team with your order reference for case-by-case help.",
    sections: [
      [
        "Need assistance?",
        "Message the team on WhatsApp with your order reference, the frame name, and a short description of what you need help with.",
      ],
    ],
  },
  warranty: {
    label: "Warranty",
    title: "Care beyond the purchase.",
    intro:
      "Warranty coverage differs by product and supplier. The approved warranty terms are awaiting publication; please contact FLEXER with your frame and order reference for guidance.",
    sections: [
      [
        "Care first",
        "Keep your frame in its case, clean lenses with a suitable microfibre cloth, and avoid excessive heat. For a concern, contact support before attempting a repair.",
      ],
    ],
  },
  privacy: {
    label: "Privacy",
    title: "Your information, handled with care.",
    intro:
      "FLEXER uses the details you provide to fulfil an order, reply to a support request, and send newsletter updates only when you choose to subscribe.",
    sections: [
      [
        "Payment slips",
        "Bank-transfer slips are never uploaded to or stored by this site. If needed, they are shared directly with FLEXER on WhatsApp.",
      ],
      [
        "Your choices",
        "Contact the FLEXER team if you need help with your personal information or want to unsubscribe from drop announcements.",
      ],
    ],
  },
  terms: {
    label: "Terms",
    title: "Clear terms make a better purchase.",
    intro:
      "Store terms covering sales, delivery, returns, warranty, and product availability require final business approval before the production launch.",
    sections: [
      [
        "While terms are finalised",
        "Prices and availability are confirmed by the server at checkout. A submitted order receives a unique reference and remains pending until FLEXER confirms it.",
      ],
      [
        "Need clarity?",
        "Ask the team before placing an order if a product, payment method, or delivery detail is important to your decision.",
      ],
    ],
  },
  faq: {
    label: "FAQ",
    title: "The essentials, answered.",
    intro:
      "For anything not covered here, the FLEXER team is available on WhatsApp.",
    faq: [
      [
        "How do I place an order?",
        "Add frames to your bag, complete checkout, choose Bank Transfer, Cash on Delivery, or Koko when it is available, then continue to WhatsApp with your order reference.",
      ],
      [
        "When is my order confirmed?",
        "Orders begin as pending. FLEXER confirms the next steps after receiving your order details.",
      ],
      [
        "Do you store bank payment slips?",
        "No. Payment slips are never uploaded to or stored by this website; they are shared directly with the business on WhatsApp.",
      ],
      [
        "Can I ask for frame advice?",
        "Yes. Send the team a WhatsApp message with the styles you are considering and any fit or prescription-related questions.",
      ],
      [
        "How do I hear about drops?",
        "Join the official WhatsApp community when the store link is published, or subscribe to the newsletter for announcements.",
      ],
    ],
  },
  testimonials: {
    label: "Testimonials",
    title: "From the people who wear FLEXER.",
    intro:
      "Customer experiences, shared with permission. We'd love to hear how you wear your frame.",
    sections: [
      [
        "Want to share your experience?",
        "Send the team a message with your order reference and permission level for any feedback you would like FLEXER to consider publishing.",
      ],
    ],
  },
  newsletter: {
    label: "Drop announcements",
    title: "Be first to see what lands next.",
    intro:
      "Subscribe for FLEXER drop announcements. You can unsubscribe any time by contacting the team.",
    newsletter: true,
  },
};

const key = location.pathname.split("/").filter(Boolean).pop() || "about";
const page = pages[key] || pages.about;
const title = `${page.label} — FLEXER`;

function setMetadata() {
  document.title = title;
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", page.intro);
  const canonical = document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = `${location.origin}${location.pathname}`;
  document.head.append(canonical);
}

function contentNav() {
  return Object.entries(pages)
    .map(
      ([slug, item]) =>
        `<a href="/${slug}"${slug === key ? ' aria-current="page"' : ""}>${escapeHTML(item.label)}</a>`,
    )
    .join("");
}

function renderSections(sections = []) {
  return sections
    .map(
      ([heading, copy]) =>
        `<section><h2>${escapeHTML(heading)}</h2><p>${escapeHTML(copy)}</p></section>`,
    )
    .join("");
}

function renderFAQ(items) {
  return `<div class="content-accordion">${items.map(([question, answer]) => `<details><summary>${escapeHTML(question)}<span aria-hidden="true">+</span></summary><p>${escapeHTML(answer)}</p></details>`).join("")}</div>`;
}

function renderContact() {
  return `<section class="contact-panel"><p class="eyebrow">Send a note</p><form data-contact-form novalidate><div class="form-grid"><label>Name<input name="name" required autocomplete="name"></label><label>Phone / WhatsApp<input name="phone" required autocomplete="tel" inputmode="tel"></label><label class="form-span">How can we help?<textarea name="message" required rows="5"></textarea></label></div><button class="button button--dark" type="submit"><span>Send message</span><i aria-hidden="true">↗</i></button><p class="form-status" data-contact-status aria-live="polite"></p></form><p class="contact-direct">Prefer WhatsApp? <a data-whatsapp-link href="#">Message FLEXER directly</a>.</p></section>`;
}

function renderNewsletter() {
  return `<section class="newsletter-panel"><p class="eyebrow">The FLEXER list</p><form data-newsletter-form novalidate><label for="newsletter-email">Email address</label><div><input id="newsletter-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"><button class="button button--dark" type="submit"><span>Subscribe</span><i aria-hidden="true">↗</i></button></div><p class="form-status" data-newsletter-status aria-live="polite"></p></form></section>`;
}

function render() {
  document.querySelector("[data-content-page]").innerHTML =
    `<aside class="content-nav"><p class="eyebrow">FLEXER information</p><nav aria-label="Information pages">${contentNav()}</nav></aside><article class="content-article"><p class="eyebrow">${escapeHTML(page.label)}</p><h1>${escapeHTML(page.title)}</h1><p class="content-intro">${escapeHTML(page.intro)}</p>${renderSections(page.sections)}${page.faq ? renderFAQ(page.faq) : ""}${page.contact ? renderContact() : ""}${page.newsletter ? renderNewsletter() : ""}</article>`;
}

async function loadStoreSettings() {
  try {
    const response = await fetch("/api/settings");
    const settings = await response.json();
    const number = String(settings.whatsapp_number || "94775580968").replace(
      /\D/g,
      "",
    );
    const message = encodeURIComponent("Hello FLEXER, I need some assistance.");
    document
      .querySelector("[data-whatsapp-link]")
      ?.setAttribute("href", `https://wa.me/${number}?text=${message}`);
  } catch {
    // The form is still usable if store settings are temporarily unavailable.
  }
}

function bindForms() {
  document
    .querySelector("[data-contact-form]")
    ?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const status = form.querySelector("[data-contact-status]");
      if (!form.reportValidity()) {
        return;
      }
      const submit = form.querySelector("button[type=submit]");
      submit.disabled = true;
      status.textContent = "Sending…";
      try {
        const response = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error);
        }
        form.reset();
        status.textContent = "Thank you — FLEXER will be in touch.";
        showToast("Your message has been sent.", "success");
      } catch (error) {
        status.textContent = error.message || "We could not send that message.";
      } finally {
        submit.disabled = false;
      }
    });
  document
    .querySelector("[data-newsletter-form]")
    ?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const status = form.querySelector("[data-newsletter-status]");
      if (!form.reportValidity()) {
        return;
      }
      const submit = form.querySelector("button[type=submit]");
      submit.disabled = true;
      status.textContent = "Subscribing…";
      try {
        const response = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error);
        }
        form.reset();
        status.textContent = "You are on the list.";
        showToast("You are subscribed to FLEXER drops.", "success");
      } catch (error) {
        status.textContent =
          error.message || "We could not subscribe that email.";
      } finally {
        submit.disabled = false;
      }
    });
}

setMetadata();
mountCommerceShell();
render();
if (key === "faq") {
  loadPublishedContent("faq", document.querySelector(".content-accordion"));
}
if (key === "testimonials") {
  const reviews = document.createElement("div");
  reviews.className = "review-grid";
  document.querySelector(".content-article").append(reviews);
  loadPublishedContent("review", reviews);
}
loadStoreSettings();
bindForms();
