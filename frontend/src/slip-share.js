// File objects remain in memory in this page. No upload, storage or telemetry.
export function mountSlipShare(host, order, whatsappLink) {
  const section = document.createElement("section");
  section.className = "payment-notice";
  section.innerHTML =
    '<h3>Share your payment slip</h3><p>Your file stays on this device. Choose WhatsApp in the share sheet, or attach the slip manually in the conversation.</p><label>Choose a slip (image or PDF)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" data-local-slip></label><button class="new-button" type="button" data-share-slip>Send payment slip via WhatsApp</button><button class="quiet-link" type="button" data-copy-order>Copy order message</button><p role="status" data-share-status></p>';
  host.append(section);
  const input = section.querySelector("input");
  const status = section.querySelector("[data-share-status]");
  const text =
    new URL(whatsappLink).searchParams.get("text") ||
    "FLEXER order " + order.order_ref;
  section
    .querySelector("[data-copy-order]")
    .addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "Order message copied.";
      } catch {
        status.textContent = text;
      }
    });
  section
    .querySelector("[data-share-slip]")
    .addEventListener("click", async () => {
      const file = input.files?.[0];
      if (!file) {
        status.textContent = "Choose your payment slip first.";
        input.focus();
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        status.textContent = "Choose a file smaller than 15 MB.";
        return;
      }
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "FLEXER " + order.order_ref,
            text,
          });
          status.textContent =
            "Sharing finished. FLEXER will verify the transfer; your payment is not marked paid yet.";
        } catch (error) {
          status.textContent =
            error.name === "AbortError"
              ? "Sharing cancelled. Your file is still available here."
              : "Sharing is unavailable. Open WhatsApp below and attach the slip manually.";
        }
      } else {
        status.textContent =
          "Attach your selected slip manually in WhatsApp. Your order details are already in the message. Keep this page open to copy them again.";
        window.open(whatsappLink, "_blank", "noopener,noreferrer");
      }
    });
}
