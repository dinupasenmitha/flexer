export async function loadPublishedContent(kind, host) {
  if (!host) {
    return;
  }
  try {
    const response = await fetch("/api/content?kind=" + kind);
    if (!response.ok) {
      return;
    }
    const entries = await response.json();
    if (!entries.length) {
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const entry of entries) {
      const item = document.createElement(
        kind === "faq" ? "details" : "article",
      );
      item.className = kind === "faq" ? "" : "published-review";
      const title = document.createElement(kind === "faq" ? "summary" : "h3");
      title.textContent = entry.title;
      item.append(title);
      const body = document.createElement("p");
      body.textContent = entry.body;
      item.append(body);
      if (kind === "review") {
        const meta = document.createElement("small");
        meta.textContent =
          entry.rating +
          "/5" +
          (entry.product_name ? " · " + entry.product_name : "");
        item.append(meta);
      }
      fragment.append(item);
    }
    host.replaceChildren(fragment);
    document.querySelector("[data-home-reviews]")?.removeAttribute("hidden");
  } catch {
    /* Existing FAQ answers remain available when the service is offline. */
  }
}
