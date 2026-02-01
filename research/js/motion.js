

export function initPageLoadMotion() {
  requestAnimationFrame(() => {
    document.body.classList.add("page-loaded");
  });
}

/**
 * Adds reveal animations to the whole site.
 * Call this on initial load + after you change pages.
 */
export function initScrollRevealMotion(root = document) {
  const targets = root.querySelectorAll(
    [
      "section",
      ".card",
      ".agap-card",
      ".category-card",
      ".result-card",
      ".action-btn",
      ".primary-btn",
      ".secondary-btn",
      ".tab-btn",
      ".chat-item",
      ".review-item",
      ".map-canvas"
    ].join(",")
  );

  targets.forEach((el) => {
    // Don’t double-add
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
  });

  // If IntersectionObserver not available, just show
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("show"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => io.observe(el));
}


export function applyStagger(container, stepMs = 55) {
  if (!container) return;
  const kids = Array.from(container.children || []);
  kids.forEach((el, idx) => {
    el.setAttribute("data-stagger", "1");
    el.style.setProperty("--stagger-delay", `${idx * stepMs}ms`);
    el.classList.add("reveal");
  });
}

/**
 * Page enter animation for showOnly()
 */
export function animatePageEnter(el) {
  if (!el) return;
  el.classList.remove("page-enter");
  // force reflow to restart animation
  void el.offsetWidth;
  el.classList.add("page-enter");

  // Also attach reveals inside the page so content animates
  initScrollRevealMotion(el);
}
