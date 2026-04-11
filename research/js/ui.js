
export function setupToast() {
  const el = document.getElementById("toast");
  if (!el) return;

  let t = null;

  window.__toast = (message, ms = 2500) => {
    clearTimeout(t);

    el.textContent = String(message || "");
    el.classList.remove("hidden");

    // restart animation if needed
    el.style.animation = "none";
    // force reflow
    void el.offsetHeight;
    el.style.animation = "";

    t = setTimeout(() => {
      el.classList.add("hidden");
      el.textContent = "";
    }, ms);
  };
  el.addEventListener("click", () => {
  el.classList.add("hidden");
  el.textContent = "";
});

}
