// ============================================================
// FLEXER EYEWEAR — Main Script & Interactive Handlers
// White & Gold Luxury Theme — Enhanced Animations
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Utility: Throttle (trailing edge, returns rAF-aligned)
  // ----------------------------------------------------------
  function throttleRAF(fn) {
    let ticking = false;
    return function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn();
          ticking = false;
        });
      }
    };
  }

  // ----------------------------------------------------------
  // Utility: Debounce
  // ----------------------------------------------------------
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ----------------------------------------------------------
  // Scroll Reveal Observer (shared instance)
  // ----------------------------------------------------------
  let revealObserver = null;

  function createRevealObserver() {
    if (revealObserver) return revealObserver;

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            // Stagger delays via CSS custom property
            if (el.classList.contains('reveal-delay-1')) {
              el.style.transitionDelay = '0.15s';
            } else if (el.classList.contains('reveal-delay-2')) {
              el.style.transitionDelay = '0.3s';
            }
            el.classList.add('visible');
            revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    return revealObserver;
  }

  function observeRevealElements(root) {
    const observer = createRevealObserver();
    const scope = root || document;
    scope.querySelectorAll('.reveal').forEach((el) => {
      if (!el.classList.contains('visible')) {
        observer.observe(el);
      }
    });
  }

  // ----------------------------------------------------------
  // DOMContentLoaded — Master Init
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroll();
    initMobileMenu();
    initHeroVideo();
    loadFeaturedProducts();
    initFaqAccordion();
    initNewsletterForm();
    initContactForm();
    initScrollReveal();
    initMarqueeDuplication();
    initCounterAnimation();
    initHeroParallax();
    initMagneticButtons();
    initNavbarActiveLink();
    initKeyboardShortcuts();
  });

  // ==========================================================
  // 1. Navbar Scroll Effect
  // ==========================================================
  function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const announcementBar = document.querySelector('.announcement-bar');

    function onScroll() {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
        if (announcementBar) announcementBar.classList.add('hidden');
      } else {
        navbar.classList.remove('scrolled');
        if (announcementBar) announcementBar.classList.remove('hidden');
      }
    }

    window.addEventListener('scroll', throttleRAF(onScroll), { passive: true });
    // Run once on load in case page is already scrolled
    onScroll();
  }

  // ==========================================================
  // 2. Mobile Menu Drawer
  // ==========================================================
  function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const closeBtn = document.getElementById('mobile-drawer-close');

    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
      toggleBtn.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
      toggleBtn.classList.remove('open');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', () => {
      if (drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    // Escape key handled globally in initKeyboardShortcuts
    // Store reference for global keyboard handler
    window.__flexerCloseDrawer = closeDrawer;
  }

  // ==========================================================
  // 3. Hero Video with Fallback & Reduced Motion
  // ==========================================================
  function initHeroVideo() {
    const video = document.getElementById('hero-video');
    const staticFallback = document.getElementById('hero-static-fallback');
    if (!video) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      video.pause();
      video.style.display = 'none';
      if (staticFallback) staticFallback.style.display = 'block';
      return;
    }

    video.addEventListener('error', () => {
      console.warn('Hero video failed to load. Falling back to static image.');
      video.style.display = 'none';
      if (staticFallback) staticFallback.style.display = 'block';
    });

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log('Autoplay prevented or deferred:', err);
        video.style.display = 'none';
        if (staticFallback) staticFallback.style.display = 'block';
      });
    }
  }

  // ==========================================================
  // 4. Load Featured Products
  // ==========================================================
  async function loadFeaturedProducts() {
    const container = document.getElementById('bestsellers-grid');
    if (!container) return;

    try {
      const res = await fetch('/api/products?sort=featured');
      if (!res.ok) throw new Error('Failed to fetch products');
      const products = await res.json();

      if (!products.length) {
        container.innerHTML =
          '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted)">Products arriving soon.</p>';
        return;
      }

      const top = products.slice(0, 6);

      container.innerHTML = top
        .map((p) => {
          const img =
            p.primary_image || (p.images && p.images[0]) || '/favicon.png';
          const original = p.original_price
            ? `<span class="price-original">${FLEXER.formatLKR(p.original_price)}</span>`
            : '';
          const badge = p.badge
            ? `<span class="product-badge-pill">${p.badge}</span>`
            : '';
          const colors = p.colors || [];
          const productJSON = JSON.stringify(p).replace(/'/g, '&apos;').replace(/"/g, '&quot;');

          return `
          <article class="product-card reveal">
            <div class="product-media">
              <img src="${img}" alt="${p.name}" class="product-img" loading="lazy" />
              ${badge}
              <div class="product-card-actions">
                <button class="btn-card-action" onclick="FLEXER.openQuickView(${p.id})">Quick View</button>
                <button class="btn-card-action btn-card-add" onclick="window.__addFeaturedToCart(${p.id})">+ Add</button>
              </div>
            </div>
            <div class="product-info">
              <div class="product-category-row">
                <span class="product-tier-label">${(p.category || '').toUpperCase()} RANGE</span>
              </div>
              <h3 class="product-title"><a href="/product/${p.slug}">${p.name}</a></h3>
              <div class="product-price-row">
                <span class="price-current">${FLEXER.formatLKR(p.price)}</span>
                ${original}
              </div>
              ${
                colors.length
                  ? `<div class="product-colors-strip">${colors.map((c) => `<span class="color-swatch-dot" style="background:${c}"></span>`).join('')}</div>`
                  : ''
              }
            </div>
          </article>`;
        })
        .join('');

      // Observe newly rendered cards for scroll reveal
      observeRevealElements(container);
    } catch (err) {
      console.error('Failed to load featured products:', err);
      container.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted)">Unable to load products. Please refresh.</p>';
    }
  }

  // ==========================================================
  // 5. FAQ Accordion
  // ==========================================================
  function initFaqAccordion() {
    document.querySelectorAll('.faq-question').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const isActive = item.classList.contains('active');

        // Close all others (true accordion)
        document.querySelectorAll('.faq-item').forEach((i) =>
          i.classList.remove('active')
        );

        if (!isActive) {
          item.classList.add('active');
        }
      });
    });
  }

  // ==========================================================
  // 6. Newsletter Form
  // ==========================================================
  function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('newsletter-email');
      const email = input ? input.value.trim() : '';
      if (!email) return;

      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to subscribe');

        FLEXER.showToast('Subscribed! You will receive drop updates.', 'success');
        input.value = '';
      } catch (err) {
        FLEXER.showToast(err.message, 'error');
      }
    });
  }

  // ==========================================================
  // 7. Contact Form
  // ==========================================================
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameEl = document.getElementById('contact-name');
      const phoneEl = document.getElementById('contact-phone');
      const messageEl = document.getElementById('contact-message');

      const name = nameEl ? nameEl.value.trim() : '';
      const phone = phoneEl ? phoneEl.value.trim() : '';
      const message = messageEl ? messageEl.value.trim() : '';

      try {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, message }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send message');

        FLEXER.showToast('Message sent! We will reach out shortly.', 'success');
        form.reset();
      } catch (err) {
        FLEXER.showToast(err.message, 'error');
      }
    });
  }

  // ==========================================================
  // 8. Scroll Reveal Animation System
  // ==========================================================
  function initScrollReveal() {
    observeRevealElements(document);
  }

  // ==========================================================
  // 9. Marquee / Ticker Animation
  // ==========================================================
  function initMarqueeDuplication() {
    const tracks = document.querySelectorAll('.marquee-track');
    tracks.forEach((track) => {
      // Duplicate inner content for a seamless infinite loop
      const originalContent = track.innerHTML;
      track.innerHTML = originalContent + originalContent;
    });
  }

  // ==========================================================
  // 10. Counter Animation
  // ==========================================================
  function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter-animate');
    if (!counters.length) return;

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const rawText = el.textContent.trim();
    const target = parseInt(rawText.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target) || target <= 0) return;

    // Preserve suffix (e.g., "+", "K", "%")
    const suffix = rawText.replace(/[0-9,.\s]/g, '');

    const duration = 2000; // ms
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      el.textContent = current.toLocaleString('en-US') + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ==========================================================
  // 11. Smooth Parallax for Hero
  // ==========================================================
  function initHeroParallax() {
    const hero = document.getElementById('hero-video') || document.getElementById('hero-static-fallback');
    if (!hero) return;

    const isDesktop = window.matchMedia('(min-width: 769px)');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!isDesktop.matches || prefersReduced.matches) return;

    let isActive = true;

    // Listen for media query changes so we stop on resize to mobile
    isDesktop.addEventListener('change', (e) => {
      isActive = e.matches;
      if (!isActive) {
        hero.style.transform = '';
        hero.style.willChange = '';
      }
    });

    function onParallaxScroll() {
      if (!isActive) return;
      const scrollY = window.scrollY;
      // Only apply parallax while hero is in view
      const heroRect = hero.getBoundingClientRect();
      if (heroRect.bottom < 0) {
        hero.style.willChange = '';
        return;
      }
      hero.style.willChange = 'transform';
      hero.style.transform = `translateY(${scrollY * 0.25}px)`;
    }

    window.addEventListener('scroll', throttleRAF(onParallaxScroll), { passive: true });
  }

  // ==========================================================
  // 12. Magnetic Button Effect
  // ==========================================================
  function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-magnetic');
    if (!buttons.length) return;

    const MAX_SHIFT = 4; // px

    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Normalize offset to -1..1, then scale to MAX_SHIFT
        const dx = ((e.clientX - centerX) / (rect.width / 2)) * MAX_SHIFT;
        const dy = ((e.clientY - centerY) / (rect.height / 2)) * MAX_SHIFT;

        btn.style.willChange = 'transform';
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
        // Remove will-change after transition completes
        setTimeout(() => {
          btn.style.willChange = '';
        }, 300);
      });
    });
  }

  // ==========================================================
  // 13. Navbar Active Link Highlight
  // ==========================================================
  function initNavbarActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    if (!sections.length || !navLinks.length) return;

    // Build a map of sectionId -> navLink
    const linkMap = {};
    navLinks.forEach((link) => {
      const hash = link.getAttribute('href');
      if (hash && hash.startsWith('#')) {
        linkMap[hash.substring(1)] = link;
      }
    });

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = linkMap[entry.target.id];
          if (!link) return;

          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      if (linkMap[section.id]) {
        sectionObserver.observe(section);
      }
    });
  }

  // ==========================================================
  // 14. Global Keyboard Shortcuts
  // ==========================================================
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;

      // Close mobile drawer
      const drawer = document.getElementById('mobile-drawer');
      if (drawer && drawer.classList.contains('open')) {
        if (typeof window.__flexerCloseDrawer === 'function') {
          window.__flexerCloseDrawer();
        }
        return; // one close per Escape press
      }

      // Close cart drawer
      const cartDrawer = document.getElementById('cart-drawer');
      if (cartDrawer && cartDrawer.classList.contains('open')) {
        FLEXER.closeCartDrawer();
        return;
      }

      // Close quick view
      const qvModal = document.getElementById('quickview-modal-backdrop');
      if (qvModal && qvModal.classList.contains('open')) {
        FLEXER.closeQuickView();
        return;
      }
    });
  }
})();
