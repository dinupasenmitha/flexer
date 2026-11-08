export async function mountContentEditor(host, request) {
  const entries = await request("/api/content/admin");
  const section = document.createElement("section");
  section.className = "admin-card";
  section.style.marginTop = "24px";
  section.innerHTML =
    '<h2>FAQs & customer reviews</h2><p>Publish reviews only after verifying the feedback and permission to share it.</p><label>Choose an entry<select class="admin-control" data-entry><option value="">Create new</option></select></label><form class="admin-form" data-entry-form><label>Type<select name="kind"><option value="faq">FAQ</option><option value="review">Customer review</option></select></label><label>Question or customer name<input name="title" required maxlength="200"></label><label>Answer or review<textarea name="body" required maxlength="8000"></textarea></label><label>Product purchased (reviews)<input name="product_name" maxlength="200"></label><label>Rating (reviews)<input name="rating" type="number" min="1" max="5" value="5"></label><label class="admin-form__check"><input name="published" type="checkbox"> Approved for publication</label><button class="admin-button" type="submit">Save entry</button><p role="status" data-entry-status></p></form>';
  host.append(section);
  const select = section.querySelector("[data-entry]");
  const form = section.querySelector("form");
  for (const entry of entries) {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent =
      entry.kind + ": " + entry.title + (entry.published ? "" : " (draft)");
    select.append(option);
  }
  select.addEventListener("change", () => {
    const entry = entries.find((e) => String(e.id) === select.value);
    form.reset();
    if (entry) {
      for (const key of ["kind", "title", "body", "product_name", "rating"]) {
        form.elements[key].value = entry[key];
      }
      form.elements.published.checked = Boolean(entry.published);
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = section.querySelector("[data-entry-status]");
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const fields = Object.fromEntries(new FormData(form));
      fields.published = form.elements.published.checked;
      fields.rating = Number(fields.rating);
      await request("/api/content" + (select.value ? "/" + select.value : ""), {
        method: select.value ? "PUT" : "POST",
        body: JSON.stringify(fields),
      });
      section.remove();
      await mountContentEditor(host, request);
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
    }
  });
}
