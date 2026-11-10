export function mountBrandChrome(root) {
  const bagTitle = root.querySelector(".drawer-head p");
  if (bagTitle) {
    bagTitle.innerHTML = '<a href="/cart">Your bag ↗</a>';
  }

  const navLinks = [
    { href: "/shop", label: "Shop all" },
    { href: "/budget", label: "Budget" },
    { href: "/premium", label: "Premium" },
    { href: "/branded", label: "Branded" },
    { href: "/about", label: "Our story" },
    { href: "/contact", label: "Contact" },
  ];

  const primaryNavHtml = navLinks
    .map(
      (link) =>
        `<a href="${link.href}" class="commerce-nav__link">${link.label}</a>`,
    )
    .join("");

  const headerHtml = `
    <div class="brand-announcement" data-announcement hidden></div>
    <header class="commerce-header">
      <div class="commerce-header__inner">
        <a class="brand-logo" href="/" aria-label="FLEXER home">
          <span class="brand-logo__text">FLEXER</span>
          <span class="brand-logo__tag">EYEWEAR</span>
        </a>

        <nav class="commerce-nav" aria-label="Primary">
          ${primaryNavHtml}
        </nav>

        <div class="commerce-header__actions">
          <a class="header-search" href="/shop?search=" aria-label="Search frames">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
          </a>

          <button class="commerce-bag" type="button" data-cart-open aria-label="Shopping bag">
            <svg class="bag-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span class="commerce-bag__count" data-cart-count>0</span>
          </button>

          <button class="commerce-menu-toggle" type="button" aria-expanded="false" aria-controls="commerce-mobile-nav" data-commerce-menu aria-label="Toggle navigation menu">
            <span class="menu-icon" aria-hidden="true">
              <span></span>
              <span></span>
            </span>
            <span class="menu-label">Menu</span>
          </button>
        </div>
      </div>

      <nav class="commerce-mobile-nav" id="commerce-mobile-nav" aria-label="Mobile" hidden>
        <div class="commerce-mobile-nav__group">
          <span class="commerce-mobile-nav__title">Collections</span>
          <a href="/shop" class="commerce-mobile-nav__link"><span>Shop all frames</span><span class="nav-arrow" aria-hidden="true">↗</span></a>
          <a href="/budget" class="commerce-mobile-nav__link"><span>Budget Edit</span><span class="nav-arrow" aria-hidden="true">↗</span></a>
          <a href="/premium" class="commerce-mobile-nav__link"><span>Premium Collection</span><span class="nav-arrow" aria-hidden="true">↗</span></a>
          <a href="/branded" class="commerce-mobile-nav__link"><span>Branded Line</span><span class="nav-arrow" aria-hidden="true">↗</span></a>
        </div>
        <div class="commerce-mobile-nav__group">
          <span class="commerce-mobile-nav__title">Company & Care</span>
          <a href="/about" class="commerce-mobile-nav__link"><span>Our story</span><span class="nav-arrow" aria-hidden="true">↗</span></a>
          <a href="/contact" class="commerce-mobile-nav__link"><span>Contact & support</span><span class="nav-arrow" aria-hidden="true">↗</span></a>
          <a href="/tracking" class="commerce-mobile-nav__link"><span>Track order</span><span class="nav-arrow" aria-hidden="true">↗</span></a>
        </div>
      </nav>
    </header>
  `.trim();

  const existingHeader = root.querySelector("header");
  if (existingHeader) {
    existingHeader.outerHTML = headerHtml;
  }

  // Active page link state
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  root
    .querySelectorAll(".commerce-nav a, .commerce-mobile-nav a")
    .forEach((link) => {
      const href =
        link.getAttribute("href")?.split("?")[0].replace(/\/$/, "") || "/";
      if (href === currentPath && currentPath !== "/") {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });

  // Close mobile nav when clicking outside
  document.addEventListener("click", (event) => {
    const mobNav = root.querySelector("#commerce-mobile-nav");
    const menuBtn = root.querySelector("[data-commerce-menu]");
    if (
      mobNav &&
      !mobNav.hidden &&
      !mobNav.contains(event.target) &&
      !menuBtn?.contains(event.target)
    ) {
      mobNav.hidden = true;
      menuBtn?.setAttribute("aria-expanded", "false");
    }
  });

  const footerLinks =
    '<a href="/shop">Shop all</a><a href="/budget">Budget</a><a href="/premium">Premium</a><a href="/branded">Branded</a>';

  if (!document.querySelector(".brand-footer")) {
    const footer = document.createElement("footer");
    footer.className = "brand-footer";
    footer.innerHTML =
      '<div class="footer-top"><div><a class="brand-logo" href="/"><span class="brand-logo__text">FLEXER</span></a><p>Don’t just wear, FLEX.<br>Eyewear for your own point of view.</p></div><div><h2>Find your frame</h2>' +
      footerLinks +
      '</div><div><h2>Here to help</h2><a href="/contact">Contact us</a><a href="/tracking">Track your order</a><a href="/faq">Questions & answers</a><a href="/shipping">Shipping</a><a href="/returns">Returns & exchanges</a><a href="/warranty">Warranty</a></div><div><h2>Stay connected</h2><a data-support href="https://wa.me/94775580968">WhatsApp</a><a href="https://www.tiktok.com/@flexer737" target="_blank" rel="noreferrer">TikTok ↗</a><a href="https://www.facebook.com/profile.php?id=61564498420449" target="_blank" rel="noreferrer">Facebook ↗</a><a href="/about">About FLEXER</a></div></div><div class="footer-base"><span>© ' +
      new Date().getFullYear() +
      ' FLEXER · Sri Lanka</span><span>Bank transfer / Cash on delivery / Koko*</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div><p class="payment-footnote">* Koko availability depends on merchant activation.</p>';
    document.body.append(footer);

    const support = document.createElement("a");
    support.className = "support-float";
    support.href = "https://wa.me/94775580968";
    support.dataset.support = "";
    support.textContent = "Need a hand? ↗";
    support.setAttribute("aria-label", "Contact FLEXER on WhatsApp");
    document.body.append(support);
  }

  fetch("/api/settings")
    .then((r) => r.json())
    .then((settings) => {
      const bar = root.querySelector("[data-announcement]");
      const legacyAnnouncement =
        "DROP 01 LIVE · UV400 PROTECTION ON ALL FRAMES · FREE ISLANDWIDE DELIVERY · BANK TRANSFER / COD / KOKO";
      if (
        bar &&
        settings.announcement_text &&
        settings.announcement_text !== legacyAnnouncement
      ) {
        bar.textContent = settings.announcement_text;
        bar.hidden = false;
      }
      const number = String(settings.whatsapp_number || "94775580968").replace(
        /\D/g,
        "",
      );
      document.querySelectorAll("[data-support]").forEach((a) => {
        a.href = "https://wa.me/" + number;
      });
      const community = document.querySelector("[data-community]");
      if (community) {
        community.href = "https://wa.me/" + number;
        if (
          /^https:\/\/(chat\.whatsapp\.com|www\.whatsapp\.com)\//.test(
            settings.whatsapp_community_url || "",
          )
        ) {
          community.href = settings.whatsapp_community_url;
          community.textContent = "Join the WhatsApp community ↗";
          const note = document.querySelector("[data-community-note]");
          if (note) {
            note.textContent =
              "Collection announcements, straight to your phone.";
          }
        }
      }
    })
    .catch(() => {});
}
