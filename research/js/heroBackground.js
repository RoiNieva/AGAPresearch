export function initSiteBackground() {
  // Load-in animation trigger
  requestAnimationFrame(() => {
    document.body.classList.add("loaded");
  });

  const bg = document.getElementById("site-bg");
  if (!bg) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const y = window.scrollY || 0;

      // subtle parallax values
      const translateY = y * 0.08;     // 8% of scroll
      const rotate = y * 0.0004;       // tiny rotation
      bg.style.transform = `translate3d(0, ${translateY}px, 0) rotate(${rotate}deg)`;

      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
