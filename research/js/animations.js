export function playPageEnterAnimation(el) {
  if (!el) return;
  el.classList.remove("page-enter");
  void el.offsetWidth;
  el.classList.add("page-enter");
}

export function initRevealAnimations() {
  const targets = document.querySelectorAll(
    ".card, .category-card, .result-card, .agap-card, .map-placeholder, .review-item, .chat-item"
  );
  targets.forEach(el => el.classList.add("reveal"));

  if (!("IntersectionObserver" in window)) {
    targets.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => io.observe(el));
}
export function initScrollReveal() {
  const items = document.querySelectorAll(
    "section, .card, .agap-card, .category-card, .result-card, .action-btn, .primary-btn"
  );

  items.forEach(el => el.classList.add("reveal"));

  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("show"));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach(el => observer.observe(el));
}
