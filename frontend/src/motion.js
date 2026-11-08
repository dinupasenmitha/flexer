import "./styles/motion.css";

// Motion is an enhancement: content is never hidden while waiting for JavaScript.
export function mountMotion() {
  if (document.documentElement.dataset.motionMounted) {
    return;
  }
  document.documentElement.dataset.motionMounted = "true";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 1001px) and (pointer: fine)");
  const ease = "cubic-bezier(.22,1,.36,1)";
  const animations = new Set();
  const seen = new WeakSet();
  const progress = document.createElement("div");
  progress.className = "reading-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);
  const animate = (el, frames, options) => {
    const animation = el.animate(frames, {
      duration: 850,
      easing: ease,
      ...options,
    });
    animations.add(animation);
    animation.finished
      .catch(() => {})
      .finally(() => animations.delete(animation));
  };
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) {
          return;
        }
        reveal.unobserve(target);
        if (!reduced.matches) {
          animate(
            target,
            [
              { opacity: 0, transform: "translateY(22px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {},
          );
        }
      });
    },
    { threshold: 0.08 },
  );
  const scan = () => {
    document
      .querySelectorAll(
        ".section-top, .range-card, .edit-card, .brand-copy, .care-grid article, .community-panel > div, .newsletter-section > div, .content-article, .catalogue-card",
      )
      .forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          reveal.observe(el);
        }
      });
  };
  const changes = new window.MutationObserver(scan);
  changes.observe(document.querySelector("main") || document.body, {
    childList: true,
    subtree: true,
  });
  scan();
  const campaign = document.querySelector(".campaign-image");
  let scheduled = false;
  const updateScroll = () => {
    scheduled = false;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, window.scrollY / distance) : 0})`;
    document
      .querySelector(".commerce-header")
      ?.classList.toggle("is-scrolled", window.scrollY > 24);
    if (campaign && desktop.matches && !reduced.matches) {
      const offset =
        Math.min(window.innerHeight, Math.max(0, window.scrollY)) * 0.07;
      campaign.style.setProperty("--film-offset", `${offset}px`);
    }
  };
  const scheduleScroll = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScroll);
    }
  };
  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll, { passive: true });
  updateScroll();

  const video = document.querySelector("[data-hero-film]");
  const toggle = document.querySelector("[data-film-toggle]");
  let userPaused = false;
  let visible = false;
  let failed = false;
  const saveData = Boolean(navigator.connection?.saveData);
  const updateVideo = () => {
    if (!video || failed) {
      return;
    }
    if (
      reduced.matches ||
      saveData ||
      !visible ||
      document.hidden ||
      userPaused
    ) {
      video.pause();
      return;
    }
    if (!video.getAttribute("src")) {
      video.src = video.dataset.src;
    }
    video.muted = true;
    video.play().catch(() => {
      if (toggle) {
        toggle.hidden = false;
        toggle.setAttribute("aria-label", "Play hero film");
      }
    });
  };
  const filmObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      updateVideo();
    },
    { threshold: 0.1 },
  );
  if (video) {
    filmObserver.observe(video);
    video.addEventListener("playing", () => {
      video.classList.add("is-playing");
      toggle.hidden = false;
      toggle.setAttribute("aria-label", "Pause hero film");
    });
    video.addEventListener("error", () => {
      failed = true;
      video.classList.remove("is-playing");
      toggle.hidden = true;
    });
    toggle.addEventListener("click", () => {
      userPaused = !video.paused;
      if (userPaused) {
        video.pause();
        toggle.setAttribute("aria-label", "Play hero film");
      } else {
        updateVideo();
      }
    });
  }
  const preferenceChange = () => {
    if (reduced.matches) {
      animations.forEach((animation) => animation.cancel());
      campaign?.style.removeProperty("--film-offset");
      video?.classList.remove("is-playing");
      if (toggle) {
        toggle.hidden = true;
      }
    }
    updateVideo();
  };
  reduced.addEventListener("change", preferenceChange);
  document.addEventListener("visibilitychange", updateVideo);
  window.addEventListener("pagehide", () => {
    video?.pause();
  });
  window.addEventListener("pageshow", updateVideo);
}
