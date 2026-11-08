const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export function mountProductEditor(form, product, request) {
  const panel = document.createElement("fieldset");
  panel.innerHTML =
    '<legend>Photography, packaging & stock</legend><div class="admin-form__grid"><label>Brand<input name="brand" value="' +
    escape(product.brand || "FLEXER") +
    '"></label><label>Warranty months<input name="warranty_months" type="number" min="0" value="' +
    Number(product.warranty_months || 0) +
    '"></label><label class="full">Packaging (one inclusion per line)<textarea name="inclusions">' +
    escape((product.inclusions || []).join("\n")) +
    '</textarea></label><label class="full">Gallery (one image path per line, in display order)<textarea name="images">' +
    escape((product.images || []).join("\n")) +
    '</textarea></label><label class="full">Add product photo<input type="file" accept="image/jpeg,image/png,image/webp" data-photo></label></div><p role="status" data-photo-status></p><div data-variants></div><button class="admin-button" type="button" data-add-variant>Add colour</button>';
  form.insertBefore(panel, form.querySelector('button[type="submit"]'));
  const rows = panel.querySelector("[data-variants]");
  const addRow = (variant = {}) => {
    const row = document.createElement("div");
    row.className = "admin-variant-row";
    row.innerHTML =
      '<div class="admin-form__grid"><label>Colour name<input data-v-name required value="' +
      escape(variant.color_name || "") +
      '"></label><label>Variant SKU<input data-v-sku value="' +
      escape(variant.sku || "") +
      '"></label><label>Swatch<input type="color" data-v-hex value="' +
      escape(variant.color_hex || "#202020") +
      '"></label><label>Stock<input type="number" min="0" step="1" data-v-stock required value="' +
      Number(variant.stock_quantity || 0) +
      '"></label><label>Colour photo path<input data-v-image value="' +
      escape(variant.image || "") +
      '"></label><label class="admin-form__check"><input type="checkbox" data-v-available ' +
      (variant.is_available !== false ? "checked" : "") +
      '> Available for sale</label></div><button type="button" class="admin-link-button" data-remove-colour>Remove colour</button>';
    row
      .querySelector("[data-remove-colour]")
      .addEventListener("click", () => row.remove());
    rows.append(row);
  };
  (product.variants || []).forEach(addRow);
  panel
    .querySelector("[data-add-variant]")
    .addEventListener("click", () => addRow());
  panel
    .querySelector("[data-photo]")
    .addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      const message = panel.querySelector("[data-photo-status]");
      message.textContent = "Preparing photo…";
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      const url = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const scale = Math.min(
          1,
          1600 / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        canvas
          .getContext("2d")
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        const result = await request("/api/products/images", {
          method: "POST",
          body: JSON.stringify({ image: canvas.toDataURL("image/webp", 0.82) }),
        });
        const gallery = form.elements.images;
        gallery.value = [gallery.value.trim(), result.path]
          .filter(Boolean)
          .join("\n");
        form.elements.primary_image.value = result.path;
        message.textContent =
          "Photo uploaded and selected as the primary image. Save the product to apply.";
      } catch (error) {
        message.textContent =
          error.message || "This image could not be uploaded.";
      } finally {
        URL.revokeObjectURL(url);
        submit.disabled = false;
        event.target.value = "";
      }
    });
  return () => ({
    brand: form.elements.brand.value.trim(),
    warranty_months: Number(form.elements.warranty_months.value),
    inclusions: form.elements.inclusions.value
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean),
    images: form.elements.images.value
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean),
    variants: [...rows.children].map((row, index) => ({
      sku:
        row.querySelector("[data-v-sku]").value.trim() ||
        form.elements.sku.value + "-V" + (index + 1),
      color_name: row.querySelector("[data-v-name]").value.trim(),
      color_hex: row.querySelector("[data-v-hex]").value,
      stock_quantity: Number(row.querySelector("[data-v-stock]").value),
      image:
        row.querySelector("[data-v-image]").value.trim() ||
        form.elements.primary_image.value,
      is_available: row.querySelector("[data-v-available]").checked,
    })),
  });
}
